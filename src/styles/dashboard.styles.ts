import { StyleSheet } from 'react-native';
import { Palette } from './theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for the Dashboard Screen (src/app/dashboard/index.tsx)
 * Responsive across all devices (phones & tablets).
 */
export const dashboardStyles = StyleSheet.create({
  bgApp: {
    backgroundColor: Palette.bgApp,
  },
  contentContainer: {
    width: '100%',
    maxWidth: isTablet ? 720 : 480,
    alignSelf: 'center',
  },
  topBar: {
    backgroundColor: Palette.bgApp,
    borderBottomColor: Palette.borderDark,
    paddingVertical: isTablet ? 12 : 8,
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
    paddingHorizontal: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 6 : 4,
  },
  trackingInactiveBadge: {
    backgroundColor: '#332326',
    borderColor: Palette.danger,
    paddingHorizontal: isTablet ? 12 : 8,
    paddingVertical: isTablet ? 6 : 4,
  },
  trackingActiveText: {
    color: Palette.successText,
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
  },
  trackingInactiveText: {
    color: Palette.dangerText,
    fontSize: isTablet ? 13 : 11,
    fontWeight: '700',
  },
  inputField: {
    backgroundColor: Palette.bgApp,
    borderColor: Palette.borderPlum,
    color: Palette.textWhite,
    fontSize: isTablet ? 15 : 13,
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
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
  },
  chartTabTextInactive: {
    color: Palette.textSecondary,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
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
    fontSize: isTablet ? 13 : 11,
  },
  chartLabelNormal: {
    color: Palette.textMuted,
    fontWeight: 'normal',
    fontSize: isTablet ? 13 : 11,
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
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
  },
  filterTextInactive: {
    color: Palette.textSecondary,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
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
    padding: isTablet ? 16 : 12,
  },
  // Challenge Card
  challengeCard: {
    backgroundColor: '#201B2B',
    borderColor: '#2E273B',
    padding: isTablet ? 20 : 16,
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
