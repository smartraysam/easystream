import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Music,
  Bookmark,
  Radio,
  ListPlus,
  Sparkles,
  RotateCcw,
  Check,
  ClipboardPaste,
  Layers,
  Type,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { LibraryItem } from '../types';
import { parseLyricsToSlides } from '../utils/lyricParser';

export interface SongBankEditorItem {
  id?: string;
  title?: string;
  author?: string;
  category?: 'song' | 'hymn' | 'custom' | string;
  content?: string;
  plainLyrics?: string;
  trackName?: string;
  artistName?: string;
  splitMode?: 'smart' | 'stanzas' | 'lines';
}

export interface SongBankEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSong?: SongBankEditorItem | null;
  onSave: (item: LibraryItem) => void;
  onSaveAndGoLive?: (item: LibraryItem) => void;
  onSaveAndAddToSchedule?: (item: LibraryItem) => void;
}

const SECTION_TAGS = [
  'Verse 1',
  'Verse 2',
  'Verse 3',
  'Chorus',
  'Chorus 2',
  'Bridge',
  'Pre-Chorus',
  'Tag',
  'Outro',
];

export const SongBankEditorModal: React.FC<SongBankEditorModalProps> = ({
  isOpen,
  onClose,
  initialSong,
  onSave,
  onSaveAndGoLive,
  onSaveAndAddToSchedule,
}) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<'song' | 'hymn' | 'custom'>('song');
  const [content, setContent] = useState('');
  const [splitMode, setSplitMode] = useState<'smart' | 'stanzas' | 'lines'>('smart');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize or reset form when initialSong changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSong) {
        setTitle(initialSong.title || initialSong.trackName || '');
        setAuthor(initialSong.author || initialSong.artistName || '');
        const cat = (initialSong.category as 'song' | 'hymn' | 'custom') || 'song';
        setCategory(cat === 'hymn' || cat === 'custom' ? cat : 'song');
        setContent(initialSong.content || initialSong.plainLyrics || '');
        if (initialSong.splitMode) {
          setSplitMode(initialSong.splitMode);
        }
      } else {
        setTitle('');
        setAuthor('');
        setCategory('song');
        setContent('');
        setSplitMode('smart');
      }
      setErrorMessage(null);
      setFeedback(null);

      // Focus title if empty, otherwise textarea
      setTimeout(() => {
        if (!initialSong?.title && !initialSong?.trackName && titleInputRef.current) {
          titleInputRef.current.focus();
        } else if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 80);
    }
  }, [isOpen, initialSong]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute live slide deck preview
  const previewSlides = useMemo(() => {
    if (!content.trim()) return [];
    return parseLyricsToSlides(content, splitMode);
  }, [content, splitMode]);

  // Live text stats
  const stats = useMemo(() => {
    const raw = content.trim();
    if (!raw) return { lines: 0, words: 0, slides: 0 };
    const lines = content.split('\n').filter((l) => l.trim().length > 0).length;
    const words = raw.split(/\s+/).filter(Boolean).length;
    return { lines, words, slides: previewSlides.length };
  }, [content, previewSlides.length]);

  // Helper to insert section header tag e.g. [Verse 1]
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    const tagText = `[${tag}]`;
    if (!textarea) {
      setContent((prev) => (prev ? `${prev}\n\n${tagText}\n` : `${tagText}\n`));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const prefix = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    const suffix = '\n';
    const newText = `${before}${prefix}${tagText}${suffix}${after}`;
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + tagText.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Helper to paste from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (!content.trim()) {
            setContent(text);
          } else {
            const textarea = textareaRef.current;
            if (textarea) {
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const before = content.substring(0, start);
              const after = content.substring(end);
              setContent(`${before}${text}${after}`);
            } else {
              setContent((prev) => `${prev}\n\n${text}`);
            }
          }
          setFeedback('Pasted from clipboard!');
          setTimeout(() => setFeedback(null), 2500);
          return;
        }
      }
      setFeedback('Clipboard is empty or inaccessible. Use Ctrl+V or Cmd+V to paste.');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback('Clipboard access blocked. Please press Ctrl+V / Cmd+V in the text area.');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Helper to clean up formatting
  const handleCleanUp = () => {
    if (!content.trim()) return;
    // Replace 3+ consecutive newlines with 2
    let cleaned = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    setContent(cleaned);
    setFeedback('Cleaned up extra spaces and blank lines!');
    setTimeout(() => setFeedback(null), 2500);
  };

  // Helper to validate and construct LibraryItem
  const buildItemToSave = (): LibraryItem | null => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setErrorMessage('Please enter a Song Title.');
      if (titleInputRef.current) titleInputRef.current.focus();
      return null;
    }

    if (!trimmedContent) {
      setErrorMessage('Please paste or enter lyric content.');
      if (textareaRef.current) textareaRef.current.focus();
      return null;
    }

    const slides = parseLyricsToSlides(trimmedContent, splitMode);
    if (slides.length === 0) {
      setErrorMessage('No slide content detected from lyrics.');
      return null;
    }

    const songId =
      initialSong?.id ||
      `song-${trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    return {
      id: songId,
      title: trimmedTitle,
      author: author.trim() || undefined,
      category,
      content: trimmedContent,
      lines: slides,
      createdAt: (initialSong as LibraryItem)?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleSave = () => {
    const item = buildItemToSave();
    if (!item) return;
    onSave(item);
    onClose();
  };

  const handleSaveAndGoLive = () => {
    const item = buildItemToSave();
    if (!item) return;
    onSave(item);
    if (onSaveAndGoLive) {
      onSaveAndGoLive(item);
    }
    onClose();
  };

  const handleSaveAndSchedule = () => {
    const item = buildItemToSave();
    if (!item) return;
    onSave(item);
    if (onSaveAndAddToSchedule) {
      onSaveAndAddToSchedule(item);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          height: '88vh',
          maxHeight: '840px',
          background: 'linear-gradient(180deg, #0e1424 0%, #080c16 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(139, 92, 246, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.85)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.45)',
                color: '#ffffff',
              }}
            >
              <Music size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {initialSong?.id || initialSong?.title ? 'Edit Worship Lyrics' : 'Manual Add Worship Song'}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(139, 92, 246, 0.18)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    color: '#c084fc',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Song Bank
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Paste or write song lyrics with smart stanza splitting to build your church library
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div
            style={{
              padding: '8px 24px',
              background: 'rgba(239, 68, 68, 0.15)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Feedback notification toast */}
        {feedback && (
          <div
            style={{
              padding: '7px 24px',
              background: 'rgba(16, 185, 129, 0.18)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Check size={14} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Modal Main Body (2 Columns: Editor on Left, Live Preview on Right) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Column: Form & Lyrics Textarea */}
          <div
            style={{
              flex: 1.15,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 24px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflowY: 'auto',
              gap: '14px',
            }}
          >
            {/* Row 1: Title & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Song Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. Way Maker, Goodness of God, Gratitude"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                >
                  <option value="song">Worship Song</option>
                  <option value="hymn">Traditional Hymn</option>
                  <option value="custom">Custom / Special</option>
                </select>
              </div>
            </div>

            {/* Row 2: Artist & Split Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Artist / Worship Leader
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Sinach, Brandon Lake, Bethel"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Slide Split Strategy
                </label>
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    gap: '3px',
                  }}
                >
                  {(
                    [
                      { id: 'smart', label: 'Smart (2-3 lines)' },
                      { id: 'stanzas', label: 'Stanzas (Paragraphs)' },
                      { id: 'lines', label: '1 Line / Slide' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSplitMode(m.id)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: splitMode === m.id ? '#8b5cf6' : 'transparent',
                        color: splitMode === m.id ? '#ffffff' : '#94a3b8',
                        transition: 'all 0.12s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lyrics Text Area Container */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '260px' }}>
              {/* Toolbar above textarea: Section marker badges & Quick Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {/* Section tags chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginRight: '2px' }}>
                    Insert Tag:
                  </span>
                  {SECTION_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      style={{
                        padding: '2px 7px',
                        borderRadius: '5px',
                        background: 'rgba(139, 92, 246, 0.14)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#c084fc',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.1s',
                      }}
                      title={`Insert [${tag}] into lyrics text`}
                    >
                      + [{tag}]
                    </button>
                  ))}
                </div>

                {/* Quick actions: Paste & Clean */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Paste text from clipboard"
                  >
                    <ClipboardPaste size={12} /> Paste
                  </button>

                  <button
                    type="button"
                    onClick={handleCleanUp}
                    disabled={!content.trim()}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: content.trim() ? '#e2e8f0' : '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: content.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Clean up excess blank lines and trailing spaces"
                  >
                    <Sparkles size={12} /> Clean Up
                  </button>

                  {content.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Clear all lyrics in text area?')) {
                          setContent('');
                        }
                      }}
                      style={{
                        padding: '3px 7px',
                        borderRadius: '5px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Clear textarea"
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={`Paste or type worship song lyrics here...

