import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Music, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Trash2, 
  Edit, 
  Play, 
  ListPlus, 
  Check, 
  X,
  Globe
} from 'lucide-react';
import { LibraryItem } from '../types';
import { parseLyricsToSlides } from '../utils/lyricParser';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: LibraryItem[];
  onSaveLibraryItem: (item: LibraryItem) => void;
  onDeleteLibraryItem: (id: string) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
  onOpenOnlineSearch?: () => void;
  onOpenScriptures?: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  library,
  onSaveLibraryItem,
  onDeleteLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
  onOpenOnlineSearch,
  onOpenScriptures,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<Partial<LibraryItem> | null>(null);
  const [splitMode, setSplitMode] = useState<'smart' | 'stanzas' | 'lines'>('smart');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = library.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.author && item.author.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && item.category === activeCategory;
  });

  const handleStartCreate = () => {
    setEditingItem({
      id: `item-${Date.now()}`,
      title: '',
      category: 'song',
      author: '',
      content: '',
      lines: [],
    });
    setSplitMode('smart');
  };

  const handleStartEdit = (item: LibraryItem) => {
    setEditingItem({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.title?.trim() || !editingItem.content?.trim()) {
      alert('Please provide both a title and content.');
      return;
    }

    const parsedLines = parseLyricsToSlides(editingItem.content, splitMode);

    if (parsedLines.length === 0) {
      alert('No slide content detected.');
      return;
    }

    const itemToSave: LibraryItem = {
      id: editingItem.id || `item-${Date.now()}`,
      title: editingItem.title.trim(),
      category: editingItem.category || 'custom',
      author: editingItem.author?.trim() || '',
      content: editingItem.content,
      lines: parsedLines,
      createdAt: editingItem.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    onSaveLibraryItem(itemToSave);
    setEditingItem(null);
  };

  const handleAddWithFeedback = (item: LibraryItem) => {
    onAddToSchedule(item);
    setAddedFeedbackId(item.id);
    setTimeout(() => setAddedFeedbackId(null), 1500);
  };

  const getItemIcon = (category?: string) => {
    switch (category) {
      case 'song': return <Music size={15} color="#38bdf8" />;
      case 'hymn': return <Sparkles size={15} color="#f59e0b" />;
      case 'scripture': return <BookOpen size={15} color="#10b981" />;
      default: return <FileText size={15} color="#94a3b8" />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '850px', height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '15px' }}>
            <BookOpen size={18} color="#38bdf8" />
            Song & Scripture Media Library
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Main Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Library List & Search */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {/* Search & Category Filter */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: '#64748b' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '30px', fontSize: '12px' }}
                    placeholder="Search local songs, verses, lyrics..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {onOpenOnlineSearch && (
                  <button 
                    className="btn"
                    style={{
                      fontSize: '12px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                    }}
                    onClick={onOpenOnlineSearch}
                    title="Search online lyric databases"
                  >
                    <Globe size={13} /> Search Lyrics
                  </button>
                )}
                {onOpenScriptures && (
                  <button 
                    className="btn"
                    style={{
                      fontSize: '12px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}
                    onClick={onOpenScriptures}
                    title="Quick Scripture Search & Bible Presenter"
                  >
                    <BookOpen size={13} /> Scripture
                  </button>
                )}
                <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={handleStartCreate}>
                  <Plus size={13} /> New Item
                </button>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'All' },
                  { id: 'scripture', label: 'Scriptures' },
                  { id: 'song', label: 'Worship Songs' },
                  { id: 'hymn', label: 'Hymns' },
                  { id: 'announcement', label: 'Announcements' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    className={`btn ${activeCategory === cat.id ? 'btn-primary' : ''}`}
                    style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '999px' }}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '12px' }}>
                  No songs or scriptures found matching "{searchQuery}".
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="interactive-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '10px 12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ marginTop: '2px' }}>{getItemIcon(item.category)}</div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {item.lines.length} slides {item.author ? `• ${item.author}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        className="btn"
                        style={{ fontSize: '11px', padding: '4px 8px', background: addedFeedbackId === item.id ? '#10b981' : undefined }}
                        onClick={() => handleAddWithFeedback(item)}
                        title="Add to current Service Schedule"
                      >
                        {addedFeedbackId === item.id ? <Check size={12} /> : <ListPlus size={12} />}
                        {addedFeedbackId === item.id ? 'Added' : 'Schedule'}
                      </button>

                      <button
                        className="btn btn-primary"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => {
                          onGoLiveWithItem(item);
                          onClose();
                        }}
                        title="Go Live immediately with this item"
                      >
                        <Play size={11} /> Live
                      </button>

                      <button
                        className="btn btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => handleStartEdit(item)}
                        title="Edit lyrics/verse"
                      >
                        <Edit size={12} />
                      </button>

                      <button
                        className="btn btn-icon btn-danger"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => {
                          if (confirm(`Delete "${item.title}" from library?`)) {
                            onDeleteLibraryItem(item.id);
                          }
                        }}
                        title="Delete item"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Item Editor Form (if creating or editing) */}
          {editingItem && (
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.95)', overflowY: 'auto' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                  {editingItem.title ? 'Edit Library Item' : 'New Library Item'}
                </span>
                <button className="btn btn-icon" onClick={() => setEditingItem(null)} style={{ background: 'transparent' }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <div className="form-group">
                  <label className="form-label">Item Title / Scripture</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingItem.title || ''}
                    onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="e.g. Psalm 91 or How Great Is Our God"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editingItem.category || 'song'}
                      onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    >
                      <option value="song">Worship Song</option>
                      <option value="scripture">Scripture</option>
                      <option value="hymn">Hymn</option>
                      <option value="announcement">Announcement</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Author / Reference</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingItem.author || ''}
                      onChange={e => setEditingItem({ ...editingItem, author: e.target.value })}
                      placeholder="e.g. Chris Tomlin"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Content / Lyrics</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={`btn ${splitMode === 'smart' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={() => setSplitMode('smart')}
                        title="Smart 2-3 lines per slide"
                      >
                        Smart
                      </button>
                      <button
                        type="button"
                        className={`btn ${splitMode === 'stanzas' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={() => setSplitMode('stanzas')}
                        title="Split by blank lines"
                      >
                        Stanzas
                      </button>
                      <button
                        type="button"
                        className={`btn ${splitMode === 'lines' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={() => setSplitMode('lines')}
                        title="Single line per slide"
                      >
                        1 Line
                      </button>
                    </div>
                  </div>

                  {/* Section tag inserters for songs */}
                  {editingItem.category === 'song' || editingItem.category === 'hymn' ? (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {['Verse 1', 'Verse 2', 'Chorus', 'Bridge'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          className="btn"
                          style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}
                          onClick={() => {
                            const cur = editingItem.content || '';
                            const prefix = cur.length === 0 || cur.endsWith('\n\n') ? '' : cur.endsWith('\n') ? '\n' : '\n\n';
                            setEditingItem({ ...editingItem, content: `${cur}${prefix}[${tag}]\n` });
                          }}
                        >
                          + [{tag}]
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <textarea
                    className="form-textarea"
                    style={{ flex: 1, minHeight: '160px', fontSize: '12px', lineHeight: '1.6' }}
                    value={editingItem.content || ''}
                    onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                    placeholder="Paste lyrics or scripture verses here..."
                  />
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                    {splitMode === 'smart'
                      ? '• Smart Split: Groups 2-3 lines per slide, respecting stanzas.'
                      : splitMode === 'lines'
                      ? '• Each individual line will become one presentation slide.'
                      : '• Paragraphs separated by blank lines will become slides.'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                  <button className="btn" onClick={() => setEditingItem(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>
                    <Check size={13} /> Save Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
