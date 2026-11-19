import { StyleSheet } from 'react-native';
import { Palette } from '../theme';

/**
 * Dedicated styles for ScreenBalanceLogo and GoogleGLogo
 */
export const logoStyles = StyleSheet.create({
  // ScreenBalance Logo
  outerContainer: {
    backgroundColor: '#16102E',
    borderColor: '#372863',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primaryPurpleBorder,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  ambientFlare: {
    position: 'absolute',
    backgroundColor: Palette.glowPurple,
    opacity: 0.32,
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceBar: {
    height: 3,
    backgroundColor: '#C4B5FD',
    borderRadius: 2,
    shadowColor: Palette.textAccentLight,
    shadowOffset: { width: 1, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  chambersContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upperChamber: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Palette.glowPurple,
    opacity: 0.85,
  },
  upperHighlight: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#C4B5FD',
    opacity: 0.95,
  },
  lowerChamber: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#6366F1',
    opacity: 0.9,
  },
  lowerHighlight: {
    position: 'absolute',
    bottom: 2,
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Palette.textAccentLight,
    opacity: 0.9,
  },
  nexusSpark: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Palette.textWhite,
    shadowColor: '#DDD6FE',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    zIndex: 10,
  },

  // Google 'G' Logo
  googleContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleImage: {
    width: 20,
    height: 20,
  },
});
