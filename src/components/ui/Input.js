import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

export const Input = forwardRef(function Input({ label, error, style, ...props }, ref) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
        placeholderTextColor={colors.text.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text.primary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
