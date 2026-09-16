import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  BookOpen,
  Play,
  ListPlus,
  BookmarkPlus,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Sparkles,
  Layers,
  Tv,
  ExternalLink,
  Sliders,
  CheckCheck,
} from "lucide-react";
import { LibraryItem } from "../types";
import {
  BIBLE_BOOKS,
  getBibleSuggestions,
  findBestBookMatch,
  BibleBook,
  BibleSuggestion,
} from "../data/bibleBooks";

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

const AVAILABLE_BIBLE_VERSIONS = [
  { id: "KJV", name: "King James Version", category: "Classic" },
  { id: "NKJV", name: "New King James Version", category: "Modern" },
  { id: "NIV", name: "New International Version", category: "Modern" },
  { id: "ESV", name: "English Standard Version", category: "Modern" },
  { id: "NLT", name: "New Living Translation", category: "Modern" },
  { id: "NASB", name: "New American Standard", category: "Modern" },
  { id: "WEB", name: "World English Bible", category: "Public" },
  { id: "ASV", name: "American Standard Version", category: "Classic" },
  { id: "AMP", name: "Amplified Bible", category: "Study" },
  { id: "RSV", name: "Revised Standard Version", category: "Classic" },
  { id: "MSG", name: "The Message", category: "Paraphrase" },
  { id: "BBE", name: "Bible in Basic English", category: "Basic" },
  { id: "DARBY", name: "Darby Bible", category: "Classic" },
  { id: "DRA", name: "Douay-Rheims", category: "Catholic" },
  { id: "YLT", name: "Young's Literal Translation", category: "Literal" },
  { id: "CSB", name: "Christian Standard Bible", category: "Modern" },
  { id: "NIRV", name: "New International Reader's Version", category: "Modern" },
  { id: "BSB", name: "Berean Standard Bible", category: "Study" },
  { id: "TLV", name: "Tree of Life Version", category: "Messianic" },
  { id: "CEB", name: "Common English Bible", category: "Modern" },
];

const POPULAR_SCRIPTURES = [
  { label: "John 3:16", query: "John 3:16", tag: "Salvation" },
  { label: "Psalm 23:1", query: "Psalm 23:1", tag: "Comfort" },
  { label: "Romans 8:28", query: "Romans 8:28", tag: "Assurance" },
  { label: "Philippians 4:6", query: "Philippians 4:6", tag: "Peace" },
  { label: "1 Cor 13:4", query: "1 Cor 13:4", tag: "Love" },
  { label: "Isaiah 40:31", query: "Isaiah 40:31", tag: "Strength" },
  { label: "Proverbs 3:5", query: "Proverbs 3:5", tag: "Trust" },
  { label: "Matthew 28:19", query: "Matthew 28:19", tag: "Commission" },
  { label: "Ephesians 6:10", query: "Ephesians 6:10", tag: "Armor" },
  { label: "Hebrews 11:1", query: "Hebrews 11:1", tag: "Faith" },
];

interface ScriptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  library?: LibraryItem[];
  onSaveLibraryItem: (item: LibraryItem) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
  initialQuery?: string;
}

