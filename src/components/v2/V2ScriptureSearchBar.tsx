import React from "react";
import {
  Search,
  RefreshCw,
  X,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { AVAILABLE_BIBLE_VERSIONS, BibleSuggestion, findBestBookMatch } from "../../data/bibleBooks";
import { POPULAR_SCRIPTURES, OnlineScriptureResult } from "./types";
import { AppState } from "../../types";

interface V2ScriptureSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedVersion: string;
  setSelectedVersion: (version: string) => void;
  splitMode: "verse" | "double" | "full";
  setSplitMode: (mode: "verse" | "double" | "full") => void;
  includeReferenceOnSlide: boolean;
  setIncludeReferenceOnSlide: (val: boolean) => void;
  loading: boolean;
  searchError: string | null;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  activeSuggestionIndex: number;
  setActiveSuggestionIndex: React.Dispatch<React.SetStateAction<number>>;
  suggestions: BibleSuggestion[];
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  suggestionsContainerRef: React.RefObject<HTMLDivElement | null>;
  hasScriptureFocusedRef: React.MutableRefObject<boolean>;
  scriptureResult: OnlineScriptureResult | null;
  selectedVerseNumber: number | null;
  selectedSlideIndex: number;
  state: AppState;
  updateQueryAndFocusEnd: (newVal: string) => void;
  onClearScriptureSearch: () => void;
  onSelectSuggestion: (sug: BibleSuggestion) => void;
  onFetchScripture: (
    queryStr: string,
    version: string,
    autoGoLive?: boolean,
    focusVerseNum?: number | null,
  ) => void;
  setSelectedChapter: (ch: number | null) => void;
  setSelectedVerseNumber: (v: number | null) => void;
  setScriptureResult: (res: OnlineScriptureResult | null) => void;
}

