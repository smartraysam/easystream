import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Check,
  Radio,
  Sparkles,
  FileText,
  Layers,
  BookOpen,
  Music,
  Flame,
  Mic2,
  Megaphone,
  Bookmark,
  Tv,
  ListPlus,
  RotateCcw,
} from 'lucide-react';
import { ScheduleItem, ScheduleCategory } from '../types';

export interface ScheduleItemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: ScheduleItem | null;
  defaultCategory?: ScheduleCategory;
  onSave: (item: ScheduleItem) => void;
  onSaveAndGoLive?: (item: ScheduleItem) => void;
}

interface CategoryOption {
  key: ScheduleCategory;
  label: string;
  icon: React.FC<{ size?: number; color?: string; className?: string; style?: React.CSSProperties }>;
  color: string;
  bgActive: string;
  borderColor: string;
  defaultPlaceholder: string;
  tags: string[];
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'prayer',
    label: 'Prayer',
    icon: Flame,
    color: '#818cf8',
    bgActive: 'rgba(99, 102, 241, 0.22)',
    borderColor: '#6366f1',
    defaultPlaceholder: 'e.g. Opening Prayer & Thanksgiving',
    tags: ['[Opening Prayer]', '[Intercession]', '[Thanksgiving]', '[Benediction]', '[Amen]'],
  },
  {
    key: 'ministration',
    label: 'Ministration',
    icon: Mic2,
    color: '#f472b6',
    bgActive: 'rgba(236, 72, 153, 0.22)',
    borderColor: '#ec4899',
    defaultPlaceholder: 'e.g. Pastoral Ministration / Special Word',
    tags: ['[Theme]', '[Scripture]', '[Point 1]', '[Point 2]', '[Point 3]', '[Summary]'],
  },
  {
    key: 'announcement',
    label: 'Announcement',
    icon: Megaphone,
    color: '#fbbf24',
    bgActive: 'rgba(245, 158, 11, 0.22)',
    borderColor: '#f59e0b',
    defaultPlaceholder: 'e.g. Welcome & Weekly Church Announcements',
    tags: ['[Welcome Visitors]', '[Midweek Service]', '[Upcoming Event]', '[Tithes & Offering]'],
  },
  {
    key: 'hymn',
    label: 'Hymn',
    icon: Bookmark,
    color: '#fb923c',
    bgActive: 'rgba(251, 146, 60, 0.22)',
    borderColor: '#f97316',
    defaultPlaceholder: 'e.g. Hymn: Great Is Thy Faithfulness',
    tags: ['[Verse 1]', '[Verse 2]', '[Verse 3]', '[Chorus]', '[Ending]'],
  },
  {
    key: 'song',
    label: 'Song',
    icon: Music,
    color: '#c084fc',
    bgActive: 'rgba(168, 85, 247, 0.22)',
    borderColor: '#a855f7',
    defaultPlaceholder: 'e.g. Praise & Worship Set',
    tags: ['[Verse 1]', '[Verse 2]', '[Chorus]', '[Bridge]', '[Outro]'],
  },
  {
    key: 'custom',
    label: 'Custom',
    icon: Layers,
    color: '#34d399',
    bgActive: 'rgba(16, 185, 129, 0.22)',
    borderColor: '#10b981',
    defaultPlaceholder: 'e.g. Order of Service / Special Presentation',
    tags: ['[Slide 1]', '[Slide 2]', '[Slide 3]', '[Note]'],
  },
  {
    key: 'scripture',
    label: 'Scripture',
    icon: BookOpen,
    color: '#38bdf8',
    bgActive: 'rgba(56, 189, 248, 0.22)',
    borderColor: '#38bdf8',
    defaultPlaceholder: 'e.g. Scripture Reading: Psalm 23',
    tags: ['[Reading]', '[Responsive]', '[Confession]'],
  },
];

