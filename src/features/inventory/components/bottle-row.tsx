import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatBottleSize, type Bottle } from '@/domain/models';
import { AppText, QuantityStepper } from '@/shared/components/ui';
import { useTheme } from '@/theme';

export interface BottleRowProps {
  bottle: Bottle;
  quantity: number;
  modified: boolean;
  onAdjust: (bottleId: string, delta: number) => void;
  onSet: (bottleId: string, quantity: number) => void;
}

/**
 * One catalog row. Memoized — FlashList re-renders only rows whose
 * quantity/modified props actually changed.
 */
export const BottleRow = memo(function BottleRow({
  bottle,
  quantity,
  modified,
  onAdjust,
  onSet,
}: BottleRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: modified ? theme.colors.primaryMuted : theme.colors.surface,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
          gap: theme.spacing.md,
        },
      ]}>
      <View style={styles.info}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {bottle.brand} {bottle.name}
        </AppText>
        <AppText variant="caption" color="textSecondary">
          {formatBottleSize(bottle.sizeMl)}
        </AppText>
      </View>
      <QuantityStepper
        value={quantity}
        onAdjust={(delta) => onAdjust(bottle.id, delta)}
        onSet={(value) => onSet(bottle.id, value)}
        accessibilityLabel={`${bottle.brand} ${bottle.name}`}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
});
