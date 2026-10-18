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
  ListPlus,
} from "lucide-react";
import {
  AppState,
  LiveState,
  LibraryItem,
  PresentationTheme,
  ScheduleItem,
} from "../types";
import { DEFAULT_SCHEDULES } from "../data/defaults";
import {
  BIBLE_BOOKS,
  BibleBook,
  getBibleSuggestions,
  findBestBookMatch,
  BibleSuggestion,
  AVAILABLE_BIBLE_VERSIONS,
} from "../data/bibleBooks";
import { parseLyricsToSlides } from "../utils/lyricParser";
import { OnlineSongResult } from "./V2Presenter";

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
  onAddToSchedule?: (item: LibraryItem) => void;
  onOpenSongEditor?: () => void;
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
  onAddToSchedule,
  onOpenSongEditor,
  splitMode: initialSplitMode,
  includeReferenceOnSlide: initialIncludeRef,
  formatSlidesFromData,
  combinedSongResults,
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
  const [splitMode, setSplitMode] = useState<"verse" | "double" | "full">(
    initialSplitMode || "verse",
  );
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(
    initialIncludeRef !== undefined ? initialIncludeRef : true,
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

  // Compute suggestions as user types
  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!searchQuery.trim() || !showSuggestions) return [];
    return getBibleSuggestions(searchQuery, selectedVersion);
  }, [searchQuery, showSuggestions, selectedVersion]);

  // Close suggestions when clicking outside
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

  // -----------------------------------------------------------------
  // 5. Fetch Scripture Logic (Loads Chapter Verses for Table View)
  // -----------------------------------------------------------------
  const fetchScriptureData = async (
    queryStr: string,
    version: string,
    focusVerse: number | null = null,
    updatePreview = false,
  ) => {
    const raw = queryStr.trim();
    if (!raw) return;

    // Detect chapter and verse
    const verseMatch = raw.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+):(\d+)(.*)$/);
    let chapterQuery = raw;
    let targetVerseNum = focusVerse;
    if (verseMatch) {
      chapterQuery = verseMatch[1].trim(); // "John 3"
      if (targetVerseNum === null) {
        targetVerseNum = parseInt(verseMatch[2], 10);
      }
    }

    setLoading(true);
    setSearchError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(chapterQuery)}&version=${encodeURIComponent(version)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setSearchError(data.error);
        setScriptureResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setScriptureResult(data);
        setSearchError(null);

        if (targetVerseNum !== null) {
          setSelectedVerseNumber(targetVerseNum);
          const foundV = data.verses.find(
            (v: OnlineScriptureVerse) => v.verse === targetVerseNum,
          );
          if (foundV && updatePreview) {
            const cleanText = foundV.text.replace(/^\d+[\s:.]\s*/, "").trim();
            const baseBook =
              data.reference.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]?.trim() ||
              data.reference;
            const refHeader = `${baseBook}:${foundV.verse} (${data.version})`;
            setPreviewItem({
              id: `verse-${foundV.verse}`,
              title: refHeader,
              category: "scripture",
              lines: [`${refHeader}\n\n${cleanText}`],
              cur: 0,
            });
          }
        } else {
          setSelectedVerseNumber(data.verses[0].verse);
        }
      } else {
        setSearchError(`No verses found for "${raw}" in ${version}.`);
      }
    } catch (err: any) {
      setSearchError(err?.message || "Failed to fetch scripture");
    } finally {
      setLoading(false);
    }
  };

  // Initial load: fetch John 3:16 in KJV
  useEffect(() => {
    fetchScriptureData("John 3:16", "KJV", 16, false);
  }, []);

  // -----------------------------------------------------------------
  // 6. Songs Tab State
  // -----------------------------------------------------------------
  const [lyricsQuery, setLyricsQuery] = useState("");
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(null);

  const filteredSongs = useMemo(() => {
    if (!lyricsQuery.trim()) return combinedSongResults;
    const q = lyricsQuery.toLowerCase();
    return combinedSongResults.filter(
      (s) =>
        s.trackName.toLowerCase().includes(q) ||
        (s.artistName && s.artistName.toLowerCase().includes(q)) ||
        (s.plainLyrics && s.plainLyrics.toLowerCase().includes(q)),
    );
  }, [combinedSongResults, lyricsQuery]);

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

  // Global Keyboard listener for Enter key to trigger Go Live
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem, selectedVersion]);

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
            width: "270px",
            minWidth: "240px",
            maxWidth: "310px",
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
            </div>

            {/* Quick Add Schedule Item Button */}
            <button
              onClick={() => {
                const title = prompt("New Schedule Item Title:", "Praise Focus");
                if (title && onAddToSchedule) {
                  onAddToSchedule({
                    id: `item-${Date.now()}`,
                    title,
                    category: "custom",
                    content: title,
                    lines: [title],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  });
                }
              }}
              title="Add Item to Schedule"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "4px",
                color: "#94a3b8",
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
              const catColor =
                item.category === "scripture"
                  ? "#38bdf8"
                  : item.category === "hymn"
                  ? "#f59e0b"
                  : item.category === "song"
                  ? "#a855f7"
                  : "#10b981";

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
                      onSetLines(
                        item.title,
                        item.category === "song" ? "Worship" : "",
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
                    }}
                  >
                    <Tv size={11} color={isSelected ? "#38bdf8" : "#64748b"} />
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
                        {item.category || "custom"}
                      </span>
                      <span style={{ fontSize: "9px", color: "#64748b" }}>•</span>
                      <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                        {item.lines?.length || 1} slide
                        {item.lines?.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
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

          {/* Slide Navigation Thumbnail Ribbon */}
          <div
            style={{
              height: "28px",
              background: "rgba(15, 23, 42, 0.95)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
            }}
          >
            {(previewItem.lines && previewItem.lines.length > 0
              ? previewItem.lines
              : [""]
            ).map((_, idx) => {
              const isSelected = (previewItem.cur || 0) === idx;
              return (
                <div
                  key={idx}
                  onClick={() =>
                    setPreviewItem((prev) => ({ ...prev, cur: idx }))
                  }
                  style={{
                    padding: "2px 8px",
                    borderRadius: "3px",
                    background: isSelected
                      ? "rgba(56, 189, 248, 0.25)"
                      : "rgba(255, 255, 255, 0.06)",
                    border: isSelected
                      ? "1px solid #38bdf8"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    color: isSelected ? "#38bdf8" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  title={`Preview Slide ${idx + 1}`}
                >
                  Slide {idx + 1}
                </div>
              );
            })}
          </div>

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
              }}
            >
              {previewItem.category !== "blank" &&
                previewItem.lines[previewItem.cur || 0] && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
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
                          color: "#38bdf8",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                        }}
                      >
                        {previewItem.title}
                      </span>
                      <div
                        style={{
                          width: "16px",
                          height: "1px",
                          background: "rgba(56, 189, 248, 0.4)",
                        }}
                      />
                    </div>

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
                      “
                      {previewItem.lines[previewItem.cur || 0]
                        ?.split(/\n\s*\n/)
                        .slice(-1)[0]
                        ?.replace(/^[“"']+|[”"']+$/g, "") || ""}
                      ”
                    </div>
                  </div>
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
              Slide {(previewItem.cur || 0) + 1} of{" "}
              {previewItem.lines?.length || 1}
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

          {/* Slide Navigation Thumbnail Ribbon (Live Slide Highlighted in Electric Blue) */}
          <div
            style={{
              height: "28px",
              background: "rgba(15, 23, 42, 0.95)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
            }}
          >
            {(state.lines && state.lines.length > 0 ? state.lines : [""]).map(
              (_, idx) => {
                const isLive = state.cur === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => onJumpTo(idx)}
                    style={{
                      padding: "2px 10px",
                      borderRadius: "3px",
                      background: isLive
                        ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                        : "rgba(255, 255, 255, 0.06)",
                      border: isLive
                        ? "1px solid #60a5fa"
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 800,
                      cursor: "pointer",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      boxShadow: isLive
                        ? "0 0 10px rgba(37, 99, 235, 0.6)"
                        : "none",
                    }}
                    title={`Live Slide ${idx + 1}`}
                  >
                    Slide {idx + 1}
                  </div>
                );
              },
            )}
          </div>

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
              }}
            >
              {!state.liveState.isBlackout &&
                !state.liveState.isClearText &&
                state.lines[state.cur] && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {/* Flanked Scripture Title at Top */}
                    {state.title && (
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
                          {state.title}
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
                      “
                      {state.lines[state.cur]
                        ?.split(/\n\s*\n/)
                        .slice(-1)[0]
                        ?.replace(/^[“"']+|[”"']+$/g, "") || ""}
                      ”
                    </div>
                  </div>
                )}

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
              Slide {state.cur + 1} of {state.lines?.length || 1}
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
                width: "250px",
                minWidth: "220px",
                maxWidth: "270px",
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
                        if (
                          showSuggestions &&
                          activeSuggestionIndex >= 0 &&
                          suggestions[activeSuggestionIndex]
                        ) {
                          e.preventDefault();
                          const chosen = suggestions[activeSuggestionIndex].text;
                          setSearchQuery(chosen);
                          setShowSuggestions(false);
                          fetchScriptureData(chosen, selectedVersion, null, true);
                          return;
                        }
                        setShowSuggestions(false);
                        fetchScriptureData(
                          searchQuery,
                          selectedVersion,
                          null,
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
                              fetchScriptureData(
                                sug.text,
                                selectedVersion,
                                null,
                                true,
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
                        fetchScriptureData(
                          searchQuery,
                          v.id,
                          selectedVerseNumber,
                          true,
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
                      <span style={{ flex: 1 }}>{v.id}</span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>
                        {v.name.slice(0, 14)}
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
                    const isRowSelected = selectedVerseNumber === v.verse;
                    const cleanVerse = v.text
                      .replace(/^\d+[\s:.]\s*/, "")
                      .trim();

                    return (
                      <div
                        key={v.verse}
                        onClick={() => {
                          setSelectedVerseNumber(v.verse);
                          const refStr = `${verseRef} (${selectedVersion})`;
                          setPreviewItem({
                            id: `verse-${v.verse}`,
                            title: refStr,
                            category: "scripture",
                            lines: [`${refStr}\n\n${cleanVerse}`],
                            cur: 0,
                          });
                        }}
                        onDoubleClick={() => {
                          setSelectedVerseNumber(v.verse);
                          const refStr = `${verseRef} (${selectedVersion})`;
                          const slides = [`${refStr}\n\n${cleanVerse}`];
                          setPreviewItem({
                            id: `verse-${v.verse}`,
                            title: refStr,
                            category: "scripture",
                            lines: slides,
                            cur: 0,
                          });
                          onSetLines(
                            refStr,
                            selectedVersion,
                            slides,
                            "scripture",
                          );
                          onJumpTo(0);
                          if (state.liveState.isClearText) {
                            onUpdateLiveState({ isClearText: false });
                          }
                          setLiveFeedback(true);
                          setTimeout(() => setLiveFeedback(false), 2000);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          background: isRowSelected
                            ? "linear-gradient(90deg, rgba(37, 99, 235, 0.28) 0%, rgba(37, 99, 235, 0.12) 100%)"
                            : "transparent",
                          color: isRowSelected ? "#ffffff" : "#cbd5e1",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                          borderLeft: isRowSelected
                            ? "3px solid #38bdf8"
                            : "3px solid transparent",
                          fontSize: "12px",
                          cursor: "pointer",
                          lineHeight: "26px",
                          fontWeight: isRowSelected ? 600 : 400,
                          transition: "background 0.1s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "95px",
                            padding: "2px 12px",
                            flexShrink: 0,
                            whiteSpace: "nowrap",
                            color: isRowSelected ? "#38bdf8" : "#94a3b8",
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
                            fontWeight: isRowSelected ? 700 : 500,
                          }}
                        >
                          {verseRef}
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
            {/* Left Sub-Column: Song Search */}
            <div
              style={{
                width: "250px",
                minWidth: "220px",
                maxWidth: "270px",
                borderRight: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(15, 23, 42, 0.75)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "8px" }}>
                <input
                  type="text"
                  value={lyricsQuery}
                  onChange={(e) => setLyricsQuery(e.target.value)}
                  placeholder="Search worship songs..."
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
              </div>

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
                Worship Songs
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "2px 6px",
                }}
              >
                {filteredSongs.slice(0, 50).map((song) => {
                  const isSelected = selectedSong?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        setSelectedSong(song);
                        const slides = parseLyricsToSlides(
                          song.plainLyrics,
                          "stanza",
                        );
                        setPreviewItem({
                          id: song.id,
                          title: song.trackName,
                          category: "song",
                          lines: slides,
                          cur: 0,
                        });
                      }}
                      onDoubleClick={() => {
                        setSelectedSong(song);
                        const slides = parseLyricsToSlides(
                          song.plainLyrics,
                          "stanza",
                        );
                        setPreviewItem({
                          id: song.id,
                          title: song.trackName,
                          category: "song",
                          lines: slides,
                          cur: 0,
                        });
                        onSetLines(
                          song.trackName,
                          song.artistName || "Worship",
                          slides,
                          "song",
                        );
                        onJumpTo(0);
                        if (state.liveState.isClearText) {
                          onUpdateLiveState({ isClearText: false });
                        }
                        setLiveFeedback(true);
                        setTimeout(() => setLiveFeedback(false), 2000);
                      }}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "4px",
                        background: isSelected
                          ? "rgba(168, 85, 247, 0.18)"
                          : "transparent",
                        color: isSelected ? "#c084fc" : "#cbd5e1",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: isSelected ? 700 : 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {song.trackName}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Song */}
              {onOpenSongEditor && (
                <div
                  style={{
                    padding: "8px",
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

            {/* Right Sub-Column: Song Stanzas Table */}
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
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#0f172a",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#ffffff",
                        }}
                      >
                        {selectedSong.trackName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                        {selectedSong.artistName || "Worship"}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const slides = parseLyricsToSlides(
                          selectedSong.plainLyrics,
                          "stanza",
                        );
                        onSetLines(
                          selectedSong.trackName,
                          selectedSong.artistName || "Worship",
                          slides,
                          "song",
                        );
                        onJumpTo(0);
                      }}
                      style={{
                        padding: "4px 12px",
                        borderRadius: "4px",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: 800,
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Send All Live
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {parseLyricsToSlides(
                        selectedSong.plainLyrics,
                        "stanza",
                      ).map((stanza, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setPreviewItem((prev) => ({
                              ...prev,
                              cur: idx,
                            }));
                          }}
                          onDoubleClick={() => {
                            const slides = parseLyricsToSlides(
                              selectedSong.plainLyrics,
                              "stanza",
                            );
                            onSetLines(
                              selectedSong.trackName,
                              selectedSong.artistName || "Worship",
                              slides,
                              "song",
                            );
                            onJumpTo(idx);
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            background: "rgba(15, 23, 42, 0.8)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            cursor: "pointer",
                            whiteSpace: "pre-line",
                            fontSize: "12px",
                            lineHeight: 1.4,
                            color: "#e2e8f0",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 800,
                              color: "#38bdf8",
                              display: "block",
                              marginBottom: "4px",
                            }}
                          >
                            Slide {idx + 1}
                          </span>
                          {stanza}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  Select a song from the library to view slides
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TABS 3, 4, 5: MEDIA, PRESENTATIONS, THEMES                  */}
        {/* ----------------------------------------------------------- */}
        {activeTab !== "scriptures" && activeTab !== "songs" && (
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
            <div
              style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8" }}
            >
              {activeTab === "media"
                ? "Media Library"
                : activeTab === "presentations"
                ? "Presentations & Slides"
                : "Themes & Layouts"}
            </div>
            <div style={{ fontSize: "12px" }}>
              Ready for broadcast and display output. Use Scriptures and Songs
              for live worship projection.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
