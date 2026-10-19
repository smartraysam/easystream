import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Music2, 
  Tv, 
  X, 
  RotateCcw, 
  Check, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Minus, 
  Plus, 
  Eye, 
  EyeOff,
  Sparkles,
  ArrowUp,
  MoveVertical,
  ArrowDown,
  Layout,
  Tv2
} from 'lucide-react';
import { 
  PresentationTheme, 
  PresenterLayout,
  ScriptureFormatting, 
  LyricsFormatting, 
  TextFontStyle, 
  TextAlignment, 
  VerticalAlignment,
  TimerState 
} from '../types';
import { DEFAULT_SCRIPTURE_FORMATTING, DEFAULT_LYRICS_FORMATTING } from '../data/defaults';

interface FormatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: PresentationTheme;
  timerState?: TimerState;
  onUpdateTheme: (theme: Partial<PresentationTheme>) => void;
  onSetTimerConfig?: (config: Partial<TimerState>) => void;
  initialTab?: 'scripture' | 'lyrics' | 'layout' | 'general';
  activeCategory?: 'scripture' | 'song' | 'hymn' | 'announcement' | 'custom';
  sampleTitle?: string;
  sampleVerse?: string;
}

export const FONT_OPTIONS = [
  { label: 'Montserrat', sublabel: 'Modern Sans-Serif', value: 'Montserrat, sans-serif' },
  { label: 'Playfair Display', sublabel: 'Classic Editorial Serif', value: '"Playfair Display", Georgia, serif' },
  { label: 'Outfit', sublabel: 'Geometric Sans', value: 'Outfit, sans-serif' },
  { label: 'Inter', sublabel: 'Clean Display', value: 'Inter, sans-serif' },
  { label: 'Cinzel', sublabel: 'Majestic Stone Serif', value: 'Cinzel, serif' },
  { label: 'Oswald', sublabel: 'Tall Condensed Impact', value: 'Oswald, sans-serif' },
  { label: 'Georgia', sublabel: 'Warm Literary Serif', value: 'Georgia, serif' },
  { label: 'JetBrains Mono', sublabel: 'Modern Technical Mono', value: '"JetBrains Mono", monospace' },
];

const PRESET_COLORS = [
  '#ffffff', // Pure White
  '#f8fafc', // Slate White
  '#fed7aa', // Warm Gold/Cream
  '#fef08a', // Soft Amber Yellow
  '#38bdf8', // Sky Blue / Cyan
  '#60a5fa', // Soft Blue
  '#34d399', // Emerald Mint
  '#a78bfa', // Lavender Purple
  '#f43f5e', // Rose Coral
  '#f59e0b', // Radiant Amber
  '#94a3b8', // Muted Silver
  '#e2e8f0', // Crisp Platinum
];

