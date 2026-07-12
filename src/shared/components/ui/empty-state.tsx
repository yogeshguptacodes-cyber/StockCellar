import type { LucideIcon } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AppButton } from './app-button';
import { AppText } from './app-text';

import { useTheme } from '@/theme';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const BUBBLE_SIZE = 72;
const ICON_SIZE = 30;

/** Standard empty/zero-data state used across list screens. */
export const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(theme.motion.duration.slow)}
      style={[styles.container, { gap: theme.spacing.md, padding: theme.spacing.xxl }]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.full },
        ]}>
        <Icon size={ICON_SIZE} color={theme.colors.primary} strokeWidth={1.75} />
      </View>
      <AppText variant="subtitle" style={styles.centered}>
        {title}
      </AppText>
      <AppText variant="body" color="textSecondary" style={styles.centered}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    textAlign: 'center',
  },
});
