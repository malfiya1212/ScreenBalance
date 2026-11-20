import { StyleSheet } from 'react-native';
import { Palette } from './theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for Add Limit Screen (src/app/dashboard/add-limit.tsx)
 * Responsive across phones and tablets.
 */
export const addLimitStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgApp,
  },
  contentContainer: {
    width: '100%',
    maxWidth: isTablet ? 720 : 480,
    alignSelf: 'center',
  },
  backButton: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  errorCard: {
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerBorder,
  },
  sectionCard: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
    padding: isTablet ? 20 : 16,
  },
  textInput: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
    color: Palette.textWhite,
    fontSize: isTablet ? 15 : 13,
  },
  timeValueText: {
    color: Palette.accentDeepPurpleBorder,
    fontSize: isTablet ? 18 : 15,
    fontWeight: '700',
  },
  categoryPill: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
    paddingHorizontal: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 8 : 6,
  },
  categoryPillSelected: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
    paddingHorizontal: isTablet ? 14 : 10,
    paddingVertical: isTablet ? 8 : 6,
  },
  categoryText: {
    color: Palette.textSecondary,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: Palette.textWhite,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    minHeight: 56,
  },
});
