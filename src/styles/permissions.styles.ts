import { StyleSheet } from 'react-native';
import { Palette } from './theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for the Permissions Screen (src/app/permissions.tsx)
 * Responsive across phones and tablets.
 */
export const permissionsStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : 20,
    paddingVertical: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: isTablet ? 600 : 440,
    alignSelf: 'center',
  },
  backButton: {
    backgroundColor: '#1E1838',
    borderColor: '#2E2554',
  },
  statusBadgeGranted: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  statusBadgeRequired: {
    backgroundColor: '#332326',
    borderColor: Palette.danger,
  },
  statusTextGranted: {
    color: Palette.successText,
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
  },
  statusTextRequired: {
    color: Palette.dangerText,
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
  },
  descriptionText: {
    color: Palette.textSubtitle,
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
  },
  statusMessageBanner: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  statusMessageBannerWarning: {
    backgroundColor: '#352210',
    borderColor: '#B45309',
  },
  permissionCard: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
    minHeight: 72,
  },
  permissionCardActive: {
    borderColor: Palette.successDark,
    backgroundColor: '#131B2A',
  },
  iconBoxGranted: {
    backgroundColor: Palette.successBg,
  },
  iconBoxPending: {
    backgroundColor: '#2B1E4A',
  },
  permissionTitle: {
    fontSize: isTablet ? 17 : 15,
    fontWeight: '700',
    color: Palette.textWhite,
  },
  permissionSubtext: {
    color: Palette.textSecondary,
    fontSize: isTablet ? 14 : 12,
  },
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
    minHeight: 56,
  },
  secondaryButton: {
    backgroundColor: '#201A38',
    borderColor: '#43346B',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#D1CADB',
    fontSize: isTablet ? 15 : 13,
    fontWeight: '700',
  },
});
