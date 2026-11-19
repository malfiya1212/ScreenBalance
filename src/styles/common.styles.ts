import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Reusable, shared styles used across multiple screens and modules.
 */
export const commonStyles = StyleSheet.create({
  // Safe Areas
  authSafeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  appSafeArea: {
    backgroundColor: Palette.bgApp,
  },

  // Surfaces & Cards
  card: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  cardNoBorder: {
    backgroundColor: Palette.cardPlum,
  },

  // Circular Back Buttons
  backButtonCircle: {
    backgroundColor: '#1E1838',
    borderColor: '#2E2554',
  },

  // Primary Buttons (Auth / Onboarding)
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    shadowColor: Palette.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 54,
  },
  primaryButtonDisabled: {
    backgroundColor: Palette.primaryPurpleDisabled,
  },

  // Dashboard Action Buttons
  dashboardButton: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  dashboardButtonSecondary: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },

  // Status Banners
  bannerDanger: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerBorder,
  },
  bannerDangerSubtle: {
    backgroundColor: Palette.dangerBgSubtle,
    borderColor: Palette.dangerBorder,
  },
  bannerSuccess: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },

  // Tracking Access Badges
  trackingActiveBadge: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  trackingInactiveBadge: {
    backgroundColor: '#332326',
    borderColor: Palette.danger,
  },
  trackingActiveText: {
    color: Palette.successText,
  },
  trackingInactiveText: {
    color: Palette.dangerText,
  },

  // Common Text Utilities
  textAccent: {
    color: Palette.textAccent,
  },
  textSubtitle: {
    color: Palette.textSubtitle,
  },
  textMuted: {
    color: Palette.textMuted,
  },
  textWhite: {
    color: Palette.textWhite,
  },

  // Divider
  divider: {
    backgroundColor: Palette.divider,
  },
});
