export type TextAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'center' | 'bottom';
export type BackgroundType = 'solid' | 'gradient' | 'animated-gradient' | 'transparent';
export type DisplayMode = 'fullscreen' | 'lower-third';

export type PresenterLayout = 'easyworship' | 'quickdeck' | 'classic';

export interface PresentationTheme {
  fontFamily: string;
  fontSize: number; // in pt/px base scale (e.g. 42)
  fontWeight: number; // 300, 400, 500, 600, 700, 800, 900
  fontStyle: 'normal' | 'italic';
  textTransform: 'none' | 'uppercase' | 'capitalize';
  textColor: string;
  accentColor: string;
  textAlign: TextAlignment;
  verticalAlign: VerticalAlignment;
  lineHeight: number; // 1.1 to 2.0
  letterSpacing: number; // -1 to 8 px
  
  // Shadow and outline (critical for live video overlays)
  textShadow: boolean;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textOutline: boolean;
  outlineWidth: number;
  outlineColor: string;
  
  // Background configuration
  bgType: BackgroundType;
  bgColor: string;
  bgGradient: string; // CSS gradient string
  bgAnimationSpeed: number; // in seconds, e.g. 15
  bgOverlayOpacity: number; // 0 to 1
  
  // Layout mode
  displayMode: DisplayMode;
  showNextPreview: boolean;
  showProgressBar: boolean;
  showReferenceBadge: boolean;
  maxLinesPerSlide?: number;
  presenterLayout?: PresenterLayout;

  // Dedicated formatting for Scripture & Lyrics
  scripture?: ScriptureFormatting;
  lyrics?: LyricsFormatting;
}

export type TextFontStyle = 'normal' | 'italic' | 'bold' | 'bold-italic';

export interface ScriptureFormatting {
  // Scripture reference / title (e.g. Luke 12:1)
  showTitle: boolean;
  titlePosition?: 'top' | 'bottom';
  titleFontFamily: string;
  titleFontSize: number;
  titleFontColor: string;
  titleFontStyle: TextFontStyle;

  // Scripture body (verse text)
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyFontColor: string;
  bodyFontStyle: TextFontStyle;

  // Text position on display
  textAlign: TextAlignment;
  verticalAlign: VerticalAlignment;
}

export interface LyricsFormatting {
  // Song title / banner
  showTitle: boolean;
  titleFontFamily: string;
  titleFontSize: number;
  titleFontColor: string;
  titleFontStyle: TextFontStyle;

  // Lyrics body (stanzas/lines)
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyFontColor: string;
  bodyFontStyle: TextFontStyle;
  bodyFontWeight?: number;
  bodyTextTransform?: 'none' | 'uppercase' | 'capitalize';

  // Text position on display
  textAlign: TextAlignment;
  verticalAlign: VerticalAlignment;
}

export type ScheduleCategory =
  | 'scripture'
  | 'song'
  | 'hymn'
  | 'prayer'
  | 'ministration'
  | 'announcement'
  | 'custom';

export interface LibraryItem {
  id: string;
  title: string;
  category: ScheduleCategory;
  author?: string;
  copyright?: string;
  ccli?: string;
  content: string; // raw content with stanzas separated by blank lines or lines
  lines: string[];
  themeOverride?: Partial<PresentationTheme>;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleItem {
  id: string;
  libraryItemId?: string;
  title: string;
  category: ScheduleCategory;
  lines: string[];
  themeOverride?: Partial<PresentationTheme>;
}

export interface Schedule {
  id: string;
  name: string;
  items: ScheduleItem[];
  createdAt: number;
  updatedAt: number;
}

export interface LiveState {
  isBlackout: boolean;
  isClearText: boolean;
  isLogo: boolean;
  isFrozen: boolean;
  quickAlert: string | null;
}

export interface TimerSlot {
  id: string;
  title: string;
  durationSec: number;        // Slot duration in seconds
  speaker?: string;           // Optional presenter / speaker name
  notes?: string;             // Optional notes
  warningThresholdSec?: number;
}

export interface TimerState {
  status: 'idle' | 'running' | 'paused';
  durationSec: number;        // Configured countdown duration in seconds (e.g. 3600 for 60 min)
  remainingSec: number;       // Seconds remaining when idle/paused
  startedAt: number | null;   // Timestamp when timer was started/resumed
  targetEndTime: number | null; // Timestamp when countdown reaches 00:00
  allowOvertime: boolean;     // Enable overtime count-up past 00:00 (default true)
  warningThresholdSec: number;// Amber warning threshold (default 300s / 5 min)
  criticalThresholdSec: number;// Orange critical threshold (default 60s / 1 min)
  title: string;              // e.g. "Sermon Countdown" or "Service Begins In"
  promptMessage: string | null;// Slide-in message displayed below the display
  promptVisible: boolean;     // Whether prompt message is visible
  
