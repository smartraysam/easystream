import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Globe, 
  Music, 
  Play, 
  ListPlus, 
  Check, 
  X, 
  Loader2, 
  BookCheck, 
  ChevronRight,
  HardDrive,
  CheckCheck,
  Bookmark,
  Edit,
  Plus
} from 'lucide-react';
import { LibraryItem } from '../types';
import { parseLyricsToSlides } from '../utils/lyricParser';
import { getLyricSuggestions, LyricSuggestion } from '../data/popularWorshipSongs';
import { SongBankEditorModal, SongBankEditorItem } from './SongBankEditorModal';

interface OnlineSongResult {
  id: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  snippet?: string;
  plainLyrics: string;
  isLocal?: boolean;
  localItem?: LibraryItem;
  source?: 'google' | 'genius' | 'lrclib' | 'local';
  sourceUrl?: string;
  artworkUrl?: string;
}

interface OnlineLyricsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  library?: LibraryItem[];
  onSaveLibraryItem: (item: LibraryItem) => void;
  onAddToSchedule: (item: LibraryItem) => void;
  onGoLiveWithItem: (item: LibraryItem) => void;
}

export const OnlineLyricsSearchModal: React.FC<OnlineLyricsSearchModalProps> = ({
  isOpen,
  onClose,
  library = [],
  onSaveLibraryItem,
  onAddToSchedule,
  onGoLiveWithItem,
}) => {
  // --- Lyrics Search State ---
  const [lyricsQuery, setLyricsQuery] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [onlineSongResults, setOnlineSongResults] = useState<OnlineSongResult[]>([]);
  const [selectedSong, setSelectedSong] = useState<OnlineSongResult | null>(null);
  const [lyricsSplitMode, setLyricsSplitMode] = useState<'smart' | 'smart3' | 'stanzas' | 'lines'>('smart');
  const [lyricsSavedFeedback, setLyricsSavedFeedback] = useState<string | null>(null);
  const [lyricsLiveFeedback, setLyricsLiveFeedback] = useState(false);
  const [lyricsScheduleFeedback, setLyricsScheduleFeedback] = useState(false);
  const [isSongEditorOpen, setIsSongEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<SongBankEditorItem | null>(null);

  // Lyric Autocomplete State
  const [showLyricSuggestions, setShowLyricSuggestions] = useState(false);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. LOCAL-FIRST MATCHES FOR SONGS ---
  // Matches from church's local library are checked first!
  const localSongMatches: OnlineSongResult[] = React.useMemo(() => {
    const q = lyricsQuery.trim().toLowerCase();
    if (!q) return [];

    return (library || [])
      .filter(item => {
        const isSongLike = item.category === 'song' || item.category === 'hymn' || item.category === 'custom';
        if (!isSongLike) return false;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.author && item.author.toLowerCase().includes(q)) ||
          (item.content && item.content.toLowerCase().includes(q))
        );
      })
      .map(item => ({
        id: item.id,
        trackName: item.title,
        artistName: item.author || 'Local Church Library',
        snippet: item.lines?.slice(0, 2).join(' • ') || '',
        plainLyrics: item.content || item.lines?.join('\n') || '',
        isLocal: true,
        localItem: item,
      }));
  }, [library, lyricsQuery]);

  // Combined song results: local first, then online
  const combinedSongResults = React.useMemo(() => {
    const localTitles = new Set(localSongMatches.map(m => m.trackName.toLowerCase()));
    const filteredOnline = onlineSongResults.filter(
      online => !localTitles.has(online.trackName.toLowerCase())
    );
    return [...localSongMatches, ...filteredOnline];
  }, [localSongMatches, onlineSongResults]);

  // Autocomplete Suggestions for Song Lyrics
  const lyricSuggestions: LyricSuggestion[] = React.useMemo(() => {
    if (!lyricsQuery.trim() || !showLyricSuggestions) return [];
    return getLyricSuggestions(lyricsQuery, library);
  }, [lyricsQuery, showLyricSuggestions, library]);

  // Focus on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        lyricInputRef.current?.focus();
        lyricInputRef.current?.select();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showLyricSuggestions) {
          setShowLyricSuggestions(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showLyricSuggestions, onClose]);

  // Debounced search for Lyrics
  useEffect(() => {
    if (!isOpen) return;

    if (!lyricsQuery.trim()) {
      setOnlineSongResults([]);
      setSelectedSong(null);
      setLyricsLoading(false);
      return;
    }

    // Auto-select local match first if available
    if (localSongMatches.length > 0 && !selectedSong) {
      setSelectedSong(localSongMatches[0]);
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setLyricsLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiBase}/api/lyrics/search?q=${encodeURIComponent(lyricsQuery.trim())}`);
        const data = await res.json();
        const songs: OnlineSongResult[] = (data.results || []).map((s: OnlineSongResult) => ({
          ...s,
          isLocal: false,
        }));
        setOnlineSongResults(songs);
        
        // If nothing selected yet, select the first match (local first, then online)
        if (!selectedSong) {
          if (localSongMatches.length > 0) {
            setSelectedSong(localSongMatches[0]);
          } else if (songs.length > 0) {
            handleSelectSong(songs[0]);
          }
        }
      } catch (err) {
        console.error('Failed to search lyrics:', err);
      } finally {
        setLyricsLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [lyricsQuery, isOpen, localSongMatches.length]);

  if (!isOpen) return null;

  // --- Convert Song result to LibraryItem ---
  const getLibraryItemFromSong = (song: OnlineSongResult, mode = lyricsSplitMode): LibraryItem => {
    if (song.isLocal && song.localItem) {
      return song.localItem;
    }
    const parsedSlides = parseLyricsToSlides(song.plainLyrics, mode);
    return {
      id: `song-${song.trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`,
      title: song.trackName,
      author: song.artistName,
      category: 'song',
      content: song.plainLyrics,
      lines: parsedSlides,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  const handleSelectSong = async (song: OnlineSongResult) => {
    setSelectedSong(song);
    setShowLyricSuggestions(false);

    let fullLyrics = song.plainLyrics;
    let currentSong = song;

    if (!fullLyrics || fullLyrics.length < 20) {
      try {
        const apiBase = import.meta.env.VITE_API_URL || '';
        const res = await fetch(
          `${apiBase}/api/lyrics/details?id=${encodeURIComponent(song.id)}&url=${encodeURIComponent(song.sourceUrl || '')}`
        );
        const data = await res.json();
        if (data.result?.plainLyrics) {
          fullLyrics = data.result.plainLyrics;
          currentSong = {
            ...song,
            plainLyrics: fullLyrics,
            snippet: data.result.snippet || song.snippet,
          };
          setSelectedSong(currentSong);
          setOnlineSongResults(prev => prev.map(s => s.id === song.id ? currentSong : s));
        }
      } catch (err) {
        console.error('Failed to load lyrics details:', err);
      }
    }
    
    // Auto-save online songs to library if lyrics are available
    if (!currentSong.isLocal && fullLyrics && fullLyrics.length > 20) {
      const item = getLibraryItemFromSong(currentSong, lyricsSplitMode);
      onSaveLibraryItem(item);
      setLyricsSavedFeedback(`"${currentSong.trackName}" auto-saved to library!`);
      setTimeout(() => setLyricsSavedFeedback(null), 3000);
    }
  };

  const handleSelectLyricSuggestion = (suggestion: LyricSuggestion) => {
    setLyricsQuery(suggestion.title);
    setShowLyricSuggestions(false);
    
    if (suggestion.isLocal && suggestion.localItem) {
      const match: OnlineSongResult = {
        id: suggestion.localItem.id,
        trackName: suggestion.localItem.title,
        artistName: suggestion.localItem.author || 'Local Church Library',
        snippet: suggestion.localItem.lines?.slice(0, 2).join(' • ') || '',
        plainLyrics: suggestion.localItem.content || suggestion.localItem.lines?.join('\n') || '',
        isLocal: true,
        localItem: suggestion.localItem,
      };
      setSelectedSong(match);
      return;
    }

    // For online catalog suggestions, clear current selection so the
    // search query automatically fetches and selects the online song
    setSelectedSong(null);
  };

  const handleGoLiveLyrics = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, lyricsSplitMode);
    if (!selectedSong.isLocal) {
      onSaveLibraryItem(item);
    }
    onGoLiveWithItem(item);
    setLyricsLiveFeedback(true);
    setTimeout(() => {
      setLyricsLiveFeedback(false);
      onClose();
    }, 600);
  };

  const handleAddToScheduleLyrics = () => {
    if (!selectedSong) return;
    const item = getLibraryItemFromSong(selectedSong, lyricsSplitMode);
    if (!selectedSong.isLocal) {
      onSaveLibraryItem(item);
    }
    onAddToSchedule(item);
    setLyricsScheduleFeedback(true);
    setTimeout(() => setLyricsScheduleFeedback(false), 1500);
  };

  // Preview slides
  const lyricsPreviewSlides = selectedSong 
    ? (selectedSong.isLocal && selectedSong.localItem?.lines?.length
        ? selectedSong.localItem.lines 
        : parseLyricsToSlides(selectedSong.plainLyrics, lyricsSplitMode))
    : [];

  return (
    <div className="modal-backdrop" onClick={() => {
      setShowLyricSuggestions(false);
      onClose();
    }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '1160px', height: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.35)',
            }}>
              <Music size={18} color="#ffffff" />
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
                <span>Search Song Lyrics Online</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  color: '#60a5fa',
                  borderRadius: '999px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Globe size={11} /> GOOGLE & WEB
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Find any worship song, gospel anthem, or hymn powered by Google & web lyrics search
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn"
              style={{
                fontSize: '12px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.18) 100%)',
                borderColor: 'rgba(139, 92, 246, 0.4)',
                color: '#c084fc',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={() => {
                setEditingSong(null);
                setIsSongEditorOpen(true);
              }}
              title="Paste or type lyrics manually to build your song bank"
            >
              <Plus size={14} /> + Manual Add Lyric
            </button>

            <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent' }} title="Close (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search Input Bar with Autocomplete */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 20, 0.6)',
          position: 'relative',
          zIndex: 30
        }}>
          <div 
            style={{ position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#38bdf8' }} />
            <input
              ref={lyricInputRef}
              type="text"
              className="form-input"
              style={{
                paddingLeft: '38px',
                fontSize: '14px',
                height: '42px',
                borderRadius: '8px',
                borderColor: showLyricSuggestions && lyricSuggestions.length > 0 ? '#38bdf8' : undefined,
              }}
              placeholder="Search songs or hymns (e.g. Goodness of God, Way Maker, Oceans, Amazing Grace)..."
              value={lyricsQuery}
              onFocus={() => setShowLyricSuggestions(true)}
              onChange={e => {
                setLyricsQuery(e.target.value);
                setShowLyricSuggestions(true);
                setActiveLyricIndex(-1);
              }}
              onKeyDown={e => {
                if (showLyricSuggestions && lyricSuggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveLyricIndex(prev => (prev < lyricSuggestions.length - 1 ? prev + 1 : 0));
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveLyricIndex(prev => (prev > 0 ? prev - 1 : lyricSuggestions.length - 1));
                    return;
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const target = activeLyricIndex >= 0 
                      ? lyricSuggestions[activeLyricIndex] 
                      : lyricSuggestions[0];
                    if (target) {
                      handleSelectLyricSuggestion(target);
                    }
                    return;
                  }
                  if (e.key === ' ' && activeLyricIndex >= 0 && lyricSuggestions[activeLyricIndex]) {
                    e.preventDefault();
                    handleSelectLyricSuggestion(lyricSuggestions[activeLyricIndex]);
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (activeLyricIndex >= 0 && lyricSuggestions[activeLyricIndex]) {
                      handleSelectLyricSuggestion(lyricSuggestions[activeLyricIndex]);
                    } else {
                      setShowLyricSuggestions(false);
                    }
                    return;
                  }
                  if (e.key === 'Escape') {
                    setShowLyricSuggestions(false);
                    return;
                  }
                }
              }}
              autoFocus
            />
            {lyricsLoading && (
              <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '13px', color: '#38bdf8' }} />
            )}

            {/* Lyric Autocomplete Popover Dropdown (Local Library First!) */}
            {showLyricSuggestions && lyricSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(16px)',
                zIndex: 100,
                overflow: 'hidden',
                maxHeight: '280px',
                overflowY: 'auto',
              }}>
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#38bdf8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span>Song Suggestions (Tab, Enter, or Click)</span>
                  <span style={{ color: '#64748b' }}>Tab to complete</span>
                </div>

                {lyricSuggestions.map((sug, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isActive 
                          ? (sug.isLocal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)')
                          : 'transparent',
                        borderBottom: idx < lyricSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined,
                        transition: 'background 0.1s ease',
                      }}
                      onMouseEnter={() => setActiveLyricIndex(idx)}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectLyricSuggestion(sug);
                      }}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectLyricSuggestion(sug);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {sug.isLocal ? (
                          <HardDrive size={13} color="#10b981" />
                        ) : (
                          <Music size={13} color="#38bdf8" />
                        )}
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#ffffff' }}>
                          {sug.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {sug.subLabel}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: sug.isLocal ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                        color: sug.isLocal ? '#34d399' : '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {sug.isLocal && <CheckCheck size={11} />}
                        {sug.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Content: 2 Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Results List with LOCAL-FIRST Sorting */}
          <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(17, 22, 34, 0.5)',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                Search Results ({combinedSongResults.length})
                {localSongMatches.length > 0 && (
                  <span style={{ color: '#10b981', marginLeft: '6px' }}>
                    • {localSongMatches.length} in library
                  </span>
                )}
              </span>
              <span style={{ color: '#38bdf8' }}>Click to select</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lyricsQuery.trim() === '' ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Globe size={32} style={{ opacity: 0.3 }} />
                  <span>Type a song name to search your local library and online lyric databases.</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                    {['Goodness of God', 'Way Maker', 'Oceans', 'What a Beautiful Name', '10,000 Reasons', 'King of Kings'].map(sample => (
                      <button
                        key={sample}
                        className="btn"
                        style={{ fontSize: '11px', padding: '4px 8px', background: 'rgba(255, 255, 255, 0.05)' }}
                        onClick={() => setLyricsQuery(sample)}
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              ) : combinedSongResults.length === 0 && !lyricsLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '13px' }}>
                  No songs found matching "{lyricsQuery}". Try a different spelling or artist name.
                </div>
              ) : (
                combinedSongResults.map((song) => {
                  const isSelected = selectedSong?.id === song.id;
                  const isLocal = song.isLocal;

                  return (
                    <div
                      key={song.id}
                      className={`interactive-card ${isSelected ? 'active' : ''}`}
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative',
                        borderColor: isLocal ? 'rgba(16, 185, 129, 0.3)' : undefined,
                        background: isLocal ? 'rgba(16, 185, 129, 0.04)' : undefined,
                      }}
                      onClick={() => handleSelectSong(song)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isLocal && (
                            <span title="Already saved in your local library" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <HardDrive size={13} color="#10b981" />
                            </span>
                          )}
                          <span style={{ fontWeight: 700, fontSize: '14px', color: isSelected ? '#38bdf8' : '#ffffff' }}>
                            {song.trackName}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isLocal ? (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                            }}>
                              Saved in Bank
                            </span>
                          ) : song.source === 'google' ? (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(59, 130, 246, 0.18)',
                              border: '1px solid rgba(59, 130, 246, 0.35)',
                              color: '#60a5fa',
                            }}>
                              Google
                            </span>
                          ) : song.source === 'genius' ? (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(234, 179, 8, 0.18)',
                              border: '1px solid rgba(234, 179, 8, 0.35)',
                              color: '#facc15',
                            }}>
                              Genius
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#c084fc',
                            }}>
                              Online
                            </span>
                          )}
                          <ChevronRight size={15} style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? '#38bdf8' : undefined }} />
                        </div>
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                        {song.artistName} {song.albumName ? `• ${song.albumName}` : ''}
                      </div>

                      {song.snippet && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          "{song.snippet}"
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Slide Preview & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.7)' }}>
            {selectedSong ? (
              <>
                {/* Preview Top Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(17, 22, 34, 0.9)'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{selectedSong.trackName}</span>
                      {selectedSong.isLocal && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                          Local Library
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      by {selectedSong.artistName} &middot; {lyricsPreviewSlides.length} Presentation Slides
                    </div>
                  </div>

                  {/* Split Format Selector */}
                  {!selectedSong.isLocal && (
                    <div style={{ display: 'flex', gap: '3px', background: 'rgba(0, 0, 0, 0.4)', padding: '2px', borderRadius: '6px' }}>
                      <button
                        className={`btn ${lyricsSplitMode === 'lines' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '3px 7px' }}
                        onClick={() => setLyricsSplitMode('lines')}
                        title="1 line per slide"
                      >
                        1 Line
                      </button>
                      <button
                        className={`btn ${lyricsSplitMode === 'smart' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '3px 7px' }}
                        onClick={() => setLyricsSplitMode('smart')}
                        title="Smart 2 lines per slide"
                      >
                        Smart 2
                      </button>
                      <button
                        className={`btn ${lyricsSplitMode === 'smart3' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '3px 7px' }}
                        onClick={() => setLyricsSplitMode('smart3')}
                        title="Smart 3 lines per slide"
                      >
                        Smart 3
                      </button>
                      <button
                        className={`btn ${lyricsSplitMode === 'stanzas' ? 'btn-primary' : ''}`}
                        style={{ fontSize: '10px', padding: '3px 7px' }}
                        onClick={() => setLyricsSplitMode('stanzas')}
                        title="Full stanzas per slide"
                      >
                        Stanzas
                      </button>
                    </div>
                  )}
                </div>

                {/* Auto-Save Notification Banner */}
                {lyricsSavedFeedback && (
                  <div style={{
                    padding: '6px 16px',
                    background: selectedSong.isLocal ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    borderBottom: `1px solid ${selectedSong.isLocal ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: selectedSong.isLocal ? '#38bdf8' : '#34d399',
                    fontSize: '11px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <BookCheck size={13} />
                    <span>{lyricsSavedFeedback}</span>
                  </div>
                )}

                {/* Formatted Slides Preview Grid */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lyricsPreviewSlides.map((slideText, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', minWidth: '18px', marginTop: '2px' }}>
                        {idx + 1}.
                      </span>
                      <div style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-line', lineHeight: 1.5, fontWeight: 500 }}>
                        {slideText}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action Buttons */}
                <div style={{
                  padding: '14px 16px',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'rgba(17, 22, 34, 0.95)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedSong.isLocal ? 'Saved in local church Song Bank' : 'Available online • Click Save to Bank'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn"
                      style={{ fontSize: '12px', padding: '7px 12px' }}
                      onClick={() => {
                        setEditingSong({
                          id: selectedSong.localItem?.id,
                          title: selectedSong.trackName,
                          author: selectedSong.artistName,
                          category: (selectedSong.localItem?.category as any) || 'song',
                          content: selectedSong.plainLyrics,
                          plainLyrics: selectedSong.plainLyrics,
                          splitMode: lyricsSplitMode,
                        });
                        setIsSongEditorOpen(true);
                      }}
                      title="Edit lyrics and adjust slide splitting"
                    >
                      <Edit size={13} /> Edit Lyrics
                    </button>

                    {!selectedSong.isLocal && (
                      <button
                        className="btn"
                        style={{
                          fontSize: '12px',
                          padding: '7px 12px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                        }}
                        onClick={() => {
                          const item = getLibraryItemFromSong(selectedSong, lyricsSplitMode);
                          onSaveLibraryItem(item);
                          setLyricsSavedFeedback(`"${selectedSong.trackName}" saved to Song Bank!`);
                          setSelectedSong({
                            ...selectedSong,
                            isLocal: true,
                            localItem: item,
                          });
                          setTimeout(() => setLyricsSavedFeedback(null), 3000);
                        }}
                        title="Save found lyric to your church Song Bank"
                      >
                        <Bookmark size={13} /> Save to Bank
                      </button>
                    )}

                    <button
                      className="btn"
                      style={{ fontSize: '12px', padding: '7px 14px', background: lyricsScheduleFeedback ? '#10b981' : undefined }}
                      onClick={handleAddToScheduleLyrics}
                    >
                      {lyricsScheduleFeedback ? <Check size={14} /> : <ListPlus size={14} />}
                      {lyricsScheduleFeedback ? 'Added to Schedule!' : 'Add to Schedule'}
                    </button>

                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '7px 16px' }}
                      onClick={handleGoLiveLyrics}
                    >
                      {lyricsLiveFeedback ? <Check size={14} /> : <Play size={14} />}
                      {lyricsLiveFeedback ? 'Loading Live...' : 'Go Live Now'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px', padding: '2rem', textAlign: 'center', gap: '8px' }}>
                <Music size={32} style={{ opacity: 0.3 }} />
                <span>Select any song from the left search list to preview its slide layout and load it live.</span>
                <button
                  className="btn"
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.18) 100%)',
                    borderColor: 'rgba(139, 92, 246, 0.4)',
                    color: '#c084fc',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  onClick={() => {
                    setEditingSong(null);
                    setIsSongEditorOpen(true);
                  }}
                >
                  <Plus size={13} /> Paste / Add Lyric Manually
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Song Bank Manual Lyric Editor Modal */}
      <SongBankEditorModal
        isOpen={isSongEditorOpen}
        onClose={() => setIsSongEditorOpen(false)}
        initialSong={editingSong}
        onSave={(item) => {
          onSaveLibraryItem(item);
          const onlineFormat: OnlineSongResult = {
            id: item.id,
            trackName: item.title,
            artistName: item.author || 'Local Church Library',
            snippet: item.lines?.slice(0, 2).join(' • ') || '',
            plainLyrics: item.content || item.lines?.join('\n') || '',
            isLocal: true,
            localItem: item,
          };
          setSelectedSong(onlineFormat);
          setLyricsSavedFeedback(`"${item.title}" saved to Song Bank!`);
          setTimeout(() => setLyricsSavedFeedback(null), 3000);
        }}
        onSaveAndGoLive={(item) => {
          onSaveLibraryItem(item);
          onGoLiveWithItem(item);
          onClose();
        }}
        onSaveAndAddToSchedule={(item) => {
          onSaveLibraryItem(item);
          onAddToSchedule(item);
        }}
      />
    </div>
  );
};
export default OnlineLyricsSearchModal;
