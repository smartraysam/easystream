import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  AppState,
  LiveState,
  TimerState,
  LibraryItem,
  PresentationTheme,
  PresenterLayout,
  ScheduleItem,
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
} from "../data/popularWorshipSongs";
import { SongBankEditorModal, SongBankEditorItem } from "./SongBankEditorModal";
import { FormatSettingsModal } from "./FormatSettingsModal";
import { EasyWorshipWorkspace } from "./EasyWorshipWorkspace";

// Subcomponents
import {
  OnlineSongResult,
  OnlineScriptureVerse,
  OnlineScriptureResult,
  DEFAULT_WORSHIP_SONG,
  POPULAR_SCRIPTURES,
  TIMER_PRESETS,
  FONT_FAMILIES,
} from "./v2/types";
import { V2Header } from "./v2/V2Header";
import { V2CountdownBar } from "./v2/V2CountdownBar";
import { V2ModeTabs } from "./v2/V2ModeTabs";
import { V2LyricsSearchBar } from "./v2/V2LyricsSearchBar";
import { V2ScriptureSearchBar } from "./v2/V2ScriptureSearchBar";
import { V2LyricsLibraryPanel } from "./v2/V2LyricsLibraryPanel";
import { V2LyricsSlideDeck } from "./v2/V2LyricsSlideDeck";
import { V2ScriptureNavigator } from "./v2/V2ScriptureNavigator";
import { V2ScriptureSlideDeck } from "./v2/V2ScriptureSlideDeck";
import { V2PreviewMonitor } from "./v2/V2PreviewMonitor";

// Re-export types & constants for external consumers (e.g. EasyWorshipWorkspace, App.tsx)
export type {
  OnlineSongResult,
  OnlineScriptureVerse,
  OnlineScriptureResult,
};
export {
  DEFAULT_WORSHIP_SONG,
  POPULAR_SCRIPTURES,
  TIMER_PRESETS,
  FONT_FAMILIES,
};

