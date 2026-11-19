import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Dedicated styles for the Welcome / Onboarding Screen (src/app/index.tsx)
 */
export const welcomeStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  subtitle: {
    color: Palette.textSubtitle,
    lineHeight: 22,
    fontSize: 14,
  },
  graphicContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Palette.glowPurple,
    opacity: 0.2,
  },
  floatingBadgeLeft: {
    position: 'absolute',
    left: 12,
    top: 50,
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
    right: 14,
    bottom: 50,
    backgroundColor: '#1E1738',
    borderColor: '#3D2D68',
    shadowColor: Palette.glowPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  phoneFrame: {
    width: 126,
    height: 194,
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
  modalSheet: {
    backgroundColor: Palette.inputBg,
    borderTopColor: Palette.inputBorder,
    borderTopWidth: 1,
  },
  modalHandle: {
    backgroundColor: '#2E2254',
  },
  modalCloseButton: {
    backgroundColor: Palette.primaryPurple,
  },
});
