import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHistoryStore } from '../store/history-store';

import { container } from '@/core/di/container';
import { summarizeRegister } from '@/domain/models';
import { Screen } from '@/shared/components/layouts/screen';
import { AppCard, AppText, EmptyState } from '@/shared/components/ui';
import { formatRupees } from '@/shared/utils/format-currency';
import { formatDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

export function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const status = useHistoryStore((state) => state.status);
  const registers = useHistoryStore((state) => state.registers);
  const load = useHistoryStore((state) => state.load);

  // Refresh whenever the tab regains focus (new registers may have been saved).
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    container.analytics.track({ name: 'history_viewed' });
  }, []);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.md, paddingTop: theme.spacing.md }}>
        <AppText variant="headline">History</AppText>

        {status === 'ready' && registers.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No registers yet"
            message="Save a daily register — every completed sheet appears here."
            actionLabel="Start a register"
            onAction={() => router.navigate('/(tabs)/inventory')}
          />
        ) : (
          registers.map((register) => {
            const summary = summarizeRegister(register);
            return (
              <AppCard
                key={register.id}
                onPress={() =>
                  router.push({ pathname: '/register/[id]', params: { id: register.id } })
                }
                accessibilityLabel={`Register from ${formatDate(register.date)}`}>
                <View style={[styles.row, { gap: theme.spacing.md }]}>
                  <View
                    style={[
                      styles.iconBubble,
                      { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.full },
                    ]}>
                    <Ionicons name="reader-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.rowInfo}>
                    <AppText variant="bodyStrong">{formatDate(register.date)}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {register.barName} · {summary.rowCount} items · {summary.saleUnits} sold
                    </AppText>
                  </View>
                  <View style={styles.amountBlock}>
                    <AppText variant="bodyStrong" color="primary">
                      {formatRupees(summary.totalAmountRs)}
                    </AppText>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                  </View>
                </View>
              </AppCard>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  iconBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