  // Program Schedule / Rundown Slots
  slots: TimerSlot[];         // Ordered list of program slots
  activeSlotIndex: number;    // Index of the currently active program slot
  autoAdvance: boolean;       // Automatically advance and start the next slot on 00:00
  showNextProgramAlert: boolean; // Slide 'Next program: ...' banner on time up
  fontSizeScale?: number;     // Font size percentage scale for timer display digits (e.g. 100, 150, 200)
  showOnDisplay?: boolean;    // Show countdown / overtime timer on the live display
  showClockOnDisplay?: boolean;// Show current real-world clock time on the live display
  timerPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'; // Position on live display
}

export interface AppState {
  title: string;
  subtitle?: string;
  category: ScheduleCategory;
  lines: string[];
  cur: number;
  playing: boolean;
  wpm: number;
  lineStartedAt: number | null;
  lineDurationMs: number | null;
  
  // Live control flags
  liveState: LiveState;

  // Live Timer & Countdown State
  timerState: TimerState;
  
  // Active theme
  theme: PresentationTheme;
  
  // Active Schedule
  currentScheduleId: string | null;
  activeScheduleIndex: number;
  schedule: ScheduleItem[];
  
  // Saved schedules & library meta
  savedSchedules: Schedule[];
  library: LibraryItem[];
}

export interface SessionMeta {
  id: string;
  name?: string;
  updatedAt: number;
  isSaved?: boolean;
}

export type WebSocketClientMessage =
  | { type: 'setLines'; title: string; subtitle?: string; lines: string[]; category?: ScheduleCategory }
  | { type: 'jump'; index: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'restart' }
  | { type: 'setWpm'; wpm: number }
  | { type: 'setTheme'; theme: Partial<PresentationTheme> }
  | { type: 'setLiveState'; liveState: Partial<LiveState> }
  | { type: 'setQuickAlert'; text: string | null }
  | { type: 'startTimer'; durationSec?: number; title?: string }
  | { type: 'pauseTimer' }
  | { type: 'resetTimer' }
  | { type: 'adjustTimer'; deltaSec: number }
  | { type: 'setTimerConfig'; config: Partial<TimerState> }
  | { type: 'setTimerPrompt'; message: string | null; visible: boolean }
  | { type: 'addTimerSlot'; slot: TimerSlot }
  | { type: 'updateTimerSlot'; id: string; slot: Partial<TimerSlot> }
  | { type: 'deleteTimerSlot'; id: string }
  | { type: 'reorderTimerSlots'; slots: TimerSlot[] }
  | { type: 'jumpToTimerSlot'; index: number; autoStart?: boolean }
  | { type: 'nextTimerSlot'; autoStart?: boolean }
  | { type: 'prevTimerSlot'; autoStart?: boolean }
  | { type: 'setTimerSlots'; slots: TimerSlot[]; activeIndex?: number }
  | { type: 'loadScheduleItem'; index: number }
  | { type: 'updateSchedule'; items: ScheduleItem[] }
  | { type: 'saveSchedule'; schedule: Schedule }
  | { type: 'loadSchedule'; scheduleId: string }
  | { type: 'deleteSchedule'; scheduleId: string }
  | { type: 'saveLibraryItem'; item: LibraryItem }
  | { type: 'deleteLibraryItem'; id: string }
  | { type: 'resetToDefault' }
  | { type: 'resetAllToDefault' }
  | { type: 'joinSession'; sessionId: string }
  | { type: 'saveSession'; sessionId: string; sessionName?: string }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'listSessions' };

export type WebSocketServerMessage =
  | { type: 'state'; state: AppState; sessionId?: string }
  | { type: 'sessionsList'; sessions: SessionMeta[] }
  | { type: 'notification'; message: string; variant?: 'info' | 'success' | 'warning' | 'error' };