[Verse 1]
You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

[Chorus]
Way maker, miracle worker, promise keeper
Light in the darkness, my God, that is who You are

[Bridge]
Even when I don't see it, You're working
Even when I don't feel it, You're working`}
                style={{
                  flex: 1,
                  minHeight: '220px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1.5px solid rgba(139, 92, 246, 0.3)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  lineHeight: '1.65',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  outline: 'none',
                  resize: 'none',
                }}
              />

              {/* Text stats footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#64748b',
                }}
              >
                <span>
                  Tip: Blank lines separate stanzas. Use section headers like <code>[Verse 1]</code> or <code>[Chorus]</code>.
                </span>
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>
                  {stats.lines} lines &middot; {stats.words} words &middot;{' '}
                  <strong style={{ color: '#c084fc' }}>{stats.slides} slides</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Slide Deck Preview */}
          <div
            style={{
              flex: 0.95,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8, 12, 20, 0.7)',
              overflow: 'hidden',
            }}
          >
            {/* Preview Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="#38bdf8" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                  Real-Time Slide Preview
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                  }}
                >
                  {previewSlides.length} {previewSlides.length === 1 ? 'Slide' : 'Slides'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Mode: <strong style={{ color: '#c084fc' }}>{splitMode.toUpperCase()}</strong>
              </div>
            </div>

            {/* Slide Cards Scrollable Container */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {previewSlides.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#475569',
                  }}
                >
                  <FileText size={40} color="#334155" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                    No Presentation Slides Yet
                  </div>
                  <div style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.5 }}>
                    Paste lyrics into the text area on the left. EasyStream will automatically partition your worship song into presentation-ready slides.
                  </div>
                </div>
              ) : (
                previewSlides.map((slideText, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'radial-gradient(ellipse at top left, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0.85) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.25)',
                          color: '#c084fc',
                          letterSpacing: '0.04em',
                        }}
                      >
                        SLIDE {idx + 1} OF {previewSlides.length}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {title.trim() || 'Worship Slide'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        color: '#f8fafc',
                        lineHeight: '1.55',
                        fontWeight: 600,
                        whiteSpace: 'pre-line',
                        padding: '4px 0',
                      }}
                    >
                      {slideText}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bookmark size={13} color="#a78bfa" />
            <span>Saved songs are preserved locally in your church Song Bank and synced across all screens.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            {onSaveAndAddToSchedule && (
              <button
                type="button"
                onClick={handleSaveAndSchedule}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Save song to bank and add to today's service schedule"
              >
                <ListPlus size={14} /> Save & Schedule
              </button>
            )}

            {onSaveAndGoLive && (
              <button
                type="button"
                onClick={handleSaveAndGoLive}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                }}
                title="Save song to bank and project slide 1 to live screens immediately"
              >
                <Radio size={14} /> Save & Go Live
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 18px rgba(139, 92, 246, 0.45)',
              }}
              title="Save to Song Bank"
            >
              <Bookmark size={14} /> Save to Song Bank
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
