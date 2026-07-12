import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { emptyDraftRow, type DraftRow } from '../store/register-store';
import type { RegisterTab } from '../types';

import {
  BOTTLE_SIZES,
  rowSale,
  rowTotal,
  type BottleSize,
  type EditableStockField,
  type LiquorItem,
  type SizeQuantities,
} from '@/domain/models';
import { AppText } from '@/shared/components/ui';
import { useTheme } from '@/theme';

/** Grid geometry shared with the size header so columns align. */
export const CELL_WIDTH = 40;
export const CELL_GAP = 4;
export const AMOUNT_INPUT_WIDTH = 96;
const CELL_HEIGHT = 34;

/** Which cell of THIS row is targeted by the quantity pad. */
export type SelectedCell = BottleSize | 'amount' | null;

export interface RegisterRowProps {
  item: LiquorItem;
  tab: RegisterTab;
  draft: DraftRow | undefined;
  modified: boolean;
  selectedCell?: SelectedCell;
  /** Viewer mode (history detail): render every cell as plain text. */
  readOnly?: boolean;
  onCellPress?: (item: LiquorItem, field: EditableStockField | 'amount', size: BottleSize | null) => void;
}

/**
 * One sheet row: item name + six size cells (or the amount cell).
 * Cells never open the OS keyboard — tapping targets the QuantityPad,
 * which owns all editing. Memoized for FlashList.
 */
export const RegisterRow = memo(function RegisterRow({
  item,
  tab,
  draft,
  modified,
  selectedCell = null,
  readOnly = false,
  onCellPress,
}: RegisterRowProps) {
  const theme = useTheme();
  const row = draft ?? emptyDraftRow();

  const editableField: EditableStockField | null =
    !readOnly && (tab === 'opening' || tab === 'received' || tab === 'balance') ? tab : null;

  let computed: SizeQuantities | null = null;
  if (tab === 'total') {
    computed = rowTotal(row);
  } else if (tab === 'sale') {
    computed = rowSale(row);
  } else if (readOnly && (tab === 'opening' || tab === 'received' || tab === 'balance')) {
    computed = row[tab];
  }

  const cellFrame = (selected: boolean) => ({
    height: CELL_HEIGHT,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primary : 'transparent',
    backgroundColor: selected ? theme.colors.surface : theme.colors.surfaceMuted,
  });

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: modified ? theme.colors.primaryMuted : theme.colors.surface,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          marginBottom: CELL_GAP,
          gap: theme.spacing.sm,
        },
      ]}>
      <AppText variant="label" numberOfLines={2} style={styles.name}>
        {item.name}
      </AppText>

      {tab === 'amount' ? (
        readOnly ? (
          <AppText
            variant="label"
            color={row.amountRs > 0 ? 'primary' : 'textTertiary'}
            style={[styles.centerText, { width: AMOUNT_INPUT_WIDTH }]}>
            {row.amountRs > 0 ? row.amountRs.toLocaleString('en-IN') : '·'}
          </AppText>
        ) : (
          <Pressable
            onPress={() => onCellPress?.(item, 'amount', null)}
            accessibilityRole="button"
            accessibilityLabel={`Sale amount for ${item.name}, currently ${row.amountRs}`}
            style={[styles.cell, { width: AMOUNT_INPUT_WIDTH }, cellFrame(selectedCell === 'amount')]}>
            <AppText variant="label" color={row.amountRs > 0 ? 'primary' : 'textTertiary'}>
              {row.amountRs > 0 ? row.amountRs.toLocaleString('en-IN') : '·'}
            </AppText>
          </Pressable>
        )
      ) : (
        <View style={[styles.cells, { gap: CELL_GAP }]}>
          {BOTTLE_SIZES.map((size) => {
            if (editableField) {
              const value = row[editableField][size];
              return (
                <Pressable
                  key={size}
                  onPress={() => onCellPress?.(item, editableField, size)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} ${editableField} ${size} ml, currently ${value}`}
                  style={[styles.cell, { width: CELL_WIDTH }, cellFrame(selectedCell === size)]}>
                  <AppText variant="label" color={value > 0 ? 'textPrimary' : 'textTertiary'}>
                    {value > 0 ? String(value) : '·'}
                  </AppText>
                </Pressable>
              );
            }
            const value = computed ? computed[size] : 0;
            return (
              <View key={size} style={[styles.cell, { width: CELL_WIDTH, height: CELL_HEIGHT }]}>
                <AppText
                  variant="label"
                  color={value > 0 ? (tab === 'sale' ? 'primary' : 'textPrimary') : 'textTertiary'}>
                  {value > 0 ? String(value) : '·'}
                </AppText>
              </View>
            );
          })}
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
    alignItems: 'center',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
