import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Tv,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Radio,
  CheckCheck,
  AlertTriangle,
  Layout,
  RefreshCw,
  Loader2,
  Zap,
  Globe,
} from 'lucide-react';
import { AppState, LiveState, TimerState, LibraryItem } from '../types';
import {
  BIBLE_BOOKS,
  BibleBook,
  getBibleSuggestions,
  findBestBookMatch,
  BibleSuggestion,
} from '../data/bibleBooks';

interface OnlineScriptureVerse {
  verse: number;
  text: string;
}

interface OnlineScriptureResult {
  reference: string;
  version: string;
  versionName: string;
  verses: OnlineScriptureVerse[];
  plainContent: string;
  totalVerses: number;
  source?: 'local' | 'online' | 'offline-fail';
}

const AVAILABLE_BIBLE_VERSIONS = [
  { id: 'KJV', name: 'King James Version', category: 'Classic' },
  { id: 'NKJV', name: 'New King James Version', category: 'Modern' },
  { id: 'NIV', name: 'New International Version', category: 'Modern' },
  { id: 'ESV', name: 'English Standard Version', category: 'Modern' },
  { id: 'NLT', name: 'New Living Translation', category: 'Modern' },
  { id: 'NASB', name: 'New American Standard', category: 'Modern' },
  { id: 'AMP', name: 'Amplified Bible', category: 'Study' },
  { id: 'CSB', name: 'Christian Standard Bible', category: 'Modern' },
  { id: 'WEB', name: 'World English Bible', category: 'Public' },
  { id: 'MSG', name: 'The Message', category: 'Paraphrase' },
  { id: 'BSB', name: 'Berean Standard Bible', category: 'Study' },
  { id: 'TLV', name: 'Tree of Life Version', category: 'Messianic' },
];

const POPULAR_SCRIPTURES = [
  { label: 'John 3:16', query: 'John 3:16' },
  { label: 'Psalm 23', query: 'Psalm 23' },
  { label: 'Romans 8:28', query: 'Romans 8:28' },
  { label: 'Philippians 4:6', query: 'Philippians 4:6' },
  { label: '1 Cor 13:4', query: '1 Cor 13:4' },
  { label: 'Isaiah 40:31', query: 'Isaiah 40:31' },
  { label: 'Proverbs 3:5', query: 'Proverbs 3:5' },
  { label: 'Matthew 28:19', query: 'Matthew 28:19' },
  { label: 'Hebrews 11:1', query: 'Hebrews 11:1' },
  { label: 'Jeremiah 29:11', query: 'Jeremiah 29:11' },
];

const TIMER_PRESETS = [
  { label: '1m', sec: 60 },
  { label: '3m', sec: 180 },
  { label: '5m', sec: 300 },
  { label: '10m', sec: 600 },
  { label: '15m', sec: 900 },
  { label: '20m', sec: 1200 },
  { label: '30m', sec: 1800 },
  { label: '45m', sec: 2700 },
  { label: '60m', sec: 3600 },
];

interface V2PresenterProps {
  state: AppState;
  sessionId: string;
  isConnected: boolean;
  onSetLines: (title: string, subtitle: string, lines: string[], category?: AppState['category']) => void;
  onJumpTo: (index: number) => void;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onStartTimer: (durationSec?: number, title?: string) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  adjustTimer: (deltaSec: number) => void;
  setTimerConfig: (config: Partial<TimerState>) => void;
  setTimerPrompt: (message: string | null, visible: boolean) => void;
  onSaveLibraryItem?: (item: LibraryItem) => void;
  onAddToSchedule?: (item: LibraryItem) => void;
}

