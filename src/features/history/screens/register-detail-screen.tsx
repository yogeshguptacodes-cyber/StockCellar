import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, Download, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useHistoryStore } from '../store/history-store';

import { container } from '@/core/di/container';
import { summarizeRegister } from '@/domain/models';
import { RegisterRow } from '@/features/inventory/components/register-row';
import { SizeHeader } from '@/features/inventory/components/size-header';
import { useRegisterStore } from '@/features/inventory/store/register-store';
import { REGISTER_TABS, type RegisterTab } from '@/features/inventory/types';
import { Screen } from '@/shared/components/layouts/screen';
import { AppButton, AppCard, AppChip, AppText, EmptyState } from '@/shared/components/ui';
import { useUiStore } from '@/shared/store/ui-store';
import { formatRupees } from '@/shared/utils/format-currency';
import { formatDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

/** Read-only viewer for a saved register — the digital copy of the sheet. */
export function RegisterDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const showSnackbar = useUiStore((state) => state.showSnackbar);

  const registers = useHistoryStore((state) => state.registers);
  const loadHistory = useHistoryStore((state) => state.load);
  const catalog = useRegisterStore((state) => state.catalog);
  const initializeCatalog = useRegisterStore((state) => state.initialize);

  const [tab, setTab] = useState<RegisterTab>('sale');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void loadHistory();
    void initializeCatalog();
  }, [loadHistory, initializeCatalog]);

  const register = useMemo(() => registers.find((r) => r.id === id), [registers, id]);
  const itemById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const summary = useMemo(() => (register ? summarizeRegister(register) : null), [register]);

  const handleExport = useCallback(async () => {
    if (!register) {
      return;
    }
    setExporting(true);
    try {
      const result = await container.exportService.exportRegister(register, itemById);
      container.analytics.track({
        name: 'excel_exported',
        payload: { registerId: register.id, rowCount: result.rowCount },
      });
      showSnackbar({ message: `Exported ${result.fileName} (mock)` });
    } catch {
      showSnackbar({ message: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  }, [register, itemById, showSnackbar]);

  const handleDelete = useCallback(async () => {
    if (!register) {
      return;
    }
    await useHistoryStore.getState().remove(register.id);
    showSnackbar({ message: 'Register deleted' });
    router.back();
  }, [register, router, showSnackbar]);

  if (!register || !summary) {
    return (
      <Screen>
        <EmptyState
          icon={AlertCircle}
          title="Register not found"
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
        <View style={{ gap: theme.spacing.xxs }}>
          <AppText variant="title">{formatDate(register.date)}</AppText>
          <AppText variant="caption" color="textSecondary">
            {register.barName} · saved register
          </AppText>
        </View>

        {/* Summary tiles */}
        <View style={[styles.statsRow, { gap: theme.spacing.md }]}>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {summary.rowCount}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Items
            </AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {summary.saleUnits}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Bottles sold
            </AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {formatRupees(summary.totalAmountRs)}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Sale amount
            </AppText>
          </AppCard>
        </View>

        <View style={[styles.actions, { gap: theme.spacing.md }]}>
          <AppButton
            label="Export"
            icon={Download}
            onPress={() => void handleExport()}
            loading={exporting}
            style={styles.actionButton}
          />
          <AppButton
            label="Delete"
            icon={Trash2}
            variant="danger"
            onPress={() => void handleDelete()}
            style={styles.actionButton}
          />
        </View>

        {/* Ledger viewer */}
        <View style={{ gap: theme.spacing.sm }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chipRow, { gap: theme.spacing.sm }]}>
              {REGISTER_TABS.map((t) => (
                <AppChip key={t.key} label={t.label} selected={tab === t.key} onPress={() => setTab(t.key)} />
              ))}
            </View>
          </ScrollView>

          <SizeHeader tab={tab} />
          {register.rows.map((row) => {
            const item = itemById.get(row.itemId);
            if (!item) {
              return null;
            }
            return (
              <RegisterRow
                key={row.itemId}
                item={item}
                tab={tab}
                draft={row}
                modified={false}
                readOnly
              />
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
  chipRow: {
    flexDirection: 'row',
  },
});
