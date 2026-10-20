import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from '../types';
import { getSlideReadableText } from '../utils/mediaPresentationParser';
import { Clock, Mic2, Maximize2, Minimize2 } from 'lucide-react';

interface StageViewProps {
  state: AppState;
  progress: number;
}

export const StageView: React.FC<StageViewProps> = ({ state, progress }) => {
  const [timeStr, setTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isMouseIdle, setIsMouseIdle] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const currentLine = getSlideReadableText(state.lines[state.cur] || '');
  const nextLine = getSlideReadableText(state.lines[state.cur + 1] || '');

  return (
    <div
      className={`display-canvas-root ${isMouseIdle ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onDoubleClick={toggleFullscreen}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000000',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        padding: '2rem 3rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Floating HUD Controls */}
      <div className={`display-hud-controls ${showControls ? 'visible' : ''}`}>
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

      {/* Alert Banner if active */}
      {state.liveState.quickAlert && (
        <div style={{
          background: '#ef4444',
          color: 'white',
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '1rem',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.6)'
        }}>
          ⚠️ {state.liveState.quickAlert}
        </div>
      )}

      {/* Top Header: Title, Slide Index, Clock */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#3b82f6',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Mic2 size={15} /> STAGE MONITOR
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>
            {state.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#f59e0b' }}>
            Slide {state.cur + 1} of {state.lines.length}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '24px',
            fontWeight: 800,
            color: '#38bdf8',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <Clock size={20} />
            {timeStr}
          </div>
        </div>
      </div>

      {/* Center: Current Line (High Contrast, Big) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem 0',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#38bdf8',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '1rem',
        }}>
          Current Line (On Screen):
        </div>
        <div style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.35,
          color: state.liveState.isClearText ? '#64748b' : '#ffffff',
          whiteSpace: 'pre-line',
          wordBreak: 'break-word',
        }}>
          {state.liveState.isClearText ? '(Screen Text Cleared)' : currentLine}
        </div>
      </div>

      {/* Bottom: Next Line Preview + Timer Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '1.25rem 1.75rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Next Slide:
          </span>
          {state.playing && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>
              Auto-advancing ({Math.round(progress * 100)}%)
            </span>
          )}
        </div>
        <div style={{
          fontSize: 'clamp(20px, 3vw, 32px)',
          fontWeight: 600,
          color: '#94a3b8',
          lineHeight: 1.4,
          whiteSpace: 'pre-line',
        }}>
          {nextLine || '(End of current song/scripture)'}
        </div>

        {/* Progress bar */}
        {state.playing && (
          <div style={{
            height: '6px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            marginTop: '1rem',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.round(progress * 100)}%`,
              background: '#f59e0b',
            }} />
          </div>
        )}
      </div>
    </div>
  );
};

