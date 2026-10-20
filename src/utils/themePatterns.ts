import { PresentationTheme, BackgroundType } from '../types';

export interface PatternPreset {
  id: string;
  name: string;
  category: 'sacred' | 'geometric' | 'ambient' | 'minimal';
  description: string;
  defaultColor: string;
  defaultOpacity: number;
  defaultScale: number;
  getSvg: (color: string, opacity: number, scale: number) => string;
}

// -----------------------------------------------------------------
// 1. Built-in Scalable SVG Patterns (Tileable data URIs)
// -----------------------------------------------------------------
export const PATTERN_PRESETS: PatternPreset[] = [
  {
    id: 'crosses',
    name: 'Sanctuary Crosses',
    category: 'sacred',
    description: 'Subtle church crosses motif tiled seamlessly',
    defaultColor: '#f59e0b',
    defaultOpacity: 0.18,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(44 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 9h2v8h8v2h-8v16h-2V19h-8v-2h8V9z" fill="${color}" fill-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'constellations',
    name: 'Celestial Stars',
    category: 'sacred',
    description: 'Faint starry nodes and celestial constellation lines',
    defaultColor: '#38bdf8',
    defaultOpacity: 0.22,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(80 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="1.5" fill="${color}" fill-opacity="${opacity * 1.2}"/>
        <circle cx="65" cy="35" r="2" fill="${color}" fill-opacity="${opacity * 1.5}"/>
        <circle cx="35" cy="65" r="1.2" fill="${color}" fill-opacity="${opacity}"/>
        <circle cx="72" cy="72" r="1" fill="${color}" fill-opacity="${opacity * 0.8}"/>
        <line x1="15" y1="15" x2="65" y2="35" stroke="${color}" stroke-width="0.75" stroke-opacity="${opacity * 0.45}"/>
        <line x1="65" y1="35" x2="35" y2="65" stroke="${color}" stroke-width="0.75" stroke-opacity="${opacity * 0.45}"/>
      </svg>`;
    },
  },
  {
    id: 'stained-glass',
    name: 'Cathedral Stained Glass',
    category: 'sacred',
    description: 'Faceted geometric jewel polygons inspired by church windows',
    defaultColor: '#e0e7ff',
    defaultOpacity: 0.16,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(64 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0 L64 64 M64 0 L0 64 M32 0 L32 64 M0 32 L64 32" stroke="${color}" stroke-width="0.9" stroke-opacity="${opacity * 0.7}" fill="none"/>
        <polygon points="32,0 64,32 32,64 0,32" stroke="${color}" stroke-width="1.1" stroke-opacity="${opacity}" fill="none"/>
      </svg>`;
    },
  },
  {
    id: 'damask',
    name: 'Cathedral Damask',
    category: 'sacred',
    description: 'Elegant gothic fleur-de-lis sanctuary crest',
    defaultColor: '#c084fc',
    defaultOpacity: 0.15,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(52 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 6 C24 13, 17 15, 12 18 C17 21, 23 23, 26 30 C29 23, 35 21, 40 18 C35 15, 28 13, 26 6 Z M26 30 L26 42 M21 37 L31 37" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'grid',
    name: 'Modern Blueprint Grid',
    category: 'geometric',
    description: 'Clean architectural millimeter grid for crisp modern styling',
    defaultColor: '#ffffff',
    defaultOpacity: 0.12,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(32 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 32V0h32v32H0zm1-1h30V1H1v30z" fill="${color}" fill-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'hexagons',
    name: 'Honeycomb Mesh',
    category: 'geometric',
    description: 'Interlocking hexagonal lattice for organic symmetry',
    defaultColor: '#38bdf8',
    defaultOpacity: 0.16,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const w = Math.round(48 * scale);
      const h = Math.round(84 * scale);
      return `<svg width="${w}" height="${h}" viewBox="0 0 56 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="${color}" stroke-width="1.3" stroke-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'waves',
    name: 'Living Waters Waves',
    category: 'ambient',
    description: 'Flowing sinusoidal contour lines evoking praise and renewal',
    defaultColor: '#2dd4bf',
    defaultOpacity: 0.2,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const w = Math.round(100 * scale);
      const h = Math.round(40 * scale);
      return `<svg width="${w}" height="${h}" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 16 Q 25 6, 50 16 T 100 16 M0 28 Q 25 18, 50 28 T 100 28" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'dots',
    name: 'Subtle Matrix Dots',
    category: 'minimal',
    description: 'Gentle repeating polka dot array that never clashes with text',
    defaultColor: '#ffffff',
    defaultOpacity: 0.15,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(24 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="1.5" fill="${color}" fill-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'stripes',
    name: 'Carbon Diagonal Weave',
    category: 'minimal',
    description: 'Subtle angled hatch stripes for understated texture',
    defaultColor: '#ffffff',
    defaultOpacity: 0.1,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(28 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 28L28 0M-7 7L7 -7M21 35L35 21" stroke="${color}" stroke-width="1.5" stroke-opacity="${opacity}"/>
      </svg>`;
    },
  },
  {
    id: 'bokeh',
    name: 'Ambient Halo Rings',
    category: 'ambient',
    description: 'Soft circular halos and floating light discs',
    defaultColor: '#fbbf24',
    defaultOpacity: 0.18,
    defaultScale: 1,
    getSvg: (color, opacity, scale) => {
      const size = Math.round(110 * scale);
      return `<svg width="${size}" height="${size}" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
        <circle cx="28" cy="28" r="16" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="${opacity * 0.7}"/>
        <circle cx="78" cy="68" r="24" fill="none" stroke="${color}" stroke-width="1.4" stroke-opacity="${opacity * 0.5}"/>
        <circle cx="86" cy="22" r="7" fill="${color}" fill-opacity="${opacity * 0.6}"/>
      </svg>`;
    },
  },
];

export function getPatternById(id: string): PatternPreset | undefined {
  return PATTERN_PRESETS.find((p) => p.id === id);
}

export function getPatternDataUrl(
  patternId?: string,
  color?: string,
  opacity?: number,
  scale?: number
): string | null {
  if (!patternId) return null;
  const pattern = getPatternById(patternId);
  if (!pattern) return null;

  const actualColor = color || pattern.defaultColor;
  const actualOpacity = typeof opacity === 'number' ? Math.max(0.01, Math.min(1, opacity)) : pattern.defaultOpacity;
  const actualScale = typeof scale === 'number' && scale > 0 ? scale : pattern.defaultScale;

  const svgStr = pattern.getSvg(actualColor, actualOpacity, actualScale);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
}

// -----------------------------------------------------------------
// 2. Comprehensive Curated Built-in Theme Presets
// -----------------------------------------------------------------
export interface ExtendedThemePreset {
  id: string;
  name: string;
  category: 'color' | 'pattern' | 'solid' | 'broadcast' | 'custom';
  description: string;
  palette: string[];
  theme: Partial<PresentationTheme>;
}

export const EXTENDED_THEME_PRESETS: ExtendedThemePreset[] = [
  // --- COLOR & AMBIENT GRADIENTS ---
  {
    id: 'midnight-celestial',
    name: 'Midnight Celestial',
    category: 'color',
    description: 'Deep royal indigo and cosmic violet ambient motion gradient',
    palette: ['#060b19', '#1e1b4b', '#2e1065', '#38bdf8'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      bgType: 'animated-gradient',
      bgColor: '#090d16',
      bgGradient: 'linear-gradient(135deg, #060b19 0%, #1e1b4b 45%, #2e1065 100%)',
      bgAnimationSpeed: 18,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    id: 'golden-glory',
    name: 'Golden Glory',
    category: 'color',
    description: 'Warm obsidian and incandescent amber inspired by sanctuary candlelight',
    palette: ['#14110b', '#382405', '#170d04', '#fbbf24'],
    theme: {
      fontFamily: 'Playfair Display, serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#fef3c7',
      accentColor: '#fbbf24',
      bgType: 'animated-gradient',
      bgColor: '#14110b',
      bgGradient: 'linear-gradient(145deg, #1c1508 0%, #382405 50%, #170d04 100%)',
      bgAnimationSpeed: 18,
      textShadow: true,
      shadowBlur: 18,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 1.5,
      outlineColor: '#120b02',
    },
  },
  {
    id: 'deep-ocean-praise',
    name: 'Deep Ocean Praise',
    category: 'color',
    description: 'Rich marine navy and emerald teal with high-contrast text',
    palette: ['#021a24', '#064e3b', '#082f49', '#2dd4bf'],
    theme: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#f0fdfa',
      accentColor: '#2dd4bf',
      bgType: 'animated-gradient',
      bgColor: '#04161f',
      bgGradient: 'linear-gradient(135deg, #021a24 0%, #064e3b 50%, #082f49 100%)',
      bgAnimationSpeed: 18,
      textShadow: true,
      shadowBlur: 14,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#011219',
    },
  },
  {
    id: 'ruby-horizon',
    name: 'Ruby Horizon',
    category: 'color',
    description: 'Deep royal crimson and wine purple with dramatic impact font',
    palette: ['#2b0614', '#580c25', '#2a0b40', '#fb7185'],
    theme: {
      fontFamily: 'Oswald, sans-serif',
      fontSize: 46,
      fontWeight: 700,
      textColor: '#fff1f2',
      accentColor: '#fb7185',
      bgType: 'animated-gradient',
      bgColor: '#1a050d',
      bgGradient: 'linear-gradient(135deg, #2b0614 0%, #580c25 45%, #2a0b40 100%)',
      bgAnimationSpeed: 18,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#17020a',
    },
  },
  {
    id: 'majestic-cinzel',
    name: 'Majestic Cinzel',
    category: 'color',
    description: 'Roman classical serif typography on deep solemn sapphire dark background',
    palette: ['#0a0a14', '#1f1d36', '#100f24', '#e0e7ff'],
    theme: {
      fontFamily: 'Cinzel, serif',
      fontSize: 42,
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
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    category: 'color',
    description: 'Northern lights shimmer of luminous emerald and electric cyan',
    palette: ['#02120e', '#065f46', '#0284c7', '#34d399'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ecfdf5',
      accentColor: '#34d399',
      bgType: 'animated-gradient',
      bgColor: '#031411',
      bgGradient: 'linear-gradient(135deg, #02120e 0%, #064e3b 40%, #0369a1 80%, #02120e 100%)',
      bgAnimationSpeed: 16,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#010c09',
    },
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    category: 'color',
    description: 'Lush imperial purple and magenta dusk for praise and worship',
    palette: ['#1e0b36', '#4c1d95', '#701a75', '#e879f9'],
    theme: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#fdf4ff',
      accentColor: '#e879f9',
      bgType: 'animated-gradient',
      bgColor: '#170629',
      bgGradient: 'linear-gradient(135deg, #1e0b36 0%, #581c87 50%, #701a75 100%)',
      bgAnimationSpeed: 18,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#120224',
    },
  },

  // --- PATTERN THEMES ---
  {
    id: 'sanctuary-crosses',
    name: 'Sanctuary Crosses',
    category: 'pattern',
    description: 'Warm obsidian and gold with repeating delicate church crosses motif',
    palette: ['#0b0e17', '#171c2b', '#f59e0b', '#ffffff'],
    theme: {
      fontFamily: 'Playfair Display, serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#f59e0b',
      bgType: 'pattern',
      bgColor: '#0b0e17',
      bgGradient: 'linear-gradient(135deg, #07090f 0%, #151b2a 50%, #0d121c 100%)',
      bgPattern: 'crosses',
      bgPatternColor: '#f59e0b',
      bgPatternOpacity: 0.22,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    id: 'stained-glass-cathedral',
    name: 'Stained Glass Cathedral',
    category: 'pattern',
    description: 'Deep jewel tones with faceted stained glass polygon window pattern',
    palette: ['#0f0a1c', '#2c1547', '#38bdf8', '#c084fc'],
    theme: {
      fontFamily: 'Cinzel, serif',
      fontSize: 42,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#c084fc',
      letterSpacing: 1.5,
      bgType: 'pattern',
      bgColor: '#0f0a1c',
      bgGradient: 'linear-gradient(145deg, #090514 0%, #2e1065 40%, #1e1b4b 75%, #051329 100%)',
      bgPattern: 'stained-glass',
      bgPatternColor: '#e0e7ff',
      bgPatternOpacity: 0.2,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 18,
      shadowColor: 'rgba(0,0,0,0.95)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    id: 'shimmering-constellations',
    name: 'Celestial Constellations',
    category: 'pattern',
    description: 'Cosmic indigo gradient overlaid with delicate starry constellations',
    palette: ['#040817', '#0f172a', '#38bdf8', '#ffffff'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#f8fafc',
      accentColor: '#38bdf8',
      bgType: 'pattern',
      bgColor: '#040817',
      bgGradient: 'linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e293b 100%)',
      bgPattern: 'constellations',
      bgPatternColor: '#38bdf8',
      bgPatternOpacity: 0.28,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#000000',
    },
  },
  {
    id: 'living-waters-waves',
    name: 'Living Waters Waves',
    category: 'pattern',
    description: 'Calm marine teal gradient with flowing water contour lines',
    palette: ['#021824', '#083344', '#2dd4bf', '#ffffff'],
    theme: {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#2dd4bf',
      bgType: 'pattern',
      bgColor: '#021824',
      bgGradient: 'linear-gradient(135deg, #02141e 0%, #0e374e 50%, #042435 100%)',
      bgPattern: 'waves',
      bgPatternColor: '#2dd4bf',
      bgPatternOpacity: 0.24,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 15,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#010f17',
    },
  },
  {
    id: 'golden-honeycomb',
    name: 'Golden Honeycomb',
    category: 'pattern',
    description: 'Symmetrical interlocking hexagon lattice with golden amber accents',
    palette: ['#120e06', '#2b1d06', '#fbbf24', '#fef3c7'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#fffbeb',
      accentColor: '#fbbf24',
      bgType: 'pattern',
      bgColor: '#120e06',
      bgGradient: 'linear-gradient(145deg, #0d0a04 0%, #261904 50%, #150d02 100%)',
      bgPattern: 'hexagons',
      bgPatternColor: '#fbbf24',
      bgPatternOpacity: 0.2,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#0a0701',
    },
  },
  {
    id: 'cathedral-damask',
    name: 'Cathedral Damask',
    category: 'pattern',
    description: 'Noble fleur-de-lis sanctuary crest pattern in dark obsidian velvet',
    palette: ['#140821', '#320e54', '#c084fc', '#ffffff'],
    theme: {
      fontFamily: 'Playfair Display, serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#c084fc',
      bgType: 'pattern',
      bgColor: '#140821',
      bgGradient: 'linear-gradient(135deg, #0e0517 0%, #290847 50%, #120321 100%)',
      bgPattern: 'damask',
      bgPatternColor: '#c084fc',
      bgPatternOpacity: 0.18,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 18,
      shadowColor: 'rgba(0,0,0,0.95)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#080112',
    },
  },
  {
    id: 'modern-architect-grid',
    name: 'Modern Blueprint Grid',
    category: 'pattern',
    description: 'Clean architectural grid overlay for modern youth and tech services',
    palette: ['#090d16', '#162238', '#60a5fa', '#f8fafc'],
    theme: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#f8fafc',
      accentColor: '#60a5fa',
      bgType: 'pattern',
      bgColor: '#090d16',
      bgGradient: 'linear-gradient(135deg, #060910 0%, #111a2d 50%, #090e18 100%)',
      bgPattern: 'grid',
      bgPatternColor: '#60a5fa',
      bgPatternOpacity: 0.16,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 14,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: true,
      outlineWidth: 1.5,
      outlineColor: '#000000',
    },
  },
  {
    id: 'ambient-halo-bokeh',
    name: 'Ambient Halo Bokeh',
    category: 'pattern',
    description: 'Warm circular bokeh light rings gently illuminating the backdrop',
    palette: ['#170e06', '#3b2408', '#f59e0b', '#ffffff'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#ffffff',
      accentColor: '#f59e0b',
      bgType: 'pattern',
      bgColor: '#170e06',
      bgGradient: 'linear-gradient(135deg, #100903 0%, #301b06 50%, #180d02 100%)',
      bgPattern: 'bokeh',
      bgPatternColor: '#f59e0b',
      bgPatternOpacity: 0.22,
      bgPatternScale: 1,
      textShadow: true,
      shadowBlur: 16,
      shadowColor: 'rgba(0,0,0,0.9)',
      textOutline: true,
      outlineWidth: 2,
      outlineColor: '#0c0601',
    },
  },

  // --- SOLID MINIMAL THEMES ---
  {
    id: 'solid-obsidian-black',
    name: 'Pure Obsidian Black',
    category: 'solid',
    description: 'Zero distraction pitch-black background engineered for ultra-high contrast',
    palette: ['#000000', '#ffffff', '#38bdf8'],
    theme: {
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 46,
      fontWeight: 800,
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      bgType: 'solid',
      bgColor: '#000000',
      textShadow: true,
      shadowBlur: 12,
      shadowColor: 'rgba(0,0,0,0.8)',
      textOutline: false,
    },
  },
  {
    id: 'solid-slate-dark',
    name: 'Slate Carbon Minimal',
    category: 'solid',
    description: 'Deep navy-slate solid background with crisp modern sans typography',
    palette: ['#090d16', '#f8fafc', '#60a5fa'],
    theme: {
      fontFamily: 'Inter, sans-serif',
      fontSize: 44,
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
    id: 'solid-espresso-warm',
    name: 'Obsidian Espresso',
    category: 'solid',
    description: 'Warm organic charcoal-espresso solid with golden cream text',
    palette: ['#120f0c', '#fef3c7', '#fbbf24'],
    theme: {
      fontFamily: 'Playfair Display, serif',
      fontSize: 44,
      fontWeight: 700,
      textColor: '#fef3c7',
      accentColor: '#fbbf24',
      bgType: 'solid',
      bgColor: '#120f0c',
      textShadow: true,
      shadowBlur: 12,
      shadowColor: 'rgba(0,0,0,0.85)',
      textOutline: false,
    },
  },

  // --- BROADCAST & OVERLAYS ---
  {
    id: 'broadcast-lower-third',
    name: 'Broadcast Lower-Third',
    category: 'broadcast',
    description: 'Transparent background for camera feeds and vMix live streaming',
    palette: ['transparent', '#ffffff', '#38bdf8', '#000000'],
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
];

// -----------------------------------------------------------------
// 3. Robust Background Style Calculator (DisplayView, Preview, Live)
// -----------------------------------------------------------------
export function getThemeBackgroundStyle(
  theme: Partial<PresentationTheme> | undefined,
  options?: {
    isBlackout?: boolean;
    isOverlay?: boolean;
  }
): {
  containerStyle: React.CSSProperties;
  patternDataUrl: string | null;
  patternStyle: React.CSSProperties;
  isAnimated: boolean;
} {
  const isBlackout = options?.isBlackout || false;
  const isOverlay = options?.isOverlay || false;

  if (isBlackout) {
    return {
      containerStyle: { background: '#000000', backgroundColor: '#000000' },
      patternDataUrl: null,
      patternStyle: {},
      isAnimated: false,
    };
  }

  if (isOverlay || theme?.bgType === 'transparent' || theme?.displayMode === 'lower-third') {
    return {
      containerStyle: { background: 'transparent', backgroundColor: 'transparent' },
      patternDataUrl: null,
      patternStyle: {},
      isAnimated: false,
    };
  }

  const bgType: BackgroundType = theme?.bgType || 'animated-gradient';
  const bgColor = theme?.bgColor || '#090d16';
  const bgGradient = theme?.bgGradient || 'linear-gradient(135deg, #060b19 0%, #1e1b4b 45%, #2e1065 100%)';
  const bgImage = theme?.bgImage;

  // Compute pattern overlay if pattern is specified
  const patternId = theme?.bgPattern;
  const patternDataUrl = patternId
    ? getPatternDataUrl(
        patternId,
        theme?.bgPatternColor,
        theme?.bgPatternOpacity,
        theme?.bgPatternScale
      )
    : null;

  const patternStyle: React.CSSProperties = patternDataUrl
    ? {
        backgroundImage: `url("${patternDataUrl}")`,
        backgroundRepeat: 'repeat',
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }
    : {};

  if (bgType === 'image' && bgImage) {
    return {
      containerStyle: {
        backgroundImage: `url("${bgImage}")`,
        backgroundSize: theme?.bgImageFit || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: bgColor,
      },
      patternDataUrl,
      patternStyle,
      isAnimated: false,
    };
  }

  if (bgType === 'solid') {
    return {
      containerStyle: {
        background: bgColor,
        backgroundColor: bgColor,
      },
      patternDataUrl,
      patternStyle,
      isAnimated: false,
    };
  }

  if (bgType === 'pattern') {
    return {
      containerStyle: {
        background: bgGradient || bgColor,
        backgroundColor: bgColor,
      },
      patternDataUrl,
      patternStyle,
      isAnimated: false,
    };
  }

  if (bgType === 'animated-gradient') {
    return {
      containerStyle: {
        background: bgGradient,
        backgroundSize: '240% 240%',
      },
      patternDataUrl,
      patternStyle,
      isAnimated: true,
    };
  }

  // Standard linear/radial gradient
  return {
    containerStyle: {
      background: bgGradient,
    },
    patternDataUrl,
    patternStyle,
    isAnimated: false,
  };
}

// -----------------------------------------------------------------
// 4. Import & Export Helpers (JSON theme files & localStorage)
// -----------------------------------------------------------------
export const CUSTOM_THEMES_STORAGE_KEY = 'easystream_custom_themes_v2';
export const CUSTOM_BACKGROUNDS_STORAGE_KEY = 'easystream_custom_backgrounds_v2';

export function getSavedCustomThemes(): ExtendedThemePreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom themes from storage:', err);
    return [];
  }
}

export function saveCustomTheme(preset: ExtendedThemePreset): void {
  try {
    const current = getSavedCustomThemes().filter((p) => p.id !== preset.id);
    current.unshift(preset);
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(current.slice(0, 30)));
  } catch (err) {
    console.error('Failed to save custom theme to storage:', err);
  }
}

export function deleteCustomTheme(id: string): void {
  try {
    const current = getSavedCustomThemes().filter((p) => p.id !== id);
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to delete custom theme from storage:', err);
  }
}

export function getSavedCustomBackgrounds(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_BACKGROUNDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function saveCustomBackground(dataUrl: string): void {
  try {
    const current = getSavedCustomBackgrounds().filter((u) => u !== dataUrl);
    current.unshift(dataUrl);
    // Limit to 10 stored background images to prevent quota overflow
    localStorage.setItem(CUSTOM_BACKGROUNDS_STORAGE_KEY, JSON.stringify(current.slice(0, 10)));
  } catch (err) {
    console.error('Failed to save custom background:', err);
  }
}

export function exportThemeToJson(theme: PresentationTheme, name?: string): void {
  const exportData = {
    easystreamThemeVersion: '2.0',
    name: name || 'Custom Church Theme',
    exportedAt: new Date().toISOString(),
    theme,
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (name || 'easystream-theme')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  link.download = `${safeName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateThemeJson(
  jsonString: string
): { valid: boolean; theme?: Partial<PresentationTheme>; name?: string; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'File is not a valid JSON object' };
    }

    // Support both wrapped export format { theme: {...}, name: ... } and direct theme object
    const rawTheme = parsed.theme || parsed;
    const name = parsed.name || 'Imported Theme';

    if (!rawTheme || typeof rawTheme !== 'object') {
      return { valid: false, error: 'No theme properties found in JSON' };
    }

    const sanitized: Partial<PresentationTheme> = {};

    if (rawTheme.fontFamily) sanitized.fontFamily = String(rawTheme.fontFamily);
    if (typeof rawTheme.fontSize === 'number') sanitized.fontSize = rawTheme.fontSize;
    if (typeof rawTheme.fontWeight === 'number') sanitized.fontWeight = rawTheme.fontWeight;
    if (rawTheme.textColor) sanitized.textColor = String(rawTheme.textColor);
    if (rawTheme.accentColor) sanitized.accentColor = String(rawTheme.accentColor);
    if (rawTheme.bgType) sanitized.bgType = rawTheme.bgType as BackgroundType;
    if (rawTheme.bgColor) sanitized.bgColor = String(rawTheme.bgColor);
    if (rawTheme.bgGradient) sanitized.bgGradient = String(rawTheme.bgGradient);
    if (rawTheme.bgPattern) sanitized.bgPattern = String(rawTheme.bgPattern);
    if (rawTheme.bgPatternColor) sanitized.bgPatternColor = String(rawTheme.bgPatternColor);
    if (typeof rawTheme.bgPatternOpacity === 'number') sanitized.bgPatternOpacity = rawTheme.bgPatternOpacity;
    if (typeof rawTheme.bgPatternScale === 'number') sanitized.bgPatternScale = rawTheme.bgPatternScale;
    if (rawTheme.bgImage) sanitized.bgImage = String(rawTheme.bgImage);
    if (rawTheme.bgImageFit) sanitized.bgImageFit = rawTheme.bgImageFit;
    if (typeof rawTheme.bgAnimationSpeed === 'number') sanitized.bgAnimationSpeed = rawTheme.bgAnimationSpeed;
    if (typeof rawTheme.bgOverlayOpacity === 'number') sanitized.bgOverlayOpacity = rawTheme.bgOverlayOpacity;
    if (typeof rawTheme.textShadow === 'boolean') sanitized.textShadow = rawTheme.textShadow;
    if (typeof rawTheme.shadowBlur === 'number') sanitized.shadowBlur = rawTheme.shadowBlur;
    if (rawTheme.shadowColor) sanitized.shadowColor = String(rawTheme.shadowColor);
    if (typeof rawTheme.textOutline === 'boolean') sanitized.textOutline = rawTheme.textOutline;
    if (typeof rawTheme.outlineWidth === 'number') sanitized.outlineWidth = rawTheme.outlineWidth;
    if (rawTheme.outlineColor) sanitized.outlineColor = String(rawTheme.outlineColor);
    if (rawTheme.displayMode) sanitized.displayMode = rawTheme.displayMode;
    if (rawTheme.textAlign) sanitized.textAlign = rawTheme.textAlign;
    if (rawTheme.verticalAlign) sanitized.verticalAlign = rawTheme.verticalAlign;
    if (rawTheme.scripture) sanitized.scripture = rawTheme.scripture;
    if (rawTheme.lyrics) sanitized.lyrics = rawTheme.lyrics;

    return { valid: true, theme: sanitized, name };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid JSON format' };
  }
}
