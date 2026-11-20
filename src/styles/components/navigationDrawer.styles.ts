import { StyleSheet } from 'react-native';
import { Palette } from '../theme';
import { isTablet } from '@/utils/responsive';

/**
 * Dedicated styles for the Slide-Out Navigation Drawer
 * Responsive across phones and tablets.
 */
export const navigationDrawerStyles = StyleSheet.create({
  drawerPanel: {
    backgroundColor: Palette.cardPlum,
    width: isTablet ? 340 : 290,
  },
  footer: {
    backgroundColor: Palette.cardDarkPlum,
    padding: isTablet ? 18 : 14,
  },
  itemActive: {
    backgroundColor: Palette.accentDeepPurple,
  },
  itemInactive: {
    backgroundColor: 'transparent',
  },
  iconActive: {
    color: Palette.textWhite,
    fontSize: isTablet ? 18 : 16,
  },
  iconInactive: {
    color: Palette.textSecondary,
    fontSize: isTablet ? 18 : 16,
  },
  labelActive: {
    color: Palette.textWhite,
    fontWeight: '700',
    fontSize: isTablet ? 15 : 13,
  },
  labelInactive: {
    color: Palette.textSubtitle,
    fontWeight: '500',
    fontSize: isTablet ? 15 : 13,
  },
});
