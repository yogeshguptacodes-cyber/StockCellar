import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RegisterRow } from '../components/register-row';
import { SizeHeader } from '../components/size-header';
import { DEFAULT_BAR_NAME, useRegisterStore } from '../store/register-store';
import { REGISTER_TABS, type RegisterTab } from '../types';

import { container } from '@/core/di/container';
import { isAppError } from '@/core/errors';
import {
  BOTTLE_SIZES,
  rowSale,
  rowTotal,
  type BottleSize,
  type LiquorItem,
  type SizeQuantities,
} from '@/domain/models';
import { AppButton, AppChip, AppText, EmptyState, SearchInput } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { formatDate, toIsoDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

const SEARCH_ANALYTICS_DEBOUNCE_MS = 700;

/**
 * The daily stock register — a digital twin of the paper sheet.
 * Tabs mirror the sheet's column groups; Total and Sale are always derived.
 */
export function RegisterScreen() {
  const theme = useTheme();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const status = useRegisterStore((state) => state.status);
  const catalog = useRegisterStore((state) => state.catalog);
  const categories = useRegisterStore((state) => state.categories);
  const rows = useRegisterStore((state) => state.rows);
  const touched = useRegisterStore((state) => state.touched);
  const undoDepth = useRegisterStore((state) => state.undoStack.length);
  const saving = useRegisterStore((state) => state.saving);
  const initialize = useRegisterStore((state) => state.initialize);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tab, setTab] = useState<RegisterTab>('opening');

  useEffect(() => {
    void initialize();
    container.analytics.track({ name: 'manual_entry_started' });
  }, [initialize]);

  // Debounced search analytics — never on every keystroke.
  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timer = setTimeout(() => {
      container.analytics.track({ name: 'bottle_search', payload: { query: query.trim() } });
    }, SEARCH_ANALYTICS_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (categoryId && item.categoryId !== categoryId) {
        return false;
      }
      return needle.length === 0 || item.name.toLowerCase().includes(needle);
    });
  }, [catalog, query, categoryId]);

  const touchedCount = useMemo(() => Object.keys(touched).length, [touched]);

  /** Sheet-style TOTAL row for the active tab (across ALL items, like the paper). */
  const columnTotals = useMemo(() => {
    if (tab === 'amount') {
      const amount = Object.values(rows).reduce((sum, row) => sum + row.amountRs, 0);
      return { sizes: null, amount };
    }
    const totals = { 1000: 0, 750: 0, 180: 0, 90: 0, 60: 0, 30: 0 } as Record<BottleSize, number>;
    for (const row of Object.values(rows)) {
      let quantities: SizeQuantities;
      if (tab === 'total') {
        quantities = rowTotal(row);
      } else if (tab === 'sale') {
        quantities = rowSale(row);
      } else {
        quantities = row[tab];
      }
      for (const size of BOTTLE_SIZES) {
        totals[size] += quantities[size];
      }
    }
    return { sizes: totals, amount: null };
  }, [rows, tab]);

  // Stable callbacks via getState() so RegisterRow memoization holds.
  const handleSetCell = useCallback(
    (itemId: string, field: 'opening' | 'received' | 'balance', size: BottleSize, quantity: number) => {
      useRegisterStore.getState().setCell(itemId, field, size, quantity);
    },
    [],
  );
  const handleSetAmount = useCallback((itemId: string, amountRs: number) => {
    useRegisterStore.getState().setAmount(itemId, amountRs);
  }, []);
  const handleUndo = useCallback(() => {
    useRegisterStore.getState().undo();
  }, []);

  const handleReset = useCallback(() => {
    const cleared = touchedCount;
    useRegisterStore.getState().resetAll();
    showSnackbar({
      message: `Cleared ${cleared} row${cleared === 1 ? '' : 's'}`,
      actionLabel: 'Undo',
      onAction: () => useRegisterStore.getState().undo(),
    });
  }, [touchedCount, showSnackbar]);

  const handleSave = useCallback(async () => {
    try {
      const register = await useRegisterStore.getState().saveRegister();
      if (register) {
        showSnackbar({ message: `Register saved — ${register.rows.length} items` });
      }
    } catch (error) {
      showSnackbar({
        message: isAppError(error) ? error.message : 'Could not save the register',
      });
    }
  }, [showSnackbar]);

  const renderItem = useCallback(
    ({ item }: { item: LiquorItem }) => (
      <RegisterRow
        item={item}
        tab={tab}
        draft={rows[item.id]}
        modified={touched[item.id] === true}
        onSetCell={handleSetCell}
        onSetAmount={handleSetAmount}
      />
    ),
    [rows, touched, tab, handleSetCell, handleSetAmount],
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load the catalog"
          message="Something went wrong while loading your liquor list."
          actionLabel="Retry"
          onAction={() => void initialize()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.content,
          { maxWidth: theme.layout.maxContentWidth, paddingHorizontal: theme.layout.screenPaddingHorizontal },
        ]}>
        {/* Sticky header: title, search, filters, ledger tabs, toolbar */}
        <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
          <View style={styles.titleRow}>
            <AppText variant="headline">Register</AppText>
            <AppText variant="caption" color="textSecondary">
              {DEFAULT_BAR_NAME} · {formatDate(toIsoDate(new Date()))}
            </AppText>
          </View>

          <SearchInput value={query} onChangeText={setQuery} placeholder="Search liquor" />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chipRow, { gap: theme.spacing.sm }]}>
              <AppChip label="All" selected={categoryId === null} onPress={() => setCategoryId(null)} />
              {categories.map((category) => (
                <AppChip
                  key={category.id}
                  label={category.name}
                  selected={categoryId === category.id}
                  onPress={() =>
                    setCategoryId((current) => (current === category.id ? null : category.id))
                  }
                />
              ))}
            </View>
          </ScrollView>

          {/* Ledger group tabs — the sheet's column groups */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chipRow, { gap: theme.spacing.sm }]}>
              {REGISTER_TABS.map((t) => (
                <AppChip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
              ))}
            </View>
          </ScrollView>

          <View style={[styles.toolbar, { gap: theme.spacing.sm }]}>
            <AppText variant="caption" color="textSecondary" style={styles.toolbarCount}>
              {tab === 'total' || tab === 'sale'
                ? 'Calculated automatically'
                : touchedCount > 0
                  ? `${touchedCount} rows edited`
                  : 'Fill in the counts'}
            </AppText>
            <AppButton
              label="Undo"
              icon="arrow-undo-outline"
              variant="ghost"
              size="sm"
              onPress={handleUndo}
              disabled={undoDepth === 0}
            />
            <AppButton
              label="Reset"
              variant="ghost"
              size="sm"
              onPress={handleReset}
              disabled={touchedCount === 0}
            />
            <AppButton
              label="Save"
              icon="checkmark"
              size="sm"
              onPress={() => void handleSave()}
              disabled={touchedCount === 0}
              loading={saving}
            />
          </View>

          <SizeHeader tab={tab} />
        </View>

        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          extraData={[rows, touched, tab]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
          ListEmptyComponent={
            <EmptyState
              icon="wine-outline"
              title="No items match"
              message="Try a different search term or category filter."
            />
          }
          ListFooterComponent={
            <View
              style={[
                styles.totalRow,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.sm,
                  marginTop: theme.spacing.xs,
                  gap: theme.spacing.sm,
                },
              ]}>
              <AppText variant="label" style={styles.totalLabel}>
                TOTAL
              </AppText>
              {columnTotals.sizes ? (
                <View style={[styles.totalCells, { gap: 4 }]}>
                  {BOTTLE_SIZES.map((size) => (
                    <AppText key={size} variant="label" color="primary" style={styles.totalCell}>
                      {columnTotals.sizes[size] > 0 ? String(columnTotals.sizes[size]) : '·'}
                    </AppText>
                  ))}
                </View>
              ) : (
                <AppText variant="bodyStrong" color="primary">
                  ₹ {columnTotals.amount?.toLocaleString('en-IN') ?? 0}
                </AppText>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarCount: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    flex: 1,
  },
  totalCells: {
    flexDirection: 'row',
  },
  totalCell: {
    width: 40,
    textAlign: 'center',
  },
});
