import { StyleSheet } from 'react-native';
import { Palette } from './theme';

/**
 * Dedicated styles for the Dashboard Screen (src/app/dashboard/index.tsx)
 */
export const dashboardStyles = StyleSheet.create({
  bgApp: {
    backgroundColor: Palette.bgApp,
  },
  topBar: {
    backgroundColor: Palette.bgApp,
    borderBottomColor: Palette.borderDark,
  },
  card: {
    backgroundColor: Palette.cardPlum,
    borderColor: Palette.borderPlum,
  },
  cardNoBorder: {
    backgroundColor: Palette.cardPlum,
  },
  modalSheet: {
    backgroundColor: Palette.cardPlum,
  },
  btnPrimary: {
    backgroundColor: Palette.accentDeepPurple,
  },
  btnPrimaryBordered: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  btnDanger: {
    backgroundColor: Palette.danger,
  },
  bannerDanger: {
    backgroundColor: Palette.dangerBgSubtle,
    borderColor: Palette.dangerBorder,
  },
  iconBoxDanger: {
    backgroundColor: Palette.dangerIconBox,
  },
  bannerSuccess: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  iconBoxSuccess: {
    backgroundColor: Palette.successIconBox,
  },
  trackingActiveBadge: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.successDark,
  },
  trackingInactiveBadge: {
    backgroundColor: '#332326',
    borderColor: Palette.danger,
  },
  trackingActiveText: {
    color: Palette.successText,
  },
  trackingInactiveText: {
    color: Palette.dangerText,
  },
  inputField: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
    color: Palette.textWhite,
  },
  textAccent: {
    color: Palette.textAccent,
  },
  textMuted: {
    color: Palette.textMuted,
  },
  chartTabActive: {
    backgroundColor: Palette.accentDeepPurple,
  },
  chartTabInactive: {
    backgroundColor: 'transparent',
  },
  chartTabTextActive: {
    color: Palette.textWhite,
    fontSize: 12,
  },
  chartTabTextInactive: {
    color: Palette.textSecondary,
    fontSize: 12,
  },
  chartDot: {
    borderRadius: 7,
    backgroundColor: Palette.accentDeepPurpleBorder,
    borderWidth: 2.5,
    borderColor: Palette.cardPlum,
  },
  chartDotSelected: {
    width: 14,
    height: 14,
  },
  chartDotNormal: {
    width: 10,
    height: 10,
  },
  chartLabelSelected: {
    color: Palette.accentDeepPurpleBorder,
    fontWeight: 'bold',
  },
  chartLabelNormal: {
    color: Palette.textMuted,
    fontWeight: 'normal',
  },
  chartBarMobile: {
    backgroundColor: Palette.accentDeepPurpleBorder,
  },
  chartBarWeb: {
    backgroundColor: '#7C67B3',
  },
  progressBarFill: {
    backgroundColor: Palette.accentDeepPurpleBorder,
  },
  progressBarDanger: {
    backgroundColor: Palette.dangerLight,
  },
  progressBarDisabled: {
    backgroundColor: '#3A3347',
  },
  toggleTrackActive: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  toggleTrackInactive: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
  },
  toggleThumbActive: {
    backgroundColor: Palette.textWhite,
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    backgroundColor: Palette.textMuted,
    alignSelf: 'flex-start',
  },
  filterPillActive: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  filterPillInactive: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
  },
  filterTextActive: {
    color: Palette.textWhite,
  },
  filterTextInactive: {
    color: Palette.textSecondary,
  },
  rowDivider: {
    borderBottomColor: '#2A2436',
  },
  rowDividerNone: {
    borderBottomColor: 'transparent',
  },
  // Weekday Strip Pills
  weekdayPill: {
    backgroundColor: '#1E1926',
    borderColor: '#2E273B',
  },
  weekdayPillActive: {
    backgroundColor: '#3E305C',
    borderColor: '#9D84D6',
  },
  // Metrics Card
  metricCard: {
    backgroundColor: '#1B1724',
    borderColor: '#2E273B',
  },
  // Challenge Card
  challengeCard: {
    backgroundColor: '#201B2B',
    borderColor: '#2E273B',
  },
  challengeBadge: {
    backgroundColor: '#2D253D',
    borderColor: '#84CC16',
  },
  // Timeframe Tabs
  timeframeTabActive: {
    backgroundColor: Palette.accentDeepPurple,
    borderColor: Palette.accentDeepPurpleBorder,
  },
  timeframeTabInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
});
