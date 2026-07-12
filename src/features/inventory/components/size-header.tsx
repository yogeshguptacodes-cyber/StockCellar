import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AMOUNT_INPUT_WIDTH, CELL_GAP, CELL_WIDTH } from './register-row';
import type { RegisterTab } from '../types';

import { BOTTLE_SIZES } from '@/domain/models';
import { AppText } from '@/shared/components/ui';
import { useTheme } from '@/theme';

export interface SizeHeaderProps {
  tab: RegisterTab;
}

/** Column header row — the "1000 750 180 90 60 30" strip from the sheet. */
export const SizeHeader = memo(function SizeHeader({ tab }: SizeHeaderProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.xs, gap: theme.spacing.sm },
      ]}>
      <AppText variant="caption" color="textTertiary" style={styles.name}>
        NAME OF LIQUOR
      </AppText>
      {tab === 'amount' ? (
        <AppText
          variant="caption"
          color="textTertiary"
          style={[styles.amountLabel, { width: AMOUNT_INPUT_WIDTH }]}>
          ₹
        </AppText>
      ) : (
        <View style={[styles.cells, { gap: CELL_GAP }]}>
          {BOTTLE_SIZES.map((size) => (
            <AppText
              key={size}
              variant="caption"
              color="textTertiary"
              style={[styles.cellLabel, { width: CELL_WIDTH }]}>
              {size}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
  cells: {
    flexDirection: 'row',
  },
  cellLabel: {
    textAlign: 'center',
  },
  amountLabel: {
    textAlign: 'center',
  },
});