export const V2ScriptureSearchBar: React.FC<V2ScriptureSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedVersion,
  setSelectedVersion,
  splitMode,
  setSplitMode,
  includeReferenceOnSlide,
  setIncludeReferenceOnSlide,
  loading,
  searchError,
  showSuggestions,
  setShowSuggestions,
  activeSuggestionIndex,
  setActiveSuggestionIndex,
  suggestions,
  searchInputRef,
  suggestionsContainerRef,
  hasScriptureFocusedRef,
  scriptureResult,
  selectedVerseNumber,
  selectedSlideIndex,
  state,
  updateQueryAndFocusEnd,
  onClearScriptureSearch,
  onSelectSuggestion,
  onFetchScripture,
  setSelectedChapter,
  setSelectedVerseNumber,
  setScriptureResult,
}) => {
  return (
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

              // A. If completely cleared
              if (!val.trim()) {
                setSearchQuery("");
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                setSelectedChapter(null);
                setSelectedVerseNumber(null);
                setScriptureResult(null);
                return;
              }

              // B. If existing query had book letters and the new value has NO book letters at all
              const hadBookLetters = /[a-zA-Z]/.test(searchQuery);
              const hasNoBookLetters = !/[a-zA-Z]/.test(val);
              if (hadBookLetters && hasNoBookLetters) {
                setSearchQuery("");
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
                setSelectedChapter(null);
                setSelectedVerseNumber(null);
                setScriptureResult(null);
                return;
              }

              // C. Check if user cleared book name and started typing new book name
              const prevRefMatch = searchQuery.match(
                /^([1-3]?\s*[a-zA-Z\s]+?)\s+(\d+)(?::\d+(?:-\d+)?)?$/
              );
              if (prevRefMatch) {
                const prevBook = prevRefMatch[1].trim();
                const prevSuffix = searchQuery.slice(prevBook.length);
                if (
                  prevSuffix &&
                  val.endsWith(prevSuffix) &&
                  val.length > prevSuffix.length
                ) {
                  const newBookCandidate = val
                    .slice(0, val.length - prevSuffix.length)
                    .trim();
                  if (
                    newBookCandidate.toLowerCase() !== prevBook.toLowerCase()
                  ) {
                    setSelectedChapter(null);
                    setSelectedVerseNumber(null);
                    setScriptureResult(null);
                    setSearchQuery(newBookCandidate);
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                    return;
                  }
                }
              }

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

              // 2. Spaced verse auto-format without trailing space
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

              // 3. Auto-insert "-" if user typed space after verse number
              const trailingSpaceAfterVerse = val.match(
                /^([1-3]?\s*[a-zA-Z\s]+?\s+\d+:\d+)\s+$/,
              );
              if (trailingSpaceAfterVerse) {
                updateQueryAndFocusEnd(`${trailingSpaceAfterVerse[1]}-`);
                return;
              }

              // 4. Auto-insert colon if user typed space after chapter number
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

              // 5. Auto-complete book name on trailing space
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

              // 6. Auto-normalize book name if colon is typed directly after chapter
              const directColonMatch = val.match(
                /^([1-3]?\s*[a-zA-Z\s]+?)\s*(\d+):$/,
              );
              if (directColonMatch) {
                const bookCandidate = directColonMatch[1].trim();
                const chapterNum = directColonMatch[2];
                const matchedBook = findBestBookMatch(bookCandidate);
                if (
                  matchedBook &&
                  matchedBook.name.toLowerCase() !== bookCandidate.toLowerCase()
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
            onFocus={(e) => {
              if (searchQuery.trim().length > 0) {
                setShowSuggestions(true);
                e.currentTarget.select();
              }
            }}
            onMouseUp={(e) => {
              if (!hasScriptureFocusedRef.current) {
                hasScriptureFocusedRef.current = true;
                e.currentTarget.select();
              }
            }}
            onBlur={() => {
              hasScriptureFocusedRef.current = false;
            }}
            onKeyDown={(e) => {
              // Tab or Space completion
              if (e.key === "Tab" || e.key === " ") {
                const trimmed = searchQuery.trim();

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

                const bookVerseMatch = trimmed.match(
                  /^([1-3]?\s*[a-zA-Z\s]+?\s+\d+:\d+)$/,
                );
                if (bookVerseMatch && e.key === " ") {
                  e.preventDefault();
                  updateQueryAndFocusEnd(`${trimmed}-`);
                  return;
                }

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

              // ENTER: GO LIVE
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
                onFetchScripture(targetQuery, selectedVersion, true);
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

          <div
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              zIndex: 2,
            }}
          >
            {loading && (
              <RefreshCw
                size={16}
                color="#38bdf8"
                style={{
                  animation: "spin 1s linear infinite",
                }}
              />
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={onClearScriptureSearch}
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
                  padding: 0,
                }}
                title="Clear scripture search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* LIVE AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
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
                      onSelectSuggestion(sug);
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

              let targetQuery = "";
              if (scriptureResult?.reference) {
                const baseBookChapter =
                  scriptureResult.reference.match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]?.trim() ||
                  scriptureResult.reference;
                targetQuery = selectedVerseNumber
                  ? `${baseBookChapter}:${selectedVerseNumber}`
                  : baseBookChapter;
              } else {
                targetQuery = searchQuery.trim();
              }

              const versionCodes = AVAILABLE_BIBLE_VERSIONS.map((v) => v.id);
              const versionRegex = new RegExp(`[\\s,\\(-]+(${versionCodes.join("|")})[\\)\\s]*$`, "i");
              targetQuery = targetQuery.replace(versionRegex, "").trim();

              if (targetQuery) {
                setSearchQuery(targetQuery);
              }

              const currentVerseNum =
                selectedVerseNumber ??
                scriptureResult?.verses?.[selectedSlideIndex]?.verse ??
                null;

              const isCurrentScriptureLive =
                state.category === "scripture" &&
                Boolean(state.title) &&
                Boolean(targetQuery) &&
                state.title.toLowerCase().includes(
                  targetQuery.split(/[:\s]/)[0].toLowerCase()
                );

              if (targetQuery) {
                onFetchScripture(targetQuery, newVer, isCurrentScriptureLive, currentVerseNum);
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
          onClick={() => onFetchScripture(searchQuery, selectedVersion, true)}
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
              onFetchScripture(p.query, selectedVersion, true);
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
  );
};

