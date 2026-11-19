import { View } from 'react-native';
import { logoStyles as styles } from '@/styles';

interface ScreenBalanceLogoProps {
  size?: number; // Outer squircle size, default 60
  showGlow?: boolean;
}

export default function ScreenBalanceLogo({
  size = 60,
  showGlow = true,
}: ScreenBalanceLogoProps) {
  const borderRadius = Math.round(size * 0.68);
  const innerSize = Math.round(size * 0.82);

  return (
    <View
      style={[
        styles.outerContainer,
        {
          width: size,
          height: size,
          borderRadius,
          shadowOpacity: showGlow ? 0.55 : 0,
          elevation: showGlow ? 8 : 0,
        },
      ]}
    >
      {/* Background ambient inner flare */}
      <View
        style={[
          styles.ambientFlare,
          {
            width: size * 0.8,
            height: size * 0.8,
            borderRadius: (size * 0.6) / 2,
          },
        ]}
      />

      {/* Custom Geometric Hourglass Balance Emblem */}
      <View
        style={[
          styles.emblemContainer,
          {
            width: innerSize,
            height: innerSize * 1.12,
          },
        ]}
      >
        {/* Top Balance Bar */}
        <View
          style={[
            styles.balanceBar,
            {
              width: innerSize * 0.88,
            },
          ]}
        />

        {/* Hourglass Chambers & Nexus */}
        <View
          style={[
            styles.chambersContainer,
            {
              height: innerSize * 0.76,
            },
          ]}
        >
          {/* Upper Chamber Taper */}
          <View
            style={[
              styles.upperChamber,
              {
                borderLeftWidth: (innerSize * 0.72) / 2,
                borderRightWidth: (innerSize * 0.72) / 2,
                borderTopWidth: innerSize * 0.35,
              },
            ]}
          />

          {/* Upper Inner Glass Highlight */}
          <View
            style={[
              styles.upperHighlight,
              {
                borderLeftWidth: (innerSize * 0.44) / 2,
                borderRightWidth: (innerSize * 0.44) / 2,
                borderTopWidth: innerSize * 0.22,
              },
            ]}
          />

          {/* Lower Chamber Taper */}
          <View
            style={[
              styles.lowerChamber,
              {
                borderLeftWidth: (innerSize * 0.72) / 2,
                borderRightWidth: (innerSize * 0.72) / 2,
                borderBottomWidth: innerSize * 0.35,
              },
            ]}
          />

          {/* Lower Inner Glass Fill */}
          <View
            style={[
              styles.lowerHighlight,
              {
                borderLeftWidth: (innerSize * 0.5) / 2,
                borderRightWidth: (innerSize * 0.5) / 2,
                borderBottomWidth: innerSize * 0.25,
              },
            ]}
          />

          {/* Central Nexus Glow Spark */}
          <View style={styles.nexusSpark} />
        </View>

        {/* Bottom Balance Bar */}
        <View
          style={[
            styles.balanceBar,
            {
              width: innerSize * 0.88,
            },
          ]}
        />
      </View>
    </View>
  );
}
