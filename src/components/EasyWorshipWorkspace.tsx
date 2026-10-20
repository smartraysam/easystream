import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  BookOpen,
  Music,
  Tv,
  Plus,
  Play,
  Check,
  Image,
  FileText,
  Palette,
  Loader2,
  X,
  Layers,
  ChevronRight,
  ChevronLeft,
  ListPlus,
  Trash2,
  Globe,
  HardDrive,
  Radio,
  Bookmark,
  Edit,
  Flame,
  Mic2,
  Megaphone,
  Film,
  Upload,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Sliders,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  AppState,
  LiveState,
  LibraryItem,
  PresentationTheme,
  ScheduleItem,
  ScheduleCategory,
  SlidePayload,
} from "../types";
import { DEFAULT_SCHEDULES } from "../data/defaults";
import {
  getBibleSuggestions,
  findBestBookMatch,
  BibleSuggestion,
  AVAILABLE_BIBLE_VERSIONS,
} from "../data/bibleBooks";
import { parseLyricsToSlides } from "../utils/lyricParser";
import {
  encodeSlidePayload,
  parseSlidePayload,
  repaginateWordSlides,
  importMediaFileToLibraryItem,
  importPresentationFileToLibraryItem,
  DEFAULT_MEDIA_ITEMS,
  DEFAULT_PRESENTATION_ITEMS,
} from "../utils/mediaPresentationParser";
import { OnlineSongResult, DEFAULT_WORSHIP_SONG } from "./V2Presenter";
import { POPULAR_WORSHIP_SONGS } from "../data/popularWorshipSongs";
import { ScheduleItemEditorModal } from "./ScheduleItemEditorModal";
import { ThemeBackgroundLayer } from "./ThemeBackgroundLayer";
import {
  EXTENDED_THEME_PRESETS,
  ExtendedThemePreset,
  PATTERN_PRESETS,
  getSavedCustomThemes,
  saveCustomTheme,
  deleteCustomTheme,
  getSavedCustomBackgrounds,
  saveCustomBackground,
  exportThemeToJson,
  parseAndValidateThemeJson,
  getPatternById,
} from "../utils/themePatterns";

export interface OnlineScriptureVerse {
  verse: number;
  text: string;
}

export interface OnlineScriptureResult {
  reference: string;
  version: string;
  versionName: string;
  verses: OnlineScriptureVerse[];
  plainContent: string;
  totalVerses: number;
  source?: "local" | "online" | "offline-fail";
}

interface EasyWorshipWorkspaceProps {
  state: AppState;
  onSetLines: (
    title: string,
    subtitle: string,
    lines: string[],
    category?: AppState["category"],
  ) => void;
  onJumpTo: (index: number) => void;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onUpdateTheme?: (theme: Partial<PresentationTheme>) => void;
  onSaveLibraryItem?: (item: LibraryItem) => void;
  onDeleteLibraryItem?: (id: string) => void;
  onAddToSchedule?: (item: LibraryItem) => void;
  onUpdateSchedule?: (items: ScheduleItem[]) => void;
  onRemoveFromSchedule?: (id: string) => void;
  onOpenSongEditor?: () => void;
  onEditSong?: (song: OnlineSongResult) => void;
  splitMode: "verse" | "double" | "full";
  includeReferenceOnSlide: boolean;
  formatSlidesFromData: (
    res: OnlineScriptureResult,
    mode: "verse" | "double" | "full",
    withRef: boolean,
  ) => string[];
  combinedSongResults: OnlineSongResult[];
  liveFeedback: boolean;
  setLiveFeedback: (v: boolean) => void;
}

