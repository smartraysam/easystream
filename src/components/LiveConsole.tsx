import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Clock, 
  Activity,
  Check,
  BookOpen
} from 'lucide-react';
import { AppState } from '../types';

interface LiveConsoleProps {
  state: AppState;
  progress: number;
  onJumpTo: (index: number) => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSetWpm: (wpm: number) => void;
  onSetLines: (title: string, subtitle: string, lines: string[], category?: AppState['category']) => void;
  onOpenScriptures?: () => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  state,
  progress,
  onJumpTo,
  onTogglePlay,
  onRestart,
  onSetWpm,
  onSetLines,
  onOpenScriptures,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(state.title);
  const [editSubtitle, setEditSubtitle] = useState(state.subtitle || '');
  const [editText, setEditText] = useState(state.lines.join('\n'));

  // Keep editor state in sync when state item changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(state.title);
      setEditSubtitle(state.subtitle || '');
      setEditText(state.lines.join('\n'));
    }
  }, [state.title, state.subtitle, state.lines, isEditing]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowRight' || e.code === 'PageDown') {
        e.preventDefault();
        if (state.cur + 1 < state.lines.length) {
          onJumpTo(state.cur + 1);
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'PageUp') {
        e.preventDefault();
        if (state.cur > 0) {
          onJumpTo(state.cur - 1);
        }
      } else if (e.code === 'Home') {
        e.preventDefault();
        onJumpTo(0);
      } else if (e.code === 'End') {
        e.preventDefault();
        onJumpTo(state.lines.length - 1);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        onRestart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.cur, state.lines.length, onTogglePlay, onJumpTo, onRestart]);

  const handleApplyEdit = () => {
    const lines = editText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      alert('Please enter at least one line of text.');
      return;
    }

    onSetLines(editTitle, editSubtitle, lines, state.category);
    setIsEditing(false);
  };

  // Helper for line duration estimation
  const currentLineText = state.lines[state.cur] || '';
  const wordCount = currentLineText.trim().split(/\s+/).filter(Boolean).length || 1;
  const estimatedSeconds = ((Math.max(2500, Math.round((wordCount / state.wpm) * 60000) + 700)) / 1000).toFixed(1);

  // Compute live preview CSS style
  const theme = state.theme;
  const isPanic = state.liveState.isBlackout || state.liveState.isClearText || state.liveState.isLogo;
  const isScriptureCategory =
    state.category === 'scripture' ||
    /\b(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalm|Psalms|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)\b/i.test(
      state.title
    );

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      background: 'var(--bg-main)',
    }}>
      {/* Top Bar: Now Playing Info & Actions */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(17, 22, 34, 0.75)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                {state.title}
              </h1>
              {state.subtitle && (
                <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                  {state.subtitle}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Slide {state.cur + 1} of {state.lines.length} &middot; {state.playing ? 'Auto-advancing' : 'Manual / Paused'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenScriptures && (
            <button
              className="btn"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                background: 'rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontWeight: 700,
                gap: '6px',
              }}
              onClick={onOpenScriptures}
              title="Quick Scripture Lookup & Projection (F3 or Alt+B)"
            >
              <BookOpen size={13} color="#f59e0b" />
              Quick Scripture (F3)
            </button>
          )}

          <button
            className="btn"
            style={{ fontSize: '12px', padding: '6px 12px' }}
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={13} />
            {isEditing ? 'Close Editor' : 'Edit Slides'}
          </button>
        </div>
      </div>

      {/* Editor Drawer (if open) */}
      {isEditing && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Title / Scripture Reference</label>
              <input
                type="text"
                className="form-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="e.g. Psalm 23 or Amazing Grace"
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subtitle / Description</label>
              <input
                type="text"
                className="form-input"
                value={editSubtitle}
                onChange={e => setEditSubtitle(e.target.value)}
                placeholder="e.g. NIV or Stanzas 1-4"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">
              <span>Slide Lines (One line per screen slide)</span>
              <span style={{ color: '#94a3b8' }}>{editText.split('\n').filter(Boolean).length} slides</span>
            </label>
            <textarea
              className="form-textarea"
              style={{ height: '110px', fontSize: '13px', lineHeight: '1.6' }}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="Enter slide lines here..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button className="btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApplyEdit}>
              <Check size={13} />
              Apply & Update Live
            </button>
          </div>
        </div>
      )}

      {/* Live Monitor Preview Section */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(9, 13, 20, 0.6)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}>
        {/* Aspect 16:9 Screen Live Output Box */}
        <div
          className="live-preview-box"
          style={{
            maxWidth: '380px',
            background: state.liveState.isBlackout
              ? '#000000'
              : theme.bgType === 'solid'
              ? theme.bgColor
              : theme.bgGradient,
            border: '2px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div className="live-badge">
            LIVE ON SCREEN
          </div>

          {/* Panic State Overlays */}
          {state.liveState.isBlackout ? (
            <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em' }}>
              [ OUTPUT BLACKOUT ]
            </div>
          ) : state.liveState.isLogo ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>✝</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>EASY PRESENTER</span>
            </div>
          ) : state.liveState.isClearText ? (
            <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', fontStyle: 'italic' }}>
              (Text Cleared)
            </div>
          ) : isScriptureCategory ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '90%',
              textAlign: 'center',
            }}>
              {/* Scripture Title at Top (default, unless titlePosition === 'bottom') */}
              {theme.scripture?.showTitle !== false && state.title && theme.scripture?.titlePosition !== 'bottom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '18px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: theme.scripture?.titleFontColor || '#38bdf8',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontFamily: theme.scripture?.titleFontFamily || 'Montserrat, sans-serif'
                  }}>
                    {state.title}
                  </span>
                  <div style={{ width: '18px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}
              <div style={{
                fontFamily: theme.scripture?.bodyFontFamily || '"Playfair Display", "Merriweather", "Georgia", serif',
                fontWeight: theme.scripture?.bodyFontStyle?.includes('bold') ? 700 : 500,
                fontStyle: theme.scripture?.bodyFontStyle?.includes('italic') ? 'italic' : 'normal',
                color: theme.scripture?.bodyFontColor || '#ffffff',
                fontSize: '13px',
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {state.lines[state.cur]?.replace(/^\d+[\s:.]\s+/, '').replace(/^["“](.*)["”]$/, '$1') || '(Empty slide)'}
              </div>
              {/* Scripture Title at Bottom (only if titlePosition === 'bottom') */}
              {theme.scripture?.showTitle !== false && state.title && theme.scripture?.titlePosition === 'bottom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ width: '18px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: theme.scripture?.titleFontColor || '#38bdf8',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontFamily: theme.scripture?.titleFontFamily || 'Montserrat, sans-serif'
                  }}>
                    {state.title}
                  </span>
                  <div style={{ width: '18px', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{
              fontFamily: theme.fontFamily,
              fontWeight: theme.fontWeight,
              fontStyle: theme.fontStyle,
              textTransform: theme.textTransform,
              color: theme.textColor,
              textAlign: theme.textAlign,
              fontSize: '15px',
              lineHeight: 1.4,
              textShadow: theme.textShadow ? `0 2px 8px ${theme.shadowColor}` : 'none',
              maxWidth: '90%',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}>
              {state.lines[state.cur] || '(Empty slide)'}
            </div>
          )}

          {/* Preview Next line indicator in lower corner */}
          {theme.showNextPreview && state.lines[state.cur + 1] && !isPanic && (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '12px',
              right: '12px',
              fontSize: '9px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}>
              Next: {state.lines[state.cur + 1]}
            </div>
          )}
        </div>

        {/* Live Status & Speed Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Live Slide Content:
            </div>
            <div style={{
              fontSize: '15px',
              color: '#ffffff',
              fontWeight: 600,
              marginTop: '4px',
              lineHeight: 1.4,
              maxHeight: '44px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              "{state.lines[state.cur] || ''}"
            </div>
            {state.lines[state.cur + 1] && (
              <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginTop: '3px' }}>
                Next up: {state.lines[state.cur + 1]}
              </div>
            )}
          </div>

          {/* Reading Speed Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#f59e0b" />
              Reading Speed:
            </span>
            <div style={{ flex: 1, maxWidth: '200px' }} className="slider-container">
              <input
                type="range"
                className="custom-slider"
                min="60"
                max="260"
                step="5"
                value={state.wpm}
                onChange={e => onSetWpm(+e.target.value)}
              />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', minWidth: '60px' }}>
              {state.wpm} WPM
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              (~{estimatedSeconds}s / slide)
            </span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Grid (Clickable Slide Cards) */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '12px',
        alignContent: 'start',
      }}>
        {state.lines.map((line, idx) => {
          const isActive = idx === state.cur;
          return (
            <div
              key={idx}
              className={`slide-tile ${isActive ? 'active' : ''}`}
              onClick={() => onJumpTo(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="slide-index-badge">
                  {idx + 1}
                </span>
                {isActive && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#38bdf8',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Activity size={12} /> ON AIR
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '13px',
                color: isActive ? '#ffffff' : '#cbd5e1',
                lineHeight: 1.5,
                fontWeight: isActive ? 600 : 400,
                minHeight: '40px',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {line}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Transport Playback Bar */}
      <div style={{
        padding: '12px 20px',
        background: 'rgba(17, 22, 34, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Left: Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, maxWidth: '280px' }}>
          <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(progress * 100)}%`,
                background: 'linear-gradient(90deg, #3b82f6, #38bdf8)',
                borderRadius: '3px',
                transition: state.playing ? 'none' : 'width 0.2s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', minWidth: '34px', fontWeight: 600 }}>
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Center: Main Transport Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-icon"
            onClick={onRestart}
            title="Restart from beginning (R)"
            style={{ width: '38px', height: '38px', borderRadius: '50%' }}
          >
            <RotateCcw size={16} />
          </button>

          <button
            className="btn btn-icon"
            onClick={() => onJumpTo(state.cur - 1)}
            disabled={state.cur === 0}
            title="Previous Slide (Left Arrow)"
            style={{ width: '38px', height: '38px', borderRadius: '50%' }}
          >
            <ChevronLeft size={18} />
          </button>

          <button
            className="btn"
            onClick={onTogglePlay}
            title="Play / Pause Auto Advance (Spacebar)"
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: state.playing ? '#f59e0b' : '#3b82f6',
              color: state.playing ? '#0f172a' : '#ffffff',
              boxShadow: state.playing ? '0 0 16px rgba(245, 158, 11, 0.4)' : '0 0 16px rgba(59, 130, 246, 0.4)',
              padding: 0,
            }}
          >
            {state.playing ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
          </button>

          <button
            className="btn btn-icon"
            onClick={() => onJumpTo(state.cur + 1)}
            disabled={state.cur === state.lines.length - 1}
            title="Next Slide (Right Arrow)"
            style={{ width: '38px', height: '38px', borderRadius: '50%' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right: Keyboard Shortcuts Hint */}
        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
          <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '3px', color: '#94a3b8' }}>Space</kbd> Play</span>
          <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '3px', color: '#94a3b8' }}>← →</kbd> Jump</span>
        </div>
      </div>
    </main>
  );
};
