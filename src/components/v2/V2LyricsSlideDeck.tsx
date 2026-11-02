import React from "react";
import {
  Music,
  Bookmark,
  Radio,
  Check,
  Edit,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { AppState, LiveState } from "../../types";
import { OnlineSongResult } from "./types";

interface V2LyricsSlideDeckProps {
  selectedSong: OnlineSongResult | null;
  lyricSlides: string[];
  selectedLyricSlideIndex: number;
  setSelectedLyricSlideIndex: (idx: number) => void;
  isSelectedSongSaved: boolean;
  state: AppState;
  lyricsSplitMode: "smart" | "smart3" | "stanzas" | "lines";
  setLyricsSplitMode: (mode: "smart" | "smart3" | "stanzas" | "lines") => void;
  onSaveSongToLibrary: (song: OnlineSongResult) => void;
  onSaveAndSendToLive: (song: OnlineSongResult) => void;
  onOpenEditSong: (song: OnlineSongResult) => void;
  onOpenFormatModal: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onGoLive: (slideIdx?: number) => void;
  onJumpTo: (idx: number) => void;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onOpenAddSong: () => void;
}

export const V2LyricsSlideDeck: React.FC<V2LyricsSlideDeckProps> = ({
  selectedSong,
  lyricSlides,
  selectedLyricSlideIndex,
  setSelectedLyricSlideIndex,
  isSelectedSongSaved,
  state,
  lyricsSplitMode,
  setLyricsSplitMode,
  onSaveSongToLibrary,
  onSaveAndSendToLive,
  onOpenEditSong,
  onOpenFormatModal,
  onPrevSlide,
  onNextSlide,
  onGoLive,
  onJumpTo,
  onUpdateLiveState,
  onOpenAddSong,
}) => {
  return (
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
                <>
                  <button
                    onClick={() => onSaveSongToLibrary(selectedSong)}
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
                  <button
                    onClick={() => onSaveAndSendToLive(selectedSong)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 13px",
                      borderRadius: "8px",
                      background:
                        "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 0 14px rgba(239, 68, 68, 0.45)",
                    }}
                    title="Save this online song to Song Bank with split mode and immediately broadcast live to screen"
                  >
                    <Radio size={14} />
                    <span>Save & Send Live</span>
                  </button>
                </>
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
                onClick={() => onOpenEditSong(selectedSong)}
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
            onClick={onOpenFormatModal}
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
              onClick={onPrevSlide}
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
              onClick={onNextSlide}
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
            onClick={() => onGoLive()}
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
              onClick={onOpenAddSong}
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
                  onGoLive(idx);
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
                      onGoLive(idx);
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
  );
};

