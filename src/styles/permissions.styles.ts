import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Dedicated styles for the Permissions Screen (src/app/permissions.tsx)
 */
export const permissionsStyles = StyleSheet.create({
  safeArea: {
    backgroundColor: Palette.bgDarkest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
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
  },
  statusTextRequired: {
    color: Palette.dangerText,
  },
  descriptionText: {
    color: Palette.textSubtitle,
  },
  statusMessageBanner: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  permissionCard: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
  },
  permissionCardActive: {
    borderColor: Palette.successDark,
  },
  iconBoxGranted: {
    backgroundColor: Palette.successBg,
  },
  iconBoxPending: {
    backgroundColor: '#2B1E4A',
  },
  permissionSubtext: {
    color: Palette.textSecondary,
  },
  primaryButton: {
    backgroundColor: Palette.primaryPurple,
    borderColor: Palette.primaryPurpleBorder,
  },
  secondaryButton: {
    backgroundColor: Palette.inputBg,
    borderColor: Palette.inputBorder,
  },
  secondaryButtonText: {
    color: Palette.textSubtitle,
  },
});
