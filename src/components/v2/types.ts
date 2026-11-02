import { LibraryItem } from "../../types";

export interface OnlineSongResult {
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

export const DEFAULT_WORSHIP_SONG: OnlineSongResult = {
  id: "default-worship-song-1",
  trackName: "Goodness of God",
  artistName: "Bethel Music / Jenn Johnson",
  snippet:
    "I love You Lord, for Your mercy never fails me • All my days I've been held in Your hands",
  plainLyrics: `[Verse 1]
I love You, Lord
For Your mercy never fails me
All my days, I've been held in Your hands
From the moment that I wake up
Until I lay my head
Oh, I will sing of the goodness of God

[Chorus]
And all my life You have been faithful
And all my life You have been so, so good
With every breath that I am able
Oh, I will sing of the goodness of God

[Verse 2]
I love Your voice
You have led me through the fire
In the darkest night You are close like no other
I've known You as a Father
I've known You as a Friend
And I have lived in the goodness of God

[Bridge]
Your goodness is running after
It's running after me
Your goodness is running after
It's running after me
With my life laid down, I'm surrendered now
I give You everything
Your goodness is running after
It's running after me`,
  isLocal: false,
};

export interface OnlineScriptureVerse {
  verse: number;
  text: string;
}

export interface OnlineScriptureResult {
  reference: string;
  version: string;
  versionName: string;
  verses: OnlineScriptureVerse[];
  plainContent: string;
  totalVerses: number;
  source?: "local" | "online" | "offline-fail";
}

export const POPULAR_SCRIPTURES = [
  { label: "John 3:16", query: "John 3:16" },
  { label: "Psalm 23", query: "Psalm 23" },
  { label: "Romans 8:28", query: "Romans 8:28" },
  { label: "Philippians 4:6", query: "Philippians 4:6" },
  { label: "1 Cor 13:4", query: "1 Cor 13:4" },
  { label: "Isaiah 40:31", query: "Isaiah 40:31" },
  { label: "Proverbs 3:5", query: "Proverbs 3:5" },
  { label: "Matthew 28:19", query: "Matthew 28:19" },
  { label: "Hebrews 11:1", query: "Hebrews 11:1" },
  { label: "Jeremiah 29:11", query: "Jeremiah 29:11" },
];

export const TIMER_PRESETS = [
  { label: "1m", sec: 60 },
  { label: "3m", sec: 180 },
  { label: "5m", sec: 300 },
  { label: "10m", sec: 600 },
  { label: "15m", sec: 900 },
  { label: "20m", sec: 1200 },
  { label: "30m", sec: 1800 },
  { label: "45m", sec: 2700 },
  { label: "60m", sec: 3600 },
];

export const FONT_FAMILIES = [
  {
    label: "Montserrat",
    sublabel: "Modern Bold Sans",
    value: "Montserrat, sans-serif",
  },
  {
    label: "Outfit",
    sublabel: "Clean Geometric Sans",
    value: "Outfit, sans-serif",
  },
  {
    label: "Inter",
    sublabel: "Crisp Display Sans",
    value: "Inter, sans-serif",
  },
  {
    label: "Playfair Display",
    sublabel: "Classic Editorial Serif",
    value: "Playfair Display, serif",
  },
  {
    label: "Cinzel",
    sublabel: "Majestic Traditional Serif",
    value: "Cinzel, serif",
  },
  {
    label: "Oswald",
    sublabel: "Tall Condensed Impact",
    value: "Oswald, sans-serif",
  },
  { label: "Georgia", sublabel: "Warm Reading Serif", value: "Georgia, serif" },
  {
    label: "JetBrains Mono",
    sublabel: "Clean Modern Monospace",
    value: "JetBrains Mono, monospace",
  },
];

