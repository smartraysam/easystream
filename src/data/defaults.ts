import { PresentationTheme, LibraryItem, Schedule, TimerState, TimerSlot, ScriptureFormatting, LyricsFormatting } from '../types';

export const DEFAULT_TIMER_SLOTS: TimerSlot[] = [
  { id: 'slot-1', title: 'Opening & Welcome', durationSec: 300, speaker: 'Host / Worship Leader' },
  { id: 'slot-2', title: 'Praise & Worship', durationSec: 1200, speaker: 'Worship Team' },
  { id: 'slot-3', title: 'Announcements & Offering', durationSec: 420, speaker: 'Pastoral Team' },
  { id: 'slot-4', title: 'Sermon / Message', durationSec: 2100, speaker: 'Lead Pastor' },
  { id: 'slot-5', title: 'Altar Call & Closing Benediction', durationSec: 360, speaker: 'Pastor' },
];

export const TIMER_SCHEDULE_PRESETS: { name: string; description: string; slots: TimerSlot[] }[] = [
  {
    name: 'Sunday Morning Service (75 min)',
    description: 'Standard Sunday morning service structure with worship, announcements, sermon and closing',
    slots: [
      { id: 'preset-sun-1', title: 'Pre-Service Countdown', durationSec: 300 },
      { id: 'preset-sun-2', title: 'Opening & Praise', durationSec: 600, speaker: 'Worship Leader' },
      { id: 'preset-sun-3', title: 'Deep Worship Set', durationSec: 900, speaker: 'Worship Team' },
      { id: 'preset-sun-4', title: 'Announcements & Offering', durationSec: 480, speaker: 'Pastoral Staff' },
      { id: 'preset-sun-5', title: 'Sermon / Message', durationSec: 2100, speaker: 'Pastor' },
      { id: 'preset-sun-6', title: 'Altar & Benediction', durationSec: 420, speaker: 'Pastor' },
    ],
  },
  {
    name: 'Midweek Prayer & Bible Study (60 min)',
    description: 'Midweek service with praise, focused prayer sessions, and scriptural teaching',
    slots: [
      { id: 'preset-mid-1', title: 'Opening Prayer', durationSec: 300 },
      { id: 'preset-mid-2', title: 'Worship & Exhortation', durationSec: 600 },
      { id: 'preset-mid-3', title: 'Corporate Intercession', durationSec: 900 },
      { id: 'preset-mid-4', title: 'Bible Teaching / Exegesis', durationSec: 1500 },
      { id: 'preset-mid-5', title: 'Closing Fellowship', durationSec: 300 },
    ],
  },
  {
    name: 'Youth / Revival Night (90 min)',
    description: 'High energy praise, testimony, message and prolonged ministry time',
    slots: [
      { id: 'preset-yth-1', title: 'Pre-Service Hangout Countdown', durationSec: 300 },
      { id: 'preset-yth-2', title: 'High Energy Praise', durationSec: 900 },
      { id: 'preset-yth-3', title: 'Testimony & Games', durationSec: 600 },
      { id: 'preset-yth-4', title: 'Youth Message', durationSec: 1800 },
      { id: 'preset-yth-5', title: 'Altar & Extended Worship', durationSec: 1500 },
      { id: 'preset-yth-6', title: 'Wrap Up', durationSec: 300 },
    ],
  },
  {
    name: 'Conference / Seminar Session (45 min)',
    description: 'Keynote or breakout session with presentation and Q&A',
    slots: [
      { id: 'preset-conf-1', title: 'Session Intro & Speaker Bio', durationSec: 180 },
      { id: 'preset-conf-2', title: 'Keynote Presentation', durationSec: 1800 },
      { id: 'preset-conf-3', title: 'Audience Q&A', durationSec: 600 },
      { id: 'preset-conf-4', title: 'Closing Remarks & Next Session', durationSec: 120 },
    ],
  },
];

