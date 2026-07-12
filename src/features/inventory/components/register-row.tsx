import { memo, useCallback, useState } from 'react';
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
const CELL_HEIGHT = 34;

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

interface EditableCellProps {
  value: number;
  width: number;
  maxLength: number;
  accessibilityLabel: string;
  emphasize?: boolean;
  onCommit: (value: number) => void;
}

/** One numeric grid cell with a focus ring — quiet at rest, obvious when active. */
const EditableCell = memo(function EditableCell({
  value,
  width,
  maxLength,
  accessibilityLabel,
  emphasize = false,
  onCommit,
}: EditableCellProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      value={value === 0 ? '' : String(value)}
      onChangeText={(text) => onCommit(parseDigits(text))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="·"
      placeholderTextColor={theme.colors.textTertiary}
      keyboardType="number-pad"
      selectTextOnFocus
      maxLength={maxLength}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.cellText,
        theme.typography.label,
        {
          width,
          height: CELL_HEIGHT,
          borderRadius: theme.radius.xs,
          borderWidth: 1,
          borderColor: focused ? theme.colors.primary : 'transparent',
          backgroundColor: focused ? theme.colors.surface : theme.colors.surfaceMuted,
          color:
            value > 0
              ? emphasize
                ? theme.colors.primary
                : theme.colors.textPrimary
              : theme.colors.textTertiary,
        },
      ]}
    />
  );
});

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

  const handleAmountCommit = useCallback(
    (value: number) => onSetAmount?.(item.id, value),
    [item.id, onSetAmount],
  );

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
          <EditableCell
            value={row.amountRs}
            width={AMOUNT_INPUT_WIDTH}
            maxLength={8}
            accessibilityLabel={`Sale amount for ${item.name}`}
            emphasize
            onCommit={handleAmountCommit}
          />
        )
      ) : (
        <View style={[styles.cells, { gap: CELL_GAP }]}>
          {BOTTLE_SIZES.map((size) => {
            if (editableField) {
              return (
                <EditableCell
                  key={size}
                  value={row[editableField][size]}
                  width={CELL_WIDTH}
                  maxLength={4}
                  accessibilityLabel={`${item.name} ${editableField} ${size} ml`}
                  onCommit={(value) => onSetCell?.(item.id, editableField, size, value)}
                />
              );
            }
            const value = computed ? computed[size] : 0;
            return (
              <View key={size} style={[styles.computedCell, { width: CELL_WIDTH, height: CELL_HEIGHT }]}>
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
