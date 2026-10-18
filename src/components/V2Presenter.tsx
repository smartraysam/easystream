import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Type,
  Minus,
  Plus,
  Sliders,
  Settings,
  X,
  Check,
  Music,
  Globe,
  HardDrive,
  ListPlus,
  Sparkles,
  Loader2,
  Bookmark,
  Edit,
  Trash2,
} from "lucide-react";
import {
  AppState,
  LiveState,
  TimerState,
  LibraryItem,
  PresentationTheme,
} from "../types";
import {
  BIBLE_BOOKS,
  BibleBook,
  getBibleSuggestions,
  findBestBookMatch,
  BibleSuggestion,
  AVAILABLE_BIBLE_VERSIONS,
} from "../data/bibleBooks";
import { parseLyricsToSlides } from "../utils/lyricParser";
import {
  getLyricSuggestions,
  LyricSuggestion,
  POPULAR_WORSHIP_SONGS,
} from "../data/popularWorshipSongs";
import { SongBankEditorModal, SongBankEditorItem } from "./SongBankEditorModal";
import { FormatSettingsModal } from "./FormatSettingsModal";
import { EasyWorshipWorkspace } from "./EasyWorshipWorkspace";

export interface OnlineSongResult {
  id: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  snippet?: string;
  plainLyrics: string;
  isLocal?: boolean;
  localItem?: LibraryItem;
  source?: 'google' | 'genius' | 'lrclib' | 'local';
  sourceUrl?: string;
  artworkUrl?: string;
}

export const DEFAULT_WORSHIP_SONG: OnlineSongResult = {
  id: "default-worship-song-1",
  trackName: "Goodness of God",
  artistName: "Bethel Music / Jenn Johnson",
  snippet:
    "I love You Lord, for Your mercy never fails me • All my days I've been held in Your hands",
  plainLyrics: `[Verse 1]
I love You, Lord
For Your mercy never fails me
All my days, I've been held in Your hands
From the moment that I wake up
Until I lay my head
Oh, I will sing of the goodness of God

[Chorus]
And all my life You have been faithful
And all my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God

[Verse 2]
I love Your voice
You have led me through the fire
In the darkest night You are close like no other
I've known You as a Father
I've known You as a Friend
And I have lived in the goodness of God

[Bridge]
Your goodness is running after
It's running after me
Your goodness is running after
It's running after me
With my life laid down, I'm surrendered now
I give You everything
Your goodness is running after
It's running after me`,
  isLocal: false,
};

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
  source?: "local" | "online" | "offline-fail";
}

const POPULAR_SCRIPTURES = [
  { label: "John 3:16", query: "John 3:16" },
  { label: "Psalm 23", query: "Psalm 23" },
  { label: "Romans 8:28", query: "Romans 8:28" },
  { label: "Philippians 4:6", query: "Philippians 4:6" },
  { label: "1 Cor 13:4", query: "1 Cor 13:4" },
  { label: "Isaiah 40:31", query: "Isaiah 40:31" },
  { label: "Proverbs 3:5", query: "Proverbs 3:5" },
  { label: "Matthew 28:19", query: "Matthew 28:19" },
  { label: "Hebrews 11:1", query: "Hebrews 11:1" },
  { label: "Jeremiah 29:11", query: "Jeremiah 29:11" },
];

const TIMER_PRESETS = [
  { label: "1m", sec: 60 },
  { label: "3m", sec: 180 },
  { label: "5m", sec: 300 },
  { label: "10m", sec: 600 },
  { label: "15m", sec: 900 },
  { label: "20m", sec: 1200 },
  { label: "30m", sec: 1800 },
  { label: "45m", sec: 2700 },
  { label: "60m", sec: 3600 },
];

export const FONT_FAMILIES = [
  {
    label: "Montserrat",
    sublabel: "Modern Bold Sans",
    value: "Montserrat, sans-serif",
  },
  {
    label: "Outfit",
    sublabel: "Clean Geometric Sans",
    value: "Outfit, sans-serif",
  },
  {
    label: "Inter",
    sublabel: "Crisp Display Sans",
    value: "Inter, sans-serif",
  },
  {
    label: "Playfair Display",
    sublabel: "Classic Editorial Serif",
    value: "Playfair Display, serif",
  },
  {
    label: "Cinzel",
    sublabel: "Majestic Traditional Serif",
    value: "Cinzel, serif",
  },
  {
    label: "Oswald",
    sublabel: "Tall Condensed Impact",
    value: "Oswald, sans-serif",
  },
  { label: "Georgia", sublabel: "Warm Reading Serif", value: "Georgia, serif" },
  {
    label: "JetBrains Mono",
    sublabel: "Clean Modern Monospace",
    value: "JetBrains Mono, monospace",
  },
];

