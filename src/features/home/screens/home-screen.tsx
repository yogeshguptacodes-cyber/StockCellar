import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHistoryStore } from '@/features/history/store/history-store';
import { useInventoryStore } from '@/features/inventory/store/inventory-store';
import { Screen } from '@/shared/components/layouts/screen';
import { AppButton, AppCard, AppText } from '@/shared/components/ui';
import { formatDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const catalog = useInventoryStore((state) => state.catalog);
  const initializeInventory = useInventoryStore((state) => state.initialize);
  const sessions = useHistoryStore((state) => state.sessions);
  const loadHistory = useHistoryStore((state) => state.load);

  useEffect(() => {
    void initializeInventory();
    void loadHistory();
  }, [initializeInventory, loadHistory]);

  const lastSession = sessions[0];
  const stats = useMemo(
    () => [
      { label: 'Bottles in catalog', value: String(catalog.length) },
      { label: 'Counts saved', value: String(sessions.length) },
      {
        label: 'Last count',
        value: lastSession ? formatDate(lastSession.completedAt ?? lastSession.startedAt) : '—',
      },
    ],
    [catalog.length, sessions.length, lastSession],
  );

  return (
    <Screen>
      <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <AppText variant="headline">StockCellar</AppText>
          <AppText variant="body" color="textSecondary">
            Your cellar, counted and under control.
          </AppText>
        </View>

        <View style={[styles.statsRow, { gap: theme.spacing.md }]}>
          {stats.map((stat) => (
            <AppCard key={stat.label} style={styles.statCard}>
              <AppText variant="title" color="primary">
                {stat.value}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {stat.label}
              </AppText>
            </AppCard>
          ))}
        </View>

        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="subtitle">Quick actions</AppText>
          <AppButton
            label="Start manual count"
            icon="create-outline"
            size="lg"
            fullWidth
            onPress={() => router.navigate('/(tabs)/inventory')}
          />
          <AppButton
            label="Scan inventory sheet"
            icon="scan-outline"
            size="lg"
            variant="secondary"
            fullWidth
            onPress={() => router.navigate('/(tabs)/scanner')}
          />
          <AppButton
            label="View history"
            icon="time-outline"
            size="lg"
            variant="secondary"
            fullWidth
            onPress={() => router.navigate('/(tabs)/history')}
          />
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
});
