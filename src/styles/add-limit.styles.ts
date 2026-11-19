import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Dedicated styles for Add Limit Screen (src/app/dashboard/add-limit.tsx)
 */
export const addLimitStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgApp,
  },
  backButton: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  errorCard: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerBorder,
  },
  sectionCard: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  textInput: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
    color: Palette.textWhite,
  },
  timeValueText: {
    color: Palette.accentDeepPurpleBorder,
  },
  categoryPill: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
  },
  categoryPillSelected: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  categoryText: {
    color: Palette.textSecondary,
  },
  categoryTextSelected: {
    color: Palette.textWhite,
  },
  saveButton: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
});