interface V2PresenterProps {
  state: AppState;
  sessionId: string;
  isConnected: boolean;
  onSetLines: (
    title: string,
    subtitle: string,
    lines: string[],
    category?: AppState["category"],
  ) => void;
  onJumpTo: (index: number) => void;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onStartTimer: (durationSec?: number, title?: string) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  adjustTimer: (deltaSec: number) => void;
  setTimerConfig: (config: Partial<TimerState>) => void;
  setTimerPrompt: (message: string | null, visible: boolean) => void;
  onUpdateTheme?: (theme: Partial<PresentationTheme>) => void;
  onSaveLibraryItem?: (item: LibraryItem) => void;
  onDeleteLibraryItem?: (id: string) => void;
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
  onUpdateTheme,
  onSaveLibraryItem,
  onDeleteLibraryItem,
  onAddToSchedule,
}) => {
  // -------------------------------------------------------------
  // Mode Switcher Tab State: 'scripture' | 'lyrics'
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<"scripture" | "lyrics">(
    "scripture",
  );

  // -------------------------------------------------------------
  // Typography & Styling Modal State
  // -------------------------------------------------------------
  const [showTypographyModal, setShowTypographyModal] = useState(false);
  const [formatModalTab, setFormatModalTab] = useState<'scripture' | 'lyrics' | 'general'>('scripture');

  // -------------------------------------------------------------
  // Lyric Projection & Search State (Local + Online)
  // -------------------------------------------------------------
  const [lyricsQuery, setLyricsQuery] = useState("");
  const [lyricsScope, setLyricsScope] = useState<"all" | "local" | "online">(
    "all",
  );
  const [lyricsSplitMode, setLyricsSplitMode] = useState<
    "smart" | "smart3" | "stanzas" | "lines"
  >("smart");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [onlineSongResults, setOnlineSongResults] = useState<
    OnlineSongResult[]
  >([]);
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(
    DEFAULT_WORSHIP_SONG,
  );
  const [selectedLyricSlideIndex, setSelectedLyricSlideIndex] = useState(0);
  const [showLyricSuggestions, setShowLyricSuggestions] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [lyricSaveFeedback, setLyricSaveFeedback] = useState<string | null>(
    null,
  );
  const [isSongEditorOpen, setIsSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongBankEditorItem | null>(
    null,
  );

  const lyricSearchInputRef = useRef<HTMLInputElement | null>(null);
  const lyricSuggestionsRef = useRef<HTMLDivElement | null>(null);
  const lyricSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // -------------------------------------------------------------
  // Top Scripture Search State
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("John 3:16");
  const [selectedVersion, setSelectedVersion] = useState("NIV");
  const [splitMode, setSplitMode] = useState<"verse" | "double" | "full">(
    "verse",
  );
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [scriptureResult, setScriptureResult] =
    useState<OnlineScriptureResult | null>(null);
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
  const [testamentFilter, setTestamentFilter] = useState<"ALL" | "OT" | "NT">(
    "ALL",
  );
  const [bookSearchText, setBookSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find((b) => b.name === "John") || BIBLE_BOOKS[42],
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(
    16,
  );

  // -------------------------------------------------------------
  // Countdown Timer State
  // -------------------------------------------------------------
  const [customTimerMinutes, setCustomTimerMinutes] = useState("15");
  const [customTimerSeconds, setCustomTimerSeconds] = useState("00");
  const [timerTitleInput, setTimerTitleInput] = useState(
    state.timerState.title || "Sermon Countdown",
  );
  const [quickAlertInput, setQuickAlertInput] = useState("");
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
      if (
        lyricSearchInputRef.current &&
        !lyricSearchInputRef.current.contains(e.target as Node) &&
        lyricSuggestionsRef.current &&
        !lyricSuggestionsRef.current.contains(e.target as Node)
      ) {
        setShowLyricSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // -------------------------------------------------------------
  // Lyric Search, Suggestions & Local Library Matching
  // -------------------------------------------------------------
  // 1. Matches from local church library
  const localSongMatches: OnlineSongResult[] = useMemo(() => {
    const q = lyricsQuery.trim().toLowerCase();
    const items = state.library || [];
    const songItems = items.filter(
      (item) =>
        item.category === "song" ||
        item.category === "hymn" ||
        item.category === "custom",
    );

    if (!q) {
      return songItems.map((item) => ({
        id: item.id,
        trackName: item.title,
        artistName: item.author || "Local Church Library",
        snippet: item.lines?.slice(0, 2).join(" • ") || "",
        plainLyrics: item.content || item.lines?.join("\n") || "",
        isLocal: true,
        localItem: item,
      }));
    }

    return songItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          (item.author && item.author.toLowerCase().includes(q)) ||
          (item.content && item.content.toLowerCase().includes(q))
        );
      })
      .map((item) => ({
        id: item.id,
        trackName: item.title,
        artistName: item.author || "Local Church Library",
        snippet: item.lines?.slice(0, 2).join(" • ") || "",
        plainLyrics: item.content || item.lines?.join("\n") || "",
        isLocal: true,
        localItem: item,
      }));
  }, [state.library, lyricsQuery]);

  // 2. Combined song results based on selected scope
  const combinedSongResults: OnlineSongResult[] = useMemo(() => {
    if (lyricsScope === "local") {
      return localSongMatches;
    }
    if (lyricsScope === "online") {
      return onlineSongResults;
    }
    const localTitles = new Set(
      localSongMatches.map((m) => m.trackName.toLowerCase()),
    );
    const filteredOnline = onlineSongResults.filter(
      (online) => !localTitles.has(online.trackName.toLowerCase()),
    );
    return [...localSongMatches, ...filteredOnline];
  }, [lyricsScope, localSongMatches, onlineSongResults]);

  // 3. Autocomplete suggestions for song lyrics
  const lyricSuggestions: LyricSuggestion[] = useMemo(() => {
    if (!lyricsQuery.trim() || !showLyricSuggestions) return [];
    return getLyricSuggestions(lyricsQuery, state.library || []);
  }, [lyricsQuery, showLyricSuggestions, state.library]);

  // 4. Parse selected song lyrics into slides
  const lyricSlides: string[] = useMemo(() => {
    if (!selectedSong || !selectedSong.plainLyrics) return [];
    return parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode);
  }, [selectedSong, lyricsSplitMode]);

  // 5. Debounced online lyrics search
  useEffect(() => {
    if (activeTab !== "lyrics") return;
    if (lyricSearchTimeoutRef.current)
      clearTimeout(lyricSearchTimeoutRef.current);

    if (!lyricsQuery.trim()) {
      setOnlineSongResults([]);
      setLyricsLoading(false);
      return;
    }

    if (lyricsScope === "local") {
      setOnlineSongResults([]);
      setLyricsLoading(false);
      return;
    }

    setLyricsLoading(true);
    lyricSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/search?q=${encodeURIComponent(lyricsQuery.trim())}`,
        );
        const data = await res.json();
        const songs: OnlineSongResult[] = (data.results || []).map(
          (s: OnlineSongResult) => ({
            ...s,
            isLocal: false,
          }),
        );
        setOnlineSongResults(songs);
        if (
          songs.length > 0 &&
          (!selectedSong || selectedSong.id === DEFAULT_WORSHIP_SONG.id)
        ) {
          if (localSongMatches.length > 0) {
            setSelectedSong(localSongMatches[0]);
          } else {
            setSelectedSong(songs[0]);
          }
        }
      } catch (err) {
        console.error("Failed to search lyrics:", err);
      } finally {
        setLyricsLoading(false);
      }
    }, 350);

    return () => {
      if (lyricSearchTimeoutRef.current)
        clearTimeout(lyricSearchTimeoutRef.current);
    };
  }, [lyricsQuery, lyricsScope, activeTab, localSongMatches.length]);

  const handleSelectSong = async (
    song: OnlineSongResult,
    autoGoLive: boolean = true,
  ) => {
    setSelectedSong(song);
    setSelectedLyricSlideIndex(0);
    setShowLyricSuggestions(false);

    let activeLyrics = song.plainLyrics;
    let activeSong = song;

    // If lyrics are not yet fetched (e.g. lazy loaded), fetch details
    if (!song.plainLyrics || song.plainLyrics.length < 20) {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(song.id)}&url=${encodeURIComponent(song.sourceUrl || "")}`
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          activeLyrics = data.result.plainLyrics;
          const updated = {
            ...song,
            plainLyrics: data.result.plainLyrics,
            snippet: data.result.snippet || song.snippet,
          };
          activeSong = updated;
          setSelectedSong(updated);
          setOnlineSongResults((prev) =>
            prev.map((s) => (s.id === song.id ? updated : s))
          );
        }
      } catch (err) {
        console.error("Error fetching song lyrics details:", err);
      }
    }

    if (autoGoLive && activeLyrics) {
      const slides = parseLyricsToSlides(activeLyrics, lyricsSplitMode);
      if (slides.length > 0) {
        onSetLines(
          activeSong.trackName,
          activeSong.artistName || "Worship",
          slides,
          "song",
        );
        onJumpTo(0);
        if (state.liveState.isClearText) {
          onUpdateLiveState({ isClearText: false });
        }
        setLiveFeedback(true);
        setTimeout(() => setLiveFeedback(false), 2000);
      }
    }
  };

  const handleSelectLyricSuggestion = (sug: LyricSuggestion) => {
    setLyricsQuery(sug.title);
    setShowLyricSuggestions(false);
    if (sug.isLocal && sug.localItem) {
      const match: OnlineSongResult = {
        id: sug.localItem.id,
        trackName: sug.localItem.title,
        artistName: sug.localItem.author || "Local Church Library",
        snippet: sug.localItem.lines?.slice(0, 2).join(" • ") || "",
        plainLyrics:
          sug.localItem.content || sug.localItem.lines?.join("\n") || "",
        isLocal: true,
        localItem: sug.localItem,
      };
      handleSelectSong(match, true);
    }
  };

  // Check if selected song is saved in local library
  const isSelectedSongSaved = useMemo(() => {
    if (!selectedSong) return false;
    if (selectedSong.isLocal) return true;
    return (state.library || []).some(
      (item) =>
        item.title.toLowerCase().trim() ===
        selectedSong.trackName.toLowerCase().trim(),
    );
  }, [selectedSong, state.library]);

  const handleSaveSongToLibrary = (song: OnlineSongResult) => {
    if (!onSaveLibraryItem) return;
    const slides = parseLyricsToSlides(song.plainLyrics, lyricsSplitMode);
    const existingLocal = (state.library || []).find(
      (i) =>
        i.id === song.localItem?.id ||
        i.title.toLowerCase().trim() === song.trackName.toLowerCase().trim(),
    );
    const item: LibraryItem = {
      id:
        song.localItem?.id ||
        existingLocal?.id ||
        `song-${song.trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      title: song.trackName,
      author: song.artistName,
      category:
        (song.localItem?.category as any) || existingLocal?.category || "song",
      content: song.plainLyrics,
      lines: slides,
      createdAt:
        song.localItem?.createdAt || existingLocal?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    onSaveLibraryItem(item);
    setSelectedSong((prev) => {
      if (!prev || prev.id !== song.id) return prev;
      return {
        ...prev,
        isLocal: true,
        localItem: item,
      };
    });
    setLyricSaveFeedback(`"${song.trackName}" saved to Song Bank!`);
    setTimeout(() => setLyricSaveFeedback(null), 3000);
  };

  const handleOpenAddSong = () => {
    setEditingSong(null);
    setIsSongEditorOpen(true);
  };

  const handleOpenEditSong = (song: OnlineSongResult) => {
    const existingLocal = (state.library || []).find(
      (i) =>
        i.id === song.localItem?.id ||
        i.title.toLowerCase().trim() === song.trackName.toLowerCase().trim(),
    );
    setEditingSong({
      id: song.localItem?.id || existingLocal?.id,
      title: song.trackName,
      author: song.artistName,
      category:
        (song.localItem?.category as any) || existingLocal?.category || "song",
      content: song.plainLyrics,
      plainLyrics: song.plainLyrics,
      splitMode: lyricsSplitMode,
    });
    setIsSongEditorOpen(true);
  };

  const handleSaveSongFromEditor = (item: LibraryItem) => {
    if (onSaveLibraryItem) {
      onSaveLibraryItem(item);
    }
    const onlineFormat: OnlineSongResult = {
      id: item.id,
      trackName: item.title,
      artistName: item.author || "Local Church Library",
      snippet: item.lines?.slice(0, 2).join(" • ") || "",
      plainLyrics: item.content || item.lines?.join("\n") || "",
      isLocal: true,
      localItem: item,
    };
    setSelectedSong(onlineFormat);
    setSelectedLyricSlideIndex(0);
    setLyricSaveFeedback(`"${item.title}" saved to Song Bank!`);
    setTimeout(() => setLyricSaveFeedback(null), 3000);
  };

  const handleSaveAndGoLiveFromEditor = (item: LibraryItem) => {
    handleSaveSongFromEditor(item);
    onSetLines(item.title, item.author || "Worship", item.lines, "song");
    onJumpTo(0);
    if (state.liveState.isClearText) {
      onUpdateLiveState({ isClearText: false });
    }
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
  };

  const handleSaveAndAddToScheduleFromEditor = (item: LibraryItem) => {
    handleSaveSongFromEditor(item);
    if (onAddToSchedule) {
      onAddToSchedule(item);
    }
  };

  const handleAddSongToSchedule = (song: OnlineSongResult) => {
    if (!onAddToSchedule) return;
    const slides = parseLyricsToSlides(song.plainLyrics, lyricsSplitMode);
    const item: LibraryItem = {
      id:
        song.localItem?.id ||
        `song-${song.trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
      title: song.trackName,
      author: song.artistName,
      category: "song",
      content: song.plainLyrics,
      lines: slides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onAddToSchedule(item);
    setLyricSaveFeedback(`"${song.trackName}" added to service schedule!`);
    setTimeout(() => setLyricSaveFeedback(null), 3000);
  };

  // Close Typography modal on Escape key
  useEffect(() => {
    if (!showTypographyModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowTypographyModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTypographyModal]);

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
  if (state.timerState.status === "running" && state.timerState.targetEndTime) {
    currentTimerSec = Math.floor((state.timerState.targetEndTime - now) / 1000);
  }
  const isOvertime = currentTimerSec < 0;
  const isWarning =
    currentTimerSec <= state.timerState.warningThresholdSec && !isOvertime;
  const isCritical =
    currentTimerSec <= state.timerState.criticalThresholdSec && !isOvertime;

  const absSec = Math.abs(currentTimerSec);
  const timerHours = Math.floor(absSec / 3600);
  const timerMins = Math.floor((absSec % 3600) / 60);
  const timerSecs = absSec % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const formattedCountdown =
    timerHours > 0
      ? `${isOvertime ? "-" : ""}${pad(timerHours)}:${pad(timerMins)}:${pad(timerSecs)}`
      : `${isOvertime ? "-" : ""}${pad(timerMins)}:${pad(timerSecs)}`;

  // Filter books for Column 1
  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter((book) => {
      if (testamentFilter === "OT" && book.testament !== "OT") return false;
      if (testamentFilter === "NT" && book.testament !== "NT") return false;
      if (bookSearchText.trim()) {
        const query = bookSearchText.toLowerCase().trim();
        const matchesName = book.name.toLowerCase().includes(query);
        const matchesAlias = book.aliases.some((a) =>
          a.toLowerCase().includes(query),
        );
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
    const versionRegex = new RegExp(
      `[\\s,\\(-]+(${versionCodes.join("|")})[\\)\\s]*$`,
      "i",
    );
    const cleaned = trimmed.replace(versionRegex, "").trim();
    const strippedLeadingNum = cleaned.replace(/^[1-3]\s*[a-zA-Z]+/i, "");
    return /\d+/.test(strippedLeadingNum);
  };

  // Format slides from result
  const formatSlidesFromData = (
    res: OnlineScriptureResult,
    mode: "verse" | "double" | "full",
    withRef: boolean,
  ): string[] => {
    if (!res.verses || res.verses.length === 0) return [];

    const bookChapterMatch = res.reference.match(
      /^([\d\s]*[A-Za-z\s]+?\s*\d+)/,
    );
    const baseBookChapter = bookChapterMatch
      ? bookChapterMatch[1].trim()
      : res.reference;

    if (mode === "full") {
      const refHeader = `${res.reference} (${res.version})`;
      const text = res.verses.map((v) => `${v.verse} ${v.text}`).join("\n\n");
      return [withRef ? `${refHeader}\n\n${text}` : text];
    }

    if (mode === "double") {
      const slides: string[] = [];
      for (let i = 0; i < res.verses.length; i += 2) {
        const pair = res.verses.slice(i, i + 2);
        const pairRef =
          pair.length === 1
            ? `${baseBookChapter}:${pair[0].verse} (${res.version})`
            : `${baseBookChapter}:${pair[0].verse}-${pair[1].verse} (${res.version})`;
        const text = pair.map((v) => `${v.verse} ${v.text}`).join("\n\n");
        slides.push(withRef ? `${pairRef}\n\n${text}` : text);
      }
      return slides;
    }

    // Default 'verse': Exactly 1 verse per slide
    return res.verses.map((v) => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, "").trim();
      const verseRef =
        res.verses.length === 1
          ? `${res.reference} (${res.version})`
          : `${baseBookChapter}:${v.verse} (${res.version})`;
      return withRef ? `${verseRef}\n\n${cleanVerse}` : cleanVerse;
    });
  };

  // Generated slides for the current result
  const generatedSlides = useMemo(() => {
    if (!scriptureResult) return [];
    return formatSlidesFromData(
      scriptureResult,
      splitMode,
      includeReferenceOnSlide,
    );
  }, [scriptureResult, splitMode, includeReferenceOnSlide]);

  // Fetch scripture from API
  const fetchScripture = async (
    queryStr: string,
    version: string,
    autoGoLive = false,
    focusVerseNum: number | null = null,
  ) => {
    let raw = queryStr.trim();
    setShowSuggestions(false);
    if (!raw) return;

    // Strip trailing dashes or colons if user pressed Enter on an incomplete range (e.g. "John 3:16-", "John 3:")
    raw = raw.replace(/[-–—:\s]+$/, "").trim();

    // Normalize spaced verse: e.g. "John 3 16" -> "John 3:16"
    raw = raw.replace(
      /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)(.*)$/,
      "$1 $2:$3$4",
    );

    // Auto expand abbreviated book name if needed
    const refParts = raw.match(/^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+.*)$/);
    if (refParts) {
      const bookPart = refParts[1].trim();
      const restPart = refParts[2].trim();
      const matchedBook = findBestBookMatch(bookPart);
      if (
        matchedBook &&
        matchedBook.name.toLowerCase() !== bookPart.toLowerCase()
      ) {
        raw = `${matchedBook.name} ${restPart}`;
        setSearchQuery(raw);
      }
    }

    if (!hasChapterNumber(raw)) {
      setSearchError(
        `Please include a chapter number (e.g. "${raw} 1" or "${raw} 3:16").`,
      );
      setShowSuggestions(true);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
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
          const vIdx = data.verses.findIndex(
            (v: OnlineScriptureVerse) => v.verse === focusVerseNum,
          );
          if (vIdx !== -1) {
            targetSlideIdx =
              splitMode === "double" ? Math.floor(vIdx / 2) : vIdx;
          }
        } else if (selectedSlideIndex > 0) {
          targetSlideIdx = Math.min(selectedSlideIndex, data.verses.length - 1);
        }
        setSelectedSlideIndex(targetSlideIdx);

        if (autoGoLive) {
          const slides = formatSlidesFromData(
            data,
            splitMode,
            includeReferenceOnSlide,
          );
          if (slides.length > 0) {
            onSetLines(
              data.reference,
              data.versionName || data.version,
              slides,
              "scripture",
            );
            onJumpTo(targetSlideIdx);
            if (state.liveState.isClearText) {
              onUpdateLiveState({ isClearText: false });
            }
            setLiveFeedback(true);
            setTimeout(() => setLiveFeedback(false), 2000);
          }
        }
      } else {
        setSearchError(`No verses found for "${raw}" in ${version}.`);
        setScriptureResult(null);
      }
    } catch (err: any) {
      setSearchError(
        `Failed to fetch scripture: ${err?.message || "Network error"}`,
      );
      setScriptureResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchScripture("John 3:16", selectedVersion, false, 16);
  }, []);

  // Handle suggestion click / selection
  const handleSelectSuggestion = (sug: BibleSuggestion) => {
    if (sug.type === "book") {
      updateQueryAndFocusEnd(`${sug.text} `);
    } else if (sug.type === "chapter") {
      updateQueryAndFocusEnd(`${sug.text}:`);
    } else if (sug.type === "verse" || sug.type === "version") {
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
        scriptureResult.reference
          .toLowerCase()
          .startsWith(`${selectedBook.name.toLowerCase()} ${selectedChapter}`)
      ) {
        const vIdx = scriptureResult.verses.findIndex(
          (v) => v.verse === verseNum,
        );
        if (vIdx !== -1) {
          const sIdx = splitMode === "double" ? Math.floor(vIdx / 2) : vIdx;
          setSelectedSlideIndex(sIdx);
          const slides = formatSlidesFromData(
            scriptureResult,
            splitMode,
            includeReferenceOnSlide,
          );
          onSetLines(
            `${selectedBook.name} ${selectedChapter}:${verseNum}`,
            scriptureResult.version,
            slides,
            "scripture",
          );
          onJumpTo(sIdx);
          if (state.liveState.isClearText) {
            onUpdateLiveState({ isClearText: false });
          }
          setLiveFeedback(true);
          setTimeout(() => setLiveFeedback(false), 2000);
          return;
        }
      }
      fetchScripture(vRef, selectedVersion, true, verseNum);
    }
  };

  // Go Live with current slides
  const handleGoLive = (slideIdx?: number) => {
    if (activeTab === "lyrics") {
      if (!selectedSong || lyricSlides.length === 0) return;
      const targetIdx =
        typeof slideIdx === "number" ? slideIdx : selectedLyricSlideIndex;
      onSetLines(
        selectedSong.trackName,
        selectedSong.artistName || "Worship",
        lyricSlides,
        "song",
      );
      onJumpTo(targetIdx);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
      setLiveFeedback(true);
      setTimeout(() => setLiveFeedback(false), 2000);
      return;
    }

    if (!scriptureResult || generatedSlides.length === 0) return;
    const targetIdx =
      typeof slideIdx === "number" ? slideIdx : selectedSlideIndex;
    onSetLines(
      scriptureResult.reference,
      scriptureResult.versionName || scriptureResult.version,
      generatedSlides,
      "scripture",
    );
    onJumpTo(targetIdx);
    if (state.liveState.isClearText) {
      onUpdateLiveState({ isClearText: false });
    }
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
  };

  // Slide transport navigation
  const handleNextSlide = () => {
    if (activeTab === "lyrics") {
      if (selectedLyricSlideIndex < lyricSlides.length - 1) {
        const nextIdx = selectedLyricSlideIndex + 1;
        setSelectedLyricSlideIndex(nextIdx);
        onJumpTo(nextIdx);
      }
    } else {
      if (selectedSlideIndex < generatedSlides.length - 1) {
        const nextIdx = selectedSlideIndex + 1;
        setSelectedSlideIndex(nextIdx);
        onJumpTo(nextIdx);
      }
    }
  };

  const handlePrevSlide = () => {
    if (activeTab === "lyrics") {
      if (selectedLyricSlideIndex > 0) {
        const prevIdx = selectedLyricSlideIndex - 1;
        setSelectedLyricSlideIndex(prevIdx);
        onJumpTo(prevIdx);
      }
    } else {
      if (selectedSlideIndex > 0) {
        const prevIdx = selectedSlideIndex - 1;
        setSelectedSlideIndex(prevIdx);
        onJumpTo(prevIdx);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === "Enter" || e.key === "F5") {
        e.preventDefault();
        handleGoLive();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    selectedSlideIndex,
    selectedLyricSlideIndex,
    generatedSlides,
    lyricSlides,
    selectedSong,
    scriptureResult,
  ]);

  // Open borderless window
  const openBorderlessWindow = (url: string, name: string) => {
    const w = 1280;
    const h = 720;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - h) / 2;
    window.open(
      url,
      name,
      `width=${w},height=${h},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=no`,
    );
  };

  // Timer Handlers
  const handleStartOrPauseTimer = () => {
    if (state.timerState.status === "running") {
      onPauseTimer();
    } else {
      const totalSec =
        (parseInt(customTimerMinutes, 10) || 0) * 60 +
        (parseInt(customTimerSeconds, 10) || 0);
      onStartTimer(
        totalSec > 0 ? totalSec : undefined,
        timerTitleInput || "Countdown",
      );
    }
  };

  const handleApplyCustomTimer = () => {
    const totalSec =
      (parseInt(customTimerMinutes, 10) || 0) * 60 +
      (parseInt(customTimerSeconds, 10) || 0);
    if (totalSec > 0) {
      setTimerConfig({
        durationSec: totalSec,
        remainingSec: totalSec,
        title: timerTitleInput || "Countdown",
        status: "paused",
        startedAt: null,
        targetEndTime: null,
      });
    }
  };

  const handleSelectPreset = (sec: number, label: string) => {
    setCustomTimerMinutes(Math.floor(sec / 60).toString());
    setCustomTimerSeconds((sec % 60).toString().padStart(2, "0"));
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
    setQuickAlertInput("");
    setTimerPrompt(null, false);
    setIsAlertActive(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "#090d16",
        color: "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ============================================================= */}
      {/* 1. TOP HEADER: BRANDING, GO LIVE (F5), LOCAL CACHE & STATUS    */}
      {/* ============================================================= */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
          zIndex: 30,
          gap: "14px",
        }}
      >
        {/* Left: Branding & Session */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background:
                  activeTab === "lyrics"
                    ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                    : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  activeTab === "lyrics"
                    ? "0 0 16px rgba(139, 92, 246, 0.4)"
                    : "0 0 16px rgba(14, 165, 233, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              {activeTab === "lyrics" ? (
                <Music size={18} color="#ffffff" />
              ) : (
                <BookOpen size={18} color="#ffffff" />
              )}
            </div>
            <div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "#ffffff",
                }}
              >
                EasyStream{" "}
                <span
                  style={{
                    color: activeTab === "lyrics" ? "#a78bfa" : "#38bdf8",
                  }}
                >
                  V2
                </span>
              </div>
              <div
                style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}
              >
                {activeTab === "lyrics"
                  ? "Worship Lyrics Presenter"
                  : "Scripture & Countdown Presenter"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "3px 10px",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              fontSize: "11px",
              color: "#94a3b8",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: isConnected ? "#10b981" : "#ef4444",
                boxShadow: isConnected ? "0 0 8px #10b981" : "none",
              }}
            />
            <span>
              Session: <strong>{sessionId}</strong>
            </span>
          </div>
        </div>

        {/* Right Actions: Display Screen & Studio Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {liveFeedback && (
            <span
              style={{
                fontSize: "12px",
                color: "#34d399",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 700,
              }}
            >
              <CheckCheck size={16} /> Sent Live!
            </span>
          )}
          {lyricSaveFeedback && (
            <span
              style={{
                fontSize: "12px",
                color: "#c084fc",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontWeight: 700,
              }}
            >
              <CheckCheck size={16} /> {lyricSaveFeedback}
            </span>
          )}

          {/* Clear Text & Blackout Toggles & Typography Settings */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() =>
                onUpdateLiveState({ isClearText: !state.liveState.isClearText })
              }
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                background: state.liveState.isClearText
                  ? "#f59e0b"
                  : "rgba(255, 255, 255, 0.06)",
                color: state.liveState.isClearText ? "#000000" : "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Clear scripture text from display (keeps background)"
            >
              Clear Text
            </button>
            <button
              onClick={() =>
                onUpdateLiveState({ isBlackout: !state.liveState.isBlackout })
              }
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                background: state.liveState.isBlackout
                  ? "#ef4444"
                  : "rgba(255, 255, 255, 0.06)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Blackout entire display screen"
            >
              Blackout
            </button>
          </div>

          {/* Quick Display Screen Launcher */}
          <button
            onClick={() =>
              openBorderlessWindow("/display", "easypresenter_display")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e2e8f0",
              textDecoration: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Switch back to Full EasyPresenter 3-Column Studio"
          >
            <Layout size={13} />
            <span>Studio</span>
          </a>

          {/* Subtle separator */}
          <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.12)", margin: "0 2px" }} />

          {/* General Settings (Scripture & Lyrics Formatting) Button */}
          <button
            id="v2-general-settings-button"
            onClick={() => {
              setFormatModalTab(activeTab === 'lyrics' ? 'lyrics' : 'scripture');
              setShowTypographyModal(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              background: showTypographyModal
                ? "rgba(56, 189, 248, 0.25)"
                : "rgba(255, 255, 255, 0.08)",
              border: showTypographyModal
                ? "1.5px solid #38bdf8"
                : "1px solid rgba(255, 255, 255, 0.18)",
              color: showTypographyModal ? "#38bdf8" : "#f1f5f9",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: showTypographyModal ? "0 0 12px rgba(56, 189, 248, 0.35)" : "none",
            }}
            title="General Settings: Scripture & Lyrics formatting, fonts, colors, and layout"
            aria-label="General Settings"
          >
            <Settings size={14} color="#38bdf8" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* ============================================================= */}
      {/* 2. DEDICATED COUNTDOWN TIMER CONTROL BAR                      */}
      {/* ============================================================= */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px",
          background: "linear-gradient(90deg, #0b1120 0%, #0f172a 100%)",
          borderBottom: "1px solid rgba(56, 189, 248, 0.15)",
          flexShrink: 0,
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        {/* Left: Timer Display & Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "rgba(0, 0, 0, 0.4)",
              padding: "3px 12px",
              borderRadius: "8px",
              border: `1.5px solid ${isOvertime ? "#ef4444" : isCritical ? "#f97316" : isWarning ? "#f59e0b" : "#38bdf8"}`,
              boxShadow: `0 0 14px ${isOvertime ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.2)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                COUNTDOWN
              </span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  background:
                    state.timerState.status === "running"
                      ? "rgba(16, 185, 129, 0.2)"
                      : state.timerState.status === "paused"
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(100, 116, 139, 0.2)",
                  color:
                    state.timerState.status === "running"
                      ? "#34d399"
                      : state.timerState.status === "paused"
                        ? "#fbbf24"
                        : "#94a3b8",
                }}
              >
                {state.timerState.status.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                fontFamily: "Montserrat, monospace",
                fontSize: "26px",
                fontWeight: 900,
                color: isOvertime
                  ? "#ef4444"
                  : isCritical
                    ? "#f97316"
                    : isWarning
                      ? "#f59e0b"
                      : "#38bdf8",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formattedCountdown}
            </div>
          </div>

          {/* Transport Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={handleStartOrPauseTimer}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "8px",
                background:
                  state.timerState.status === "running"
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow:
                  state.timerState.status === "running"
                    ? "0 0 12px rgba(245, 158, 11, 0.4)"
                    : "0 0 12px rgba(16, 185, 129, 0.4)",
              }}
            >
              {state.timerState.status === "running" ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
              <span>
                {state.timerState.status === "running" ? "Pause" : "Start"}
              </span>
            </button>

            <button
              onClick={onResetTimer}
              style={{
                padding: "7px 10px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                fontWeight: 600,
              }}
              title="Reset countdown to duration"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {/* +1m, -1m, +5m quick adjustments */}
            <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
              <button
                onClick={() => adjustTimer(-60)}
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title="Subtract 1 minute"
              >
                -1m
              </button>
              <button
                onClick={() => adjustTimer(60)}
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title="Add 1 minute"
              >
                +1m
              </button>
              <button
                onClick={() => adjustTimer(300)}
                style={{
                  padding: "5px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#94a3b8",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                title="Add 5 minutes"
              >
                +5m
              </button>
            </div>
          </div>
        </div>

        {/* Center: Presets & Custom Duration Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
            PRESETS:
          </span>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {TIMER_PRESETS.map((p) => (
              <button
                key={p.sec}
                onClick={() => handleSelectPreset(p.sec, p.label)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#e2e8f0",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom MM:SS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <input
              type="number"
              min="0"
              max="180"
              value={customTimerMinutes}
              onChange={(e) => setCustomTimerMinutes(e.target.value)}
              style={{
                width: "36px",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
              title="Minutes"
            />
            <span style={{ color: "#64748b", fontWeight: 800 }}>:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={customTimerSeconds}
              onChange={(e) => setCustomTimerSeconds(e.target.value)}
              style={{
                width: "32px",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                textAlign: "center",
                outline: "none",
              }}
              title="Seconds"
            />
            <input
              type="text"
              placeholder="Label"
              value={timerTitleInput}
              onChange={(e) => setTimerTitleInput(e.target.value)}
              style={{
                width: "110px",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                padding: "3px 6px",
                fontSize: "11px",
                color: "#ffffff",
                outline: "none",
              }}
              title="Countdown label / slot name"
            />
            <button
              onClick={handleApplyCustomTimer}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                background: "#38bdf8",
                color: "#000000",
                fontSize: "11px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
              }}
            >
              Set
            </button>
          </div>
        </div>

        {/* Right: Display Sync Toggle, Timer Scale & Prompt Message */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Inline Timer Font Size Control */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(0, 0, 0, 0.35)",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            title="Scale the countdown timer font size on the live display screen"
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              Size:
            </span>
            <button
              onClick={() => {
                const cur = state.timerState.fontSizeScale || 100;
                const next = Math.max(50, cur - 10);
                setTimerConfig({ fontSizeScale: next });
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Decrease timer font size (-10%)"
            >
              <Minus size={11} />
            </button>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#38bdf8",
                minWidth: "38px",
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {state.timerState.fontSizeScale || 100}%
            </span>
            <button
              onClick={() => {
                const cur = state.timerState.fontSizeScale || 100;
                const next = Math.min(250, cur + 10);
                setTimerConfig({ fontSizeScale: next });
              }}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Increase timer font size (+10%)"
            >
              <Plus size={11} />
            </button>
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 700,
              color: state.timerState.showOnDisplay ? "#38bdf8" : "#94a3b8",
            }}
            title="When active, the countdown timer appears on the top of DisplayView screen"
          >
            <input
              type="checkbox"
              checked={Boolean(state.timerState.showOnDisplay)}
              onChange={toggleShowOnDisplay}
              style={{ accentColor: "#38bdf8", cursor: "pointer" }}
            />
            <span>Show on Display</span>
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <input
              type="text"
              placeholder="Live prompt (e.g. Wrap up)"
              value={quickAlertInput}
              onChange={(e) => setQuickAlertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendPromptMessage();
              }}
              style={{
                width: "150px",
                background: "rgba(0, 0, 0, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                padding: "4px 8px",
                fontSize: "11px",
                color: "#ffffff",
                outline: "none",
              }}
            />
            <button
              onClick={
                isAlertActive
                  ? handleClearPromptMessage
                  : handleSendPromptMessage
              }
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: isAlertActive
                  ? "#ef4444"
                  : "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: "none",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isAlertActive ? "Clear" : "Send"}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* 3. PROJECTION WORKSPACE (3-COLUMN DUAL MONITORS & DATA GRID) */}
      {/* ============================================================= */}
      <EasyWorshipWorkspace
        state={state}
        onSetLines={onSetLines}
        onJumpTo={onJumpTo}
        onUpdateLiveState={onUpdateLiveState}
        onUpdateTheme={onUpdateTheme}
        onSaveLibraryItem={onSaveLibraryItem}
        onAddToSchedule={onAddToSchedule}
        onOpenSongEditor={() => {
          setEditingSong(null);
          setIsSongEditorOpen(true);
        }}
        splitMode={splitMode}
        includeReferenceOnSlide={includeReferenceOnSlide}
        formatSlidesFromData={formatSlidesFromData}
        combinedSongResults={combinedSongResults}
        liveFeedback={liveFeedback}
        setLiveFeedback={setLiveFeedback}
      />

      {/* ============================================================= */}
      {/* GENERAL FORMATTING SETTINGS MODAL (SCRIPTURE & LYRICS TABS)  */}
      {/* ============================================================= */}
      <FormatSettingsModal
        isOpen={showTypographyModal}
        onClose={() => setShowTypographyModal(false)}
        theme={state.theme}
        timerState={state.timerState}
        onUpdateTheme={onUpdateTheme || (() => {})}
        onSetTimerConfig={setTimerConfig}
        initialTab={formatModalTab}
        activeCategory={state.category}
        sampleTitle={state.title}
        sampleVerse={state.lines[state.cur] || ''}
      />

      {/* ============================================================= */}
      {/* SONG BANK MANUAL LYRIC ADD & EDIT MODAL                        */}
      {/* ============================================================= */}
      <SongBankEditorModal
        isOpen={isSongEditorOpen}
        onClose={() => setIsSongEditorOpen(false)}
        initialSong={editingSong}
        onSave={handleSaveSongFromEditor}
        onSaveAndGoLive={handleSaveAndGoLiveFromEditor}
        onSaveAndAddToSchedule={handleSaveAndAddToScheduleFromEditor}
      />
    </div>
  );
};
