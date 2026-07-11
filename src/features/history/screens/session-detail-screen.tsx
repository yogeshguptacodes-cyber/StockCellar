import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHistoryStore } from '../store/history-store';

import { container } from '@/core/di/container';
import { formatBottleSize, summarizeSession } from '@/domain/models';
import { useInventoryStore } from '@/features/inventory/store/inventory-store';
import { Screen } from '@/shared/components/layouts/screen';
import { AppButton, AppCard, AppText, EmptyState } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { formatDateTime } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

export function SessionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const sessions = useHistoryStore((state) => state.sessions);
  const loadHistory = useHistoryStore((state) => state.load);
  const catalog = useInventoryStore((state) => state.catalog);
  const categories = useInventoryStore((state) => state.categories);
  const initializeInventory = useInventoryStore((state) => state.initialize);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void loadHistory();
    void initializeInventory();
  }, [loadHistory, initializeInventory]);

  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);
  const bottleById = useMemo(() => new Map(catalog.map((b) => [b.id, b])), [catalog]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const summary = useMemo(
    () => (session ? summarizeSession(session, bottleById) : null),
    [session, bottleById],
  );

  const handleExport = useCallback(async () => {
    if (!session) {
      return;
    }
    setExporting(true);
    try {
      const result = await container.exportService.exportSession(session, bottleById, categoryById);
      container.analytics.track({
        name: 'excel_exported',
        payload: { sessionId: session.id, rowCount: result.rowCount },
      });
      showSnackbar({ message: `Exported ${result.fileName} (mock)` });
    } catch {
      showSnackbar({ message: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  }, [session, bottleById, categoryById, showSnackbar]);

  const handleDelete = useCallback(async () => {
    if (!session) {
      return;
    }
    await useHistoryStore.getState().remove(session.id);
    showSnackbar({ message: 'Session deleted' });
    router.back();
  }, [session, router, showSnackbar]);

  if (!session || !summary) {
    return (
      <Screen>
        <EmptyState
          icon="alert-circle-outline"
          title="Session not found"
          message="It may have been deleted."
          actionLabel="Back to history"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: theme.spacing.lg, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="title">
            {formatDateTime(session.completedAt ?? session.startedAt)}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {session.source === 'scan' ? 'Scanned sheet' : 'Manual count'}
          </AppText>
        </View>

        <View style={[styles.statsRow, { gap: theme.spacing.md }]}>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {summary.totalSkus}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              SKUs counted
            </AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {summary.totalUnits}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Total bottles
            </AppText>
          </AppCard>
        </View>

        <View style={[styles.actions, { gap: theme.spacing.md }]}>
          <AppButton
            label="Export to Excel"
            icon="download-outline"
            onPress={() => void handleExport()}
            loading={exporting}
            style={styles.actionButton}
          />
          <AppButton
            label="Delete"
            icon="trash-outline"
            variant="danger"
            onPress={() => void handleDelete()}
            style={styles.actionButton}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <AppText variant="subtitle">Entries</AppText>
          {session.entries.map((entry) => {
            const bottle = bottleById.get(entry.bottleId);
            return (
              <View
                key={entry.bottleId}
                style={[
                  styles.entryRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    gap: theme.spacing.md,
                  },
                ]}>
                <View style={styles.entryInfo}>
                  <AppText variant="label" numberOfLines={1}>
                    {bottle ? `${bottle.brand} ${bottle.name}` : entry.bottleId}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {bottle ? formatBottleSize(bottle.sizeMl) : '—'}
                  </AppText>
                </View>
                <AppText variant="bodyStrong" color="primary">
                  ×{entry.quantity}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
  },
});
