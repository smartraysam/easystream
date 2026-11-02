import React from "react";
import {
  Search,
  Loader2,
  X,
  HardDrive,
  Globe,
  Plus,
} from "lucide-react";
import { POPULAR_WORSHIP_SONGS, LyricSuggestion } from "../../data/popularWorshipSongs";
import { OnlineSongResult } from "./types";

interface V2LyricsSearchBarProps {
  lyricsQuery: string;
  setLyricsQuery: (query: string) => void;
  lyricsLoading: boolean;
  lyricsScope: "all" | "local" | "online";
  setLyricsScope: (scope: "all" | "local" | "online") => void;
  lyricsSplitMode: "smart" | "smart3" | "stanzas" | "lines";
  setLyricsSplitMode: (mode: "smart" | "smart3" | "stanzas" | "lines") => void;
  showLyricSuggestions: boolean;
  setShowLyricSuggestions: (show: boolean) => void;
  activeLyricIndex: number;
  setActiveLyricIndex: React.Dispatch<React.SetStateAction<number>>;
  lyricSuggestions: LyricSuggestion[];
  combinedSongResults: OnlineSongResult[];
  localSongMatches: OnlineSongResult[];
  onlineSongResults: OnlineSongResult[];
  selectedSong: OnlineSongResult | null;
  lyricSearchInputRef: React.RefObject<HTMLInputElement | null>;
  lyricSuggestionsRef: React.RefObject<HTMLDivElement | null>;
  onSelectSong: (song: OnlineSongResult, autoGoLive?: boolean) => void;
  onSelectLyricSuggestion: (sug: LyricSuggestion) => void;
  onOpenAddSong: () => void;
  onDirectSearchSubmit?: (query: string) => void;
}

export const V2LyricsSearchBar: React.FC<V2LyricsSearchBarProps> = ({
  lyricsQuery,
  setLyricsQuery,
  lyricsLoading,
  lyricsScope,
  setLyricsScope,
  lyricsSplitMode,
  setLyricsSplitMode,
  showLyricSuggestions,
  setShowLyricSuggestions,
  activeLyricIndex,
  setActiveLyricIndex,
  lyricSuggestions,
  combinedSongResults,
  localSongMatches,
  onlineSongResults,
  selectedSong,
  lyricSearchInputRef,
  lyricSuggestionsRef,
  onSelectSong,
  onSelectLyricSuggestion,
  onOpenAddSong,
  onDirectSearchSubmit,
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
                  setShowLyricSuggestions(false);
                  if (
                    activeLyricIndex >= 0 &&
                    activeLyricIndex < lyricSuggestions.length
                  ) {
                    onSelectLyricSuggestion(lyricSuggestions[activeLyricIndex]);
                    return;
                  }

                  if (selectedSong) {
                    onSelectSong(selectedSong, true);
                  } else if (combinedSongResults.length > 0) {
                    onSelectSong(combinedSongResults[0], true);
                  }
                } else if (e.key === "Escape") {
                  setShowLyricSuggestions(false);
                }
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (selectedSong) {
                  onSelectSong(selectedSong, true);
                } else if (combinedSongResults.length > 0) {
                  onSelectSong(combinedSongResults[0], true);
                } else if (lyricsQuery.trim() && onDirectSearchSubmit) {
                  onDirectSearchSubmit(lyricsQuery.trim());
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
                    onClick={() => onSelectLyricSuggestion(sug)}
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
          onClick={onOpenAddSong}
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
  );
};

