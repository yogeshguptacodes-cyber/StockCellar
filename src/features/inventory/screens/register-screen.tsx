import { FlashList } from '@shopify/flash-list';
import { Check, ChevronDown, ChevronRight, CloudOff, RotateCcw, Undo2, Wine } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuantityPad, type QuantityPadTarget } from '../components/quantity-pad';
import { RegisterRow } from '../components/register-row';
import { SizeHeader } from '../components/size-header';
import { DEFAULT_BAR_NAME, useRegisterStore } from '../store/register-store';
import { REGISTER_TABS, type RegisterTab } from '../types';

import { container } from '@/core/di/container';
import { isAppError } from '@/core/errors';
import {
  BOTTLE_SIZES,
  rowBalance,
  rowTotal,
  type BottleSize,
  type Category,
  type EditableStockField,
  type LiquorItem,
  type SizeQuantities,
} from '@/domain/models';
import {
  AppChip,
  AppText,
  EmptyState,
  Fab,
  IconButton,
  SearchInput,
  Skeleton,
} from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { formatRupees } from '@/shared/utils/format-currency';
import { formatDate, toIsoDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

const SEARCH_ANALYTICS_DEBOUNCE_MS = 700;
const SKELETON_ROWS = 9;

/** Flat list model: category headers interleaved with item rows. */
type ListEntry =
  | { readonly kind: 'header'; readonly category: Category; readonly count: number; readonly collapsed: boolean }
  | { readonly kind: 'item'; readonly item: LiquorItem };

function RegisterSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm, paddingTop: theme.spacing.md }}>
      <Skeleton width={140} height={28} />
      <Skeleton height={44} radius={theme.radius.md} />
      <Skeleton width={260} height={30} radius={theme.radius.full} />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <Skeleton key={index} height={42} radius={theme.radius.sm} />
      ))}
    </View>
  );
}

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
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [selection, setSelection] = useState<QuantityPadTarget | null>(null);

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

  const searching = query.trim().length > 0;

  /** Grouped list: category header + rows; searching expands everything. */
  const listData = useMemo<ListEntry[]>(() => {
    const needle = query.trim().toLowerCase();
    const entries: ListEntry[] = [];
    for (const category of categories) {
      if (categoryId && category.id !== categoryId) {
        continue;
      }
      const items = catalog.filter(
        (item) =>
          item.categoryId === category.id &&
          (needle.length === 0 || item.name.toLowerCase().includes(needle)),
      );
      if (items.length === 0) {
        continue;
      }
      const isCollapsed = !searching && collapsed.has(category.id);
      entries.push({ kind: 'header', category, count: items.length, collapsed: isCollapsed });
      if (!isCollapsed) {
        for (const item of items) {
          entries.push({ kind: 'item', item });
        }
      }
    }
    return entries;
  }, [catalog, categories, query, categoryId, collapsed, searching]);

  const touchedCount = useMemo(() => Object.keys(touched).length, [touched]);

  /** Live draft summary for the sticky bar. */
  const draftSummary = useMemo(() => {
    let saleUnits = 0;
    let amountRs = 0;
    for (const row of Object.values(rows)) {
      for (const size of BOTTLE_SIZES) {
        saleUnits += row.sale[size];
      }
      amountRs += row.amountRs;
    }
    return { saleUnits, amountRs };
  }, [rows]);

  /** Sheet-style TOTAL row for the active tab (across ALL items, like the paper). */
  const columnTotals = useMemo(() => {
    if (tab === 'amount') {
      return { sizes: null, amount: draftSummary.amountRs };
    }
    const totals = { 1000: 0, 750: 0, 180: 0, 90: 0, 60: 0, 30: 0 } as Record<BottleSize, number>;
    for (const row of Object.values(rows)) {
      let quantities: SizeQuantities;
      if (tab === 'total') {
        quantities = rowTotal(row);
      } else if (tab === 'balance') {
        quantities = rowBalance(row);
      } else {
        quantities = row[tab];
      }
      for (const size of BOTTLE_SIZES) {
        totals[size] += quantities[size];
      }
    }
    return { sizes: totals, amount: null };
  }, [rows, tab, draftSummary.amountRs]);

  /** Ordered items currently visible — drives the pad's Prev/Next walk. */
  const visibleItems = useMemo(
    () => listData.filter((entry) => entry.kind === 'item').map((entry) => entry.item),
    [listData],
  );

  // Stable callback so RegisterRow memoization holds.
  const handleCellPress = useCallback(
    (item: LiquorItem, field: EditableStockField | 'amount', size: BottleSize | null) => {
      setSelection({ itemId: item.id, itemName: item.name, field, size });
    },
    [],
  );

  const selectionValue = useMemo(() => {
    if (!selection) {
      return 0;
    }
    const row = rows[selection.itemId];
    if (!row) {
      return 0;
    }
    if (selection.field === 'amount') {
      return row.amountRs;
    }
    return selection.size !== null ? row[selection.field][selection.size] : 0;
  }, [selection, rows]);

  const handlePadSet = useCallback(
    (value: number) => {
      if (!selection) {
        return;
      }
      const store = useRegisterStore.getState();
      if (selection.field === 'amount') {
        store.setAmount(selection.itemId, value);
      } else if (selection.size !== null) {
        store.setCell(selection.itemId, selection.field, selection.size, value);
      }
    },
    [selection],
  );

  const handlePadStep = useCallback(
    (delta: number) => {
      if (!selection) {
        return;
      }
      const store = useRegisterStore.getState();
      const row = store.rows[selection.itemId];
      if (selection.field === 'amount') {
        store.setAmount(selection.itemId, (row?.amountRs ?? 0) + delta);
      } else if (selection.size !== null) {
        const current = row?.[selection.field][selection.size] ?? 0;
        store.setCell(selection.itemId, selection.field, selection.size, current + delta);
      }
    },
    [selection],
  );

  const selectionIndex = useMemo(
    () => (selection ? visibleItems.findIndex((item) => item.id === selection.itemId) : -1),
    [selection, visibleItems],
  );

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (!selection || selectionIndex < 0) {
        return;
      }
      const next = visibleItems[selectionIndex + direction];
      if (next) {
        setSelection({ ...selection, itemId: next.id, itemName: next.name });
      }
    },
    [selection, selectionIndex, visibleItems],
  );

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

  const toggleCategory = useCallback((id: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderItem = useCallback(
    ({ item: entry }: { item: ListEntry }) => {
      if (entry.kind === 'header') {
        const Chevron = entry.collapsed ? ChevronRight : ChevronDown;
        return (
          <Pressable
            onPress={() => toggleCategory(entry.category.id)}
            accessibilityRole="button"
            accessibilityLabel={`${entry.category.name}, ${entry.count} items, ${entry.collapsed ? 'collapsed' : 'expanded'}`}
            style={[styles.sectionHeader, { paddingVertical: theme.spacing.sm, gap: theme.spacing.xs }]}>
            <Chevron size={15} color={theme.colors.textTertiary} strokeWidth={2} />
            <AppText variant="caption" color="textSecondary" style={styles.sectionTitle}>
              {entry.category.name.toUpperCase()}
            </AppText>
            <AppText variant="caption" color="textTertiary">
              {entry.count}
            </AppText>
          </Pressable>
        );
      }
      return (
        <RegisterRow
          item={entry.item}
          tab={tab}
          draft={rows[entry.item.id]}
          modified={touched[entry.item.id] === true}
          selectedCell={
            selection?.itemId === entry.item.id
              ? selection.field === 'amount'
                ? 'amount'
                : selection.size
              : null
          }
          onCellPress={handleCellPress}
        />
      );
    },
    [rows, touched, tab, selection, handleCellPress, toggleCategory, theme],
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.content,
            { maxWidth: theme.layout.maxContentWidth, paddingHorizontal: theme.layout.screenPaddingHorizontal },
          ]}>
          <RegisterSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon={CloudOff}
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
        {/* Sticky header: title, search, filters, ledger tabs, summary */}
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
                <AppChip
                  key={t.key}
                  label={t.label}
                  selected={tab === t.key}
                  onPress={() => {
                    setTab(t.key);
                    setSelection(null);
                  }}
                />
              ))}
            </View>
          </ScrollView>

          {/* Sticky live summary */}
          <View
            style={[
              styles.summaryBar,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                gap: theme.spacing.sm,
              },
            ]}>
            <View style={styles.summaryText}>
              <AppText variant="caption" color="textSecondary">
                {tab === 'total' || tab === 'balance'
                  ? 'Calculated automatically'
                  : touchedCount > 0
                    ? `${touchedCount} rows · ${draftSummary.saleUnits} sold · ${formatRupees(draftSummary.amountRs)}`
                    : 'Fill in today’s counts'}
              </AppText>
            </View>
            <IconButton icon={Undo2} label="Undo last change" onPress={handleUndo} disabled={undoDepth === 0} />
            <IconButton icon={RotateCcw} label="Reset all rows" onPress={handleReset} disabled={touchedCount === 0} />
          </View>

          <SizeHeader tab={tab} />
        </View>

        <FlashList
          data={listData}
          renderItem={renderItem}
          keyExtractor={(entry) => (entry.kind === 'header' ? `h-${entry.category.id}` : entry.item.id)}
          getItemType={(entry) => entry.kind}
          extraData={[rows, touched, tab, selection]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: selection ? 260 : 120 }}
          ListEmptyComponent={
            <EmptyState
              icon={Wine}
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
                  {formatRupees(columnTotals.amount ?? 0)}
                </AppText>
              )}
            </View>
          }
        />
      </View>

      {/* Quantity pad — owns all cell editing; no OS keyboard needed */}
      {selection ? (
        <View
          style={[
            styles.padContainer,
            { bottom: theme.spacing.md, left: theme.spacing.lg, right: theme.spacing.lg },
          ]}>
          <QuantityPad
            target={selection}
            value={selectionValue}
            onSet={handlePadSet}
            onStep={handlePadStep}
            onPrev={() => moveSelection(-1)}
            onNext={() => moveSelection(1)}
            hasPrev={selectionIndex > 0}
            hasNext={selectionIndex >= 0 && selectionIndex < visibleItems.length - 1}
            onClose={() => setSelection(null)}
          />
        </View>
      ) : null}

      {/* Floating save — appears only when there is something to save */}
      {touchedCount > 0 && !selection ? (
        <View style={[styles.fabContainer, { bottom: theme.spacing.lg, right: theme.spacing.lg }]}>
          <Fab icon={Check} label="Save register" onPress={() => void handleSave()} loading={saving} />
        </View>
      ) : null}
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
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    letterSpacing: 1,
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
  fabContainer: {
    position: 'absolute',
  },
  padContainer: {
    position: 'absolute',
  },
});
