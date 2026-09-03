import React, { useState, useEffect } from 'react';
import { TimerState, TimerSlot } from '../types';
import { TIMER_SCHEDULE_PRESETS } from '../data/defaults';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Send, 
  EyeOff, 
  ExternalLink, 
  Layers, 
  Tv, 
  MessageSquare, 
  Sparkles, 
  Check, 
  ListOrdered, 
  FastForward, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  User, 
  SkipBack, 
  Bookmark,
  Pencil,
  X,
  Type
} from 'lucide-react';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerState: TimerState;
  onStartTimer: (durationSec?: number, title?: string) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onAdjustTimer: (deltaSec: number) => void;
  onSetTimerConfig: (config: Partial<TimerState>) => void;
  onSetTimerPrompt: (message: string | null, visible: boolean) => void;
  onAddTimerSlot?: (slot: TimerSlot) => void;
  onUpdateTimerSlot?: (id: string, slot: Partial<TimerSlot>) => void;
  onDeleteTimerSlot?: (id: string) => void;
  onReorderTimerSlots?: (slots: TimerSlot[]) => void;
  onJumpToTimerSlot?: (index: number, autoStart?: boolean) => void;
  onNextTimerSlot?: (autoStart?: boolean) => void;
  onPrevTimerSlot?: (autoStart?: boolean) => void;
  onSetTimerSlots?: (slots: TimerSlot[], activeIndex?: number) => void;
}

