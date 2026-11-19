import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Dedicated styles for Focus & Timer Module (src/app/dashboard/focus.tsx)
 */
export const focusStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgApp,
  },
  backButton: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  modeSelector: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  modeTab: {
    backgroundColor: 'transparent',
  },
  modeTabActive: {
    backgroundColor: Palette.accentDeepPurple,
  },
  modeText: {
    color: Palette.textSecondary,
    fontWeight: 'normal',
  },
  modeTextActive: {
    color: Palette.textWhite,
    fontWeight: 'bold',
  },
  alarmBanner: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerLight,
  },
  alarmStopButton: {
    backgroundColor: Palette.dangerLight,
  },
  displayCard: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  displayDigits: {
    color: Palette.accentDeepPurpleBorder,
  },
  pickerCard: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  durationValue: {
    color: Palette.accentDeepPurpleBorder,
  },
  actionButtonPrimary: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  actionButtonSecondary: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  resetButton: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
});