export const V2Presenter: React.FC<V2PresenterProps> = ({
  state,
  sessionId,
  isConnected,
  onSetLines,
  onJumpTo,
  onUpdateLiveState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  adjustTimer,
  setTimerConfig,
  setTimerPrompt,
}) => {
  // -------------------------------------------------------------
  // Top Scripture Search State
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('John 3:16');
  const [selectedVersion, setSelectedVersion] = useState('NIV');
  const [splitMode, setSplitMode] = useState<'verse' | 'double' | 'full'>('verse');
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scriptureResult, setScriptureResult] = useState<OnlineScriptureResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------
  // EasyWorship 3-Panel State: Books | Chapters | Verses
  // -------------------------------------------------------------
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [bookSearchText, setBookSearchText] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find((b) => b.name === 'John') || BIBLE_BOOKS[42]
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(16);

  // -------------------------------------------------------------
  // Countdown Timer State
  // -------------------------------------------------------------
  const [customTimerMinutes, setCustomTimerMinutes] = useState('15');
  const [customTimerSeconds, setCustomTimerSeconds] = useState('00');
  const [timerTitleInput, setTimerTitleInput] = useState(state.timerState.title || 'Sermon Countdown');
  const [quickAlertInput, setQuickAlertInput] = useState('');
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Visual feedback
  const [liveFeedback, setLiveFeedback] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node) &&
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Compute suggestions as user types
  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!searchQuery.trim() || !showSuggestions) return [];
    return getBibleSuggestions(searchQuery, selectedVersion);
  }, [searchQuery, showSuggestions, selectedVersion]);

  // Keep ticking for timer countdown calculation
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  // Compute live remaining timer seconds
  let currentTimerSec = state.timerState.remainingSec;
  if (state.timerState.status === 'running' && state.timerState.targetEndTime) {
    currentTimerSec = Math.floor((state.timerState.targetEndTime - now) / 1000);
  }
  const isOvertime = currentTimerSec < 0;
  const isWarning = currentTimerSec <= state.timerState.warningThresholdSec && !isOvertime;
  const isCritical = currentTimerSec <= state.timerState.criticalThresholdSec && !isOvertime;

  const absSec = Math.abs(currentTimerSec);
  const timerHours = Math.floor(absSec / 3600);
  const timerMins = Math.floor((absSec % 3600) / 60);
  const timerSecs = absSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCountdown =
    timerHours > 0
      ? `${isOvertime ? '-' : ''}${pad(timerHours)}:${pad(timerMins)}:${pad(timerSecs)}`
      : `${isOvertime ? '-' : ''}${pad(timerMins)}:${pad(timerSecs)}`;

  // Filter books for Column 1
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((book) => {
      if (testamentFilter === 'OT' && book.testament !== 'OT') return false;
      if (testamentFilter === 'NT' && book.testament !== 'NT') return false;
      if (bookSearchText.trim()) {
        const query = bookSearchText.toLowerCase().trim();
        const matchesName = book.name.toLowerCase().includes(query);
        const matchesAlias = book.aliases.some((a) => a.toLowerCase().includes(query));
        return matchesName || matchesAlias;
      }
      return true;
    });
  }, [testamentFilter, bookSearchText]);

  // Helper to set query and focus cursor at end
  const updateQueryAndFocusEnd = (newVal: string) => {
    setSearchQuery(newVal);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        const len = newVal.length;
        searchInputRef.current.setSelectionRange(len, len);
      }
    }, 0);
  };

  // Helper to check if query has chapter number
  const hasChapterNumber = (q: string): boolean => {
    const trimmed = q.trim();
    if (!trimmed) return false;
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map((v) => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join('|')})[\\)\\s]*$`, 'i');
    const cleaned = trimmed.replace(versionRegex, '').trim();
    const strippedLeadingNum = cleaned.replace(/^[1-3]\s*[a-zA-Z]+/i, '');
    return /\d+/.test(strippedLeadingNum);
  };

  // Format slides from result
  const formatSlidesFromData = (
    res: OnlineScriptureResult,
    mode: 'verse' | 'double' | 'full',
    withRef: boolean
  ): string[] => {
    if (!res.verses || res.verses.length === 0) return [];

    const bookChapterMatch = res.reference.match(/^([\d\s]*[A-Za-z\s]+?\s*\d+)/);
    const baseBookChapter = bookChapterMatch ? bookChapterMatch[1].trim() : res.reference;

    if (mode === 'full') {
      const refHeader = `${res.reference} (${res.version})`;
      const text = res.verses.map((v) => `${v.verse} ${v.text}`).join('\n\n');
      return [withRef ? `${text}\n\n${refHeader}` : text];
    }

    if (mode === 'double') {
      const slides: string[] = [];
      for (let i = 0; i < res.verses.length; i += 2) {
        const pair = res.verses.slice(i, i + 2);
        const pairRef =
          pair.length === 1
            ? `${baseBookChapter}:${pair[0].verse} (${res.version})`
            : `${baseBookChapter}:${pair[0].verse}-${pair[1].verse} (${res.version})`;
        const text = pair.map((v) => `${v.verse} ${v.text}`).join('\n\n');
        slides.push(withRef ? `${text}\n\n${pairRef}` : text);
      }
      return slides;
    }

    // Default 'verse': Exactly 1 verse per slide
    return res.verses.map((v) => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, '').trim();
      const verseRef =
        res.verses.length === 1
          ? `${res.reference} (${res.version})`
          : `${baseBookChapter}:${v.verse} (${res.version})`;
      return withRef ? `${cleanVerse}\n\n${verseRef}` : cleanVerse;
    });
  };

  // Generated slides for the current result
  const generatedSlides = useMemo(() => {
    if (!scriptureResult) return [];
    return formatSlidesFromData(scriptureResult, splitMode, includeReferenceOnSlide);
  }, [scriptureResult, splitMode, includeReferenceOnSlide]);

  // Fetch scripture from API
  const fetchScripture = async (
    queryStr: string,
    version: string,
    autoGoLive = false,
    focusVerseNum: number | null = null
  ) => {
    let raw = queryStr.trim();
    setShowSuggestions(false);
    if (!raw) return;

    // Normalize spaced verse: e.g. "John 3 16" -> "John 3:16"
    raw = raw.replace(/^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)(.*)$/, '$1 $2:$3$4');

    // Auto expand abbreviated book name if needed
    const refParts = raw.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+.*)$/);
    if (refParts) {
      const bookPart = refParts[1].trim();
      const restPart = refParts[2].trim();
      const matchedBook = findBestBookMatch(bookPart);
      if (matchedBook && matchedBook.name.toLowerCase() !== bookPart.toLowerCase()) {
        raw = `${matchedBook.name} ${restPart}`;
        setSearchQuery(raw);
      }
    }

    if (!hasChapterNumber(raw)) {
      setSearchError(`Please include a chapter number (e.g. "${raw} 1" or "${raw} 3:16").`);
      setShowSuggestions(true);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(raw)}&version=${encodeURIComponent(version)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setSearchError(data.error);
        setScriptureResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setScriptureResult(data);
        setSearchError(null);

        // Calculate target slide index if focusing on a verse
        let targetSlideIdx = 0;
        if (focusVerseNum !== null) {
          const vIdx = data.verses.findIndex((v: OnlineScriptureVerse) => v.verse === focusVerseNum);
          if (vIdx !== -1) {
            targetSlideIdx = splitMode === 'double' ? Math.floor(vIdx / 2) : vIdx;
          }
        }
        setSelectedSlideIndex(targetSlideIdx);

        if (autoGoLive) {
          const slides = formatSlidesFromData(data, splitMode, includeReferenceOnSlide);
          if (slides.length > 0) {
            onSetLines(data.reference, data.versionName || data.version, slides, 'scripture');
            onJumpTo(targetSlideIdx);
            setLiveFeedback(true);
            setTimeout(() => setLiveFeedback(false), 2000);
          }
        }
      } else {
        setSearchError(`No verses found for "${raw}" in ${version}.`);
        setScriptureResult(null);
      }
    } catch (err: any) {
      setSearchError(`Failed to fetch scripture: ${err?.message || 'Network error'}`);
      setScriptureResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchScripture('John 3:16', selectedVersion, false, 16);
  }, []);

  // Handle suggestion click / selection
  const handleSelectSuggestion = (sug: BibleSuggestion) => {
    if (sug.type === 'book') {
      updateQueryAndFocusEnd(`${sug.text} `);
    } else if (sug.type === 'chapter') {
      updateQueryAndFocusEnd(`${sug.text}:`);
    } else if (sug.type === 'verse' || sug.type === 'version') {
      setSearchQuery(sug.text);
      setShowSuggestions(false);
      fetchScripture(sug.text, selectedVersion, true);
    } else {
      updateQueryAndFocusEnd(sug.text);
    }
  };

  // When book is clicked in EasyWorship Column 1
  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setSelectedVerseNumber(null);
    const newRef = `${book.name} 1`;
    setSearchQuery(newRef);
    fetchScripture(newRef, selectedVersion, false);
  };

  // When chapter is clicked in EasyWorship Column 2
  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerseNumber(null);
    const newRef = `${selectedBook.name} ${ch}`;
    setSearchQuery(newRef);
    fetchScripture(newRef, selectedVersion, false);
  };

  // When verse is clicked in EasyWorship Column 3
  const handleSelectVerse = (verseNum: number | null) => {
    setSelectedVerseNumber(verseNum);
    if (verseNum === null) {
      // All verses
      const chRef = `${selectedBook.name} ${selectedChapter}`;
      setSearchQuery(chRef);
      fetchScripture(chRef, selectedVersion, true);
    } else {
      const vRef = `${selectedBook.name} ${selectedChapter}:${verseNum}`;
      setSearchQuery(vRef);
      if (
        scriptureResult &&
        scriptureResult.reference.toLowerCase().startsWith(`${selectedBook.name.toLowerCase()} ${selectedChapter}`)
      ) {
        const vIdx = scriptureResult.verses.findIndex((v) => v.verse === verseNum);
        if (vIdx !== -1) {
          const sIdx = splitMode === 'double' ? Math.floor(vIdx / 2) : vIdx;
          setSelectedSlideIndex(sIdx);
          const slides = formatSlidesFromData(scriptureResult, splitMode, includeReferenceOnSlide);
          onSetLines(
            `${selectedBook.name} ${selectedChapter}:${verseNum}`,
            scriptureResult.version,
            slides,
            'scripture'
          );
          onJumpTo(sIdx);
          setLiveFeedback(true);
          setTimeout(() => setLiveFeedback(false), 2000);
          return;
        }
      }
      fetchScripture(vRef, selectedVersion, true, verseNum);
    }
  };

  // Go Live with current slides
  const handleGoLive = (slideIdx = selectedSlideIndex) => {
    if (!scriptureResult || generatedSlides.length === 0) return;
    onSetLines(
      scriptureResult.reference,
      scriptureResult.versionName || scriptureResult.version,
      generatedSlides,
      'scripture'
    );
    onJumpTo(slideIdx);
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
  };

  // Slide transport navigation
  const handleNextSlide = () => {
    if (selectedSlideIndex < generatedSlides.length - 1) {
      const nextIdx = selectedSlideIndex + 1;
      setSelectedSlideIndex(nextIdx);
      onJumpTo(nextIdx);
    }
  };

  const handlePrevSlide = () => {
    if (selectedSlideIndex > 0) {
      const prevIdx = selectedSlideIndex - 1;
      setSelectedSlideIndex(prevIdx);
      onJumpTo(prevIdx);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === 'Enter' || e.key === 'F5') {
        e.preventDefault();
        handleGoLive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlideIndex, generatedSlides]);

  // Open borderless window
  const openBorderlessWindow = (url: string, name: string) => {
    const w = 1280;
    const h = 720;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    window.open(url, name, `width=${w},height=${h},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no`);
  };

  // Timer Handlers
  const handleStartOrPauseTimer = () => {
    if (state.timerState.status === 'running') {
      onPauseTimer();
    } else {
      const totalSec =
        (parseInt(customTimerMinutes, 10) || 0) * 60 + (parseInt(customTimerSeconds, 10) || 0);
      onStartTimer(totalSec > 0 ? totalSec : undefined, timerTitleInput || 'Countdown');
    }
  };

  const handleApplyCustomTimer = () => {
    const totalSec =
      (parseInt(customTimerMinutes, 10) || 0) * 60 + (parseInt(customTimerSeconds, 10) || 0);
    if (totalSec > 0) {
      setTimerConfig({
        durationSec: totalSec,
        remainingSec: totalSec,
        title: timerTitleInput || 'Countdown',
        status: 'paused',
        startedAt: null,
        targetEndTime: null,
      });
    }
  };

  const handleSelectPreset = (sec: number, label: string) => {
    setCustomTimerMinutes(Math.floor(sec / 60).toString());
    setCustomTimerSeconds((sec % 60).toString().padStart(2, '0'));
    onStartTimer(sec, `${label} Countdown`);
  };

  const toggleShowOnDisplay = () => {
    setTimerConfig({ showOnDisplay: !state.timerState.showOnDisplay });
  };

  const handleSendPromptMessage = () => {
    if (!quickAlertInput.trim()) {
      setTimerPrompt(null, false);
      setIsAlertActive(false);
      return;
    }
    setTimerPrompt(quickAlertInput.trim(), true);
    setIsAlertActive(true);
  };

  const handleClearPromptMessage = () => {
    setQuickAlertInput('');
    setTimerPrompt(null, false);
    setIsAlertActive(false);
  };

  const isLiveScriptureCategory = state.category === 'scripture';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* ============================================================= */}
      {/* 1. TOP HEADER: BRANDING, GO LIVE (F5), LOCAL CACHE & STATUS    */}
      {/* ============================================================= */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
          zIndex: 30,
          gap: '14px',
        }}
      >
        {/* Left: Branding & Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
              }}
            >
              <BookOpen size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                EasyStream <span style={{ color: '#38bdf8' }}>V2</span>
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                Scripture & Countdown Presenter
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444',
                boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span>Session: <strong>{sessionId}</strong></span>
          </div>
        </div>

        {/* Center: PRIMARY GO LIVE BUTTON & LOCAL CACHE BADGE (MOVED TO TOP HEADER) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* LOCAL CACHE / SOURCE BADGE */}
          {scriptureResult?.source === 'local' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.18)',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)',
              }}
              title="Fast offline instant cache: loaded directly from local database"
            >
              <Zap size={13} fill="#34d399" color="transparent" />
              <span>LOCAL CACHE</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <Globe size={13} />
              <span>ONLINE BIBLE</span>
            </div>
          )}


          {/* PRIMARY GO LIVE BUTTON IN TOP HEADER */}
          <button
            onClick={() => handleGoLive(selectedSlideIndex)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 22px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 900,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.04em',
              transition: 'transform 0.1s ease, box-shadow 0.1s ease',
            }}
            title="Broadcast active verse to Live Display Screen (Enter)"
          >
            <Radio size={16} />
            <span>GO LIVE (Enter)</span>
          </button>

          {/* Live indicator badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '999px',
              background: isLiveScriptureCategory ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              border: isLiveScriptureCategory ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '10px',
              fontWeight: 800,
              color: isLiveScriptureCategory ? '#f87171' : '#94a3b8',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isLiveScriptureCategory ? '#ef4444' : '#64748b',
                boxShadow: isLiveScriptureCategory ? '0 0 8px #ef4444' : 'none',
              }}
            />
            <span>{isLiveScriptureCategory ? 'LIVE ON SCREEN' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Right Actions: Display Screen & Studio Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {liveFeedback && (
            <span
              style={{
                fontSize: '12px',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
              }}
            >
              <CheckCheck size={16} /> Sent Live!
            </span>
          )}

          {/* Clear Text & Blackout Toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onUpdateLiveState({ isClearText: !state.liveState.isClearText })}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: state.liveState.isClearText ? '#f59e0b' : 'rgba(255, 255, 255, 0.06)',
                color: state.liveState.isClearText ? '#000000' : '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Clear scripture text from display (keeps background)"
            >
              Clear Text
            </button>
            <button
              onClick={() => onUpdateLiveState({ isBlackout: !state.liveState.isBlackout })}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                background: state.liveState.isBlackout ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Blackout entire display screen"
            >
              Blackout
            </button>
          </div>

          {/* Quick Display Screen Launcher */}
          <button
            onClick={() => openBorderlessWindow('/display', 'easypresenter_display')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title="Launch Fullscreen Display Window on Projector"
          >
            <Tv size={14} />
            <span>Display</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>

          {/* Return to Full Studio */}
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Switch back to Full EasyPresenter 3-Column Studio"
          >
            <Layout size={13} />
            <span>Studio</span>
          </a>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. DEDICATED COUNTDOWN TIMER CONTROL BAR                      */}
      {/* ============================================================= */}
      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          background: 'linear-gradient(90deg, #0b1120 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
          flexShrink: 0,
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Timer Display & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '3px 12px',
              borderRadius: '8px',
              border: `1.5px solid ${isOvertime ? '#ef4444' : isCritical ? '#f97316' : isWarning ? '#f59e0b' : '#38bdf8'}`,
              boxShadow: `0 0 14px ${isOvertime ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.2)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                COUNTDOWN
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background:
                    state.timerState.status === 'running'
                      ? 'rgba(16, 185, 129, 0.2)'
                      : state.timerState.status === 'paused'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : 'rgba(100, 116, 139, 0.2)',
                  color:
                    state.timerState.status === 'running'
                      ? '#34d399'
                      : state.timerState.status === 'paused'
                        ? '#fbbf24'
                        : '#94a3b8',
                }}
              >
                {state.timerState.status.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'Montserrat, monospace',
                fontSize: '26px',
                fontWeight: 900,
                color: isOvertime ? '#ef4444' : isCritical ? '#f97316' : isWarning ? '#f59e0b' : '#38bdf8',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formattedCountdown}
            </div>
          </div>

          {/* Transport Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleStartOrPauseTimer}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background:
                  state.timerState.status === 'running'
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow:
                  state.timerState.status === 'running'
                    ? '0 0 12px rgba(245, 158, 11, 0.4)'
                    : '0 0 12px rgba(16, 185, 129, 0.4)',
              }}
            >
              {state.timerState.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
              <span>{state.timerState.status === 'running' ? 'Pause' : 'Start'}</span>
            </button>

            <button
              onClick={onResetTimer}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600,
              }}
              title="Reset countdown to duration"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {/* +1m, -1m, +5m quick adjustments */}
            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
              <button
                onClick={() => adjustTimer(-60)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Subtract 1 minute"
              >
                -1m
              </button>
              <button
                onClick={() => adjustTimer(60)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Add 1 minute"
              >
                +1m
              </button>
              <button
                onClick={() => adjustTimer(300)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Add 5 minutes"
              >
                +5m
              </button>
            </div>
          </div>
        </div>

        {/* Center: Presets & Custom Duration Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>PRESETS:</span>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {TIMER_PRESETS.map((p) => (
              <button
                key={p.sec}
                onClick={() => handleSelectPreset(p.sec, p.label)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom MM:SS */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <input
              type="number"
              min="0"
              max="180"
              value={customTimerMinutes}
              onChange={(e) => setCustomTimerMinutes(e.target.value)}
              style={{
                width: '36px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
              title="Minutes"
            />
            <span style={{ color: '#64748b', fontWeight: 800 }}>:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={customTimerSeconds}
              onChange={(e) => setCustomTimerSeconds(e.target.value)}
              style={{
                width: '32px',
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
              title="Seconds"
            />
            <input
              type="text"
              placeholder="Label"
              value={timerTitleInput}
              onChange={(e) => setTimerTitleInput(e.target.value)}
              style={{
                width: '110px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '3px 6px',
                fontSize: '11px',
                color: '#ffffff',
                outline: 'none',
              }}
              title="Countdown label / slot name"
            />
            <button
              onClick={handleApplyCustomTimer}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#38bdf8',
                color: '#000000',
                fontSize: '11px',
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Set
            </button>
          </div>
        </div>

        {/* Right: Display Sync Toggle & Prompt Message */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              color: state.timerState.showOnDisplay ? '#38bdf8' : '#94a3b8',
            }}
            title="When active, the countdown timer appears on the top of DisplayView screen"
          >
            <input
              type="checkbox"
              checked={Boolean(state.timerState.showOnDisplay)}
              onChange={toggleShowOnDisplay}
              style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
            />
            <span>Show on Display</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="text"
              placeholder="Live prompt (e.g. Wrap up)"
              value={quickAlertInput}
              onChange={(e) => setQuickAlertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendPromptMessage();
              }}
              style={{
                width: '150px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                color: '#ffffff',
                outline: 'none',
              }}
            />
            <button
              onClick={isAlertActive ? handleClearPromptMessage : handleSendPromptMessage}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: isAlertActive ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: 'none',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isAlertActive ? 'Clear' : 'Send'}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 3. PROMINENT SCRIPTURE SEARCH WITH LIVE AUTOCOMPLETE DROPDOWN */}
      {/* ============================================================= */}
      <section
        style={{
          padding: '12px 20px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Main Search Input with Dynamic Dropdown Suggestions */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={18}
              color="#38bdf8"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
              }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;

                // 1. Spaced verse auto-format: e.g. "John 3 16" -> "John 3:16"
                const spacedVerseMatch = val.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)$/);
                if (spacedVerseMatch) {
                  const bookCandidate = spacedVerseMatch[1].trim();
                  const chapterNum = spacedVerseMatch[2];
                  const verseNum = spacedVerseMatch[3];
                  const matchedBook = findBestBookMatch(bookCandidate);
                  const canonicalBook = matchedBook ? matchedBook.name : bookCandidate;
                  updateQueryAndFocusEnd(`${canonicalBook} ${chapterNum}:${verseNum}`);
                  return;
                }

                // 2. Auto-insert colon if user typed space after chapter number (e.g. "John 3 " -> "John 3:")
                const trailingSpaceAfterChapter = val.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+$/);
                if (trailingSpaceAfterChapter) {
                  const bookCandidate = trailingSpaceAfterChapter[1].trim();
                  const chapterNum = trailingSpaceAfterChapter[2];
                  const matchedBook = findBestBookMatch(bookCandidate);
                  const canonicalBook = matchedBook ? matchedBook.name : bookCandidate;
                  updateQueryAndFocusEnd(`${canonicalBook} ${chapterNum}:`);
                  return;
                }

                // 3. Auto-normalize book name if colon is typed directly after chapter (e.g. "joh 3:" -> "John 3:")
                const directColonMatch = val.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+):$/);
                if (directColonMatch) {
                  const bookCandidate = directColonMatch[1].trim();
                  const chapterNum = directColonMatch[2];
                  const matchedBook = findBestBookMatch(bookCandidate);
                  if (matchedBook && matchedBook.name.toLowerCase() !== bookCandidate.toLowerCase()) {
                    updateQueryAndFocusEnd(`${matchedBook.name} ${chapterNum}:`);
                    return;
                  }
                }

                setSearchQuery(val);
                if (val.trim().length > 0) {
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(-1);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                // Tab or Space completion
                if (e.key === 'Tab' || e.key === ' ') {
                  const trimmed = searchQuery.trim();

                  // A. If suggestions list is visible and user navigated to an active item
                  if (showSuggestions && suggestions.length > 0 && activeSuggestionIndex >= 0) {
                    const activeSug = suggestions[activeSuggestionIndex];
                    e.preventDefault();
                    if (activeSug.type === 'book') {
                      updateQueryAndFocusEnd(`${activeSug.text} `);
                    } else if (activeSug.type === 'chapter') {
                      updateQueryAndFocusEnd(`${activeSug.text}:`);
                    } else if (activeSug.type === 'verse' || activeSug.type === 'version') {
                      updateQueryAndFocusEnd(activeSug.text);
                    } else {
                      updateQueryAndFocusEnd(activeSug.text);
                    }
                    return;
                  }

                  // B. Chapter entered without colon (e.g. "John 3", "Gen 1", "Rom 8", "1 Cor 13")
                  // -> Autocomplete/normalize book, keep chapter, and auto-insert ":"
                  const bookChapterMatch = trimmed.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)$/);
                  if (bookChapterMatch) {
                    e.preventDefault();
                    const bookPart = bookChapterMatch[1].trim();
                    const chapterPart = bookChapterMatch[2];
                    const matchedBook = findBestBookMatch(bookPart);
                    const canonicalBook = matchedBook ? matchedBook.name : bookPart;
                    updateQueryAndFocusEnd(`${canonicalBook} ${chapterPart}:`);
                    return;
                  }

                  // C. Book name typing (e.g. "joh", "gen", "1co", "matt", "rom", "psa")
                  // Do not intercept if user just typed single digit "1", "2", "3" with space
                  if (e.key === ' ' && /^[1-3]$/.test(trimmed)) {
                    // Let space pass through so user can type "1 Cor", "2 Kings", etc.
                    return;
                  }

                  // Match book abbreviation or partial name
                  const bookOnlyMatch = trimmed.match(/^([1-3]?\s*[a-zA-Z\s]+)$/);
                  if (bookOnlyMatch) {
                    const matchedBook = findBestBookMatch(trimmed);
                    if (matchedBook) {
                      e.preventDefault();
                      updateQueryAndFocusEnd(`${matchedBook.name} `);
                      return;
                    }
                  }

                  // D. If at chapter with colon (e.g. "John 3:") and user hits TAB
                  // Autocomplete to top verse suggestion (e.g. "John 3:16" or "John 3:1")
                  if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
                    e.preventDefault();
                    const topSug = suggestions[0];
                    if (topSug.type === 'verse') {
                      updateQueryAndFocusEnd(topSug.text);
                    } else if (topSug.type === 'book') {
                      updateQueryAndFocusEnd(`${topSug.text} `);
                    } else if (topSug.type === 'chapter') {
                      updateQueryAndFocusEnd(`${topSug.text}:`);
                    } else {
                      updateQueryAndFocusEnd(topSug.text);
                    }
                    return;
                  }
                }

                if (showSuggestions && suggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                    return;
                  }
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    return;
                  }
                }

                // ENTER: GO LIVE (INSTANT BROADCAST TO SCREEN)
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setShowSuggestions(false);
                  const targetQuery =
                    showSuggestions && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]
                      ? suggestions[activeSuggestionIndex].text
                      : searchQuery;
                  setSearchQuery(targetQuery);
                  fetchScripture(targetQuery, selectedVersion, true);
                  return;
                }
              }}
              placeholder="Search reference e.g., 'John 3:16', 'Gen 1', 'Romans 8:28', 'Psalm 23'..."
              style={{
                width: '100%',
                padding: '11px 44px 11px 44px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)',
                boxSizing: 'border-box',
              }}
            />

            {loading && (
              <RefreshCw
                size={16}
                color="#38bdf8"
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  animation: 'spin 1s linear infinite',
                  zIndex: 2,
                }}
              />
            )}

            {/* LIVE AUTOCOMPLETE SUGGESTIONS DROPDOWN (LIKE SCRIPTURE MODAL) */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsContainerRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: '#0f172a',
                  border: '1.5px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.2)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {suggestions.map((sug, idx) => {
                  const isActive = idx === activeSuggestionIndex;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isActive ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        borderBottom:
                          idx < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(sug);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <BookOpen size={14} color="#38bdf8" />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                          {sug.label}
                        </span>
                        {sug.subLabel && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {sug.subLabel}</span>
                        )}
                      </div>
                      {sug.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            borderRadius: '4px',
                          }}
                        >
                          {sug.badge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Translation Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>TRANSLATION:</span>
            <select
              value={selectedVersion}
              onChange={(e) => {
                const newVer = e.target.value;
                setSelectedVersion(newVer);
                if (searchQuery.trim()) {
                  fetchScripture(searchQuery, newVer, false);
                }
              }}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontWeight: 800,
                fontSize: '13px',
                padding: '10px 14px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {AVAILABLE_BIBLE_VERSIONS.map((v) => (
                <option key={v.id} value={v.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                  {v.id} - {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split Mode Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={() => setSplitMode('verse')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: splitMode === 'verse' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: splitMode === 'verse' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: splitMode === 'verse' ? '#38bdf8' : '#94a3b8',
              }}
              title="1 verse per slide (EasyWorship default, large readable text)"
            >
              1 Verse/Slide
            </button>
            <button
              onClick={() => setSplitMode('double')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: splitMode === 'double' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: splitMode === 'double' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: splitMode === 'double' ? '#38bdf8' : '#94a3b8',
              }}
              title="2 verses per slide"
            >
              2 Verses/Slide
            </button>
            <button
              onClick={() => setSplitMode('full')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                background: splitMode === 'full' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: splitMode === 'full' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: splitMode === 'full' ? '#38bdf8' : '#94a3b8',
              }}
              title="Full passage on single slide"
            >
              Full Chapter
            </button>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                color: '#94a3b8',
                cursor: 'pointer',
                marginLeft: '6px',
              }}
              title="Include reference tag on each slide footer"
            >
              <input
                type="checkbox"
                checked={includeReferenceOnSlide}
                onChange={(e) => setIncludeReferenceOnSlide(e.target.checked)}
                style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <span>Citation Tag</span>
            </label>
          </div>

          {/* Search Action Button */}
          <button
            onClick={() => fetchScripture(searchQuery, selectedVersion, true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
            }}
          >
            <Search size={15} />
            <span>Search & Go Live</span>
          </button>
        </div>

        {/* Popular scripture pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', flexShrink: 0 }}>QUICK JUMP:</span>
          {POPULAR_SCRIPTURES.map((p) => (
            <button
              key={p.query}
              onClick={() => {
                setSearchQuery(p.query);
                fetchScripture(p.query, selectedVersion, true);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {searchError && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertTriangle size={14} />
            <span>{searchError}</span>
          </div>
        )}
      </section>

      {/* ============================================================= */}
      {/* 4. MAIN WORKSPACE: EASYWORSHIP 3-PANEL BROWSER + SLIDE DECK    */}
      {/* ============================================================= */}
      <main
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          background: '#090d16',
        }}
      >
        {/* PANEL 1: BOOKS (66) */}
        <div
          style={{
            width: '240px',
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          {/* Books Header with Testament Filter Tabs */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                1. BIBLE BOOKS ({filteredBooks.length})
              </span>
            </div>

            {/* OT / NT Tabs */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'OT', 'NT'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTestamentFilter(t)}
                  style={{
                    flex: 1,
                    padding: '4px 0',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: testamentFilter === t ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                    color: testamentFilter === t ? '#000000' : '#94a3b8',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Book text filter */}
            <input
              type="text"
              placeholder="Filter books..."
              value={bookSearchText}
              onChange={(e) => setBookSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Book List Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
            {filteredBooks.map((book) => {
              const isSelected = selectedBook.name === book.name;
              return (
                <div
                  key={book.id}
                  onClick={() => handleSelectBook(book)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '2px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                    color: isSelected ? '#38bdf8' : '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 500,
                    transition: 'all 0.1s',
                  }}
                >
                  <span>{book.name}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: isSelected ? '#38bdf8' : '#64748b',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {book.chapters} ch
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: CHAPTERS (Grid) */}
        <div
          style={{
            width: '180px',
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.4)',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
              2. CHAPTERS
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {selectedBook.name} ({selectedBook.chapters})
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              alignContent: 'start',
            }}
          >
            {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => {
              const isSelected = selectedChapter === ch;
              return (
                <button
                  key={ch}
                  onClick={() => handleSelectChapter(ch)}
                  style={{
                    padding: '8px 0',
                    borderRadius: '6px',
                    background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isSelected ? '#000000' : '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {ch}
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL 3: VERSES (Grid) */}
        <div
          style={{
            width: '180px',
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(15, 23, 42, 0.3)',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
              3. VERSES
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                Ch. {selectedChapter} ({scriptureResult?.totalVerses || '...'})
              </span>
              <button
                onClick={() => handleSelectVerse(null)}
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: selectedVerseNumber === null ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                  color: selectedVerseNumber === null ? '#000000' : '#38bdf8',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ALL
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              alignContent: 'start',
            }}
          >
            {scriptureResult && scriptureResult.verses && scriptureResult.verses.length > 0
              ? scriptureResult.verses.map((v) => {
                  const isSelected = selectedVerseNumber === v.verse;
                  return (
                    <button
                      key={v.verse}
                      onClick={() => handleSelectVerse(v.verse)}
                      style={{
                        padding: '8px 0',
                        borderRadius: '6px',
                        background: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.05)',
                        border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#000000' : '#e2e8f0',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                    >
                      {v.verse}
                    </button>
                  );
                })
              : Array.from({ length: 25 }, (_, i) => i + 1).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleSelectVerse(v)}
                    style={{
                      padding: '8px 0',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {v}
                  </button>
                ))}
          </div>
        </div>

        {/* PANEL 4: SCRIPTURE SLIDE DECK (Center Stage) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#090d16',
          }}
        >
          {/* Slide Deck Sub-header */}
          <div
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                  {scriptureResult?.reference || searchQuery}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                  }}
                >
                  {scriptureResult?.version || selectedVersion}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {generatedSlides.length} Slide{generatedSlides.length > 1 ? 's' : ''} • Click card to preview, double-click to project live
              </div>
            </div>

            {/* Slide Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={handlePrevSlide}
                disabled={selectedSlideIndex <= 0}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px 0 0 6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: selectedSlideIndex <= 0 ? '#475569' : '#ffffff',
                  cursor: selectedSlideIndex <= 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Previous slide (Left Arrow)"
              >
                <ChevronLeft size={15} />
              </button>
              <div
                style={{
                  padding: '6px 10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  minWidth: '55px',
                  textAlign: 'center',
                }}
              >
                {selectedSlideIndex + 1} / {generatedSlides.length || 1}
              </div>
              <button
                onClick={handleNextSlide}
                disabled={selectedSlideIndex >= generatedSlides.length - 1}
                style={{
                  padding: '6px 10px',
                  borderRadius: '0 6px 6px 0',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: selectedSlideIndex >= generatedSlides.length - 1 ? '#475569' : '#ffffff',
                  cursor: selectedSlideIndex >= generatedSlides.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Next slide (Right Arrow / Space)"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Generated Slide Cards Grid */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px',
              alignContent: 'start',
            }}
          >
            {generatedSlides.map((slideText, idx) => {
              const isSelected = idx === selectedSlideIndex;
              const isCurrentlyLiveOnDisplay =
                state.category === 'scripture' && state.cur === idx && state.lines[idx] === slideText;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedSlideIndex(idx);
                    onJumpTo(idx);
                  }}
                  onDoubleClick={() => handleGoLive(idx)}
                  style={{
                    background: isCurrentlyLiveOnDisplay
                      ? 'rgba(239, 68, 68, 0.15)'
                      : isSelected
                        ? 'rgba(56, 189, 248, 0.12)'
                        : 'rgba(15, 23, 42, 0.7)',
                    border: isCurrentlyLiveOnDisplay
                      ? '2px solid #ef4444'
                      : isSelected
                        ? '2px solid #38bdf8'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                    cursor: 'pointer',
                    boxShadow: isCurrentlyLiveOnDisplay
                      ? '0 0 20px rgba(239, 68, 68, 0.35)'
                      : isSelected
                        ? '0 0 16px rgba(56, 189, 248, 0.25)'
                        : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: isCurrentlyLiveOnDisplay ? '#ef4444' : isSelected ? '#38bdf8' : '#64748b',
                      }}
                    >
                      SLIDE {idx + 1}
                    </span>

                    {isCurrentlyLiveOnDisplay ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: '#ef4444',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Radio size={10} /> ON DISPLAY
                      </span>
                    ) : isSelected ? (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                        }}
                      >
                        PREVIEW
                      </span>
                    ) : null}
                  </div>

                  <div
                    style={{
                      color: '#ffffff',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      fontWeight: 500,
                      whiteSpace: 'pre-line',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {slideText}
                  </div>

                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: '#64748b' }}>Double-click to project</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL 5: LIVE DISPLAY MONITOR (Mini Preview of DisplayView) */}
        <div
          style={{
            width: '380px',
            flexShrink: 0,
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10, 15, 26, 0.85)',
            padding: '16px',
            gap: '14px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tv size={16} color="#38bdf8" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                Live Screen Output
              </span>
            </div>
            <button
              onClick={() => openBorderlessWindow('/display', 'easypresenter_display')}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ExternalLink size={11} />
              Popout
            </button>
          </div>

          {/* 16:9 Mini Screen Monitor reproducing DisplayView */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              background: state.liveState.isBlackout
                ? '#000000'
                : 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)',
              borderRadius: '10px',
              border: '1.5px solid rgba(56, 189, 248, 0.35)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '12px 14px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar on Screen: Cyan Countdown Timer + Underline (Left) & Real Clock (Right) */}
            {!state.liveState.isBlackout && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '4px',
                }}
              >
                {/* Top Left Countdown Timer */}
                {state.timerState.showOnDisplay && (state.timerState.status !== 'idle' || currentTimerSec > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '18px',
                        fontWeight: 900,
                        color: isOvertime ? '#ef4444' : isCritical ? '#f97316' : isWarning ? '#f59e0b' : '#60a5fa',
                        lineHeight: 1,
                      }}
                    >
                      {formattedCountdown}
                    </span>
                    <div
                      style={{
                        height: '2px',
                        width: '100%',
                        background: isOvertime ? '#ef4444' : '#60a5fa',
                        marginTop: '2px',
                      }}
                    />
                  </div>
                ) : (
                  <div />
                )}

                {/* Top Right Digital Clock */}
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#f59e0b',
                    }}
                  >
                    {new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            {/* Center: Live Scripture Text */}
            {!state.liveState.isBlackout && !state.liveState.isClearText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  fontFamily: 'Montserrat, sans-serif',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                  padding: '4px',
                  whiteSpace: 'pre-line',
                  overflow: 'hidden',
                }}
              >
                {state.lines[state.cur] || generatedSlides[selectedSlideIndex] || 'No scripture active'}
              </div>
            )}

            {/* Bottom Citation & Status */}
            {!state.liveState.isBlackout && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '4px',
                }}
              >
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#38bdf8' }}>
                  {state.title || scriptureResult?.reference}
                </span>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>
                  DISPLAYVIEW LIVE
                </span>
              </div>
            )}
          </div>

          {/* Quick Help & Status Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '11px',
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
              ⚡ EASYPRESENTER V2 SHORTCUTS
            </div>
            <div>• <strong>Enter</strong>: Go Live to Screen</div>
            <div>• <strong>Space / Tab</strong>: Autocomplete Book & Chapter (Auto-inserts :)</div>
            <div>• <strong>Right Arrow / Space</strong> (on deck): Next Slide</div>
            <div>• <strong>Left Arrow</strong> (on deck): Previous Slide</div>
            <div>• <strong>Countdown Timer</strong>: Start/pause or pick presets above</div>
          </div>
        </div>
      </main>
    </div>
  );
};