export interface V2PresenterProps {
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
  onUpdateSchedule?: (items: ScheduleItem[]) => void;
  onRemoveFromSchedule?: (id: string) => void;
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
  onUpdateSchedule,
  onRemoveFromSchedule,
}) => {
  // -------------------------------------------------------------
  // Workspace Layout State: 'easyworship' | 'quickdeck' | 'classic'
  // -------------------------------------------------------------
  const activeLayout: PresenterLayout =
    (state.theme?.presenterLayout as PresenterLayout) ||
    (localStorage.getItem("easypresenter_workspace_layout") as PresenterLayout) ||
    "easyworship";

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
  const [formatModalTab, setFormatModalTab] = useState<
    "scripture" | "lyrics" | "layout" | "general"
  >("scripture");

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
  const hasScriptureFocusedRef = useRef(false);

  // -------------------------------------------------------------
  // Bible Selector Columns State (Panels 1, 2, 3)
  // -------------------------------------------------------------
  const [testamentFilter, setTestamentFilter] = useState<"ALL" | "OT" | "NT">(
    "ALL",
  );
  const [bookSearchText, setBookSearchText] = useState("");
  const [selectedBook, setSelectedBook] = useState<BibleBook>(
    BIBLE_BOOKS.find((b) => b.name === "John") || BIBLE_BOOKS[42],
  );
  const [selectedChapter, setSelectedChapter] = useState<number | null>(3);
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(
    16,
  );

  // -------------------------------------------------------------
  // Countdown Timer & Alerts Bar State
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
  const localSongMatches: OnlineSongResult[] = useMemo(() => {
    const q = lyricsQuery.trim().toLowerCase();
    const items = state.library || [];
    const songItems = items.filter(
      (item) => item.category === "song" || (!item.category && item.lines?.length),
    );

    if (!q) {
      return songItems.map((item) => {
        const plain =
          item.content ||
          (item.lines ? item.lines.join("\n") : "");
        const lines = plain.split("\n").filter((l) => l.trim().length > 0);
        return {
          id: item.id,
          trackName: item.title,
          artistName: item.author || "Local Church Library",
          snippet: lines.slice(0, 2).join(" • "),
          plainLyrics: plain,
          isLocal: true,
          localItem: item,
        };
      });
    }

    return songItems
      .filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const authorMatch = (item.author || "").toLowerCase().includes(q);
        const contentMatch = (item.content || "").toLowerCase().includes(q);
        return titleMatch || authorMatch || contentMatch;
      })
      .map((item) => {
        const plain =
          item.content ||
          (item.lines ? item.lines.join("\n") : "");
        const lines = plain.split("\n").filter((l) => l.trim().length > 0);
        return {
          id: item.id,
          trackName: item.title,
          artistName: item.author || "Local Church Library",
          snippet: lines.slice(0, 2).join(" • "),
          plainLyrics: plain,
          isLocal: true,
          localItem: item,
        };
      });
  }, [lyricsQuery, state.library]);

  const combinedSongResults: OnlineSongResult[] = useMemo(() => {
    if (lyricsScope === "local") {
      return localSongMatches;
    }
    if (lyricsScope === "online") {
      return onlineSongResults;
    }
    const localTitles = new Set(
      localSongMatches.map((s) => s.trackName.toLowerCase().trim()),
    );
    const filteredOnline = onlineSongResults.filter(
      (s) => !localTitles.has(s.trackName.toLowerCase().trim()),
    );
    return [...localSongMatches, ...filteredOnline];
  }, [lyricsScope, localSongMatches, onlineSongResults]);

  const lyricSuggestions: LyricSuggestion[] = useMemo(() => {
    if (!lyricsQuery.trim() || !showLyricSuggestions) return [];
    return getLyricSuggestions(lyricsQuery, state.library);
  }, [lyricsQuery, showLyricSuggestions, state.library]);

  const lyricSlides: string[] = useMemo(() => {
    if (!selectedSong || !selectedSong.plainLyrics) return [];
    return parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode);
  }, [selectedSong, lyricsSplitMode]);

  useEffect(() => {
    if (activeTab !== "lyrics" || lyricsScope === "local") return;
    if (!lyricsQuery.trim()) {
      setOnlineSongResults([]);
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

    if (!song.plainLyrics || song.plainLyrics.length < 20) {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(song.id)}&url=${encodeURIComponent(song.sourceUrl || "")}`,
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
            prev.map((s) => (s.id === song.id ? updated : s)),
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

  const handleSaveAndSendToLive = async (songToSave = selectedSong) => {
    if (!songToSave) return;
    let fullLyrics = songToSave.plainLyrics;
    let activeSong = songToSave;

    if (!fullLyrics || fullLyrics.length < 20) {
      try {
        setLyricsLoading(true);
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(songToSave.id)}&url=${encodeURIComponent(songToSave.sourceUrl || "")}`,
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          fullLyrics = data.result.plainLyrics;
          activeSong = {
            ...songToSave,
            plainLyrics: fullLyrics,
            snippet: data.result.snippet || songToSave.snippet,
          };
          setSelectedSong(activeSong);
          setOnlineSongResults((prev) =>
            prev.map((s) => (s.id === songToSave.id ? activeSong : s)),
          );
        }
      } catch (err) {
        console.error("Error fetching online lyrics for save & live:", err);
      } finally {
        setLyricsLoading(false);
      }
    }

    const slides = parseLyricsToSlides(fullLyrics || activeSong.plainLyrics || "", lyricsSplitMode);
    if (slides.length === 0) return;

    if (onSaveLibraryItem) {
      const existingLocal = (state.library || []).find(
        (i) =>
          i.id === activeSong.localItem?.id ||
          i.title.toLowerCase().trim() === activeSong.trackName.toLowerCase().trim(),
      );
      const libraryItem: LibraryItem = {
        id:
          activeSong.localItem?.id ||
          existingLocal?.id ||
          `song-${activeSong.trackName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
        title: activeSong.trackName,
        author: activeSong.artistName || "Worship",
        category: (activeSong.localItem?.category as any) || existingLocal?.category || "song",
        content: fullLyrics || activeSong.plainLyrics,
        lines: slides,
        createdAt: activeSong.localItem?.createdAt || existingLocal?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      onSaveLibraryItem(libraryItem);
      activeSong = {
        ...activeSong,
        isLocal: true,
        localItem: libraryItem,
      };
      setSelectedSong(activeSong);
    }

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
  };

  const handleOpenAddSong = () => {
    setEditingSong(null);
    setIsSongEditorOpen(true);
  };

  const handleOpenEditSong = async (song: OnlineSongResult) => {
    let fullLyrics = song.plainLyrics;
    let targetSong = song;

    if (!fullLyrics || fullLyrics.length < 20) {
      try {
        setLyricsLoading(true);
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(song.id)}&url=${encodeURIComponent(song.sourceUrl || "")}`,
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          fullLyrics = data.result.plainLyrics;
          targetSong = {
            ...song,
            plainLyrics: fullLyrics,
            snippet: data.result.snippet || song.snippet,
          };
          setSelectedSong(targetSong);
        }
      } catch (err) {
        console.error("Error fetching song details for editor:", err);
      } finally {
        setLyricsLoading(false);
      }
    }

    const existingLocal = (state.library || []).find(
      (i) =>
        i.id === targetSong.localItem?.id ||
        i.title.toLowerCase().trim() === targetSong.trackName.toLowerCase().trim(),
    );
    setEditingSong({
      id: targetSong.localItem?.id || existingLocal?.id,
      title: targetSong.trackName,
      author: targetSong.artistName,
      category:
        (targetSong.localItem?.category as any) || existingLocal?.category || "song",
      content: fullLyrics || targetSong.plainLyrics,
      plainLyrics: fullLyrics || targetSong.plainLyrics,
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

  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!searchQuery.trim() || !showSuggestions) return [];
    return getBibleSuggestions(searchQuery, selectedVersion);
  }, [searchQuery, showSuggestions, selectedVersion]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

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

    return res.verses.map((v) => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, "").trim();
      const verseRef =
        res.verses.length === 1
          ? `${res.reference} (${res.version})`
          : `${baseBookChapter}:${v.verse} (${res.version})`;
      return withRef ? `${verseRef}\n\n${cleanVerse}` : cleanVerse;
    });
  };

  const generatedSlides = useMemo(() => {
    if (!scriptureResult) return [];
    return formatSlidesFromData(
      scriptureResult,
      splitMode,
      includeReferenceOnSlide,
    );
  }, [scriptureResult, splitMode, includeReferenceOnSlide]);

  const fetchScripture = async (
    queryStr: string,
    version: string,
    autoGoLive = false,
    focusVerseNum: number | null = null,
  ) => {
    let raw = queryStr.trim();
    setShowSuggestions(false);
    if (!raw) return;

    raw = raw.replace(/[-–—:\s]+$/, "").trim();

    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map((v) => v.id);
    const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join("|")})[\\)\\s]*$`, "i");
    raw = raw.replace(versionRegex, "").trim();

    raw = raw.replace(
      /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)(.*)$/,
      "$1 $2:$3$4",
    );

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

    const singleVerseMatch = raw.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)[:\s]+(\d+)$/);
    let apiQuery = raw;
    let effectiveFocusVerse = focusVerseNum;
    if (singleVerseMatch) {
      apiQuery = singleVerseMatch[1].trim();
      if (effectiveFocusVerse === null) {
        effectiveFocusVerse = parseInt(singleVerseMatch[2], 10);
      }
    }

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(apiQuery)}&version=${encodeURIComponent(version)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setSearchError(data.error);
        setScriptureResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setScriptureResult(data);
        setSearchError(null);

        const verseMatch = raw.match(/[:\s](\d+)(?:[-–—]\d+)?$/);
        const effectiveVerseNum =
          effectiveFocusVerse ?? (verseMatch ? parseInt(verseMatch[1], 10) : null);
        if (effectiveVerseNum !== null) {
          setSelectedVerseNumber(effectiveVerseNum);
        }

        let targetSlideIdx = 0;
        if (effectiveVerseNum !== null) {
          const vIdx = data.verses.findIndex(
            (v: OnlineScriptureVerse) => v.verse === effectiveVerseNum,
          );
          if (vIdx !== -1) {
            targetSlideIdx =
              splitMode === "double" ? Math.floor(vIdx / 2) : vIdx;
          }
        } else if (selectedSlideIndex > 0) {
          targetSlideIdx = Math.min(selectedSlideIndex, data.verses.length - 1);
        }
        setSelectedSlideIndex(targetSlideIdx);

        if (effectiveVerseNum !== null) {
          setTimeout(() => {
            const container = document.getElementById("quickdeck-verses-container");
            const targetBtn = document.getElementById(`quickdeck-verse-${effectiveVerseNum}`);
            if (container && targetBtn) {
              const btnTop = targetBtn.offsetTop;
              container.scrollTo({
                top: Math.max(0, btnTop - container.clientHeight / 2),
                behavior: "smooth",
              });
            }
          }, 80);
        }

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

  useEffect(() => {
    fetchScripture("John 3:16", selectedVersion, false, 16);
  }, []);

  const handleClearScriptureSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setSelectedChapter(null);
    setSelectedVerseNumber(null);
    setScriptureResult(null);
    searchInputRef.current?.focus();
  };

  const handleSelectSuggestion = (sug: BibleSuggestion) => {
    if (sug.type === "book") {
      setSelectedChapter(null);
      setSelectedVerseNumber(null);
      updateQueryAndFocusEnd(`${sug.text} `);
    } else if (sug.type === "chapter") {
      setSelectedVerseNumber(null);
      updateQueryAndFocusEnd(`${sug.text}:`);
    } else if (sug.type === "verse" || sug.type === "version") {
      setSearchQuery(sug.text);
      setShowSuggestions(false);
      fetchScripture(sug.text, selectedVersion, true);
    } else {
      updateQueryAndFocusEnd(sug.text);
    }
  };

  const handleSelectBook = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(1);
    setSelectedVerseNumber(null);
    const newRef = `${book.name} 1`;
    setSearchQuery(newRef);
    fetchScripture(newRef, selectedVersion, false);
  };

  const handleSelectChapter = (ch: number) => {
    setSelectedChapter(ch);
    setSelectedVerseNumber(null);
    const bookName = selectedBook ? selectedBook.name : "Genesis";
    const newRef = `${bookName} ${ch}`;
    setSearchQuery(newRef);
    fetchScripture(newRef, selectedVersion, false);
  };

  const handleSelectVerse = (verseNum: number | null) => {
    if (!selectedChapter || !selectedBook) return;
    setSelectedVerseNumber(verseNum);
    const isScriptureLive = state.category === "scripture";
    if (verseNum === null) {
      const chRef = `${selectedBook.name} ${selectedChapter}`;
      setSearchQuery(chRef);
      fetchScripture(chRef, selectedVersion, isScriptureLive);
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
          if (isScriptureLive) {
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
          }
          return;
        }
      }
      fetchScripture(vRef, selectedVersion, isScriptureLive, verseNum);
    }
  };

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
    if (activeLayout === "easyworship") return;
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
    activeLayout,
  ]);

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
      {/* 1. TOP HEADER */}
      <V2Header
        activeTab={activeTab}
        isConnected={isConnected}
        sessionId={sessionId}
        state={state}
        liveFeedback={liveFeedback}
        lyricSaveFeedback={lyricSaveFeedback}
        showTypographyModal={showTypographyModal}
        onUpdateLiveState={onUpdateLiveState}
        onOpenDisplay={() =>
          openBorderlessWindow("/display", "easypresenter_display")
        }
        onOpenSettings={() => {
          setFormatModalTab(activeTab === "lyrics" ? "lyrics" : "scripture");
          setShowTypographyModal(true);
        }}
      />

      {/* 2. DEDICATED COUNTDOWN TIMER CONTROL BAR */}
      <V2CountdownBar
        state={state}
        currentTimerSec={currentTimerSec}
        formattedCountdown={formattedCountdown}
        isOvertime={isOvertime}
        isWarning={isWarning}
        isCritical={isCritical}
        onStartOrPauseTimer={handleStartOrPauseTimer}
        onResetTimer={onResetTimer}
        adjustTimer={adjustTimer}
        setTimerConfig={setTimerConfig}
        customTimerMinutes={customTimerMinutes}
        setCustomTimerMinutes={setCustomTimerMinutes}
        customTimerSeconds={customTimerSeconds}
        setCustomTimerSeconds={setCustomTimerSeconds}
        timerTitleInput={timerTitleInput}
        setTimerTitleInput={setTimerTitleInput}
        onApplyCustomTimer={handleApplyCustomTimer}
        onSelectPreset={handleSelectPreset}
        toggleShowOnDisplay={toggleShowOnDisplay}
        quickAlertInput={quickAlertInput}
        setQuickAlertInput={setQuickAlertInput}
        isAlertActive={isAlertActive}
        onSendPromptMessage={handleSendPromptMessage}
        onClearPromptMessage={handleClearPromptMessage}
      />

      {/* 3. PROJECTION WORKSPACE (SWITCHABLE: EASYWORSHIP VS QUICK DECK) */}
      {activeLayout === "easyworship" ? (
        <EasyWorshipWorkspace
          state={state}
          onSetLines={onSetLines}
          onJumpTo={onJumpTo}
          onUpdateLiveState={onUpdateLiveState}
          onUpdateTheme={onUpdateTheme}
          onSaveLibraryItem={onSaveLibraryItem}
          onDeleteLibraryItem={onDeleteLibraryItem}
          onAddToSchedule={onAddToSchedule}
          onUpdateSchedule={onUpdateSchedule}
          onRemoveFromSchedule={onRemoveFromSchedule}
          onOpenSongEditor={() => {
            setEditingSong(null);
            setIsSongEditorOpen(true);
          }}
          onEditSong={handleOpenEditSong}
          splitMode={splitMode}
          includeReferenceOnSlide={includeReferenceOnSlide}
          formatSlidesFromData={formatSlidesFromData}
          combinedSongResults={combinedSongResults}
          liveFeedback={liveFeedback}
          setLiveFeedback={setLiveFeedback}
        />
      ) : (
        <>
          {/* Mode Switcher Tabs */}
          <V2ModeTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Search Bar */}
          {activeTab === "lyrics" ? (
            <V2LyricsSearchBar
              lyricsQuery={lyricsQuery}
              setLyricsQuery={setLyricsQuery}
              lyricsLoading={lyricsLoading}
              lyricsScope={lyricsScope}
              setLyricsScope={setLyricsScope}
              lyricsSplitMode={lyricsSplitMode}
              setLyricsSplitMode={setLyricsSplitMode}
              showLyricSuggestions={showLyricSuggestions}
              setShowLyricSuggestions={setShowLyricSuggestions}
              activeLyricIndex={activeLyricIndex}
              setActiveLyricIndex={setActiveLyricIndex}
              lyricSuggestions={lyricSuggestions}
              combinedSongResults={combinedSongResults}
              localSongMatches={localSongMatches}
              onlineSongResults={onlineSongResults}
              selectedSong={selectedSong}
              lyricSearchInputRef={lyricSearchInputRef}
              lyricSuggestionsRef={lyricSuggestionsRef}
              onSelectSong={handleSelectSong}
              onSelectLyricSuggestion={handleSelectLyricSuggestion}
              onOpenAddSong={handleOpenAddSong}
              onDirectSearchSubmit={async (q) => {
                try {
                  setLyricsLoading(true);
                  const apiBase = import.meta.env.VITE_API_URL || "";
                  const res = await fetch(
                    `${apiBase}/api/lyrics/search?q=${encodeURIComponent(q)}`,
                  );
                  const data = await res.json();
                  if (data.results && data.results.length > 0) {
                    setOnlineSongResults(data.results);
                    handleSelectSong(data.results[0], true);
                  }
                } catch (err) {
                  console.error("Direct search failed:", err);
                } finally {
                  setLyricsLoading(false);
                }
              }}
            />
          ) : (
            <V2ScriptureSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedVersion={selectedVersion}
              setSelectedVersion={setSelectedVersion}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
              includeReferenceOnSlide={includeReferenceOnSlide}
              setIncludeReferenceOnSlide={setIncludeReferenceOnSlide}
              loading={loading}
              searchError={searchError}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              activeSuggestionIndex={activeSuggestionIndex}
              setActiveSuggestionIndex={setActiveSuggestionIndex}
              suggestions={suggestions}
              searchInputRef={searchInputRef}
              suggestionsContainerRef={suggestionsContainerRef}
              hasScriptureFocusedRef={hasScriptureFocusedRef}
              scriptureResult={scriptureResult}
              selectedVerseNumber={selectedVerseNumber}
              selectedSlideIndex={selectedSlideIndex}
              state={state}
              updateQueryAndFocusEnd={updateQueryAndFocusEnd}
              onClearScriptureSearch={handleClearScriptureSearch}
              onSelectSuggestion={handleSelectSuggestion}
              onFetchScripture={fetchScripture}
              setSelectedChapter={setSelectedChapter}
              setSelectedVerseNumber={setSelectedVerseNumber}
              setScriptureResult={setScriptureResult}
            />
          )}

          {/* Main 5-Panel Workspace */}
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
                <V2LyricsLibraryPanel
                  lyricsScope={lyricsScope}
                  setLyricsScope={setLyricsScope}
                  lyricsLoading={lyricsLoading}
                  combinedSongResults={combinedSongResults}
                  selectedSong={selectedSong}
                  state={state}
                  onSelectSong={handleSelectSong}
                  onOpenAddSong={handleOpenAddSong}
                  onOpenEditSong={handleOpenEditSong}
                  onSaveSongToLibrary={handleSaveSongToLibrary}
                  onSaveAndSendToLive={handleSaveAndSendToLive}
                  onAddSongToSchedule={handleAddSongToSchedule}
                  onDeleteLibraryItem={onDeleteLibraryItem}
                />
                <V2LyricsSlideDeck
                  selectedSong={selectedSong}
                  lyricSlides={lyricSlides}
                  selectedLyricSlideIndex={selectedLyricSlideIndex}
                  setSelectedLyricSlideIndex={setSelectedLyricSlideIndex}
                  isSelectedSongSaved={isSelectedSongSaved}
                  state={state}
                  lyricsSplitMode={lyricsSplitMode}
                  setLyricsSplitMode={setLyricsSplitMode}
                  onSaveSongToLibrary={handleSaveSongToLibrary}
                  onSaveAndSendToLive={handleSaveAndSendToLive}
                  onOpenEditSong={handleOpenEditSong}
                  onOpenFormatModal={() => {
                    setFormatModalTab("lyrics");
                    setShowTypographyModal(true);
                  }}
                  onPrevSlide={handlePrevSlide}
                  onNextSlide={handleNextSlide}
                  onGoLive={handleGoLive}
                  onJumpTo={onJumpTo}
                  onUpdateLiveState={onUpdateLiveState}
                  onOpenAddSong={handleOpenAddSong}
                />
              </>
            ) : (
              <>
                <V2ScriptureNavigator
                  testamentFilter={testamentFilter}
                  setTestamentFilter={setTestamentFilter}
                  bookSearchText={bookSearchText}
                  setBookSearchText={setBookSearchText}
                  filteredBooks={filteredBooks}
                  selectedBook={selectedBook}
                  selectedChapter={selectedChapter}
                  selectedVerseNumber={selectedVerseNumber}
                  scriptureResult={scriptureResult}
                  onSelectBook={handleSelectBook}
                  onSelectChapter={handleSelectChapter}
                  onSelectVerse={handleSelectVerse}
                />
                <V2ScriptureSlideDeck
                  scriptureResult={scriptureResult}
                  searchQuery={searchQuery}
                  selectedVersion={selectedVersion}
                  generatedSlides={generatedSlides}
                  selectedSlideIndex={selectedSlideIndex}
                  setSelectedSlideIndex={setSelectedSlideIndex}
                  state={state}
                  onUpdateTheme={onUpdateTheme}
                  onPrevSlide={handlePrevSlide}
                  onNextSlide={handleNextSlide}
                  onGoLive={handleGoLive}
                  onJumpTo={onJumpTo}
                />
              </>
            )}

            {/* Live Display Monitor */}
            <V2PreviewMonitor
              state={state}
              activeTab={activeTab}
              generatedSlides={generatedSlides}
              selectedSlideIndex={selectedSlideIndex}
              lyricSlides={lyricSlides}
              selectedLyricSlideIndex={selectedLyricSlideIndex}
              selectedSong={selectedSong}
              scriptureResult={scriptureResult}
              currentTimerSec={currentTimerSec}
              formattedCountdown={formattedCountdown}
              isOvertime={isOvertime}
              isWarning={isWarning}
              isCritical={isCritical}
              now={now}
              onOpenDisplay={() =>
                openBorderlessWindow("/display", "easypresenter_display")
              }
            />
          </main>
        </>
      )}

      {/* Formatting & Typography Settings Modal */}
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
        sampleVerse={state.lines[state.cur] || ""}
      />

      {/* Song Bank Manual Lyric Add & Edit Modal */}
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
