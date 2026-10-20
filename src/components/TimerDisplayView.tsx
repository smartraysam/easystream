import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TimerState, LiveState, TimerSlot } from '../types';
import { Clock, AlertTriangle, MessageSquare, Bell, Sparkles, FastForward, Maximize2, Minimize2, Plus, Minus } from 'lucide-react';

interface TimerDisplayViewProps {
  timerState: TimerState;
  liveState?: LiveState;
  isOverlay?: boolean;
  onSetTimerConfig?: (config: Partial<TimerState>) => void;
  onJumpToTimerSlot?: (index: number, autoStart?: boolean) => void;
}

export const TimerDisplayView: React.FC<TimerDisplayViewProps> = ({
  timerState,
  isOverlay = false,
  onSetTimerConfig,
  onJumpToTimerSlot,
}) => {
  const [now, setNow] = useState(Date.now());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appliedScheduleParamRef = useRef<string | null>(null);

  // Jump to specific timer schedule slot and autostart countdown when URL parameter ?schedule= or ?slot= is provided
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const scheduleParam = searchParams.get('schedule') || searchParams.get('slot');

    if (!scheduleParam || !onJumpToTimerSlot) return;
    if (appliedScheduleParamRef.current === scheduleParam) return;

    const slots = timerState.slots || [];
    if (slots.length === 0) return;

    let targetIndex = -1;

    // Check if numeric (1-based index e.g. 1, 2, 3...)
    const num = parseInt(scheduleParam, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= slots.length) {
        targetIndex = num - 1;
      } else if (num === 0 && slots.length > 0) {
        targetIndex = 0;
      }
    }

    // Check if slot ID match
    if (targetIndex === -1) {
      const idIdx = slots.findIndex((s) => s.id === scheduleParam);
      if (idIdx !== -1) {
        targetIndex = idIdx;
      }
    }

    // Check if slot title match (case-insensitive fuzzy search)
    if (targetIndex === -1) {
      const lowerQuery = scheduleParam.toLowerCase().trim();
      const titleIdx = slots.findIndex((s) => s.title.toLowerCase().includes(lowerQuery));
      if (titleIdx !== -1) {
        targetIndex = titleIdx;
      }
    }

    if (targetIndex !== -1) {
      appliedScheduleParamRef.current = scheduleParam;
      // Autostart immediately once page is loaded if not already running on this slot
      if (timerState.activeSlotIndex === targetIndex && timerState.status === 'running' && timerState.targetEndTime) {
        return;
      }
      onJumpToTimerSlot(targetIndex, true);
    }
  }, [timerState.slots, timerState.activeSlotIndex, timerState.status, timerState.targetEndTime, onJumpToTimerSlot]);

  const currentScale = timerState.fontSizeScale || 100;

  const handleAdjustFontSize = useCallback((delta: number) => {
    const next = Math.max(60, Math.min(350, currentScale + delta));
    if (onSetTimerConfig) {
      onSetTimerConfig({ fontSizeScale: next });
    }
  }, [currentScale, onSetTimerConfig]);

  const handleSetFontSize = useCallback((scale: number) => {
    if (onSetTimerConfig) {
      onSetTimerConfig({ fontSizeScale: scale });
    }
  }, [onSetTimerConfig]);

  // Track Fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      } catch {
        // Handled on first click below
      }
    };
    tryImmediate();

    const handleFirstGesture = async () => {
      if (!document.fullscreenElement) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('pointerdown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
  }, []);

  // Keyboard Shortcuts ('F' for Fullscreen, '+', '-', '0' for Font Size)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleAdjustFontSize(15);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleAdjustFontSize(-15);
      } else if (e.key === '0') {
        e.preventDefault();
        handleSetFontSize(100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, handleAdjustFontSize, handleSetFontSize]);

  // Activity timer
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

  // Update ticks smoothly
  useEffect(() => {
    const update = () => {
      setNow(Date.now());
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, []);

  // Compute remaining or overtime seconds
  let currentSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    currentSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }

  const isOvertime = currentSec < 0;
  const isTimeUp = currentSec <= 0;
  const absSec = Math.abs(currentSec);

  // Slots calculation
  const slots: TimerSlot[] = timerState.slots || [];
  const activeSlotIndex = typeof timerState.activeSlotIndex === 'number' ? timerState.activeSlotIndex : 0;
  const currentSlot = slots[activeSlotIndex] || null;
  const nextSlot = activeSlotIndex + 1 < slots.length ? slots[activeSlotIndex + 1] : null;

  // Should display the bottom sliding "Next Program" banner when time is up
  const showNextProgramBanner = isTimeUp && nextSlot !== null && timerState.showNextProgramAlert !== false;

  // Format MM:SS or HH:MM:SS
  const formatTime = (totalSec: number, showSign = false) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    let timeStr = '';
    if (hrs > 0 || (timerState.durationSec >= 3600 && !isOvertime)) {
      timeStr = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    } else {
      timeStr = `${pad(mins)}:${pad(secs)}`;
    }

    if (showSign && isOvertime) {
      return `-${timeStr}`;
    }
    return timeStr;
  };

  // Color theme based on remaining time
  const warningSec = timerState.warningThresholdSec || 300;
  const criticalSec = timerState.criticalThresholdSec || 60;

  let timerColor = '#38bdf8'; // Normal: Cyan
  let timerShadow = '0 0 40px rgba(56, 189, 248, 0.35)';

  if (isOvertime) {
    timerColor = '#ef4444'; // Red Overtime
    timerShadow = '0 0 50px rgba(239, 68, 68, 0.65)';
  } else if (currentSec <= criticalSec) {
    timerColor = '#f97316'; // Orange Urgent
    timerShadow = '0 0 45px rgba(249, 115, 22, 0.55)';
  } else if (currentSec <= warningSec) {
    timerColor = '#f59e0b'; // Amber Warning
    timerShadow = '0 0 40px rgba(245, 158, 11, 0.45)';
  } else if (timerState.status === 'paused') {
    timerColor = '#94a3b8';
    timerShadow = 'none';
  }

  // Calculate elapsed progress percentage
  const totalDuration = Math.max(1, timerState.durationSec);
  const progressPercent = isOvertime
    ? 100
    : Math.min(100, Math.max(0, Math.round(((totalDuration - Math.max(0, currentSec)) / totalDuration) * 100)));

  const promptText = timerState.promptMessage || '';
  const promptScrollDuration = Math.max(10, Math.round(promptText.length * 0.35));

  const nextProgramText = nextSlot
    ? `Next program: ${nextSlot.title}${nextSlot.speaker ? ` (${nextSlot.speaker})` : ''} • ${Math.round(nextSlot.durationSec / 60)} min`
    : '';
  const nextProgramScrollDuration = Math.max(12, Math.round(nextProgramText.length * 0.3));

  // If overlay mode (for vMix/OBS alpha capture)
  if (isOverlay) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '2.5rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Compact overlay timer badge */}
        <div style={{
          background: 'rgba(10, 14, 23, 0.92)',
          backdropFilter: 'blur(16px)',
          border: `2px solid ${timerColor}`,
          borderRadius: '16px',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          boxShadow: timerShadow,
          animation: isOvertime ? 'timerPulse 1.2s infinite ease-in-out' : 'none',
          marginBottom: showNextProgramBanner ? '12px' : '0',
          transition: 'margin-bottom 0.3s ease',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: timerColor,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {isOvertime ? <AlertTriangle size={13} color="#ef4444" /> : <Clock size={13} />}
              {isOvertime ? 'TIME UP • OVERTIME' : (timerState.title || (currentSlot ? currentSlot.title : 'Countdown'))}
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: 900,
              fontFamily: '"JetBrains Mono", monospace',
              color: timerColor,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatTime(absSec, true)}
            </div>
          </div>

          {timerState.status === 'paused' && (
            <span style={{
              background: '#475569',
              color: 'white',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 8px',
              borderRadius: '6px'
            }}>
              PAUSED
            </span>
          )}
        </div>

        {/* Sliding Next Program Ticker in Overlay */}
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: showNextProgramBanner
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(180%)',
          transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 110,
          pointerEvents: 'none',
          width: 'min(640px, 92vw)',
          maxWidth: '100%',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.96), rgba(15, 23, 42, 0.98))',
            border: '2px solid #38bdf8',
            borderRadius: '14px',
            padding: '10px 18px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}>
              <FastForward size={12} /> NEXT PROGRAM
            </div>
            <div style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              fontSize: '15px',
              fontWeight: 700,
              maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            }}>
              <span
                key={nextProgramText}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  paddingLeft: '100%',
                  animation: `promptScroll ${nextProgramScrollDuration}s linear infinite`,
                  willChange: 'transform',
                }}
              >
                {nextProgramText}
              </span>
            </div>
          </div>
        </div>

        {/* Slide-below Prompt message in overlay */}
        <div style={{
          position: 'fixed',
          bottom: showNextProgramBanner ? '5rem' : '1rem',
          left: '50%',
          transform: timerState.promptVisible && timerState.promptMessage
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(200%)',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.3s ease',
          zIndex: 100,
          pointerEvents: 'none',
          width: 'min(560px, 90vw)',
          maxWidth: '100%',
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '2px solid #f59e0b',
            borderRadius: '14px',
            padding: '12px 20px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '18px',
            fontWeight: 800,
            overflow: 'hidden',
          }}>
            <Bell size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
            }}>
              <span
                key={timerState.promptMessage}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  paddingLeft: '100%',
                  animation: `promptScroll ${promptScrollDuration}s linear infinite`,
                  willChange: 'transform',
                }}
              >
                {timerState.promptMessage}
              </span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes timerPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(0.995); }
          }
          @keyframes promptScroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>
    );
  }

  // Full-screen Stage & Confidence Monitor Mode
  return (
    <div
      className={`display-canvas-root ${isMouseIdle ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#05070c',
        backgroundImage: isOvertime
          ? 'radial-gradient(ellipse at center, rgba(153, 27, 27, 0.28) 0%, rgba(5, 7, 12, 1) 75%)'
          : 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.65) 0%, rgba(5, 7, 12, 1) 85%)',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2.25rem 3.5rem',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Floating HUD Controls with On-Screen Font Size Controller */}
      <div className={`display-hud-controls ${showControls ? 'visible' : ''}`}>
        {/* On-Screen Font Size Quick Adjuster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderRight: '1px solid rgba(255, 255, 255, 0.15)', paddingRight: '8px' }}>
          <button
            className="display-hud-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleAdjustFontSize(-15);
            }}
            title="Decrease Font Size (-)"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Minus size={12} /> A
          </button>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#38bdf8',
              padding: '0 4px',
              fontVariantNumeric: 'tabular-nums',
              minWidth: '38px',
              textAlign: 'center',
            }}
            title="Current Font Scale"
          >
            {currentScale}%
          </span>

          <button
            className="display-hud-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleAdjustFontSize(15);
            }}
            title="Increase Font Size (+)"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <Plus size={12} /> A
          </button>

          {/* Quick scale preset buttons */}
          {[100, 150, 200].map((preset) => (
            <button
              key={preset}
              className="display-hud-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSetFontSize(preset);
              }}
              style={{
                padding: '3px 7px',
                fontSize: '10px',
                background: currentScale === preset ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                borderColor: currentScale === preset ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
              }}
              title={`Set font size to ${preset}%`}
            >
              {preset}%
            </button>
          ))}
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

      {/* Center Hero Countdown & Overtime Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
        width: '100%',
      }}>
        {/* Prominent Overtime Alert Badge (Shown only when overtime) */}
        {isOvertime && (
          <div style={{
            background: '#dc2626',
            color: '#ffffff',
            padding: '10px 32px',
            borderRadius: '999px',
            fontSize: `clamp(18px, ${2.5 * Math.min(1.4, (timerState.fontSizeScale || 100) / 100)}vw, 32px)`,
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 0 40px rgba(220, 38, 38, 0.8)',
            animation: 'timerStrobe 1s infinite alternate ease-in-out',
          }}>
            <AlertTriangle size={28} />
            TIME UP — OVERTIME
          </div>
        )}

        {/* GIANT COUNTDOWN DIGITS */}
        {(() => {
          const fontScale = (timerState.fontSizeScale || 100) / 100;
          return (
            <div style={{
              fontSize: `clamp(${Math.round(80 * fontScale)}px, ${20 * fontScale}vw, ${Math.round(280 * fontScale)}px)`,
              fontWeight: 900,
              fontFamily: '"JetBrains Mono", "Inter", monospace',
              color: timerColor,
              lineHeight: 0.92,
              letterSpacing: '-0.04em',
              textShadow: timerShadow,
              fontVariantNumeric: 'tabular-nums',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'color 0.3s ease, font-size 0.25s ease',
              textAlign: 'center',
            }}>
              {formatTime(absSec, true)}
            </div>
          );
        })()}

        {/* Status Subtitle / Target details (Stats) */}
        {/*
        <div style={{
          marginTop: '1.75rem',
          fontSize: '15px',
          fontWeight: 600,
          color: '#64748b',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <span>Initial: {Math.round(timerState.durationSec / 60)} min</span>
          <span>•</span>
          <span>Elapsed: {progressPercent}%</span>
          {timerState.targetEndTime && timerState.status === 'running' && (
            <>
              <span>•</span>
              <span>Target: {new Date(timerState.targetEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
        </div>
        */}

        {/* Elegant Linear Progress Bar */}
        <div style={{
          width: 'min(920px, 88vw)',
          height: `${Math.round(10 * Math.min(1.6, Math.max(0.8, (timerState.fontSizeScale || 100) / 100)))}px`,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          marginTop: '2.5rem',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: isOvertime
              ? 'linear-gradient(90deg, #dc2626, #ef4444)'
              : 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
            borderRadius: '999px',
            transition: 'width 0.3s linear',
            boxShadow: `0 0 12px ${timerColor}`,
          }} />
        </div>
      </div>
      {/* <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        color: '#64748b',
        fontSize: '13px',
        fontWeight: 600,
      }}>
        <span>EasyPresenter Studio Timer Display</span>
        {hasMultipleSlots && (
          <span>Program Slot {activeSlotIndex + 1} of {slots.length}</span>
        )}
        <span>Confidence Monitor Feed • Real-Time Zero Drift Sync</span>
      </div> */}

      {/* SLIDING NEXT PROGRAM BANNER (Bottom of the view page when time is up) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 2rem 2rem 2rem',
        transform: showNextProgramBanner
          ? 'translateY(0)'
          : 'translateY(140%)',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 900,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 'min(980px, 94vw)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.97), rgba(30, 27, 75, 0.98))',
          backdropFilter: 'blur(25px)',
          border: '2px solid #38bdf8',
          borderRadius: '20px',
          padding: '1.25rem 2.25rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(56, 189, 248, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          color: '#ffffff',
          overflow: 'hidden',
          animation: 'bannerPulse 2s infinite ease-in-out',
        }}>
          {/* Left Attention Badge */}
          <div style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
            boxShadow: '0 0 15px rgba(2, 132, 199, 0.6)',
          }}>
            <FastForward size={20} color="#ffffff" />
            <span style={{
              fontSize: '13px',
              fontWeight: 900,
              letterSpacing: '0.12em',
              color: '#ffffff',
              textTransform: 'uppercase',
            }}>
              NEXT PROGRAM
            </span>
          </div>

          {/* Marquee Next Program Content */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#f8fafc',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              width: '100%',
              maskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 2%, black 98%, transparent 100%)',
            }}>
              <span
                key={nextProgramText}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  paddingLeft: '100%',
                  animation: `promptScroll ${nextProgramScrollDuration}s linear infinite`,
                  willChange: 'transform',
                }}
              >
                {nextProgramText}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#38bdf8',
            fontSize: '14px',
            fontWeight: 800,
            flexShrink: 0,
            background: 'rgba(56, 189, 248, 0.12)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}>
            <Sparkles size={16} />
            <span>STANDBY</span>
          </div>
        </div>
      </div>

      {/* SLIDE-BELOW PROMPT MESSAGE BANNER (Manual Operator Messages) */}
      <div style={{
        position: 'fixed',
        bottom: showNextProgramBanner ? '6.5rem' : '0',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 2rem 2rem 2rem',
        transform: timerState.promptVisible && timerState.promptMessage
          ? 'translateY(0)'
          : 'translateY(160%)',
        transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), bottom 0.4s ease',
        zIndex: 1000,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 'min(900px, 92vw)',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.97))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(245, 158, 11, 0.7)',
          borderRadius: '18px',
          padding: '1.25rem 2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          color: '#ffffff',
          overflow: 'hidden',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)'
          }}>
            <MessageSquare size={24} color="#ffffff" />
          </div>

          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.15em',
              color: '#f59e0b',
              textTransform: 'uppercase',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              STAGE PROMPT MESSAGE
            </div>
            <div style={{
              fontSize: 'clamp(20px, 2.8vw, 34px)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              width: '100%',
              maskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
            }}>
              <span
                key={timerState.promptMessage}
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  paddingLeft: '100%',
                  animation: `promptScroll ${promptScrollDuration}s linear infinite`,
                  willChange: 'transform',
                }}
              >
                {timerState.promptMessage}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for subtle strobe, marquee & pulse animations */}
      <style>{`
        @keyframes timerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.995); }
        }
        @keyframes timerStrobe {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.03); filter: brightness(1.18); }
        }
        @keyframes bannerPulse {
          0%, 100% { border-color: #38bdf8; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(56, 189, 248, 0.35); }
          50% { border-color: #f59e0b; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.95), 0 0 40px rgba(245, 158, 11, 0.45); }
        }
        @keyframes promptScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};
