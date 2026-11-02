import React from "react";
import { Search } from "lucide-react";
import { BibleBook } from "../../data/bibleBooks";
import { OnlineScriptureResult } from "./types";

interface V2ScriptureNavigatorProps {
  testamentFilter: "ALL" | "OT" | "NT";
  setTestamentFilter: (filter: "ALL" | "OT" | "NT") => void;
  bookSearchText: string;
  setBookSearchText: (text: string) => void;
  filteredBooks: BibleBook[];
  selectedBook: BibleBook;
  selectedChapter: number | null;
  selectedVerseNumber: number | null;
  scriptureResult: OnlineScriptureResult | null;
  onSelectBook: (book: BibleBook) => void;
  onSelectChapter: (chapter: number) => void;
  onSelectVerse: (verse: number | null) => void;
}

export const V2ScriptureNavigator: React.FC<V2ScriptureNavigatorProps> = ({
  testamentFilter,
  setTestamentFilter,
  bookSearchText,
  setBookSearchText,
  filteredBooks,
  selectedBook,
  selectedChapter,
  selectedVerseNumber,
  scriptureResult,
  onSelectBook,
  onSelectChapter,
  onSelectVerse,
}) => {
  return (
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
                  transition: "all 0.12s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Quick Book Search input */}
          <div style={{ position: "relative" }}>
            <Search
              size={12}
              color="#64748b"
              style={{
                position: "absolute",
                left: "8px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
            <input
              type="text"
              placeholder="Filter books (e.g. Rom, Joh)..."
              value={bookSearchText}
              onChange={(e) => setBookSearchText(e.target.value)}
              style={{
                width: "100%",
                padding: "4px 8px 4px 26px",
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "4px",
                color: "#ffffff",
                fontSize: "11px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Books Scrollable List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {filteredBooks.map((book) => {
            const isSelected = selectedBook?.name === book.name;
            return (
              <button
                key={book.name}
                onClick={() => onSelectBook(book)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: isSelected
                    ? "rgba(56, 189, 248, 0.2)"
                    : "transparent",
                  border: isSelected
                    ? "1px solid rgba(56, 189, 248, 0.5)"
                    : "1px solid transparent",
                  color: isSelected ? "#38bdf8" : "#cbd5e1",
                  fontSize: "12px",
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.1s",
                }}
              >
                <span>{book.name}</span>
                <span
                  style={{
                    fontSize: "10px",
                    color: isSelected ? "#38bdf8" : "#64748b",
                    fontWeight: 700,
                  }}
                >
                  {book.chapters} ch
                </span>
              </button>
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
                onClick={() => onSelectChapter(ch)}
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
              {selectedChapter
                ? `Ch. ${selectedChapter} (${scriptureResult?.totalVerses || "..."})`
                : "Select a chapter"}
            </span>
            <button
              onClick={() => onSelectVerse(null)}
              disabled={!selectedChapter}
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
                background:
                  selectedChapter && selectedVerseNumber === null
                    ? "#38bdf8"
                    : "rgba(255, 255, 255, 0.06)",
                color:
                  selectedChapter && selectedVerseNumber === null
                    ? "#000000"
                    : selectedChapter
                    ? "#38bdf8"
                    : "#64748b",
                border: "none",
                cursor: selectedChapter ? "pointer" : "default",
                opacity: selectedChapter ? 1 : 0.5,
              }}
            >
              ALL
            </button>
          </div>
        </div>

        <div
          id="quickdeck-verses-container"
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
          {!selectedChapter ? (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "24px 8px",
                textAlign: "center",
                color: "#64748b",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Select a chapter to choose verse
            </div>
          ) : scriptureResult &&
            scriptureResult.verses &&
            scriptureResult.verses.length > 0 ? (
            scriptureResult.verses.map((v) => {
              const isSelected = selectedVerseNumber === v.verse;
              return (
                <button
                  key={v.verse}
                  id={`quickdeck-verse-${v.verse}`}
                  onClick={() => onSelectVerse(v.verse)}
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
          ) : (
            Array.from({ length: 25 }, (_, i) => i + 1).map((v) => (
              <button
                key={v}
                onClick={() => onSelectVerse(v)}
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
            ))
          )}
        </div>
      </div>
    </>
  );
};