export const DEFAULT_TIMER_STATE: TimerState = {
  status: 'idle',
  durationSec: 300, // Matches first slot (5 min)
  remainingSec: 300,
  startedAt: null,
  targetEndTime: null,
  allowOvertime: true,
  warningThresholdSec: 300, // 5 min
  criticalThresholdSec: 60, // 1 min
  title: 'Opening & Welcome',
  promptMessage: null,
  promptVisible: false,
  slots: DEFAULT_TIMER_SLOTS,
  activeSlotIndex: 0,
  autoAdvance: false,
  showNextProgramAlert: true,
  fontSizeScale: 100,
  showOnDisplay: true,
  showClockOnDisplay: true,
  timerPosition: 'top-right',
};

export const DEFAULT_SCRIPTURE_FORMATTING: ScriptureFormatting = {
  showTitle: true,
  titlePosition: 'top',
  titleFontFamily: 'Montserrat, sans-serif',
  titleFontSize: 28,
  titleFontColor: '#38bdf8',
  titleFontStyle: 'bold',

  bodyFontFamily: '"Playfair Display", "Merriweather", Georgia, serif',
  bodyFontSize: 52,
  bodyFontColor: '#ffffff',
  bodyFontStyle: 'italic',

  textAlign: 'center',
  verticalAlign: 'center',
};

export const DEFAULT_LYRICS_FORMATTING: LyricsFormatting = {
  showTitle: false,
  titleFontFamily: 'Montserrat, sans-serif',
  titleFontSize: 24,
  titleFontColor: '#f59e0b',
  titleFontStyle: 'bold',

  bodyFontFamily: 'Montserrat, sans-serif',
  bodyFontSize: 48,
  bodyFontColor: '#ffffff',
  bodyFontStyle: 'normal',
  bodyFontWeight: 700,
  bodyTextTransform: 'none',

  textAlign: 'center',
  verticalAlign: 'center',
};

export const DEFAULT_THEME: PresentationTheme = {
  fontFamily: 'Montserrat, sans-serif',
  fontSize: 44,
  fontWeight: 700,
  fontStyle: 'normal',
  textTransform: 'none',
  textColor: '#ffffff',
  accentColor: '#f59e0b',
  textAlign: 'center',
  verticalAlign: 'center',
  lineHeight: 1.45,
  letterSpacing: 0.5,
  
  textShadow: true,
  shadowBlur: 14,
  shadowColor: 'rgba(0, 0, 0, 0.85)',
  shadowOffsetX: 0,
  shadowOffsetY: 3,
  textOutline: true,
  outlineWidth: 2,
  outlineColor: 'rgba(0, 0, 0, 0.95)',
  
  bgType: 'animated-gradient',
  bgColor: '#0f172a',
  bgGradient: 'linear-gradient(135deg, #090e17 0%, #1e1b4b 50%, #311042 100%)',
  bgAnimationSpeed: 18,
  bgOverlayOpacity: 0.25,
  
  displayMode: 'fullscreen',
  showNextPreview: true,
  showProgressBar: true,
  showReferenceBadge: true,
  presenterLayout: 'easyworship',

  scripture: DEFAULT_SCRIPTURE_FORMATTING,
  lyrics: DEFAULT_LYRICS_FORMATTING,
};

