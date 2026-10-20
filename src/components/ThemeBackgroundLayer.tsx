import React from 'react';
import { PresentationTheme } from '../types';
import { getThemeBackgroundStyle } from '../utils/themePatterns';

interface ThemeBackgroundLayerProps {
  theme?: Partial<PresentationTheme>;
  isBlackout?: boolean;
  isOverlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Reusable background renderer that accurately renders the theme background
 * across DisplayView, Preview Monitor, Live Monitor, and Theme Preview Cards.
 */
export const ThemeBackgroundLayer: React.FC<ThemeBackgroundLayerProps> = ({
  theme,
  isBlackout = false,
  isOverlay = false,
  className = '',
  style = {},
  children,
}) => {
  const { containerStyle, patternStyle, isAnimated } = getThemeBackgroundStyle(
    theme,
    { isBlackout, isOverlay }
  );

  const combinedClass = [
    className,
    isAnimated && !isBlackout && !isOverlay ? 'ambient-gradient' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const overlayOpacity =
    !isBlackout && !isOverlay && typeof theme?.bgOverlayOpacity === 'number'
      ? Math.max(0, Math.min(0.9, theme.bgOverlayOpacity))
      : 0;

  return (
    <div
      className={combinedClass}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.4s ease',
        ...containerStyle,
        ...style,
      }}
    >
      {/* Pattern Overlay Layer */}
      {patternStyle.backgroundImage && !isBlackout && !isOverlay && (
        <div style={patternStyle} />
      )}

      {/* Dimming / Contrast Overlay Layer */}
      {overlayOpacity > 0 && !isBlackout && !isOverlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(0, 0, 0, ${overlayOpacity})`,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {children}
    </div>
  );
};