export const ScheduleItemEditorModal: React.FC<ScheduleItemEditorModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  defaultCategory = 'custom',
  onSave,
  onSaveAndGoLive,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ScheduleCategory>(defaultCategory);
  const [content, setContent] = useState('');
  const [splitMode, setSplitMode] = useState<'paragraph' | 'line' | 'single'>('paragraph');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync state when modal opens or initialItem changes
  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setTitle(initialItem.title || '');
        setCategory(initialItem.category || 'custom');
        setContent(initialItem.lines?.join('\n\n') || '');
      } else {
        setTitle('');
        setCategory(defaultCategory);
        setContent('');
      }
      setSplitMode('paragraph');
      setErrorMessage(null);

      setTimeout(() => {
        if (!initialItem?.title && titleInputRef.current) {
          titleInputRef.current.focus();
        } else if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 80);
    }
  }, [isOpen, initialItem, defaultCategory]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const currentCatOption = useMemo(() => {
    return CATEGORY_OPTIONS.find((c) => c.key === category) || CATEGORY_OPTIONS[0];
  }, [category]);

  // Compute live slides from content
  const previewSlides = useMemo(() => {
    const raw = content.trim();
    if (!raw) {
      return title.trim() ? [title.trim()] : [];
    }

    if (splitMode === 'single') {
      return [raw];
    }

    if (splitMode === 'line') {
      return content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    }

    // Default: split by double newlines / blank lines
    const paragraphs = content
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    return paragraphs.length > 0 ? paragraphs : [raw];
  }, [content, splitMode, title]);

  // Insert tag at cursor position
  const handleInsertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => (prev ? `${prev}\n\n${tag}\n` : `${tag}\n`));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);

    const prefix = before.length === 0 || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
    const suffix = '\n';
    const newText = `${before}${prefix}${tag}${suffix}${after}`;
    setContent(newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const cursorPosition = start + prefix.length + tag.length + suffix.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 20);
  };

  const handleValidateAndBuildItem = (): ScheduleItem | null => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Please provide a title for this schedule item');
      titleInputRef.current?.focus();
      return null;
    }

    const slides = previewSlides.length > 0 ? previewSlides : [trimmedTitle];

    const item: ScheduleItem = {
      id: initialItem?.id || `sched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      libraryItemId: initialItem?.libraryItemId,
      title: trimmedTitle,
      category,
      lines: slides,
      themeOverride: initialItem?.themeOverride,
    };

    return item;
  };

  const handleSaveOnly = () => {
    const item = handleValidateAndBuildItem();
    if (!item) return;
    onSave(item);
    onClose();
  };

  const handleSaveAndGoLiveAction = () => {
    const item = handleValidateAndBuildItem();
    if (!item) return;
    onSave(item);
    if (onSaveAndGoLive) {
      onSaveAndGoLive(item);
    }
    onClose();
  };

  if (!isOpen) return null;

  const ActiveIcon = currentCatOption.icon;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '95vw',
          maxWidth: '1240px',
          height: '88vh',
          maxHeight: '880px',
          background: 'linear-gradient(145deg, #0d1322 0%, #080d1a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: currentCatOption.bgActive,
                border: `1px solid ${currentCatOption.borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActiveIcon size={16} color={currentCatOption.color} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  {initialItem ? 'Edit Schedule Item' : 'Add Service Schedule Item'}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: currentCatOption.color,
                    background: currentCatOption.bgActive,
                    border: `1px solid ${currentCatOption.borderColor}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.04em',
                  }}
                >
                  {currentCatOption.label}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {initialItem
                  ? 'Update schedule item title, category, and slide presentation body'
                  : 'Add prayer, ministration, announcement, hymn, or custom item to service rundown'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Main Content */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            overflow: 'hidden',
          }}
        >
          {/* Left Column: Editor Inputs */}
          <div
            style={{
              padding: '16px 20px',
              overflowY: 'auto',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Category Selector Pills */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Service Category
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = category === opt.key;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setCategory(opt.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        background: isSelected ? opt.bgActive : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected
                          ? `1px solid ${opt.borderColor}`
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? opt.color : '#94a3b8',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = '#e2e8f0';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                    >
                      <Icon size={12} color={isSelected ? opt.color : '#94a3b8'} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Title Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}
                >
                  Item Title / Header <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {title.trim().length > 0 && (
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {title.trim().length} chars
                  </span>
                )}
              </div>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder={currentCatOption.defaultPlaceholder}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: errorMessage ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = currentCatOption.borderColor)}
                onBlur={(e) => {
                  if (!errorMessage) e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              />
              {errorMessage && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>
                  {errorMessage}
                </div>
              )}
            </div>

            {/* Quick Header Tags */}
            {currentCatOption.tags && currentCatOption.tags.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Quick Insert Headers:
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {currentCatOption.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = currentCatOption.color;
                        e.currentTarget.style.borderColor = currentCatOption.borderColor;
                        e.currentTarget.style.background = currentCatOption.bgActive;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#cbd5e1';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Body Content Textarea */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                  }}
                >
                  Body / Slide Content
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    Split Mode:
                  </span>
                  <select
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value as any)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '4px',
                      color: '#38bdf8',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="paragraph">Double Enter (Paragraphs)</option>
                    <option value="line">Line by Line</option>
                    <option value="single">Single Slide</option>
                  </select>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Type or paste ${currentCatOption.label.toLowerCase()} text here...\n\nTip: Separate stanzas or slides by pressing Enter twice (an empty line).`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  minHeight: '280px',
                  flex: 1,
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                  color: '#e2e8f0',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = currentCatOption.borderColor)}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '5px',
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                <span>
                  {content.split(/\n+/).filter((l) => l.trim().length > 0).length} lines •{' '}
                  {content.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <span style={{ color: currentCatOption.color, fontWeight: 700 }}>
                  Produces {previewSlides.length} slide{previewSlides.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Slide Deck Preview */}
          <div
            style={{
              padding: '16px 20px',
              background: 'rgba(8, 13, 26, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tv size={13} color="#38bdf8" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Slide Deck Preview
                </span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                {previewSlides.length} Slide{previewSlides.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Slide Cards Scroll View */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingRight: '4px',
              }}
            >
              {previewSlides.length === 0 ? (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <ActiveIcon size={32} color={currentCatOption.color} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                    No slides generated yet
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Type a title and body text to generate live projection slides.
                  </span>
                </div>
              ) : (
                previewSlides.map((slideText, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'linear-gradient(180deg, #090d16 0%, #050810 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderLeft: `3px solid ${currentCatOption.borderColor}`,
                      borderRadius: '8px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {/* Slide Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: '#94a3b8',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.04em',
                          }}
                        >
                          SLIDE {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: currentCatOption.color,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '160px',
                          }}
                        >
                          {title.trim() || currentCatOption.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>
                        {slideText.split('\n').length} line{slideText.split('\n').length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {/* Projected Mockup Slide Surface */}
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '4px',
                        padding: '12px',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          lineHeight: '1.45',
                          color: '#f8fafc',
                          whiteSpace: 'pre-wrap',
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {slideText}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '12px 20px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Pressing <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 5px', borderRadius: '3px', color: '#cbd5e1' }}>Esc</kbd> to cancel
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveOnly}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#f8fafc';
              }}
            >
              <Check size={13} />
              <span>{initialItem ? 'Save Changes' : 'Add to Schedule'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndGoLiveAction}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: '1px solid #38bdf8',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.35)';
              }}
            >
              <Radio size={13} />
              <span>{initialItem ? 'Save & Go Live' : 'Add & Go Live'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
