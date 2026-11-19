import { StyleSheet } from 'react-native';
import { Palette } from '../theme';

/**
 * Dedicated styles for the Slide-Out Navigation Drawer
 */
export const navigationDrawerStyles = StyleSheet.create({
  drawerPanel: {
    backgroundColor: Palette.cardPlum,
  },
  footer: {
    backgroundColor: Palette.cardDarkPlum,
  },
  itemActive: {
    backgroundColor: Palette.accentDeepPurple,
  },
  itemInactive: {
    backgroundColor: 'transparent',
  },
  iconActive: {
    color: Palette.textWhite,
    fontSize: 16,
  },
  iconInactive: {
    color: Palette.textSecondary,
    fontSize: 16,
  },
  labelActive: {
    color: Palette.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  labelInactive: {
    color: Palette.textSubtitle,
    fontWeight: '500',
    fontSize: 13,
  },
});