export const TimerModal: React.FC<TimerModalProps> = ({
  isOpen,
  onClose,
  timerState,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onAdjustTimer,
  onSetTimerConfig,
  onSetTimerPrompt,
  onAddTimerSlot,
  onUpdateTimerSlot,
  onDeleteTimerSlot,
  onReorderTimerSlots,
  onJumpToTimerSlot,
  onNextTimerSlot,
  onPrevTimerSlot,
  onSetTimerSlots,
}) => {
  const [activeTab, setActiveTab] = useState<'rundown' | 'quick' | 'prompts'>('rundown');
  const [customMins, setCustomMins] = useState(Math.round(timerState.durationSec / 60));
  const [titleInput, setTitleInput] = useState(timerState.title);
  const [promptInput, setPromptInput] = useState(timerState.promptMessage || '');
  const [targetTimeStr, setTargetTimeStr] = useState('');
  const [now, setNow] = useState(Date.now());

  // New Slot Form State
  const [newSlotTitle, setNewSlotTitle] = useState('');
  const [newSlotMins, setNewSlotMins] = useState(15);
  const [newSlotWarningSec, setNewSlotWarningSec] = useState<number>(300);
  const [newSlotSpeaker, setNewSlotSpeaker] = useState('');
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  // Editing Slot State
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editSlotTitle, setEditSlotTitle] = useState('');
  const [editSlotMins, setEditSlotMins] = useState(15);
  const [editSlotWarningSec, setEditSlotWarningSec] = useState<number>(300);
  const [editSlotSpeaker, setEditSlotSpeaker] = useState('');

  const startEditingSlot = (slot: TimerSlot) => {
    setEditingSlotId(slot.id);
    setEditSlotTitle(slot.title);
    setEditSlotMins(Math.max(1, Math.round(slot.durationSec / 60)));
    setEditSlotWarningSec(slot.warningThresholdSec ?? 300);
    setEditSlotSpeaker(slot.speaker || '');
  };

  const saveEditingSlot = (id: string) => {
    if (!editSlotTitle.trim()) return;
    if (onUpdateTimerSlot) {
      onUpdateTimerSlot(id, {
        title: editSlotTitle.trim(),
        durationSec: Math.max(1, editSlotMins) * 60,
        speaker: editSlotSpeaker.trim() || undefined,
        warningThresholdSec: editSlotWarningSec,
      });
    }
    setEditingSlotId(null);
  };

  const cancelEditingSlot = () => {
    setEditingSlotId(null);
  };

  // Update live preview ticking
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setNow(Date.now());
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    setTitleInput(timerState.title);
  }, [timerState.title]);

  useEffect(() => {
    if (timerState.promptMessage) {
      setPromptInput(timerState.promptMessage);
    }
  }, [timerState.promptMessage]);

  if (!isOpen) return null;

  // Calculate live remaining seconds
  let currentSec = timerState.remainingSec;
  if (timerState.status === 'running' && timerState.targetEndTime) {
    currentSec = Math.floor((timerState.targetEndTime - now) / 1000);
  }

  const isOvertime = currentSec < 0;
  const absSec = Math.abs(currentSec);

  const slots: TimerSlot[] = timerState.slots || [];
  const activeSlotIndex = typeof timerState.activeSlotIndex === 'number' ? timerState.activeSlotIndex : 0;
  const currentSlot = slots[activeSlotIndex] || null;
  const nextSlot = activeSlotIndex + 1 < slots.length ? slots[activeSlotIndex + 1] : null;

  // Total schedule duration calculation
  const totalScheduleSec = slots.reduce((acc, slot) => acc + (slot.durationSec || 0), 0);
  const totalScheduleMins = Math.round(totalScheduleSec / 60);

  const formatDisplayTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');

    let str = hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
    if (isOvertime) str = `-${str}`;
    return str;
  };

  const handleApplyPreset = (minutes: number) => {
    setCustomMins(minutes);
    const sec = minutes * 60;
    onSetTimerConfig({ durationSec: sec, remainingSec: sec });
    if (timerState.status === 'idle') {
      onStartTimer(sec, titleInput);
    }
  };

  const handleApplyCustomDuration = () => {
    const sec = Math.max(10, customMins * 60);
    onSetTimerConfig({ durationSec: sec, remainingSec: sec, title: titleInput });
  };

  const handleScheduleTargetTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTimeStr) return;

    const [hrs, mins] = targetTimeStr.split(':').map(Number);
    if (isNaN(hrs) || isNaN(mins)) return;

    const targetDate = new Date();
    targetDate.setHours(hrs, mins, 0, 0);

    let diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const durationSec = Math.round(diffMs / 1000);
    setCustomMins(Math.round(durationSec / 60));
    onSetTimerConfig({
      durationSec,
      remainingSec: durationSec,
      title: titleInput || 'Scheduled Countdown',
    });
    onStartTimer(durationSec, titleInput || 'Scheduled Countdown');
  };

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim()) return;
    onSetTimerPrompt(promptInput.trim(), true);
  };

  const handleDismissPrompt = () => {
    onSetTimerPrompt(null, false);
    setPromptInput('');
  };

  // Slot Management Handlers
  const handleAddNewSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotTitle.trim()) return;
    const newSlot: TimerSlot = {
      id: `slot-${Date.now()}`,
      title: newSlotTitle.trim(),
      durationSec: Math.max(10, newSlotMins * 60),
      speaker: newSlotSpeaker.trim() || undefined,
      warningThresholdSec: newSlotWarningSec,
    };
    if (onAddTimerSlot) {
      onAddTimerSlot(newSlot);
    }
    setNewSlotTitle('');
    setNewSlotSpeaker('');
    setNewSlotWarningSec(300);
    setIsAddingSlot(false);
  };

  const handleMoveSlot = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slots.length || !onReorderTimerSlots) return;

    const newSlots = [...slots];
    const temp = newSlots[index];
    newSlots[index] = newSlots[targetIndex];
    newSlots[targetIndex] = temp;
    onReorderTimerSlots(newSlots);
  };

  const handleLoadPresetSchedule = (presetSlots: TimerSlot[]) => {
    if (onSetTimerSlots) {
      const clonedSlots = presetSlots.map((s, i) => ({
        ...s,
        id: `slot-${Date.now()}-${i}`,
      }));
      onSetTimerSlots(clonedSlots, 0);
    }
  };

  const QUICK_PRESETS = [5, 10, 15, 20, 30, 45, 60, 90];
  const QUICK_PROMPTS = [
    '2 Minutes Remaining',
    'Please Wrap Up Sermon',
    'Time Up — Conclude',
    'Standby for Offering',
    'Worship Team to Stage',
    'Welcome! Service Starts Soon',
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(14, 165, 233, 0.45)'
            }}>
              <Clock size={19} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '17px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Timer Studio & Program Rundown
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Sequential program schedule slots, confidence monitor ticker & vMix broadcast sync
              </div>
            </div>
          </div>
          <button 
            className="btn btn-icon" 
            onClick={onClose}
            style={{ background: 'transparent', color: '#94a3b8' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top Live Hero Card */}
          <div style={{
            background: isOvertime 
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(15, 23, 42, 0.95))'
              : 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.95))',
            border: `1px solid ${isOvertime ? 'rgba(239, 68, 68, 0.5)' : 'rgba(14, 165, 233, 0.35)'}`,
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  background: isOvertime
                    ? '#ef4444'
                    : timerState.status === 'running'
                      ? '#10b981'
                      : timerState.status === 'paused'
                        ? '#f59e0b'
                        : '#64748b',
                  color: 'white',
                  textTransform: 'uppercase'
                }}>
                  {isOvertime ? 'OVERTIME' : timerState.status}
                </span>

                {slots.length > 0 && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}>
                    SLOT {activeSlotIndex + 1} OF {slots.length}
                  </span>
                )}

                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                  {timerState.title || (currentSlot ? currentSlot.title : 'Countdown')}
                </span>
                {currentSlot?.speaker && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    ({currentSlot.speaker})
                  </span>
                )}
              </div>

              {/* Big Live Digits */}
              <div style={{
                fontSize: '46px',
                fontWeight: 900,
                fontFamily: '"JetBrains Mono", monospace',
                color: isOvertime ? '#ef4444' : timerState.status === 'running' ? '#38bdf8' : '#f8fafc',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1.1,
              }}>
                {formatDisplayTime(absSec)}
              </div>

              {/* Next Program Cue Note */}
              {nextSlot && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: isOvertime ? '#f87171' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, color: isOvertime ? '#fca5a5' : '#38bdf8' }}>
                    {isOvertime ? '▶ NEXT PROGRAM CUE ACTIVE:' : 'Next up:'}
                  </span>
                  <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{nextSlot.title}</span>
                  <span>({Math.round(nextSlot.durationSec / 60)}m)</span>
                </div>
              )}
            </div>

            {/* Direct Open Window Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="/timer"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ fontSize: '12px', padding: '7px 14px', textDecoration: 'none', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)', justifyContent: 'center' }}
              >
                <Tv size={13} /> Open Confidence Display
                <ExternalLink size={11} />
              </a>

              <a
                href="/timer?overlay=1"
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ fontSize: '12px', padding: '7px 14px', textDecoration: 'none', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)', justifyContent: 'center' }}
              >
                <Layers size={13} /> vMix Transparent Overlay
                <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Master Transport Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '10px 14px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Play/Pause/Reset Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {timerState.status === 'running' ? (
                <button
                  className="btn btn-warning"
                  onClick={onPauseTimer}
                  style={{ fontSize: '13px', padding: '9px 20px', fontWeight: 800, gap: '6px' }}
                >
                  <Pause size={15} /> Pause
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={() => onStartTimer(undefined, titleInput)}
                  style={{ fontSize: '13px', padding: '9px 22px', fontWeight: 800, gap: '6px', background: '#10b981', color: 'white' }}
                >
                  <Play size={15} fill="white" /> {timerState.status === 'paused' ? 'Resume' : 'Start'}
                </button>
              )}

              <button
                className="btn"
                onClick={onResetTimer}
                style={{ fontSize: '12px', padding: '9px 14px', gap: '6px' }}
                title="Reset to slot duration"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>

            {/* Sequential Slot Navigation Controls */}
            {slots.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  className="btn"
                  onClick={() => onPrevTimerSlot && onPrevTimerSlot(timerState.status === 'running')}
                  disabled={activeSlotIndex <= 0}
                  style={{ fontSize: '12px', padding: '8px 12px', gap: '4px' }}
                  title="Previous program slot"
                >
                  <SkipBack size={14} /> Prev Slot
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => onNextTimerSlot && onNextTimerSlot(true)}
                  disabled={activeSlotIndex >= slots.length - 1}
                  style={{ fontSize: '12px', padding: '8px 16px', fontWeight: 800, gap: '6px', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                  title="Advance and start next program slot"
                >
                  Next Program <FastForward size={14} />
                </button>
              </div>
            )}

            {/* Quick Nudges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-icon"
                onClick={() => onAdjustTimer(-60)}
                title="Subtract 1 minute"
                style={{ width: '34px', height: '34px', fontSize: '11px', fontWeight: 700 }}
              >
                -1m
              </button>
              <button
                className="btn btn-icon"
                onClick={() => onAdjustTimer(60)}
                title="Add 1 minute"
                style={{ width: '34px', height: '34px', fontSize: '11px', fontWeight: 700 }}
              >
                +1m
              </button>
              <button
                className="btn btn-icon"
                onClick={() => onAdjustTimer(300)}
                title="Add 5 minutes"
                style={{ width: '34px', height: '34px', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}
              >
                +5m
              </button>
            </div>
          </div>

          {/* Quick Display & Font Size Controls Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}>
                <Type size={15} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  Display Font Size
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                  (Confidence monitor digits scale)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[100, 125, 150, 175, 200, 250].map((scale) => {
                  const isSelected = (timerState.fontSizeScale || 100) === scale;
                  return (
                    <button
                      key={scale}
                      type="button"
                      className={`btn ${isSelected ? 'btn-primary' : ''}`}
                      style={{
                        fontSize: '11px',
                        padding: '4px 8px',
                        fontWeight: 700,
                        background: isSelected ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                        borderColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                      }}
                      onClick={() => onSetTimerConfig({ fontSizeScale: scale })}
                    >
                      {scale}%
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="range"
                  min={80}
                  max={300}
                  step={5}
                  value={timerState.fontSizeScale || 100}
                  onChange={(e) => onSetTimerConfig({ fontSizeScale: Number(e.target.value) })}
                  style={{ width: '80px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  minWidth: '38px',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {timerState.fontSizeScale || 100}%
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            gap: '8px',
          }}>
            <button
              className={`btn ${activeTab === 'rundown' ? 'btn-primary' : ''}`}
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                background: activeTab === 'rundown' ? '#3b82f6' : 'transparent',
                color: activeTab === 'rundown' ? '#ffffff' : '#94a3b8',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                gap: '8px'
              }}
              onClick={() => setActiveTab('rundown')}
            >
              <ListOrdered size={15} /> Program Rundown ({slots.length})
            </button>

            <button
              className={`btn ${activeTab === 'quick' ? 'btn-primary' : ''}`}
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                background: activeTab === 'quick' ? '#3b82f6' : 'transparent',
                color: activeTab === 'quick' ? '#ffffff' : '#94a3b8',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                gap: '8px'
              }}
              onClick={() => setActiveTab('quick')}
            >
              <Clock size={15} /> Single Timer & Presets
            </button>

            <button
              className={`btn ${activeTab === 'prompts' ? 'btn-primary' : ''}`}
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: 'none',
                background: activeTab === 'prompts' ? '#3b82f6' : 'transparent',
                color: activeTab === 'prompts' ? '#ffffff' : '#94a3b8',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                gap: '8px'
              }}
              onClick={() => setActiveTab('prompts')}
            >
              <MessageSquare size={15} /> Stage Prompts & Alerts
            </button>
          </div>

          {/* TAB 1: PROGRAM RUNDOWN SCHEDULE */}
          {activeTab === 'rundown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Rundown Summary Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '10px',
                padding: '10px 16px',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                    Service Rundown Schedule
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Total runtime: <strong style={{ color: '#38bdf8' }}>{totalScheduleMins} minutes</strong> ({Math.floor(totalScheduleMins/60)}h {totalScheduleMins%60}m) • {slots.length} sequential program slots
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '6px 14px', gap: '6px' }}
                    onClick={() => setIsAddingSlot(!isAddingSlot)}
                  >
                    <Plus size={14} /> Add Program Slot
                  </button>
                </div>
              </div>

              {/* Add New Slot Inline Form */}
              {isAddingSlot && (
                <form onSubmit={handleAddNewSlot} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>
                    New Program Slot Details
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr', gap: '10px' }}>
                    <div>
                      <label className="form-label">Program Title</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Praise & Worship"
                        value={newSlotTitle}
                        onChange={e => setNewSlotTitle(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Duration (Min)</label>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        className="form-input"
                        value={newSlotMins}
                        onChange={e => setNewSlotMins(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Warning Alert</label>
                      <select
                        className="form-input"
                        value={newSlotWarningSec}
                        onChange={e => setNewSlotWarningSec(Number(e.target.value))}
                      >
                        <option value={30}>30s (Urgent)</option>
                        <option value={60}>1 min</option>
                        <option value={120}>2 min</option>
                        <option value={180}>3 min</option>
                        <option value={300}>5 min (Default)</option>
                        <option value={600}>10 min</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Speaker / Lead (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Pastor John"
                        value={newSlotSpeaker}
                        onChange={e => setNewSlotSpeaker(e.target.value)}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={() => setIsAddingSlot(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '6px 16px' }}
                    >
                      Save Slot
                    </button>
                  </div>
                </form>
              )}

              {/* Slot Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slots.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No program slots in this schedule. Add a slot or load a service template below.
                  </div>
                ) : (
                  slots.map((slot, index) => {
                    const isActive = index === activeSlotIndex;
                    const isUpcomingNext = index === activeSlotIndex + 1;
                    const isCompleted = index < activeSlotIndex;
                    const isEditing = editingSlotId === slot.id;
                    const slotMins = Math.round(slot.durationSec / 60);

                    if (isEditing) {
                      return (
                        <div
                          key={slot.id}
                          style={{
                            background: 'rgba(56, 189, 248, 0.08)',
                            border: '1px solid #38bdf8',
                            borderRadius: '12px',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                              Editing Slot #{index + 1}
                            </span>
                            <button
                              type="button"
                              className="btn btn-icon"
                              style={{ width: '24px', height: '24px' }}
                              onClick={cancelEditingSlot}
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr', gap: '8px' }}>
                            <div>
                              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Title</label>
                              <input
                                type="text"
                                className="form-input"
                                style={{ fontSize: '13px', padding: '6px 10px' }}
                                value={editSlotTitle}
                                onChange={(e) => setEditSlotTitle(e.target.value)}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Duration (min)</label>
                              <input
                                type="number"
                                min={1}
                                max={300}
                                className="form-input"
                                style={{ fontSize: '13px', padding: '6px 10px' }}
                                value={editSlotMins}
                                onChange={(e) => setEditSlotMins(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              />
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Warning Alert</label>
                              <select
                                className="form-input"
                                style={{ fontSize: '13px', padding: '6px 10px' }}
                                value={editSlotWarningSec}
                                onChange={(e) => setEditSlotWarningSec(Number(e.target.value))}
                              >
                                <option value={30}>30s (Urgent)</option>
                                <option value={60}>1 min</option>
                                <option value={120}>2 min</option>
                                <option value={180}>3 min</option>
                                <option value={300}>5 min (Default)</option>
                                <option value={600}>10 min</option>
                              </select>
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Speaker / Leader</label>
                              <input
                                type="text"
                                className="form-input"
                                style={{ fontSize: '13px', padding: '6px 10px' }}
                                value={editSlotSpeaker}
                                onChange={(e) => setEditSlotSpeaker(e.target.value)}
                                placeholder="Optional"
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '2px' }}>
                            <button
                              type="button"
                              className="btn"
                              style={{ fontSize: '12px', padding: '5px 12px' }}
                              onClick={cancelEditingSlot}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: '12px', padding: '5px 14px' }}
                              onClick={() => saveEditingSlot(slot.id)}
                            >
                              <Check size={13} /> Save Slot
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slot.id}
                        style={{
                          background: isActive
                            ? 'rgba(56, 189, 248, 0.12)'
                            : isUpcomingNext
                              ? 'rgba(255, 255, 255, 0.04)'
                              : 'rgba(255, 255, 255, 0.02)',
                          border: isActive
                            ? '1px solid #38bdf8'
                            : isUpcomingNext
                              ? '1px solid rgba(56, 189, 248, 0.25)'
                              : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Left Number & Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                            color: isActive ? '#05070c' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}>
                            {index + 1}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontWeight: 800,
                                fontSize: '14px',
                                color: isActive ? '#ffffff' : '#e2e8f0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}>
                                {slot.title}
                              </span>

                              {isActive && (
                                <span style={{
                                  background: isOvertime ? '#ef4444' : '#10b981',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  letterSpacing: '0.05em'
                                }}>
                                  {isOvertime ? 'OVERTIME' : 'LIVE NOW'}
                                </span>
                              )}

                              {isUpcomingNext && !isActive && (
                                <span style={{
                                  background: 'rgba(56, 189, 248, 0.18)',
                                  color: '#38bdf8',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                }}>
                                  NEXT UP
                                </span>
                              )}

                              {isCompleted && !isActive && (
                                <span style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: '#64748b',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Check size={10} /> DONE
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                              <span>Duration: <strong style={{ color: '#cbd5e1' }}>{slotMins} min</strong></span>
                              <span>• Warn: <strong style={{ color: '#f59e0b' }}>{slot.warningThresholdSec ? (slot.warningThresholdSec >= 60 ? `${Math.round(slot.warningThresholdSec / 60)}m` : `${slot.warningThresholdSec}s`) : '5m'}</strong></span>
                              {slot.speaker && (
                                <span>• <User size={11} style={{ display: 'inline' }} /> {slot.speaker}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {/* Jump to slot button */}
                          <button
                            type="button"
                            className={`btn ${isActive ? 'btn-primary' : ''}`}
                            style={{
                              fontSize: '11px',
                              padding: '5px 10px',
                              fontWeight: 700,
                              background: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.06)',
                              color: isActive ? '#05070c' : '#e2e8f0',
                            }}
                            onClick={() => onJumpToTimerSlot && onJumpToTimerSlot(index, true)}
                            title="Make active and start timer"
                          >
                            <Play size={12} fill={isActive ? '#05070c' : 'currentColor'} /> {isActive ? 'Live' : 'Jump'}
                          </button>

                          {/* Edit Slot */}
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => startEditingSlot(slot)}
                            style={{ width: '28px', height: '28px', color: '#38bdf8' }}
                            title="Edit Slot"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Move Up/Down */}
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => handleMoveSlot(index, 'up')}
                            disabled={index === 0}
                            style={{ width: '28px', height: '28px' }}
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => handleMoveSlot(index, 'down')}
                            disabled={index === slots.length - 1}
                            style={{ width: '28px', height: '28px' }}
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>

                          {/* Delete Slot */}
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => onDeleteTimerSlot && onDeleteTimerSlot(slot.id)}
                            style={{ width: '28px', height: '28px', color: '#ef4444' }}
                            title="Remove Slot"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Service Template Presets */}
              <div style={{
                marginTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '14px',
              }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bookmark size={14} color="#f59e0b" />
                  Load Starter Service Templates
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {TIMER_SCHEDULE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className="btn"
                      style={{
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        textAlign: 'left',
                      }}
                      onClick={() => handleLoadPresetSchedule(preset.slots)}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {preset.slots.length} slots • {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SINGLE TIMER & QUICK PRESETS */}
          {activeTab === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Preset Durations */}
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#f59e0b" />
                  Quick Countdown Presets
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {QUICK_PRESETS.map((mins) => {
                    const isActive = Math.round(timerState.durationSec / 60) === mins;
                    return (
                      <button
                        key={mins}
                        className={`btn ${isActive ? 'btn-primary' : ''}`}
                        style={{
                          fontSize: '13px',
                          padding: '10px 12px',
                          fontWeight: 700,
                          justifyContent: 'center',
                          background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                        }}
                        onClick={() => handleApplyPreset(mins)}
                      >
                        {mins} Min
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Duration & Schedule Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px',
              }}>
                {/* Custom Minutes Input */}
                <div>
                  <label className="form-label">Custom Duration (Minutes)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      className="form-input"
                      value={customMins}
                      onChange={e => setCustomMins(Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApplyCustomDuration}
                      style={{ flexShrink: 0, padding: '0 14px' }}
                    >
                      Set
                    </button>
                  </div>
                </div>

                {/* Target Schedule Time of Day */}
                <form onSubmit={handleScheduleTargetTime}>
                  <label className="form-label">Target Schedule End Time</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="time"
                      className="form-input"
                      value={targetTimeStr}
                      onChange={e => setTargetTimeStr(e.target.value)}
                      placeholder="e.g. 11:30"
                    />
                    <button
                      type="submit"
                      className="btn"
                      style={{ flexShrink: 0, padding: '0 14px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}
                      disabled={!targetTimeStr}
                    >
                      Schedule
                    </button>
                  </div>
                </form>
              </div>

              {/* Title and Overtime Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Active Timer Title / Label</label>
                  <input
                    type="text"
                    className="form-input"
                    value={titleInput}
                    onChange={e => {
                      setTitleInput(e.target.value);
                      onSetTimerConfig({ title: e.target.value });
                    }}
                    placeholder="e.g. Sermon, Worship Set, Service Countdown"
                  />
                </div>

                <div>
                  <label className="form-label">Warning Threshold</label>
                  <select
                    className="form-input"
                    value={timerState.warningThresholdSec}
                    onChange={e => onSetTimerConfig({ warningThresholdSec: Number(e.target.value) })}
                  >
                    <option value={60}>1 Minute (Urgent)</option>
                    <option value={180}>3 Minutes</option>
                    <option value={300}>5 Minutes (Recommended)</option>
                    <option value={600}>10 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Time Counter Font Size Quick Setting (Tab 2) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Type size={14} color="#38bdf8" /> Time Counter Font Size
                  </label>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}>
                    {timerState.fontSizeScale || 100}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                  {[100, 125, 150, 175, 200, 250].map((scale) => {
                    const isSelected = (timerState.fontSizeScale || 100) === scale;
                    return (
                      <button
                        key={scale}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : ''}`}
                        style={{
                          fontSize: '11px',
                          padding: '6px 4px',
                          fontWeight: 700,
                          justifyContent: 'center',
                          background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                        }}
                        onClick={() => onSetTimerConfig({ fontSizeScale: scale })}
                      >
                        {scale}%
                      </button>
                    );
                  })}
                </div>

                <input
                  type="range"
                  min={80}
                  max={300}
                  step={5}
                  value={timerState.fontSizeScale || 100}
                  onChange={(e) => onSetTimerConfig({ fontSizeScale: Number(e.target.value) })}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </div>

            </div>
          )}

          {/* TAB 3: STAGE PROMPTS & SETTINGS */}
          {activeTab === 'prompts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Slide-Below Prompt Message Broadcaster */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={14} color="#f59e0b" />
                    Stage Prompt Message (Slides Below Display)
                  </label>
                  {timerState.promptVisible && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                    }}>
                      ● LIVE ON DISPLAY
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                  Sends an immediate custom message that smoothly slides up from the bottom of the confidence timer screen.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Pastor: 2 minutes left, wrap up sermon..."
                    value={promptInput}
                    onChange={e => setPromptInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendPrompt();
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSendPrompt()}
                    style={{ flexShrink: 0, gap: '6px' }}
                    disabled={!promptInput.trim()}
                  >
                    <Send size={13} /> Send Prompt
                  </button>
                  {timerState.promptVisible && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDismissPrompt}
                      style={{ flexShrink: 0, gap: '6px' }}
                    >
                      <EyeOff size={13} /> Dismiss
                    </button>
                  )}
                </div>

                {/* Quick Prompt Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {QUICK_PROMPTS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="btn"
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: promptInput === chip ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: promptInput === chip ? '#f59e0b' : '#94a3b8',
                        borderColor: promptInput === chip ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                      }}
                      onClick={() => {
                        setPromptInput(chip);
                        onSetTimerPrompt(chip, true);
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Display Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Time Counter Font Size Setting (Tab 3) */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Type size={14} color="#38bdf8" /> Time Counter Font Size
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Scale the timer digits on the confidence monitor display
                      </div>
                    </div>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}>
                      {timerState.fontSizeScale || 100}%
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
                    {[100, 125, 150, 175, 200, 250].map((scale) => {
                      const isSelected = (timerState.fontSizeScale || 100) === scale;
                      return (
                        <button
                          key={scale}
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : ''}`}
                          style={{
                            fontSize: '11px',
                            padding: '6px 4px',
                            fontWeight: 700,
                            justifyContent: 'center',
                            background: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                          }}
                          onClick={() => onSetTimerConfig({ fontSizeScale: scale })}
                        >
                          {scale}%
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="range"
                    min={80}
                    max={300}
                    step={5}
                    value={timerState.fontSizeScale || 100}
                    onChange={(e) => onSetTimerConfig({ fontSizeScale: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>

                {/* Sliding Next Program Alert Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(56, 189, 248, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FastForward size={14} color="#38bdf8" />
                      Slide 'Next Program' Alert on Time Up
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      When a slot reaches 00:00, smoothly slide a marquee banner reading <strong>"Next program: [name]"</strong> at the bottom of the confidence display.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={timerState.showNextProgramAlert !== false}
                    onChange={e => onSetTimerConfig({ showNextProgramAlert: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                  />
                </div>

                {/* Overtime Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Overtime Count-Up
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      When reaching 00:00, show "TIME UP" and count up elapsed negative time
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={timerState.allowOvertime}
                    onChange={e => onSetTimerConfig({ allowOvertime: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </div>

                {/* Auto Advance Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Auto-Advance to Next Slot
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Automatically transition and start countdown for the next program slot when time reaches 00:00
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(timerState.autoAdvance)}
                    onChange={e => onSetTimerConfig({ autoAdvance: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {slots.length} scheduled slots • Real-time confidence monitor sync
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
