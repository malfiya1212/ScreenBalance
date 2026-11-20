import { StyleSheet } from 'react-native';
import { Palette } from '../theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for Bottom Navigation Bar and custom tab icons
 * Responsive across phones and tablets with crisp, readable sizing.
 */
export const bottomNavStyles = StyleSheet.create({
  container: {
    backgroundColor: Palette.bgApp,
    borderTopColor: Palette.borderPlum,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  labelActive: {
    color: Palette.textAccent,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '700',
  },
  labelInactive: {
    color: Palette.textMuted,
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.textAccent,
    marginTop: 3,
  },
  activeIndicatorPlaceholder: {
    width: 16,
    height: 3,
    backgroundColor: 'transparent',
    marginTop: 3,
  },
  iconBox: {
    width: 28,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 1. Home Icon (Clean pitched roof, solid walls, door)
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    width: 18,
    height: 12,
    borderWidth: 2,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    width: 5,
    height: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // 2. Reports Icon (3 distinct bar chart columns)
  reportsContainer: {
    width: 22,
    height: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 1,
  },
  barColumn: {
    width: 4.5,
    borderRadius: 2,
  },
  barLeft: {
    height: 12,
  },
  barCenter: {
    height: 20,
  },
  barRight: {
    height: 15,
  },

  // 3. Schedule Icon (Calendar frame with top rings)
  calendarContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 14,
    marginBottom: -2,
    zIndex: 1,
  },
  hangerLoop: {
    width: 2.5,
    height: 4,
    borderRadius: 1.5,
  },
  calendarBody: {
    width: 20,
    height: 17,
    borderWidth: 2,
    borderRadius: 4,
    padding: 2,
    justifyContent: 'space-around',
  },
  calendarDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
  },

  // 4. Settings Icon (Gear with hub & teeth)
  gearContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearOutline: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearHub: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  gearToothHorizontal: {
    position: 'absolute',
    width: 21,
    height: 2.5,
    borderRadius: 1.5,
  },
  gearToothVertical: {
    position: 'absolute',
    width: 2.5,
    height: 21,
    borderRadius: 1.5,
  },
});
