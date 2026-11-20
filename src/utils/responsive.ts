import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Android 600dp breakpoint for tablets (sw600dp)
 */
export const isTablet = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

/**
 * Mobile baseline width (standard phone ~ 390dp)
 */
const BASE_WIDTH = 390;

/**
 * Dynamically scales a font size so it remains clear and readable across
 * small phones, standard phones, and tablets.
 * Ensures font is never shrunk to unreadable sizes on low-density/tablet displays.
 */
export function scaleFont(size: number): number {
  if (isTablet) {
    // Increase by ~20% for tablets for readability at arm's length
    return Math.round(size * 1.2);
  }
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  if (scale < 0.9) {
    return Math.round(size * 0.92);
  }
  if (scale > 1.15) {
    return Math.round(size * 1.12);
  }
  return Math.round(size * scale);
}

/**
 * Standard readable font size tokens across the app.
 * Guarantees zero tiny/microscopic text on any device.
 */
export const FontSizes = {
  /** Badges, pill tags, indicators (min 12px) */
  tag: isTablet ? 13 : 12,
  /** Secondary subtext, timestamps, package names */
  caption: isTablet ? 14 : 13,
  /** Normal body text, list descriptions */
  bodySmall: isTablet ? 15 : 14,
  /** Primary body, inputs, button labels */
  body: isTablet ? 17 : 15,
  /** Card titles, emphasized row headers */
  cardTitle: isTablet ? 19 : 17,
  /** Section headers, modal titles */
  sectionHeader: isTablet ? 22 : 19,
  /** Screen titles, main headers */
  screenTitle: isTablet ? 26 : 22,
  /** Large hero numbers & gauges */
  heroNumber: isTablet ? 38 : 32,
  /** Display hero title */
  displayTitle: isTablet ? 36 : 28,
} as const;

/**
 * Safe content container maximum width
 */
export const MaxContainerWidth = isTablet ? 680 : 480;
