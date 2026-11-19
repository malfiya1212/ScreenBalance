import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Reusable styles for authentication screens (Login, Register, Forgot Password)
 */
export const authStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
  },
  backButton: {
    backgroundColor: '#1E1838',
    borderColor: '#2E2554',
  },
  subtitle: {
    color: Palette.textSubtitle,
  },
  errorBanner: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerBorder,
  },
  successBanner: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  infoBanner: {
    backgroundColor: '#191A33',
    borderColor: '#3730A3',
  },
  demoHintCard: {
    backgroundColor: '#161329',
    borderColor: '#2B234D',
  },
  inputWrapper: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
    minHeight: 52,
  },
  inputText: {
    color: Palette.textWhite,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    shadowColor: Palette.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 52,
  },
  primaryButtonDisabled: {
    backgroundColor: Palette.primaryPurpleDisabled,
  },
  emailActionButton: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    minHeight: 50,
  },
  secondaryOutlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#3B335E',
    minHeight: 48,
  },
  dividerLine: {
    backgroundColor: Palette.divider,
  },
  googleButton: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
    minHeight: 50,
  },
  linkHighlight: {
    color: Palette.textAccentLight,
  },

  // Success cards (Register success & Forgot password success)
  instructionText: {
    color: Palette.textSubtitle,
  },
  successCard: {
    backgroundColor: '#131B2A',
    borderColor: '#1D3B54',
  },
  successCheckBadge: {
    backgroundColor: Palette.success,
  },
  successEmailNotice: {
    color: Palette.textSubtitle,
  },
  returnButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
  },
});
