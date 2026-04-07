import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export function Avatar({ url, name, size = 40, style }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, style]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.bg.card,
  },
  placeholder: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
