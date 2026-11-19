import { StyleSheet } from 'react-native';
import { Palette } from '../theme';

/**
 * Dedicated styles for StayFreeTimePicker dual-wheel rollers
 */
export const timePickerStyles = StyleSheet.create({
  wheelColumn: {
    backgroundColor: Palette.cardSurface,
    borderColor: Palette.borderSubtle,
    borderRadius: 20,
  },
  divider: {
    backgroundColor: Palette.dividerSubtle,
  },
  selectedRow: {
    backgroundColor: Palette.cardSelected,
  },
  selectedLabel: {
    color: Palette.textWhite,
  },
  unselectedLabel: {
    color: Palette.textMuted,
  },
});