export const FormatSettingsModal: React.FC<FormatSettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  timerState,
  onUpdateTheme,
  onSetTimerConfig,
  initialTab = 'scripture',
  sampleTitle,
  sampleVerse,
}) => {
  const [activeTab, setActiveTab] = useState<'scripture' | 'lyrics' | 'layout' | 'general'>(initialTab);

  // Update active tab when initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active Scripture settings with safe defaults
  const scripture: ScriptureFormatting = {
    ...DEFAULT_SCRIPTURE_FORMATTING,
    ...(theme.scripture || {}),
  };

  // Active Lyrics settings with safe defaults
  const lyrics: LyricsFormatting = {
    ...DEFAULT_LYRICS_FORMATTING,
    ...(theme.lyrics || {}),
  };

  // Active Layout with safe defaults
  const currentLayout: PresenterLayout =
    theme.presenterLayout ||
    (localStorage.getItem('easypresenter_workspace_layout') as PresenterLayout) ||
    'easyworship';

  const handleSelectLayout = (layout: PresenterLayout) => {
    localStorage.setItem('easypresenter_workspace_layout', layout);
    onUpdateTheme({ presenterLayout: layout });
    const isV2Path = window.location.pathname.startsWith('/v2');
    if (layout === 'classic' && isV2Path) {
      window.location.href = '/';
    } else if ((layout === 'easyworship' || layout === 'quickdeck') && !isV2Path && window.location.pathname === '/') {
      window.location.href = '/v2';
    }
  };

  // Updaters
  const updateScripture = (patch: Partial<ScriptureFormatting>) => {
    onUpdateTheme({
      scripture: {
        ...scripture,
        ...patch,
      },
    });
  };

  const updateLyrics = (patch: Partial<LyricsFormatting>) => {
    onUpdateTheme({
      lyrics: {
        ...lyrics,
        ...patch,
      },
    });
  };

  const resetCurrentTabDefaults = () => {
    if (activeTab === 'scripture') {
      onUpdateTheme({ scripture: DEFAULT_SCRIPTURE_FORMATTING });
    } else if (activeTab === 'lyrics') {
      onUpdateTheme({ lyrics: DEFAULT_LYRICS_FORMATTING });
    } else if (activeTab === 'layout') {
      handleSelectLayout('easyworship');
    } else if (activeTab === 'general') {
      onSetTimerConfig?.({ fontSizeScale: 100 });
      onUpdateTheme({
        fontSize: 44,
        fontFamily: 'Montserrat, sans-serif',
        textAlign: 'center',
        verticalAlign: 'center',
      });
    }
  };

  // Display sample text in preview
  let previewScriptureTitle = sampleTitle || 'Luke 12:1';
  let previewScriptureBody = sampleVerse || 'Meanwhile, when a crowd of many thousands had gathered, so that they were trampling on one another, Jesus began to speak first to his disciples: "Be on your guard against the yeast of the Pharisees, which is hypocrisy."';

  if (previewScriptureBody) {
    const parts = previewScriptureBody.split(/\n\s*\n/);
    if (parts.length > 1) {
      const first = parts[0].trim();
      const last = parts[parts.length - 1].trim();
      const looksLikeRef = (s: string) =>
        /^[1-3]?\s*[A-Za-z\s]+\s+\d+(?::\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?$/i.test(s) ||
        /^[1-3]?\s*[A-Za-z\s]+\s*\([A-Z0-9\s]+\)$/i.test(s) ||
        s.startsWith('—') ||
        s.startsWith('-');
      if (looksLikeRef(first) && first.length < 60) {
        previewScriptureTitle = first.replace(/^[—\-]\s*/, '').trim();
        previewScriptureBody = parts.slice(1).join('\n\n').trim();
      } else if (looksLikeRef(last) && last.length < 60) {
        previewScriptureTitle = last.replace(/^[—\-]\s*/, '').trim();
        previewScriptureBody = parts.slice(0, -1).join('\n\n').trim();
      }
    }
    previewScriptureBody = previewScriptureBody.replace(/\s+(?:[1-3]?\s*[A-Z][a-z]+(?:\s+\d+:\d+(?:-\d+)?)?(?:\s*\([A-Z0-9\s]+\))?)$/i, '').trim();
    previewScriptureBody = previewScriptureBody.replace(/^[“"']+|[”"']+$/g, '').trim();
  }

  const previewLyricsTitle = sampleTitle || 'Amazing Grace';
  const previewLyricsBody = sampleVerse || 'Amazing grace! how sweet the sound\nThat saved a wretch like me!\nI once was lost, but now am found,\nWas blind, but now I see.';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          background: 'linear-gradient(150deg, #0f172a 0%, #090e17 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ============================================================ */}
        {/* MODAL HEADER                                                  */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
              }}
            >
              <Sliders size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Formatting & Typography Settings
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Independent font, size, color, title visibility, and screen placement for Scriptures & Lyrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close (Esc)"
          >
            <X size={17} />
          </button>
        </div>

        {/* ============================================================ */}
        {/* TABS NAVIGATION                                              */}
        {/* ============================================================ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <button
            onClick={() => setActiveTab('scripture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              border: activeTab === 'scripture' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'scripture'
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'scripture' ? '#38bdf8' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'scripture' ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
            }}
          >
            <BookOpen size={15} />
            <span>Scripture Formatting</span>
          </button>

          <button
            id="settings-tab-lyrics"
            onClick={() => setActiveTab('lyrics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              border: activeTab === 'lyrics' ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'lyrics'
                ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'lyrics' ? '#c084fc' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'lyrics' ? '0 0 16px rgba(167, 139, 250, 0.25)' : 'none',
            }}
          >
            <Music2 size={15} />
            <span>Lyrics & Songs</span>
          </button>

          <button
            id="settings-tab-layout"
            onClick={() => setActiveTab('layout')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              border: activeTab === 'layout' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'layout'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'layout' ? '#34d399' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'layout' ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
            }}
          >
            <Layout size={15} />
            <span>Workspace Layout</span>
          </button>

          <button
            id="settings-tab-general"
            onClick={() => setActiveTab('general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '999px',
              border: activeTab === 'general' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activeTab === 'general'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'general' ? '#fbbf24' : '#94a3b8',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === 'general' ? '0 0 16px rgba(245, 158, 11, 0.25)' : 'none',
            }}
          >
            <Tv size={15} />
            <span>Display & Timer</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MODAL SCROLLABLE CONTENT BODY                                */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            flex: 1,
          }}
        >
          {/* ========================================================== */}
          {/* TAB 1: SCRIPTURE FORMATTING                                */}
          {/* ========================================================== */}
          {activeTab === 'scripture' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* LIVE PREVIEW BOX FOR SCRIPTURE */}
              <div
                style={{
                  background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(56, 189, 248, 0.3)',
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: scripture.verticalAlign === 'top' ? 'flex-start' : scripture.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  minHeight: '170px',
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.7), 0 8px 25px rgba(0, 0, 0, 0.6)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Sparkles size={11} color="#38bdf8" />
                  <span>Scripture Broadcast Live Preview</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: scripture.textAlign === 'left' ? 'flex-start' : scripture.textAlign === 'right' ? 'flex-end' : 'center',
                    textAlign: scripture.textAlign,
                    width: '100%',
                    paddingTop: scripture.verticalAlign === 'top' ? '18px' : '0',
                    paddingBottom: scripture.verticalAlign === 'bottom' ? '12px' : '0',
                    gap: '10px',
                  }}
                >
                  {/* Scripture Title in Preview at Top (default) */}
                  {scripture.showTitle && scripture.titlePosition !== 'bottom' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        justifyContent: scripture.textAlign === 'left' ? 'flex-start' : scripture.textAlign === 'right' ? 'flex-end' : 'center',
                        width: '100%',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ width: '40px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                      <span
                        style={{
                          fontFamily: scripture.titleFontFamily,
                          fontSize: `${Math.round(scripture.titleFontSize * 0.48)}px`,
                          color: scripture.titleFontColor,
                          fontWeight: scripture.titleFontStyle.includes('bold') ? 800 : 500,
                          fontStyle: scripture.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                        }}
                      >
                        {previewScriptureTitle}
                      </span>
                      <div style={{ width: '40px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                    </div>
                  )}

                  {/* Scripture Body in Preview */}
                  <div
                    style={{
                      fontFamily: scripture.bodyFontFamily,
                      fontSize: `${Math.round(scripture.bodyFontSize * 0.38)}px`,
                      color: scripture.bodyFontColor,
                      fontWeight: scripture.bodyFontStyle.includes('bold') ? 700 : 500,
                      fontStyle: scripture.bodyFontStyle.includes('italic') ? 'italic' : 'normal',
                      lineHeight: 1.4,
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
                      maxWidth: '92%',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    "{previewScriptureBody}"
                  </div>

                  {/* Scripture Title in Preview at Bottom (only if titlePosition === 'bottom') */}
                  {scripture.showTitle && scripture.titlePosition === 'bottom' && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        justifyContent: scripture.textAlign === 'left' ? 'flex-start' : scripture.textAlign === 'right' ? 'flex-end' : 'center',
                        width: '100%',
                        marginTop: '6px',
                      }}
                    >
                      <div style={{ width: '40px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                      <span
                        style={{
                          fontFamily: scripture.titleFontFamily,
                          fontSize: `${Math.round(scripture.titleFontSize * 0.48)}px`,
                          color: scripture.titleFontColor,
                          fontWeight: scripture.titleFontStyle.includes('bold') ? 800 : 500,
                          fontStyle: scripture.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                        }}
                      >
                        {previewScriptureTitle}
                      </span>
                      <div style={{ width: '40px', height: '1.5px', background: 'rgba(255, 255, 255, 0.25)' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 1. SCRIPTURE TITLE (CITATION: e.g. Luke 12:1) SECTION  */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {/* Section Header & Hide/Show Title Option */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingBottom: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Scripture Title / Reference (e.g. Luke 12:1)
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Configure visibility, individual font size, family, color, and style
                    </p>
                  </div>

                  {/* Toggle Option to Hide or Show Title */}
                  <button
                    onClick={() => updateScripture({ showTitle: !scripture.showTitle })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: scripture.showTitle ? 'rgba(56, 189, 248, 0.18)' : 'rgba(239, 68, 68, 0.15)',
                      border: scripture.showTitle ? '1px solid #38bdf8' : '1px solid rgba(239, 68, 68, 0.4)',
                      color: scripture.showTitle ? '#38bdf8' : '#f87171',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {scripture.showTitle ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{scripture.showTitle ? 'Title: Visible' : 'Title: Hidden'}</span>
                  </button>
                </div>

                {scripture.showTitle ? (
                  <>
                    {/* Title Position on Display (Top vs Bottom) */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        Title Position
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', maxWidth: '340px' }}>
                        <button
                          onClick={() => updateScripture({ titlePosition: 'top' })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: scripture.titlePosition !== 'bottom' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: scripture.titlePosition !== 'bottom' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: scripture.titlePosition !== 'bottom' ? '#38bdf8' : '#cbd5e1',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ArrowUp size={13} />
                          <span>Top (Header)</span>
                        </button>
                        <button
                          onClick={() => updateScripture({ titlePosition: 'bottom' })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: scripture.titlePosition === 'bottom' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: scripture.titlePosition === 'bottom' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: scripture.titlePosition === 'bottom' ? '#38bdf8' : '#cbd5e1',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <ArrowDown size={13} />
                          <span>Bottom (Footer)</span>
                        </button>
                      </div>
                    </div>

                    {/* Title Font Family */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        Title Font Family
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
                        {FONT_OPTIONS.map((f) => {
                          const isSel = scripture.titleFontFamily === f.value;
                          return (
                            <button
                              key={f.value}
                              onClick={() => updateScripture({ titleFontFamily: f.value })}
                              style={{
                                textAlign: 'left',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: isSel ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.07)',
                                color: isSel ? '#38bdf8' : '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <div style={{ fontFamily: f.value, fontSize: '12px', fontWeight: 700 }}>{f.label}</div>
                                <div style={{ fontSize: '9px', color: '#64748b' }}>{f.sublabel}</div>
                              </div>
                              {isSel && <Check size={12} color="#38bdf8" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title Font Size & Presets */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Title Font Size
                        </label>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', padding: '2px 8px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '4px' }}>
                          {scripture.titleFontSize} px
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <button
                          onClick={() => updateScripture({ titleFontSize: Math.max(16, scripture.titleFontSize - 2) })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="range"
                          min="16"
                          max="64"
                          step="2"
                          value={scripture.titleFontSize}
                          onChange={(e) => updateScripture({ titleFontSize: Number(e.target.value) })}
                          style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                        />
                        <button
                          onClick={() => updateScripture({ titleFontSize: Math.min(64, scripture.titleFontSize + 2) })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      {/* Presets */}
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {[20, 24, 28, 32, 36, 44].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateScripture({ titleFontSize: sz })}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              background: scripture.titleFontSize === sz ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: scripture.titleFontSize === sz ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: scripture.titleFontSize === sz ? '#38bdf8' : '#cbd5e1',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title Color & Style Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Title Font Color */}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                          Title Color
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="color"
                            value={scripture.titleFontColor}
                            onChange={(e) => updateScripture({ titleFontColor: e.target.value })}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              background: 'transparent',
                              padding: 0,
                            }}
                          />
                          <input
                            type="text"
                            value={scripture.titleFontColor}
                            onChange={(e) => updateScripture({ titleFontColor: e.target.value })}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateScripture({ titleFontColor: c })}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                background: c,
                                border: scripture.titleFontColor.toLowerCase() === c.toLowerCase() ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                              }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Title Font Style */}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                          Title Style
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {(['normal', 'italic', 'bold', 'bold-italic'] as TextFontStyle[]).map((st) => {
                            const isSel = scripture.titleFontStyle === st;
                            return (
                              <button
                                key={st}
                                onClick={() => updateScripture({ titleFontStyle: st })}
                                style={{
                                  padding: '7px 8px',
                                  borderRadius: '6px',
                                  background: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                  border: isSel ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                                  color: isSel ? '#38bdf8' : '#cbd5e1',
                                  fontSize: '11px',
                                  fontWeight: st.includes('bold') ? 800 : 500,
                                  fontStyle: st.includes('italic') ? 'italic' : 'normal',
                                  cursor: 'pointer',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {st.replace('-', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', color: '#fca5a5', fontSize: '12px' }}>
                    Title is currently hidden. Only the scripture verse body will appear on the live broadcast screen.
                  </div>
                )}
              </div>

              {/* ------------------------------------------------------ */}
              {/* 2. SCRIPTURE BODY (VERSE TEXT) SECTION                 */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Scripture Body (Verse Content)
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Configure font family, body size, color, and font style for the passage
                  </p>
                </div>

                {/* Body Font Family */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Body Font Family
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
                    {FONT_OPTIONS.map((f) => {
                      const isSel = scripture.bodyFontFamily === f.value;
                      return (
                        <button
                          key={f.value}
                          onClick={() => updateScripture({ bodyFontFamily: f.value })}
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isSel ? 'rgba(167, 139, 250, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSel ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.07)',
                            color: isSel ? '#c084fc' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: f.value, fontSize: '12px', fontWeight: 700 }}>{f.label}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{f.sublabel}</div>
                          </div>
                          {isSel && <Check size={12} color="#a78bfa" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Body Font Size & Presets */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Body Font Size
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '4px' }}>
                      {scripture.bodyFontSize} px
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <button
                      onClick={() => updateScripture({ bodyFontSize: Math.max(24, scripture.bodyFontSize - 2) })}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="range"
                      min="24"
                      max="96"
                      step="2"
                      value={scripture.bodyFontSize}
                      onChange={(e) => updateScripture({ bodyFontSize: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                    <button
                      onClick={() => updateScripture({ bodyFontSize: Math.min(96, scripture.bodyFontSize + 2) })}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  {/* Presets */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[36, 44, 52, 60, 72, 84].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => updateScripture({ bodyFontSize: sz })}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: scripture.bodyFontSize === sz ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: scripture.bodyFontSize === sz ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: scripture.bodyFontSize === sz ? '#f59e0b' : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Color & Style Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Body Font Color */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Body Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="color"
                        value={scripture.bodyFontColor}
                        onChange={(e) => updateScripture({ bodyFontColor: e.target.value })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          background: 'transparent',
                          padding: 0,
                        }}
                      />
                      <input
                        type="text"
                        value={scripture.bodyFontColor}
                        onChange={(e) => updateScripture({ bodyFontColor: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateScripture({ bodyFontColor: c })}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: c,
                            border: scripture.bodyFontColor.toLowerCase() === c.toLowerCase() ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                          }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Body Font Style */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Body Style
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {(['normal', 'italic', 'bold', 'bold-italic'] as TextFontStyle[]).map((st) => {
                        const isSel = scripture.bodyFontStyle === st;
                        return (
                          <button
                            key={st}
                            onClick={() => updateScripture({ bodyFontStyle: st })}
                            style={{
                              padding: '7px 8px',
                              borderRadius: '6px',
                              background: isSel ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#c084fc' : '#cbd5e1',
                              fontSize: '11px',
                              fontWeight: st.includes('bold') ? 800 : 500,
                              fontStyle: st.includes('italic') ? 'italic' : 'normal',
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            {st.replace('-', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 3. SCRIPTURE TEXT POSITION ON DISPLAY                  */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Text Position on Live Display
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Align scripture text horizontally and position vertically on the output screen
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Horizontal Alignment */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Horizontal Alignment
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      {[
                        { align: 'left' as TextAlignment, label: 'Left', icon: <AlignLeft size={14} /> },
                        { align: 'center' as TextAlignment, label: 'Center', icon: <AlignCenter size={14} /> },
                        { align: 'right' as TextAlignment, label: 'Right', icon: <AlignRight size={14} /> },
                      ].map((item) => {
                        const isSel = scripture.textAlign === item.align;
                        return (
                          <button
                            key={item.align}
                            onClick={() => updateScripture({ textAlign: item.align })}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#38bdf8' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertical Alignment */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Vertical Position
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      {[
                        { pos: 'top' as VerticalAlignment, label: 'Top', icon: <ArrowUp size={13} /> },
                        { pos: 'center' as VerticalAlignment, label: 'Center', icon: <MoveVertical size={13} /> },
                        { pos: 'bottom' as VerticalAlignment, label: 'Bottom', icon: <ArrowDown size={13} /> },
                      ].map((item) => {
                        const isSel = scripture.verticalAlign === item.pos;
                        return (
                          <button
                            key={item.pos}
                            onClick={() => updateScripture({ verticalAlign: item.pos })}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isSel ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#38bdf8' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: LYRICS & SONGS FORMATTING                           */}
          {/* ========================================================== */}
          {activeTab === 'lyrics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* LIVE PREVIEW BOX FOR LYRICS */}
              <div
                style={{
                  background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #020617 100%)',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(167, 139, 250, 0.35)',
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: lyrics.verticalAlign === 'top' ? 'flex-start' : lyrics.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                  minHeight: '170px',
                  boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.7), 0 8px 25px rgba(0, 0, 0, 0.6)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  <Music2 size={11} color="#c084fc" />
                  <span>Lyrics Broadcast Live Preview</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: lyrics.textAlign === 'left' ? 'flex-start' : lyrics.textAlign === 'right' ? 'flex-end' : 'center',
                    textAlign: lyrics.textAlign,
                    width: '100%',
                    paddingTop: lyrics.verticalAlign === 'top' ? '20px' : '0',
                    paddingBottom: lyrics.verticalAlign === 'bottom' ? '12px' : '0',
                    gap: '10px',
                  }}
                >
                  {/* Song Title in Preview if enabled */}
                  {lyrics.showTitle && (
                    <div
                      style={{
                        fontFamily: lyrics.titleFontFamily,
                        fontSize: `${Math.round(lyrics.titleFontSize * 0.48)}px`,
                        color: lyrics.titleFontColor,
                        fontWeight: lyrics.titleFontStyle.includes('bold') ? 800 : 600,
                        fontStyle: lyrics.titleFontStyle.includes('italic') ? 'italic' : 'normal',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.9)',
                      }}
                    >
                      {previewLyricsTitle}
                    </div>
                  )}

                  {/* Lyrics Body in Preview */}
                  <div
                    style={{
                      fontFamily: lyrics.bodyFontFamily,
                      fontSize: `${Math.round(lyrics.bodyFontSize * 0.36)}px`,
                      color: lyrics.bodyFontColor,
                      fontWeight: lyrics.bodyFontStyle.includes('bold') ? 800 : (lyrics.bodyFontWeight || 700),
                      fontStyle: lyrics.bodyFontStyle.includes('italic') ? 'italic' : 'normal',
                      textTransform: lyrics.bodyTextTransform || 'none',
                      lineHeight: 1.45,
                      textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
                      maxWidth: '92%',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {previewLyricsBody}
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 1. SONG TITLE HEADER SECTION                           */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingBottom: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      1. Song Title Banner (e.g. Amazing Grace)
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Display or hide song title header, customize font, size, and title color
                    </p>
                  </div>

                  {/* Toggle Option to Hide or Show Song Title */}
                  <button
                    onClick={() => updateLyrics({ showTitle: !lyrics.showTitle })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: lyrics.showTitle ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: lyrics.showTitle ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: lyrics.showTitle ? '#fbbf24' : '#94a3b8',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lyrics.showTitle ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>{lyrics.showTitle ? 'Song Title: Visible' : 'Song Title: Hidden'}</span>
                  </button>
                </div>

                {lyrics.showTitle && (
                  <>
                    {/* Title Font Family */}
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                        Song Title Font Family
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
                        {FONT_OPTIONS.map((f) => {
                          const isSel = lyrics.titleFontFamily === f.value;
                          return (
                            <button
                              key={f.value}
                              onClick={() => updateLyrics({ titleFontFamily: f.value })}
                              style={{
                                textAlign: 'left',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: isSel ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSel ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.07)',
                                color: isSel ? '#fbbf24' : '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div>
                                <div style={{ fontFamily: f.value, fontSize: '12px', fontWeight: 700 }}>{f.label}</div>
                                <div style={{ fontSize: '9px', color: '#64748b' }}>{f.sublabel}</div>
                              </div>
                              {isSel && <Check size={12} color="#f59e0b" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title Font Size & Presets */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Song Title Font Size
                        </label>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '4px' }}>
                          {lyrics.titleFontSize} px
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <button
                          onClick={() => updateLyrics({ titleFontSize: Math.max(16, lyrics.titleFontSize - 2) })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="range"
                          min="16"
                          max="54"
                          step="2"
                          value={lyrics.titleFontSize}
                          onChange={(e) => updateLyrics({ titleFontSize: Number(e.target.value) })}
                          style={{ flex: 1, accentColor: '#f59e0b', cursor: 'pointer' }}
                        />
                        <button
                          onClick={() => updateLyrics({ titleFontSize: Math.min(54, lyrics.titleFontSize + 2) })}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {[18, 22, 26, 30, 36, 42].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => updateLyrics({ titleFontSize: sz })}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              background: lyrics.titleFontSize === sz ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: lyrics.titleFontSize === sz ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: lyrics.titleFontSize === sz ? '#f59e0b' : '#cbd5e1',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {sz}px
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title Color & Style Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {/* Title Font Color */}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                          Title Color
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="color"
                            value={lyrics.titleFontColor}
                            onChange={(e) => updateLyrics({ titleFontColor: e.target.value })}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid rgba(255,255,255,0.2)',
                              cursor: 'pointer',
                              background: 'transparent',
                              padding: 0,
                            }}
                          />
                          <input
                            type="text"
                            value={lyrics.titleFontColor}
                            onChange={(e) => updateLyrics({ titleFontColor: e.target.value })}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => updateLyrics({ titleFontColor: c })}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                background: c,
                                border: lyrics.titleFontColor.toLowerCase() === c.toLowerCase() ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                              }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Title Font Style */}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                          Title Style
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {(['normal', 'italic', 'bold', 'bold-italic'] as TextFontStyle[]).map((st) => {
                            const isSel = lyrics.titleFontStyle === st;
                            return (
                              <button
                                key={st}
                                onClick={() => updateLyrics({ titleFontStyle: st })}
                                style={{
                                  padding: '7px 8px',
                                  borderRadius: '6px',
                                  background: isSel ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                                  border: isSel ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                                  color: isSel ? '#fbbf24' : '#cbd5e1',
                                  fontSize: '11px',
                                  fontWeight: st.includes('bold') ? 800 : 500,
                                  fontStyle: st.includes('italic') ? 'italic' : 'normal',
                                  cursor: 'pointer',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {st.replace('-', ' ')}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ------------------------------------------------------ */}
              {/* 2. LYRICS BODY (STANZAS & LINES) SECTION               */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Lyrics Body (Song Stanzas & Text)
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Configure font family, line size, colors, bold weight, and text casing
                  </p>
                </div>

                {/* Body Font Family */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                    Lyrics Font Family
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
                    {FONT_OPTIONS.map((f) => {
                      const isSel = lyrics.bodyFontFamily === f.value;
                      return (
                        <button
                          key={f.value}
                          onClick={() => updateLyrics({ bodyFontFamily: f.value })}
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: isSel ? 'rgba(167, 139, 250, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                            border: isSel ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.07)',
                            color: isSel ? '#c084fc' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: f.value, fontSize: '12px', fontWeight: 700 }}>{f.label}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{f.sublabel}</div>
                          </div>
                          {isSel && <Check size={12} color="#a78bfa" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Body Font Size & Presets */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Lyrics Font Size
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc', padding: '2px 8px', background: 'rgba(167, 139, 250, 0.15)', borderRadius: '4px' }}>
                      {lyrics.bodyFontSize} px
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <button
                      onClick={() => updateLyrics({ bodyFontSize: Math.max(24, lyrics.bodyFontSize - 2) })}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="range"
                      min="24"
                      max="96"
                      step="2"
                      value={lyrics.bodyFontSize}
                      onChange={(e) => updateLyrics({ bodyFontSize: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: '#a78bfa', cursor: 'pointer' }}
                    />
                    <button
                      onClick={() => updateLyrics({ bodyFontSize: Math.min(96, lyrics.bodyFontSize + 2) })}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {[32, 40, 48, 56, 64, 76, 88].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => updateLyrics({ bodyFontSize: sz })}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: lyrics.bodyFontSize === sz ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          border: lyrics.bodyFontSize === sz ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: lyrics.bodyFontSize === sz ? '#c084fc' : '#cbd5e1',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lyrics Color & Style Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Lyrics Color */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Lyrics Text Color
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="color"
                        value={lyrics.bodyFontColor}
                        onChange={(e) => updateLyrics({ bodyFontColor: e.target.value })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          background: 'transparent',
                          padding: 0,
                        }}
                      />
                      <input
                        type="text"
                        value={lyrics.bodyFontColor}
                        onChange={(e) => updateLyrics({ bodyFontColor: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateLyrics({ bodyFontColor: c })}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: c,
                            border: lyrics.bodyFontColor.toLowerCase() === c.toLowerCase() ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                          }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Lyrics Style & Casing */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Lyrics Style & Casing
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      {(['normal', 'italic', 'bold', 'bold-italic'] as TextFontStyle[]).map((st) => {
                        const isSel = lyrics.bodyFontStyle === st;
                        return (
                          <button
                            key={st}
                            onClick={() => updateLyrics({ bodyFontStyle: st })}
                            style={{
                              padding: '7px 8px',
                              borderRadius: '6px',
                              background: isSel ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#c084fc' : '#cbd5e1',
                              fontSize: '11px',
                              fontWeight: st.includes('bold') ? 800 : 500,
                              fontStyle: st.includes('italic') ? 'italic' : 'normal',
                              cursor: 'pointer',
                              textTransform: 'capitalize',
                            }}
                          >
                            {st.replace('-', ' ')}
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      {[
                        { val: 'none' as const, label: 'Normal' },
                        { val: 'uppercase' as const, label: 'CAPS' },
                        { val: 'capitalize' as const, label: 'Title' },
                      ].map((tf) => (
                        <button
                          key={tf.val}
                          onClick={() => updateLyrics({ bodyTextTransform: tf.val })}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '5px',
                            background: (lyrics.bodyTextTransform || 'none') === tf.val ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: (lyrics.bodyTextTransform || 'none') === tf.val ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: (lyrics.bodyTextTransform || 'none') === tf.val ? '#c084fc' : '#cbd5e1',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------ */}
              {/* 3. LYRICS TEXT POSITION ON DISPLAY                     */}
              {/* ------------------------------------------------------ */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    3. Text Position on Live Display
                  </span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                    Align song lyrics horizontally and vertically on screen
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Horizontal Alignment */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Horizontal Alignment
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      {[
                        { align: 'left' as TextAlignment, label: 'Left', icon: <AlignLeft size={14} /> },
                        { align: 'center' as TextAlignment, label: 'Center', icon: <AlignCenter size={14} /> },
                        { align: 'right' as TextAlignment, label: 'Right', icon: <AlignRight size={14} /> },
                      ].map((item) => {
                        const isSel = lyrics.textAlign === item.align;
                        return (
                          <button
                            key={item.align}
                            onClick={() => updateLyrics({ textAlign: item.align })}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isSel ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#c084fc' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vertical Position */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                      Vertical Position
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                      {[
                        { pos: 'top' as VerticalAlignment, label: 'Top', icon: <ArrowUp size={13} /> },
                        { pos: 'center' as VerticalAlignment, label: 'Center', icon: <MoveVertical size={13} /> },
                        { pos: 'bottom' as VerticalAlignment, label: 'Bottom', icon: <ArrowDown size={13} /> },
                      ].map((item) => {
                        const isSel = lyrics.verticalAlign === item.pos;
                        return (
                          <button
                            key={item.pos}
                            onClick={() => updateLyrics({ verticalAlign: item.pos })}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              background: isSel ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                              border: isSel ? '1.5px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                              color: isSel ? '#c084fc' : '#cbd5e1',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: WORKSPACE LAYOUT SWITCHER                             */}
          {/* ========================================================== */}
          {activeTab === 'layout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(14, 165, 233, 0.06) 100%)',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Layout size={18} color="#34d399" />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      Presenter Workspace Layout
                    </h3>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Instant Switch
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                    Select your preferred operator interface. You can switch between the EasyWorship dual-monitor broadcast layout and the previous streamlined stream deck at any time.
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '11.5px',
                    color: '#cbd5e1',
                  }}
                >
                  <span>Active Workspace:</span>
                  <strong style={{ color: currentLayout === 'easyworship' ? '#38bdf8' : currentLayout === 'quickdeck' ? '#c084fc' : '#f59e0b' }}>
                    {currentLayout === 'easyworship'
                      ? 'EasyWorship Dual Monitor (3-Col)'
                      : currentLayout === 'quickdeck'
                      ? 'Stream Deck (Previous UI)'
                      : 'Classic Studio 1.0'}
                  </strong>
                </div>
              </div>

              {/* Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '16px' }}>
                {/* 1. EasyWorship 3-Column */}
                <div
                  id="layout-card-easyworship"
                  onClick={() => handleSelectLayout('easyworship')}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: currentLayout === 'easyworship'
                      ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.75) 100%)'
                      : 'rgba(255, 255, 255, 0.025)',
                    border: currentLayout === 'easyworship'
                      ? '2px solid #38bdf8'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: currentLayout === 'easyworship'
                      ? '0 0 25px rgba(56, 189, 248, 0.22)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(2, 132, 199, 0.35)',
                          }}
                        >
                          <Tv2 size={20} color="#ffffff" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#ffffff' }}>
                            EasyWorship Broadcast Studio
                          </h4>
                          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                            3-Column Dual Monitors
                          </span>
                        </div>
                      </div>

                      {currentLayout === 'easyworship' ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#0284c7',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={11} /> ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          Select
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      Full broadcast workflow with resource library on the left, live cueing & preview monitor in the middle, and live broadcast monitor on the right.
                    </p>

                    {/* Mini Wireframe Mockup */}
                    <div
                      style={{
                        height: '75px',
                        background: '#090d16',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '6px',
                        display: 'flex',
                        gap: '5px',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '28%',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '3px',
                        }}
                      >
                        <div style={{ height: '6px', background: 'rgba(56, 189, 248, 0.4)', borderRadius: '2px' }} />
                        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }} />
                        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }} />
                        <span style={{ fontSize: '7.5px', color: '#38bdf8', marginTop: 'auto', fontWeight: 700 }}>LIBRARY</span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '3px',
                        }}
                      >
                        <div style={{ height: '28px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '7px', color: '#34d399', fontWeight: 800 }}>PREVIEW</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }} />
                        <span style={{ fontSize: '7.5px', color: '#34d399', marginTop: 'auto', fontWeight: 700 }}>CUE / SET</span>
                      </div>
                      <div
                        style={{
                          width: '36%',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '3px',
                        }}
                      >
                        <div style={{ height: '28px', background: '#0284c7', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 6px rgba(2, 132, 199, 0.5)' }}>
                          <span style={{ fontSize: '7px', color: '#ffffff', fontWeight: 900 }}>LIVE OUTPUT</span>
                        </div>
                        <span style={{ fontSize: '7.5px', color: '#ef4444', marginTop: 'auto', fontWeight: 800 }}>ON AIR</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#38bdf8" /> Dual live & preview monitors side-by-side
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#38bdf8" /> Integrated schedule sets, songs & scriptures
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#38bdf8" /> 1-Click "Go Live" or double-click to project
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLayout('easyworship');
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: currentLayout === 'easyworship' ? '#0284c7' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {currentLayout === 'easyworship' ? <Check size={13} /> : null}
                    <span>{currentLayout === 'easyworship' ? 'Currently Selected' : 'Activate EasyWorship Layout'}</span>
                  </button>
                </div>

                {/* 2. Stream Deck / Quick Presenter (Previous UI) */}
                <div
                  id="layout-card-quickdeck"
                  onClick={() => handleSelectLayout('quickdeck')}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: currentLayout === 'quickdeck'
                      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%)'
                      : 'rgba(255, 255, 255, 0.025)',
                    border: currentLayout === 'quickdeck'
                      ? '2px solid #a855f7'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: currentLayout === 'quickdeck'
                      ? '0 0 25px rgba(168, 85, 247, 0.22)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(139, 92, 246, 0.35)',
                          }}
                        >
                          <Sparkles size={20} color="#ffffff" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#ffffff' }}>
                            Stream Deck / Quick Presenter
                          </h4>
                          <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 700 }}>
                            Previous UI • Rapid 2-Column Deck
                          </span>
                        </div>
                      </div>

                      {currentLayout === 'quickdeck' ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#8b5cf6',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={11} /> ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          Select
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      The previous streamlined 2-column layout with quick Scripture/Lyrics tab switcher, prominent search bar, fast slide breakdown deck, and right live screen.
                    </p>

                    {/* Mini Wireframe Mockup */}
                    <div
                      style={{
                        height: '75px',
                        background: '#090d16',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ height: '10px', background: 'rgba(139, 92, 246, 0.25)', borderRadius: '3px', border: '1px solid rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                        <span style={{ fontSize: '6.5px', color: '#c084fc', fontWeight: 800 }}>SEARCH & MODE TABS</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                        <div
                          style={{
                            flex: 1.3,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '3px',
                            gap: '2px',
                          }}
                        >
                          <div style={{ height: '5px', background: '#8b5cf6', borderRadius: '2px', width: '60%' }} />
                          <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '2px' }} />
                          <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px' }} />
                          <span style={{ fontSize: '7px', color: '#c084fc', marginTop: 'auto', fontWeight: 700 }}>SLIDE BREAKDOWN DECK</span>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span style={{ fontSize: '7px', color: '#38bdf8', fontWeight: 800 }}>LIVE PREVIEW</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#a855f7" /> Dedicated Scripture vs Lyric mode switcher
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#a855f7" /> Instant stanza split & verse cards with keyboard controls
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#a855f7" /> Ideal for solo operators, rapid lookups, and fast changes
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectLayout('quickdeck');
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: currentLayout === 'quickdeck' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {currentLayout === 'quickdeck' ? <Check size={13} /> : null}
                    <span>{currentLayout === 'quickdeck' ? 'Currently Selected' : 'Activate Stream Deck (Previous UI)'}</span>
                  </button>
                </div>

                {/* 3. Classic Studio 1.0 */}
                <div
                  id="layout-card-classic"
                  onClick={() => handleSelectLayout('classic')}
                  style={{
                    padding: '20px',
                    borderRadius: '14px',
                    background: currentLayout === 'classic'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.75) 100%)'
                      : 'rgba(255, 255, 255, 0.025)',
                    border: currentLayout === 'classic'
                      ? '2px solid #f59e0b'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: currentLayout === 'classic'
                      ? '0 0 25px rgba(245, 158, 11, 0.22)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(217, 119, 6, 0.35)',
                          }}
                        >
                          <Sliders size={20} color="#ffffff" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: '#ffffff' }}>
                            Classic EasyPresenter Studio
                          </h4>
                          <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
                            Version 1.0 • Setlist & Themes
                          </span>
                        </div>
                      </div>

                      {currentLayout === 'classic' ? (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: '#d97706',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={11} /> ACTIVE
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#94a3b8',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          Select
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      The classic 3-column studio with left service setlist, center live console with WPM teleprompter transport, and right theme & styling editor.
                    </p>

                    {/* Mini Wireframe Mockup */}
                    <div
                      style={{
                        height: '75px',
                        background: '#090d16',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '6px',
                        display: 'flex',
                        gap: '5px',
                        marginBottom: '14px',
                      }}
                    >
                      <div
                        style={{
                          width: '30%',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '2px',
                        }}
                      >
                        <div style={{ height: '5px', background: '#f59e0b', borderRadius: '2px' }} />
                        <span style={{ fontSize: '7px', color: '#fbbf24', marginTop: 'auto', fontWeight: 700 }}>SETLIST</span>
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '3px',
                        }}
                      >
                        <div style={{ height: '26px', background: 'rgba(0, 0, 0, 0.5)', borderRadius: '3px' }} />
                        <span style={{ fontSize: '7px', color: '#cbd5e1', marginTop: 'auto', fontWeight: 700 }}>LIVE CONSOLE</span>
                      </div>
                      <div
                        style={{
                          width: '30%',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px',
                          gap: '2px',
                        }}
                      >
                        <span style={{ fontSize: '7px', color: '#38bdf8', marginTop: 'auto', fontWeight: 700 }}>STYLE EDITOR</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#f59e0b" /> Service setlist & rundown management
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#f59e0b" /> Teleprompter auto-advance and WPM transport
                      </span>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={12} color="#f59e0b" /> Real-time font, outline, and background inspector
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectLayout('classic');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: currentLayout === 'classic' ? '#d97706' : 'rgba(255, 255, 255, 0.08)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {currentLayout === 'classic' ? <Check size={13} /> : null}
                      <span>{currentLayout === 'classic' ? 'Currently Selected' : 'Activate Classic'}</span>
                    </button>

                    <a
                      href="/"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                      }}
                      title="Open Classic Studio full page"
                    >
                      <Layout size={12} />
                      <span>Open /</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: DISPLAY & TIMER SETTINGS                            */}
          {/* ========================================================== */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Layout Quick Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34d399',
                    }}
                  >
                    <Layout size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                      Presenter Workspace Layout
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Currently active:{' '}
                      <strong style={{ color: currentLayout === 'easyworship' ? '#38bdf8' : currentLayout === 'quickdeck' ? '#c084fc' : '#f59e0b' }}>
                        {currentLayout === 'easyworship'
                          ? 'EasyWorship Dual Monitor (3-Col)'
                          : currentLayout === 'quickdeck'
                          ? 'Stream Deck / Quick Presenter (Previous UI)'
                          : 'Classic Studio 1.0'}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('layout')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.18)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Layout size={13} />
                  <span>Configure Layout...</span>
                </button>
              </div>

              {/* Countdown Timer Font Scale */}
              {timerState && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.025)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Countdown Timer Font Scale
                    </label>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      {timerState.fontSizeScale || 100}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <button
                      onClick={() => {
                        const cur = timerState.fontSizeScale || 100;
                        onSetTimerConfig?.({ fontSizeScale: Math.max(50, cur - 10) });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={13} />
                    </button>

                    <input
                      type="range"
                      min="50"
                      max="250"
                      step="5"
                      value={timerState.fontSizeScale || 100}
                      onChange={(e) => onSetTimerConfig?.({ fontSizeScale: Number(e.target.value) })}
                      style={{ flex: 1, accentColor: '#38bdf8', cursor: 'pointer' }}
                    />

                    <button
                      onClick={() => {
                        const cur = timerState.fontSizeScale || 100;
                        onSetTimerConfig?.({ fontSizeScale: Math.min(250, cur + 10) });
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      { label: '75% (Subtle)', scale: 75 },
                      { label: '100% (Standard)', scale: 100 },
                      { label: '125% (Prominent)', scale: 125 },
                      { label: '150% (Hero)', scale: 150 },
                      { label: '200% (Maximum)', scale: 200 },
                    ].map((preset) => {
                      const isSelected = (timerState.fontSizeScale || 100) === preset.scale;
                      return (
                        <button
                          key={preset.scale}
                          onClick={() => onSetTimerConfig?.({ fontSizeScale: preset.scale })}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: isSelected ? '#38bdf8' : '#cbd5e1',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Display Widgets Toggles */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overlay & Display Elements
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {timerState && (
                    <button
                      onClick={() => onSetTimerConfig?.({ showOnDisplay: !timerState.showOnDisplay })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: timerState.showOnDisplay ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: timerState.showOnDisplay ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: timerState.showOnDisplay ? '#38bdf8' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Show Timer on Display</span>
                      {timerState.showOnDisplay ? <Check size={14} /> : <X size={14} />}
                    </button>
                  )}

                  {timerState && (
                    <button
                      onClick={() => onSetTimerConfig?.({ showClockOnDisplay: !timerState.showClockOnDisplay })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: timerState.showClockOnDisplay ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: timerState.showClockOnDisplay ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: timerState.showClockOnDisplay ? '#fbbf24' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Show Real Clock on Display</span>
                      {timerState.showClockOnDisplay ? <Check size={14} /> : <X size={14} />}
                    </button>
                  )}

                  <button
                    onClick={() => onUpdateTheme({ showNextPreview: !theme.showNextPreview })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: theme.showNextPreview ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: theme.showNextPreview ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: theme.showNextPreview ? '#38bdf8' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Bottom Next Slide Preview</span>
                    {theme.showNextPreview ? <Check size={14} /> : <X size={14} />}
                  </button>

                  <button
                    onClick={() => onUpdateTheme({ displayMode: theme.displayMode === 'lower-third' ? 'fullscreen' : 'lower-third' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: theme.displayMode === 'lower-third' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: theme.displayMode === 'lower-third' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: theme.displayMode === 'lower-third' ? '#c084fc' : '#94a3b8',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>Lower-Third Overlay Mode</span>
                    {theme.displayMode === 'lower-third' ? <Check size={14} /> : <X size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* MODAL FOOTER                                                 */}
        {/* ============================================================ */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            onClick={resetCurrentTabDefaults}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset {activeTab === 'scripture' ? 'Scripture' : activeTab === 'lyrics' ? 'Lyrics' : activeTab === 'layout' ? 'Layout' : 'Display'} to Defaults</span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(14, 165, 233, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
