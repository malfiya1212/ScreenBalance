import React from 'react';
import { Image, View } from 'react-native';
import { logoStyles as styles } from '@/styles';

interface GoogleGLogoProps {
  size?: number;
}

export default function GoogleGLogo({ size = 20 }: GoogleGLogoProps) {
  return (
    <View style={[styles.googleContainer, { width: size, height: size }]}>
      <Image
        source={require('../../assets/images/google-g.png')}
        style={[styles.googleImage, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
}
