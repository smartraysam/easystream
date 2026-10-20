import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { DEFAULT_SCRIPTURE_FORMATTING, DEFAULT_LYRICS_FORMATTING } from '../data/defaults';
import { parseSlidePayload, getSlideNextSummary } from '../utils/mediaPresentationParser';
import { Maximize2, Minimize2, Tv, Circle, AlertTriangle } from 'lucide-react';
import { ThemeBackgroundLayer } from './ThemeBackgroundLayer';

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
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const hasTopBar = !liveState.isBlackout && (showTimerWidget || showClockWidget);
  const topHeaderRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(160);

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

  // Dynamically observe top bar dimensions to ensure low section calculation is exact
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (topHeaderRef.current && hasTopBar) {
        const height = topHeaderRef.current.offsetHeight;
        if (height > 0) {
          setHeaderHeight(height);
        }
      } else if (!hasTopBar) {
        setHeaderHeight(0);
      }
    };

    updateHeaderHeight();

    if (topHeaderRef.current) {
      const ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(topHeaderRef.current);
      return () => ro.disconnect();
    }
  }, [hasTopBar, showTimerWidget, showClockWidget, isOvertime, formattedTimerStr]);

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
  // Scripture, Media & Presentation Content Parsing
  // -------------------------------------------------------------
  const slidePayload = parseSlidePayload(displayedLine);
  const isMedia = slidePayload?.kind === 'media';
  const isPresentation = slidePayload?.kind === 'presentation';
  const isMediaOrPresentation = isMedia || isPresentation;
  const isCoverMedia = isMedia && slidePayload?.fitMode === 'cover';

  const isScriptureCategory =
    !slidePayload &&
    (state.category === 'scripture' ||
      /\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\b/i.test(
        state.title
      ));

  // Parse slide text to separate verse content from embedded citation headers
  let cleanVerseText = displayedLine;
  let citationRef = '';

  if (isScriptureCategory) {
    const doubleNewlineParts = displayedLine.split(/\n\s*\n/);
    const looksLikeRef = (str: string) =>
      (/^[1-3]?\s*[A-Za-z\s]+\s+\d+(?::\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?$/i.test(str) ||
       /^[1-3]?\s*[A-Za-z\s]+\s*\([A-Z0-9\s]+\)$/i.test(str) ||
       str.startsWith('—') ||
       str.startsWith('-'));

    if (doubleNewlineParts.length > 1) {
      const firstPart = doubleNewlineParts[0].trim();
      const lastPart = doubleNewlineParts[doubleNewlineParts.length - 1].trim();
      if (looksLikeRef(firstPart) && firstPart.length < 60) {
        citationRef = firstPart.replace(/^[—\-]\s*/, '').trim();
        cleanVerseText = doubleNewlineParts.slice(1).join('\n\n').trim();
      } else if (looksLikeRef(lastPart) && lastPart.length < 60) {
        citationRef = lastPart.replace(/^[—\-]\s*/, '').trim();
        cleanVerseText = doubleNewlineParts.slice(0, -1).join('\n\n').trim();
      }
    }

    if (!citationRef) {
      citationRef = state.title;
      if (citationRef && state.subtitle && !citationRef.includes('(')) {
        citationRef = `${citationRef} (${state.subtitle})`;
      }
    }

    // Clean leading verse number if single verse is displayed (e.g. "16 For God so loved..." -> "For God so loved...")
    if (/^\d+[\s:.]\s+/.test(cleanVerseText) && !cleanVerseText.includes('\n\n')) {
      cleanVerseText = cleanVerseText.replace(/^\d+[\s:.]\s+/, '');
    }

    // Clean outer quotes if already wrapped
    cleanVerseText = cleanVerseText.replace(/^[“"']+|[”"']+$/g, '').trim();
  }

  // Compute next scripture preview: only show next verse if it exists in the active scripture sequence, otherwise nothing
  let nextScripturePreview = '';
  if (isScriptureCategory && displayedNext) {
    const nextParts = displayedNext.split(/\n\s*\n/);
    const looksLikeRef = (str: string) =>
      (/^[1-3]?\s*[A-Za-z\s]+\s+\d+(?::\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?$/i.test(str) ||
       /^[1-3]?\s*[A-Za-z\s]+\s*\([A-Z0-9\s]+\)$/i.test(str) ||
       str.startsWith('—') ||
       str.startsWith('-'));

    let nextText = displayedNext.trim();
    let nextRef = '';

    if (nextParts.length > 1) {
      const firstCandidate = nextParts[0].replace(/^[—\-]\s*/, '').trim();
      const lastCandidate = nextParts[nextParts.length - 1].replace(/^[—\-]\s*/, '').trim();
      if (looksLikeRef(firstCandidate) && firstCandidate.length < 60) {
        nextRef = firstCandidate;
        nextText = nextParts.slice(1).join(' ').trim();
      } else if (looksLikeRef(lastCandidate) && lastCandidate.length < 60) {
        nextRef = lastCandidate;
        nextText = nextParts.slice(0, -1).join(' ').trim();
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

  // Active scripture & lyrics formatting configurations
  const scriptureFormat = {
    ...DEFAULT_SCRIPTURE_FORMATTING,
    ...(theme.scripture || {}),
  };

  const lyricsFormat = {
    ...DEFAULT_LYRICS_FORMATTING,
    ...(theme.lyrics || {}),
  };

  // Dynamic adaptive font scaling & line height based on scripture verse length & configured scripture bodyFontSize
  const textScale = Math.max(0.4, Math.min(2.5, (scriptureFormat.bodyFontSize || 52) / 52));
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
      className={`display-canvas-root ${bgClass} ${isMouseIdle ? 'hide-cursor' : ''} ${isPresentation ? 'presentation-projecting hide-scrollbar' : ''}`}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isMediaOrPresentation ? 'flex-start' : 'center',
        alignItems: 'center',
        background: effectiveOverlay ? 'transparent' : (theme.bgType === 'solid' ? theme.bgColor : '#121316'),
        padding: isMediaOrPresentation ? 0 : (effectiveOverlay || theme.displayMode === 'lower-third' ? '2.5rem 3rem' : '3.5rem 4.5rem'),
        boxSizing: 'border-box',
        transition: 'background 0.5s ease',
        scrollbarWidth: isPresentation ? 'none' : undefined,
        msOverflowStyle: isPresentation ? 'none' : undefined,
        ...bgStyle,
      }}
    >
      {/* Theme Background & Pattern Overlay Layer */}
      <ThemeBackgroundLayer
        theme={theme}
        isBlackout={liveState.isBlackout}
        isOverlay={effectiveOverlay}
      />

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
      {!liveState.isBlackout && hasTopBar && (
        <div
          ref={topHeaderRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '2rem 3.5rem 1.5rem 3.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: isCoverMedia || isTextCleared ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
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
        ) : isMedia ? (
          /* Media Projection (Image or Video)
           * Cover: fills the entire display edge-to-edge.
           * Contain: fills just the low section without the timer and counter part.
           */
          <div
            style={
              isCoverMedia
                ? {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 1,
                    background: '#000000',
                  }
                : {
                    position: 'absolute',
                    top: hasTopBar ? `${headerHeight}px` : 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: hasTopBar ? `calc(100vh - ${headerHeight}px)` : '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 1,
                    background: '#000000',
                  }
            }
          >
            {slidePayload.mediaType === 'video' ? (
              <video
                key={slidePayload.mediaUrl}
                src={slidePayload.mediaUrl}
                autoPlay
                loop={slidePayload.loop !== false}
                muted={Boolean(slidePayload.muted)}
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: isCoverMedia ? 'cover' : 'contain',
                  display: 'block',
                }}
              />
            ) : (
              <img
                key={slidePayload.mediaUrl}
                src={slidePayload.mediaUrl}
                alt={slidePayload.heading || state.title || 'Media Display'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: isCoverMedia ? 'cover' : 'contain',
                  display: 'block',
                }}
              />
            )}

            {/* Optional lower title / caption if specified on media slide */}
            {slidePayload.body && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '2rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.75)',
                  color: '#ffffff',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  fontSize: '20px',
                  fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  maxWidth: '80%',
                  textAlign: 'center',
                  zIndex: 2,
                }}
              >
                {slidePayload.body}
              </div>
            )}
          </div>
        ) : (
          /* Normal Live Scripture / Worship Slide Text */
          <div
            className={isPresentation ? 'hide-scrollbar' : undefined}
            style={{
              maxWidth: isPresentation ? '100%' : '1360px',
              width: '100%',
              height: isPresentation
                ? (hasTopBar ? `calc(100vh - ${headerHeight}px)` : '100vh')
                : undefined,
              maxHeight: isPresentation
                ? (hasTopBar ? `calc(100vh - ${headerHeight}px)` : '100vh')
                : undefined,
              flex: isPresentation ? 1 : undefined,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isScriptureCategory
                ? (scriptureFormat.textAlign === 'left' ? 'flex-start' : scriptureFormat.textAlign === 'right' ? 'flex-end' : 'center')
                : (lyricsFormat.textAlign === 'left' ? 'flex-start' : lyricsFormat.textAlign === 'right' ? 'flex-end' : 'center'),
              justifyContent: isPresentation ? 'center' : undefined,
              textAlign: isScriptureCategory ? scriptureFormat.textAlign : lyricsFormat.textAlign,
              opacity: fading ? 0 : 1,
              transform: isPresentation
                ? 'none'
                : (fading ? 'translateY(10px) scale(0.98)' : 'translateY(0) scale(1)'),
              transition: 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              padding: isPresentation ? '0.75rem 1.5rem' : '2rem 1.5rem',
              boxSizing: 'border-box',
              overflow: isPresentation ? 'hidden' : undefined,
              scrollbarWidth: isPresentation ? 'none' : undefined,
              msOverflowStyle: isPresentation ? 'none' : undefined,
              marginTop: isPresentation
                ? (hasTopBar ? `${headerHeight}px` : '0')
                : (isScriptureCategory
                  ? (scriptureFormat.verticalAlign === 'top'
                      ? (hasTopBar ? '6.5rem' : '2.5rem')
                      : scriptureFormat.verticalAlign === 'bottom'
                        ? 'auto'
                        : (hasTopBar ? '5.5rem' : '0'))
                  : (lyricsFormat.verticalAlign === 'top'
                      ? (hasTopBar ? '6.5rem' : '2.5rem')
                      : lyricsFormat.verticalAlign === 'bottom'
                        ? 'auto'
                        : (hasTopBar ? '5.5rem' : '0'))),
              marginBottom: isPresentation
                ? 0
                : (isScriptureCategory
                  ? (scriptureFormat.verticalAlign === 'bottom'
                      ? ((!liveState.isBlackout && nextScripturePreview) ? '6rem' : '2.5rem')
                      : scriptureFormat.verticalAlign === 'top'
                        ? 'auto'
                        : '0')
                  : (lyricsFormat.verticalAlign === 'bottom'
                      ? ((!liveState.isBlackout && displayedNext) ? '6rem' : '2.5rem')
                      : lyricsFormat.verticalAlign === 'top'
                        ? 'auto'
                        : '0')),
              ...(effectiveOverlay && !isMediaOrPresentation && {
                background: 'rgba(0, 0, 0, 0.65)',
                padding: '2rem 3rem',
                borderRadius: '20px',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.8)',
              }),
            }}
          >
            {/* Scripture Specific Layout (Flanked Title at Top + Adaptive Verse) */}
            {isScriptureCategory ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: scriptureFormat.textAlign === 'left' ? 'flex-start' : scriptureFormat.textAlign === 'right' ? 'flex-end' : 'center',
                  width: '100%',
                  position: 'relative',
                }}
              >
                {/* Flanked Scripture Citation Reference / Title at Top (default, omitted if showTitle is false or titlePosition is bottom) */}
                {scriptureFormat.showTitle && citationRef && scriptureFormat.titlePosition !== 'bottom' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: scriptureFormat.textAlign === 'left' ? 'flex-start' : scriptureFormat.textAlign === 'right' ? 'flex-end' : 'center',
                      gap: '24px',
                      marginBottom: '1.75rem',
                      width: '100%',
                    }}
                  >
                    <div style={{ width: '60px', height: '2px', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '2px' }} />
                    <span
                      style={{
                        fontFamily: scriptureFormat.titleFontFamily || theme.fontFamily || 'Montserrat, sans-serif',
                        fontSize: `clamp(${Math.round(scriptureFormat.titleFontSize * 0.75)}px, 2.4vw, ${scriptureFormat.titleFontSize}px)`,
                        fontWeight: scriptureFormat.titleFontStyle.includes('bold') ? 800 : 500,
                        fontStyle: scriptureFormat.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                        color: scriptureFormat.titleFontColor || theme.accentColor || '#38bdf8',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        textShadow: combinedTextShadow !== 'none' ? combinedTextShadow : '0 2px 14px rgba(0, 0, 0, 0.95)',
                      }}
                    >
                      {citationRef}
                    </span>
                    <div style={{ width: '60px', height: '2px', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '2px' }} />
                  </div>
                )}

                {/* Dynamic Auto-Adjusted Scripture Verse Text */}
                <div
                  style={{
                    fontFamily: scriptureFormat.bodyFontFamily || theme.fontFamily || '"Playfair Display", "Merriweather", "Georgia", serif',
                    fontSize: dynamicScriptureFontSize,
                    fontWeight: scriptureFormat.bodyFontStyle.includes('bold') ? 700 : 500,
                    fontStyle: scriptureFormat.bodyFontStyle.includes('italic') ? 'italic' : 'normal',
                    color: scriptureFormat.bodyFontColor || '#ffffff',
                    lineHeight: dynamicLineHeight,
                    letterSpacing: '-0.015em',
                    textShadow: combinedTextShadow !== 'none' ? combinedTextShadow : '0 2px 20px rgba(0, 0, 0, 0.9)',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    maxWidth: '1440px',
                    textAlign: scriptureFormat.textAlign,
                  }}
                >
                  “{cleanVerseText}”
                </div>

                {/* Flanked Scripture Citation Reference / Title at Bottom (only if titlePosition === 'bottom') */}
                {scriptureFormat.showTitle && citationRef && scriptureFormat.titlePosition === 'bottom' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: scriptureFormat.textAlign === 'left' ? 'flex-start' : scriptureFormat.textAlign === 'right' ? 'flex-end' : 'center',
                      gap: '24px',
                      marginTop: '1.75rem',
                      width: '100%',
                    }}
                  >
                    <div style={{ width: '60px', height: '2px', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '2px' }} />
                    <span
                      style={{
                        fontFamily: scriptureFormat.titleFontFamily || theme.fontFamily || 'Montserrat, sans-serif',
                        fontSize: `clamp(${Math.round(scriptureFormat.titleFontSize * 0.75)}px, 2.4vw, ${scriptureFormat.titleFontSize}px)`,
                        fontWeight: scriptureFormat.titleFontStyle.includes('bold') ? 800 : 500,
                        fontStyle: scriptureFormat.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                        color: scriptureFormat.titleFontColor || theme.accentColor || '#38bdf8',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        textShadow: combinedTextShadow !== 'none' ? combinedTextShadow : '0 2px 14px rgba(0, 0, 0, 0.95)',
                      }}
                    >
                      {citationRef}
                    </span>
                    <div style={{ width: '60px', height: '2px', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '2px' }} />
                  </div>
                )}
              </div>
            ) : slidePayload?.kind === 'presentation' ? (
              /* Presentation Slide / Document Page (PPTX, Word, PDF) */
              (() => {
                const isPptPresentation = slidePayload.docType === 'pptx' || !slidePayload.docType;
                return slidePayload.docType === 'pdf' && slidePayload.pdfUrl ? (
                  <div
                    className="hide-scrollbar"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: 'calc(-15.5rem + 100vh)',
                      maxWidth: '1720px',
                      display: 'flex',
                      flexDirection: 'column',
                      background: 'rgba(15, 23, 42, 0.85)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.16)',
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 20px',
                        background: 'rgba(2, 6, 23, 0.9)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#f8fafc',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {state.title}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '14px',
                          fontWeight: 800,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.15)',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                        }}
                      >
                        PAGE {slidePayload.pageNumber || state.cur + 1} OF {slidePayload.totalPages || state.lines.length}
                      </span>
                    </div>
                    <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
                      <iframe
                        key={`${slidePayload.pdfUrl}-page-${slidePayload.pageNumber || state.cur + 1}`}
                        src={`${slidePayload.pdfUrl}#page=${slidePayload.pageNumber || state.cur + 1}&view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                        title={slidePayload.heading || `Page ${slidePayload.pageNumber || 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          border: 'none',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div
                    className="hide-scrollbar"
                    style={{
                      width: '100%',
                      maxWidth: '1720px',
                      maxHeight: 'calc(-15.5rem + 100vh)',
                      background: 'rgba(15, 23, 42, 0.72)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '24px',
                      padding: '2.5rem 3.5rem',
                      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                      textAlign: 'left',
                      overflow: 'auto',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {/* Top Badge: Slide / Page Number + Document Title */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                        paddingBottom: '1rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: 'clamp(14px, 1.4vw, 20px)',
                          fontWeight: 800,
                          color: slidePayload.docType === 'pptx' ? '#fb923c' : '#38bdf8',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {state.title}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: 'clamp(13px, 1.2vw, 17px)',
                          fontWeight: 800,
                          color: '#e2e8f0',
                          background: 'rgba(255, 255, 255, 0.1)',
                          padding: '4px 14px',
                          borderRadius: '999px',
                        }}
                      >
                        {slidePayload.docType === 'pptx' ? 'SLIDE' : 'PAGE'} {slidePayload.pageNumber || state.cur + 1} / {slidePayload.totalPages || state.lines.length}
                      </span>
                    </div>

                    {/* Slide / Page Heading */}
                    {slidePayload.heading && (
                      <div
                        style={{
                          fontFamily: lyricsFormat.titleFontFamily || theme.fontFamily || 'Montserrat, sans-serif',
                          fontSize: isPptPresentation
                            ? 'clamp(20px, 2.2vw, 28px)'
                            : 'clamp(32px, 3.8vw, 56px)',
                          fontWeight: 900,
                          color: '#ffffff',
                          lineHeight: 1.2,
                          textShadow: combinedTextShadow,
                        }}
                      >
                        {slidePayload.heading}
                      </div>
                    )}

                    {/* Content Area: Text + Optional Embedded Slide/Page Image */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: slidePayload.imageUrl && (slidePayload.body || (slidePayload.bullets && slidePayload.bullets.length > 0)) ? 'row' : 'column',
                        alignItems: 'center',
                        gap: '2.5rem',
                        width: '100%',
                      }}
                    >
                      {(slidePayload.bullets && slidePayload.bullets.length > 0) || slidePayload.body ? (
                        <div
                          style={{
                            flex: 1,
                            fontFamily: lyricsFormat.bodyFontFamily || theme.fontFamily || 'Inter, sans-serif',
                            fontSize: isPptPresentation
                              ? (slidePayload.body || '').length > 350
                                ? 'clamp(18px, 1.8vw, 22px)'
                                : (slidePayload.body || '').length > 180
                                ? 'clamp(20px, 2.0vw, 25px)'
                                : 'clamp(22px, 2.2vw, 28px)'
                              : (slidePayload.body || '').length > 350
                              ? 'clamp(22px, 2.3vw, 34px)'
                              : (slidePayload.body || '').length > 180
                              ? 'clamp(26px, 2.8vw, 42px)'
                              : 'clamp(30px, 3.3vw, 50px)',
                            fontWeight: 600,
                            color: '#f8fafc',
                            lineHeight: 1.48,
                            textShadow: combinedTextShadow,
                            whiteSpace: 'pre-line',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem',
                          }}
                        >
                          {slidePayload.bullets && slidePayload.bullets.length > 0 ? (
                            slidePayload.bullets.map((b, bIdx) => (
                              <div key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                {!b.startsWith('•') && slidePayload.docType === 'pptx' && (
                                  <span style={{ color: '#fb923c', fontWeight: 900 }}>•</span>
                                )}
                                <span>{b}</span>
                              </div>
                            ))
                          ) : (
                            <div>{slidePayload.body}</div>
                          )}
                        </div>
                      ) : null}

                      {slidePayload.imageUrl && (
                        <div
                          style={{
                            flex: slidePayload.body || (slidePayload.bullets && slidePayload.bullets.length > 0) ? '0 0 42%' : '1',
                            maxHeight: '52vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <img
                            src={slidePayload.imageUrl}
                            alt={slidePayload.heading || 'Slide graphic'}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '50vh',
                              borderRadius: '14px',
                              objectFit: 'contain',
                              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* General Song / Hymn Slide Text */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: lyricsFormat.textAlign === 'left' ? 'flex-start' : lyricsFormat.textAlign === 'right' ? 'flex-end' : 'center',
                  width: '100%',
                }}
              >
                {/* Optional Song Title on Display */}
                {lyricsFormat.showTitle && state.title && (
                  <div
                    style={{
                      fontFamily: lyricsFormat.titleFontFamily || theme.fontFamily,
                      fontSize: `clamp(${Math.round(lyricsFormat.titleFontSize * 0.75)}px, 2.2vw, ${lyricsFormat.titleFontSize}px)`,
                      fontWeight: lyricsFormat.titleFontStyle.includes('bold') ? 800 : 600,
                      fontStyle: lyricsFormat.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                      color: lyricsFormat.titleFontColor || '#f59e0b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '1.25rem',
                      textShadow: combinedTextShadow !== 'none' ? combinedTextShadow : '0 2px 10px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    {state.title}
                  </div>
                )}

                {/* Lyrics Body */}
                <div
                  style={{
                    fontFamily: lyricsFormat.bodyFontFamily || theme.fontFamily,
                    fontSize: `${lyricsFormat.bodyFontSize || theme.fontSize}px`,
                    fontWeight: lyricsFormat.bodyFontStyle.includes('bold') ? 800 : (lyricsFormat.bodyFontWeight || theme.fontWeight || 700),
                    fontStyle: lyricsFormat.bodyFontStyle.includes('italic') ? 'italic' : (theme.fontStyle || 'normal'),
                    textTransform: lyricsFormat.bodyTextTransform || theme.textTransform || 'none',
                    color: lyricsFormat.bodyFontColor || theme.textColor || '#ffffff',
                    lineHeight: theme.lineHeight || 1.45,
                    letterSpacing: `${theme.letterSpacing || 0.5}px`,
                    textShadow: combinedTextShadow,
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                    textAlign: lyricsFormat.textAlign,
                  }}
                >
                  {displayedLine}
                </div>
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
          !isMediaOrPresentation && theme.showNextPreview && displayedNext ? (
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
                {getSlideNextSummary(displayedNext)}
              </span>
            </div>
          ) : null
        )
      )}
    </div>
  );
};

