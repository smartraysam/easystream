import React from "react";
import { Tv, ExternalLink } from "lucide-react";
import { AppState } from "../../types";
import { ThemeBackgroundLayer } from "../ThemeBackgroundLayer";
import { parseSlidePayload, getSlideReadableText } from "../../utils/mediaPresentationParser";
import { OnlineScriptureResult, OnlineSongResult } from "./types";

interface V2PreviewMonitorProps {
  state: AppState;
  activeTab: "scripture" | "lyrics";
  generatedSlides: string[];
  selectedSlideIndex: number;
  lyricSlides: string[];
  selectedLyricSlideIndex: number;
  selectedSong: OnlineSongResult | null;
  scriptureResult: OnlineScriptureResult | null;
  currentTimerSec: number;
  formattedCountdown: string;
  isOvertime: boolean;
  isWarning: boolean;
  isCritical: boolean;
  now: number;
  onOpenDisplay: () => void;
}

export const V2PreviewMonitor: React.FC<V2PreviewMonitorProps> = ({
  state,
  activeTab,
  generatedSlides,
  selectedSlideIndex,
  lyricSlides,
  selectedLyricSlideIndex,
  selectedSong,
  scriptureResult,
  currentTimerSec,
  formattedCountdown,
  isOvertime,
  isWarning,
  isCritical,
  now,
  onOpenDisplay,
}) => {
  const activeLiveLine =
    activeTab === "scripture" && state.category !== "scripture"
      ? (generatedSlides[selectedSlideIndex] || state.lines[state.cur] || "")
      : (state.lines[state.cur] ||
         (activeTab === "lyrics"
           ? lyricSlides[selectedLyricSlideIndex]
           : generatedSlides[selectedSlideIndex]) ||
         "");
  const activeLiveSlidePayload = parseSlidePayload(activeLiveLine);
  const isLiveMedia = activeLiveSlidePayload?.kind === "media";
  const isLiveCoverMedia = isLiveMedia && activeLiveSlidePayload?.fitMode === "cover";

  return (
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
          onClick={onOpenDisplay}
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
          padding: isLiveCoverMedia ? 0 : "12px 14px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Real Theme Background Layer in Quick Deck Live Monitor */}
        <ThemeBackgroundLayer
          theme={state.theme}
          isBlackout={state.liveState.isBlackout}
        />

        {/* Top Bar on Screen: Cyan Countdown Timer + Underline (Left) & Real Clock (Right) */}
        {!state.liveState.isBlackout && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              position: "relative",
              zIndex: 3,
              borderBottom:
                isLiveCoverMedia || state.liveState.isClearText || !state.lines[state.cur]
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.08)",
              padding: isLiveCoverMedia ? "10px 14px 4px 14px" : "0 0 4px 0",
              width: "100%",
              boxSizing: "border-box",
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
                flex: isLiveCoverMedia ? undefined : 1,
                minHeight: 0,
                padding: isLiveCoverMedia ? 0 : "4px",
                overflow: "hidden",
                position: isLiveCoverMedia ? "absolute" : "relative",
                inset: isLiveCoverMedia ? 0 : undefined,
                zIndex: isLiveCoverMedia ? 1 : 2,
              }}
            >
              {(() => {
                const rawLine =
                  activeTab === "scripture" && state.category !== "scripture"
                    ? (generatedSlides[selectedSlideIndex] || state.lines[state.cur] || "No content active")
                    : (state.lines[state.cur] ||
                       (activeTab === "lyrics"
                         ? lyricSlides[selectedLyricSlideIndex]
                         : generatedSlides[selectedSlideIndex]) ||
                       "No content active");
                
                const slidePayload = parseSlidePayload(rawLine);
                if (slidePayload?.kind === 'media') {
                  const isCover = slidePayload.fitMode === 'cover';
                  return (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: isCover ? undefined : "130px",
                        position: isCover ? "absolute" : "relative",
                        inset: isCover ? 0 : undefined,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderRadius: isCover ? "0px" : "6px",
                        background: "#000000",
                        zIndex: isCover ? 1 : 2,
                        flex: isCover ? undefined : 1,
                      }}
                    >
                      {slidePayload.mediaType === 'video' ? (
                        <video
                          key={slidePayload.mediaUrl}
                          src={slidePayload.mediaUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: isCover ? "cover" : "contain",
                            display: "block",
                          }}
                        />
                      ) : (
                        <img
                          key={slidePayload.mediaUrl}
                          src={slidePayload.mediaUrl}
                          alt="Media Projection"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: isCover ? "cover" : "contain",
                            display: "block",
                          }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "6px",
                          right: "8px",
                          background: "rgba(0, 0, 0, 0.75)",
                          color: "#38bdf8",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          zIndex: 5,
                        }}
                      >
                        {slidePayload.mediaType === 'video' ? '🎬 Live Video' : '🖼️ Live Image'}
                      </div>
                    </div>
                  );
                }

                if (slidePayload?.kind === 'presentation') {
                  return (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "120px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        padding: "8px",
                        background: "rgba(15, 23, 42, 0.8)",
                        borderRadius: "6px",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          color: slidePayload.docType === 'pptx' ? '#fb923c' : '#38bdf8',
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: "4px",
                        }}
                      >
                        {(slidePayload.docType || "slide").toUpperCase()} {slidePayload.docType === 'pptx' ? 'Slide' : 'Page'} {slidePayload.pageNumber || 1} / {slidePayload.totalPages || 1}
                      </span>
                      {slidePayload.heading && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#f8fafc",
                            marginBottom: "4px",
                          }}
                        >
                          {slidePayload.heading}
                        </span>
                      )}
                      {slidePayload.body && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "#cbd5e1",
                            lineHeight: 1.3,
                            maxHeight: "55px",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {slidePayload.body}
                        </span>
                      )}
                    </div>
                  );
                }

                const rawText = getSlideReadableText(rawLine);
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
        {!state.liveState.isBlackout && !isLiveCoverMedia && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "4px",
              position: "relative",
              zIndex: 2,
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
  );
};

