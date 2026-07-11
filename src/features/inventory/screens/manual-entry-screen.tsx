import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottleRow } from '../components/bottle-row';
import { useInventoryStore } from '../store/inventory-store';

import { container } from '@/core/di/container';
import { isAppError } from '@/core/errors';
import type { Bottle } from '@/domain/models';
import { AppButton, AppChip, AppText, EmptyState, SearchInput } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { useTheme } from '@/theme';

const SEARCH_ANALYTICS_DEBOUNCE_MS = 700;

/**
 * The heart of the app: sticky search + category filters over the catalog,
 * with per-row steppers, modified-row highlighting, undo, reset, and save.
 */
export function ManualEntryScreen() {
  const theme = useTheme();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const status = useInventoryStore((state) => state.status);
  const catalog = useInventoryStore((state) => state.catalog);
  const categories = useInventoryStore((state) => state.categories);
  const quantities = useInventoryStore((state) => state.quantities);
  const touched = useInventoryStore((state) => state.touched);
  const undoDepth = useInventoryStore((state) => state.undoStack.length);
  const saving = useInventoryStore((state) => state.saving);
  const initialize = useInventoryStore((state) => state.initialize);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

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
    return catalog.filter((bottle) => {
      if (categoryId && bottle.categoryId !== categoryId) {
        return false;
      }
      if (needle.length === 0) {
        return true;
      }
      return (
        bottle.name.toLowerCase().includes(needle) || bottle.brand.toLowerCase().includes(needle)
      );
    });
  }, [catalog, query, categoryId]);

  const touchedCount = useMemo(
    () => Object.values(quantities).filter((quantity) => quantity > 0).length,
    [quantities],
  );

  // Stable callbacks via getState() so BottleRow memoization holds.
  const handleAdjust = useCallback((bottleId: string, delta: number) => {
    useInventoryStore.getState().adjustQuantity(bottleId, delta);
  }, []);
  const handleSet = useCallback((bottleId: string, quantity: number) => {
    useInventoryStore.getState().setQuantity(bottleId, quantity);
  }, []);
  const handleUndo = useCallback(() => {
    useInventoryStore.getState().undo();
  }, []);

  const handleReset = useCallback(() => {
    const cleared = touchedCount;
    useInventoryStore.getState().resetAll();
    showSnackbar({
      message: `Cleared ${cleared} item${cleared === 1 ? '' : 's'}`,
      actionLabel: 'Undo',
      onAction: () => useInventoryStore.getState().undo(),
    });
  }, [touchedCount, showSnackbar]);

  const handleSave = useCallback(async () => {
    try {
      const session = await useInventoryStore.getState().completeSession('manual');
      if (session) {
        showSnackbar({ message: `Saved ${session.entries.length} items to history` });
      }
    } catch (error) {
      showSnackbar({
        message: isAppError(error) ? error.message : 'Could not save the session',
      });
    }
  }, [showSnackbar]);

  const renderItem = useCallback(
    ({ item }: { item: Bottle }) => (
      <BottleRow
        bottle={item}
        quantity={quantities[item.id] ?? 0}
        modified={touched[item.id] === true && (quantities[item.id] ?? 0) > 0}
        onAdjust={handleAdjust}
        onSet={handleSet}
      />
    ),
    [quantities, touched, handleAdjust, handleSet],
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
          message="Something went wrong while loading your bottle catalog."
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
        {/* Sticky header: title, search, filters, session toolbar */}
        <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
          <AppText variant="headline">Inventory count</AppText>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Search bottles or brands" />
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

          <View style={[styles.toolbar, { gap: theme.spacing.sm }]}>
            <AppText variant="label" color="textSecondary" style={styles.toolbarCount}>
              {touchedCount > 0 ? `${touchedCount} counted` : 'No items counted yet'}
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
        </View>

        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          extraData={quantities}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: theme.spacing.huge }}
          ListEmptyComponent={
            <EmptyState
              icon="wine-outline"
              title="No bottles match"
              message="Try a different search term or category filter."
            />
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
});
