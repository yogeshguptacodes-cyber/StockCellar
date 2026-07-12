import { Search, X } from 'lucide-react-native';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const ICON_SIZE = 17;

/** Search field with leading icon, animated focus ring, and clear affordance. */
export const SearchInput = memo(function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search',
}: SearchInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: focused ? theme.colors.surface : theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: focused ? theme.colors.primary : 'transparent',
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          minHeight: theme.layout.minTouchTarget,
          gap: theme.spacing.sm,
        },
      ]}>
      <Search
        size={ICON_SIZE}
        color={focused ? theme.colors.primary : theme.colors.textTertiary}
        strokeWidth={2}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        style={[styles.input, theme.typography.body, { color: theme.colors.textPrimary }]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={theme.spacing.sm}
          style={[
            styles.clear,
            { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.full },
          ]}>
          <X size={12} color={theme.colors.textSecondary} strokeWidth={2.5} />
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
  clear: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
