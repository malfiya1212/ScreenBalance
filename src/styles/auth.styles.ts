import { StyleSheet } from 'react-native';
import { Palette } from './theme';
import { isTablet } from '@/utils/responsive';

/**
 * Reusable styles for authentication screens (Login, Register, Forgot Password)
 * Responsive across phones and tablets.
 */
export const authStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: isTablet ? 580 : 440,
    alignSelf: 'center',
  },
  backButton: {
    backgroundColor: '#1E1838',
    borderColor: '#2E2554',
  },
  subtitle: {
    color: Palette.textSubtitle,
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
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
    padding: isTablet ? 16 : 12,
  },
  inputWrapper: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
    minHeight: 54,
  },
  inputText: {
    color: Palette.textWhite,
    fontSize: isTablet ? 16 : 14,
  },
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    shadowColor: Palette.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 56,
  },
  primaryButtonDisabled: {
    backgroundColor: Palette.primaryPurpleDisabled,
  },
  emailActionButton: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    minHeight: 52,
  },
  returnButton: {
    backgroundColor: '#1E1B4B',
    borderColor: '#4338CA',
    minHeight: 52,
  },
  secondaryOutlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#3B335E',
    minHeight: 50,
  },
  dividerLine: {
    backgroundColor: Palette.divider,
  },
  googleButton: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
    minHeight: 54,
  },
  linkHighlight: {
    color: Palette.textAccentLight,
  },

  // Success cards (Register success & Forgot password success)
  instructionText: {
    color: Palette.textSubtitle,
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
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
    fontSize: isTablet ? 15 : 13,
  },
});
