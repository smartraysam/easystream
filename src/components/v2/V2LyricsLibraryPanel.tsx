import React from "react";
import {
  Music,
  Plus,
  HardDrive,
  Globe,
  Sparkles,
  Loader2,
  Check,
  Edit,
  Radio,
  Trash2,
  Bookmark,
  ListPlus,
} from "lucide-react";
import { AppState } from "../../types";
import { OnlineSongResult } from "./types";

interface V2LyricsLibraryPanelProps {
  lyricsScope: "all" | "local" | "online";
  setLyricsScope: (scope: "all" | "local" | "online") => void;
  lyricsLoading: boolean;
  combinedSongResults: OnlineSongResult[];
  selectedSong: OnlineSongResult | null;
  state: AppState;
  onSelectSong: (song: OnlineSongResult, autoGoLive?: boolean) => void;
  onOpenAddSong: () => void;
  onOpenEditSong: (song: OnlineSongResult) => void;
  onSaveSongToLibrary: (song: OnlineSongResult) => void;
  onSaveAndSendToLive: (song: OnlineSongResult) => void;
  onAddSongToSchedule: (song: OnlineSongResult) => void;
  onDeleteLibraryItem?: (id: string) => void;
}

export const V2LyricsLibraryPanel: React.FC<V2LyricsLibraryPanelProps> = ({
  lyricsScope,
  setLyricsScope,
  lyricsLoading,
  combinedSongResults,
  selectedSong,
  state,
  onSelectSong,
  onOpenAddSong,
  onOpenEditSong,
  onSaveSongToLibrary,
  onSaveAndSendToLive,
  onAddSongToSchedule,
  onDeleteLibraryItem,
}) => {
  return (
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onOpenAddSong}
            style={{
              padding: "4px 9px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
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
                    lyricsScope === scope.id ? "#8b5cf6" : "transparent",
                  color: lyricsScope === scope.id ? "#ffffff" : "#94a3b8",
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
              onClick={onOpenAddSong}
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
              state.title?.toLowerCase() === song.trackName.toLowerCase() &&
              !state.liveState.isBlackout;

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
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
                            onOpenEditSong(song);
                          }}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSong(song, true);
                          }}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                          title="Send live directly"
                        >
                          <Radio size={10} /> Live
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
                              border: "1px solid rgba(239, 68, 68, 0.25)",
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
                            onSaveSongToLibrary(song);
                          }}
                          style={{
                            padding: "3px 7px",
                            borderRadius: "5px",
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
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
                            onOpenEditSong(song);
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSaveAndSendToLive(song);
                          }}
                          style={{
                            padding: "3px 6px",
                            borderRadius: "5px",
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#f87171",
                            fontSize: "10px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                          }}
                          title="Save to bank & send live to screen directly"
                        >
                          <Radio size={10} /> Live
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
                        onAddSongToSchedule(song);
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
  );
};

