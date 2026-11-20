import { StyleSheet } from 'react-native';
import { Palette } from './theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for the Welcome / Onboarding Screen (src/app/index.tsx)
 * Responsive across phones and tablets.
 */
export const welcomeStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 24,
    paddingVertical: 16,
  },
  contentContainer: {
    width: '100%',
    maxWidth: isTablet ? 600 : 440,
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  subtitle: {
    color: Palette.textSubtitle,
    lineHeight: isTablet ? 26 : 22,
    fontSize: isTablet ? 16 : 14,
  },
  graphicContainer: {
    width: isTablet ? 300 : 260,
    height: isTablet ? 300 : 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: isTablet ? 240 : 200,
    height: isTablet ? 240 : 200,
    borderRadius: isTablet ? 120 : 100,
    backgroundColor: Palette.glowPurple,
    opacity: 0.2,
  },
  floatingBadgeLeft: {
    position: 'absolute',
    left: isTablet ? 18 : 12,
    top: isTablet ? 60 : 50,
    backgroundColor: '#1E1738',
    borderColor: '#3D2D68',
    shadowColor: Palette.glowPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingBadgeRight: {
    position: 'absolute',
    right: isTablet ? 20 : 14,
    bottom: isTablet ? 60 : 50,
    backgroundColor: '#1E1738',
    borderColor: '#3D2D68',
    shadowColor: Palette.glowPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  phoneFrame: {
    width: isTablet ? 144 : 126,
    height: isTablet ? 218 : 194,
    backgroundColor: '#16102E',
    borderColor: '#433273',
    borderWidth: 2.5,
    borderRadius: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  phoneNotch: {
    width: 36,
    height: 3.5,
    backgroundColor: '#322659',
    borderRadius: 2,
    position: 'absolute',
    top: 7,
  },
  phoneInnerScreen: {
    width: '100%',
    height: '88%',
    backgroundColor: '#0E0922',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    borderWidth: 1.5,
    shadowColor: Palette.glowPurple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 10,
    minHeight: 56,
  },
  linkLearnMore: {
    color: Palette.textAccentLight,
    fontSize: isTablet ? 15 : 13,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalSheet: {
    backgroundColor: '#171229',
    borderColor: '#2D234A',
    width: '100%',
    maxWidth: isTablet ? 600 : 440,
    alignSelf: 'center',
  },
  featureItem: {
    backgroundColor: '#1F1836',
    borderColor: '#2F2452',
  },
  btnModalClose: {
    backgroundColor: Palette.primaryPurple,
    minHeight: 48,
  },
  modalHandle: {
    backgroundColor: '#3D3156',
  },
  modalCloseButton: {
    backgroundColor: Palette.primaryPurple,
    minHeight: 48,
  },
});
