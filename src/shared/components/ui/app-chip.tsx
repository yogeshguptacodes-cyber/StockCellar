import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './app-text';

import { useTheme } from '@/theme';

export interface AppChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Filter chip atom — used for category filters. */
export const AppChip = memo(function AppChip({ label, selected, onPress }: AppChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} filter`}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceMuted,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs + theme.spacing.xxs,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <AppText
        variant="label"
        style={{ color: selected ? theme.colors.onPrimary : theme.colors.textSecondary }}>
        {label}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
