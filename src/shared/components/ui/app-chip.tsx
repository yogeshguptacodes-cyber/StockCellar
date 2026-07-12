import { memo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from './app-text';

import { useTheme } from '@/theme';

export interface AppChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const MIN_HEIGHT = 34;

/** Filter/segment chip — filled when selected, quiet outline otherwise. */
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
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? theme.colors.primary : theme.colors.borderStrong,
          borderRadius: theme.radius.full,
          paddingHorizontal: theme.spacing.md,
          opacity: pressed ? 0.75 : 1,
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
    minHeight: MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
