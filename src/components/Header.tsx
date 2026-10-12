import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Layers, 
  Mic2, 
  Bell, 
  BookOpen, 
  RotateCcw, 
  ExternalLink,
  Circle,
  Radio,
  Image as ImageIcon,
  Search,
  Clock,
  Download,
  Check,
  ChevronDown,
  SlidersHorizontal,
  EyeOff
} from 'lucide-react';
import { LiveState, TimerState } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ResetConfirmModal } from './ResetConfirmModal';

interface HeaderProps {
  isConnected: boolean;
  sessionId?: string;
  onOpenSessionModal?: () => void;
  liveState: LiveState;
  timerState: TimerState;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onSetQuickAlert: (text: string | null) => void;
  onOpenLibrary: () => void;
  onOpenScriptures: () => void;
  onOpenOnlineSearch: () => void;
  onOpenTimer: () => void;
  onSetTimerConfig?: (config: Partial<TimerState>) => void;
  onResetToDefault: () => void;
  onResetAllToDefault?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  sessionId = 'default',
  onOpenSessionModal,
  liveState,
  timerState,
  onUpdateLiveState,
  onSetQuickAlert,
  onOpenLibrary,
  onOpenScriptures,
  onOpenOnlineSearch,
  onOpenTimer,
  onSetTimerConfig,
  onResetToDefault,
  onResetAllToDefault,
}) => {
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDisplaysDropdownOpen, setIsDisplaysDropdownOpen] = useState(false);
  const displaysDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isOptionsDropdownOpen, setIsOptionsDropdownOpen] = useState(false);
  const optionsDropdownRef = useRef<HTMLDivElement | null>(null);
  // const [installSuccessToast, setInstallSuccessToast] = useState(false);
  const [alertText, setAlertText] = useState(liveState.quickAlert || '');
  const [now, setNow] = useState(Date.now());

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (displaysDropdownRef.current && !displaysDropdownRef.current.contains(e.target as Node)) {
        setIsDisplaysDropdownOpen(false);
      }
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(e.target as Node)) {
        setIsOptionsDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDisplaysDropdownOpen(false);
        setIsOptionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  useEffect(() => {
    if (timerState.status === 'running') {
      const interval = setInterval(() => setNow(Date.now()), 500);
      return () => clearInterval(interval);
    }
  }, [timerState.status]);

  let headerTimerSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    headerTimerSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }
  const isOvertime = headerTimerSec < 0;
  const absSec = Math.abs(headerTimerSec);
  const mins = Math.floor(absSec / 60);
  const secs = absSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timerBadgeStr = `${isOvertime ? '-' : ''}${pad(mins)}:${pad(secs)}`;

  // Global hotkeys (Alt+B or F3 for Quick Scripture lookup)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) return;

      if (e.key === 'F3' || (e.altKey && (e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        onOpenScriptures();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenScriptures]);

  const toggleDisplayTimer = () => {
    if (onSetTimerConfig) {
      onSetTimerConfig({ showOnDisplay: !timerState.showOnDisplay });
    }
  };

  const toggleDisplayClock = () => {
    if (onSetTimerConfig) {
      onSetTimerConfig({ showClockOnDisplay: !timerState.showClockOnDisplay });
    }
  };

  const toggleBlackout = () => {
    onUpdateLiveState({ isBlackout: !liveState.isBlackout });
  };

  const toggleClearText = () => {
    onUpdateLiveState({ isClearText: !liveState.isClearText });
  };

  const toggleLogo = () => {
    onUpdateLiveState({ isLogo: !liveState.isLogo });
  };

  const handleApplyAlert = (e: React.FormEvent) => {
    e.preventDefault();
    onSetQuickAlert(alertText.trim() ? alertText.trim() : null);
    setIsAlertModalOpen(false);
  };

  const handleClearAlert = () => {
    setAlertText('');
    onSetQuickAlert(null);
    setIsAlertModalOpen(false);
  };

  const openBorderlessWindow = (url: string, windowName: string, e: React.MouseEvent) => {
    // If user clicked with Ctrl/Cmd or middle click, allow default link behaviour
    if (e.metaKey || e.ctrlKey || e.button === 1) return;
    e.preventDefault();

    const screenWidth = window.screen.availWidth || 1920;
    const screenHeight = window.screen.availHeight || 1080;
    const features = `width=${screenWidth},height=${screenHeight},left=0,top=0,popup=yes,menubar=no,toolbar=no,location=no,status=no,directories=no,resizable=yes,scrollbars=no`;
    
    const popupWin = window.open(url, windowName, features);
    if (!popupWin) {
      window.open(url, '_blank');
    } else {
      popupWin.focus();
    }
  };

  return (
    <header className="studio-header">
      {/* Left: Brand + Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div className="studio-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)'
            }}>
              <Radio size={16} color="#ffffff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.02em' }}>
              Easy<span style={{ color: '#38bdf8' }}>Presenter</span>
            </span>
          </div>
          <span className="logo-badge">STUDIO PRO</span>
        </div>

        {/* Live / Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          borderRadius: '999px',
          fontSize: '11px',
          fontWeight: 600,
          color: isConnected ? '#34d399' : '#f87171',
        }}>
          <Circle size={8} fill={isConnected ? '#10b981' : '#ef4444'} color="transparent" />
          <span>{isConnected ? 'LIVE' : 'RECONNECTING…'}</span>
        </div>

        {/* Interactive Session Badge */}
        <button
          type="button"
          className="btn"
          onClick={onOpenSessionModal}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            fontWeight: 800,
            background: 'rgba(56, 189, 248, 0.12)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            borderRadius: '999px',
            gap: '6px',
          }}
          title={`Active Session: "${sessionId}". Click to switch, create, or save sessions.`}
        >
          <Radio size={11} />
          <span>Session: <strong style={{ color: '#ffffff' }}>{sessionId}</strong></span>
        </button>
      </div>

      {/* Center: Live Options & Controls Bar */}
      <div className="panic-bar">
        {/* Output Options Dropdown (Black, Clear, Logo) */}
        <div style={{ position: 'relative' }} ref={optionsDropdownRef}>
          <button
            type="button"
            className="btn"
            onClick={() => setIsOptionsDropdownOpen((prev) => !prev)}
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              background: liveState.isBlackout
                ? 'rgba(239, 68, 68, 0.25)'
                : liveState.isClearText
                  ? 'rgba(59, 130, 246, 0.25)'
                  : liveState.isLogo
                    ? 'rgba(245, 158, 11, 0.25)'
                    : isOptionsDropdownOpen
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.06)',
              borderColor: liveState.isBlackout
                ? '#ef4444'
                : liveState.isClearText
                  ? '#3b82f6'
                  : liveState.isLogo
                    ? '#f59e0b'
                    : isOptionsDropdownOpen
                      ? 'rgba(255, 255, 255, 0.25)'
                      : 'rgba(255, 255, 255, 0.12)',
              color: liveState.isBlackout
                ? '#f87171'
                : liveState.isClearText
                  ? '#60a5fa'
                  : liveState.isLogo
                    ? '#fbbf24'
                    : '#cbd5e1',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: liveState.isBlackout
                ? '0 0 12px rgba(239, 68, 68, 0.4)'
                : liveState.isClearText
                  ? '0 0 12px rgba(59, 130, 246, 0.4)'
                  : liveState.isLogo
                    ? '0 0 12px rgba(245, 158, 11, 0.4)'
                    : 'none',
            }}
            title="Display live override options: Blackout, Clear Text, Logo"
          >
            <SlidersHorizontal size={13} />
            <span>
              {liveState.isBlackout
                ? 'BLACKOUT'
                : liveState.isClearText
                  ? 'CLEAR TEXT'
                  : liveState.isLogo
                    ? 'LOGO'
                    : 'Options'}
            </span>
            {(liveState.isBlackout || liveState.isClearText || liveState.isLogo) && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: liveState.isBlackout
                    ? '#ef4444'
                    : liveState.isClearText
                      ? '#3b82f6'
                      : '#f59e0b',
                }}
              />
            )}
            <ChevronDown
              size={12}
              style={{
                transform: isOptionsDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s ease',
                opacity: 0.8,
              }}
            />
          </button>

          {isOptionsDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '240px',
                background: '#0b1120',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85), 0 0 20px rgba(0, 0, 0, 0.5)',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  padding: '6px 10px 4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Live Output Options
              </div>

              {/* 1. Blackout */}
              <button
                type="button"
                onClick={toggleBlackout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  background: liveState.isBlackout
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'transparent',
                  border: liveState.isBlackout
                    ? '1px solid #ef4444'
                    : '1px solid transparent',
                  color: liveState.isBlackout ? '#f87171' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!liveState.isBlackout) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!liveState.isBlackout) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      boxShadow: liveState.isBlackout ? '0 0 8px #ef4444' : 'none',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>Black Screen (BLACK)</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Instant blackout on displays</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: liveState.isBlackout ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                    color: liveState.isBlackout ? '#ffffff' : '#64748b',
                  }}
                >
                  {liveState.isBlackout ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 2. Clear Text */}
              <button
                type="button"
                onClick={toggleClearText}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  background: liveState.isClearText
                    ? 'rgba(59, 130, 246, 0.2)'
                    : 'transparent',
                  border: liveState.isClearText
                    ? '1px solid #3b82f6'
                    : '1px solid transparent',
                  color: liveState.isClearText ? '#60a5fa' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!liveState.isClearText) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!liveState.isClearText) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <EyeOff size={14} color="#3b82f6" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>Clear Text (CLEAR)</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Hide text, retain background</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: liveState.isClearText ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                    color: liveState.isClearText ? '#ffffff' : '#64748b',
                  }}
                >
                  {liveState.isClearText ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 3. Logo Mode */}
              <button
                type="button"
                onClick={toggleLogo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  background: liveState.isLogo
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'transparent',
                  border: liveState.isLogo
                    ? '1px solid #f59e0b'
                    : '1px solid transparent',
                  color: liveState.isLogo ? '#fbbf24' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!liveState.isLogo) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!liveState.isLogo) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <ImageIcon size={14} color="#f59e0b" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12px' }}>Church Logo (LOGO)</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Display church logo overlay</div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: liveState.isLogo ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                    color: liveState.isLogo ? '#ffffff' : '#64748b',
                  }}
                >
                  {liveState.isLogo ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}
        </div>

        <button
          className="btn"
          style={{
            background: liveState.quickAlert ? '#ef4444' : 'rgba(255, 255, 255, 0.06)',
            color: liveState.quickAlert ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            padding: '6px 12px',
          }}
          onClick={() => {
            setAlertText(liveState.quickAlert || '');
            setIsAlertModalOpen(true);
          }}
          title="Send instant nursery/pastor broadcast alert ticker"
        >
          <Bell size={13} />
          {liveState.quickAlert ? 'ALERT ACTIVE' : 'TICKER ALERT'}
        </button>

        {/* Live Countdown & Overtime Timer Quick Button */}
        <button
          className="btn"
          style={{
            background: isOvertime
              ? '#ef4444'
              : timerState.status === 'running'
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(255, 255, 255, 0.06)',
            borderColor: isOvertime
              ? '#ef4444'
              : timerState.status === 'running'
                ? '#10b981'
                : 'rgba(255, 255, 255, 0.14)',
            color: isOvertime ? '#ffffff' : timerState.status === 'running' ? '#34d399' : '#e2e8f0',
            fontSize: '12px',
            padding: '6px 12px',
            fontWeight: 800,
            gap: '6px',
            fontVariantNumeric: 'tabular-nums',
            boxShadow: isOvertime ? '0 0 15px rgba(239, 68, 68, 0.5)' : 'none',
          }}
          onClick={onOpenTimer}
          title="Open Countdown & Overtime Timer Studio"
        >
          <Clock size={13} />
          <span>
            {isOvertime
              ? `TIME UP (${timerBadgeStr})`
              : timerState.status === 'running'
                ? `TIMER: ${timerBadgeStr}`
                : `TIMER (${timerBadgeStr})`}
          </span>
        </button>
      </div>

      {/* Right: Output Windows, Install App & Library Drawer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* PWA Install App Button */}
        {/* {isInstallable && (
          <button
            type="button"
            className="btn"
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: '#ffffff',
              fontWeight: 800,
              border: 'none',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.45)',
              gap: '6px',
            }}
            onClick={async () => {
              const installed = await promptInstall();
              if (installed) {
                setInstallSuccessToast(true);
                setTimeout(() => setInstallSuccessToast(false), 3000);
              }
            }}
            title="Install EasyPresenter Studio on your Desktop for native standalone performance"
          >
            <Download size={13} />
            Install App
          </button>
        )}

        {isInstalled && (
          <div
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '6px',
              color: '#38bdf8',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Running in Desktop Standalone Application mode"
          >
            <Check size={11} />
            Desktop App
          </div>
        )} */}

        <button 
          className="btn"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            background: 'rgba(56, 189, 248, 0.12)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            fontWeight: 700,
            gap: '6px',
          }}
          onClick={onOpenOnlineSearch}
          title="Search song lyrics and worship songs online"
        >
          <Search size={13} />
           Lyrics
        </button>
        <button 
          className="btn"
          style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.08)', color: '#ffffff' }}
          onClick={onOpenLibrary}
        >
          <BookOpen size={14} />
          Library
        </button>

        <a
          href="/v2"
          className="btn"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            borderColor: 'rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.15)',
          }}
          title="Open Simple V2 Scripture & Countdown Presenter"
        >
          <BookOpen size={13} />
          V2 Presenter
        </a>

        {/* Subtle vertical separator */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }} />

        {/* Displays & Output Screens Dropdown */}
        <div style={{ position: 'relative' }} ref={displaysDropdownRef}>
          <button
            type="button"
            className="btn"
            onClick={() => setIsDisplaysDropdownOpen((prev) => !prev)}
            style={{
              fontSize: '12px',
              padding: '6px 12px',
              background: isDisplaysDropdownOpen
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(255, 255, 255, 0.08)',
              borderColor: isDisplaysDropdownOpen
                ? '#38bdf8'
                : 'rgba(255, 255, 255, 0.16)',
              color: isDisplaysDropdownOpen ? '#38bdf8' : '#ffffff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: isDisplaysDropdownOpen
                ? '0 0 14px rgba(56, 189, 248, 0.25)'
                : 'none',
            }}
            title="Open audience display, vMix overlay, timer, or stage monitor"
          >
            <Tv size={13} color="#38bdf8" />
            <span>Displays</span>
            <ChevronDown
              size={12}
              style={{
                transform: isDisplaysDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.18s ease',
                opacity: 0.8,
              }}
            />
          </button>

          {isDisplaysDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '260px',
                background: '#0b1120',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '10px',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(56, 189, 248, 0.2)',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div
                style={{
                  padding: '6px 10px 4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#64748b',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Output Screens & Overlays
              </div>

              {/* 1. Main Display */}
              <a
                href="/display"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  openBorderlessWindow('/display', 'easypresenter_display', e);
                  setIsDisplaysDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Tv size={15} color="#38bdf8" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>Projector / TV Display</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Main audience screen (/display)</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#64748b" />
              </a>

              {/* 2. vMix / OBS Overlay */}
              <a
                href="/display?overlay=1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  openBorderlessWindow('/display?overlay=1', 'easypresenter_vmix', e);
                  setIsDisplaysDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Layers size={15} color="#60a5fa" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#60a5fa' }}>vMix / OBS Overlay</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Alpha-channel broadcast overlay</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#64748b" />
              </a>

              {/* 3. Timer Screen */}
              <a
                href="/timer"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  openBorderlessWindow('/timer', 'easypresenter_timer', e);
                  setIsDisplaysDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14, 165, 233, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Clock size={15} color="#38bdf8" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>Countdown Timer Display</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Full clock & overtime monitor</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#64748b" />
              </a>

              {/* 4. vMix Timer Overlay */}
              <a
                href="/timer?overlay=1"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  openBorderlessWindow('/timer?overlay=1', 'easypresenter_vmix_timer', e);
                  setIsDisplaysDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Clock size={15} color="#34d399" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>vMix Timer Overlay</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Lower-third countdown overlay</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#64748b" />
              </a>

              {/* 5. Stage Monitor */}
              <a
                href="/stage"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  openBorderlessWindow('/stage', 'easypresenter_stage', e);
                  setIsDisplaysDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '7px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12px',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Mic2 size={15} color="#c084fc" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#c084fc' }}>Stage Monitor</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Confidence screen for singers</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#64748b" />
              </a>
            </div>
          )}
        </div>

        <button
          className="btn btn-icon"
          title="Reset Session or Clear All Sessions to Default"
          onClick={() => setIsResetModalOpen(true)}
          style={{ color: '#94a3b8' }}
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        currentSessionId={sessionId}
        onResetCurrentSession={onResetToDefault}
        onResetAllSessions={onResetAllToDefault || onResetToDefault}
      />

      {/* Quick Ticker / Alert Modal */}
      {isAlertModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAlertModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
                <Bell size={16} color="#ef4444" />
                Live Broadcast Ticker / Alert Banner
              </div>
              <button 
                className="btn btn-icon" 
                onClick={() => setIsAlertModalOpen(false)}
                style={{ background: 'transparent' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleApplyAlert}>
              <div className="modal-body">
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.5 }}>
                  This will show a high-visibility emergency banner at the top of all live displays and vMix overlays (e.g. <em>"Nursery Alert: Child #402"</em>, <em>"Car Lights On: ABC-123"</em>).
                </p>
                <div className="form-group">
                  <label className="form-label">Alert Message</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter broadcast alert message..."
                    value={alertText}
                    onChange={e => setAlertText(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                {liveState.quickAlert && (
                  <button type="button" className="btn btn-danger" onClick={handleClearAlert}>
                    Dismiss Active Alert
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setIsAlertModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Broadcast Alert Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
