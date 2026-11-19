import { StyleSheet } from 'react-native';
import { Palette } from '../theme';

/**
 * Dedicated styles for Bottom Navigation Bar and custom tab icons
 */
export const bottomNavStyles = StyleSheet.create({
  container: {
    backgroundColor: Palette.bgApp,
    borderTopColor: Palette.borderPlum,
    paddingTop: 10,
  },
  labelActive: {
    color: Palette.textAccent,
  },
  labelInactive: {
    color: Palette.textMuted,
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    width: 14,
    height: 10,
    borderWidth: 1.8,
    borderTopWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  homeDoor: {
    width: 4,
    height: 5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  barColumn: {
    width: 3.5,
    borderRadius: 1.5,
  },
  barLeft: {
    height: 10,
  },
  barCenter: {
    height: 16,
  },
  barRight: {
    height: 13,
  },
  hangerLoop: {
    width: 1.8,
    height: 3,
    borderRadius: 1,
  },
  calendarBody: {
    width: 16,
    height: 14,
    borderWidth: 1.8,
    borderRadius: 3,
    padding: 1.5,
    justifyContent: 'space-around',
  },
  calendarDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  gearOutline: {
    width: 15,
    height: 15,
    borderWidth: 1.8,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearHub: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gearToothHorizontal: {
    position: 'absolute',
    width: 17,
    height: 2,
    borderRadius: 1,
  },
  gearToothVertical: {
    position: 'absolute',
    width: 2,
    height: 17,
    borderRadius: 1,
  },
});