export const THEME_PRESETS: { name: string; description: string; theme: Partial<PresentationTheme> }[] = [
  {
    name: 'Midnight Celestial',
    description: 'Deep royal indigo and violet gradient with crisp bold text',
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      bgType: 'animated-gradient',
      bgColor: '#090d16',
      bgGradient: 'linear-gradient(135deg, #060b19 0%, #1e1b4b 45%, #2e1065 100%)',
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    name: 'Golden Glory',
    description: 'Warm obsidian and amber aesthetic inspired by classic sanctuaries',
    theme: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: 700,
      textColor: '#fef3c7',
      accentColor: '#fbbf24',
      bgType: 'animated-gradient',
      bgColor: '#14110b',
      bgGradient: 'linear-gradient(145deg, #1c1508 0%, #382405 50%, #170d04 100%)',
      textShadow: true,
      shadowBlur: 18,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 1.5,
      outlineColor: '#120b02',
    },
  },
  {
    name: 'Deep Ocean Praise',
    description: 'Rich marine and teal gradient with modern clean sans typography',
    theme: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 700,
      textColor: '#f0fdfa',
      accentColor: '#2dd4bf',
      bgType: 'animated-gradient',
      bgColor: '#04161f',
      bgGradient: 'linear-gradient(135deg, #021a24 0%, #064e3b 50%, #082f49 100%)',
      textShadow: true,
      shadowBlur: 14,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#011219',
    },
  },
  {
    name: 'Majestic Cinzel',
    description: 'Cinematic Roman serif typography for solemn scripture readings',
    theme: {
      fontFamily: 'Cinzel, serif',
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#e0e7ff',
      letterSpacing: 2,
      bgType: 'animated-gradient',
      bgColor: '#0f0f18',
      bgGradient: 'linear-gradient(135deg, #0a0a14 0%, #1f1d36 50%, #100f24 100%)',
      textShadow: true,
      shadowBlur: 20,
      shadowColor: 'rgba(0,0,0,0.95)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    name: 'Broadcast Lower-Third',
    description: 'Optimized for live stream camera overlays with high-contrast pill badge',
    theme: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 34,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      displayMode: 'lower-third',
      bgType: 'transparent',
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0, 0, 0, 0.95)',
      textOutline: true,
      outlineWidth: 3,
      outlineColor: '#000000',
      showNextPreview: false,
    },
  },
  {
    name: 'Solid Carbon Dark',
    description: 'Minimalist high-contrast pure dark slate background for maximum readability',
    theme: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      textColor: '#f8fafc',
      accentColor: '#60a5fa',
      bgType: 'solid',
      bgColor: '#090d16',
      textShadow: true,
      shadowBlur: 10,
      shadowColor: 'rgba(0,0,0,0.7)',
      textOutline: false,
    },
  },
  {
    name: 'Ruby Horizon',
    description: 'Vibrant crimson to royal dark purple gradient with bold impact font',
    theme: {
      fontFamily: 'Oswald, sans-serif',
      fontSize: 48,
      fontWeight: 700,
      letterSpacing: 1,
      textColor: '#fff1f2',
      accentColor: '#fb7185',
      bgType: 'animated-gradient',
      bgColor: '#1a050d',
      bgGradient: 'linear-gradient(135deg, #2b0614 0%, #580c25 45%, #2a0b40 100%)',
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#17020a',
    },
  },
];

