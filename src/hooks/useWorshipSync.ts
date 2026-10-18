import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, WebSocketClientMessage, WebSocketServerMessage, PresentationTheme, LiveState, Schedule, ScheduleItem, LibraryItem, TimerState, TimerSlot } from '../types';
import { DEFAULT_THEME, DEFAULT_LIBRARY_ITEMS, DEFAULT_SCHEDULES, DEFAULT_TIMER_STATE, DEFAULT_SCRIPTURE_FORMATTING, DEFAULT_LYRICS_FORMATTING } from '../data/defaults';

const INITIAL_STATE: AppState = {
  title: 'Psalm 23',
  subtitle: 'Scripture Reading',
  category: 'scripture',
  lines: DEFAULT_LIBRARY_ITEMS[0].lines,
  cur: 0,
  playing: false,
  wpm: 130,
  lineStartedAt: null,
  lineDurationMs: null,
  liveState: {
    isBlackout: false,
    isClearText: false,
    isLogo: false,
    isFrozen: false,
    quickAlert: null,
  },
  timerState: DEFAULT_TIMER_STATE,
  theme: DEFAULT_THEME,
  currentScheduleId: 'sunday-morning-worship',
  activeScheduleIndex: 0,
  schedule: DEFAULT_SCHEDULES[0].items,
  savedSchedules: DEFAULT_SCHEDULES,
  library: DEFAULT_LIBRARY_ITEMS,
};

const SESSION_STORAGE_KEY = 'easystream_active_session_id';
const SAVED_SESSIONS_KEY = 'easystream_saved_sessions_list';

export function getActiveSessionId(): string {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim().toLowerCase();
    }
  } catch {}
  return 'default';
}

