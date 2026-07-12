import { memo, useCallback } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

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

export interface RegisterRowProps {
  item: LiquorItem;
  tab: RegisterTab;
  draft: DraftRow | undefined;
  modified: boolean;
  /** Viewer mode (history detail): render every cell as text. */
  readOnly?: boolean;
  onSetCell?: (itemId: string, field: EditableStockField, size: BottleSize, quantity: number) => void;
  onSetAmount?: (itemId: string, amountRs: number) => void;
}

function parseDigits(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');
  return digits === '' ? 0 : Number.parseInt(digits, 10);
}

/** One sheet row: item name + six size cells (or the amount field). Memoized. */
export const RegisterRow = memo(function RegisterRow({
  item,
  tab,
  draft,
  modified,
  readOnly = false,
  onSetCell,
  onSetAmount,
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

  const handleAmountChange = useCallback(
    (text: string) => onSetAmount?.(item.id, parseDigits(text)),
    [item.id, onSetAmount],
  );

  const cellBase = {
    width: CELL_WIDTH,
    height: 34,
    borderRadius: theme.radius.xs,
  };

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
            style={[styles.cellText, { width: AMOUNT_INPUT_WIDTH }]}>
            {row.amountRs > 0 ? row.amountRs.toLocaleString('en-IN') : '·'}
          </AppText>
        ) : (
          <TextInput
            value={row.amountRs === 0 ? '' : String(row.amountRs)}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="number-pad"
            selectTextOnFocus
            maxLength={8}
            accessibilityLabel={`Sale amount for ${item.name}`}
            style={[
              styles.cellText,
              theme.typography.label,
              {
                width: AMOUNT_INPUT_WIDTH,
                height: 34,
                borderRadius: theme.radius.xs,
                backgroundColor: theme.colors.surfaceMuted,
                color: row.amountRs > 0 ? theme.colors.primary : theme.colors.textTertiary,
              },
            ]}
          />
        )
      ) : (
        <View style={[styles.cells, { gap: CELL_GAP }]}>
          {BOTTLE_SIZES.map((size) => {
            if (editableField) {
              const value = row[editableField][size];
              return (
                <TextInput
                  key={size}
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(text) => onSetCell?.(item.id, editableField, size, parseDigits(text))}
                  placeholder="·"
                  placeholderTextColor={theme.colors.textTertiary}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={4}
                  accessibilityLabel={`${item.name} ${editableField} ${size} ml`}
                  style={[
                    styles.cellText,
                    theme.typography.label,
                    cellBase,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      color: value > 0 ? theme.colors.textPrimary : theme.colors.textTertiary,
                    },
                  ]}
                />
              );
            }
            const value = computed ? computed[size] : 0;
            return (
              <View key={size} style={[styles.computedCell, cellBase]}>
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
  cellText: {
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  computedCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
