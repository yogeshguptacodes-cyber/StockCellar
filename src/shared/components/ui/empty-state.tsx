import { Ionicons } from '@expo/vector-icons';
import { memo, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from './app-button';
import { AppText } from './app-text';

import { useTheme } from '@/theme';

export interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ICON_SIZE = 44;

/** Standard empty/zero-data state used across list screens. */
export const EmptyState = memo(function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xxl }]}>
      <Ionicons name={icon} size={ICON_SIZE} color={theme.colors.textTertiary} />
      <AppText variant="subtitle" style={styles.centered}>
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
