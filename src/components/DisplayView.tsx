import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { Maximize2, Minimize2, Tv, Circle, AlertTriangle } from 'lucide-react';

interface DisplayViewProps {
  state: AppState;
  progress: number;
  isOverlay?: boolean;
}

export const DisplayView: React.FC<DisplayViewProps> = ({
  state,
  progress: _progress,
  isOverlay = false,
}) => {
  const [fading, setFading] = useState(false);
  const [displayedLine, setDisplayedLine] = useState(state.lines[state.cur] || '');
  const [displayedNext, setDisplayedNext] = useState(state.lines[state.cur + 1] || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHintToast, setShowHintToast] = useState(true);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const [now, setNow] = useState(Date.now());
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep live time ticking for countdown and real-world clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Check URL query parameters for overlay, timer, clock overrides
  const urlParams = new URLSearchParams(window.location.search);
  const queryOverlay = urlParams.get('overlay') === '1' || urlParams.get('transparent') === '1';
  const effectiveOverlay = isOverlay || queryOverlay || state.theme.bgType === 'transparent' || state.theme.displayMode === 'lower-third';

  // Timer & Clock URL parameter overrides
  const queryTimer = urlParams.get('timer');
  const queryClock = urlParams.get('clock');

  const { timerState, theme, liveState } = state;

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle Fullscreen Edge-to-Edge
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Unable to toggle fullscreen:', err);
    }
  }, []);

  // Auto Fullscreen on mount & on first user gesture
  useEffect(() => {
    const tryImmediate = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {}
    };
    tryImmediate();

    const handleFirstGesture = async () => {
      if (!document.fullscreenElement) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {}
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, []);

  // Keyboard Shortcuts ('F' for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Activity timer: auto-hide cursor & floating HUD after 2.5s of mouse inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    setIsMouseIdle(false);

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setIsMouseIdle(true);
    }, 2500);
  }, []);

  // Auto-dismiss initial hint toast after 4s
  useEffect(() => {
    const toastTimer = setTimeout(() => {
      setShowHintToast(false);
    }, 4000);
    return () => clearTimeout(toastTimer);
  }, []);

  // Smooth slide change fade effect
  useEffect(() => {
    setFading(true);
    const timer = setTimeout(() => {
      setDisplayedLine(state.lines[state.cur] || '');
      setDisplayedNext(state.lines[state.cur + 1] || '');
      setFading(false);
    }, 180);

    return () => clearTimeout(timer);
  }, [state.cur, state.lines]);

  // Background computation
  let bgStyle: React.CSSProperties = {};
  let bgClass = '';

  if (effectiveOverlay) {
    bgStyle = { background: 'transparent' };
  } else if (liveState.isBlackout) {
    bgStyle = { background: '#000000' };
  } else if (theme.bgType === 'solid') {
    bgStyle = { background: theme.bgColor };
  } else if (theme.bgType === 'animated-gradient') {
    bgStyle = {
      background: theme.bgGradient,
      backgroundSize: '240% 240%',
    };
    bgClass = 'ambient-gradient';
  } else {
    bgStyle = { background: theme.bgGradient };
  }

  // Text shadow & stroke styling
  const textShadowParts: string[] = [];
  if (theme.textShadow) {
    textShadowParts.push(`${theme.shadowOffsetX}px ${theme.shadowOffsetY}px ${theme.shadowBlur}px ${theme.shadowColor}`);
  }
  if (theme.textOutline) {
    const w = theme.outlineWidth;
    const oc = theme.outlineColor;
    textShadowParts.push(`-${w}px -${w}px 0 ${oc}, ${w}px -${w}px 0 ${oc}, -${w}px ${w}px 0 ${oc}, ${w}px ${w}px 0 ${oc}`);
  }
  const combinedTextShadow = textShadowParts.length > 0 ? textShadowParts.join(', ') : 'none';

  // -------------------------------------------------------------
  // Live Timer & Real-World Clock Calculations
  // -------------------------------------------------------------
  const showTimerWidget =
    queryTimer !== null
      ? queryTimer === '1' || queryTimer === 'true'
      : (timerState.showOnDisplay ?? true) && (timerState.status !== 'idle' || timerState.remainingSec > 0 || timerState.durationSec > 0);

  const showClockWidget =
    queryClock !== null
      ? queryClock === '1' || queryClock === 'true'
      : (timerState.showClockOnDisplay ?? true);

  // Compute live remaining timer seconds
  let currentTimerSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    currentTimerSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }

  const isOvertime = currentTimerSec < 0;
  const isCritical = currentTimerSec <= timerState.criticalThresholdSec && !isOvertime;
  const isWarning = currentTimerSec <= timerState.warningThresholdSec && !isCritical && !isOvertime;

  const absSec = Math.abs(currentTimerSec);
  const timerHours = Math.floor(absSec / 3600);
  const timerMins = Math.floor((absSec % 3600) / 60);
  const timerSecs = absSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formattedTimerStr =
    timerHours > 0
      ? `${isOvertime ? '-' : ''}${pad(timerHours)}:${pad(timerMins)}:${pad(timerSecs)}`
      : `${isOvertime ? '-' : ''}${pad(timerMins)}:${pad(timerSecs)}`;

  // Format real-world clock time in 12-hour format (e.g. 12:26:13 PM) + Date (Sat, Sep 12, 2026)
  const realClockDate = new Date(now);
  const clockHours24 = realClockDate.getHours();
  const clockMinutes = realClockDate.getMinutes().toString().padStart(2, '0');
  const clockSeconds = realClockDate.getSeconds().toString().padStart(2, '0');
  const ampm = clockHours24 >= 12 ? 'PM' : 'AM';
  const clockHours12 = (clockHours24 % 12 || 12).toString().padStart(2, '0');
  const formattedClockTime = `${clockHours12}:${clockMinutes}:${clockSeconds}`;

  const formattedDateStr = realClockDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // -------------------------------------------------------------
  // Scripture & Content Parsing
  // -------------------------------------------------------------
  const isScriptureCategory =
    state.category === 'scripture' ||
    /\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\b/i.test(
      state.title
    );

  // Parse slide text to separate verse content from embedded citation headers
  let cleanVerseText = displayedLine;
  let citationRef = '';

  if (isScriptureCategory) {
    const doubleNewlineParts = displayedLine.split(/\n\s*\n/);
    if (doubleNewlineParts.length > 1) {
      const lastPart = doubleNewlineParts[doubleNewlineParts.length - 1].trim();
      // Check if last part looks like a scripture reference
      const looksLikeRef =
        /^[1-3]?\s*[A-Za-z\s]+(?:\s+\d+(?::\d+(?:-\d+)?)?)?(?:\s*\([A-Z0-9]+\))?$/i.test(lastPart) ||
        lastPart.startsWith('—') ||
        lastPart.startsWith('-');
      if (looksLikeRef && lastPart.length < 60) {
        citationRef = lastPart.replace(/^[—\-]\s*/, '').trim();
        cleanVerseText = doubleNewlineParts.slice(0, -1).join('\n\n').trim();
      }
    }

    if (!citationRef) {
      citationRef = state.title;
    }

    // Clean leading verse number if single verse is displayed (e.g. "16 For God so loved..." -> "For God so loved...")
    if (/^\d+[\s:.]\s+/.test(cleanVerseText) && !cleanVerseText.includes('\n\n')) {
      cleanVerseText = cleanVerseText.replace(/^\d+[\s:.]\s+/, '');
    }

    // Clean outer quotes if already wrapped
    cleanVerseText = cleanVerseText.replace(/^["“](.*)["”]$/, '$1').trim();
  }

  // Compute next scripture preview: only show next verse if it exists in the active scripture sequence, otherwise nothing
  let nextScripturePreview = '';
  if (isScriptureCategory && displayedNext) {
    const nextParts = displayedNext.split(/\n\s*\n/);
    let nextText = nextParts.length > 1 ? nextParts.slice(0, -1).join(' ').trim() : nextParts[0].trim();
    let nextRef = '';

    if (nextParts.length > 1) {
      const candidate = nextParts[nextParts.length - 1].replace(/^[—\-]\s*/, '').trim();
      const looksLikeRef =
        /^[1-3]?\s*[A-Za-z\s]+(?:\s+\d+(?::\d+(?:-\d+)?)?)?(?:\s*\([A-Z0-9]+\))?$/i.test(candidate) ||
        candidate.startsWith('—') ||
        candidate.startsWith('-');
      if (looksLikeRef && candidate.length < 60) {
        nextRef = candidate;
      } else {
        nextText = displayedNext.trim();
      }
    }

    // Clean leading verse number if needed
    nextText = nextText.replace(/^\d+[\s:.]\s*/, '').trim();
    // Clean outer quotes
    nextText = nextText.replace(/^["“](.*)["”]$/, '$1').trim();

    if (nextText) {
      if (nextRef) {
        nextScripturePreview = `${nextRef} — "${nextText.length > 85 ? nextText.slice(0, 85) + '…' : nextText}"`;
      } else {
        nextScripturePreview = `"${nextText.length > 95 ? nextText.slice(0, 95) + '…' : nextText}"`;
      }
    }
  }

  // Dynamic adaptive font scaling & line height based on scripture verse length & user theme.fontSize
  const textScale = Math.max(0.4, Math.min(2.5, (theme.fontSize || 44) / 44));
  const timerScale = Math.max(0.5, Math.min(3.0, (timerState.fontSizeScale || 100) / 100));

  const verseLength = (cleanVerseText || '').length;
  let dynamicScriptureFontSize = `clamp(${Math.round(58 * textScale)}px, ${(7.2 * textScale).toFixed(1)}vw, ${Math.round(102 * textScale)}px)`;
  let dynamicLineHeight = 1.38;

  if (verseLength < 65) {
    // Ultra short verses (e.g. "Jesus wept.", "Rejoice always.")
    dynamicScriptureFontSize = `clamp(${Math.round(72 * textScale)}px, ${(8.8 * textScale).toFixed(1)}vw, ${Math.round(124 * textScale)}px)`;
    dynamicLineHeight = 1.32;
  } else if (verseLength < 135) {
    // Standard verse (e.g. John 3:16)
    dynamicScriptureFontSize = `clamp(${Math.round(58 * textScale)}px, ${(7.2 * textScale).toFixed(1)}vw, ${Math.round(102 * textScale)}px)`;
    dynamicLineHeight = 1.38;
  } else if (verseLength < 215) {
    // Moderate length verse
    dynamicScriptureFontSize = `clamp(${Math.round(48 * textScale)}px, ${(5.8 * textScale).toFixed(1)}vw, ${Math.round(82 * textScale)}px)`;
    dynamicLineHeight = 1.42;
  } else if (verseLength < 320) {
    // Long verse
    dynamicScriptureFontSize = `clamp(${Math.round(40 * textScale)}px, ${(4.8 * textScale).toFixed(1)}vw, ${Math.round(66 * textScale)}px)`;
    dynamicLineHeight = 1.45;
  } else {
    // Very long passage
    dynamicScriptureFontSize = `clamp(${Math.round(32 * textScale)}px, ${(3.8 * textScale).toFixed(1)}vw, ${Math.round(52 * textScale)}px)`;
    dynamicLineHeight = 1.48;
  }

  // Determine if active text/scripture is currently cleared out or has content
  const hasLiveText = Boolean(
    (isScriptureCategory ? cleanVerseText : displayedLine) &&
    (isScriptureCategory ? cleanVerseText : displayedLine).trim().length > 0 &&
    state.lines &&
    state.lines.length > 0
  );
  const isTextCleared = liveState.isClearText || !hasLiveText;

  return (
    <div
      className={`display-canvas-root ${bgClass} ${isMouseIdle ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: effectiveOverlay ? 'transparent' : (theme.bgType === 'solid' ? theme.bgColor : '#121316'),
        padding: effectiveOverlay || theme.displayMode === 'lower-third' ? '2.5rem 3rem' : '3.5rem 4.5rem',
        boxSizing: 'border-box',
        transition: 'background 0.5s ease',
        ...bgStyle,
      }}
    >
      {/* Floating Auto-Hiding Presentation HUD (Bottom Right for operator) */}
      <div className={`display-hud-controls ${showControls ? 'visible' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8', fontWeight: 600, paddingRight: '4px' }}>
          <Circle size={8} fill="#10b981" color="transparent" />
          <span>LIVE DISPLAY</span>
        </div>

        <button
          className="display-hud-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          title={isFullscreen ? 'Exit Fullscreen (Esc or F)' : 'Enter Edge-to-Edge Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}</span>
        </button>
      </div>

      {/* Initial Hint Toast (fades after 4s) */}
      {showHintToast && !isFullscreen && (
        <div
          className="display-hint-toast"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
        >
          <Tv size={14} color="#38bdf8" />
          <span>Click anywhere or press <strong>F</strong> for borderless full screen</span>
        </div>
      )}

      {/* Broadcast Quick Ticker Alert Banner */}
      {liveState.quickAlert && (
        <div className="quick-alert-banner">
          ⚠️ {liveState.quickAlert}
        </div>
      )}

      {/* Live Prompt Message Banner */}
      {timerState.promptVisible && timerState.promptMessage && !liveState.isBlackout && (
        <div
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(234, 88, 12, 0.95))',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '999px',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5), 0 0 20px rgba(0, 0, 0, 0.6)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <AlertTriangle size={20} />
          <span>{timerState.promptMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER: CYAN COUNTDOWN TIMER WITH UNDERLINE (LEFT)      */}
      {/*    + AMBER DIGITAL CLOCK & DATE (RIGHT) + HEADER DIVIDER LINE */}
      {/* ------------------------------------------------------------- */}
      {!liveState.isBlackout && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '2rem 3.5rem 1.5rem 3.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: isTextCleared ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 45,
            pointerEvents: 'none',
            transition: 'border-bottom 0.3s ease',
          }}
        >
          {/* Top Left: Cyan Countdown Timer with Matching Underline (shown when text is active) */}
          {showTimerWidget && !isTextCleared ? (
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                animation: 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Overtime indicator badge */}
              {isOvertime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)',
                      textTransform: 'uppercase',
                    }}
                  >
                    OVERTIME
                  </span>
                  {timerState.title && (
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
                      {timerState.title}
                    </span>
                  )}
                </div>
              )}

              <div
                style={{
                  fontFamily: 'Montserrat, "Outfit", "Inter", sans-serif',
                  fontSize: `clamp(${Math.round(68 * timerScale)}px, ${(8.8 * timerScale).toFixed(1)}vw, ${Math.round(118 * timerScale)}px)`,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  color: isOvertime
                    ? '#ef4444'
                    : isCritical
                      ? '#f97316'
                      : isWarning
                        ? '#f59e0b'
                        : '#60a5fa', // Soft Cyan / Sky Blue
                  textShadow: isOvertime
                    ? '0 0 40px rgba(239, 68, 68, 0.9), 0 4px 15px rgba(0, 0, 0, 0.95)'
                    : '0 2px 25px rgba(96, 165, 250, 0.3), 0 4px 18px rgba(0, 0, 0, 0.85)',
                  transition: 'color 0.3s ease',
                }}
              >
                {formattedTimerStr}
              </div>

              {/* Cyan Underline Bar directly under timer digits */}
              <div
                style={{
                  height: '4px',
                  width: '100%',
                  background: isOvertime
                    ? '#ef4444'
                    : isCritical
                      ? '#f97316'
                      : isWarning
                        ? '#f59e0b'
                        : '#60a5fa',
                  borderRadius: '2px',
                  marginTop: '6px',
                  boxShadow: isOvertime
                    ? '0 0 10px rgba(239, 68, 68, 0.8)'
                    : '0 0 10px rgba(96, 165, 250, 0.65)',
                }}
              />

              {!isOvertime && timerState.title && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '6px',
                  }}
                >
                  {timerState.title}
                </span>
              )}
            </div>
          ) : <div />}

          {/* Top Right: Amber Digital Clock (Smaller) with Seconds, AM/PM & Live Date */}
          {showClockWidget ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '3px',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  fontFamily: 'Montserrat, "Outfit", "Inter", sans-serif',
                  fontSize: 'clamp(24px, 3vw, 40px)',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1.1,
                  color: '#f59e0b', // Amber / Gold
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  textShadow: '0 0 20px rgba(245, 158, 11, 0.3), 0 2px 10px rgba(0, 0, 0, 0.8)',
                }}
              >
                <span>{formattedClockTime}</span>
                <span style={{ fontSize: '0.72em', fontWeight: 900, letterSpacing: '0.06em' }}>
                  {ampm}
                </span>
              </div>

              {/* Sub-date e.g. Sat, Sep 12, 2026 */}
              <div
                style={{
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontSize: 'clamp(11px, 1.05vw, 14px)',
                  fontWeight: 500,
                  color: '#94a3b8',
                  letterSpacing: '0.02em',
                  marginTop: '1px',
                }}
              >
                {formattedDateStr}
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Emergency State: Logo Display */}
      {liveState.isLogo && !liveState.isBlackout && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            animation: 'fadeIn 0.5s ease',
          }}
        >
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)',
            }}
          >
            <span style={{ fontSize: '48px', color: '#ffffff' }}>✝</span>
          </div>
          <div
            style={{
              fontFamily: theme.fontFamily,
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow: '0 4px 15px rgba(0,0,0,0.8)',
            }}
          >
            EASY PRESENTER
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MIDDLE SPACE: HERO COUNTDOWN TIMER (WHEN TEXT CLEARED)     */}
      {/*    OR MAIN SCRIPTURE / WORSHIP SLIDE CONTENT                  */}
      {/* ------------------------------------------------------------- */}
      {!liveState.isBlackout && !liveState.isLogo && (
        isTextCleared ? (
          /* When text is cleared out, Countdown Timer takes the middle space */
          showTimerWidget ? (
            <div
              className="display-hero-timer-center"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                maxWidth: '1280px',
                width: '100%',
                padding: '2.5rem',
                margin: 'auto 0',
                borderRadius: '24px',
                zIndex: 30,
                ...(effectiveOverlay && {
                  background: 'rgba(0, 0, 0, 0.65)',
                  padding: '3rem 4rem',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
                }),
              }}
            >
              {/* Overtime indicator badge (only if in overtime) */}
              {isOvertime && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: 'clamp(14px, 1.8vw, 22px)',
                      fontWeight: 900,
                      letterSpacing: '0.14em',
                      padding: '5px 18px',
                      borderRadius: '999px',
                      boxShadow: '0 0 30px rgba(239, 68, 68, 0.85)',
                      textTransform: 'uppercase',
                    }}
                  >
                    OVERTIME
                  </span>
                </div>
              )}

              {/* Giant Hero Timer Digits */}
              <div
                style={{
                  fontFamily: 'Montserrat, "Outfit", "Inter", sans-serif',
                  fontSize: `clamp(${Math.round(100 * timerScale)}px, ${(17 * timerScale).toFixed(1)}vw, ${Math.round(250 * timerScale)}px)`,
                  fontWeight: 900,
                  letterSpacing: '-0.035em',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 0.92,
                  color: isOvertime
                    ? '#ef4444'
                    : isCritical
                      ? '#f97316'
                      : isWarning
                        ? '#f59e0b'
                        : '#60a5fa', // Soft Cyan / Sky Blue
                  textShadow: isOvertime
                    ? '0 0 65px rgba(239, 68, 68, 0.95), 0 6px 30px rgba(0, 0, 0, 0.95)'
                    : isCritical
                      ? '0 0 55px rgba(249, 115, 22, 0.75), 0 6px 28px rgba(0, 0, 0, 0.95)'
                      : isWarning
                        ? '0 0 55px rgba(245, 158, 11, 0.65), 0 6px 28px rgba(0, 0, 0, 0.95)'
                        : '0 0 55px rgba(96, 165, 250, 0.5), 0 6px 28px rgba(0, 0, 0, 0.95)',
                  transition: 'color 0.3s ease, text-shadow 0.3s ease',
                }}
              >
                {formattedTimerStr}
              </div>

              {/* Glowing Underline Accent Bar */}
              <div
                style={{
                  height: '7px',
                  width: `clamp(${Math.round(200 * timerScale)}px, ${(32 * timerScale).toFixed(1)}vw, ${Math.round(480 * timerScale)}px)`,
                  background: isOvertime
                    ? '#ef4444'
                    : isCritical
                      ? '#f97316'
                      : isWarning
                        ? '#f59e0b'
                        : '#60a5fa',
                  borderRadius: '4px',
                  marginTop: '1.5rem',
                  boxShadow: isOvertime
                    ? '0 0 25px rgba(239, 68, 68, 0.95)'
                    : isCritical
                      ? '0 0 22px rgba(249, 115, 22, 0.85)'
                      : isWarning
                        ? '0 0 22px rgba(245, 158, 11, 0.8)'
                        : '0 0 25px rgba(96, 165, 250, 0.85)',
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                }}
              />
            </div>
          ) : null
        ) : (
          /* Normal Live Scripture / Worship Slide Text */
          <div
            style={{
              maxWidth: '1360px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: isScriptureCategory ? 'center' : (theme.textAlign === 'left' ? 'flex-start' : theme.textAlign === 'right' ? 'flex-end' : 'center'),
              textAlign: isScriptureCategory ? 'center' : theme.textAlign,
              opacity: fading ? 0 : 1,
              transform: fading ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)',
              transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              padding: '2rem 1.5rem',
              marginTop: (!liveState.isBlackout && (showTimerWidget || showClockWidget)) ? '5.5rem' : '0',
              ...(effectiveOverlay && {
                background: 'rgba(0, 0, 0, 0.65)',
                padding: '2rem 3rem',
                borderRadius: '20px',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              }),
            }}
          >
            {/* Scripture Specific Layout (Quotation Mark + Adaptive Italic Serif + Flanked Reference) */}
            {isScriptureCategory ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {/* Stylized Double Quotation Mark (Top Left) */}
                <div
                  style={{
                    alignSelf: 'flex-start',
                    marginBottom: '1rem',
                    opacity: 0.9,
                    marginLeft: '0.5rem',
                  }}
                >
                  <svg width="56" height="46" viewBox="0 0 32 28" fill="#2d3139">
                    <path d="M0 16.5C0 9.8 4.2 3.5 11.8 0L14 4.1C9.6 6.3 7.8 9.3 7.3 12.3H14V28H0V16.5ZM18 16.5C18 9.8 22.2 3.5 29.8 0L32 4.1C27.6 6.3 25.8 9.3 25.3 12.3H32V28H18V16.5Z" />
                  </svg>
                </div>

                {/* Dynamic Auto-Adjusted Scripture Verse Text */}
                <div
                  style={{
                    fontFamily: theme.fontFamily || '"Playfair Display", "Merriweather", "Georgia", serif',
                    fontSize: dynamicScriptureFontSize,
                    fontWeight: 600,
                    fontStyle: 'italic',
                    color: '#ffffff',
                    lineHeight: dynamicLineHeight,
                    letterSpacing: '-0.015em',
                    textShadow: combinedTextShadow !== 'none' ? combinedTextShadow : '0 2px 20px rgba(0, 0, 0, 0.9)',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    maxWidth: '1440px',
                  }}
                >
                  {cleanVerseText}
                </div>

                {/* Flanked Scripture Citation Reference at Bottom */}
                {citationRef && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '20px',
                      marginTop: '2.5rem',
                      width: '100%',
                    }}
                  >
                    <div style={{ width: '70px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                    <span
                      style={{
                        fontFamily: theme.fontFamily || 'Inter, Montserrat, sans-serif',
                        fontSize: 'clamp(20px, 2.2vw, 28px)',
                        fontWeight: 800,
                        color: '#e2e8f0',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {citationRef}
                    </span>
                    <div style={{ width: '70px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                  </div>
                )}
              </div>
            ) : (
              /* General Song / Hymn Slide Text */
              <div
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: `${theme.fontSize}px`,
                  fontWeight: theme.fontWeight,
                  fontStyle: theme.fontStyle,
                  textTransform: theme.textTransform,
                  color: theme.textColor,
                  lineHeight: theme.lineHeight,
                  letterSpacing: `${theme.letterSpacing}px`,
                  textShadow: combinedTextShadow,
                  whiteSpace: 'pre-line',
                  wordBreak: 'break-word',
                }}
              >
                {displayedLine}
              </div>
            )}
          </div>
        )
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM DISPLAY BAR: NEXT VERSE / SLIDE PREVIEW             */}
      {/* ------------------------------------------------------------- */}
      {!liveState.isBlackout && !liveState.isLogo && !isTextCleared && (
        isScriptureCategory ? (
          nextScripturePreview ? (
            <div
              style={{
                position: 'absolute',
                bottom: '1.75rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: 'clamp(12px, 1.25vw, 15px)',
                fontWeight: 500,
                fontStyle: 'italic',
                maxWidth: '900px',
                width: 'max-content',
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                padding: '7px 22px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.55)',
                zIndex: 40,
                pointerEvents: 'none',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <span style={{ fontWeight: 800, fontStyle: 'normal', color: '#38bdf8', fontSize: '0.85em', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NEXT:
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '750px' }}>
                {nextScripturePreview}
              </span>
            </div>
          ) : null
        ) : (
          theme.showNextPreview && displayedNext ? (
            <div
              style={{
                position: 'absolute',
                bottom: '1.75rem',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.65)',
                fontSize: 'clamp(12px, 1.25vw, 15px)',
                fontWeight: 500,
                fontStyle: 'italic',
                maxWidth: '900px',
                width: 'max-content',
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.85)',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                padding: '7px 22px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.55)',
                zIndex: 40,
                pointerEvents: 'none',
                animation: 'fadeIn 0.3s ease',
              }}
            >
              <span style={{ fontWeight: 800, fontStyle: 'normal', color: '#38bdf8', fontSize: '0.85em', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                NEXT:
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '750px' }}>
                {displayedNext.replace(/\n/g, ' ')}
              </span>
            </div>
          ) : null
        )
      )}
    </div>
  );
};

