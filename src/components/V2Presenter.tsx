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
      {/* 2.5. PROJECTION MODE TABS (UNDER TIME CONTROL SECTION)        */}
      {/* ============================================================= */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px",
          background: "linear-gradient(90deg, #0a0f1d 0%, #0d1527 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Segmented Pill Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(0, 0, 0, 0.55)",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setActiveTab("scripture")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 18px",
                borderRadius: "7px",
                background:
                  activeTab === "scripture"
                    ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
                    : "transparent",
                color: activeTab === "scripture" ? "#ffffff" : "#94a3b8",
                fontWeight: 800,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow:
                  activeTab === "scripture"
                    ? "0 0 16px rgba(14, 165, 233, 0.45)"
                    : "none",
                transition: "all 0.15s ease",
              }}
              title="Switch to Scripture Presentation mode (Bible books, chapters, verses)"
            >
              <BookOpen size={15} />
              <span>Scripture Projection</span>
            </button>

            <button
              onClick={() => setActiveTab("lyrics")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 18px",
                borderRadius: "7px",
                background:
                  activeTab === "lyrics"
                    ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                    : "transparent",
                color: activeTab === "lyrics" ? "#ffffff" : "#94a3b8",
                fontWeight: 800,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow:
                  activeTab === "lyrics"
                    ? "0 0 16px rgba(139, 92, 246, 0.45)"
                    : "none",
                transition: "all 0.15s ease",
              }}
              title="Switch to Lyric Presentation mode (Search church local library & online worship songs)"
            >
              <Music size={15} />
              <span>Lyric Projection</span>
            </button>
          </div>
        </div>

        {/* Right Contextual Helper */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {activeTab === "scripture" ? (
            <span
              style={{
                fontSize: "11px",
                color: "#38bdf8",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <BookOpen size={13} />
              <span>
                66 Books • Chapters • Verses • Multi-Version Quick Navigation
              </span>
            </span>
          ) : (
            <span
              style={{
                fontSize: "11px",
                color: "#c084fc",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Music size={13} />
              <span>
                Church Library • Online LRCLIB Catalog • Smart Stanza Split
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. PROMINENT SEARCH BAR (SCRIPTURE VS LYRICS)                  */}
      {/* ============================================================= */}
      {activeTab === "lyrics" ? (
        <section
          style={{
            padding: "12px 20px",
            background: "rgba(15, 23, 42, 0.85)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              position: "relative",
            }}
          >
            {/* Lyric Search Input with Suggestions */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={18}
                color="#a78bfa"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                }}
              />
              <input
                ref={lyricSearchInputRef}
                type="text"
                value={lyricsQuery}
                onChange={(e) => {
                  setLyricsQuery(e.target.value);
                  setShowLyricSuggestions(true);
                  setActiveLyricIndex(-1);
                }}
                onFocus={() => {
                  if (lyricsQuery.trim()) setShowLyricSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (showLyricSuggestions && lyricSuggestions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveLyricIndex((prev) =>
                        prev < lyricSuggestions.length - 1 ? prev + 1 : 0,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveLyricIndex((prev) =>
                        prev > 0 ? prev - 1 : lyricSuggestions.length - 1,
                      );
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (
                        activeLyricIndex >= 0 &&
                        activeLyricIndex < lyricSuggestions.length
                      ) {
                        handleSelectLyricSuggestion(
                          lyricSuggestions[activeLyricIndex],
                        );
                      } else {
                        setShowLyricSuggestions(false);
                      }
                    } else if (e.key === "Escape") {
                      setShowLyricSuggestions(false);
                    }
                  } else if (e.key === "Enter") {
                    if (combinedSongResults.length > 0) {
                      handleSelectSong(combinedSongResults[0]);
                    }
                  }
                }}
                placeholder="Search worship songs by title, artist, or lyric lines (Local library & online catalog)..."
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 44px",
                  borderRadius: "10px",
                  background: "rgba(0, 0, 0, 0.45)",
                  border: "1.5px solid rgba(139, 92, 246, 0.35)",
                  boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  outline: "none",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  zIndex: 2,
                }}
              >
                {lyricsLoading && (
                  <Loader2 size={16} color="#a78bfa" className="animate-spin" />
                )}
                {lyricsQuery && (
                  <button
                    onClick={() => {
                      setLyricsQuery("");
                      setShowLyricSuggestions(false);
                    }}
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                    title="Clear query"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {showLyricSuggestions && lyricSuggestions.length > 0 && (
                <div
                  ref={lyricSuggestionsRef}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "#0b1120",
                    border: "1px solid rgba(139, 92, 246, 0.35)",
                    borderRadius: "10px",
                    boxShadow:
                      "0 15px 35px rgba(0, 0, 0, 0.8), 0 0 25px rgba(139, 92, 246, 0.2)",
                    zIndex: 100,
                    overflow: "hidden",
                    maxHeight: "320px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 14px",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      justifyContent: "space-between",
                      background: "rgba(15, 23, 42, 0.8)",
                    }}
                  >
                    <span>Suggested Songs</span>
                    <span>Local & Online</span>
                  </div>
                  {lyricSuggestions.map((sug, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <div
                        key={`${sug.title}-${idx}`}
                        onClick={() => handleSelectLyricSuggestion(sug)}
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          background: isActive
                            ? "rgba(139, 92, 246, 0.2)"
                            : "transparent",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          transition: "background 0.1s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {sug.isLocal ? (
                            <HardDrive size={15} color="#34d399" />
                          ) : (
                            <Globe size={15} color="#a78bfa" />
                          )}
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#ffffff",
                              }}
                            >
                              {sug.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {sug.artist}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: sug.isLocal
                              ? "rgba(16, 185, 129, 0.18)"
                              : "rgba(139, 92, 246, 0.18)",
                            color: sug.isLocal ? "#34d399" : "#c084fc",
                            border: sug.isLocal
                              ? "1px solid rgba(16, 185, 129, 0.35)"
                              : "1px solid rgba(139, 92, 246, 0.35)",
                          }}
                        >
                          {sug.isLocal ? "Church Library" : "Online"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scope Filter Pills: All | Local Library | Online Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(0, 0, 0, 0.45)",
                padding: "3px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                gap: "3px",
              }}
            >
              <button
                onClick={() => setLyricsScope("all")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background:
                    lyricsScope === "all"
                      ? "rgba(139, 92, 246, 0.25)"
                      : "transparent",
                  color: lyricsScope === "all" ? "#c084fc" : "#94a3b8",
                  border:
                    lyricsScope === "all"
                      ? "1px solid #8b5cf6"
                      : "1px solid transparent",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>All ({combinedSongResults.length})</span>
              </button>

              <button
                onClick={() => setLyricsScope("local")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background:
                    lyricsScope === "local"
                      ? "rgba(16, 185, 129, 0.25)"
                      : "transparent",
                  color: lyricsScope === "local" ? "#34d399" : "#94a3b8",
                  border:
                    lyricsScope === "local"
                      ? "1px solid #10b981"
                      : "1px solid transparent",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Search and browse local church song library only"
              >
                <HardDrive size={12} />
                <span>Local ({localSongMatches.length})</span>
              </button>

              <button
                onClick={() => setLyricsScope("online")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  background:
                    lyricsScope === "online"
                      ? "rgba(56, 189, 248, 0.25)"
                      : "transparent",
                  color: lyricsScope === "online" ? "#38bdf8" : "#94a3b8",
                  border:
                    lyricsScope === "online"
                      ? "1px solid #38bdf8"
                      : "1px solid transparent",
                  fontSize: "11px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                title="Search online worship lyrics catalog directly"
              >
                <Globe size={12} />
                <span>Online ({onlineSongResults.length})</span>
              </button>
            </div>

            {/* Split Mode Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(0, 0, 0, 0.45)",
                padding: "3px 8px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
              title="How song lyrics are split into presentation slides"
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                Split:
              </span>
              <select
                value={lyricsSplitMode}
                onChange={(e) => setLyricsSplitMode(e.target.value as any)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="lines" style={{ background: "#0f172a" }}>
                  1 Line / Slide
                </option>
                <option value="smart" style={{ background: "#0f172a" }}>
                  Smart 2 (2 Lines)
                </option>
                <option value="smart3" style={{ background: "#0f172a" }}>
                  Smart 3 (3 Lines)
                </option>
                <option value="stanzas" style={{ background: "#0f172a" }}>
                  Full Stanzas
                </option>
              </select>
            </div>

            {/* Manual Add / Paste Lyric Button */}
            <button
              onClick={handleOpenAddSong}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                background:
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.18) 100%)",
                border: "1.5px solid rgba(139, 92, 246, 0.5)",
                color: "#c084fc",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                boxShadow: "0 0 15px rgba(139, 92, 246, 0.2)",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
              title="Manually paste or write lyrics to add a worship song to your bank"
            >
              <Plus size={14} />
              <span>Manual Add Lyric</span>
            </button>
          </div>

          {/* Popular Worship Quick Jump Chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
                flexShrink: 0,
              }}
            >
              Popular Songs:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap" }}>
              {POPULAR_WORSHIP_SONGS.slice(0, 10).map((song) => (
                <button
                  key={song.title}
                  onClick={() => {
                    setLyricsQuery(song.title);
                    setShowLyricSuggestions(false);
                  }}
                  style={{
                    padding: "3px 9px",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "#e2e8f0",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.1s",
                  }}
                >
                  {song.title}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section
          style={{
            padding: "12px 20px",
            background: "rgba(15, 23, 42, 0.85)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              position: "relative",
            }}
          >
            {/* Main Search Input with Dynamic Dropdown Suggestions */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={18}
                color="#38bdf8"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;

                  // 1. Spaced verse with trailing space: e.g. "John 3 16 " -> "John 3:16-"
                  const spacedVerseTrailingSpace = val.match(
                    /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)\s+$/,
                  );
                  if (spacedVerseTrailingSpace) {
                    const bookCandidate = spacedVerseTrailingSpace[1].trim();
                    const chapterNum = spacedVerseTrailingSpace[2];
                    const verseNum = spacedVerseTrailingSpace[3];
                    const matchedBook = findBestBookMatch(bookCandidate);
                    const canonicalBook = matchedBook
                      ? matchedBook.name
                      : bookCandidate;
                    updateQueryAndFocusEnd(
                      `${canonicalBook} ${chapterNum}:${verseNum}-`,
                    );
                    return;
                  }

                  // 2. Spaced verse auto-format without trailing space: e.g. "John 3 16" -> "John 3:16"
                  const spacedVerseMatch = val.match(
                    /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)$/,
                  );
                  if (spacedVerseMatch) {
                    const bookCandidate = spacedVerseMatch[1].trim();
                    const chapterNum = spacedVerseMatch[2];
                    const verseNum = spacedVerseMatch[3];
                    const matchedBook = findBestBookMatch(bookCandidate);
                    const canonicalBook = matchedBook
                      ? matchedBook.name
                      : bookCandidate;
                    updateQueryAndFocusEnd(
                      `${canonicalBook} ${chapterNum}:${verseNum}`,
                    );
                    return;
                  }

                  // 3. Auto-insert "-" if user typed space after verse number (e.g. "John 3:16 " -> "John 3:16-")
                  const trailingSpaceAfterVerse = val.match(
                    /^([1-3]?\s*[a-zA-Z\s]+?\s+\d+:\d+)\s+$/,
                  );
                  if (trailingSpaceAfterVerse) {
                    updateQueryAndFocusEnd(`${trailingSpaceAfterVerse[1]}-`);
                    return;
                  }

                  // 4. Auto-insert colon if user typed space after chapter number (e.g. "John 3 " -> "John 3:")
                  const trailingSpaceAfterChapter = val.match(
                    /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+$/,
                  );
                  if (trailingSpaceAfterChapter) {
                    const bookCandidate = trailingSpaceAfterChapter[1].trim();
                    const chapterNum = trailingSpaceAfterChapter[2];
                    const matchedBook = findBestBookMatch(bookCandidate);
                    const canonicalBook = matchedBook
                      ? matchedBook.name
                      : bookCandidate;
                    updateQueryAndFocusEnd(`${canonicalBook} ${chapterNum}:`);
                    return;
                  }

                  // 5. Auto-complete book name on trailing space (e.g. "joh " -> "John ", "1cor " -> "1 Corinthians ")
                  const trailingSpaceAfterBook = val.match(
                    /^([1-3]?\s*[a-zA-Z]{2,})\s+$/,
                  );
                  if (trailingSpaceAfterBook) {
                    const bookCandidate = trailingSpaceAfterBook[1].trim();
                    const matchedBook = findBestBookMatch(bookCandidate);
                    if (
                      matchedBook &&
                      matchedBook.name.toLowerCase() !== val.trim().toLowerCase()
                    ) {
                      updateQueryAndFocusEnd(`${matchedBook.name} `);
                      return;
                    }
                  }

                  // 6. Auto-normalize book name if colon is typed directly after chapter (e.g. "joh 3:" -> "John 3:")
                  const directColonMatch = val.match(
                    /^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+):$/,
                  );
                  if (directColonMatch) {
                    const bookCandidate = directColonMatch[1].trim();
                    const chapterNum = directColonMatch[2];
                    const matchedBook = findBestBookMatch(bookCandidate);
                    if (
                      matchedBook &&
                      matchedBook.name.toLowerCase() !==
                        bookCandidate.toLowerCase()
                    ) {
                      updateQueryAndFocusEnd(
                        `${matchedBook.name} ${chapterNum}:`,
                      );
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
                  if (e.key === "Tab" || e.key === " ") {
                    const trimmed = searchQuery.trim();

                    // A. If suggestions list is visible and user navigated to an active item
                    if (
                      showSuggestions &&
                      suggestions.length > 0 &&
                      activeSuggestionIndex >= 0
                    ) {
                      const activeSug = suggestions[activeSuggestionIndex];
                      e.preventDefault();
                      if (activeSug.type === "book") {
                        updateQueryAndFocusEnd(`${activeSug.text} `);
                      } else if (activeSug.type === "chapter") {
                        updateQueryAndFocusEnd(`${activeSug.text}:`);
                      } else if (
                        activeSug.type === "verse" ||
                        activeSug.type === "version"
                      ) {
                        updateQueryAndFocusEnd(activeSug.text);
                      } else {
                        updateQueryAndFocusEnd(activeSug.text);
                      }
                      return;
                    }

                    // B. Verse entered with colon (e.g. "John 3:16", "Romans 8:28", "Psalm 23:1")
                    // -> Auto-insert "-" on Space key so user can type end verse or press Enter
                    const bookVerseMatch = trimmed.match(
                      /^([1-3]?\s*[a-zA-Z\s]+?\s+\d+:\d+)$/,
                    );
                    if (bookVerseMatch && e.key === " ") {
                      e.preventDefault();
                      updateQueryAndFocusEnd(`${trimmed}-`);
                      return;
                    }

                    // C. Spaced verse without colon (e.g. "John 3 16", "Gen 1 1")
                    // -> Auto-format to colon and insert "-" on Space key
                    const spacedVerseMatch = trimmed.match(
                      /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)$/,
                    );
                    if (spacedVerseMatch && e.key === " ") {
                      e.preventDefault();
                      const bookPart = spacedVerseMatch[1].trim();
                      const chapterPart = spacedVerseMatch[2];
                      const versePart = spacedVerseMatch[3];
                      const matchedBook = findBestBookMatch(bookPart);
                      const canonicalBook = matchedBook
                        ? matchedBook.name
                        : bookPart;
                      updateQueryAndFocusEnd(
                        `${canonicalBook} ${chapterPart}:${versePart}-`,
                      );
                      return;
                    }

                    // D. Chapter entered without colon (e.g. "John 3", "Gen 1", "Rom 8", "1 Cor 13")
                    // -> Autocomplete/normalize book, keep chapter, and auto-insert ":"
                    const bookChapterMatch = trimmed.match(
                      /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)$/,
                    );
                    if (bookChapterMatch) {
                      e.preventDefault();
                      const bookPart = bookChapterMatch[1].trim();
                      const chapterPart = bookChapterMatch[2];
                      const matchedBook = findBestBookMatch(bookPart);
                      const canonicalBook = matchedBook
                        ? matchedBook.name
                        : bookPart;
                      updateQueryAndFocusEnd(
                        `${canonicalBook} ${chapterPart}:`,
                      );
                      return;
                    }

                    // E. Book name typing (e.g. "joh", "gen", "1co", "matt", "rom", "psa")
                    // Do not intercept if user just typed single digit "1", "2", "3" with space
                    if (e.key === " " && /^[1-3]$/.test(trimmed)) {
                      // Let space pass through so user can type "1 Cor", "2 Kings", etc.
                      return;
                    }

                    // Match book abbreviation or partial name
                    const bookOnlyMatch = trimmed.match(
                      /^([1-3]?\s*[a-zA-Z\s]+)$/,
                    );
                    if (bookOnlyMatch) {
                      const matchedBook = findBestBookMatch(trimmed);
                      if (matchedBook) {
                        e.preventDefault();
                        updateQueryAndFocusEnd(`${matchedBook.name} `);
                        return;
                      }
                    }

                    // F. If at chapter with colon (e.g. "John 3:") and user hits TAB
                    // Autocomplete to top verse suggestion (e.g. "John 3:16" or "John 3:1")
                    if (
                      e.key === "Tab" &&
                      showSuggestions &&
                      suggestions.length > 0
                    ) {
                      e.preventDefault();
                      const topSug = suggestions[0];
                      if (topSug.type === "verse") {
                        updateQueryAndFocusEnd(topSug.text);
                      } else if (topSug.type === "book") {
                        updateQueryAndFocusEnd(`${topSug.text} `);
                      } else if (topSug.type === "chapter") {
                        updateQueryAndFocusEnd(`${topSug.text}:`);
                      } else {
                        updateQueryAndFocusEnd(topSug.text);
                      }
                      return;
                    }
                  }

                  if (showSuggestions && suggestions.length > 0) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveSuggestionIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : 0,
                      );
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveSuggestionIndex((prev) =>
                        prev > 0 ? prev - 1 : suggestions.length - 1,
                      );
                      return;
                    }
                    if (e.key === "Escape") {
                      setShowSuggestions(false);
                      return;
                    }
                  }

                  // ENTER: GO LIVE (INSTANT BROADCAST TO SCREEN)
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setShowSuggestions(false);
                    const targetQuery =
                      showSuggestions &&
                      activeSuggestionIndex >= 0 &&
                      suggestions[activeSuggestionIndex]
                        ? suggestions[activeSuggestionIndex].text
                        : searchQuery;
                    setSearchQuery(targetQuery);
                    fetchScripture(targetQuery, selectedVersion, true);
                    return;
                  }
                }}
                placeholder="Search reference e.g., 'John 3:16', 'Gen 1', 'Romans 8:28', 'Psalm 23'..."
                style={{
                  width: "100%",
                  padding: "11px 44px 11px 44px",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "1.5px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  outline: "none",
                  boxShadow: "0 0 20px rgba(56, 189, 248, 0.15)",
                  boxSizing: "border-box",
                }}
              />

              {loading && (
                <RefreshCw
                  size={16}
                  color="#38bdf8"
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    animation: "spin 1s linear infinite",
                    zIndex: 2,
                  }}
                />
              )}

              {/* LIVE AUTOCOMPLETE SUGGESTIONS DROPDOWN (LIKE SCRIPTURE MODAL) */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsContainerRef}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "#0f172a",
                    border: "1.5px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: "10px",
                    boxShadow:
                      "0 20px 40px rgba(0, 0, 0, 0.85), 0 0 20px rgba(56, 189, 248, 0.2)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  {suggestions.map((sug, idx) => {
                    const isActive = idx === activeSuggestionIndex;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          background: isActive
                            ? "rgba(56, 189, 248, 0.2)"
                            : "transparent",
                          borderBottom:
                            idx < suggestions.length - 1
                              ? "1px solid rgba(255, 255, 255, 0.06)"
                              : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(sug);
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "9px",
                          }}
                        >
                          <BookOpen size={14} color="#38bdf8" />
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#ffffff",
                            }}
                          >
                            {sug.label}
                          </span>
                          {sug.subLabel && (
                            <span
                              style={{ fontSize: "11px", color: "#94a3b8" }}
                            >
                              • {sug.subLabel}
                            </span>
                          )}
                        </div>
                        {sug.badge && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              background: "rgba(56, 189, 248, 0.15)",
                              color: "#38bdf8",
                              borderRadius: "4px",
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{ fontSize: "11px", color: "#64748b", fontWeight: 800 }}
              >
                TRANSLATION:
              </span>
              <select
                value={selectedVersion}
                onChange={(e) => {
                  const newVer = e.target.value;
                  setSelectedVersion(newVer);
                  const targetQuery =
                    scriptureResult?.reference || searchQuery.trim();
                  const currentVerseNum =
                    scriptureResult?.verses?.[selectedSlideIndex]?.verse ??
                    null;
                  if (targetQuery) {
                    fetchScripture(targetQuery, newVer, true, currentVerseNum);
                  }
                }}
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: "8px",
                  color: "#38bdf8",
                  fontWeight: 800,
                  fontSize: "13px",
                  padding: "10px 14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {AVAILABLE_BIBLE_VERSIONS.map((v) => (
                  <option
                    key={v.id}
                    value={v.id}
                    style={{ background: "#0f172a", color: "#ffffff" }}
                  >
                    {v.id} - {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Split Mode Options */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <button
                onClick={() => setSplitMode("verse")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    splitMode === "verse"
                      ? "rgba(56, 189, 248, 0.25)"
                      : "rgba(255, 255, 255, 0.04)",
                  border:
                    splitMode === "verse"
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  color: splitMode === "verse" ? "#38bdf8" : "#94a3b8",
                }}
                title="1 verse per slide (EasyWorship default, large readable text)"
              >
                1 Verse/Slide
              </button>
              <button
                onClick={() => setSplitMode("double")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    splitMode === "double"
                      ? "rgba(56, 189, 248, 0.25)"
                      : "rgba(255, 255, 255, 0.04)",
                  border:
                    splitMode === "double"
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  color: splitMode === "double" ? "#38bdf8" : "#94a3b8",
                }}
                title="2 verses per slide"
              >
                2 Verses/Slide
              </button>
              <button
                onClick={() => setSplitMode("full")}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background:
                    splitMode === "full"
                      ? "rgba(56, 189, 248, 0.25)"
                      : "rgba(255, 255, 255, 0.04)",
                  border:
                    splitMode === "full"
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  color: splitMode === "full" ? "#38bdf8" : "#94a3b8",
                }}
                title="Full passage on single slide"
              >
                Full Chapter
              </button>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "11px",
                  color: "#94a3b8",
                  cursor: "pointer",
                  marginLeft: "6px",
                }}
                title="Include reference tag on each slide footer"
              >
                <input
                  type="checkbox"
                  checked={includeReferenceOnSlide}
                  onChange={(e) => setIncludeReferenceOnSlide(e.target.checked)}
                  style={{ accentColor: "#38bdf8", cursor: "pointer" }}
                />
                <span>Citation Tag</span>
              </label>
            </div>

            {/* Search Action Button */}
            <button
              onClick={() => fetchScripture(searchQuery, selectedVersion, true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(14, 165, 233, 0.4)",
              }}
            >
              <Search size={15} />
              <span>Search & Go Live</span>
            </button>
          </div>

          {/* Popular scripture pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#64748b",
                flexShrink: 0,
              }}
            >
              QUICK JUMP:
            </span>
            {POPULAR_SCRIPTURES.map((p) => (
              <button
                key={p.query}
                onClick={() => {
                  setSearchQuery(p.query);
                  fetchScripture(p.query, selectedVersion, true);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#cbd5e1",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {searchError && (
            <div
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertTriangle size={14} />
              <span>{searchError}</span>
            </div>
          )}
        </section>
      )}

      {/* ============================================================= */}
      {/* 4. MAIN WORKSPACE: SCRIPTURE OR LYRIC PRESENTATION + DECK     */}
      {/* ============================================================= */}
      <main
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          background: "#090d16",
        }}
      >
        {activeTab === "lyrics" ? (
          <>
            {/* PANEL L1: WORSHIP SONG REPOSITORY & SEARCH RESULTS (Local & Online) */}
            <div
              style={{
                width: "320px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.65)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <button
                    onClick={handleOpenAddSong}
                    style={{
                      padding: "4px 9px",
                      borderRadius: "6px",
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "0 0 10px rgba(139, 92, 246, 0.35)",
                      whiteSpace: "nowrap",
                    }}
                    title="Add new song or paste lyrics manually to Song Bank"
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>

                  {/* Scope selector */}
                  <div
                    style={{
                      display: "flex",
                      background: "rgba(0, 0, 0, 0.4)",
                      padding: "2px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    {(
                      [
                        { id: "all", label: "All" },
                        { id: "local", label: "Local" },
                        { id: "online", label: "Online" },
                      ] as const
                    ).map((scope) => (
                      <button
                        key={scope.id}
                        onClick={() => setLyricsScope(scope.id)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          background:
                            lyricsScope === scope.id
                              ? "#8b5cf6"
                              : "transparent",
                          color:
                            lyricsScope === scope.id ? "#ffffff" : "#94a3b8",
                          transition: "all 0.12s",
                        }}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-header status badge */}
              <div
                style={{
                  padding: "7px 16px",
                  background: "rgba(0, 0, 0, 0.25)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#94a3b8",
                  }}
                >
                  {lyricsScope === "local" ? (
                    <>
                      <HardDrive size={13} color="#34d399" />
                      <span>Church Local Library</span>
                    </>
                  ) : lyricsScope === "online" ? (
                    <>
                      <Globe size={13} color="#a78bfa" />
                      <span>Online LRCLIB Catalog</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} color="#60a5fa" />
                      <span>Local Church Library + Online</span>
                    </>
                  )}
                </div>
                {lyricsLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#c084fc",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    <Loader2 size={12} className="animate-spin" />
                    <span>Searching...</span>
                  </div>
                )}
              </div>

              {/* Song list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {combinedSongResults.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "30px 20px",
                      color: "#64748b",
                    }}
                  >
                    <Music
                      size={36}
                      color="#475569"
                      style={{ marginBottom: "12px" }}
                    />
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#cbd5e1",
                        marginBottom: "6px",
                      }}
                    >
                      {lyricsLoading
                        ? "Searching Online Catalog..."
                        : "No Worship Songs Found"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        lineHeight: 1.5,
                        maxWidth: "260px",
                        marginBottom: "12px",
                      }}
                    >
                      {lyricsScope === "local"
                        ? 'No matches in your local church library. Try switching scope to "All" or "Online" to fetch from LRCLIB.'
                        : 'Try searching with common worship titles like "Way Maker", "Goodness of God", "Amazing Grace", or "Gratitude".'}
                    </div>
                    <button
                      onClick={handleOpenAddSong}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: "rgba(139, 92, 246, 0.22)",
                        border: "1px solid rgba(139, 92, 246, 0.45)",
                        color: "#c084fc",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title="Paste lyrics and add a song manually to your Song Bank"
                    >
                      <Plus size={13} />
                      <span>Paste / Add Song to Bank</span>
                    </button>
                  </div>
                ) : (
                  combinedSongResults.map((song) => {
                    const isSelected = selectedSong?.id === song.id;
                    const isCurrentlyLive =
                      state.category === "song" &&
                      state.title?.toLowerCase() ===
                        song.trackName.toLowerCase() &&
                      !state.liveState.isBlackout;

                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song)}
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: isCurrentlyLive
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(139, 92, 246, 0.12) 100%)"
                            : isSelected
                              ? "linear-gradient(135deg, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0.14) 100%)"
                              : "rgba(255, 255, 255, 0.03)",
                          border: isCurrentlyLive
                            ? "1.5px solid rgba(239, 68, 68, 0.85)"
                            : isSelected
                              ? "1.5px solid rgba(167, 139, 250, 0.7)"
                              : "1px solid rgba(255, 255, 255, 0.06)",
                          boxShadow: isCurrentlyLive
                            ? "0 4px 20px rgba(239, 68, 68, 0.35)"
                            : isSelected
                              ? "0 6px 20px rgba(139, 92, 246, 0.25)"
                              : "none",
                          transition: "all 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        {/* Top: Title & Scope Badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 800,
                                color: isSelected ? "#ffffff" : "#f1f5f9",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {song.trackName}
                            </span>
                            {isCurrentlyLive && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 900,
                                  background: "#ef4444",
                                  color: "#ffffff",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              >
                                LIVE
                              </span>
                            )}
                          </div>

                          {song.isLocal ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(16, 185, 129, 0.18)",
                                border: "1px solid rgba(16, 185, 129, 0.35)",
                                color: "#34d399",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                flexShrink: 0,
                              }}
                            >
                              <HardDrive size={10} /> BANK
                            </span>
                          ) : song.source === "google" ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(59, 130, 246, 0.18)",
                                border: "1px solid rgba(59, 130, 246, 0.35)",
                                color: "#60a5fa",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                flexShrink: 0,
                              }}
                            >
                              <Globe size={10} /> GOOGLE
                            </span>
                          ) : song.source === "genius" ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(234, 179, 8, 0.18)",
                                border: "1px solid rgba(234, 179, 8, 0.35)",
                                color: "#facc15",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                flexShrink: 0,
                              }}
                            >
                              <Music size={10} /> GENIUS
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: "rgba(139, 92, 246, 0.18)",
                                border: "1px solid rgba(139, 92, 246, 0.35)",
                                color: "#c084fc",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                flexShrink: 0,
                              }}
                            >
                              <Globe size={10} /> ONLINE
                            </span>
                          )}
                        </div>

                        {/* Artist */}
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            fontWeight: 500,
                          }}
                        >
                          {song.artistName}
                        </div>

                        {/* Snippet */}
                        {song.snippet && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              fontStyle: "italic",
                              lineHeight: 1.3,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            "{song.snippet}"
                          </div>
                        )}

                        {/* Card Footer Actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "4px",
                            paddingTop: "6px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {song.isLocal ? (
                              <>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#34d399",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                  title="Saved in your church Song Bank"
                                >
                                  <Check size={11} /> In Bank
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditSong(song);
                                  }}
                                  style={{
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(255, 255, 255, 0.08)",
                                    border:
                                      "1px solid rgba(255, 255, 255, 0.15)",
                                    color: "#cbd5e1",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                  title="Edit lyrics in Song Bank"
                                >
                                  <Edit size={10} /> Edit
                                </button>
                                {onDeleteLibraryItem && song.localItem?.id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        confirm(
                                          `Delete "${song.trackName}" from Song Bank?`,
                                        )
                                      ) {
                                        onDeleteLibraryItem(song.localItem!.id);
                                      }
                                    }}
                                    style={{
                                      padding: "2px 5px",
                                      borderRadius: "4px",
                                      background: "rgba(239, 68, 68, 0.12)",
                                      border:
                                        "1px solid rgba(239, 68, 68, 0.25)",
                                      color: "#f87171",
                                      fontSize: "10px",
                                      cursor: "pointer",
                                    }}
                                    title="Delete from Song Bank"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveSongToLibrary(song);
                                  }}
                                  style={{
                                    padding: "3px 7px",
                                    borderRadius: "5px",
                                    background: "rgba(16, 185, 129, 0.15)",
                                    border:
                                      "1px solid rgba(16, 185, 129, 0.35)",
                                    color: "#34d399",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    transition: "all 0.12s",
                                  }}
                                  title="Save found song to local church Song Bank"
                                >
                                  <Bookmark size={10} /> + Bank
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditSong(song);
                                  }}
                                  style={{
                                    padding: "3px 6px",
                                    borderRadius: "5px",
                                    background: "rgba(139, 92, 246, 0.15)",
                                    border: "1px solid rgba(139, 92, 246, 0.3)",
                                    color: "#c084fc",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "2px",
                                  }}
                                  title="Edit lyrics and save to Song Bank"
                                >
                                  <Edit size={10} /> Edit
                                </button>
                              </>
                            )}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSongToSchedule(song);
                              }}
                              style={{
                                padding: "3px 8px",
                                borderRadius: "5px",
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                color: "#e2e8f0",
                                fontSize: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                              title="Add to today's presentation schedule"
                            >
                              <ListPlus size={10} /> Schedule
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PANEL L2: LYRIC SLIDE DECK (Center Stage) */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#090d16",
                overflow: "hidden",
              }}
            >
              {/* Deck Header: Song Title, Split Mode, Typography, Go Live */}
              <div
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(15, 23, 42, 0.85)",
                  gap: "12px",
                }}
              >
                {/* Left: Song Meta */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(139, 92, 246, 0.15)",
                      border: "1px solid rgba(139, 92, 246, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#c084fc",
                      flexShrink: 0,
                    }}
                  >
                    <Music size={18} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "15px",
                          fontWeight: 800,
                          color: "#ffffff",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {selectedSong
                          ? selectedSong.trackName
                          : "No Song Selected"}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "rgba(139, 92, 246, 0.15)",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          color: "#c084fc",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lyricSlides.length} Slides
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {selectedSong?.artistName || "Worship Leader / Church"} •{" "}
                      {selectedSong?.isLocal
                        ? "Local Library"
                        : "Online LRCLIB"}
                    </div>
                  </div>
                </div>

                {/* Right Controls: Save to Bank, Edit Lyrics, Typography, Navigation & Go Live */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0,
                  }}
                >
                  {selectedSong && (
                    <>
                      {/* Save Found Song to Song Bank / In Bank status */}
                      {!isSelectedSongSaved ? (
                        <button
                          onClick={() => handleSaveSongToLibrary(selectedSong)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 13px",
                            borderRadius: "8px",
                            background: "rgba(16, 185, 129, 0.18)",
                            border: "1.5px solid rgba(16, 185, 129, 0.45)",
                            color: "#34d399",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 0 14px rgba(16, 185, 129, 0.25)",
                          }}
                          title="Save this found song to your church Song Bank"
                        >
                          <Bookmark size={14} />
                          <span>Save to Song Bank</span>
                        </button>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 11px",
                            borderRadius: "8px",
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            color: "#34d399",
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                          title="Saved in your church Song Bank"
                        >
                          <Check size={13} />
                          <span>In Song Bank</span>
                        </div>
                      )}

                      {/* Edit Lyrics / Song Button */}
                      <button
                        onClick={() => handleOpenEditSong(selectedSong)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "7px 12px",
                          borderRadius: "8px",
                          background: "rgba(139, 92, 246, 0.15)",
                          border: "1px solid rgba(139, 92, 246, 0.35)",
                          color: "#c084fc",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        title="Edit lyrics, adjust stanzas, or customize this song"
                      >
                        <Edit size={14} />
                        <span>Edit Lyrics</span>
                      </button>
                    </>
                  )}

                  {/* Formatting & typography styling modal launcher */}
                  <button
                    onClick={() => {
                      setFormatModalTab(activeTab === 'lyrics' ? 'lyrics' : 'scripture');
                      setShowTypographyModal(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 11px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      color: "#e2e8f0",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Change presentation formatting, fonts, sizes, and position"
                  >
                    <Sliders size={14} color="#a78bfa" />
                    <span>Format</span>
                  </button>

                  {/* Prev / Next slide navigation buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <button
                      onClick={handlePrevSlide}
                      disabled={selectedLyricSlideIndex <= 0}
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color:
                          selectedLyricSlideIndex <= 0 ? "#475569" : "#e2e8f0",
                        cursor:
                          selectedLyricSlideIndex <= 0
                            ? "not-allowed"
                            : "pointer",
                      }}
                      title="Previous Slide (Left Arrow)"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      disabled={
                        selectedLyricSlideIndex >= lyricSlides.length - 1
                      }
                      style={{
                        padding: "6px 8px",
                        borderRadius: "6px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color:
                          selectedLyricSlideIndex >= lyricSlides.length - 1
                            ? "#475569"
                            : "#e2e8f0",
                        cursor:
                          selectedLyricSlideIndex >= lyricSlides.length - 1
                            ? "not-allowed"
                            : "pointer",
                      }}
                      title="Next Slide (Right Arrow / Space)"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* GO LIVE BUTTON */}
                  <button
                    onClick={() => handleGoLive()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      background:
                        "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#ffffff",
                      fontWeight: 900,
                      fontSize: "12px",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 0 18px rgba(239, 68, 68, 0.45)",
                      letterSpacing: "0.04em",
                    }}
                    title="Send selected lyric slide directly to Live Display (Enter / F5)"
                  >
                    <Radio size={15} />
                    <span>GO LIVE</span>
                  </button>
                </div>
              </div>

              {/* Sub-bar: Slide counter & quick screen blanking */}
              <div
                style={{
                  padding: "6px 20px",
                  background: "rgba(0, 0, 0, 0.35)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                }}
              >
                <div
                  style={{
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>
                    Selected:{" "}
                    <strong>Slide {selectedLyricSlideIndex + 1}</strong> of{" "}
                    {lyricSlides.length}
                  </span>
                  <span style={{ color: "#475569" }}>•</span>
                  <span style={{ color: "#64748b" }}>
                    Double-click slide to project immediately
                  </span>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {/* Split mode in subbar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      background: "rgba(0, 0, 0, 0.4)",
                      padding: "2px 4px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "#64748b",
                        padding: "0 4px",
                      }}
                    >
                      SPLIT:
                    </span>
                    {(
                      [
                        { id: "lines", label: "1 Line" },
                        { id: "smart", label: "Smart 2" },
                        { id: "smart3", label: "Smart 3" },
                        { id: "stanzas", label: "Stanzas" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setLyricsSplitMode(m.id)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          background:
                            lyricsSplitMode === m.id
                              ? "#8b5cf6"
                              : "transparent",
                          color:
                            lyricsSplitMode === m.id ? "#ffffff" : "#94a3b8",
                          transition: "all 0.12s",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slide Cards Grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "14px",
                  alignContent: "start",
                }}
              >
                {lyricSlides.length === 0 ? (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: "260px",
                      color: "#64748b",
                      textAlign: "center",
                    }}
                  >
                    <Music
                      size={42}
                      color="#334155"
                      style={{ marginBottom: "12px" }}
                    />
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#94a3b8",
                        marginBottom: "6px",
                      }}
                    >
                      No Lyric Slides Available
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        maxWidth: "320px",
                        marginBottom: "14px",
                        lineHeight: 1.5,
                      }}
                    >
                      Select a song from the library on the left, search online,
                      or paste your lyrics manually to generate presentation
                      slides.
                    </div>
                    <button
                      onClick={handleOpenAddSong}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
                      }}
                      title="Paste lyrics and add a song manually"
                    >
                      <Plus size={14} />
                      <span>Add Song to Song Bank</span>
                    </button>
                  </div>
                ) : (
                  lyricSlides.map((slideText, idx) => {
                    const isSelected = selectedLyricSlideIndex === idx;
                    const isLive =
                      state.lines[state.cur] === slideText &&
                      state.category === "song" &&
                      !state.liveState.isClearText &&
                      !state.liveState.isBlackout;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedLyricSlideIndex(idx);
                          const isSongLive =
                            state.category === "song" &&
                            state.title?.toLowerCase() ===
                              selectedSong?.trackName.toLowerCase();
                          if (isSongLive) {
                            onJumpTo(idx);
                            if (state.liveState.isClearText) {
                              onUpdateLiveState({ isClearText: false });
                            }
                          }
                        }}
                        onDoubleClick={() => {
                          setSelectedLyricSlideIndex(idx);
                          handleGoLive(idx);
                        }}
                        style={{
                          background: isLive
                            ? "radial-gradient(ellipse at top left, rgba(239, 68, 68, 0.22) 0%, rgba(15, 23, 42, 0.95) 100%)"
                            : isSelected
                              ? "radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.25) 0%, rgba(15, 23, 42, 0.9) 100%)"
                              : "rgba(15, 23, 42, 0.75)",
                          border: isLive
                            ? "2px solid #ef4444"
                            : isSelected
                              ? "2px solid #a78bfa"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          padding: "14px 16px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "140px",
                          boxShadow: isLive
                            ? "0 0 25px rgba(239, 68, 68, 0.4), inset 0 0 20px rgba(239, 68, 68, 0.1)"
                            : isSelected
                              ? "0 0 20px rgba(139, 92, 246, 0.3)"
                              : "0 4px 12px rgba(0, 0, 0, 0.3)",
                          transition: "all 0.15s ease",
                          position: "relative",
                        }}
                      >
                        {/* Slide Card Header */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "10px",
                            paddingBottom: "8px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 900,
                                color: isLive
                                  ? "#f87171"
                                  : isSelected
                                    ? "#c084fc"
                                    : "#94a3b8",
                                letterSpacing: "0.04em",
                              }}
                            >
                              SLIDE #{idx + 1}
                            </span>
                          </div>

                          {isLive ? (
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#ef4444",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 900,
                                padding: "2px 7px",
                                borderRadius: "4px",
                                letterSpacing: "0.04em",
                                boxShadow: "0 0 10px rgba(239, 68, 68, 0.8)",
                              }}
                            >
                              <Radio size={10} /> LIVE ON AIR
                            </span>
                          ) : isSelected ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                color: "#a78bfa",
                                background: "rgba(139, 92, 246, 0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              SELECTED
                            </span>
                          ) : null}
                        </div>

                        {/* Slide Lyrics Content */}
                        <div
                          style={{
                            fontFamily:
                              state.theme.fontFamily ||
                              "Montserrat, sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            lineHeight: 1.5,
                            color: "#ffffff",
                            whiteSpace: "pre-line",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: "vertical",
                            textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
                          }}
                        >
                          {slideText}
                        </div>

                        {/* Slide Card Footer */}
                        <div
                          style={{
                            marginTop: "12px",
                            paddingTop: "8px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                            Double-click to project
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLyricSlideIndex(idx);
                              handleGoLive(idx);
                            }}
                            style={{
                              padding: "2px 7px",
                              borderRadius: "4px",
                              background: isLive
                                ? "rgba(239, 68, 68, 0.2)"
                                : "rgba(255, 255, 255, 0.06)",
                              border: isLive
                                ? "1px solid #ef4444"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                              color: isLive ? "#f87171" : "#cbd5e1",
                              fontSize: "9px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isLive ? "On Screen" : "Project Now"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* PANEL 1: BOOKS (66) */}
            <div
              style={{
                width: "240px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.5)",
              }}
            >
              {/* Books Header with Testament Filter Tabs */}
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#38bdf8",
                      textTransform: "uppercase",
                    }}
                  >
                    1. BIBLE BOOKS ({filteredBooks.length})
                  </span>
                </div>

                {/* OT / NT Tabs */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["ALL", "OT", "NT"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTestamentFilter(t)}
                      style={{
                        flex: 1,
                        padding: "4px 0",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                        background:
                          testamentFilter === t
                            ? "#38bdf8"
                            : "rgba(255, 255, 255, 0.05)",
                        color: testamentFilter === t ? "#000000" : "#94a3b8",
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
                    width: "100%",
                    padding: "6px 10px",
                    background: "rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    color: "#ffffff",
                    fontSize: "11px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Book List Scrollable */}
              <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
                {filteredBooks.map((book) => {
                  const isSelected = selectedBook.name === book.name;
                  return (
                    <div
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginBottom: "2px",
                        cursor: "pointer",
                        background: isSelected
                          ? "rgba(56, 189, 248, 0.2)"
                          : "transparent",
                        border: isSelected
                          ? "1px solid #38bdf8"
                          : "1px solid transparent",
                        color: isSelected ? "#38bdf8" : "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: isSelected ? 800 : 500,
                        transition: "all 0.1s",
                      }}
                    >
                      <span>{book.name}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          color: isSelected ? "#38bdf8" : "#64748b",
                          background: "rgba(255, 255, 255, 0.05)",
                          padding: "1px 6px",
                          borderRadius: "4px",
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
                width: "180px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.4)",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#38bdf8",
                    textTransform: "uppercase",
                  }}
                >
                  2. CHAPTERS
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    fontWeight: 600,
                  }}
                >
                  {selectedBook.name} ({selectedBook.chapters})
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  alignContent: "start",
                }}
              >
                {Array.from(
                  { length: selectedBook.chapters },
                  (_, i) => i + 1,
                ).map((ch) => {
                  const isSelected = selectedChapter === ch;
                  return (
                    <button
                      key={ch}
                      onClick={() => handleSelectChapter(ch)}
                      style={{
                        padding: "8px 0",
                        borderRadius: "6px",
                        background: isSelected
                          ? "#38bdf8"
                          : "rgba(255, 255, 255, 0.05)",
                        border: isSelected
                          ? "1px solid #38bdf8"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#000000" : "#e2e8f0",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                        transition: "all 0.1s",
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
                width: "180px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.3)",
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#38bdf8",
                    textTransform: "uppercase",
                  }}
                >
                  3. VERSES
                </span>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    Ch. {selectedChapter} (
                    {scriptureResult?.totalVerses || "..."})
                  </span>
                  <button
                    onClick={() => handleSelectVerse(null)}
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background:
                        selectedVerseNumber === null
                          ? "#38bdf8"
                          : "rgba(255, 255, 255, 0.06)",
                      color:
                        selectedVerseNumber === null ? "#000000" : "#38bdf8",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ALL
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "10px",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "6px",
                  alignContent: "start",
                }}
              >
                {scriptureResult &&
                scriptureResult.verses &&
                scriptureResult.verses.length > 0
                  ? scriptureResult.verses.map((v) => {
                      const isSelected = selectedVerseNumber === v.verse;
                      return (
                        <button
                          key={v.verse}
                          onClick={() => handleSelectVerse(v.verse)}
                          style={{
                            padding: "8px 0",
                            borderRadius: "6px",
                            background: isSelected
                              ? "#38bdf8"
                              : "rgba(255, 255, 255, 0.05)",
                            border: isSelected
                              ? "1px solid #38bdf8"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            color: isSelected ? "#000000" : "#e2e8f0",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.1s",
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
                          padding: "8px 0",
                          borderRadius: "6px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          color: "#64748b",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
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
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background: "#090d16",
              }}
            >
              {/* Slide Deck Sub-header */}
              <div
                style={{
                  padding: "10px 20px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(15, 23, 42, 0.6)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#ffffff",
                      }}
                    >
                      {scriptureResult?.reference || searchQuery}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                      }}
                    >
                      {scriptureResult?.version || selectedVersion}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {generatedSlides.length} Slide
                    {generatedSlides.length > 1 ? "s" : ""} • Click card to
                    preview, double-click to project live
                  </div>
                </div>

                {/* Slide Sub-Header Controls: Font Family, Text Size & Slide Navigation */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {/* Quick Font Family Selector */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Type size={13} color="#38bdf8" />
                    <select
                      value={state.theme.fontFamily || "Montserrat, sans-serif"}
                      onChange={(e) =>
                        onUpdateTheme?.({ fontFamily: e.target.value })
                      }
                      style={{
                        background: "rgba(0, 0, 0, 0.45)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "5px 8px",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      title="Select scripture font family for live screen"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option
                          key={f.value}
                          value={f.value}
                          style={{ background: "#0f172a", color: "#ffffff" }}
                        >
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Text Font Size Controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(0, 0, 0, 0.45)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                    }}
                    title="Adjust live scripture font size"
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#94a3b8",
                      }}
                    >
                      Text:
                    </span>
                    <button
                      onClick={() => {
                        const cur = state.theme.fontSize || 44;
                        const next = Math.max(24, cur - 4);
                        onUpdateTheme?.({ fontSize: next });
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Decrease text font size (-4px)"
                    >
                      <Minus size={10} />
                    </button>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#f59e0b",
                        minWidth: "34px",
                        textAlign: "center",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {state.theme.fontSize || 44}px
                    </span>
                    <button
                      onClick={() => {
                        const cur = state.theme.fontSize || 44;
                        const next = Math.min(96, cur + 4);
                        onUpdateTheme?.({ fontSize: next });
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Increase text font size (+4px)"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  {/* Slide Navigation */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    <button
                      onClick={handlePrevSlide}
                      disabled={selectedSlideIndex <= 0}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px 0 0 6px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color: selectedSlideIndex <= 0 ? "#475569" : "#ffffff",
                        cursor:
                          selectedSlideIndex <= 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Previous slide (Left Arrow)"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <div
                      style={{
                        padding: "6px 10px",
                        background: "rgba(0, 0, 0, 0.3)",
                        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                        fontSize: "11px",
                        fontWeight: 800,
                        color: "#38bdf8",
                        minWidth: "55px",
                        textAlign: "center",
                      }}
                    >
                      {selectedSlideIndex + 1} / {generatedSlides.length || 1}
                    </div>
                    <button
                      onClick={handleNextSlide}
                      disabled={
                        selectedSlideIndex >= generatedSlides.length - 1
                      }
                      style={{
                        padding: "6px 10px",
                        borderRadius: "0 6px 6px 0",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        color:
                          selectedSlideIndex >= generatedSlides.length - 1
                            ? "#475569"
                            : "#ffffff",
                        cursor:
                          selectedSlideIndex >= generatedSlides.length - 1
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Next slide (Right Arrow / Space)"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Slide Cards Grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "14px",
                  alignContent: "start",
                }}
              >
                {generatedSlides.map((slideText, idx) => {
                  const isSelected = idx === selectedSlideIndex;
                  const isCurrentlyLiveOnDisplay =
                    state.category === "scripture" &&
                    state.cur === idx &&
                    state.lines[idx] === slideText;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedSlideIndex(idx);
                        onJumpTo(idx);
                        if (
                          state.category === "scripture" &&
                          state.liveState.isClearText
                        ) {
                          onUpdateLiveState({ isClearText: false });
                        }
                      }}
                      onDoubleClick={() => handleGoLive(idx)}
                      style={{
                        background: isCurrentlyLiveOnDisplay
                          ? "rgba(239, 68, 68, 0.15)"
                          : isSelected
                            ? "rgba(56, 189, 248, 0.12)"
                            : "rgba(15, 23, 42, 0.7)",
                        border: isCurrentlyLiveOnDisplay
                          ? "2px solid #ef4444"
                          : isSelected
                            ? "2px solid #38bdf8"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "130px",
                        cursor: "pointer",
                        boxShadow: isCurrentlyLiveOnDisplay
                          ? "0 0 20px rgba(239, 68, 68, 0.35)"
                          : isSelected
                            ? "0 0 16px rgba(56, 189, 248, 0.25)"
                            : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            color: isCurrentlyLiveOnDisplay
                              ? "#ef4444"
                              : isSelected
                                ? "#38bdf8"
                                : "#64748b",
                          }}
                        >
                          SLIDE {idx + 1}
                        </span>

                        {isCurrentlyLiveOnDisplay ? (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: "#ef4444",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Radio size={10} /> ON DISPLAY
                          </span>
                        ) : isSelected ? (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.2)",
                              color: "#38bdf8",
                            }}
                          >
                            PREVIEW
                          </span>
                        ) : null}
                      </div>

                      <div
                        style={{
                          color: "#ffffff",
                          fontSize: "13px",
                          lineHeight: 1.5,
                          fontWeight: 500,
                          fontFamily:
                            state.theme.fontFamily || "Montserrat, sans-serif",
                          whiteSpace: "pre-line",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {slideText}
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          paddingTop: "8px",
                          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <span style={{ fontSize: "10px", color: "#64748b" }}>
                          Double-click to project
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* PANEL 5: LIVE DISPLAY MONITOR (Mini Preview of DisplayView) */}
        <div
          style={{
            width: "380px",
            flexShrink: 0,
            borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(10, 15, 26, 0.85)",
            padding: "16px",
            gap: "14px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Tv size={16} color="#38bdf8" />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                Live Screen Output
              </span>
            </div>
            <button
              onClick={() =>
                openBorderlessWindow("/display", "easypresenter_display")
              }
              style={{
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <ExternalLink size={11} />
              Popout
            </button>
          </div>

          {/* 16:9 Mini Screen Monitor reproducing DisplayView */}
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              background: state.liveState.isBlackout
                ? "#000000"
                : "radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)",
              borderRadius: "10px",
              border: "1.5px solid rgba(56, 189, 248, 0.35)",
              boxShadow:
                "0 10px 25px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(0, 0, 0, 0.8)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "12px 14px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Top Bar on Screen: Cyan Countdown Timer + Underline (Left) & Real Clock (Right) */}
            {!state.liveState.isBlackout && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom:
                    state.liveState.isClearText || !state.lines[state.cur]
                      ? "none"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  paddingBottom: "4px",
                }}
              >
                {/* Top Left Countdown Timer - only shown when text is active */}
                {state.timerState.showOnDisplay &&
                (state.timerState.status !== "idle" ||
                  currentTimerSec > 0 ||
                  state.timerState.durationSec > 0) &&
                !state.liveState.isClearText &&
                Boolean(state.lines[state.cur]) ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: `${Math.round(18 * Math.max(0.6, Math.min(2.0, (state.timerState.fontSizeScale || 100) / 100)))}px`,
                        fontWeight: 900,
                        color: isOvertime
                          ? "#ef4444"
                          : isCritical
                            ? "#f97316"
                            : isWarning
                              ? "#f59e0b"
                              : "#60a5fa",
                        lineHeight: 1,
                      }}
                    >
                      {formattedCountdown}
                    </span>
                    <div
                      style={{
                        height: "2px",
                        width: "100%",
                        background: isOvertime ? "#ef4444" : "#60a5fa",
                        marginTop: "2px",
                      }}
                    />
                  </div>
                ) : (
                  <div />
                )}

                {/* Top Right Digital Clock */}
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#f59e0b",
                    }}
                  >
                    {new Date(now).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Center: Live Scripture Text OR Centered Hero Timer when text cleared */}
            {!state.liveState.isBlackout &&
              (state.liveState.isClearText || !state.lines[state.cur] ? (
                /* Hero Centered Timer in Middle Space of Mini Monitor */
                state.timerState.showOnDisplay && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "8px 4px",
                      margin: "auto 0",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: `${Math.round(32 * Math.max(0.6, Math.min(2.0, (state.timerState.fontSizeScale || 100) / 100)))}px`,
                        fontWeight: 900,
                        color: isOvertime
                          ? "#ef4444"
                          : isCritical
                            ? "#f97316"
                            : isWarning
                              ? "#f59e0b"
                              : "#60a5fa",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        textShadow: isOvertime
                          ? "0 0 15px rgba(239, 68, 68, 0.8)"
                          : "0 0 15px rgba(96, 165, 250, 0.5)",
                      }}
                    >
                      {formattedCountdown}
                    </span>
                    <div
                      style={{
                        height: "2.5px",
                        width: `${Math.round(45 * Math.max(0.6, Math.min(2.0, (state.timerState.fontSizeScale || 100) / 100)))}px`,
                        background: isOvertime ? "#ef4444" : "#60a5fa",
                        marginTop: "4px",
                        borderRadius: "2px",
                        boxShadow: isOvertime
                          ? "0 0 8px rgba(239, 68, 68, 0.8)"
                          : "0 0 8px rgba(96, 165, 250, 0.6)",
                      }}
                    />
                  </div>
                )
              ) : (
                /* Live Scripture / Worship Slide Text */
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: (state.category === "scripture" || activeTab === "scripture")
                      ? (state.theme.scripture?.textAlign === 'left' ? 'flex-start' : state.theme.scripture?.textAlign === 'right' ? 'flex-end' : 'center')
                      : (state.theme.lyrics?.textAlign === 'left' ? 'flex-start' : state.theme.lyrics?.textAlign === 'right' ? 'flex-end' : 'center'),
                    justifyContent: "center",
                    textAlign: (state.category === "scripture" || activeTab === "scripture")
                      ? (state.theme.scripture?.textAlign || 'center')
                      : (state.theme.lyrics?.textAlign || 'center'),
                    width: "100%",
                    padding: "4px",
                    overflow: "hidden",
                  }}
                >
                  {(() => {
                    const rawText = state.lines[state.cur] ||
                      (activeTab === "lyrics"
                        ? lyricSlides[selectedLyricSlideIndex]
                        : generatedSlides[selectedSlideIndex]) ||
                      "No content active";

                    const isScripture = (state.category === "scripture" || activeTab === "scripture");

                    if (!isScripture) {
                      return (
                        <div
                          style={{
                            color: state.theme.lyrics?.bodyFontColor || state.theme.textColor || "#ffffff",
                            fontSize: `${Math.round(13 * Math.max(0.7, Math.min(1.8, (state.theme.lyrics?.bodyFontSize || 48) / 48)))}px`,
                            fontWeight: state.theme.lyrics?.bodyFontStyle?.includes('bold') ? 800 : 600,
                            fontStyle: state.theme.lyrics?.bodyFontStyle?.includes('italic') ? 'italic' : 'normal',
                            lineHeight: 1.4,
                            fontFamily: state.theme.lyrics?.bodyFontFamily || state.theme.fontFamily || "Montserrat, sans-serif",
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {rawText}
                        </div>
                      );
                    }

                    // Scripture: Parse title and body
                    const parts = rawText.split(/\n\s*\n/);
                    let title = state.title || scriptureResult?.reference || "";
                    let body = rawText;

                    if (parts.length > 1) {
                      const first = parts[0].trim();
                      const last = parts[parts.length - 1].trim();
                      const looksLikeRef = (s: string) =>
                        /^[1-3]?\s*[A-Za-z\s]+\s+\d+(?::\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?$/i.test(s) ||
                        /^[1-3]?\s*[A-Za-z\s]+\s*\([A-Z0-9\s]+\)$/i.test(s) ||
                        s.startsWith('—') ||
                        s.startsWith('-');
                      if (looksLikeRef(first) && first.length < 60) {
                        title = first.replace(/^[—\-]\s*/, '').trim();
                        body = parts.slice(1).join('\n\n').trim();
                      } else if (looksLikeRef(last) && last.length < 60) {
                        title = last.replace(/^[—\-]\s*/, '').trim();
                        body = parts.slice(0, -1).join('\n\n').trim();
                      }
                    }
                    body = body.replace(/^[“"']+|[”"']+$/g, '').trim();
                    const showTitle = state.theme.scripture?.showTitle !== false;
                    const isTitleBottom = state.theme.scripture?.titlePosition === 'bottom';
                    const titleColor = state.theme.scripture?.titleFontColor || "#38bdf8";

                    const titleEl = showTitle && title ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isTitleBottom ? '0' : '4px', marginTop: isTitleBottom ? '4px' : '0' }}>
                        <div style={{ width: '16px', height: '1px', background: 'rgba(255, 255, 255, 0.3)' }} />
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: titleColor,
                          fontFamily: state.theme.scripture?.titleFontFamily || 'Montserrat, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          {title}
                        </span>
                        <div style={{ width: '16px', height: '1px', background: 'rgba(255, 255, 255, 0.3)' }} />
                      </div>
                    ) : null;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {!isTitleBottom && titleEl}
                        <div
                          style={{
                            color: state.theme.scripture?.bodyFontColor || "#ffffff",
                            fontSize: `${Math.round(13 * Math.max(0.7, Math.min(1.8, (state.theme.scripture?.bodyFontSize || 52) / 52)))}px`,
                            fontWeight: state.theme.scripture?.bodyFontStyle?.includes('bold') ? 700 : 500,
                            fontStyle: state.theme.scripture?.bodyFontStyle?.includes('italic') ? 'italic' : 'normal',
                            lineHeight: 1.4,
                            fontFamily: state.theme.scripture?.bodyFontFamily || state.theme.fontFamily || "Montserrat, sans-serif",
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                            whiteSpace: "pre-line",
                          }}
                        >
                          “{body}”
                        </div>
                        {isTitleBottom && titleEl}
                      </div>
                    );
                  })()}
                </div>
              ))}

            {/* Bottom Citation & Status */}
            {!state.liveState.isBlackout && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingTop: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: activeTab === "lyrics" ? "#c084fc" : "#38bdf8",
                  }}
                >
                  {activeTab === "lyrics"
                    ? (selectedSong?.trackName || "Worship Lyrics")
                    : "Scripture Live Feed"}
                </span>
                <span
                  style={{ fontSize: "8px", color: "#64748b", fontWeight: 700 }}
                >
                  DISPLAYVIEW LIVE
                </span>
              </div>
            )}
          </div>

          {/* Quick Help & Status Card */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "11px",
              color: "#94a3b8",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{ fontWeight: 800, color: "#38bdf8", marginBottom: "4px" }}
            >
              ⚡ EASYPRESENTER V2 SHORTCUTS
            </div>
            <div>
              • <strong>Enter</strong>: Go Live to Screen
            </div>
            <div>
              • <strong>Space / Tab</strong>: Autocomplete Book & Chapter
              (Auto-inserts :)
            </div>
            <div>
              • <strong>Right Arrow / Space</strong> (on deck): Next Slide
            </div>
            <div>
              • <strong>Left Arrow</strong> (on deck): Previous Slide
            </div>
            <div>
              • <strong>Countdown Timer</strong>: Start/pause or pick presets
              above
            </div>
          </div>
        </div>
      </main>

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