export const ScriptureModal: React.FC<ScriptureModalProps> = ({
  isOpen,
  onClose,
  library = [],
  onSaveLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedVersion, setSelectedVersion] = useState("KJV");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnlineScriptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<"verse" | "double" | "full">(
    "verse",
  );
  const [includeReferenceOnSlide, setIncludeReferenceOnSlide] = useState(true);

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Active slide preview index
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Book browser drawer state
  const [showBookBrowser, setShowBookBrowser] = useState(false);
  const [selectedBookForBrowser, setSelectedBookForBrowser] =
    useState<BibleBook | null>(null);

  // Feedback states
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [liveFeedback, setLiveFeedback] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(false);

  // Focus on mount/open
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
        executeSearch(initialQuery, selectedVersion);
      }
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (showSuggestions) {
          setShowSuggestions(false);
        } else if (showBookBrowser) {
          setShowBookBrowser(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showSuggestions, showBookBrowser, onClose]);

  // Suggestions computation
  const suggestions: BibleSuggestion[] = useMemo(() => {
    if (!query.trim() || !showSuggestions) return [];
    return getBibleSuggestions(query, selectedVersion);
  }, [query, showSuggestions, selectedVersion]);

  // Helper to set query and focus cursor at end
  const updateQueryAndFocusEnd = (newVal: string) => {
    setQuery(newVal);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = newVal.length;
        inputRef.current.setSelectionRange(len, len);
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

  // Format raw verses into slides based on current split mode and reference setting
  const formatSlidesFromData = (
    res: OnlineScriptureResult,
    mode: "verse" | "double" | "full" = splitMode,
    withRef: boolean = includeReferenceOnSlide,
  ): string[] => {
    if (!res || !res.verses || res.verses.length === 0) return [];

    const bookChapterMatch = res.reference.match(
      /^([\d\s]*[A-Za-z\s]+?\s*\d+)/,
    );
    const baseBookChapter = bookChapterMatch
      ? bookChapterMatch[1].trim()
      : res.reference;

    if (mode === "full") {
      const refHeader = `${res.reference}`;
      const text = res.verses.map((v) => `${v.verse} ${v.text}`).join("\n\n");
      return [withRef ? `${text}\n\n${refHeader}` : text];
    }

    if (mode === "double") {
      const slides: string[] = [];
      for (let i = 0; i < res.verses.length; i += 2) {
        const pair = res.verses.slice(i, i + 2);
        const pairRef =
          pair.length === 1
            ? `${baseBookChapter}:${pair[0].verse}`
            : `${baseBookChapter}:${pair[0].verse}-${pair[1].verse}`;
        const text = pair.map((v) => `${v.verse} ${v.text}`).join("\n\n");
        slides.push(withRef ? `${text}\n\n${pairRef}` : text);
      }
      return slides;
    }

    // Default 'verse': Exactly 1 verse per slide
    return res.verses.map((v) => {
      const cleanVerse = v.text.replace(/^\d+[\s:.]\s*/, "").trim();
      const verseRef =
        res.verses.length === 1
          ? res.reference
          : `${baseBookChapter}:${v.verse}`;
      return withRef ? `${cleanVerse}\n\n${verseRef}` : cleanVerse;
    });
  };

  const createLibraryItemFromResult = (
    res: OnlineScriptureResult | null = result,
    mode = splitMode,
    withRef = includeReferenceOnSlide,
  ): LibraryItem | null => {
    if (!res || !res.verses || res.verses.length === 0) return null;
    const slides = formatSlidesFromData(res, mode, withRef);
    if (slides.length === 0) return null;
    return {
      id: `scripture-${Date.now()}`,
      title: `${res.reference} (${res.version})`,
      category: "scripture",
      author: res.versionName || res.version,
      content: res.plainContent,
      lines: slides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Search API execution (default sends verse to display)
  const executeSearch = async (
    searchQuery: string,
    versionOverride?: string,
    goLiveOnSuccess = true,
  ) => {
    let raw = searchQuery.trim();
    setShowSuggestions(false);
    if (!raw) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Normalize spaced verse: e.g. "John 3 16" -> "John 3:16", "1 Cor 13 4" -> "1 Cor 13:4"
    raw = raw.replace(
      /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)\s+(\d+)(.*)$/,
      "$1 $2:$3$4",
    );

    // Auto expand abbreviated book name if needed (e.g. "1co 13:4" -> "1 Corinthians 13:4")
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
        setQuery(raw);
      }
    }

    if (!hasChapterNumber(raw)) {
      setLoading(false);
      setResult(null);
      setError(
        `Please include a chapter number (e.g. "${raw} 1" or "${raw} 3:16").`,
      );
      setShowSuggestions(true);
      return;
    }

    // Check if query contains an embedded Bible version (e.g. "john 3:16 NIV", "romans 8:28 KJV")
    const versionCodes = AVAILABLE_BIBLE_VERSIONS.map((v) => v.id);
    const versionRegex = new RegExp(
      `[\\s,\\(-]+(${versionCodes.join("|")})[\\)\\s]*$`,
      "i",
    );
    const match = raw.match(versionRegex);

    let activeVersion = versionOverride || selectedVersion;
    if (match) {
      const detected = match[1].toUpperCase();
      const validVer = AVAILABLE_BIBLE_VERSIONS.find(
        (v) => v.id.toUpperCase() === detected,
      );
      if (validVer) {
        activeVersion = validVer.id;
        setSelectedVersion(validVer.id);
      }
    }

    setLoading(true);
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const url = `${apiBase}/api/scripture/search?q=${encodeURIComponent(raw)}&version=${encodeURIComponent(activeVersion)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setResult(null);
      } else if (data.verses && data.verses.length > 0) {
        setResult(data);
        setError(null);
        const item = createLibraryItemFromResult(
          data,
          splitMode,
          includeReferenceOnSlide,
        );
        if (item) {
          onSaveLibraryItem(item);
          if (goLiveOnSuccess) {
            onGoLiveWithItem(item);
            setLiveFeedback(true);
            setTimeout(() => setLiveFeedback(false), 2500);
          }
        }
      } else {
        setError(`No verses found for "${raw}" in ${activeVersion}.`);
        setResult(null);
      }
    } catch (err: any) {
      setError(`Failed to fetch scripture: ${err?.message || "Network error"}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVersion = (verId: string) => {
    setSelectedVersion(verId);
    if (query && hasChapterNumber(query)) {
      executeSearch(query, verId, true);
    }
  };

  const handleSelectSuggestion = (sug: BibleSuggestion) => {
    if (sug.type === "book") {
      updateQueryAndFocusEnd(`${sug.text} `);
    } else if (sug.type === "chapter") {
      updateQueryAndFocusEnd(`${sug.text}:`);
    } else if (sug.type === "verse" || sug.type === "version") {
      setQuery(sug.text);
      setShowSuggestions(false);
      executeSearch(sug.text, selectedVersion, true);
    } else {
      updateQueryAndFocusEnd(sug.text);
    }
  };

  // Convert raw verses to slides based on split mode (Default: 1 verse per slide)
  const generatedSlides = useMemo(() => {
    return result
      ? formatSlidesFromData(result, splitMode, includeReferenceOnSlide)
      : [];
  }, [result, splitMode, includeReferenceOnSlide]);

  const handleGoLive = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onGoLiveWithItem(item);
    setLiveFeedback(true);
    setTimeout(() => setLiveFeedback(false), 2500);
  };

  const handleAddToSchedule = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onAddToSchedule(item);
    setScheduleFeedback(true);
    setTimeout(() => setScheduleFeedback(false), 2500);
  };

  const handleSaveToLibrary = () => {
    const item = createLibraryItemFromResult();
    if (!item) return;
    onSaveLibraryItem(item);
    setSavedFeedback("Saved to Library");
    setTimeout(() => setSavedFeedback(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(5, 8, 20, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content studio-panel"
        style={{
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, #111827 0%, #0b0f19 100%)",
          borderRadius: "16px",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #10b981, #0284c7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)",
              }}
            >
              <BookOpen size={20} color="#ffffff" />
            </div>
            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#ffffff",
                  }}
                >
                  Scripture Presenter & Bible Search
                </h2>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#34d399",
                    borderRadius: "999px",
                    fontWeight: 700,
                  }}
                >
                  LIVE BIBLE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                Search any book, chapter, or verse across multiple translations
                and project live in seconds
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="btn"
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                background: showBookBrowser
                  ? "rgba(56, 189, 248, 0.2)"
                  : "rgba(255, 255, 255, 0.06)",
                borderColor: showBookBrowser
                  ? "#38bdf8"
                  : "rgba(255, 255, 255, 0.12)",
                color: showBookBrowser ? "#38bdf8" : "#e2e8f0",
              }}
              onClick={() => setShowBookBrowser(!showBookBrowser)}
            >
              <BookMarked size={14} />
              {showBookBrowser ? "Hide Books" : "Browse 66 Books"}
            </button>

            <button
              className="btn"
              style={{
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                color: "#94a3b8",
              }}
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar + Translation Selector Controls */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "rgba(0, 0, 0, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              position: "relative",
            }}
          >
            {/* Input with Auto-complete */}
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                color="#38bdf8"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;

                  // 1. Auto-insert colon if user typed space after chapter number (e.g. "John 3 " -> "John 3:")
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

                  // 2. Auto-normalize book name if colon is typed directly after chapter (e.g. "joh 3:" -> "John 3:")
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

                  setQuery(val);
                  if (val.trim().length > 0) {
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (query.trim().length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  // Tab or Space completion
                  if (e.key === "Tab" || e.key === " ") {
                    const trimmed = query.trim();

                    // A. Book-only match: e.g. "joh", "1co", "matt" -> complete to full book + trailing space
                    const bookOnlyMatch = trimmed.match(
                      /^([1-3]?\s*[a-zA-Z]+)$/,
                    );
                    if (bookOnlyMatch) {
                      const matchedBook = findBestBookMatch(trimmed);
                      if (matchedBook) {
                        e.preventDefault();
                        updateQueryAndFocusEnd(`${matchedBook.name} `);
                        return;
                      }
                    }

                    // B. Book + Chapter match without colon: e.g. "John 3", "joh 3" -> complete book and add ":"
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
                      updateQueryAndFocusEnd(`${canonicalBook} ${chapterPart}:`);
                      return;
                    }

                    // C. Suggestion navigation completion with Tab
                    if (
                      e.key === "Tab" &&
                      showSuggestions &&
                      suggestions.length > 0
                    ) {
                      e.preventDefault();
                      const targetSug =
                        activeSuggestionIndex >= 0
                          ? suggestions[activeSuggestionIndex]
                          : suggestions[0];
                      handleSelectSuggestion(targetSug);
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
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (activeSuggestionIndex >= 0) {
                        handleSelectSuggestion(
                          suggestions[activeSuggestionIndex],
                        );
                      } else {
                        setShowSuggestions(false);
                        executeSearch(query, selectedVersion);
                      }
                      return;
                    }
                    if (e.key === "Escape") {
                      setShowSuggestions(false);
                      return;
                    }
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    executeSearch(query, selectedVersion);
                  }
                }}
                placeholder="Search scripture reference e.g., 'John 3:16', 'Psalm 23', 'Romans 8:28-39' or 'Gen 1:1'..."
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 42px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  outline: "none",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4)",
                }}
              />

              {loading && (
                <div
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <Loader2
                    size={16}
                    color="#38bdf8"
                    className="spin-animation"
                  />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "#0f172a",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "10px",
                    boxShadow: "0 15px 35px rgba(0, 0, 0, 0.8)",
                    zIndex: 100,
                    overflow: "hidden",
                  }}
                >
                  {suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background:
                          idx === activeSuggestionIndex
                            ? "rgba(56, 189, 248, 0.15)"
                            : "transparent",
                        borderBottom:
                          idx < suggestions.length - 1
                            ? "1px solid rgba(255, 255, 255, 0.05)"
                            : "none",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectSuggestion(sug);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <BookOpen size={14} color="#38bdf8" />
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#ffffff",
                          }}
                        >
                          {sug.label}
                        </span>
                        {sug.subLabel && (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            • {sug.subLabel}
                          </span>
                        )}
                      </div>
                      {sug.badge && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 6px",
                            background: "rgba(56, 189, 248, 0.15)",
                            color: "#38bdf8",
                            borderRadius: "4px",
                          }}
                        >
                          {sug.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Translation Dropdown */}
            <div style={{ width: "220px" }}>
              <select
                value={selectedVersion}
                onChange={(e) => handleSelectVersion(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: "10px",
                  color: "#38bdf8",
                  fontSize: "14px",
                  fontWeight: 700,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {AVAILABLE_BIBLE_VERSIONS.map((ver) => (
                  <option
                    key={ver.id}
                    value={ver.id}
                    style={{ background: "#0f172a", color: "#ffffff" }}
                  >
                    {ver.id} - {ver.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search & Project Button */}
            <button
              className="btn btn-primary"
              style={{
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 700,
                gap: "8px",
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                boxShadow: "0 0 15px rgba(37, 99, 235, 0.4)",
              }}
              onClick={() => executeSearch(query, selectedVersion, true)}
              disabled={loading || !query.trim()}
              title="Look up and instantly project live to display screen (Enter)"
            >
              <Play size={14} fill="#ffffff" />
              Go Live (Enter)
            </button>
          </div>

          {/* Quick Popular Scripture Chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "2px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              POPULAR:
            </span>
            {POPULAR_SCRIPTURES.map((item, idx) => (
              <button
                key={idx}
                className="btn"
                style={{
                  fontSize: "11px",
                  padding: "3px 8px",
                  background:
                    query === item.query
                      ? "rgba(56, 189, 248, 0.2)"
                      : "rgba(255, 255, 255, 0.04)",
                  borderColor:
                    query === item.query
                      ? "#38bdf8"
                      : "rgba(255, 255, 255, 0.08)",
                  color: query === item.query ? "#38bdf8" : "#cbd5e1",
                  whiteSpace: "nowrap",
                  borderRadius: "999px",
                }}
                onClick={() => {
                  setQuery(item.query);
                  executeSearch(item.query, selectedVersion);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 66 Books Quick Browser Drawer */}
        {showBookBrowser && (
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(15, 23, 42, 0.95)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#38bdf8",
                  textTransform: "uppercase",
                }}
              >
                Select Book & Chapter
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Click any book to quickly load
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                gap: "6px",
              }}
            >
              {BIBLE_BOOKS.map((b) => (
                <button
                  key={b.id}
                  className="btn"
                  style={{
                    fontSize: "11px",
                    padding: "6px 8px",
                    justifyContent: "flex-start",
                    background:
                      selectedBookForBrowser?.id === b.id
                        ? "rgba(56, 189, 248, 0.25)"
                        : "rgba(255, 255, 255, 0.04)",
                    borderColor:
                      selectedBookForBrowser?.id === b.id
                        ? "#38bdf8"
                        : "rgba(255, 255, 255, 0.08)",
                    color: b.testament === "OT" ? "#cbd5e1" : "#38bdf8",
                  }}
                  onClick={() => {
                    setSelectedBookForBrowser(b);
                    setQuery(`${b.name} 1`);
                    executeSearch(`${b.name} 1`, selectedVersion);
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left Column: Passage Content & Slide Cards Sequence */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {error && (
              <div
                style={{
                  padding: "14px 18px",
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "10px",
                  color: "#f87171",
                  fontSize: "13px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {!result && !loading && !error && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#64748b",
                  gap: "12px",
                  padding: "40px 0",
                }}
              >
                <BookOpen size={48} style={{ opacity: 0.3 }} />
                <div style={{ textAlign: "center" }}>
                  <h3
                    style={{
                      margin: "0 0 4px 0",
                      color: "#94a3b8",
                      fontSize: "16px",
                    }}
                  >
                    Ready to Present Scripture
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", maxWidth: "400px" }}>
                    Type a reference above like <strong>John 3:16</strong> or
                    choose from the popular scripture chips.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <>
                {/* Passage Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "#f59e0b",
                        }}
                      >
                        {result.reference}
                      </h3>
                      {result.source === "local" ? (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 7px",
                            background: "rgba(16, 185, 129, 0.18)",
                            border: "1px solid rgba(16, 185, 129, 0.4)",
                            color: "#34d399",
                            borderRadius: "999px",
                            fontWeight: 750,
                            letterSpacing: "0.04em",
                          }}
                        >
                          ⚡ LOCAL
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 7px",
                            background: "rgba(56, 189, 248, 0.15)",
                            border: "1px solid rgba(56, 189, 248, 0.35)",
                            color: "#38bdf8",
                            borderRadius: "999px",
                            fontWeight: 700,
                          }}
                        >
                          🌐 ONLINE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {result.versionName || result.version} •{" "}
                      {result.totalVerses} Verse
                      {result.totalVerses > 1 ? "s" : ""} •{" "}
                      {generatedSlides.length} Slide
                      {generatedSlides.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Split Mode Selector */}
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
                        color: "#64748b",
                        fontWeight: 700,
                      }}
                    >
                      SPLIT:
                    </span>
                    <button
                      className="btn"
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        background:
                          splitMode === "verse"
                            ? "rgba(56, 189, 248, 0.25)"
                            : "rgba(255, 255, 255, 0.04)",
                        borderColor:
                          splitMode === "verse"
                            ? "#38bdf8"
                            : "rgba(255, 255, 255, 0.08)",
                        color: splitMode === "verse" ? "#38bdf8" : "#cbd5e1",
                      }}
                      onClick={() => {
                        setSplitMode("verse");
                        setActiveSlideIndex(0);
                      }}
                      title="1 verse per slide (recommended for big readable display)"
                    >
                      1 Verse/Slide
                    </button>
                    <button
                      className="btn"
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        background:
                          splitMode === "double"
                            ? "rgba(56, 189, 248, 0.25)"
                            : "rgba(255, 255, 255, 0.04)",
                        borderColor:
                          splitMode === "double"
                            ? "#38bdf8"
                            : "rgba(255, 255, 255, 0.08)",
                        color: splitMode === "double" ? "#38bdf8" : "#cbd5e1",
                      }}
                      onClick={() => {
                        setSplitMode("double");
                        setActiveSlideIndex(0);
                      }}
                      title="2 verses per slide"
                    >
                      2 Verses/Slide
                    </button>
                    <button
                      className="btn"
                      style={{
                        fontSize: "11px",
                        padding: "4px 8px",
                        background:
                          splitMode === "full"
                            ? "rgba(56, 189, 248, 0.25)"
                            : "rgba(255, 255, 255, 0.04)",
                        borderColor:
                          splitMode === "full"
                            ? "#38bdf8"
                            : "rgba(255, 255, 255, 0.08)",
                        color: splitMode === "full" ? "#38bdf8" : "#cbd5e1",
                      }}
                      onClick={() => {
                        setSplitMode("full");
                        setActiveSlideIndex(0);
                      }}
                      title="Full passage on single slide"
                    >
                      Full Passage
                    </button>
                  </div>
                </div>

                {/* Generated Slide Preview Cards */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "#38bdf8",
                        textTransform: "uppercase",
                      }}
                    >
                      Presentation Slides ({generatedSlides.length})
                    </span>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "#94a3b8",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={includeReferenceOnSlide}
                        onChange={(e) =>
                          setIncludeReferenceOnSlide(e.target.checked)
                        }
                      />
                      Include reference header on slides
                    </label>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    {generatedSlides.map((slideText, idx) => {
                      const isActive = idx === activeSlideIndex;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveSlideIndex(idx)}
                          style={{
                            background: isActive
                              ? "rgba(56, 189, 248, 0.12)"
                              : "rgba(15, 23, 42, 0.7)",
                            border: isActive
                              ? "1.5px solid #38bdf8"
                              : "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "10px",
                            padding: "14px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "110px",
                            cursor: "pointer",
                            boxShadow: isActive
                              ? "0 0 16px rgba(56, 189, 248, 0.25)"
                              : "0 4px 12px rgba(0, 0, 0, 0.4)",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              lineHeight: 1.5,
                              color: "#ffffff",
                              whiteSpace: "pre-line",
                              fontFamily: "Montserrat, sans-serif",
                            }}
                          >
                            {slideText}
                          </div>
                          <div
                            style={{
                              marginTop: "10px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                              paddingTop: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "10px",
                                color: isActive ? "#38bdf8" : "#64748b",
                                fontWeight: 700,
                              }}
                            >
                              SLIDE {idx + 1} OF {generatedSlides.length}
                              {isActive ? " (SELECTED)" : ""}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                color: "#f59e0b",
                                fontWeight: 700,
                              }}
                            >
                              {result.version}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Live Display Output Preview Monitor */}
          <div
            style={{
              width: "440px",
              flexShrink: 0,
              borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Tv size={16} color="#38bdf8" />
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#ffffff",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Live Display Output
                </span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  background: result
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(100, 116, 139, 0.2)",
                  border: result
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(100, 116, 139, 0.3)",
                  color: result ? "#34d399" : "#94a3b8",
                  borderRadius: "999px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: result ? "#10b981" : "#64748b",
                    boxShadow: result
                      ? "0 0 6px rgba(16, 185, 129, 0.8)"
                      : "none",
                  }}
                />
                {result ? "LIVE ON DISPLAY" : "STANDBY"}
              </span>
            </div>

            {/* 16:9 Display Canvas */}
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                background:
                  "radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)",
                borderRadius: "12px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                boxShadow:
                  "0 15px 30px rgba(0, 0, 0, 0.6), inset 0 0 25px rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "16px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {result && generatedSlides.length > 0 ? (
                <>
                  {/* Top Bar on Screen */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#38bdf8",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {result.reference}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#f59e0b",
                        background: "rgba(245, 158, 11, 0.15)",
                        padding: "1px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {result.version}
                    </span>
                  </div>

                  {/* Main Verse Text */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 600,
                      lineHeight: 1.6,
                      fontFamily: "Montserrat, sans-serif",
                      textShadow: "0 2px 10px rgba(0, 0, 0, 0.9)",
                      whiteSpace: "pre-line",
                      overflowY: "auto",
                      maxHeight: "130px",
                      padding: "4px",
                    }}
                  >
                    {generatedSlides[activeSlideIndex] || generatedSlides[0]}
                  </div>

                  {/* Bottom Bar on Screen */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      paddingTop: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      EasyStream Live Engine
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#94a3b8",
                        fontWeight: 700,
                      }}
                    >
                      SLIDE {activeSlideIndex + 1} OF {generatedSlides.length}
                    </span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#475569",
                    gap: "8px",
                  }}
                >
                  <Tv size={28} style={{ opacity: 0.4 }} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>
                    Display Screen Standby
                  </span>
                </div>
              )}
            </div>

            {/* Slide Transport Controls */}
            {result && generatedSlides.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                }}
              >
                <button
                  className="btn"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: activeSlideIndex <= 0 ? "#475569" : "#e2e8f0",
                  }}
                  disabled={activeSlideIndex <= 0}
                  onClick={() =>
                    setActiveSlideIndex((prev) => Math.max(0, prev - 1))
                  }
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>

                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#38bdf8",
                    }}
                  >
                    Slide {activeSlideIndex + 1} / {generatedSlides.length}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    Click cards to jump
                  </span>
                </div>

                <button
                  className="btn"
                  style={{
                    fontSize: "12px",
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color:
                      activeSlideIndex >= generatedSlides.length - 1
                        ? "#475569"
                        : "#e2e8f0",
                  }}
                  disabled={activeSlideIndex >= generatedSlides.length - 1}
                  onClick={() =>
                    setActiveSlideIndex((prev) =>
                      Math.min(generatedSlides.length - 1, prev + 1),
                    )
                  }
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {savedFeedback && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Check size={14} /> {savedFeedback}
              </span>
            )}
            {liveFeedback && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <CheckCheck size={14} /> Sent to Live Display!
              </span>
            )}
            {scheduleFeedback && (
              <span
                style={{
                  fontSize: "12px",
                  color: "#a78bfa",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Check size={14} /> Added to Service Rundown
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              className="btn"
              style={{
                fontSize: "13px",
                padding: "8px 16px",
                background: "rgba(255, 255, 255, 0.06)",
                color: "#e2e8f0",
              }}
              onClick={handleSaveToLibrary}
              disabled={!result || generatedSlides.length === 0}
              title="Save scripture to local church media library"
            >
              <BookmarkPlus size={15} />
              Save to Library
            </button>

            <button
              className="btn"
              style={{
                fontSize: "13px",
                padding: "8px 16px",
                background: "rgba(167, 139, 250, 0.15)",
                borderColor: "rgba(167, 139, 250, 0.4)",
                color: "#c4b5fd",
                fontWeight: 700,
              }}
              onClick={handleAddToSchedule}
              disabled={!result || generatedSlides.length === 0}
              title="Add this scripture reading to the active service schedule"
            >
              <ListPlus size={15} />+ Add to Schedule
            </button>

            <button
              className="btn btn-primary"
              style={{
                fontSize: "13px",
                padding: "8px 20px",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#ffffff",
                fontWeight: 800,
                border: "none",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.5)",
                gap: "8px",
              }}
              onClick={handleGoLive}
              disabled={!result || generatedSlides.length === 0}
              title="Instantly project this scripture reading live to the congregation & stream"
            >
              <Play size={15} fill="#ffffff" />
              GO LIVE NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
