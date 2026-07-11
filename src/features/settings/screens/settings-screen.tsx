import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSettingsStore } from '../store/settings-store';

import { appConfig } from '@/core/config';
import { Screen } from '@/shared/components/layouts/screen';
import { AppCard, AppText } from '@/shared/components/ui';
import { useTheme, type ThemePreference } from '@/theme';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Follow the device setting' },
  { value: 'light', label: 'Light', hint: 'Always use the light theme' },
  { value: 'dark', label: 'Dark', hint: 'Always use the dark theme' },
];

export function SettingsScreen() {
  const theme = useTheme();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <AppText variant="headline">Settings</AppText>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Appearance</AppText>
          <AppCard style={styles.noPadding}>
            {THEME_OPTIONS.map((option, index) => {
              const selected = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${option.label} theme`}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                      gap: theme.spacing.md,
                      minHeight: theme.layout.minTouchTarget,
                      opacity: pressed ? 0.7 : 1,
                      borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: theme.colors.border,
                    },
                  ]}>
                  <View style={styles.optionInfo}>
                    <AppText variant="bodyStrong">{option.label}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {option.hint}
                    </AppText>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </AppCard>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">About</AppText>
          <AppCard>
            <View style={{ gap: theme.spacing.sm }}>
              <View style={styles.aboutRow}>
                <AppText variant="label" color="textSecondary">
                  Version
                </AppText>
                <AppText variant="label">{appConfig.appVersion}</AppText>
              </View>
              <View style={styles.aboutRow}>
                <AppText variant="label" color="textSecondary">
                  Environment
                </AppText>
                <AppText variant="label">{appConfig.environment}</AppText>
              </View>
            </View>
          </AppCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPadding: {
    padding: 0,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