function getCachedStateForSession(sessionId: string): AppState {
  let baseState: AppState = INITIAL_STATE;
  try {
    const cached = localStorage.getItem(`easystream_state_${sessionId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        baseState = {
          ...INITIAL_STATE,
          ...parsed,
          timerState: {
            ...INITIAL_STATE.timerState,
            ...(parsed.timerState || {}),
          },
          liveState: {
            ...INITIAL_STATE.liveState,
            ...(parsed.liveState || {}),
          },
          theme: {
            ...INITIAL_STATE.theme,
            ...(parsed.theme || {}),
            scripture: {
              ...(INITIAL_STATE.theme.scripture || DEFAULT_SCRIPTURE_FORMATTING),
              ...((parsed.theme && parsed.theme.scripture) || {}),
            },
            lyrics: {
              ...(INITIAL_STATE.theme.lyrics || DEFAULT_LYRICS_FORMATTING),
              ...((parsed.theme && parsed.theme.lyrics) || {}),
            },
          },
        };

        // Recalculate live remaining seconds if timer was running
        if (baseState.timerState.status === 'running' && baseState.timerState.targetEndTime) {
          const now = Date.now();
          baseState.timerState.remainingSec = Math.floor((baseState.timerState.targetEndTime - now) / 1000);
        }
      }
    }
  } catch (err) {
    console.warn('[WorshipSync] Failed to read cached state:', err);
  }

  // Check URL parameters for direct schedule slot jump and immediate start
  try {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const scheduleParam = searchParams.get('schedule') || searchParams.get('slot');
      if (scheduleParam) {
        const slots = baseState.timerState.slots || DEFAULT_TIMER_STATE.slots || [];
        let targetIndex = -1;
        const num = parseInt(scheduleParam, 10);
        if (!isNaN(num)) {
          if (num >= 1 && num <= slots.length) {
            targetIndex = num - 1;
          } else if (num === 0 && slots.length > 0) {
            targetIndex = 0;
          }
        }
        if (targetIndex === -1) {
          const idIdx = slots.findIndex((s) => s.id === scheduleParam);
          if (idIdx !== -1) targetIndex = idIdx;
        }
        if (targetIndex === -1) {
          const lowerQuery = scheduleParam.toLowerCase().trim();
          const titleIdx = slots.findIndex((s) => s.title.toLowerCase().includes(lowerQuery));
          if (titleIdx !== -1) targetIndex = titleIdx;
        }

        if (targetIndex !== -1 && slots[targetIndex]) {
          const slot = slots[targetIndex];
          const isAlreadyRunningThisSlot =
            baseState.timerState.activeSlotIndex === targetIndex &&
            baseState.timerState.status === 'running' &&
            Boolean(baseState.timerState.targetEndTime);

          if (!isAlreadyRunningThisSlot) {
            const now = Date.now();
            baseState = {
              ...baseState,
              timerState: {
                ...baseState.timerState,
                activeSlotIndex: targetIndex,
                title: slot.title,
                durationSec: slot.durationSec,
                remainingSec: slot.durationSec,
                warningThresholdSec: slot.warningThresholdSec || baseState.timerState.warningThresholdSec || 300,
                status: 'running',
                startedAt: now,
                targetEndTime: now + slot.durationSec * 1000,
              }
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn('[WorshipSync] Error evaluating URL schedule param on init:', e);
  }

  return baseState;
}

export function useWorshipSync() {
  const [sessionId, setSessionIdState] = useState<string>(getActiveSessionId);
  const [hasPromptedSession, setHasPromptedSession] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(SESSION_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const [state, setState] = useState<AppState>(() => getCachedStateForSession(getActiveSessionId()));
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [progress, setProgress] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingQueueRef = useRef<WebSocketClientMessage[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string>(sessionId);
  sessionIdRef.current = sessionId;

  // Send message over WebSocket (or queue until open)
  const send = useCallback((msg: WebSocketClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      pendingQueueRef.current.push(msg);
    }
  }, []);

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    function getWsUrl() {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      const port = window.location.port;
      const currentSid = encodeURIComponent(sessionIdRef.current || 'default');

      if (import.meta.env.VITE_WS_URL) {
        const base = import.meta.env.VITE_WS_URL;
        return base.includes('?') ? `${base}&session=${currentSid}` : `${base}?session=${currentSid}`;
      }

      // If running on Vite dev server (e.g. port 5173), connect to backend port (default 3000, or VITE_BACKEND_PORT)
      if (import.meta.env.DEV && port === '5173') {
        const backendPort = import.meta.env.VITE_BACKEND_PORT || '3000';
        return `${wsProtocol}//${hostname}:${backendPort}/ws?session=${currentSid}`;
      }
      return `${wsProtocol}//${window.location.host}/ws?session=${currentSid}`;
    }

    function connect() {
      if (unmounted) return;
      const url = getWsUrl();

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          console.log(`[WorshipSync] Connected to presentation server at ${url}`);

          // Flush any pending messages queued while connecting
          while (pendingQueueRef.current.length > 0) {
            const pendingMsg = pendingQueueRef.current.shift();
            if (pendingMsg) {
              ws.send(JSON.stringify(pendingMsg));
            }
          }
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data: WebSocketServerMessage = JSON.parse(event.data);
            if (data.type === 'state') {
              const serverState = data.state;
              if (serverState?.timerState?.status === 'running' && serverState.timerState.targetEndTime) {
                serverState.timerState.remainingSec = Math.floor((serverState.timerState.targetEndTime - Date.now()) / 1000);
              }
              setState(serverState);
              setIsSynced(true);
              try {
                localStorage.setItem(`easystream_state_${sessionIdRef.current}`, JSON.stringify(serverState));
              } catch {
                // Ignore localStorage errors
              }
            }
          } catch (e) {
            console.error('[WorshipSync] Failed to parse message:', e);
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 1500);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('[WorshipSync] Connection error:', err);
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  // Switch session internally
  const switchSession = useCallback((newSessionId: string) => {
    const cleanId = (newSessionId || 'default').trim().toLowerCase() || 'default';
    setSessionIdState(cleanId);
    setHasPromptedSession(true);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, cleanId);
    } catch {}

    const cached = getCachedStateForSession(cleanId);
    setState(cached);

    send({ type: 'joinSession', sessionId: cleanId });
  }, [send]);

  // Save active session
  const saveCurrentSession = useCallback((sessionName?: string) => {
    send({ type: 'saveSession', sessionId, sessionName });
    try {
      localStorage.setItem(`easystream_state_${sessionId}`, JSON.stringify(state));
      const savedList = JSON.parse(localStorage.getItem(SAVED_SESSIONS_KEY) || '[]');
      const filtered = savedList.filter((s: any) => s.id !== sessionId);
      filtered.unshift({ id: sessionId, name: sessionName || sessionId, updatedAt: Date.now() });
      localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify(filtered.slice(0, 20)));
    } catch {}
  }, [send, sessionId, state]);

  // Handle auto-save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(`easystream_state_${sessionId}`, JSON.stringify(state));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, state]);

  // Progress animation frame loop for smooth timer bar
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (state.playing && state.lineStartedAt && state.lineDurationMs) {
        const now = Date.now();
        const p = Math.min(1, Math.max(0, (now - state.lineStartedAt) / state.lineDurationMs));
        setProgress(p);
      } else {
        if (!state.playing) {
          if (state.cur === state.lines.length - 1 && !state.lineStartedAt) {
            setProgress(1);
          } else {
            setProgress(0);
          }
        }
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [state.playing, state.lineStartedAt, state.lineDurationMs, state.cur, state.lines.length]);

  // Convenience Action Helpers
  const jumpTo = useCallback((index: number) => {
    send({ type: 'jump', index });
  }, [send]);

  const togglePlay = useCallback(() => {
    if (state.playing) {
      send({ type: 'pause' });
    } else {
      send({ type: 'play' });
    }
  }, [state.playing, send]);

  const restart = useCallback(() => {
    send({ type: 'restart' });
  }, [send]);

  const setWpm = useCallback((wpm: number) => {
    send({ type: 'setWpm', wpm });
  }, [send]);

  const setLines = useCallback((title: string, subtitle: string, lines: string[], category?: AppState['category']) => {
    send({ type: 'setLines', title, subtitle, lines, category });
  }, [send]);

  const updateTheme = useCallback((themeUpdate: Partial<PresentationTheme>) => {
    send({ type: 'setTheme', theme: themeUpdate });
  }, [send]);

  const updateLiveState = useCallback((liveStateUpdate: Partial<LiveState>) => {
    send({ type: 'setLiveState', liveState: liveStateUpdate });
  }, [send]);

  const setQuickAlert = useCallback((text: string | null) => {
    send({ type: 'setQuickAlert', text });
  }, [send]);

  const loadScheduleItem = useCallback((index: number) => {
    send({ type: 'loadScheduleItem', index });
  }, [send]);

  const updateSchedule = useCallback((items: ScheduleItem[]) => {
    send({ type: 'updateSchedule', items });
  }, [send]);

  const saveSchedule = useCallback((schedule: Schedule) => {
    send({ type: 'saveSchedule', schedule });
  }, [send]);

  const loadSchedule = useCallback((scheduleId: string) => {
    send({ type: 'loadSchedule', scheduleId });
  }, [send]);

  const deleteSchedule = useCallback((scheduleId: string) => {
    send({ type: 'deleteSchedule', scheduleId });
  }, [send]);

  const saveLibraryItem = useCallback((item: LibraryItem) => {
    setState((prev) => {
      const library = [...(prev.library || [])];
      const idx = library.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        library[idx] = item;
      } else {
        library.unshift(item);
      }
      return { ...prev, library };
    });
    send({ type: 'saveLibraryItem', item });
  }, [send]);

  const deleteLibraryItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      library: (prev.library || []).filter((i) => i.id !== id),
    }));
    send({ type: 'deleteLibraryItem', id });
  }, [send]);

  const resetToDefault = useCallback(() => {
    send({ type: 'resetToDefault' });
  }, [send]);

  const resetAllToDefault = useCallback(() => {
    // Send reset message to server
    send({ type: 'resetAllToDefault' });

    // Try fallback REST POST in case WS was disconnected
    try {
      fetch('/api/reset-all', { method: 'POST' }).catch(() => {});
    } catch {}

    // Clean up all local storage keys related to sessions and saved data
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('easystream_') || key.startsWith('easypresenter_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Re-initialize default session key
      localStorage.setItem(SESSION_STORAGE_KEY, 'default');
      localStorage.setItem(
        SAVED_SESSIONS_KEY,
        JSON.stringify([{ id: 'default', name: 'Main Sanctuary / Default', updatedAt: Date.now() }])
      );
    } catch (e) {
      console.warn('[WorshipSync] Failed to clear local storage during reset:', e);
    }

    // Reset local state to default
    setSessionIdState('default');
    setState(INITIAL_STATE);
  }, [send]);

  // Timer Control Helpers
  const startTimer = useCallback((durationSec?: number, title?: string) => {
    send({ type: 'startTimer', durationSec, title });
  }, [send]);

  const pauseTimer = useCallback(() => {
    send({ type: 'pauseTimer' });
  }, [send]);

  const resetTimer = useCallback(() => {
    send({ type: 'resetTimer' });
  }, [send]);

  const adjustTimer = useCallback((deltaSec: number) => {
    send({ type: 'adjustTimer', deltaSec });
  }, [send]);

  const setTimerConfig = useCallback((config: Partial<TimerState>) => {
    send({ type: 'setTimerConfig', config });
  }, [send]);

  const setTimerPrompt = useCallback((message: string | null, visible: boolean) => {
    send({ type: 'setTimerPrompt', message, visible });
  }, [send]);

  const addTimerSlot = useCallback((slot: TimerSlot) => {
    send({ type: 'addTimerSlot', slot });
  }, [send]);

  const updateTimerSlot = useCallback((id: string, slot: Partial<TimerSlot>) => {
    send({ type: 'updateTimerSlot', id, slot });
  }, [send]);

  const deleteTimerSlot = useCallback((id: string) => {
    send({ type: 'deleteTimerSlot', id });
  }, [send]);

  const reorderTimerSlots = useCallback((slots: TimerSlot[]) => {
    send({ type: 'reorderTimerSlots', slots });
  }, [send]);

  const jumpToTimerSlot = useCallback((index: number, autoStart?: boolean) => {
    send({ type: 'jumpToTimerSlot', index, autoStart });
    setState(prev => {
      const slots = prev.timerState.slots || [];
      if (slots.length === 0) return prev;
      const targetIndex = Math.max(0, Math.min(index, slots.length - 1));
      const slot = slots[targetIndex];
      if (!slot) return prev;

      const isAlreadyRunningThisSlot =
        prev.timerState.activeSlotIndex === targetIndex &&
        prev.timerState.status === 'running' &&
        Boolean(prev.timerState.targetEndTime);

      if (isAlreadyRunningThisSlot && autoStart) {
        return prev;
      }

      const now = Date.now();
      return {
        ...prev,
        timerState: {
          ...prev.timerState,
          activeSlotIndex: targetIndex,
          title: slot.title,
          durationSec: slot.durationSec,
          remainingSec: slot.durationSec,
          warningThresholdSec: slot.warningThresholdSec || prev.timerState.warningThresholdSec,
          status: autoStart ? 'running' : 'idle',
          startedAt: autoStart ? now : null,
          targetEndTime: autoStart ? now + slot.durationSec * 1000 : null,
        }
      };
    });
  }, [send]);

  const nextTimerSlot = useCallback((autoStart?: boolean) => {
    send({ type: 'nextTimerSlot', autoStart });
  }, [send]);

  const prevTimerSlot = useCallback((autoStart?: boolean) => {
    send({ type: 'prevTimerSlot', autoStart });
  }, [send]);

  const setTimerSlots = useCallback((slots: TimerSlot[], activeIndex?: number) => {
    send({ type: 'setTimerSlots', slots, activeIndex });
  }, [send]);

  return {
    sessionId,
    switchSession,
    saveCurrentSession,
    hasPromptedSession,
    setHasPromptedSession,
    state,
    isConnected,
    isSynced,
    progress,
    send,
    jumpTo,
    togglePlay,
    restart,
    setWpm,
    setLines,
    updateTheme,
    updateLiveState,
    setQuickAlert,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTimer,
    setTimerConfig,
    setTimerPrompt,
    addTimerSlot,
    updateTimerSlot,
    deleteTimerSlot,
    reorderTimerSlots,
    jumpToTimerSlot,
    nextTimerSlot,
    prevTimerSlot,
    setTimerSlots,
    loadScheduleItem,
    updateSchedule,
    saveSchedule,
    loadSchedule,
    deleteSchedule,
    saveLibraryItem,
    deleteLibraryItem,
    resetToDefault,
    resetAllToDefault,
  };
}
