import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const ICON_SIZE = 18;

/** Search field molecule with leading icon and clear affordance. */
export const SearchInput = memo(function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search',
}: SearchInputProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          minHeight: theme.layout.minTouchTarget,
          gap: theme.spacing.sm,
        },
      ]}>
      <Ionicons name="search" size={ICON_SIZE} color={theme.colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        style={[
          styles.input,
          theme.typography.body,
          { color: theme.colors.textPrimary },
        ]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={theme.spacing.sm}>
          <Ionicons name="close-circle" size={ICON_SIZE} color={theme.colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});