export const DEFAULT_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'psalm-23',
    title: 'Psalm 23',
    category: 'scripture',
    author: 'King David',
    content: `The LORD is my shepherd; I shall not want.
He makes me lie down in green pastures.
He leads me beside still waters.
He restores my soul.
He leads me in paths of righteousness for his name's sake.
Even though I walk through the valley of the shadow of death,
I will fear no evil, for you are with me;
your rod and your staff, they comfort me.
You prepare a table before me in the presence of my enemies;
you anoint my head with oil; my cup overflows.
Surely goodness and mercy shall follow me all the days of my life,
and I shall dwell in the house of the LORD forever.`,
    lines: [
      "The LORD is my shepherd; I shall not want.\n\nPsalm 23:1",
      "He makes me lie down in green pastures. He leads me beside still waters.\n\nPsalm 23:2",
      "He restores my soul. He leads me in paths of righteousness for his name's sake.\n\nPsalm 23:3",
      "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.\n\nPsalm 23:4",
      "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.\n\nPsalm 23:5",
      "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever.\n\nPsalm 23:6"
    ],
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    category: 'hymn',
    author: 'John Newton',
    content: `Amazing grace! how sweet the sound
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed!

Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

When we've been there ten thousand years,
Bright shining as the sun,
We've no less days to sing God's praise
Than when we'd first begun.`,
    lines: [
      "Amazing grace! how sweet the sound\nThat saved a wretch like me!",
      "I once was lost, but now am found,\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;",
      "How precious did that grace appear\nThe hour I first believed!",
      "Through many dangers, toils and snares,\nI have already come;",
      "'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
      "When we've been there ten thousand years,\nBright shining as the sun,",
      "We've no less days to sing God's praise\nThan when we'd first begun."
    ],
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
  },
  {
    id: 'way-maker',
    title: 'Way Maker',
    category: 'song',
    author: 'Sinach',
    content: `You are here, moving in our midst
I worship You, I worship You
You are here, working in this place
I worship You, I worship You

(Chorus)
Way Maker, Miracle Worker, Promise Keeper
Light in the darkness, my God, that is who You are!

You are here, touching every heart
I worship You, I worship You
You are here, healing every heart
I worship You, I worship You

Even when I don't see it, You're working
Even when I don't feel it, You're working
You never stop, You never stop working!`,
    lines: [
      "You are here, moving in our midst\nI worship You, I worship You",
      "You are here, working in this place\nI worship You, I worship You",
      "Way Maker, Miracle Worker, Promise Keeper\nLight in the darkness, my God, that is who You are!",
      "You are here, touching every heart\nI worship You, I worship You",
      "You are here, healing every heart\nI worship You, I worship You",
      "Even when I don't see it, You're working\nEven when I don't feel it, You're working\nYou never stop, You never stop working!"
    ],
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
  },
  {
    id: 'john-3-16',
    title: 'John 3:16',
    category: 'scripture',
    author: 'Apostle John',
    content: `For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.

For God sent not his Son into the world to condemn the world; but that the world through him might be saved.`,
    lines: [
      "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.\n\nJohn 3:16",
      "For God sent not his Son into the world to condemn the world; but that the world through him might be saved.\n\nJohn 3:17"
    ],
    createdAt: Date.now() - 70000,
    updatedAt: Date.now() - 70000,
  },
  {
    id: 'great-is-thy-faithfulness',
    title: 'Great Is Thy Faithfulness',
    category: 'hymn',
    author: 'Thomas Chisholm',
    content: `Great is Thy faithfulness, O God my Father,
There is no shadow of turning with Thee;
Thou changest not, Thy compassions, they fail not;
As Thou hast been Thou forever wilt be.

(Chorus)
Great is Thy faithfulness! Great is Thy faithfulness!
Morning by morning new mercies I see;
All I have needed Thy hand hath provided—
Great is Thy faithfulness, Lord, unto me!

Pardon for sin and a peace that endureth,
Thine own dear presence to cheer and to guide;
Strength for today and bright hope for tomorrow,
Blessings all mine, with ten thousand beside!`,
    lines: [
      "Great is Thy faithfulness, O God my Father,\nThere is no shadow of turning with Thee;",
      "Thou changest not, Thy compassions, they fail not;\nAs Thou hast been Thou forever wilt be.",
      "Great is Thy faithfulness! Great is Thy faithfulness!\nMorning by morning new mercies I see;",
      "All I have needed Thy hand hath provided—\nGreat is Thy faithfulness, Lord, unto me!",
      "Pardon for sin and a peace that endureth,\nThine own dear presence to cheer and to guide;",
      "Strength for today and bright hope for tomorrow,\nBlessings all mine, with ten thousand beside!"
    ],
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
  },
  {
    id: 'philippians-4',
    title: 'Philippians 4:6-8',
    category: 'scripture',
    author: 'Apostle Paul',
    content: `Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.

And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.

Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.`,
    lines: [
      "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.\n\nPhilippians 4:6",
      "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.\n\nPhilippians 4:7",
      "Finally, brothers and sisters, whatever is true, whatever is noble, whatever is right, whatever is pure, whatever is lovely, whatever is admirable—if anything is excellent or praiseworthy—think about such things.\n\nPhilippians 4:8"
    ],
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
  },
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'sunday-morning-worship',
    name: 'Sunday Morning Service Set',
    items: [
      {
        id: 'item-1',
        libraryItemId: 'psalm-23',
        title: 'Opening Scripture: Psalm 23',
        category: 'scripture',
        lines: DEFAULT_LIBRARY_ITEMS[0].lines,
      },
      {
        id: 'item-2',
        libraryItemId: 'amazing-grace',
        title: 'Hymn: Amazing Grace',
        category: 'hymn',
        lines: DEFAULT_LIBRARY_ITEMS[1].lines,
      },
      {
        id: 'item-3',
        libraryItemId: 'way-maker',
        title: 'Praise: Way Maker',
        category: 'song',
        lines: DEFAULT_LIBRARY_ITEMS[2].lines,
      },
      {
        id: 'item-4',
        libraryItemId: 'philippians-4',
        title: 'Sermon Scripture: Philippians 4:6-8',
        category: 'scripture',
        lines: DEFAULT_LIBRARY_ITEMS[5].lines,
      },
    ],
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
  },
];