export const EasyWorshipWorkspace: React.FC<EasyWorshipWorkspaceProps> = ({
  state,
  onSetLines,
  onJumpTo,
  onUpdateLiveState,
  onUpdateTheme,
  onSaveLibraryItem,
  onDeleteLibraryItem,
  onAddToSchedule,
  onUpdateSchedule,
  onRemoveFromSchedule,
  onOpenSongEditor,
  onEditSong,
  splitMode: _initialSplitMode,
  includeReferenceOnSlide: _initialIncludeRef,
  formatSlidesFromData: _formatSlidesFromData,
  combinedSongResults: _combinedSongResults,
  liveFeedback,
  setLiveFeedback,
}) => {
  // -----------------------------------------------------------------
  // 1. Navigation Tabs: 'scriptures' | 'songs' | 'media' | 'presentations' | 'themes'
  // -----------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<
    "songs" | "scriptures" | "media" | "presentations" | "themes"
  >("scriptures");

  // -----------------------------------------------------------------
  // 2. Schedule List (Retains real schedule from state.schedule)
  // -----------------------------------------------------------------
  const currentScheduleItems: ScheduleItem[] = useMemo(() => {
    if (state.schedule && state.schedule.length > 0) {
      return state.schedule;
    }
    return DEFAULT_SCHEDULES[0]?.items || [];
  }, [state.schedule]);

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    () => currentScheduleItems[0]?.id || "item-1",
  );

  // Quick Add Dropdown Menu State
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState<string | null>(null);

  // Schedule Item Editor Modal State (Add & Edit)
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [editingScheduleItem, setEditingScheduleItem] = useState<ScheduleItem | null>(null);
  const [scheduleModalDefaultCategory, setScheduleModalDefaultCategory] = useState<ScheduleCategory>("custom");

  const showScheduleAlert = (msg: string) => {
    setScheduleFeedback(msg);
    setTimeout(() => setScheduleFeedback(null), 2500);
  };

  // Add Item to Schedule
  const handleAddItemToSchedule = (item: {
    title: string;
    category: ScheduleCategory;
    lines: string[];
    author?: string;
  }) => {
    const newItem: ScheduleItem = {
      id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: item.title,
      category: item.category,
      lines: item.lines,
    };
    if (onUpdateSchedule) {
      onUpdateSchedule([...currentScheduleItems, newItem]);
    } else if (onAddToSchedule) {
      onAddToSchedule({
        id: newItem.id,
        title: newItem.title,
        category: newItem.category,
        content: newItem.lines.join("\n\n"),
        lines: newItem.lines,
        author: item.author,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    showScheduleAlert(`Added "${item.title}" to schedule`);
  };

  // Save / Update Item from Schedule Item Modal
  const handleSaveScheduleEditorItem = (item: ScheduleItem) => {
    const exists = currentScheduleItems.some((i) => i.id === item.id);
    let updatedList: ScheduleItem[];
    if (exists) {
      updatedList = currentScheduleItems.map((i) => (i.id === item.id ? item : i));
      showScheduleAlert(`Updated "${item.title}"`);
    } else {
      updatedList = [...currentScheduleItems, item];
      showScheduleAlert(`Added "${item.title}" to schedule`);
    }

    if (onUpdateSchedule) {
      onUpdateSchedule(updatedList);
    } else if (onAddToSchedule && !exists) {
      onAddToSchedule({
        id: item.id,
        title: item.title,
        category: item.category,
        content: item.lines.join("\n\n"),
        lines: item.lines,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Select and update preview immediately
    setSelectedScheduleId(item.id);
    setPreviewItem({
      id: item.id,
      title: item.title,
      category: item.category,
      lines: item.lines,
      cur: 0,
    });
  };

  // Save & Go Live directly from Schedule Item Modal
  const handleScheduleEditorGoLive = (item: ScheduleItem) => {
    const subtitle =
      item.category === "song"
        ? "Worship"
        : item.category === "prayer"
        ? "Prayer"
        : item.category === "ministration"
        ? "Ministration"
        : item.category === "announcement"
        ? "Announcement"
        : item.category === "hymn"
        ? "Hymn"
        : "";

    onSetLines(
      item.title,
      subtitle,
      item.lines,
      item.category as any,
    );
    onJumpTo(0);
    if (state.liveState.isClearText) {
      onUpdateLiveState({ isClearText: false });
    }
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
  };

  // Remove Item from Schedule
  const handleRemoveScheduleItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromSchedule) {
      onRemoveFromSchedule(itemId);
    } else if (onUpdateSchedule) {
      onUpdateSchedule(currentScheduleItems.filter((i) => i.id !== itemId));
    }
    if (selectedScheduleId === itemId) {
      const remaining = currentScheduleItems.filter((i) => i.id !== itemId);
      if (remaining.length > 0) {
        const next = remaining[0];
        setSelectedScheduleId(next.id);
        setPreviewItem({
          id: next.id,
          title: next.title,
          category: next.category,
          lines: next.lines,
          cur: 0,
        });
      } else {
        setSelectedScheduleId("");
        setPreviewItem({
          id: "blank",
          title: "BLANK SCREEN",
          category: "blank",
          lines: [""],
          cur: 0,
        });
      }
    }
    showScheduleAlert("Item removed from schedule");
  };

  // Add Scripture Verse to Schedule
  const handleAddScriptureToSchedule = (
    verseRef: string,
    verseText: string,
    version: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    const clean = verseText.replace(/^\d+[\s:.]\s*/, "").trim();
    const fullRef = `${verseRef} (${version})`;
    handleAddItemToSchedule({
      title: fullRef,
      category: "scripture",
      lines: [`${fullRef}\n\n${clean}`],
      author: version,
    });
  };

  // Add Song to Schedule
  const handleAddSongToSchedule = (
    song: OnlineSongResult,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    const slides = parseLyricsToSlides(song.plainLyrics, "stanzas");
    handleAddItemToSchedule({
      title: song.trackName,
      category: "song",
      lines: slides.length > 0 ? slides : [song.plainLyrics],
      author: song.artistName || "Worship",
    });
  };

  // Add Currently Previewed Item to Schedule
  const handleAddPreviewToSchedule = () => {
    if (!previewItem || !previewItem.title) return;
    handleAddItemToSchedule({
      title: previewItem.title,
      category: (previewItem.category as any) || "custom",
      lines:
        previewItem.lines && previewItem.lines.length > 0
          ? previewItem.lines
          : [previewItem.title],
    });
  };

  // -----------------------------------------------------------------
  // 3. Preview Output Monitor State
  // -----------------------------------------------------------------
  const [previewItem, setPreviewItem] = useState<{
    id: string;
    title: string;
    category: string;
    lines: string[];
    cur: number;
  }>(() => {
    if (currentScheduleItems.length > 0) {
      const first = currentScheduleItems[0];
      return {
        id: first.id,
        title: first.title,
        category: first.category,
        lines: first.lines,
        cur: 0,
      };
    }
    return {
      id: "preview-init",
      title: "BLANK SCREEN",
      category: "blank",
      lines: [""],
      cur: 0,
    };
  });

  // -----------------------------------------------------------------
  // 4. Scripture Search State (with Space Control & Autocomplete)
  // -----------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState("John 3:16");
  const [selectedVersion, setSelectedVersion] = useState("KJV");
  const [_splitMode, _setSplitMode] = useState<"verse" | "double" | "full">(
    _initialSplitMode || "verse",
  );
  const [_includeReferenceOnSlide, _setIncludeReferenceOnSlide] = useState(
    _initialIncludeRef !== undefined ? _initialIncludeRef : true,
  );
  const [selectedVerseNumber, setSelectedVerseNumber] = useState<number | null>(
    16,
  );
  const [scriptureResult, setScriptureResult] =
    useState<OnlineScriptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Autocomplete suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsContainerRef = useRef<HTMLDivElement | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  // Compute suggestions as user types
  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!searchQuery.trim() || !showSuggestions) return [];
    return getBibleSuggestions(searchQuery, selectedVersion);
  }, [searchQuery, showSuggestions, selectedVersion]);

  // Close suggestions and add-menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    }, 10);
  };

  const [activeVerseRange, setActiveVerseRange] = useState<{
    start: number;
    end: number;
    bookChapter: string;
    version: string;
  } | null>(null);

  // Safe slide formatter helper
  const formatSlides = (
    res: OnlineScriptureResult,
    mode: "verse" | "double" | "full" = _splitMode,
    withRef: boolean = _includeReferenceOnSlide !== false,
  ): string[] => {
    if (_formatSlidesFromData) {
      return _formatSlidesFromData(res, mode, withRef);
    }
    if (!res.verses || res.verses.length === 0) return [];
    const bookChapterMatch = res.reference.match(/^([\d\s]*[A-Za-z\s]+?\s*\d+)/);
    const baseBookChapter = bookChapterMatch ? bookChapterMatch[1].trim() : res.reference;
    return res.verses.map((v) => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, "").trim();
      const verseRef = res.verses.length === 1
        ? `${res.reference} (${res.version})`
        : `${baseBookChapter}:${v.verse} (${res.version})`;
      return withRef ? `${verseRef}\n\n${cleanVerse}` : cleanVerse;
    });
  };

  // Helper to extract citation reference and clean text from any slide
  const parseSlideReference = (slideText: string, fallbackTitle: string) => {
    if (!slideText) return { citation: fallbackTitle, body: "" };
    const parts = slideText.split(/\n\s*\n/);
    if (parts.length > 1) {
      const first = parts[0].trim();
      const looksLikeRef =
        /^[1-3]?\s*[A-Za-z\s]+?\s+\d+(?::\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?$/i.test(first) ||
        /^[1-3]?\s*[A-Za-z\s]+?\s*\([A-Z0-9\s]+\)$/i.test(first) ||
        first.startsWith('—') ||
        first.startsWith('-');
      if (looksLikeRef && first.length < 65) {
        return {
          citation: first.replace(/^[—\-]\s*/, '').trim(),
          body: parts.slice(1).join('\n\n').replace(/^[“"']+|[”"']+$/g, '').trim(),
        };
      }
    }
    return {
      citation: fallbackTitle,
      body: slideText.replace(/^[“"']+|[”"']+$/g, '').trim(),
    };
  };

  // -----------------------------------------------------------------
  // 5. Fetch Scripture Logic (Loads Chapter Verses for Table View)
  // -----------------------------------------------------------------
  const fetchScriptureData = async (
    queryStr: string,
    version: string,
    focusVerse: number | null = null,
    updatePreview = false,
    andGoLive = false,
  ) => {
    const raw = queryStr.trim();
    if (!raw) return;

    // Detect embedded Bible version e.g. "John 3:6-10 KJV" or "Romans 8:28-39 NIV"
    let cleanRef = raw;
    let effectiveVersion = version;
    const versionMatch = cleanRef.match(
      /\b(KJV|NIV|ESV|NKJV|NLT|NASB|CSB|AMP|MSG|CEB|BSB|WEB|ASV|DARBY|DRA|TPT|GNT|YLT)\b/i
    );
    if (versionMatch) {
      effectiveVersion = versionMatch[1].toUpperCase();
      setSelectedVersion(effectiveVersion);
      cleanRef = cleanRef.replace(new RegExp(`\\b${versionMatch[1]}\\b`, 'i'), '').trim();
    }

    // Match range or single verse: e.g. "John 3:6-10", "John 3: 6-10", "John 3:6 - 10", "John 3:16", "Romans 8:28-39", "Psalm 23:1-6"
    const rangeMatch = cleanRef.match(
      /^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+)[\s:]+(\d+)(?:\s*[-–—]\s*(\d+))?/
    );

    let chapterQuery = cleanRef;
    let targetVerseNum = focusVerse;
    let endVerseNum: number | null = null;
    let isVerseRange = false;

    if (rangeMatch) {
      const bookPart = rangeMatch[1].trim();
      const chapPart = rangeMatch[2];
      chapterQuery = `${bookPart} ${chapPart}`;
      if (targetVerseNum === null) {
        targetVerseNum = parseInt(rangeMatch[3], 10);
      }
      if (rangeMatch[4]) {
        endVerseNum = parseInt(rangeMatch[4], 10);
        if (endVerseNum >= targetVerseNum) {
          isVerseRange = true;
        }
      }
    }

    // When multiple verses are searched (e.g. John 3:6-10), always send to Preview AND Live!
    const shouldUpdatePreview = updatePreview || isVerseRange;
    const shouldGoLive = andGoLive || isVerseRange;

    setLoading(true);
    setSearchError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(chapterQuery)}&version=${encodeURIComponent(effectiveVersion)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setSearchError(data.error);
        setScriptureResult(null);
        setActiveVerseRange(null);
      } else if (data.verses && data.verses.length > 0) {
        setScriptureResult(data);
        setSearchError(null);

        const baseBook =
          data.reference.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]?.trim() ||
          data.reference;

        if (targetVerseNum !== null) {
          setSelectedVerseNumber(targetVerseNum);

          if (endVerseNum !== null && endVerseNum >= targetVerseNum) {
            // Verse range e.g. John 3:6-10 or Romans 8:28-39
            const rangeVerses = data.verses.filter(
              (v: OnlineScriptureVerse) => v.verse >= targetVerseNum! && v.verse <= endVerseNum!,
            );
            const finalVerses = rangeVerses.length > 0 ? rangeVerses : data.verses;
            const refHeader = `${baseBook}:${targetVerseNum}-${endVerseNum} (${data.version || effectiveVersion})`;
            const rangeSlides = formatSlides(
              {
                ...data,
                reference: `${baseBook}:${targetVerseNum}-${endVerseNum}`,
                version: data.version || effectiveVersion,
                verses: finalVerses,
              },
              _splitMode,
              _includeReferenceOnSlide,
            );

            setActiveVerseRange({
              start: targetVerseNum,
              end: endVerseNum,
              bookChapter: baseBook,
              version: data.version || effectiveVersion,
            });

            if (shouldUpdatePreview) {
              setPreviewItem({
                id: `range-${targetVerseNum}-${endVerseNum}-${Date.now()}`,
                title: refHeader,
                category: "scripture",
                lines: rangeSlides,
                cur: 0,
              });
            }

            if (shouldGoLive) {
              onSetLines(refHeader, data.version || effectiveVersion, rangeSlides, "scripture");
              onJumpTo(0);
              if (state.liveState.isClearText) {
                onUpdateLiveState({ isClearText: false });
              }
              setLiveFeedback(true);
              setTimeout(() => setLiveFeedback(false), 2500);
            }
          } else {
            // Single verse e.g. John 3:16
            setActiveVerseRange(null);
            const foundV = data.verses.find(
              (v: OnlineScriptureVerse) => v.verse === targetVerseNum,
            ) || data.verses[0];
            const cleanVerse = foundV.text.replace(/^\d+[\s:.]\s*/, "").trim();
            const refHeader = `${baseBook}:${foundV.verse} (${data.version || effectiveVersion})`;
            const slides = [`${refHeader}\n\n${cleanVerse}`];

            if (shouldUpdatePreview) {
              setPreviewItem({
                id: `verse-${foundV.verse}-${Date.now()}`,
                title: refHeader,
                category: "scripture",
                lines: slides,
                cur: 0,
              });
            }

            if (shouldGoLive) {
              onSetLines(refHeader, data.version || effectiveVersion, slides, "scripture");
              onJumpTo(0);
              if (state.liveState.isClearText) {
                onUpdateLiveState({ isClearText: false });
              }
              setLiveFeedback(true);
              setTimeout(() => setLiveFeedback(false), 2500);
            }
          }
        } else {
          // Whole chapter e.g. Psalm 23
          setActiveVerseRange(null);
          setSelectedVerseNumber(data.verses[0].verse);
          const refHeader = `${data.reference} (${data.version || effectiveVersion})`;
          const chapterSlides = formatSlides(data, _splitMode, _includeReferenceOnSlide);

          if (shouldUpdatePreview) {
            setPreviewItem({
              id: `chapter-${data.reference}-${Date.now()}`,
              title: refHeader,
              category: "scripture",
              lines: chapterSlides,
              cur: 0,
            });
          }

          if (shouldGoLive) {
            onSetLines(refHeader, data.version || effectiveVersion, chapterSlides, "scripture");
            onJumpTo(0);
            if (state.liveState.isClearText) {
              onUpdateLiveState({ isClearText: false });
            }
            setLiveFeedback(true);
            setTimeout(() => setLiveFeedback(false), 2500);
          }
        }
      } else {
        setSearchError(`No verses found for "${raw}" in ${effectiveVersion}.`);
        setActiveVerseRange(null);
      }
    } catch (err: any) {
      setSearchError(err?.message || "Failed to fetch scripture");
      setActiveVerseRange(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial load: fetch John 3:16 in KJV
  useEffect(() => {
    fetchScriptureData("John 3:16", "KJV", 16, false);
  }, []);

  // -----------------------------------------------------------------
  // 6. Songs Tab State, Online Search, & Lyrics Splitting
  // -----------------------------------------------------------------
  const [lyricsQuery, setLyricsQuery] = useState("");
  const [lyricsScope, setLyricsScope] = useState<"all" | "local" | "online">("all");
  const [lyricsSplitMode, setLyricsSplitMode] = useState<
    "lines" | "smart" | "smart3" | "stanzas"
  >("smart");
  const [selectedLyricSlideIndex, setSelectedLyricSlideIndex] = useState(0);
  const [onlineSongResults, setOnlineSongResults] = useState<OnlineSongResult[]>([]);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const lyricSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Matches from local church song bank
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

  // 2. Combined songs according to scope (all / local / online)
  const combinedSongs: OnlineSongResult[] = useMemo(() => {
    if (lyricsScope === "local") return localSongMatches;
    if (lyricsScope === "online") return onlineSongResults;

    const localTitles = new Set(
      localSongMatches.map((m) => m.trackName.toLowerCase().trim()),
    );
    const filteredOnline = onlineSongResults.filter(
      (online) => !localTitles.has(online.trackName.toLowerCase().trim()),
    );
    const merged = [...localSongMatches, ...filteredOnline];
    if (merged.length === 0 && !lyricsQuery.trim()) {
      return [DEFAULT_WORSHIP_SONG];
    }
    return merged;
  }, [lyricsScope, localSongMatches, onlineSongResults, lyricsQuery]);

  // Active selected song
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(() => {
    if (localSongMatches.length > 0) return localSongMatches[0];
    return DEFAULT_WORSHIP_SONG;
  });

  // Debounced Online Search via /api/lyrics/search
  useEffect(() => {
    if (activeTab !== "songs") return;
    if (lyricSearchTimeoutRef.current) {
      clearTimeout(lyricSearchTimeoutRef.current);
    }

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
          (s: any) => ({
            ...s,
            isLocal: false,
          }),
        );
        setOnlineSongResults(songs);
      } catch (err) {
        console.error("Failed to search lyrics:", err);
      } finally {
        setLyricsLoading(false);
      }
    }, 350);

    return () => {
      if (lyricSearchTimeoutRef.current) {
        clearTimeout(lyricSearchTimeoutRef.current);
      }
    };
  }, [lyricsQuery, lyricsScope, activeTab]);

  // Slides for currently selected song split with lyricsSplitMode
  const currentSongSlides: string[] = useMemo(() => {
    if (!selectedSong || !selectedSong.plainLyrics) return [];
    return parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode);
  }, [selectedSong, lyricsSplitMode]);

  // Check if selected song is in library
  const isSelectedSongSaved = useMemo(() => {
    if (!selectedSong) return false;
    if (selectedSong.isLocal) return true;
    return (state.library || []).some(
      (i) =>
        i.title.toLowerCase().trim() === selectedSong.trackName.toLowerCase().trim(),
    );
  }, [selectedSong, state.library]);

  // Save song to church library
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
  };

  // Handle selecting a song from the search results
  const handleSelectSong = async (
    song: OnlineSongResult,
    andGoLive: boolean = false,
  ) => {
    let activeSong = song;
    let activeLyrics = song.plainLyrics;

    // Fetch full lyrics details if lazy-loaded
    if (!song.plainLyrics || song.plainLyrics.trim().length < 20) {
      try {
        setLyricsLoading(true);
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(song.id)}&url=${encodeURIComponent(song.sourceUrl || "")}`,
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          activeLyrics = data.result.plainLyrics;
          activeSong = {
            ...song,
            plainLyrics: data.result.plainLyrics,
            snippet: data.result.snippet || song.snippet,
          };
          setOnlineSongResults((prev) =>
            prev.map((s) => (s.id === song.id ? activeSong : s)),
          );
        }
      } catch (err) {
        console.error("Error fetching online lyrics details:", err);
      } finally {
        setLyricsLoading(false);
      }
    }

    setSelectedSong(activeSong);
    setSelectedLyricSlideIndex(0);

    const slides = parseLyricsToSlides(activeLyrics, lyricsSplitMode);

    // PREVIEW IMMEDIATELY IN DUAL MONITOR PREVIEW SCREEN
    setPreviewItem({
      id: activeSong.id,
      title: activeSong.trackName,
      category: "song",
      lines: slides,
      cur: 0,
    });

    if (andGoLive) {
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
  };

  // Save song to church library with current split mode AND send to live directly
  const handleSaveAndSendToLive = async (songToSave = selectedSong) => {
    if (!songToSave) return;
    let fullLyrics = songToSave.plainLyrics;
    let activeSong = songToSave;

    if (!fullLyrics || fullLyrics.trim().length < 20) {
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

    // 1. Save to library
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
        category:
          (activeSong.localItem?.category as any) || existingLocal?.category || "song",
        content: fullLyrics || activeSong.plainLyrics,
        lines: slides,
        createdAt:
          activeSong.localItem?.createdAt || existingLocal?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      onSaveLibraryItem(libraryItem);
      activeSong = {
        ...activeSong,
        isLocal: true,
        localItem: libraryItem,
      };
    }

    setSelectedSong(activeSong);
    setSelectedLyricSlideIndex(0);

    // 2. Set preview
    setPreviewItem({
      id: activeSong.id,
      title: activeSong.trackName,
      category: "song",
      lines: slides,
      cur: 0,
    });

    // 3. Send directly to Live!
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
    setTimeout(() => setLiveFeedback(false), 2500);
  };

  // Helper to open editor pre-populated with full lyrics and split mode
  const handleEditCurrentSong = async (songToEdit = selectedSong) => {
    if (!songToEdit) return;
    let fullLyrics = songToEdit.plainLyrics;
    let activeSong = songToEdit;

    if (!fullLyrics || fullLyrics.trim().length < 20) {
      try {
        setLyricsLoading(true);
        const apiBase = import.meta.env.VITE_API_URL || "";
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(songToEdit.id)}&url=${encodeURIComponent(songToEdit.sourceUrl || "")}`,
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          fullLyrics = data.result.plainLyrics;
          activeSong = {
            ...songToEdit,
            plainLyrics: fullLyrics,
            snippet: data.result.snippet || songToEdit.snippet,
          };
          setOnlineSongResults((prev) =>
            prev.map((s) => (s.id === songToEdit.id ? activeSong : s)),
          );
        }
      } catch (err) {
        console.error("Error fetching song details for editor:", err);
      } finally {
        setLyricsLoading(false);
      }
    }

    if (onEditSong) {
      onEditSong({
        ...activeSong,
        plainLyrics: fullLyrics || activeSong.plainLyrics,
      });
    } else if (onOpenSongEditor) {
      onOpenSongEditor();
    }
  };

  // Handle Split Mode Change (e.g. 1 Line, Smart 2, Smart 3, Stanzas)
  const handleSplitModeChange = (
    newMode: "lines" | "smart" | "smart3" | "stanzas",
  ) => {
    setLyricsSplitMode(newMode);
    if (selectedSong && selectedSong.plainLyrics) {
      const newSlides = parseLyricsToSlides(selectedSong.plainLyrics, newMode);
      setSelectedLyricSlideIndex(0);
      setPreviewItem((prev) => ({
        ...prev,
        lines: newSlides,
        cur: 0,
      }));
    }
  };

  // Handle slide card click -> selects and previews that slide
  const handleSelectSlideCard = (idx: number) => {
    setSelectedLyricSlideIndex(idx);
    setPreviewItem((prev) => ({
      ...prev,
      cur: idx,
    }));
    const isSongLive =
      state.category === "song" &&
      state.title?.toLowerCase().trim() ===
        selectedSong?.trackName.toLowerCase().trim();
    if (isSongLive) {
      onJumpTo(idx);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
    }
  };

  // Handle slide card double-click -> projects that slide live immediately
  const handleDoubleClickSlideCard = (idx: number) => {
    setSelectedLyricSlideIndex(idx);
    setPreviewItem((prev) => ({
      ...prev,
      cur: idx,
    }));
    if (selectedSong) {
      const slides = parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode);
      onSetLines(
        selectedSong.trackName,
        selectedSong.artistName || "Worship",
        slides,
        "song",
      );
      onJumpTo(idx);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
      setLiveFeedback(true);
      setTimeout(() => setLiveFeedback(false), 2000);
    }
  };

  // -----------------------------------------------------------------
  // 6B. MEDIA TAB STATE & HANDLERS (Images & Videos)
  // -----------------------------------------------------------------
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const [mediaUploading, setMediaUploading] = useState(false);
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null);

  const allMediaItems: LibraryItem[] = useMemo(() => {
    const savedMedia = (state.library || []).filter((i) => i.category === "media");
    const savedIds = new Set(savedMedia.map((i) => i.id));
    const defaults = DEFAULT_MEDIA_ITEMS.filter((d) => !savedIds.has(d.id));
    return [...savedMedia, ...defaults];
  }, [state.library]);

  const filteredMediaItems: LibraryItem[] = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase();
    return allMediaItems.filter((item) => {
      if (mediaFilter !== "all" && item.mediaType !== mediaFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.author || "").toLowerCase().includes(q) ||
        (item.content || "").toLowerCase().includes(q)
      );
    });
  }, [allMediaItems, mediaFilter, mediaQuery]);

  const [selectedMediaId, setSelectedMediaId] = useState<string>(
    () => DEFAULT_MEDIA_ITEMS[0]?.id || "",
  );

  const selectedMediaItem: LibraryItem | null = useMemo(() => {
    return (
      allMediaItems.find((i) => i.id === selectedMediaId) ||
      filteredMediaItems[0] ||
      allMediaItems[0] ||
      null
    );
  }, [allMediaItems, filteredMediaItems, selectedMediaId]);

  const handleSelectMediaItem = (item: LibraryItem, andGoLive: boolean = false) => {
    setSelectedMediaId(item.id);
    setPreviewItem({
      id: item.id,
      title: item.title,
      category: "media",
      lines: item.lines,
      cur: 0,
    });

    if (andGoLive) {
      onSetLines(
        item.title,
        item.mediaType === "video" ? "Video Media" : "Image Media",
        item.lines,
        "media",
      );
      onJumpTo(0);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
      setLiveFeedback(true);
      setTimeout(() => setLiveFeedback(false), 2000);
    }
  };

  const handleImportMediaFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setMediaUploading(true);
    try {
      let lastImported: LibraryItem | null = null;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const newItem = await importMediaFileToLibraryItem(file);
        onSaveLibraryItem?.(newItem);
        lastImported = newItem;
      }
      if (lastImported) {
        setSelectedMediaId(lastImported.id);
        setPreviewItem({
          id: lastImported.id,
          title: lastImported.title,
          category: "media",
          lines: lastImported.lines,
          cur: 0,
        });
        showScheduleAlert(`Imported "${lastImported.title}" to Media`);
      }
    } catch (err) {
      console.error("Failed to import media file:", err);
    } finally {
      setMediaUploading(false);
      if (mediaUploadInputRef.current) {
        mediaUploadInputRef.current.value = "";
      }
    }
  };

  const handleUpdateMediaSettings = (
    item: LibraryItem,
    patch: Partial<SlidePayload>,
  ) => {
    const existingPayload = parseSlidePayload(item.lines?.[0] || "");
    const nextPayload: SlidePayload = {
      kind: "media",
      mediaType: item.mediaType || existingPayload?.mediaType || "image",
      mediaUrl: item.mediaUrl || existingPayload?.mediaUrl || "",
      heading:
        patch.heading !== undefined
          ? patch.heading
          : existingPayload?.heading || item.title,
      body:
        patch.body !== undefined ? patch.body : existingPayload?.body || "",
      fitMode: patch.fitMode || existingPayload?.fitMode || "contain",
      muted:
        patch.muted !== undefined
          ? patch.muted
          : existingPayload?.muted ?? false,
      loop:
        patch.loop !== undefined ? patch.loop : existingPayload?.loop ?? true,
    };
    const encoded = encodeSlidePayload(nextPayload);
    const updatedItem: LibraryItem = {
      ...item,
      lines: [encoded],
      updatedAt: Date.now(),
    };
    onSaveLibraryItem?.(updatedItem);

    if (previewItem.id === item.id || selectedMediaId === item.id) {
      setPreviewItem((prev) => ({
        ...prev,
        lines: [encoded],
      }));
    }

    if (state.category === "media" && state.title === item.title) {
      onSetLines(
        item.title,
        item.mediaType === "video" ? "Video Media" : "Image Media",
        [encoded],
        "media",
      );
      onJumpTo(0);
    }
  };

  const handleAddMediaToSchedule = (item: LibraryItem) => {
    handleAddItemToSchedule({
      title: item.title,
      category: "media",
      lines: item.lines,
      author: item.author || (item.mediaType === "video" ? "Video" : "Image"),
    });
  };

  const handleDeleteMediaItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDeleteLibraryItem?.(id);
  };

  // -----------------------------------------------------------------
  // 6C. PRESENTATIONS TAB STATE & HANDLERS (PPT, Word, PDF)
  // -----------------------------------------------------------------
  const [presQuery, setPresQuery] = useState("");
  const [presFilter, setPresFilter] = useState<"all" | "pptx" | "docx" | "pdf">("all");
  const [presUploading, setPresUploading] = useState(false);
  const [wordSplitMode, setWordSplitMode] = useState<
    "standard" | "compact" | "headings" | "paragraphs"
  >("standard");
  const presUploadInputRef = useRef<HTMLInputElement | null>(null);

  const allPresentationItems: LibraryItem[] = useMemo(() => {
    const savedPres = (state.library || []).filter(
      (i) => i.category === "presentation",
    );
    const savedIds = new Set(savedPres.map((i) => i.id));
    const defaults = DEFAULT_PRESENTATION_ITEMS.filter((d) => !savedIds.has(d.id));
    return [...savedPres, ...defaults];
  }, [state.library]);

  const filteredPresentationItems: LibraryItem[] = useMemo(() => {
    const q = presQuery.trim().toLowerCase();
    return allPresentationItems.filter((item) => {
      if (presFilter !== "all" && item.docType !== presFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.author || "").toLowerCase().includes(q) ||
        (item.content || "").toLowerCase().includes(q)
      );
    });
  }, [allPresentationItems, presFilter, presQuery]);

  const [selectedPresId, setSelectedPresId] = useState<string>(
    () => DEFAULT_PRESENTATION_ITEMS[0]?.id || "",
  );
  const [selectedPresSlideIndex, setSelectedPresSlideIndex] = useState<number>(0);

  const selectedPresentation: LibraryItem | null = useMemo(() => {
    return (
      allPresentationItems.find((i) => i.id === selectedPresId) ||
      filteredPresentationItems[0] ||
      allPresentationItems[0] ||
      null
    );
  }, [allPresentationItems, filteredPresentationItems, selectedPresId]);

  const getWordItemSlides = (
    item: LibraryItem,
    mode: "standard" | "compact" | "headings" | "paragraphs",
  ): string[] => {
    if (item.docType !== "docx" || mode === "standard") {
      return item.lines || [];
    }
    const rawParas = (item.content || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (rawParas.length === 0) return item.lines || [];
    const firstSlide = parseSlidePayload(item.lines?.[0] || "");
    const payloads = repaginateWordSlides(
      rawParas,
      item.title,
      mode,
      firstSlide?.imageUrl,
    );
    return payloads.map(encodeSlidePayload);
  };

  const currentPresentationSlides: string[] = useMemo(() => {
    if (!selectedPresentation) return [];
    return getWordItemSlides(selectedPresentation, wordSplitMode);
  }, [selectedPresentation, wordSplitMode]);

  const handleSelectPresentation = (
    item: LibraryItem,
    andGoLive: boolean = false,
    initialSlideIdx: number = 0,
  ) => {
    setSelectedPresId(item.id);
    const slides = getWordItemSlides(item, wordSplitMode);
    const safeIdx = Math.max(0, Math.min(initialSlideIdx, slides.length - 1));
    setSelectedPresSlideIndex(safeIdx);

    setPreviewItem({
      id: item.id,
      title: item.title,
      category: "presentation",
      lines: slides,
      cur: safeIdx,
    });

    if (andGoLive) {
      const subtitle =
        item.docType === "pptx"
          ? "PowerPoint Presentation"
          : item.docType === "docx"
          ? "Word Document"
          : "PDF Document";
      onSetLines(item.title, subtitle, slides, "presentation");
      onJumpTo(safeIdx);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
      setLiveFeedback(true);
      setTimeout(() => setLiveFeedback(false), 2000);
    }
  };

  const handleSelectPresSlide = (idx: number, andGoLive: boolean = false) => {
    if (!selectedPresentation || currentPresentationSlides.length === 0) return;
    const clamped = Math.max(
      0,
      Math.min(idx, currentPresentationSlides.length - 1),
    );
    setSelectedPresSlideIndex(clamped);

    setPreviewItem({
      id: selectedPresentation.id,
      title: selectedPresentation.title,
      category: "presentation",
      lines: currentPresentationSlides,
      cur: clamped,
    });

    const isPresAlreadyLive =
      state.category === "presentation" &&
      state.title?.toLowerCase().trim() ===
        selectedPresentation.title.toLowerCase().trim();

    if (andGoLive) {
      const subtitle =
        selectedPresentation.docType === "pptx"
          ? "PowerPoint Presentation"
          : selectedPresentation.docType === "docx"
          ? "Word Document"
          : "PDF Document";
      onSetLines(
        selectedPresentation.title,
        subtitle,
        currentPresentationSlides,
        "presentation",
      );
      onJumpTo(clamped);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
      setLiveFeedback(true);
      setTimeout(() => setLiveFeedback(false), 2000);
    } else if (isPresAlreadyLive) {
      onJumpTo(clamped);
      if (state.liveState.isClearText) {
        onUpdateLiveState({ isClearText: false });
      }
    }
  };

  const handleWordSplitModeChange = (
    mode: "standard" | "compact" | "headings" | "paragraphs",
  ) => {
    setWordSplitMode(mode);
    if (selectedPresentation && selectedPresentation.docType === "docx") {
      const nextSlides = getWordItemSlides(selectedPresentation, mode);
      setSelectedPresSlideIndex(0);
      setPreviewItem({
        id: selectedPresentation.id,
        title: selectedPresentation.title,
        category: "presentation",
        lines: nextSlides,
        cur: 0,
      });
      if (
        state.category === "presentation" &&
        state.title === selectedPresentation.title
      ) {
        onSetLines(
          selectedPresentation.title,
          "Word Document",
          nextSlides,
          "presentation",
        );
        onJumpTo(0);
      }
    }
  };

  const handleImportPresentationFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setPresUploading(true);
    try {
      let lastImported: LibraryItem | null = null;
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const newItem = await importPresentationFileToLibraryItem(file);
        onSaveLibraryItem?.(newItem);
        lastImported = newItem;
      }
      if (lastImported) {
        setSelectedPresId(lastImported.id);
        setSelectedPresSlideIndex(0);
        setPreviewItem({
          id: lastImported.id,
          title: lastImported.title,
          category: "presentation",
          lines: lastImported.lines,
          cur: 0,
        });
        showScheduleAlert(
          `Imported "${lastImported.title}" (${lastImported.lines.length} ${
            lastImported.docType === "pptx" ? "slides" : "pages"
          })`,
        );
      }
    } catch (err) {
      console.error("Failed to import presentation file:", err);
    } finally {
      setPresUploading(false);
      if (presUploadInputRef.current) {
        presUploadInputRef.current.value = "";
      }
    }
  };

  const handleAddPresentationToSchedule = (
    item: LibraryItem,
    slidesOverride?: string[],
  ) => {
    handleAddItemToSchedule({
      title: item.title,
      category: "presentation",
      lines: slidesOverride || item.lines,
      author:
        item.author ||
        (item.docType === "pptx"
          ? "PowerPoint"
          : item.docType === "docx"
          ? "Word Document"
          : "PDF Document"),
    });
  };

  const handleDeletePresentation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onDeleteLibraryItem?.(id);
  };

  // Helper to render structured Media & Presentation payloads inside 16:9 Preview & Live Monitors
  const renderMonitorSlidePayload = (
    payload: SlidePayload,
    isLiveMonitor: boolean,
  ) => {
    if (payload.kind === "media") {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            background: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {payload.mediaType === "video" && payload.mediaUrl ? (
            <video
              key={payload.mediaUrl}
              src={payload.mediaUrl}
              autoPlay
              playsInline
              loop={payload.loop ?? true}
              muted={isLiveMonitor ? payload.muted ?? true : true}
              style={{
                width: "100%",
                height: "100%",
                objectFit: payload.fitMode || "contain",
              }}
            />
          ) : payload.mediaUrl ? (
            <img
              src={payload.mediaUrl}
              alt={payload.heading || "Media"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: payload.fitMode || "contain",
              }}
            />
          ) : null}

          {/* Media Type Badge */}
          <div
            style={{
              position: "absolute",
              top: "6px",
              left: "8px",
              padding: "2px 6px",
              borderRadius: "4px",
              background: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontSize: "8px",
              fontWeight: 800,
              color: payload.mediaType === "video" ? "#38bdf8" : "#34d399",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {payload.mediaType === "video" ? "VIDEO" : "IMAGE"} •{" "}
            {(payload.fitMode || "contain").toUpperCase()}
          </div>

          {payload.body && (
            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "12px",
                right: "12px",
                padding: "4px 8px",
                borderRadius: "6px",
                background: "rgba(0, 0, 0, 0.72)",
                backdropFilter: "blur(6px)",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {payload.body}
            </div>
          )}
        </div>
      );
    }

    if (payload.kind === "presentation") {
      const docType = payload.docType || "pptx";
      const badgeColor =
        docType === "pptx"
          ? "#f97316"
          : docType === "docx"
          ? "#3b82f6"
          : "#ef4444";
      const unitLabel = docType === "pptx" ? "SLIDE" : "PAGE";
      const hasBullets =
        Array.isArray(payload.bullets) && payload.bullets.length > 0;
      const bodyLines = (payload.body || "")
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);

      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            padding: "10px 34px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "left",
            background:
              docType === "docx"
                ? "linear-gradient(155deg, #0f172a 0%, #1e293b 100%)"
                : docType === "pdf"
                ? "linear-gradient(155deg, #18181b 0%, #27272a 100%)"
                : "linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%)",
            overflow: "hidden",
          }}
        >
          {/* Top Bar: Document Type & Slide/Page Counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "6px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "4px",
            }}
          >
            <span
              style={{
                fontSize: "8px",
                fontWeight: 800,
                color: badgeColor,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {docType.toUpperCase()} • {payload.heading || "Presentation"}
            </span>
            <span
              style={{
                fontSize: "8px",
                fontWeight: 800,
                color: "#e2e8f0",
                background: "rgba(255, 255, 255, 0.1)",
                padding: "1px 6px",
                borderRadius: "999px",
                flexShrink: 0,
              }}
            >
              {unitLabel} {payload.pageNumber || 1} / {payload.totalPages || 1}
            </span>
          </div>

          {/* Center Slide / Page Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              overflow: "hidden",
              padding: "4px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "4px",
                minWidth: 0,
              }}
            >
              {payload.heading && (
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#ffffff",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {payload.heading}
                </div>
              )}

              {hasBullets ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {payload.bullets!.slice(0, 4).map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "5px",
                        fontSize: "9.5px",
                        color: "#e2e8f0",
                        lineHeight: 1.25,
                      }}
                    >
                      <span style={{ color: badgeColor, fontWeight: 900 }}>
                        •
                      </span>
                      <span
                        style={{
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {b}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: "9.5px",
                    color: "#e2e8f0",
                    lineHeight: 1.35,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    whiteSpace: "pre-line",
                  }}
                >
                  {bodyLines.join("\n") || payload.heading || ""}
                </div>
              )}
            </div>

            {payload.imageUrl && (
              <div
                style={{
                  width: "34%",
                  height: "100%",
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  background: "rgba(0, 0, 0, 0.4)",
                  flexShrink: 0,
                }}
              >
                <img
                  src={payload.imageUrl}
                  alt="Slide visual"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "8px",
              color: "#94a3b8",
            }}
          >
            <span>{`${unitLabel} ${payload.pageNumber || 1}`}</span>
            {payload.pdfUrl && (
              <span style={{ color: "#f87171", fontWeight: 700 }}>
                PDF Document
              </span>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // -----------------------------------------------------------------
  // 7. Send Preview to Live Output
  // -----------------------------------------------------------------
  const handleGoLive = () => {
    if (previewItem.category === "blank") {
      onSetLines("BLANK SCREEN", "", [""], "custom");
      onJumpTo(0);
    } else if (previewItem.category === "scripture") {
      onSetLines(
        previewItem.title,
        selectedVersion,
        previewItem.lines,
        "scripture",
      );
      onJumpTo(previewItem.cur || 0);
    } else if (
      previewItem.category === "song" ||
      previewItem.category === "hymn"
    ) {
      onSetLines(previewItem.title, "Worship", previewItem.lines, "song");
      onJumpTo(previewItem.cur || 0);
    } else if (previewItem.category === "media") {
      const p = parseSlidePayload(previewItem.lines?.[0] || "");
      onSetLines(
        previewItem.title,
        p?.mediaType === "video" ? "Video Media" : "Image Media",
        previewItem.lines,
        "media",
      );
      onJumpTo(previewItem.cur || 0);
    } else if (previewItem.category === "presentation") {
      const p = parseSlidePayload(previewItem.lines?.[0] || "");
      const sub =
        p?.docType === "pptx"
          ? "PowerPoint Presentation"
          : p?.docType === "docx"
          ? "Word Document"
          : "PDF Document";
      onSetLines(previewItem.title, sub, previewItem.lines, "presentation");
      onJumpTo(previewItem.cur || 0);
    } else {
      onSetLines(
        previewItem.title,
        "",
        previewItem.lines,
        previewItem.category as any,
      );
      onJumpTo(previewItem.cur || 0);
    }

    if (state.liveState.isClearText) {
      onUpdateLiveState({ isClearText: false });
    }
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
  };

  // Global Keyboard listener for Enter (Go Live) and Arrow keys (Slide/Verse navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select"
      ) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleGoLive();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (state.lines && state.lines.length > 1 && state.cur < state.lines.length - 1) {
          const nextIdx = state.cur + 1;
          onJumpTo(nextIdx);
          if (activeVerseRange) {
            setSelectedVerseNumber(activeVerseRange.start + nextIdx);
          }
          if (state.category === "presentation") {
            setSelectedPresSlideIndex(nextIdx);
          }
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (state.lines && state.lines.length > 1 && state.cur > 0) {
          const prevIdx = state.cur - 1;
          onJumpTo(prevIdx);
          if (activeVerseRange) {
            setSelectedVerseNumber(activeVerseRange.start + prevIdx);
          }
          if (state.category === "presentation") {
            setSelectedPresSlideIndex(prevIdx);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, selectedVersion, state.lines, state.cur, activeVerseRange, state.category]);

  // -----------------------------------------------------------------
  // 8. Themes Tab State, Handlers & Custom Theme Studio
  // -----------------------------------------------------------------
  const [previewTheme, setPreviewTheme] = useState<Partial<PresentationTheme> | null>(null);
  const [themeSearchQuery, setThemeSearchQuery] = useState("");
  const [themeFilterCategory, setThemeFilterCategory] = useState<
    "all" | "color" | "pattern" | "solid" | "custom"
  >("all");
  const [customThemes, setCustomThemes] = useState<ExtendedThemePreset[]>(() =>
    getSavedCustomThemes()
  );
  const [customBackgrounds, setCustomBackgrounds] = useState<string[]>(() =>
    getSavedCustomBackgrounds()
  );
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [themeActionFeedback, setThemeActionFeedback] = useState<string | null>(null);

  // Custom Theme Studio Draft State
  const [customThemeDraftName, setCustomThemeDraftName] = useState("Custom Worship Theme");
  const [customThemeDraft, setCustomThemeDraft] = useState<Partial<PresentationTheme>>(() => ({
    fontFamily: state.theme.fontFamily || "Montserrat, sans-serif",
    fontSize: state.theme.fontSize || 44,
    fontWeight: state.theme.fontWeight || 700,
    textColor: state.theme.textColor || "#ffffff",
    accentColor: state.theme.accentColor || "#38bdf8",
    bgType: state.theme.bgType || "animated-gradient",
    bgColor: state.theme.bgColor || "#090d16",
    bgGradient:
      state.theme.bgGradient ||
      "linear-gradient(135deg, #060b19 0%, #1e1b4b 45%, #2e1065 100%)",
    bgPattern: state.theme.bgPattern || "crosses",
    bgPatternColor: state.theme.bgPatternColor || "#f59e0b",
    bgPatternOpacity: state.theme.bgPatternOpacity ?? 0.2,
    bgPatternScale: state.theme.bgPatternScale ?? 1,
    bgImage: state.theme.bgImage,
    bgImageFit: state.theme.bgImageFit || "cover",
    bgOverlayOpacity: state.theme.bgOverlayOpacity ?? 0.2,
    textShadow: state.theme.textShadow ?? true,
    shadowBlur: state.theme.shadowBlur ?? 16,
    shadowColor: state.theme.shadowColor || "rgba(0,0,0,0.9)",
    textOutline: state.theme.textOutline ?? true,
    outlineWidth: state.theme.outlineWidth ?? 2,
    outlineColor: state.theme.outlineColor || "#000000",
  }));

  const themeFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgImageInputRef = useRef<HTMLInputElement | null>(null);

  const showThemeToast = (msg: string) => {
    setThemeActionFeedback(msg);
    setTimeout(() => setThemeActionFeedback(null), 3500);
  };

  // Preview a theme in the Upper Preview Monitor
  const handlePreviewTheme = (themeItem: Partial<PresentationTheme>, name?: string) => {
    setPreviewTheme(themeItem);
    // If preview monitor has blank, set an inspiring scripture preview slide
    if (!previewItem.title || previewItem.category === "blank") {
      setPreviewItem({
        id: "theme-sample-preview",
        title: "Theme Preview",
        category: "scripture",
        lines: [
          "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.\n\nJohn 3:16",
        ],
        cur: 0,
      });
    }
    showThemeToast(`Previewing "${name || "Theme"}" in Preview Monitor`);
  };

  // Apply theme to Live Output (and sync with Preview & Display)
  const handleApplyTheme = (themeToApply: Partial<PresentationTheme>, name?: string) => {
    onUpdateTheme?.(themeToApply);
    setPreviewTheme(null);
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2000);
    showThemeToast(`Theme "${name || "Theme"}" applied to Live Monitor & Display!`);
  };

  // Import theme from JSON file
  const handleImportThemeJsonFile = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const res = parseAndValidateThemeJson(content);
      if (res.valid && res.theme) {
        const themeId = `custom-theme-${Date.now()}`;
        const newPreset: ExtendedThemePreset = {
          id: themeId,
          name: res.name || file.name.replace(/\.json$/i, ""),
          category: "custom",
          description: "Imported custom theme configuration",
          palette: [
            res.theme.bgColor || "#090d16",
            res.theme.accentColor || "#38bdf8",
            res.theme.textColor || "#ffffff",
          ],
          theme: res.theme,
        };
        saveCustomTheme(newPreset);
        setCustomThemes(getSavedCustomThemes());
        onUpdateTheme?.(res.theme);
        setPreviewTheme(null);
        showThemeToast(`Theme "${newPreset.name}" imported and applied live!`);
      } else {
        showThemeToast(`Import failed: ${res.error || "Invalid theme file"}`);
      }
    };
    reader.readAsText(file);
    if (themeFileInputRef.current) themeFileInputRef.current.value = "";
  };

  // Import background image file (JPG, PNG, WebP)
  const handleImportBackgroundImageFile = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        saveCustomBackground(dataUrl);
        setCustomBackgrounds(getSavedCustomBackgrounds());
        const bgTheme: Partial<PresentationTheme> = {
          ...state.theme,
          bgType: "image",
          bgImage: dataUrl,
          bgImageFit: "cover",
          bgOverlayOpacity: 0.25,
        };
        const newPreset: ExtendedThemePreset = {
          id: `custom-bg-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || "Custom Background",
          category: "custom",
          description: "Imported background image for live projection",
          palette: ["#090d16", "#38bdf8", "#ffffff"],
          theme: bgTheme,
        };
        saveCustomTheme(newPreset);
        setCustomThemes(getSavedCustomThemes());
        onUpdateTheme?.(bgTheme);
        setPreviewTheme(null);
        showThemeToast(`Custom background "${newPreset.name}" applied live!`);
      }
    };
    reader.readAsDataURL(file);
    if (bgImageInputRef.current) bgImageInputRef.current.value = "";
  };

  // Export current active theme as JSON
  const handleExportCurrentTheme = () => {
    exportThemeToJson(
      state.theme,
      state.title ? `${state.title}-theme` : "easystream-presentation-theme"
    );
    showThemeToast("Theme exported successfully as JSON!");
  };

  // Save custom theme draft
  const handleSaveCustomDraft = () => {
    const name = customThemeDraftName.trim() || "My Custom Theme";
    const newPreset: ExtendedThemePreset = {
      id: `custom-theme-${Date.now()}`,
      name,
      category: "custom",
      description: "User customized worship theme",
      palette: [
        customThemeDraft.bgColor || "#090d16",
        customThemeDraft.accentColor || "#38bdf8",
        customThemeDraft.textColor || "#ffffff",
      ],
      theme: customThemeDraft,
    };
    saveCustomTheme(newPreset);
    setCustomThemes(getSavedCustomThemes());
    onUpdateTheme?.(customThemeDraft);
    setPreviewTheme(null);
    showThemeToast(`Theme "${name}" saved to library & applied live!`);
  };

  // Delete a custom theme
  const handleDeleteCustom = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTheme(id);
    setCustomThemes(getSavedCustomThemes());
    showThemeToast(`Theme "${name}" removed from library`);
  };

  // Combined themes list
  const combinedThemesList = useMemo(() => {
    return [...customThemes, ...EXTENDED_THEME_PRESETS];
  }, [customThemes]);

  // Filtered themes list based on category & search
  const filteredThemesList = useMemo(() => {
    return combinedThemesList.filter((item) => {
      // Category filter
      if (themeFilterCategory === "color" && item.category !== "color") return false;
      if (themeFilterCategory === "pattern" && item.category !== "pattern") return false;
      if (themeFilterCategory === "solid" && item.category !== "solid") return false;
      if (themeFilterCategory === "custom" && item.category !== "custom") return false;

      // Search query filter
      if (themeSearchQuery.trim()) {
        const q = themeSearchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.theme.fontFamily && item.theme.fontFamily.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [combinedThemesList, themeFilterCategory, themeSearchQuery]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        background: "#090d16",
        color: "#f8fafc",
        fontFamily: "'Inter', system-ui, sans-serif",
        userSelect: "none",
      }}
    >
      {/* ============================================================= */}
      {/* UPPER TIER: 3 COLUMNS (SCHEDULE, PREVIEW MONITOR, LIVE MONITOR)*/}
      {/* ============================================================= */}
      <div
        style={{
          display: "flex",
          height: "46%",
          minHeight: "260px",
          maxHeight: "380px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "#0f172a",
        }}
      >
        {/* ----------------------------------------------------------- */}
        {/* COLUMN 1: SCHEDULE PANEL (Real App Schedule)                */}
        {/* ----------------------------------------------------------- */}
        <div
          style={{
            width: "400px",
            minWidth: "400px",
            maxWidth: "400px",
            flexShrink: 0,
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 23, 42, 0.85)",
          }}
        >
          {/* Schedule Header */}
          <div
            style={{
              padding: "8px 12px",
              background: "#0f172a",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Layers size={14} color="#38bdf8" />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                }}
              >
                Service Schedule
              </span>
              {scheduleFeedback && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#34d399",
                    background: "rgba(16, 185, 129, 0.15)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ✓
                </span>
              )}
            </div>

            {/* Quick Add Schedule Item Button & Dropdown */}
            <div ref={addMenuRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                title="Add Item to Schedule"
                style={{
                  background: showAddMenu
                    ? "rgba(56, 189, 248, 0.2)"
                    : "rgba(255, 255, 255, 0.06)",
                  border: showAddMenu
                    ? "1px solid #38bdf8"
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "4px",
                  color: showAddMenu ? "#38bdf8" : "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "3px 6px",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                <Plus size={11} color="#38bdf8" />
                <span>Add</span>
              </button>

              {showAddMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "4px",
                    background: "#0f172a",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "6px",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.7)",
                    zIndex: 60,
                    minWidth: "175px",
                    padding: "4px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {/* Custom Item */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setEditingScheduleItem(null);
                      setScheduleModalDefaultCategory("custom");
                      setIsScheduleEditorOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#34d399",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52, 211, 153, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Layers size={12} />
                    <span>Custom Item...</span>
                  </button>

                  {/* Prayer */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setEditingScheduleItem(null);
                      setScheduleModalDefaultCategory("prayer");
                      setIsScheduleEditorOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#818cf8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(129, 140, 248, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Flame size={12} />
                    <span>Prayer...</span>
                  </button>

                  {/* Ministration */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setEditingScheduleItem(null);
                      setScheduleModalDefaultCategory("ministration");
                      setIsScheduleEditorOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#f472b6",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244, 114, 182, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Mic2 size={12} />
                    <span>Ministration...</span>
                  </button>

                  {/* Announcement */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setEditingScheduleItem(null);
                      setScheduleModalDefaultCategory("announcement");
                      setIsScheduleEditorOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#fbbf24",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251, 191, 36, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Megaphone size={12} />
                    <span>Announcement...</span>
                  </button>

                  {/* Hymn */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      setEditingScheduleItem(null);
                      setScheduleModalDefaultCategory("hymn");
                      setIsScheduleEditorOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#fb923c",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(251, 146, 60, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Bookmark size={12} />
                    <span>Hymn...</span>
                  </button>

                  {/* Blank Screen */}
                  <button
                    onClick={() => {
                      setShowAddMenu(false);
                      handleAddItemToSchedule({
                        title: "BLANK SCREEN",
                        category: "custom",
                        lines: [""],
                      });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148, 163, 184, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Tv size={12} />
                    <span>Blank Screen</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Item List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "4px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {currentScheduleItems.map((item) => {
              const isSelected = selectedScheduleId === item.id;
              const firstPayload = parseSlidePayload(item.lines?.[0] || "");
              const catColor =
                item.category === "scripture"
                  ? "#38bdf8"
                  : item.category === "hymn"
                  ? "#fb923c"
                  : item.category === "song"
                  ? "#c084fc"
                  : item.category === "media"
                  ? "#10b981"
                  : item.category === "presentation"
                  ? "#f97316"
                  : item.category === "prayer"
                  ? "#818cf8"
                  : item.category === "ministration"
                  ? "#f472b6"
                  : item.category === "announcement"
                  ? "#fbbf24"
                  : "#34d399";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedScheduleId(item.id);
                    setPreviewItem({
                      id: item.id,
                      title: item.title,
                      category: item.category,
                      lines: item.lines,
                      cur: 0,
                    });
                  }}
                  onDoubleClick={() => {
                    setSelectedScheduleId(item.id);
                    setPreviewItem({
                      id: item.id,
                      title: item.title,
                      category: item.category,
                      lines: item.lines,
                      cur: 0,
                    });
                    if (
                      item.category === "custom" &&
                      item.title === "BLANK SCREEN"
                    ) {
                      onSetLines("BLANK SCREEN", "", [""], "custom");
                      onJumpTo(0);
                    } else {
                      const subtitle =
                        item.category === "song"
                          ? "Worship"
                          : item.category === "media"
                          ? firstPayload?.mediaType === "video"
                            ? "Video Media"
                            : "Image Media"
                          : item.category === "presentation"
                          ? firstPayload?.docType === "pptx"
                            ? "PowerPoint Presentation"
                            : firstPayload?.docType === "docx"
                            ? "Word Document"
                            : "PDF Document"
                          : item.category === "prayer"
                          ? "Prayer"
                          : item.category === "ministration"
                          ? "Ministration"
                          : item.category === "announcement"
                          ? "Announcement"
                          : item.category === "hymn"
                          ? "Hymn"
                          : "";
                      onSetLines(
                        item.title,
                        subtitle,
                        item.lines,
                        item.category as any,
                      );
                      onJumpTo(0);
                    }
                    if (state.liveState.isClearText) {
                      onUpdateLiveState({ isClearText: false });
                    }
                    setLiveFeedback(true);
                    setTimeout(() => setLiveFeedback(false), 2000);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: isSelected
                      ? "linear-gradient(90deg, rgba(56, 189, 248, 0.18) 0%, rgba(56, 189, 248, 0.08) 100%)"
                      : "rgba(30, 41, 59, 0.45)",
                    border: isSelected
                      ? "1px solid rgba(56, 189, 248, 0.45)"
                      : "1px solid rgba(255, 255, 255, 0.04)",
                    borderLeft: isSelected
                      ? "3px solid #38bdf8"
                      : `3px solid ${catColor}`,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                >
                  {/* Projection Thumbnail Box */}
                  <div
                    style={{
                      width: "36px",
                      height: "24px",
                      background: "#090d16",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "3px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.category === "media" ? (
                      firstPayload?.mediaType === "video" ? (
                        <Film size={11} color={isSelected ? "#34d399" : catColor} />
                      ) : (
                        <Image size={11} color={isSelected ? "#34d399" : catColor} />
                      )
                    ) : item.category === "presentation" ? (
                      <FileText size={11} color={isSelected ? "#fb923c" : catColor} />
                    ) : item.category === "prayer" ? (
                      <Flame size={11} color={isSelected ? "#818cf8" : catColor} />
                    ) : item.category === "ministration" ? (
                      <Mic2 size={11} color={isSelected ? "#f472b6" : catColor} />
                    ) : item.category === "announcement" ? (
                      <Megaphone size={11} color={isSelected ? "#fbbf24" : catColor} />
                    ) : item.category === "hymn" ? (
                      <Bookmark size={11} color={isSelected ? "#fb923c" : catColor} />
                    ) : item.category === "song" ? (
                      <Music size={11} color={isSelected ? "#c084fc" : catColor} />
                    ) : item.category === "scripture" ? (
                      <BookOpen size={11} color={isSelected ? "#38bdf8" : catColor} />
                    ) : (
                      <Tv size={11} color={isSelected ? "#38bdf8" : "#64748b"} />
                    )}
                  </div>

                  {/* Title & Notes */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: isSelected ? "#ffffff" : "#e2e8f0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.25,
                      }}
                    >
                      {item.title}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          color: catColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {item.category === "presentation" && firstPayload?.docType
                          ? firstPayload.docType.toUpperCase()
                          : item.category === "media" && firstPayload?.mediaType
                          ? firstPayload.mediaType.toUpperCase()
                          : item.category || "custom"}
                      </span>
                      <span style={{ fontSize: "9px", color: "#64748b" }}>•</span>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                        {item.lines?.length || 1}{" "}
                        {item.category === "presentation" &&
                        firstPayload?.docType !== "pptx"
                          ? item.lines?.length === 1
                            ? "page"
                            : "pages"
                          : item.lines?.length === 1
                          ? "slide"
                          : "slides"}
                      </span>
                    </div>
                  </div>

                  {/* Edit Item in Schedule */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingScheduleItem(item);
                      setScheduleModalDefaultCategory(item.category || "custom");
                      setIsScheduleEditorOpen(true);
                    }}
                    title="Edit Schedule Item"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7,
                      transition: "all 0.12s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#38bdf8";
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.15)";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#64748b";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.opacity = "0.7";
                    }}
                  >
                    <Edit size={12} />
                  </button>

                  {/* Remove Item from Schedule */}
                  <button
                    onClick={(e) => handleRemoveScheduleItem(item.id, e)}
                    title="Remove from Schedule"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7,
                      transition: "all 0.12s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                      e.currentTarget.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#64748b";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.opacity = "0.7";
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* COLUMN 2: PREVIEW MONITOR                                   */}
        {/* ----------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            background: "#090d16",
          }}
        >
          {/* Preview Header */}
          <div
            style={{
              padding: "7px 12px",
              background: "#0f172a",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Preview - {previewItem.title || "BLANK SCREEN"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {/* Add Preview Item to Schedule */}
              <button
                onClick={handleAddPreviewToSchedule}
                style={{
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  fontSize: "10px",
                  fontWeight: 700,
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.12s ease",
                }}
                title="Add current preview to schedule"
              >
                <ListPlus size={11} />
                <span>+ Schedule</span>
              </button>

              {/* Quick Action: Send Preview to Live */}
              <button
                onClick={handleGoLive}
                style={{
                  padding: "3px 10px",
                  borderRadius: "4px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#ffffff",
                  fontSize: "11px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.35)",
                }}
                title="Send Preview to Live Output (Enter)"
              >
                <span>Go Live</span>
                <Play size={10} fill="#ffffff" />
              </button>
            </div>
          </div>

          {/* Slide Navigation (< Prev Verse  Verse 1 of 5 • John 3:6  Next Verse >) */}
          {(previewItem.lines?.length || 0) > 1 && (() => {
            const previewRawSlide = previewItem.lines[previewItem.cur || 0] || "";
            const previewPayload = parseSlidePayload(previewRawSlide);
            const { citation: previewCitation } =
              previewItem.category === "scripture"
                ? parseSlideReference(previewRawSlide, previewItem.title)
                : previewPayload
                ? { citation: previewPayload.heading || previewItem.title }
                : { citation: previewItem.title };
            const curIdx = previewItem.cur || 0;
            const totalLines = previewItem.lines.length;
            const unitName =
              previewItem.category === "scripture"
                ? "Verse"
                : previewPayload?.kind === "presentation" &&
                  previewPayload?.docType !== "pptx"
                ? "Page"
                : "Slide";

            return (
              <div
                style={{
                  height: "28px",
                  background: "rgba(15, 23, 42, 0.95)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "2px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    const nextIdx = Math.max(0, curIdx - 1);
                    setPreviewItem((prev) => ({
                      ...prev,
                      cur: nextIdx,
                    }));
                    if (activeVerseRange) {
                      setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                    }
                    if (previewItem.category === "presentation") {
                      setSelectedPresSlideIndex(nextIdx);
                    }
                  }}
                  disabled={curIdx <= 0}
                  title={`Previous ${unitName} (Left Arrow)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    height: "22px",
                    borderRadius: "4px",
                    background:
                      curIdx <= 0
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(56, 189, 248, 0.15)",
                    border: "1px solid",
                    borderColor:
                      curIdx <= 0
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(56, 189, 248, 0.4)",
                    color: curIdx <= 0 ? "#475569" : "#38bdf8",
                    cursor: curIdx <= 0 ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#cbd5e1",
                    letterSpacing: "0.02em",
                    userSelect: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {`${unitName} ${curIdx + 1} of ${totalLines}`}
                  {previewCitation ? ` • ${previewCitation}` : ""}
                </span>

                <button
                  onClick={() => {
                    const nextIdx = Math.min(totalLines - 1, curIdx + 1);
                    setPreviewItem((prev) => ({
                      ...prev,
                      cur: nextIdx,
                    }));
                    if (activeVerseRange) {
                      setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                    }
                    if (previewItem.category === "presentation") {
                      setSelectedPresSlideIndex(nextIdx);
                    }
                  }}
                  disabled={curIdx >= totalLines - 1}
                  title={`Next ${unitName} (Right Arrow)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    height: "22px",
                    borderRadius: "4px",
                    background:
                      curIdx >= totalLines - 1
                        ? "rgba(255, 255, 255, 0.03)"
                        : "linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(14, 165, 233, 0.3) 100%)",
                    border: "1px solid",
                    borderColor:
                      curIdx >= totalLines - 1
                        ? "rgba(255, 255, 255, 0.06)"
                        : "#38bdf8",
                    color: curIdx >= totalLines - 1 ? "#475569" : "#ffffff",
                    cursor: curIdx >= totalLines - 1 ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                    boxShadow: curIdx >= totalLines - 1 ? "none" : "0 0 10px rgba(56, 189, 248, 0.25)",
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })()}

          {/* Preview Output 16:9 Screen */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "4px",
                alignSelf: "flex-start",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Preview Output
            </div>

            {/* 16:9 Monitor Screen */}
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                aspectRatio: "16 / 9",
                background: "#000000",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Theme Background Layer in Preview Monitor */}
              <ThemeBackgroundLayer
                theme={previewTheme || state.theme}
                isBlackout={false}
              />
              {/* Floating Left/Right Navigation Arrows directly on Screen */}
              {(previewItem.lines?.length || 0) > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = Math.max(0, (previewItem.cur || 0) - 1);
                      setPreviewItem((prev) => ({ ...prev, cur: nextIdx }));
                      if (activeVerseRange) {
                        setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                      }
                      if (previewItem.category === "presentation") {
                        setSelectedPresSlideIndex(nextIdx);
                      }
                    }}
                    disabled={(previewItem.cur || 0) <= 0}
                    title="Previous Slide / Page"
                    style={{
                      position: "absolute",
                      left: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background:
                        (previewItem.cur || 0) <= 0
                          ? "rgba(15, 23, 42, 0.4)"
                          : "rgba(15, 23, 42, 0.85)",
                      border: "1px solid",
                      borderColor:
                        (previewItem.cur || 0) <= 0
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(56, 189, 248, 0.8)",
                      color: (previewItem.cur || 0) <= 0 ? "#475569" : "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: (previewItem.cur || 0) <= 0 ? "not-allowed" : "pointer",
                      boxShadow: (previewItem.cur || 0) <= 0 ? "none" : "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(56, 189, 248, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = Math.min(
                        previewItem.lines.length - 1,
                        (previewItem.cur || 0) + 1,
                      );
                      setPreviewItem((prev) => ({ ...prev, cur: nextIdx }));
                      if (activeVerseRange) {
                        setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                      }
                      if (previewItem.category === "presentation") {
                        setSelectedPresSlideIndex(nextIdx);
                      }
                    }}
                    disabled={
                      (previewItem.cur || 0) >= previewItem.lines.length - 1
                    }
                    title="Next Slide / Page"
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background:
                        (previewItem.cur || 0) >= previewItem.lines.length - 1
                          ? "rgba(15, 23, 42, 0.4)"
                          : "rgba(15, 23, 42, 0.85)",
                      border: "1px solid",
                      borderColor:
                        (previewItem.cur || 0) >= previewItem.lines.length - 1
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(56, 189, 248, 0.8)",
                      color:
                        (previewItem.cur || 0) >= previewItem.lines.length - 1
                          ? "#475569"
                          : "#38bdf8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        (previewItem.cur || 0) >= previewItem.lines.length - 1
                          ? "not-allowed"
                          : "pointer",
                      boxShadow:
                        (previewItem.cur || 0) >= previewItem.lines.length - 1
                          ? "none"
                          : "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(56, 189, 248, 0.3)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {previewItem.category !== "blank" &&
                previewItem.lines[previewItem.cur || 0] && (() => {
                  const rawLine = previewItem.lines[previewItem.cur || 0];
                  const payload = parseSlidePayload(rawLine);
                  if (payload) {
                    return renderMonitorSlidePayload(payload, false);
                  }

                  const { citation, body } =
                    previewItem.category === "scripture"
                      ? parseSlideReference(rawLine, previewItem.title)
                      : { citation: previewItem.title, body: rawLine };

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {/* Flanked Scripture Title at Top */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "1px",
                            background: "rgba(56, 189, 248, 0.4)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color:
                              previewItem.category === "song" ||
                              previewItem.category === "hymn"
                                ? "#c084fc"
                                : "#38bdf8",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          {citation}
                        </span>
                        <div
                          style={{
                            width: "16px",
                            height: "1px",
                            background:
                              previewItem.category === "song" ||
                              previewItem.category === "hymn"
                                ? "rgba(168, 85, 247, 0.4)"
                                : "rgba(56, 189, 248, 0.4)",
                          }}
                        />
                      </div>

                      {/* Preview Content: Songs vs Scriptures */}
                      {previewItem.category === "song" ||
                      previewItem.category === "hymn" ? (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#ffffff",
                            fontWeight: 600,
                            lineHeight: 1.45,
                            fontFamily:
                              state.theme.fontFamily || "Montserrat, sans-serif",
                            whiteSpace: "pre-line",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: "vertical",
                            textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
                          }}
                        >
                          {body}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#ffffff",
                            fontWeight: 500,
                            fontStyle: "italic",
                            lineHeight: 1.45,
                            fontFamily: 'Georgia, "Playfair Display", serif',
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          “{body}”
                        </div>
                      )}
                    </div>
                  );
                })()}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginTop: "4px",
                fontWeight: 600,
              }}
            >
              {(() => {
                const p = parseSlidePayload(
                  previewItem.lines?.[previewItem.cur || 0] || "",
                );
                const label =
                  p?.kind === "presentation" && p?.docType !== "pptx"
                    ? "Page"
                    : "Slide";
                return `${label} ${(previewItem.cur || 0) + 1} of ${
                  previewItem.lines?.length || 1
                }`;
              })()}
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* COLUMN 3: LIVE MONITOR                                      */}
        {/* ----------------------------------------------------------- */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#090d16",
          }}
        >
          {/* Live Header */}
          <div
            style={{
              padding: "7px 12px",
              background: "#0f172a",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.01em",
              }}
            >
              Live - {state.title || "BLANK SCREEN"}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: liveFeedback ? "#34d399" : "#38bdf8",
                  boxShadow: "0 0 8px rgba(56, 189, 248, 0.9)",
                }}
              />
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                }}
              >
                LIVE BROADCAST
              </span>
            </div>
          </div>

          {/* Slide Navigation (< Prev Verse  Verse 1 of 5 • John 3:6  Next Verse >) */}
          {(state.lines?.length || 0) > 1 && (() => {
            const liveRawSlide = state.lines[state.cur] || "";
            const livePayload = parseSlidePayload(liveRawSlide);
            const { citation: liveCitation } =
              state.category === "scripture"
                ? parseSlideReference(liveRawSlide, state.title)
                : livePayload
                ? { citation: livePayload.heading || state.title }
                : { citation: state.title };
            const curIdx = state.cur;
            const totalLines = state.lines.length;
            const unitName =
              state.category === "scripture"
                ? "Verse"
                : livePayload?.kind === "presentation" &&
                  livePayload?.docType !== "pptx"
                ? "Page"
                : "Slide";

            return (
              <div
                style={{
                  height: "28px",
                  background: "rgba(15, 23, 42, 0.95)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "2px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => {
                    const nextIdx = Math.max(0, curIdx - 1);
                    onJumpTo(nextIdx);
                    if (activeVerseRange) {
                      setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                    }
                    if (state.category === "presentation") {
                      setSelectedPresSlideIndex(nextIdx);
                    }
                  }}
                  disabled={curIdx <= 0}
                  title={`Previous Live ${unitName} (Left Arrow)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    height: "22px",
                    borderRadius: "4px",
                    background:
                      curIdx <= 0
                        ? "rgba(255, 255, 255, 0.03)"
                        : "rgba(37, 99, 235, 0.3)",
                    border: "1px solid",
                    borderColor:
                      curIdx <= 0 ? "rgba(255, 255, 255, 0.06)" : "#60a5fa",
                    color: curIdx <= 0 ? "#475569" : "#ffffff",
                    cursor: curIdx <= 0 ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#cbd5e1",
                    letterSpacing: "0.02em",
                    userSelect: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {`${unitName} ${curIdx + 1} of ${totalLines}`}
                  {liveCitation ? ` • ${liveCitation}` : ""}
                </span>

                <button
                  onClick={() => {
                    const nextIdx = Math.min(totalLines - 1, curIdx + 1);
                    onJumpTo(nextIdx);
                    if (activeVerseRange) {
                      setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                    }
                    if (state.category === "presentation") {
                      setSelectedPresSlideIndex(nextIdx);
                    }
                  }}
                  disabled={curIdx >= totalLines - 1}
                  title={`Next Live ${unitName} (Right Arrow / Space)`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "2px 8px",
                    height: "22px",
                    borderRadius: "4px",
                    background:
                      curIdx >= totalLines - 1
                        ? "rgba(255, 255, 255, 0.03)"
                        : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    border: "1px solid",
                    borderColor:
                      curIdx >= totalLines - 1
                        ? "rgba(255, 255, 255, 0.06)"
                        : "#60a5fa",
                    color: curIdx >= totalLines - 1 ? "#475569" : "#ffffff",
                    cursor:
                      curIdx >= totalLines - 1 ? "not-allowed" : "pointer",
                    fontSize: "11px",
                    fontWeight: 700,
                    boxShadow:
                      curIdx >= totalLines - 1
                        ? "none"
                        : "0 0 10px rgba(37, 99, 235, 0.4)",
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })()}

          {/* Live Output 16:9 Screen */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 12px",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#64748b",
                marginBottom: "4px",
                alignSelf: "flex-start",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Live Output
            </div>

            {/* 16:9 Monitor Screen */}
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                aspectRatio: "16 / 9",
                background: "#000000",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Theme Background Layer in Live Monitor */}
              <ThemeBackgroundLayer
                theme={state.theme}
                isBlackout={state.liveState.isBlackout}
              />
              {/* Floating Left/Right Navigation Arrows directly on Live Monitor */}
              {(state.lines?.length || 0) > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = Math.max(0, state.cur - 1);
                      onJumpTo(nextIdx);
                      if (activeVerseRange) {
                        setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                      }
                      if (state.category === "presentation") {
                        setSelectedPresSlideIndex(nextIdx);
                      }
                    }}
                    disabled={state.cur <= 0}
                    title="Previous Live Slide / Page"
                    style={{
                      position: "absolute",
                      left: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background:
                        state.cur <= 0
                          ? "rgba(15, 23, 42, 0.4)"
                          : "rgba(37, 99, 235, 0.85)",
                      border: "1px solid",
                      borderColor:
                        state.cur <= 0
                          ? "rgba(255, 255, 255, 0.1)"
                          : "#60a5fa",
                      color: state.cur <= 0 ? "#475569" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: state.cur <= 0 ? "not-allowed" : "pointer",
                      boxShadow:
                        state.cur <= 0
                          ? "none"
                          : "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(37, 99, 235, 0.5)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextIdx = Math.min(
                        state.lines.length - 1,
                        state.cur + 1,
                      );
                      onJumpTo(nextIdx);
                      if (activeVerseRange) {
                        setSelectedVerseNumber(activeVerseRange.start + nextIdx);
                      }
                      if (state.category === "presentation") {
                        setSelectedPresSlideIndex(nextIdx);
                      }
                    }}
                    disabled={state.cur >= state.lines.length - 1}
                    title="Next Live Slide / Page (Right Arrow / Space)"
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background:
                        state.cur >= state.lines.length - 1
                          ? "rgba(15, 23, 42, 0.4)"
                          : "rgba(37, 99, 235, 0.85)",
                      border: "1px solid",
                      borderColor:
                        state.cur >= state.lines.length - 1
                          ? "rgba(255, 255, 255, 0.1)"
                          : "#60a5fa",
                      color:
                        state.cur >= state.lines.length - 1
                          ? "#475569"
                          : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        state.cur >= state.lines.length - 1
                          ? "not-allowed"
                          : "pointer",
                      boxShadow:
                        state.cur >= state.lines.length - 1
                          ? "none"
                          : "0 4px 12px rgba(0, 0, 0, 0.6), 0 0 10px rgba(37, 99, 235, 0.5)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}

              {!state.liveState.isBlackout &&
                !state.liveState.isClearText &&
                state.lines[state.cur] && (() => {
                  const rawLine = state.lines[state.cur];
                  const payload = parseSlidePayload(rawLine);
                  if (payload) {
                    return renderMonitorSlidePayload(payload, true);
                  }

                  const { citation, body } =
                    state.category === "scripture"
                      ? parseSlideReference(rawLine, state.title)
                      : { citation: state.title, body: rawLine };

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        position: "relative",
                        zIndex: 2,
                      }}
                    >
                      {/* Flanked Scripture Title at Top */}
                      {citation && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: "16px",
                              height: "1px",
                              background: "rgba(56, 189, 248, 0.4)",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              color: "#38bdf8",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            {citation}
                          </span>
                          <div
                            style={{
                              width: "16px",
                              height: "1px",
                              background: "rgba(56, 189, 248, 0.4)",
                            }}
                          />
                        </div>
                      )}

                      {/* Verse Text */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#ffffff",
                          fontWeight: 500,
                          fontStyle: "italic",
                          lineHeight: 1.45,
                          fontFamily: 'Georgia, "Playfair Display", serif',
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        “{body}”
                      </div>
                    </div>
                  );
                })()}

              {state.liveState.isBlackout && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#ef4444",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  BLACKOUT ACTIVE
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginTop: "4px",
                fontWeight: 600,
              }}
            >
              {(() => {
                const p = parseSlidePayload(state.lines?.[state.cur] || "");
                const label =
                  p?.kind === "presentation" && p?.docType !== "pptx"
                    ? "Page"
                    : "Slide";
                return `${label} ${state.cur + 1} of ${
                  state.lines?.length || 1
                }`;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* LOWER TIER: RESOURCE TABS + MULTI-COLUMN DATA GRID VIEW        */}
      {/* ============================================================= */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          background: "#080c14",
        }}
      >
        {/* RESOURCE CATEGORY TABS BAR */}
        <div
          style={{
            padding: "8px 16px",
            background: "#0f172a",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Tab Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {(
              [
                { id: "songs", label: "Songs", icon: Music },
                { id: "scriptures", label: "Scriptures", icon: BookOpen },
                { id: "media", label: "Media", icon: Image },
                { id: "presentations", label: "Presentations", icon: FileText },
                { id: "themes", label: "Themes", icon: Palette },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: isActive
                      ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                      : "rgba(30, 41, 59, 0.6)",
                    color: isActive ? "#ffffff" : "#94a3b8",
                    border: isActive
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.06)",
                    fontSize: "12px",
                    fontWeight: isActive ? 800 : 600,
                    cursor: "pointer",
                    boxShadow: isActive
                      ? "0 0 14px rgba(14, 165, 233, 0.35)"
                      : "none",
                    transition: "all 0.12s ease",
                  }}
                >
                  <Icon size={13} color={isActive ? "#ffffff" : "#64748b"} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
            {activeTab === "scriptures"
              ? "Bible Library • 66 Books • Multi-Version Quick Navigation"
              : activeTab === "songs"
              ? "Worship Catalog • Church Song Bank • Fast Stanza Splitting"
              : "EasyPresenter Studio Library"}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: SCRIPTURES (WITH SPACE CONTROL, AUTOCOMPLETE & GRID) */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "scriptures" && (
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* Left Sub-Column: Search & Version Selector */}
            <div
              style={{
                width: "400px",
                minWidth: "400px",
                maxWidth: "400px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 23, 42, 0.75)",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {/* Scripture Search Box (With Intelligent Space Controls & Autocomplete) */}
              <div style={{ padding: "8px", position: "relative" }}>
                <div style={{ position: "relative" }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    placeholder="Search e.g. John 3:16"
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
                        updateQueryAndFocusEnd(
                          `${canonicalBook} ${chapterNum}:`,
                        );
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
                          matchedBook.name.toLowerCase() !==
                            val.trim().toLowerCase()
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
                      if (searchQuery.trim().length > 0)
                        setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      // Tab or Space completion
                      if (e.key === "Tab" || e.key === " ") {
                        const trimmed = searchQuery.trim();

                        // A. Suggestions list active item completion
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
                          } else {
                            updateQueryAndFocusEnd(activeSug.text);
                          }
                          return;
                        }

                        // B. Verse entered with colon (e.g. "John 3:16") -> Auto-insert "-" on Space
                        const bookVerseMatch = trimmed.match(
                          /^([1-3]?\s*[a-zA-Z\s]+?\s+\d+:\d+)$/,
                        );
                        if (bookVerseMatch && e.key === " ") {
                          e.preventDefault();
                          updateQueryAndFocusEnd(`${trimmed}-`);
                          return;
                        }

                        // C. Spaced verse without colon (e.g. "John 3 16") -> Format to colon and insert "-"
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

                        // D. Chapter entered without colon (e.g. "John 3") -> Autocomplete book & insert ":"
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

                        // E. Book name typing
                        if (e.key === " " && /^[1-3]$/.test(trimmed)) {
                          return;
                        }
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
                        if (
                          e.key === "Tab" &&
                          trimmed.endsWith(":") &&
                          showSuggestions &&
                          suggestions.length > 0
                        ) {
                          e.preventDefault();
                          const topSug = suggestions[0];
                          updateQueryAndFocusEnd(topSug.text);
                          return;
                        }
                      }

                      // Keyboard navigation in suggestions list
                      if (e.key === "ArrowDown") {
                        if (showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) =>
                            prev < suggestions.length - 1 ? prev + 1 : 0,
                          );
                        }
                      } else if (e.key === "ArrowUp") {
                        if (showSuggestions && suggestions.length > 0) {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) =>
                            prev > 0 ? prev - 1 : suggestions.length - 1,
                          );
                        }
                      } else if (e.key === "Escape") {
                        setShowSuggestions(false);
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          showSuggestions &&
                          activeSuggestionIndex >= 0 &&
                          suggestions[activeSuggestionIndex]
                        ) {
                          const chosen = suggestions[activeSuggestionIndex].text;
                          setSearchQuery(chosen);
                          setShowSuggestions(false);
                          fetchScriptureData(chosen, selectedVersion, null, true, true);
                          return;
                        }
                        setShowSuggestions(false);
                        fetchScriptureData(
                          searchQuery,
                          selectedVersion,
                          null,
                          true,
                          true,
                        );
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: "rgba(0, 0, 0, 0.6)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />

                  {/* Suggestions Floating Overlay */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsContainerRef}
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "4px",
                        background: "#0f172a",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "8px",
                        boxShadow: "0 14px 35px rgba(0, 0, 0, 0.8)",
                        zIndex: 50,
                        maxHeight: "220px",
                        overflowY: "auto",
                        padding: "4px",
                      }}
                    >
                      {suggestions.map((sug, idx) => {
                        const isSelected = idx === activeSuggestionIndex;
                        return (
                          <div
                            key={`${sug.text}-${idx}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSearchQuery(sug.text);
                              setShowSuggestions(false);
                              const isScriptureLive = state.category === "scripture";
                              fetchScriptureData(
                                sug.text,
                                selectedVersion,
                                null,
                                true,
                                isScriptureLive,
                              );
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: isSelected
                                ? "rgba(56, 189, 248, 0.15)"
                                : "transparent",
                              color: isSelected ? "#38bdf8" : "#e2e8f0",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>
                                {sug.label}
                              </span>
                              {sug.subLabel && (
                                <span
                                  style={{ fontSize: "9px", color: "#64748b" }}
                                >
                                  {sug.subLabel}
                                </span>
                              )}
                            </div>
                            {sug.badge && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: "rgba(255, 255, 255, 0.08)",
                                  color: "#94a3b8",
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
              </div>

              {/* SCRIPTURES Section Heading */}
              <div
                style={{
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Scriptures
              </div>

              {/* Translation Checklist with Blue Square Icons */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "2px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {AVAILABLE_BIBLE_VERSIONS.map((v) => {
                  const isSelected = selectedVersion === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVersion(v.id);
                        const isScriptureLive = state.category === "scripture";
                        let targetQuery = searchQuery.trim();
                        if (!targetQuery && scriptureResult?.reference) {
                          const baseBookChapter =
                            scriptureResult.reference.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]?.trim() ||
                            scriptureResult.reference;
                          targetQuery = selectedVerseNumber
                            ? `${baseBookChapter}:${selectedVerseNumber}`
                            : baseBookChapter;
                        } else if (
                          scriptureResult?.reference &&
                          selectedVerseNumber &&
                          !targetQuery.includes("-")
                        ) {
                          const baseBookChapter =
                            scriptureResult.reference.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]?.trim() ||
                            scriptureResult.reference;
                          targetQuery = `${baseBookChapter}:${selectedVerseNumber}`;
                        }

                        fetchScriptureData(
                          targetQuery || searchQuery,
                          v.id,
                          selectedVerseNumber,
                          true,
                          isScriptureLive,
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: isSelected
                          ? "rgba(56, 189, 248, 0.15)"
                          : "transparent",
                        color: isSelected ? "#38bdf8" : "#cbd5e1",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      {/* Vibrant Blue Square Icon */}
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          background: "#2563eb",
                          borderRadius: "2px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected && (
                          <Check size={9} color="#ffffff" strokeWidth={3} />
                        )}
                      </div>
                      <span style={{ flex: 1, fontWeight: isSelected ? 800 : 600 }}>{v.id}</span>
                      <span
                        style={{
                          fontSize: "10.5px",
                          color: isSelected ? "#93c5fd" : "#64748b",
                          maxWidth: "240px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Sub-Column: Multi-Column Table / Data Grid View */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#080c14",
                overflow: "hidden",
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#0f172a",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  userSelect: "none",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                <div
                  style={{ width: "95px", padding: "6px 12px", flexShrink: 0 }}
                >
                  Translation
                </div>
                <div
                  style={{
                    width: "140px",
                    padding: "6px 12px",
                    flexShrink: 0,
                  }}
                >
                  Reference
                </div>
                <div style={{ flex: 1, padding: "6px 12px" }}>Scripture</div>
                <div
                  style={{
                    width: "85px",
                    padding: "6px 12px",
                    textAlign: "right",
                    flexShrink: 0,
                  }}
                >
                  Action
                </div>
              </div>

              {/* Table Body (Verses List) */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                {scriptureResult?.verses &&
                scriptureResult.verses.length > 0 ? (
                  scriptureResult.verses.map((v) => {
                    const baseBookChapter =
                      scriptureResult.reference
                        .match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]
                        ?.trim() || scriptureResult.reference;
                    const verseRef = `${baseBookChapter}:${v.verse}`;

                    // Check if verse is within the currently active range (e.g. John 3:6-10)
                    const isPassageRange =
                      Boolean(activeVerseRange) &&
                      activeVerseRange!.bookChapter.toLowerCase().replace(/\s+/g, "") ===
                        baseBookChapter.toLowerCase().replace(/\s+/g, "");
                    const isInRange =
                      isPassageRange &&
                      v.verse >= activeVerseRange!.start &&
                      v.verse <= activeVerseRange!.end;

                    let isRowLive = false;
                    let isRowLiveInRange = false;

                    if (state.category === "scripture") {
                      if (isInRange && state.lines && state.lines.length > 0) {
                        const liveVerseNum = activeVerseRange!.start + state.cur;
                        if (v.verse === liveVerseNum) {
                          isRowLive = true;
                        }
                        isRowLiveInRange = true;
                      } else {
                        const liveTitle = (state.title || "").toLowerCase();
                        const liveMatch = liveTitle.match(
                          /^([1-3]?\s*[a-z\s]+?\s*\d+):(\d+)(?:[-–—](\d+))?/i
                        );
                        if (liveMatch) {
                          const liveChapterBook = liveMatch[1]
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "");
                          const currentChapterBook = baseBookChapter
                            .trim()
                            .toLowerCase()
                            .replace(/\s+/g, "");
                          if (liveChapterBook === currentChapterBook) {
                            const startV = parseInt(liveMatch[2], 10);
                            const endV = liveMatch[3]
                              ? parseInt(liveMatch[3], 10)
                              : startV;
                            if (startV === endV) {
                              isRowLive = v.verse === startV;
                            } else {
                              isRowLive = v.verse === startV + state.cur;
                              if (v.verse >= startV && v.verse <= endV) {
                                isRowLiveInRange = true;
                              }
                            }
                          }
                        } else if (selectedVerseNumber === v.verse) {
                          isRowLive = true;
                        }
                      }
                    }

                    let isRowPreview = false;
                    if (previewItem.category === "scripture") {
                      if (isInRange && previewItem.lines && previewItem.lines.length > 0) {
                        const previewVerseNum =
                          activeVerseRange!.start + (previewItem.cur || 0);
                        isRowPreview = v.verse === previewVerseNum;
                      }
                    }

                    const isRowSelected =
                      selectedVerseNumber === v.verse || isRowPreview;

                    const cleanVerse = v.text
                      .replace(/^\d+[\s:.]\s*/, "")
                      .trim();

                    return (
                      <div
                        key={v.verse}
                        onClick={() => {
                          setSelectedVerseNumber(v.verse);
                          if (isInRange && activeVerseRange) {
                            const targetIdx = v.verse - activeVerseRange.start;
                            if (
                              previewItem.category === "scripture" &&
                              previewItem.lines &&
                              previewItem.lines.length > targetIdx &&
                              targetIdx >= 0
                            ) {
                              setPreviewItem((prev) => ({
                                ...prev,
                                cur: targetIdx,
                              }));
                            }
                            if (
                              state.category === "scripture" &&
                              isRowLiveInRange &&
                              state.lines &&
                              state.lines.length > targetIdx &&
                              targetIdx >= 0
                            ) {
                              onJumpTo(targetIdx);
                              if (state.liveState.isClearText) {
                                onUpdateLiveState({ isClearText: false });
                              }
                              setLiveFeedback(true);
                              setTimeout(() => setLiveFeedback(false), 2000);
                            }
                          } else {
                            setActiveVerseRange(null);
                            const refStr = `${verseRef} (${selectedVersion})`;
                            const slides = [`${refStr}\n\n${cleanVerse}`];
                            setPreviewItem({
                              id: `verse-${v.verse}-${Date.now()}`,
                              title: refStr,
                              category: "scripture",
                              lines: slides,
                              cur: 0,
                            });
                            if (state.category === "scripture") {
                              onSetLines(
                                refStr,
                                selectedVersion,
                                slides,
                                "scripture"
                              );
                              onJumpTo(0);
                              if (state.liveState.isClearText) {
                                onUpdateLiveState({ isClearText: false });
                              }
                              setLiveFeedback(true);
                              setTimeout(() => setLiveFeedback(false), 2000);
                            }
                          }
                        }}
                        onDoubleClick={() => {
                          setSelectedVerseNumber(v.verse);
                          if (isInRange && activeVerseRange) {
                            const targetIdx = v.verse - activeVerseRange.start;
                            if (
                              previewItem.category === "scripture" &&
                              previewItem.lines &&
                              previewItem.lines.length > targetIdx &&
                              targetIdx >= 0
                            ) {
                              setPreviewItem((prev) => ({
                                ...prev,
                                cur: targetIdx,
                              }));
                            }
                            if (
                              state.category === "scripture" &&
                              state.lines &&
                              state.lines.length > targetIdx &&
                              targetIdx >= 0
                            ) {
                              onJumpTo(targetIdx);
                              if (state.liveState.isClearText) {
                                onUpdateLiveState({ isClearText: false });
                              }
                            } else {
                              const rangeVerses = scriptureResult.verses.filter(
                                (rv: OnlineScriptureVerse) =>
                                  rv.verse >= activeVerseRange.start &&
                                  rv.verse <= activeVerseRange.end
                              );
                              const refHeader = `${activeVerseRange.bookChapter}:${activeVerseRange.start}-${activeVerseRange.end} (${selectedVersion})`;
                              const rangeSlides = formatSlides({
                                ...scriptureResult,
                                reference: `${activeVerseRange.bookChapter}:${activeVerseRange.start}-${activeVerseRange.end}`,
                                version: selectedVersion,
                                verses:
                                  rangeVerses.length > 0
                                    ? rangeVerses
                                    : scriptureResult.verses,
                              });
                              onSetLines(
                                refHeader,
                                selectedVersion,
                                rangeSlides,
                                "scripture"
                              );
                              onJumpTo(targetIdx);
                              if (state.liveState.isClearText) {
                                onUpdateLiveState({ isClearText: false });
                              }
                            }
                            setLiveFeedback(true);
                            setTimeout(() => setLiveFeedback(false), 2000);
                          } else {
                            setActiveVerseRange(null);
                            const refStr = `${verseRef} (${selectedVersion})`;
                            const slides = [`${refStr}\n\n${cleanVerse}`];
                            setPreviewItem({
                              id: `verse-${v.verse}-${Date.now()}`,
                              title: refStr,
                              category: "scripture",
                              lines: slides,
                              cur: 0,
                            });
                            onSetLines(
                              refStr,
                              selectedVersion,
                              slides,
                              "scripture"
                            );
                            onJumpTo(0);
                            if (state.liveState.isClearText) {
                              onUpdateLiveState({ isClearText: false });
                            }
                            setLiveFeedback(true);
                            setTimeout(() => setLiveFeedback(false), 2000);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: isRowLive
                            ? "linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.08) 100%)"
                            : isRowSelected
                              ? "linear-gradient(90deg, rgba(56, 189, 248, 0.24) 0%, rgba(56, 189, 248, 0.08) 100%)"
                              : isInRange
                                ? "linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.03) 100%)"
                                : "transparent",
                          color:
                            isRowLive || isRowSelected || isInRange
                              ? "#ffffff"
                              : "#cbd5e1",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          borderLeft: isRowLive
                            ? "3px solid #ef4444"
                            : isRowSelected
                              ? "3px solid #38bdf8"
                              : isInRange
                                ? "3px solid rgba(56, 189, 248, 0.45)"
                                : "3px solid transparent",
                          fontSize: "12px",
                          cursor: "pointer",
                          lineHeight: "26px",
                          fontWeight:
                            isRowLive || isRowSelected ? 600 : isInRange ? 500 : 400,
                          transition: "all 0.1s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "95px",
                            padding: "2px 12px",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            color: isRowLive
                              ? "#f87171"
                              : isRowSelected
                                ? "#38bdf8"
                                : isInRange
                                  ? "#93c5fd"
                                  : "#94a3b8",
                            fontWeight: 700,
                          }}
                        >
                          {selectedVersion}
                        </div>
                        <div
                          style={{
                            width: "140px",
                            padding: "2px 12px",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            fontWeight: isRowLive || isRowSelected ? 700 : 500,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span>{verseRef}</span>
                          {isRowLive ? (
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 800,
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "0 4px",
                                borderRadius: "3px",
                                lineHeight: "15px",
                                letterSpacing: "0.04em",
                              }}
                            >
                              LIVE
                            </span>
                          ) : isRowSelected ? (
                            <span
                              style={{
                                fontSize: "8.5px",
                                fontWeight: 700,
                                background: "rgba(56, 189, 248, 0.2)",
                                color: "#38bdf8",
                                border: "1px solid rgba(56, 189, 248, 0.4)",
                                padding: "0 4px",
                                borderRadius: "3px",
                                lineHeight: "13px",
                              }}
                            >
                              PREV
                            </span>
                          ) : isInRange ? (
                            <span
                              style={{
                                fontSize: "8px",
                                fontWeight: 600,
                                background: "rgba(148, 163, 184, 0.15)",
                                color: "#94a3b8",
                                padding: "0 3px",
                                borderRadius: "2px",
                                lineHeight: "13px",
                              }}
                            >
                              RANGE
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            padding: "2px 12px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {cleanVerse}
                        </div>
                        <div
                          style={{
                            width: "85px",
                            padding: "2px 8px",
                            flexShrink: 0,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={(e) =>
                              handleAddScriptureToSchedule(
                                verseRef,
                                cleanVerse,
                                selectedVersion,
                                e,
                              )
                            }
                            title={`Add ${verseRef} to schedule`}
                            style={{
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              transition: "all 0.12s ease",
                            }}
                          >
                            <Plus size={10} />
                            <span>Schedule</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {loading ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Loader2
                          size={16}
                          className="animate-spin"
                          color="#38bdf8"
                        />
                        <span>Searching scriptures...</span>
                      </div>
                    ) : (
                      searchError || "No scriptures found."
                    )}
                  </div>
                )}
              </div>

              {/* Table Footer: References Count Status */}
              <div
                style={{
                  height: "26px",
                  background: "#0f172a",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#64748b",
                  fontWeight: 600,
                }}
              >
                {scriptureResult?.verses?.length || 0} verses in chapter • 31,102 total Bible references
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: SONGS / LYRICS                                       */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "songs" && (
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* Left Sub-Column: Song Search & Catalog */}
            <div
              style={{
                width: "400px",
                minWidth: "400px",
                maxWidth: "400px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 23, 42, 0.75)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Search Input Bar */}
              <div style={{ padding: "8px 10px 4px 10px" }}>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Search
                    size={14}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: "10px",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    value={lyricsQuery}
                    onChange={(e) => setLyricsQuery(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const q = lyricsQuery.trim();
                        if (!q) return;

                        if (combinedSongs.length > 0) {
                          const target =
                            combinedSongs.find(
                              (s) =>
                                s.trackName.toLowerCase().trim() ===
                                q.toLowerCase(),
                            ) || combinedSongs[0];
                          handleSelectSong(target, true);
                          return;
                        }

                        // Immediate online search if not yet loaded
                        try {
                          setLyricsLoading(true);
                          const apiBase = import.meta.env.VITE_API_URL || "";
                          const res = await fetch(
                            `${apiBase}/api/lyrics/search?q=${encodeURIComponent(q)}`,
                          );
                          const data = await res.json();
                          const songs: OnlineSongResult[] = (
                            data.results || []
                          ).map((s: any) => ({
                            ...s,
                            isLocal: false,
                          }));
                          if (songs.length > 0) {
                            setOnlineSongResults(songs);
                            handleSelectSong(songs[0], true);
                          }
                        } catch (err) {
                          console.error("Failed to search lyrics on enter:", err);
                        } finally {
                          setLyricsLoading(false);
                        }
                      }
                    }}
                    placeholder="Search worship songs (local & online)..."
                    style={{
                      width: "100%",
                      padding: "7px 32px 7px 30px",
                      background: "rgba(0, 0, 0, 0.6)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {lyricsLoading && (
                      <Loader2
                        size={14}
                        color="#a78bfa"
                        className="animate-spin"
                      />
                    )}
                    {lyricsQuery && (
                      <button
                        onClick={() => setLyricsQuery("")}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "2px",
                        }}
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scope Filter Pills: All | Local Bank | Online */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "4px 10px 6px 10px",
                  gap: "4px",
                }}
              >
                <button
                  onClick={() => setLyricsScope("all")}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    borderRadius: "5px",
                    background:
                      lyricsScope === "all"
                        ? "rgba(168, 85, 247, 0.25)"
                        : "rgba(255, 255, 255, 0.04)",
                    border:
                      lyricsScope === "all"
                        ? "1px solid #a855f7"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    color: lyricsScope === "all" ? "#c084fc" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  All ({combinedSongs.length})
                </button>
                <button
                  onClick={() => setLyricsScope("local")}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    borderRadius: "5px",
                    background:
                      lyricsScope === "local"
                        ? "rgba(16, 185, 129, 0.25)"
                        : "rgba(255, 255, 255, 0.04)",
                    border:
                      lyricsScope === "local"
                        ? "1px solid #10b981"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    color: lyricsScope === "local" ? "#34d399" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                  }}
                  title="Search church local song bank only"
                >
                  <HardDrive size={10} />
                  <span>Bank ({localSongMatches.length})</span>
                </button>
                <button
                  onClick={() => setLyricsScope("online")}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    borderRadius: "5px",
                    background:
                      lyricsScope === "online"
                        ? "rgba(56, 189, 248, 0.25)"
                        : "rgba(255, 255, 255, 0.04)",
                    border:
                      lyricsScope === "online"
                        ? "1px solid #38bdf8"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                    color: lyricsScope === "online" ? "#38bdf8" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                  }}
                  title="Search online worship lyrics catalog"
                >
                  <Globe size={10} />
                  <span>Online ({onlineSongResults.length})</span>
                </button>
              </div>

              {/* Popular Worship Quick Jump Chips */}
              {!lyricsQuery.trim() && (
                <div
                  style={{
                    padding: "2px 10px 6px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    overflowX: "auto",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      color: "#64748b",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    POPULAR:
                  </span>
                  {POPULAR_WORSHIP_SONGS.slice(0, 6).map((item) => (
                    <button
                      key={item.title}
                      onClick={() => setLyricsQuery(item.title)}
                      style={{
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#cbd5e1",
                        fontSize: "10px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Results List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "4px 8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {combinedSongs.length === 0 ? (
                  <div
                    style={{
                      padding: "30px 14px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {lyricsLoading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                          color="#a78bfa"
                        />
                        <span>Searching online worship catalog...</span>
                      </>
                    ) : (
                      <>
                        <Music size={24} color="#475569" />
                        <span>No songs found for "{lyricsQuery}"</span>
                        {onOpenSongEditor && (
                          <button
                            onClick={onOpenSongEditor}
                            style={{
                              marginTop: "6px",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              background: "rgba(168, 85, 247, 0.2)",
                              border: "1px solid rgba(168, 85, 247, 0.4)",
                              color: "#c084fc",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            + Create Custom Song
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  combinedSongs.map((song) => {
                    const isSelected = selectedSong?.id === song.id;
                    const isSongLive =
                      state.category === "song" &&
                      state.title?.toLowerCase().trim() ===
                        song.trackName.toLowerCase().trim() &&
                      !state.liveState.isBlackout;

                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSelectSong(song, false)}
                        onDoubleClick={() => handleSelectSong(song, true)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          background: isSongLive
                            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)"
                            : isSelected
                              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(15, 23, 42, 0.9) 100%)"
                              : "rgba(255, 255, 255, 0.03)",
                          border: isSongLive
                            ? "1.5px solid #ef4444"
                            : isSelected
                              ? "1.5px solid #a855f7"
                              : "1px solid rgba(255, 255, 255, 0.06)",
                          boxShadow: isSongLive
                            ? "0 0 12px rgba(239, 68, 68, 0.25)"
                            : isSelected
                              ? "0 0 12px rgba(168, 85, 247, 0.25)"
                              : "none",
                          transition: "all 0.12s ease",
                          display: "flex",
                          flexDirection: "column",
                          gap: "3px",
                        }}
                      >
                        {/* Top: Title & Source Badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: isSelected ? "#ffffff" : "#f1f5f9",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              flex: 1,
                            }}
                          >
                            {song.trackName}
                          </span>

                          {isSongLive && (
                            <span
                              style={{
                                fontSize: "8px",
                                fontWeight: 900,
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "1px 4px",
                                borderRadius: "3px",
                                flexShrink: 0,
                              }}
                            >
                              LIVE
                            </span>
                          )}

                          {song.isLocal ? (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "3px",
                                background: "rgba(16, 185, 129, 0.18)",
                                border: "1px solid rgba(16, 185, 129, 0.35)",
                                color: "#34d399",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <HardDrive size={9} /> BANK
                            </span>
                          ) : song.source === "google" ? (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "3px",
                                background: "rgba(59, 130, 246, 0.18)",
                                border: "1px solid rgba(59, 130, 246, 0.35)",
                                color: "#60a5fa",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <Globe size={9} /> GOOGLE
                            </span>
                          ) : song.source === "genius" ? (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "3px",
                                background: "rgba(234, 179, 8, 0.18)",
                                border: "1px solid rgba(234, 179, 8, 0.35)",
                                color: "#facc15",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <Music size={9} /> GENIUS
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                padding: "1px 5px",
                                borderRadius: "3px",
                                background: "rgba(168, 85, 247, 0.18)",
                                border: "1px solid rgba(168, 85, 247, 0.35)",
                                color: "#c084fc",
                                display: "flex",
                                alignItems: "center",
                                gap: "2px",
                                flexShrink: 0,
                              }}
                            >
                              <Globe size={9} /> ONLINE
                            </span>
                          )}
                        </div>

                        {/* Artist */}
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#94a3b8",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {song.artistName || "Worship"}
                        </div>

                        {/* Snippet if present */}
                        {song.snippet && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#64748b",
                              fontStyle: "italic",
                              lineHeight: 1.25,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            "{song.snippet}"
                          </div>
                        )}

                        {/* Card Footer: Edit, Live, Add to Schedule */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "4px",
                            marginTop: "3px",
                            paddingTop: "3px",
                            borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCurrentSong(song);
                            }}
                            title="Edit lyrics and customize split strategy"
                            style={{
                              background: "rgba(168, 85, 247, 0.12)",
                              border: "1px solid rgba(168, 85, 247, 0.28)",
                              borderRadius: "3px",
                              color: "#c084fc",
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "9px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Edit size={9} />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveAndSendToLive(song);
                            }}
                            title="Save to bank & send live to screen directly"
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              border: "1px solid rgba(239, 68, 68, 0.35)",
                              borderRadius: "3px",
                              color: "#f87171",
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "9px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Radio size={9} />
                            <span>Live</span>
                          </button>

                          <button
                            onClick={(e) => handleAddSongToSchedule(song, e)}
                            title="Add song to schedule"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              borderRadius: "3px",
                              color: "#cbd5e1",
                              cursor: "pointer",
                              padding: "2px 6px",
                              fontSize: "9px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <Plus size={9} />
                            <span>Schedule</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add Custom Song Button */}
              {onOpenSongEditor && (
                <div
                  style={{
                    padding: "8px 10px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <button
                    onClick={onOpenSongEditor}
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: "6px",
                      background: "rgba(168, 85, 247, 0.2)",
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                      color: "#c084fc",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={12} />
                    <span>Create Custom Song</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right Sub-Column: Song Cards Grid & Split Option */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#080c14",
                overflow: "hidden",
              }}
            >
              {selectedSong ? (
                <>
                  {/* Song Stanzas Bar with Split Option & Send All Song button */}
                  <div
                    style={{
                      padding: "10px 16px",
                      background: "#0f172a",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left: Song Details & Bank / Edit Actions */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {selectedSong.trackName}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {selectedSong.artistName || "Worship"}
                        </div>
                      </div>

                      {/* Bank status & Save button */}
                      {onSaveLibraryItem && (
                        !isSelectedSongSaved ? (
                          <button
                            onClick={() => handleSaveSongToLibrary(selectedSong)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.18)",
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                              color: "#34d399",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                            title="Save this song to local church song bank"
                          >
                            <Bookmark size={12} />
                            <span>Save to Song Bank</span>
                          </button>
                        ) : (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              color: "#34d399",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            <Check size={12} />
                            <span>In Bank</span>
                          </span>
                        )
                      )}

                      {/* Edit Lyrics Button */}
                      {(onEditSong || onOpenSongEditor) && (
                        <button
                          onClick={() => handleEditCurrentSong(selectedSong)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "rgba(168, 85, 247, 0.15)",
                            border: "1px solid rgba(168, 85, 247, 0.35)",
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Edit song lyrics and structure"
                        >
                          <Edit size={12} />
                          <span>Edit Lyrics</span>
                        </button>
                      )}
                    </div>

                    {/* Right: Split Option Beside Send All Song Button */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Split Option Selector */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          background: "rgba(0, 0, 0, 0.45)",
                          padding: "3px 6px",
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
                            padding: "0 4px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Split:
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
                            onClick={() => handleSplitModeChange(m.id)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "5px",
                              fontSize: "11px",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                              background:
                                lyricsSplitMode === m.id
                                  ? "#8b5cf6"
                                  : "transparent",
                              color:
                                lyricsSplitMode === m.id
                                  ? "#ffffff"
                                  : "#94a3b8",
                              transition: "all 0.12s",
                            }}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Add to Schedule Button */}
                      <button
                        onClick={() => handleAddSongToSchedule(selectedSong)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "rgba(168, 85, 247, 0.2)",
                          border: "1px solid rgba(168, 85, 247, 0.4)",
                          color: "#c084fc",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Add song to service schedule"
                      >
                        <ListPlus size={12} />
                        <span>+ Schedule</span>
                      </button>

                      {/* Save & Send Live Button */}
                      <button
                        onClick={() => handleSaveAndSendToLive(selectedSong)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 0 14px rgba(239, 68, 68, 0.45)",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s ease",
                        }}
                        title="Save song to church song bank with selected split format and send directly to live display"
                      >
                        <Radio size={13} />
                        <span>Save & Send Live</span>
                      </button>

                      {/* Send All Song Button */}
                      <button
                        onClick={() => {
                          if (!selectedSong) return;
                          const slides = parseLyricsToSlides(
                            selectedSong.plainLyrics,
                            lyricsSplitMode,
                          );
                          onSetLines(
                            selectedSong.trackName,
                            selectedSong.artistName || "Worship",
                            slides,
                            "song",
                          );
                          onJumpTo(selectedLyricSlideIndex || 0);
                          if (state.liveState.isClearText) {
                            onUpdateLiveState({ isClearText: false });
                          }
                          setLiveFeedback(true);
                          setTimeout(() => setLiveFeedback(false), 2000);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          background:
                            "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          fontSize: "12px",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                          boxShadow: "0 0 12px rgba(37, 99, 235, 0.4)",
                          whiteSpace: "nowrap",
                        }}
                        title="Send all slides of this song live to screen"
                      >
                        <Play size={13} fill="#ffffff" />
                        <span>Send All Song</span>
                      </button>
                    </div>
                  </div>

                  {/* Sub-bar: Slide counter & quick navigation */}
                  <div
                    style={{
                      padding: "6px 16px",
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
                        <strong style={{ color: "#ffffff" }}>
                          Slide {selectedLyricSlideIndex + 1}
                        </strong>{" "}
                        of {currentSongSlides.length}
                      </span>
                      <span style={{ color: "#475569" }}>•</span>
                      <span style={{ color: "#64748b" }}>
                        Click slide to preview • Double-click to project immediately
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <button
                        onClick={() => {
                          if (selectedLyricSlideIndex > 0) {
                            handleSelectSlideCard(selectedLyricSlideIndex - 1);
                          }
                        }}
                        disabled={selectedLyricSlideIndex <= 0}
                        style={{
                          padding: "4px 7px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color:
                            selectedLyricSlideIndex <= 0 ? "#475569" : "#e2e8f0",
                          cursor:
                            selectedLyricSlideIndex <= 0
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Previous Slide"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            selectedLyricSlideIndex <
                            currentSongSlides.length - 1
                          ) {
                            handleSelectSlideCard(selectedLyricSlideIndex + 1);
                          }
                        }}
                        disabled={
                          selectedLyricSlideIndex >=
                          currentSongSlides.length - 1
                        }
                        style={{
                          padding: "4px 7px",
                          borderRadius: "4px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          color:
                            selectedLyricSlideIndex >=
                            currentSongSlides.length - 1
                              ? "#475569"
                              : "#e2e8f0",
                          cursor:
                            selectedLyricSlideIndex >=
                            currentSongSlides.length - 1
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        title="Next Slide"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Slide Cards Grid */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "16px",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "14px",
                      alignContent: "start",
                    }}
                  >
                    {currentSongSlides.length === 0 ? (
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "220px",
                          color: "#64748b",
                          textAlign: "center",
                        }}
                      >
                        <Music
                          size={36}
                          color="#334155"
                          style={{ marginBottom: "10px" }}
                        />
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            marginBottom: "4px",
                          }}
                        >
                          No Lyric Slides Available
                        </div>
                        <div style={{ fontSize: "11px", maxWidth: "300px" }}>
                          This song does not have lyrics available yet.
                        </div>
                      </div>
                    ) : (
                      currentSongSlides.map((slideText, idx) => {
                        const isSelected = selectedLyricSlideIndex === idx;
                        const isSongLive =
                          state.category === "song" &&
                          state.title?.toLowerCase().trim() ===
                            selectedSong.trackName.toLowerCase().trim() &&
                          !state.liveState.isBlackout;
                        const isLive =
                          isSongLive &&
                          state.cur === idx &&
                          !state.liveState.isClearText;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectSlideCard(idx)}
                            onDoubleClick={() => handleDoubleClickSlideCard(idx)}
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
                                borderBottom:
                                  "1px solid rgba(255, 255, 255, 0.06)",
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
                                    boxShadow:
                                      "0 0 10px rgba(239, 68, 68, 0.8)",
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
                                borderTop:
                                  "1px solid rgba(255, 255, 255, 0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <span
                                style={{ fontSize: "10px", color: "#64748b" }}
                              >
                                Double-click to project
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDoubleClickSlideCard(idx);
                                }}
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  background: isLive
                                    ? "rgba(239, 68, 68, 0.25)"
                                    : "rgba(255, 255, 255, 0.08)",
                                  border: isLive
                                    ? "1px solid #ef4444"
                                    : "1px solid rgba(255, 255, 255, 0.12)",
                                  color: isLive ? "#f87171" : "#cbd5e1",
                                  fontSize: "10px",
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
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "8px",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  <Music size={36} color="#334155" />
                  <span>Select a worship song to view slide cards</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 3: MEDIA (IMPORT IMAGES & VIDEOS, SCHEDULE & GO LIVE)   */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "media" && (
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleImportMediaFiles(e.dataTransfer.files);
              }
            }}
          >
            {/* Left Sub-Column: Import + Search + Filter + Media List */}
            <div
              style={{
                width: "400px",
                minWidth: "400px",
                maxWidth: "400px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 23, 42, 0.75)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Hidden File Input for Image & Video Import */}
              <input
                ref={mediaUploadInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleImportMediaFiles(e.target.files)}
              />

              {/* Top Controls: Import Button & Search Input */}
              <div
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => mediaUploadInputRef.current?.click()}
                    disabled={mediaUploading}
                    style={{
                      flex: 1,
                      padding: "7px 12px",
                      borderRadius: "6px",
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      border: "1px solid #34d399",
                      fontSize: "11px",
                      fontWeight: 800,
                      cursor: mediaUploading ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <Upload size={13} />
                    <span>
                      {mediaUploading
                        ? "Importing Media..."
                        : "Import Image / Video"}
                    </span>
                  </button>
                </div>

                {/* Search Input */}
                <div style={{ position: "relative" }}>
                  <Search
                    size={13}
                    color="#64748b"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    value={mediaQuery}
                    onChange={(e) => setMediaQuery(e.target.value)}
                    placeholder="Search images & videos..."
                    style={{
                      width: "100%",
                      padding: "6px 28px 6px 30px",
                      background: "rgba(0, 0, 0, 0.6)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                  {mediaQuery && (
                    <button
                      onClick={() => setMediaQuery("")}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Pills: All | Images | Videos */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {(
                    [
                      { id: "all", label: "All Media" },
                      { id: "image", label: "Images" },
                      { id: "video", label: "Videos" },
                    ] as const
                  ).map((f) => {
                    const active = mediaFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setMediaFilter(f.id)}
                        style={{
                          flex: 1,
                          padding: "4px 8px",
                          borderRadius: "5px",
                          background: active
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(30, 41, 59, 0.6)",
                          border: active
                            ? "1px solid #10b981"
                            : "1px solid rgba(255, 255, 255, 0.06)",
                          color: active ? "#34d399" : "#94a3b8",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Media Items List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {filteredMediaItems.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    No media items found. Click "Import Image / Video" or drag
                    and drop files here.
                  </div>
                ) : (
                  filteredMediaItems.map((item) => {
                    const isSelected = selectedMediaItem?.id === item.id;
                    const isLive =
                      state.category === "media" && state.title === item.title;
                    const payload = parseSlidePayload(item.lines?.[0] || "");
                    const isVideo =
                      item.mediaType === "video" ||
                      payload?.mediaType === "video";
                    const mediaSrc = item.mediaUrl || payload?.mediaUrl || "";

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectMediaItem(item, false)}
                        onDoubleClick={() => handleSelectMediaItem(item, true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "7px 8px",
                          borderRadius: "7px",
                          background: isSelected
                            ? "linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.06) 100%)"
                            : "rgba(30, 41, 59, 0.45)",
                          border: isSelected
                            ? "1px solid rgba(16, 185, 129, 0.5)"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: "56px",
                            height: "34px",
                            borderRadius: "4px",
                            background: "#000000",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            overflow: "hidden",
                            flexShrink: 0,
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isVideo && mediaSrc ? (
                            <video
                              src={mediaSrc}
                              muted
                              preload="metadata"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : mediaSrc ? (
                            <img
                              src={mediaSrc}
                              alt={item.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : isVideo ? (
                            <Film size={14} color="#38bdf8" />
                          ) : (
                            <Image size={14} color="#34d399" />
                          )}
                        </div>

                        {/* Title & Meta */}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
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
                                fontSize: "12px",
                                fontWeight: 700,
                                color: isSelected ? "#ffffff" : "#e2e8f0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.title}
                            </span>
                            {isLive && (
                              <span
                                style={{
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: "rgba(239, 68, 68, 0.25)",
                                  color: "#f87171",
                                  border: "1px solid rgba(239, 68, 68, 0.5)",
                                }}
                              >
                                LIVE
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "10px",
                              color: "#94a3b8",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: 800,
                                color: isVideo ? "#38bdf8" : "#34d399",
                                textTransform: "uppercase",
                              }}
                            >
                              {isVideo ? "VIDEO" : "IMAGE"}
                            </span>
                            <span>•</span>
                            <span>{item.author || "Media Library"}</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddMediaToSchedule(item);
                            }}
                            title="Add to Service Schedule"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <ListPlus size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMediaItem(item, true);
                            }}
                            title="Send to Live Output"
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              border: "none",
                              color: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "10px",
                              fontWeight: 800,
                            }}
                          >
                            <Play size={10} fill="#ffffff" />
                          </button>
                          {!item.id.startsWith("media-default-") && (
                            <button
                              onClick={(e) => handleDeleteMediaItem(item.id, e)}
                              title="Remove from Library"
                              style={{
                                padding: "4px",
                                borderRadius: "4px",
                                background: "transparent",
                                border: "none",
                                color: "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Sub-Column: Selected Media Settings & Visual Gallery Grid */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#090d16",
                overflow: "hidden",
              }}
            >
              {/* Top Toolbar for Selected Media Item */}
              {selectedMediaItem && (() => {
                const payload = parseSlidePayload(
                  selectedMediaItem.lines?.[0] || "",
                );
                const isVideo =
                  selectedMediaItem.mediaType === "video" ||
                  payload?.mediaType === "video";
                const currentFit = payload?.fitMode || "contain";
                const isMuted = payload?.muted ?? false;
                const isLoop = payload?.loop ?? true;

                return (
                  <div
                    style={{
                      padding: "10px 16px",
                      background: "#0f172a",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minWidth: 0,
                      }}
                    >
                      {isVideo ? (
                        <Film size={16} color="#38bdf8" />
                      ) : (
                        <Image size={16} color="#34d399" />
                      )}
                      <div>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "#ffffff",
                          }}
                        >
                          {selectedMediaItem.title}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          {isVideo ? "Video Media" : "Image Media"} • Click a
                          card to preview, double-click to send to Live
                        </div>
                      </div>
                    </div>

                    {/* Display Settings & Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Aspect Fit Mode */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: "rgba(15, 23, 42, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          padding: "2px",
                        }}
                      >
                        {(["contain", "cover"] as const).map((mode) => (
                          <button
                            key={mode}
                            onClick={() =>
                              handleUpdateMediaSettings(selectedMediaItem, {
                                fitMode: mode,
                              })
                            }
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              border: "none",
                              background:
                                currentFit === mode ? "#0284c7" : "transparent",
                              color:
                                currentFit === mode ? "#ffffff" : "#94a3b8",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              textTransform: "capitalize",
                            }}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>

                      {/* Video Controls: Loop & Mute */}
                      {isVideo && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateMediaSettings(selectedMediaItem, {
                                loop: !isLoop,
                              })
                            }
                            style={{
                              padding: "5px 9px",
                              borderRadius: "6px",
                              background: isLoop
                                ? "rgba(56, 189, 248, 0.18)"
                                : "rgba(30, 41, 59, 0.6)",
                              border: isLoop
                                ? "1px solid #38bdf8"
                                : "1px solid rgba(255, 255, 255, 0.1)",
                              color: isLoop ? "#38bdf8" : "#94a3b8",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Repeat size={12} />
                            <span>{isLoop ? "Loop On" : "Loop Off"}</span>
                          </button>

                          <button
                            onClick={() =>
                              handleUpdateMediaSettings(selectedMediaItem, {
                                muted: !isMuted,
                              })
                            }
                            style={{
                              padding: "5px 9px",
                              borderRadius: "6px",
                              background: !isMuted
                                ? "rgba(16, 185, 129, 0.18)"
                                : "rgba(239, 68, 68, 0.15)",
                              border: !isMuted
                                ? "1px solid #10b981"
                                : "1px solid rgba(239, 68, 68, 0.4)",
                              color: !isMuted ? "#34d399" : "#f87171",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isMuted ? (
                              <VolumeX size={12} />
                            ) : (
                              <Volume2 size={12} />
                            )}
                            <span>{isMuted ? "Muted" : "Audio On"}</span>
                          </button>
                        </>
                      )}

                      {/* Caption Overlay Input */}
                      <input
                        type="text"
                        value={payload?.body || ""}
                        onChange={(e) =>
                          handleUpdateMediaSettings(selectedMediaItem, {
                            body: e.target.value,
                          })
                        }
                        placeholder="Optional caption overlay..."
                        style={{
                          width: "165px",
                          padding: "5px 8px",
                          borderRadius: "6px",
                          background: "rgba(0, 0, 0, 0.5)",
                          border: "1px solid rgba(255, 255, 255, 0.14)",
                          color: "#ffffff",
                          fontSize: "11px",
                          outline: "none",
                        }}
                      />

                      {/* Add to Schedule */}
                      <button
                        onClick={() => handleAddMediaToSchedule(selectedMediaItem)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          color: "#38bdf8",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <ListPlus size={13} />
                        <span>+ Schedule</span>
                      </button>

                      {/* Send to Live */}
                      <button
                        onClick={() =>
                          handleSelectMediaItem(selectedMediaItem, true)
                        }
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background:
                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          border: "none",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 0 12px rgba(16, 185, 129, 0.35)",
                        }}
                      >
                        <Play size={11} fill="#ffffff" />
                        <span>Send to Live</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Visual Media Grid */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "14px 16px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "12px",
                  alignContent: "start",
                }}
              >
                {filteredMediaItems.map((item) => {
                  const isSelected = selectedMediaItem?.id === item.id;
                  const isLive =
                    state.category === "media" && state.title === item.title;
                  const payload = parseSlidePayload(item.lines?.[0] || "");
                  const isVideo =
                    item.mediaType === "video" ||
                    payload?.mediaType === "video";
                  const mediaSrc = item.mediaUrl || payload?.mediaUrl || "";

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectMediaItem(item, false)}
                      onDoubleClick={() => handleSelectMediaItem(item, true)}
                      style={{
                        borderRadius: "10px",
                        background: isSelected
                          ? "rgba(16, 185, 129, 0.12)"
                          : "rgba(15, 23, 42, 0.85)",
                        border: isLive
                          ? "2px solid #ef4444"
                          : isSelected
                          ? "2px solid #10b981"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        overflow: "hidden",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: isSelected
                          ? "0 8px 20px rgba(0, 0, 0, 0.5)"
                          : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* 16:9 Media Card Preview */}
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          background: "#000000",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {isVideo && mediaSrc ? (
                          <video
                            src={mediaSrc}
                            muted
                            loop
                            playsInline
                            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                            onMouseLeave={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: payload?.fitMode || "contain",
                            }}
                          />
                        ) : mediaSrc ? (
                          <img
                            src={mediaSrc}
                            alt={item.title}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: payload?.fitMode || "contain",
                            }}
                          />
                        ) : null}

                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            left: "6px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(15, 23, 42, 0.85)",
                            color: isVideo ? "#38bdf8" : "#34d399",
                            fontSize: "9px",
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                          }}
                        >
                          {isVideo ? "VIDEO" : "IMAGE"}
                        </div>

                        {isLive && (
                          <div
                            style={{
                              position: "absolute",
                              top: "6px",
                              right: "6px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#ef4444",
                              color: "#ffffff",
                              fontSize: "9px",
                              fontWeight: 800,
                            }}
                          >
                            LIVE ON SCREEN
                          </div>
                        )}
                      </div>

                      {/* Card Footer */}
                      <div
                        style={{
                          padding: "8px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "6px",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#ffffff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.title}
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b" }}>
                            {item.author || "Media Asset"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddMediaToSchedule(item);
                            }}
                            title="Add to Schedule"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontSize: "10px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            + Sched
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectMediaItem(item, true);
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: isLive
                                ? "rgba(239, 68, 68, 0.25)"
                                : "rgba(16, 185, 129, 0.2)",
                              border: isLive
                                ? "1px solid #ef4444"
                                : "1px solid #10b981",
                              color: isLive ? "#f87171" : "#34d399",
                              fontSize: "10px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {isLive ? "Live" : "Go Live"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 4: PRESENTATIONS (IMPORT WORD, PDF, PPT + SLIDE/PAGE NAV)*/}
        {/* ----------------------------------------------------------- */}
        {activeTab === "presentations" && (
          <div
            style={{
              display: "flex",
              flex: 1,
              overflow: "hidden",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleImportPresentationFiles(e.dataTransfer.files);
              }
            }}
          >
            {/* Left Sub-Column: Import Word/PDF/PPT + Filter + Presentation List */}
            <div
              style={{
                width: "400px",
                minWidth: "400px",
                maxWidth: "400px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 23, 42, 0.75)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Hidden File Input for Word, PDF, PowerPoint */}
              <input
                ref={presUploadInputRef}
                type="file"
                accept=".pptx,.ppt,.docx,.doc,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleImportPresentationFiles(e.target.files)}
              />

              {/* Top Controls: Import Button & Search */}
              <div
                style={{
                  padding: "10px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => presUploadInputRef.current?.click()}
                  disabled={presUploading}
                  style={{
                    width: "100%",
                    padding: "7px 12px",
                    borderRadius: "6px",
                    background:
                      "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                    color: "#ffffff",
                    border: "1px solid #fb923c",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: presUploading ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 0 12px rgba(249, 115, 22, 0.3)",
                  }}
                >
                  <Upload size={13} />
                  <span>
                    {presUploading
                      ? "Parsing Slides / Pages..."
                      : "Import Word, PDF, or PowerPoint"}
                  </span>
                </button>

                {/* Search Input */}
                <div style={{ position: "relative" }}>
                  <Search
                    size={13}
                    color="#64748b"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    value={presQuery}
                    onChange={(e) => setPresQuery(e.target.value)}
                    placeholder="Search Word, PDF, PowerPoint..."
                    style={{
                      width: "100%",
                      padding: "6px 28px 6px 30px",
                      background: "rgba(0, 0, 0, 0.6)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                  {presQuery && (
                    <button
                      onClick={() => setPresQuery("")}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Pills: All | PPT | Word | PDF */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "pptx", label: "PowerPoint" },
                      { id: "docx", label: "Word" },
                      { id: "pdf", label: "PDF" },
                    ] as const
                  ).map((f) => {
                    const active = presFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setPresFilter(f.id)}
                        style={{
                          flex: 1,
                          padding: "4px 6px",
                          borderRadius: "5px",
                          background: active
                            ? "rgba(249, 115, 22, 0.2)"
                            : "rgba(30, 41, 59, 0.6)",
                          border: active
                            ? "1px solid #f97316"
                            : "1px solid rgba(255, 255, 255, 0.06)",
                          color: active ? "#fb923c" : "#94a3b8",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Presentations List */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                {filteredPresentationItems.length === 0 ? (
                  <div
                    style={{
                      padding: "28px 16px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    No presentations or documents found. Import `.pptx`, `.docx`,
                    or `.pdf` files above.
                  </div>
                ) : (
                  filteredPresentationItems.map((item) => {
                    const isSelected = selectedPresentation?.id === item.id;
                    const isLive =
                      state.category === "presentation" &&
                      state.title === item.title;
                    const docType = item.docType || "pptx";
                    const typeColor =
                      docType === "pptx"
                        ? "#f97316"
                        : docType === "docx"
                        ? "#3b82f6"
                        : "#ef4444";
                    const unitWord = docType === "pptx" ? "slides" : "pages";

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectPresentation(item, false, 0)}
                        onDoubleClick={() =>
                          handleSelectPresentation(item, true, 0)
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px",
                          borderRadius: "7px",
                          background: isSelected
                            ? "linear-gradient(90deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.06) 100%)"
                            : "rgba(30, 41, 59, 0.45)",
                          border: isSelected
                            ? "1px solid rgba(249, 115, 22, 0.5)"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                          borderLeft: `3px solid ${typeColor}`,
                          cursor: "pointer",
                          transition: "all 0.12s ease",
                        }}
                      >
                        {/* Doc Type Badge Icon */}
                        <div
                          style={{
                            width: "38px",
                            height: "34px",
                            borderRadius: "6px",
                            background: "rgba(15, 23, 42, 0.9)",
                            border: `1px solid ${typeColor}55`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileText size={12} color={typeColor} />
                          <span
                            style={{
                              fontSize: "8px",
                              fontWeight: 900,
                              color: typeColor,
                              textTransform: "uppercase",
                              marginTop: "1px",
                            }}
                          >
                            {docType}
                          </span>
                        </div>

                        {/* Title & Slide/Page Count */}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
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
                                fontSize: "12px",
                                fontWeight: 700,
                                color: isSelected ? "#ffffff" : "#e2e8f0",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.title}
                            </span>
                            {isLive && (
                              <span
                                style={{
                                  fontSize: "8px",
                                  fontWeight: 800,
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  background: "rgba(239, 68, 68, 0.25)",
                                  color: "#f87171",
                                  border: "1px solid rgba(239, 68, 68, 0.5)",
                                }}
                              >
                                LIVE
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "10px",
                              color: "#94a3b8",
                            }}
                          >
                            <span style={{ color: typeColor, fontWeight: 700 }}>
                              {item.lines.length} {unitWord}
                            </span>
                            <span>•</span>
                            <span>{item.author || "Document"}</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddPresentationToSchedule(item);
                            }}
                            title="Add to Service Schedule"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "4px",
                              background: "rgba(56, 189, 248, 0.12)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <ListPlus size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPresentation(item, true, 0);
                            }}
                            title="Send Presentation to Live"
                            style={{
                              padding: "4px 7px",
                              borderRadius: "4px",
                              background:
                                "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                              border: "none",
                              color: "#ffffff",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "10px",
                              fontWeight: 800,
                            }}
                          >
                            <Play size={10} fill="#ffffff" />
                          </button>
                          {!item.id.startsWith("pres-default-") && (
                            <button
                              onClick={(e) =>
                                handleDeletePresentation(item.id, e)
                              }
                              title="Remove from Library"
                              style={{
                                padding: "4px",
                                borderRadius: "4px",
                                background: "transparent",
                                border: "none",
                                color: "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Sub-Column: Slide / Page Navigator & Interactive Slide Deck */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#090d16",
                overflow: "hidden",
              }}
            >
              {selectedPresentation ? (
                <>
                  {/* Presentation Header & Direct Slide/Page Navigator Bar */}
                  {(() => {
                    const docType =
                      selectedPresentation.docType || "pptx";
                    const unitSingular = docType === "pptx" ? "Slide" : "Page";
                    const unitPlural = docType === "pptx" ? "Slides" : "Pages";
                    const totalSlides = currentPresentationSlides.length;
                    const activeIdx = Math.min(
                      selectedPresSlideIndex,
                      Math.max(0, totalSlides - 1),
                    );
                    const badgeColor =
                      docType === "pptx"
                        ? "#f97316"
                        : docType === "docx"
                        ? "#3b82f6"
                        : "#ef4444";

                    return (
                      <div
                        style={{
                          padding: "8px 16px",
                          background: "#0f172a",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {/* Title & Badge */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "5px",
                              background: `${badgeColor}22`,
                              border: `1px solid ${badgeColor}`,
                              color: badgeColor,
                              fontSize: "10px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            {docType === "pptx"
                              ? "PowerPoint"
                              : docType === "docx"
                              ? "Word Doc"
                              : "PDF"}
                          </span>
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "#ffffff",
                              }}
                            >
                              {selectedPresentation.title}
                            </div>
                            <div style={{ fontSize: "10px", color: "#64748b" }}>
                              {totalSlides} {unitPlural} • Navigate {unitSingular}{" "}
                              below or jump directly
                            </div>
                          </div>
                        </div>

                        {/* Center: Direct Slide / Page Navigation Controls */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "rgba(15, 23, 42, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            padding: "3px 6px",
                            borderRadius: "7px",
                          }}
                        >
                          <button
                            onClick={() =>
                              handleSelectPresSlide(activeIdx - 1, false)
                            }
                            disabled={activeIdx <= 0}
                            title={`Previous ${unitSingular}`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "5px",
                              background:
                                activeIdx <= 0
                                  ? "transparent"
                                  : "rgba(56, 189, 248, 0.15)",
                              border: "none",
                              color: activeIdx <= 0 ? "#475569" : "#38bdf8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor:
                                activeIdx <= 0 ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <ChevronLeft size={13} />
                            <span>Prev {unitSingular}</span>
                          </button>

                          {/* Direct Jump Dropdown for Slide / Page */}
                          <select
                            value={activeIdx}
                            onChange={(e) =>
                              handleSelectPresSlide(
                                parseInt(e.target.value, 10) || 0,
                                false,
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "5px",
                              background: "#090d16",
                              color: "#ffffff",
                              border: "1px solid rgba(255, 255, 255, 0.18)",
                              fontSize: "11px",
                              fontWeight: 700,
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            {currentPresentationSlides.map((raw, i) => {
                              const p = parseSlidePayload(raw);
                              const labelText =
                                p?.heading || `${unitSingular} ${i + 1}`;
                              return (
                                <option key={i} value={i}>
                                  {unitSingular} {i + 1} of {totalSlides} —{" "}
                                  {labelText.slice(0, 32)}
                                </option>
                              );
                            })}
                          </select>

                          <button
                            onClick={() =>
                              handleSelectPresSlide(activeIdx + 1, false)
                            }
                            disabled={activeIdx >= totalSlides - 1}
                            title={`Next ${unitSingular}`}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "5px",
                              background:
                                activeIdx >= totalSlides - 1
                                  ? "transparent"
                                  : "rgba(56, 189, 248, 0.15)",
                              border: "none",
                              color:
                                activeIdx >= totalSlides - 1
                                  ? "#475569"
                                  : "#38bdf8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor:
                                activeIdx >= totalSlides - 1
                                  ? "not-allowed"
                                  : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            <span>Next {unitSingular}</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>

                        {/* Right: Word Page Density + Add to Schedule + Project Active Slide/Page */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {docType === "docx" && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                background: "rgba(15, 23, 42, 0.9)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "6px",
                                padding: "2px",
                              }}
                              title="Control how many paragraphs appear per Word page"
                            >
                              {(
                                [
                                  { id: "standard", label: "Standard" },
                                  { id: "compact", label: "Compact" },
                                  { id: "headings", label: "By Heading" },
                                  { id: "paragraphs", label: "1 Para" },
                                ] as const
                              ).map((m) => (
                                <button
                                  key={m.id}
                                  onClick={() => handleWordSplitModeChange(m.id)}
                                  style={{
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    border: "none",
                                    background:
                                      wordSplitMode === m.id
                                        ? "#3b82f6"
                                        : "transparent",
                                    color:
                                      wordSplitMode === m.id
                                        ? "#ffffff"
                                        : "#94a3b8",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() =>
                              handleAddPresentationToSchedule(
                                selectedPresentation,
                                currentPresentationSlides,
                              )
                            }
                            style={{
                              padding: "5px 10px",
                              borderRadius: "6px",
                              background: "rgba(56, 189, 248, 0.15)",
                              border: "1px solid rgba(56, 189, 248, 0.4)",
                              color: "#38bdf8",
                              fontSize: "11px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <ListPlus size={13} />
                            <span>+ Schedule</span>
                          </button>

                          <button
                            onClick={() =>
                              handleSelectPresSlide(activeIdx, true)
                            }
                            style={{
                              padding: "5px 12px",
                              borderRadius: "6px",
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              border: "none",
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              boxShadow: "0 0 12px rgba(16, 185, 129, 0.35)",
                            }}
                          >
                            <Play size={11} fill="#ffffff" />
                            <span>
                              Go Live ({unitSingular} {activeIdx + 1})
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Slide / Page Cards Grid */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "14px 16px",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "12px",
                      alignContent: "start",
                    }}
                  >
                    {currentPresentationSlides.map((rawSlide, idx) => {
                      const payload = parseSlidePayload(rawSlide);
                      const docType =
                        payload?.docType ||
                        selectedPresentation.docType ||
                        "pptx";
                      const unitSingular = docType === "pptx" ? "Slide" : "Page";
                      const isPreviewSelected = selectedPresSlideIndex === idx;
                      const isLive =
                        state.category === "presentation" &&
                        state.title === selectedPresentation.title &&
                        state.cur === idx;
                      const accentColor =
                        docType === "pptx"
                          ? "#f97316"
                          : docType === "docx"
                          ? "#3b82f6"
                          : "#ef4444";

                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectPresSlide(idx, false)}
                          onDoubleClick={() => handleSelectPresSlide(idx, true)}
                          style={{
                            borderRadius: "10px",
                            padding: "12px",
                            background: isLive
                              ? "linear-gradient(145deg, rgba(239, 68, 68, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)"
                              : isPreviewSelected
                              ? "linear-gradient(145deg, rgba(56, 189, 248, 0.16) 0%, rgba(15, 23, 42, 0.95) 100%)"
                              : "rgba(15, 23, 42, 0.85)",
                            border: isLive
                              ? "2px solid #ef4444"
                              : isPreviewSelected
                              ? "2px solid #38bdf8"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "170px",
                            transition: "all 0.12s ease",
                          }}
                        >
                          {/* Card Top Header */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  padding: "2px 8px",
                                  borderRadius: "999px",
                                  background: `${accentColor}22`,
                                  color: accentColor,
                                  border: `1px solid ${accentColor}55`,
                                }}
                              >
                                {unitSingular} {idx + 1} of{" "}
                                {currentPresentationSlides.length}
                              </span>

                              {isLive ? (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    background: "#ef4444",
                                    color: "#ffffff",
                                  }}
                                >
                                  LIVE
                                </span>
                              ) : isPreviewSelected ? (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
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

                            {/* Slide / Page Heading */}
                            {payload?.heading && (
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  color: "#ffffff",
                                  marginBottom: "6px",
                                  lineHeight: 1.3,
                                }}
                              >
                                {payload.heading}
                              </div>
                            )}

                            {/* Bullets or Body Preview */}
                            {Array.isArray(payload?.bullets) &&
                            payload!.bullets!.length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "4px",
                                }}
                              >
                                {payload!.bullets!.slice(0, 4).map((b, bIdx) => (
                                  <div
                                    key={bIdx}
                                    style={{
                                      display: "flex",
                                      alignItems: "flex-start",
                                      gap: "6px",
                                      fontSize: "11px",
                                      color: "#cbd5e1",
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: accentColor,
                                        fontWeight: 900,
                                      }}
                                    >
                                      •
                                    </span>
                                    <span
                                      style={{
                                        overflow: "hidden",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {b}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  color: "#cbd5e1",
                                  lineHeight: 1.45,
                                  whiteSpace: "pre-line",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 4,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {payload?.body || rawSlide}
                              </div>
                            )}

                            {/* Embedded Image Thumbnail if present */}
                            {payload?.imageUrl && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  height: "64px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  background: "#000000",
                                  border:
                                    "1px solid rgba(255, 255, 255, 0.1)",
                                }}
                              >
                                <img
                                  src={payload.imageUrl}
                                  alt="Slide graphic"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Card Footer */}
                          <div
                            style={{
                              marginTop: "10px",
                              paddingTop: "8px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
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
                                handleSelectPresSlide(idx, true);
                              }}
                              style={{
                                padding: "3px 9px",
                                borderRadius: "4px",
                                background: isLive
                                  ? "rgba(239, 68, 68, 0.25)"
                                  : "rgba(255, 255, 255, 0.08)",
                                border: isLive
                                  ? "1px solid #ef4444"
                                  : "1px solid rgba(255, 255, 255, 0.14)",
                                color: isLive ? "#f87171" : "#e2e8f0",
                                fontSize: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {isLive
                                ? "On Screen"
                                : `Project ${unitSingular} ${idx + 1}`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "8px",
                    color: "#64748b",
                  }}
                >
                  <FileText size={36} color="#334155" />
                  <span>
                    Select or import a PowerPoint, Word, or PDF file to navigate
                    slides & pages
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 5: THEMES & BACKGROUND DESIGNER                         */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "themes" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "#080c14",
              position: "relative",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const f = e.dataTransfer.files[0];
                if (f.name.endsWith(".json") || f.type.includes("json")) {
                  handleImportThemeJsonFile(e.dataTransfer.files);
                } else if (f.type.startsWith("image/")) {
                  handleImportBackgroundImageFile(e.dataTransfer.files);
                }
              }
            }}
          >
            {/* Hidden File Inputs for Import */}
            <input
              ref={themeFileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={(e) => handleImportThemeJsonFile(e.target.files)}
            />
            <input
              ref={bgImageInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleImportBackgroundImageFile(e.target.files)}
            />

            {/* Sub-Header: Search + Categories + Action Buttons */}
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(15, 23, 42, 0.8)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* Left: Search & Filter Pills */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                {/* Search Input */}
                <div style={{ position: "relative", width: "220px" }}>
                  <Search
                    size={14}
                    color="#94a3b8"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <input
                    type="text"
                    value={themeSearchQuery}
                    onChange={(e) => setThemeSearchQuery(e.target.value)}
                    placeholder="Search themes, styles..."
                    style={{
                      width: "100%",
                      padding: "5px 10px 5px 30px",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "6px",
                      color: "#ffffff",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  />
                  {themeSearchQuery && (
                    <button
                      onClick={() => setThemeSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {[
                    { id: "all", label: "All Themes", count: combinedThemesList.length },
                    {
                      id: "color",
                      label: "Colors & Gradients",
                      count: combinedThemesList.filter((t) => t.category === "color").length,
                    },
                    {
                      id: "pattern",
                      label: "Patterns",
                      count: combinedThemesList.filter((t) => t.category === "pattern").length,
                    },
                    {
                      id: "solid",
                      label: "Solid",
                      count: combinedThemesList.filter((t) => t.category === "solid").length,
                    },
                    {
                      id: "custom",
                      label: "Custom / Imported",
                      count: customThemes.length,
                    },
                  ].map((cat) => {
                    const isSelected = themeFilterCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setThemeFilterCategory(cat.id as any)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: isSelected
                            ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                            : "rgba(255, 255, 255, 0.04)",
                          color: isSelected ? "#ffffff" : "#94a3b8",
                          border: isSelected
                            ? "1px solid #38bdf8"
                            : "1px solid rgba(255, 255, 255, 0.08)",
                          fontSize: "11px",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          transition: "all 0.12s ease",
                        }}
                      >
                        <span>{cat.label}</span>
                        <span
                          style={{
                            fontSize: "9px",
                            opacity: 0.75,
                            background: "rgba(0,0,0,0.3)",
                            padding: "1px 5px",
                            borderRadius: "999px",
                          }}
                        >
                          {cat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Actions (Import JSON, Import Image, Export, Studio) */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Import Theme (JSON) */}
                <button
                  onClick={() => themeFileInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  title="Import a theme configuration from JSON file or drag & drop"
                >
                  <Upload size={12} />
                  <span>Import Theme</span>
                </button>

                {/* Import Background (Image) */}
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    color: "#c084fc",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  title="Upload an image background (JPG, PNG, WebP) for live projection"
                >
                  <Image size={12} />
                  <span>Import Background</span>
                </button>

                {/* Export Current Theme */}
                <button
                  onClick={handleExportCurrentTheme}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#cbd5e1",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s ease",
                  }}
                  title="Export current active theme configuration as a JSON file"
                >
                  <Download size={12} />
                  <span>Export</span>
                </button>

                {/* Theme Studio Customizer Drawer Toggle */}
                <button
                  onClick={() => setIsThemeCustomizerOpen((prev) => !prev)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "5px 12px",
                    borderRadius: "6px",
                    background: isThemeCustomizerOpen
                      ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                      : "rgba(255, 255, 255, 0.08)",
                    border: isThemeCustomizerOpen
                      ? "1px solid #c084fc"
                      : "1px solid rgba(255, 255, 255, 0.16)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: isThemeCustomizerOpen
                      ? "0 0 12px rgba(139, 92, 246, 0.4)"
                      : "none",
                    transition: "all 0.15s ease",
                  }}
                  title="Open Custom Theme & Pattern Designer Studio"
                >
                  <Sliders size={12} />
                  <span>Theme Studio</span>
                </button>
              </div>
            </div>

            {/* Toast Feedback Banner */}
            {themeActionFeedback && (
              <div
                style={{
                  position: "absolute",
                  top: "54px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 30,
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid #38bdf8",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(56, 189, 248, 0.35)",
                  color: "#ffffff",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  animation: "fadeIn 0.2s ease",
                }}
              >
                <CheckCircle2 size={14} color="#38bdf8" />
                <span>{themeActionFeedback}</span>
              </div>
            )}

            {/* Split Content: Main Themes Grid + Optional Customizer Drawer */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* Left / Center Grid of Theme Cards */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {/* Active Theme Status Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    background: "rgba(30, 41, 59, 0.4)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#10b981",
                        boxShadow: "0 0 8px #10b981",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Active Live Theme:
                    </span>
                    <strong style={{ fontSize: "12px", color: "#f8fafc" }}>
                      {state.theme.bgPattern
                        ? `Pattern: ${getPatternById(state.theme.bgPattern)?.name || state.theme.bgPattern}`
                        : state.theme.bgType === "image"
                        ? "Custom Background Image"
                        : state.theme.bgType === "solid"
                        ? "Solid Minimal Color"
                        : "Ambient Motion Gradient"}
                    </strong>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {state.theme.bgType}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    Tip: Click <strong>Preview</strong> to inspect in upper monitor, or{" "}
                    <strong>Apply Live</strong> to broadcast to projection screen.
                  </div>
                </div>

                {/* Theme Cards Grid */}
                {filteredThemesList.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      color: "#64748b",
                      padding: "40px",
                    }}
                  >
                    <Palette size={32} color="#475569" />
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8" }}>
                      No matching themes found
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      Try adjusting your search query or category filter.
                    </div>
                    <button
                      onClick={() => {
                        setThemeSearchQuery("");
                        setThemeFilterCategory("all");
                      }}
                      style={{
                        marginTop: "8px",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        background: "rgba(56, 189, 248, 0.12)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {filteredThemesList.map((preset) => {
                      const isActiveLive =
                        (preset.theme.bgType === state.theme.bgType &&
                          preset.theme.bgColor === state.theme.bgColor &&
                          preset.theme.bgGradient === state.theme.bgGradient &&
                          preset.theme.bgPattern === state.theme.bgPattern) ||
                        false;

                      const isCurrentlyPreviewed =
                        previewTheme &&
                        previewTheme.bgColor === preset.theme.bgColor &&
                        previewTheme.bgGradient === preset.theme.bgGradient &&
                        previewTheme.bgPattern === preset.theme.bgPattern;

                      return (
                        <div
                          key={preset.id}
                          onDoubleClick={() => handleApplyTheme(preset.theme, preset.name)}
                          style={{
                            background: "rgba(15, 23, 42, 0.65)",
                            borderRadius: "10px",
                            border: isActiveLive
                              ? "2px solid #10b981"
                              : isCurrentlyPreviewed
                              ? "2px solid #38bdf8"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: isActiveLive
                              ? "0 0 20px rgba(16, 185, 129, 0.25)"
                              : isCurrentlyPreviewed
                              ? "0 0 16px rgba(56, 189, 248, 0.25)"
                              : "0 4px 14px rgba(0, 0, 0, 0.4)",
                            transition: "all 0.15s ease",
                            cursor: "pointer",
                          }}
                        >
                          {/* 16:9 Thumbnail Preview using ThemeBackgroundLayer */}
                          <div
                            style={{
                              width: "100%",
                              aspectRatio: "16 / 9",
                              position: "relative",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "12px",
                              textAlign: "center",
                              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                            }}
                          >
                            {/* The Real Theme Background Layer */}
                            <ThemeBackgroundLayer
                              theme={preset.theme}
                              isBlackout={false}
                            />

                            {/* Sample Text Overlay */}
                            <div
                              style={{
                                position: "relative",
                                zIndex: 2,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "100%",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  color: preset.theme.accentColor || "#38bdf8",
                                  letterSpacing: "0.08em",
                                  textTransform: "uppercase",
                                  marginBottom: "4px",
                                  textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                                }}
                              >
                                JOHN 3:16
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  fontWeight: preset.theme.fontWeight || 700,
                                  fontFamily: preset.theme.fontFamily || "Montserrat, sans-serif",
                                  color: preset.theme.textColor || "#ffffff",
                                  lineHeight: 1.35,
                                  textShadow: preset.theme.textShadow
                                    ? `0 2px 6px ${preset.theme.shadowColor || "rgba(0,0,0,0.9)"}`
                                    : "none",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                For God so loved the world that He gave His only Son...
                              </div>
                            </div>

                            {/* Badges on Thumbnail */}
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                zIndex: 3,
                                display: "flex",
                                gap: "4px",
                              }}
                            >
                              {isActiveLive && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 900,
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    background: "#10b981",
                                    color: "#ffffff",
                                    boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  LIVE ACTIVE
                                </span>
                              )}
                              {isCurrentlyPreviewed && !isActiveLive && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    background: "#0284c7",
                                    color: "#ffffff",
                                    boxShadow: "0 0 10px rgba(2, 132, 199, 0.6)",
                                  }}
                                >
                                  PREVIEW
                                </span>
                              )}
                            </div>

                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                zIndex: 3,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(0, 0, 0, 0.6)",
                                  color: "#cbd5e1",
                                  border: "1px solid rgba(255, 255, 255, 0.15)",
                                  textTransform: "uppercase",
                                }}
                              >
                                {preset.theme.bgPattern
                                  ? "Pattern"
                                  : preset.theme.bgType === "image"
                                  ? "Image"
                                  : preset.theme.bgType === "solid"
                                  ? "Solid"
                                  : "Gradient"}
                              </span>
                            </div>
                          </div>

                          {/* Card Content & Action Footer */}
                          <div
                            style={{
                              padding: "10px 12px",
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
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  color: "#ffffff",
                                }}
                              >
                                {preset.name}
                              </span>

                              {/* Palette Swatches */}
                              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                {preset.palette.slice(0, 4).map((c, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: c,
                                      border: "1px solid rgba(255, 255, 255, 0.3)",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                                    }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                lineHeight: 1.35,
                                height: "28px",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {preset.description}
                            </div>

                            {/* Buttons: Preview & Apply Live */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                marginTop: "4px",
                              }}
                            >
                              <button
                                onClick={() => handlePreviewTheme(preset.theme, preset.name)}
                                style={{
                                  flex: 1,
                                  padding: "5px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(255, 255, 255, 0.06)",
                                  border: "1px solid rgba(255, 255, 255, 0.12)",
                                  color: "#cbd5e1",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  transition: "all 0.12s ease",
                                }}
                                title="Inspect this theme in upper Preview monitor"
                              >
                                <Eye size={12} />
                                <span>Preview</span>
                              </button>

                              <button
                                onClick={() => handleApplyTheme(preset.theme, preset.name)}
                                style={{
                                  flex: 1.2,
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  background: isActiveLive
                                    ? "rgba(16, 185, 129, 0.25)"
                                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  border: isActiveLive
                                    ? "1px solid #10b981"
                                    : "none",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  boxShadow: isActiveLive
                                    ? "none"
                                    : "0 0 10px rgba(16, 185, 129, 0.35)",
                                  transition: "all 0.12s ease",
                                }}
                                title="Apply this theme background directly to Live Monitor & Projection Display screen"
                              >
                                <Play size={10} fill="#ffffff" />
                                <span>{isActiveLive ? "Active Live" : "Apply Live"}</span>
                              </button>

                              {preset.category === "custom" && (
                                <button
                                  onClick={(e) => handleDeleteCustom(preset.id, preset.name, e)}
                                  style={{
                                    padding: "5px 7px",
                                    borderRadius: "6px",
                                    background: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#f87171",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title="Delete custom theme"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Drawer: Custom Theme & Pattern Studio */}
              {isThemeCustomizerOpen && (
                <div
                  style={{
                    width: "380px",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(15, 23, 42, 0.95)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  {/* Studio Header */}
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Palette size={15} color="#c084fc" />
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>
                        Theme & Pattern Studio
                      </span>
                    </div>

                    <button
                      onClick={() => setIsThemeCustomizerOpen(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Studio Scrollable Body */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    {/* Live Thumbnail Preview */}
                    <div>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          marginBottom: "6px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Studio Preview
                      </div>
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          borderRadius: "8px",
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "12px",
                          textAlign: "center",
                        }}
                      >
                        <ThemeBackgroundLayer
                          theme={customThemeDraft}
                          isBlackout={false}
                        />
                        <div
                          style={{
                            position: "relative",
                            zIndex: 2,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              color: customThemeDraft.accentColor || "#38bdf8",
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              marginBottom: "3px",
                            }}
                          >
                            CUSTOM PREVIEW
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: customThemeDraft.fontWeight || 700,
                              fontFamily: customThemeDraft.fontFamily || "Montserrat, sans-serif",
                              color: customThemeDraft.textColor || "#ffffff",
                              lineHeight: 1.3,
                              textShadow: customThemeDraft.textShadow
                                ? `0 2px 6px ${customThemeDraft.shadowColor || "rgba(0,0,0,0.9)"}`
                                : "none",
                            }}
                          >
                            Thy word is a lamp unto my feet, and a light unto my path.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Theme Name */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          marginBottom: "4px",
                        }}
                      >
                        Theme Name
                      </label>
                      <input
                        type="text"
                        value={customThemeDraftName}
                        onChange={(e) => setCustomThemeDraftName(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          background: "rgba(0, 0, 0, 0.35)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontSize: "12px",
                          outline: "none",
                        }}
                      />
                    </div>

                    {/* Background Type Mode */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          marginBottom: "6px",
                        }}
                      >
                        Background Mode
                      </label>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "4px",
                        }}
                      >
                        {[
                          { id: "animated-gradient", label: "Ambient" },
                          { id: "pattern", label: "Pattern" },
                          { id: "gradient", label: "Gradient" },
                          { id: "solid", label: "Solid" },
                          { id: "image", label: "Image" },
                        ].map((m) => {
                          const isSel = customThemeDraft.bgType === m.id;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                setCustomThemeDraft((prev) => ({
                                  ...prev,
                                  bgType: m.id as any,
                                  ...(m.id === "pattern" && !prev.bgPattern
                                    ? { bgPattern: "crosses", bgPatternColor: "#f59e0b" }
                                    : {}),
                                }));
                              }}
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                background: isSel
                                  ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
                                  : "rgba(255, 255, 255, 0.04)",
                                color: isSel ? "#ffffff" : "#cbd5e1",
                                border: isSel
                                  ? "1px solid #38bdf8"
                                  : "1px solid rgba(255, 255, 255, 0.08)",
                                fontSize: "11px",
                                fontWeight: isSel ? 700 : 500,
                                cursor: "pointer",
                              }}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Color Customization */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          marginBottom: "6px",
                        }}
                      >
                        Base Color & Tone
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input
                          type="color"
                          value={customThemeDraft.bgColor || "#090d16"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomThemeDraft((prev) => ({
                              ...prev,
                              bgColor: val,
                              bgGradient: `linear-gradient(135deg, ${val} 0%, #1e1b4b 50%, #000000 100%)`,
                            }));
                          }}
                          style={{
                            width: "36px",
                            height: "32px",
                            padding: 0,
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            background: "none",
                            cursor: "pointer",
                          }}
                        />
                        <input
                          type="text"
                          value={customThemeDraft.bgColor || "#090d16"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomThemeDraft((prev) => ({ ...prev, bgColor: val }));
                          }}
                          style={{
                            flex: 1,
                            padding: "5px 8px",
                            background: "rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "6px",
                            color: "#ffffff",
                            fontSize: "11px",
                          }}
                        />
                      </div>

                      {/* Quick Color Swatches */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginTop: "8px",
                        }}
                      >
                        {[
                          { name: "Obsidian", color: "#090d16" },
                          { name: "Candlelight", color: "#14110b" },
                          { name: "Ocean", color: "#04161f" },
                          { name: "Ruby", color: "#1a050d" },
                          { name: "Amethyst", color: "#170629" },
                          { name: "Emerald", color: "#031411" },
                          { name: "Black", color: "#000000" },
                        ].map((sw) => (
                          <button
                            key={sw.name}
                            onClick={() => {
                              setCustomThemeDraft((prev) => ({
                                ...prev,
                                bgColor: sw.color,
                                bgGradient: `linear-gradient(135deg, ${sw.color} 0%, #1e1b4b 60%, #000000 100%)`,
                              }));
                            }}
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background: sw.color,
                              border:
                                customThemeDraft.bgColor === sw.color
                                  ? "2px solid #38bdf8"
                                  : "1px solid rgba(255, 255, 255, 0.2)",
                              cursor: "pointer",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
                            }}
                            title={sw.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Pattern Selector (when pattern or gradient mode is chosen) */}
                    {(customThemeDraft.bgType === "pattern" ||
                      customThemeDraft.bgType === "gradient" ||
                      customThemeDraft.bgType === "animated-gradient") && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "6px",
                          }}
                        >
                          <label
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#94a3b8",
                            }}
                          >
                            Geometric / Sacred Pattern
                          </label>
                          <span style={{ fontSize: "10px", color: "#38bdf8" }}>
                            {getPatternById(customThemeDraft.bgPattern || "")?.name || "None"}
                          </span>
                        </div>

                        {/* Pattern Buttons Grid */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "5px",
                          }}
                        >
                          {PATTERN_PRESETS.map((pat) => {
                            const isPatActive = customThemeDraft.bgPattern === pat.id;
                            return (
                              <button
                                key={pat.id}
                                onClick={() => {
                                  setCustomThemeDraft((prev) => ({
                                    ...prev,
                                    bgPattern: pat.id,
                                    bgPatternColor: prev.bgPatternColor || pat.defaultColor,
                                    bgPatternOpacity: pat.defaultOpacity,
                                  }));
                                }}
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: "6px",
                                  background: isPatActive
                                    ? "rgba(56, 189, 248, 0.15)"
                                    : "rgba(255, 255, 255, 0.03)",
                                  color: isPatActive ? "#38bdf8" : "#cbd5e1",
                                  border: isPatActive
                                    ? "1px solid #38bdf8"
                                    : "1px solid rgba(255, 255, 255, 0.08)",
                                  fontSize: "10px",
                                  fontWeight: isPatActive ? 700 : 500,
                                  textAlign: "left",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: isPatActive ? "#38bdf8" : "rgba(255,255,255,0.3)",
                                  }}
                                />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {pat.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Pattern Opacity Slider */}
                        <div style={{ marginTop: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "10px",
                              color: "#94a3b8",
                              marginBottom: "3px",
                            }}
                          >
                            <span>Pattern Opacity</span>
                            <span>{Math.round((customThemeDraft.bgPatternOpacity ?? 0.2) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.05"
                            max="0.6"
                            step="0.02"
                            value={customThemeDraft.bgPatternOpacity ?? 0.2}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCustomThemeDraft((prev) => ({ ...prev, bgPatternOpacity: val }));
                            }}
                            style={{ width: "100%", accentColor: "#38bdf8" }}
                          />
                        </div>

                        {/* Pattern Scale Slider */}
                        <div style={{ marginTop: "6px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "10px",
                              color: "#94a3b8",
                              marginBottom: "3px",
                            }}
                          >
                            <span>Pattern Scale</span>
                            <span>{(customThemeDraft.bgPatternScale ?? 1).toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="2.0"
                            step="0.1"
                            value={customThemeDraft.bgPatternScale ?? 1}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setCustomThemeDraft((prev) => ({ ...prev, bgPatternScale: val }));
                            }}
                            style={{ width: "100%", accentColor: "#38bdf8" }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Mode Settings */}
                    {customThemeDraft.bgType === "image" && (
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            marginBottom: "6px",
                          }}
                        >
                          Background Image
                        </label>
                        <button
                          onClick={() => bgImageInputRef.current?.click()}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: "6px",
                            background: "rgba(168, 85, 247, 0.12)",
                            border: "1px dashed rgba(168, 85, 247, 0.4)",
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <Image size={13} />
                          <span>Choose New Image File</span>
                        </button>

                        {/* Recent Uploaded Backgrounds */}
                        {customBackgrounds.length > 0 && (
                          <div style={{ marginTop: "8px" }}>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "#94a3b8",
                                marginBottom: "4px",
                              }}
                            >
                              Recent Imported Backgrounds:
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                overflowX: "auto",
                                paddingBottom: "4px",
                              }}
                            >
                              {customBackgrounds.map((bgUrl, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setCustomThemeDraft((prev) => ({
                                      ...prev,
                                      bgType: "image",
                                      bgImage: bgUrl,
                                    }))
                                  }
                                  style={{
                                    width: "48px",
                                    height: "30px",
                                    borderRadius: "4px",
                                    backgroundImage: `url(${bgUrl})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    border:
                                      customThemeDraft.bgImage === bgUrl
                                        ? "2px solid #38bdf8"
                                        : "1px solid rgba(255, 255, 255, 0.2)",
                                    cursor: "pointer",
                                    flexShrink: 0,
                                  }}
                                  title="Use this background image"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Typography Settings */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          marginBottom: "6px",
                        }}
                      >
                        Display Font Family
                      </label>
                      <select
                        value={customThemeDraft.fontFamily || "Montserrat, sans-serif"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomThemeDraft((prev) => ({ ...prev, fontFamily: val }));
                        }}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          background: "rgba(0, 0, 0, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "6px",
                          color: "#ffffff",
                          fontSize: "11px",
                          outline: "none",
                        }}
                      >
                        <option value="Montserrat, sans-serif">Montserrat (Modern Sans)</option>
                        <option value="Playfair Display, serif">Playfair Display (Elegant Serif)</option>
                        <option value="Cinzel, serif">Cinzel (Sacred Classical)</option>
                        <option value="Outfit, sans-serif">Outfit (Clean Geometric)</option>
                        <option value="Inter, sans-serif">Inter (High-Legibility)</option>
                        <option value="Oswald, sans-serif">Oswald (Bold Impact)</option>
                        <option value='Georgia, "Playfair Display", serif'>Georgia (Traditional Serif)</option>
                      </select>
                    </div>

                    {/* Text Colors */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            marginBottom: "3px",
                          }}
                        >
                          Text Color
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="color"
                            value={customThemeDraft.textColor || "#ffffff"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomThemeDraft((prev) => ({ ...prev, textColor: val }));
                            }}
                            style={{
                              width: "28px",
                              height: "26px",
                              padding: 0,
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,0.2)",
                              background: "none",
                              cursor: "pointer",
                            }}
                          />
                          <span style={{ fontSize: "10px", color: "#cbd5e1" }}>
                            {customThemeDraft.textColor || "#ffffff"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#94a3b8",
                            marginBottom: "3px",
                          }}
                        >
                          Accent Color
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="color"
                            value={customThemeDraft.accentColor || "#38bdf8"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomThemeDraft((prev) => ({ ...prev, accentColor: val }));
                            }}
                            style={{
                              width: "28px",
                              height: "26px",
                              padding: 0,
                              borderRadius: "4px",
                              border: "1px solid rgba(255,255,255,0.2)",
                              background: "none",
                              cursor: "pointer",
                            }}
                          />
                          <span style={{ fontSize: "10px", color: "#cbd5e1" }}>
                            {customThemeDraft.accentColor || "#38bdf8"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Studio Actions Footer */}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(0, 0, 0, 0.4)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() => handleApplyTheme(customThemeDraft, customThemeDraftName)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        boxShadow: "0 0 14px rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      <Play size={12} fill="#ffffff" />
                      <span>Apply Directly to Live & Display</span>
                    </button>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={handleSaveCustomDraft}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          color: "#38bdf8",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Save to Library
                      </button>

                      <button
                        onClick={() => handlePreviewTheme(customThemeDraft, customThemeDraftName)}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          color: "#cbd5e1",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Preview Upper
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Item Editor Modal (Add & Edit Custom/Prayer/Ministration/Announcement/Hymn) */}
      <ScheduleItemEditorModal
        isOpen={isScheduleEditorOpen}
        onClose={() => setIsScheduleEditorOpen(false)}
        initialItem={editingScheduleItem}
        defaultCategory={scheduleModalDefaultCategory}
        onSave={handleSaveScheduleEditorItem}
        onSaveAndGoLive={handleScheduleEditorGoLive}
      />
    </div>
  );
};
