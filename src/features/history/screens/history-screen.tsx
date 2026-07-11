import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHistoryStore } from '../store/history-store';

import { container } from '@/core/di/container';
import type { InventorySession } from '@/domain/models';
import { Screen } from '@/shared/components/layouts/screen';
import { AppCard, AppText, EmptyState } from '@/shared/components/ui';
import { formatDateTime } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

const SOURCE_LABEL: Record<InventorySession['source'], string> = {
  manual: 'Manual count',
  scan: 'Scanned sheet',
};

export function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const status = useHistoryStore((state) => state.status);
  const sessions = useHistoryStore((state) => state.sessions);
  const load = useHistoryStore((state) => state.load);

  // Refresh whenever the tab regains focus (new sessions may have been saved).
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

        {status === 'ready' && sessions.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No counts yet"
            message="Complete a manual count or scan a sheet — every saved session appears here."
            actionLabel="Start counting"
            onAction={() => router.navigate('/(tabs)/inventory')}
          />
        ) : (
          sessions.map((session) => {
            const totalUnits = session.entries.reduce((sum, entry) => sum + entry.quantity, 0);
            return (
              <AppCard
                key={session.id}
                onPress={() =>
                  router.push({ pathname: '/session/[id]', params: { id: session.id } })
                }
                accessibilityLabel={`Session from ${formatDateTime(session.completedAt ?? session.startedAt)}`}>
                <View style={[styles.row, { gap: theme.spacing.md }]}>
                  <View
                    style={[
                      styles.iconBubble,
                      { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.full },
                    ]}>
                    <Ionicons
                      name={session.source === 'scan' ? 'scan-outline' : 'create-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.rowInfo}>
                    <AppText variant="bodyStrong">
                      {formatDateTime(session.completedAt ?? session.startedAt)}
                    </AppText>
                    <AppText variant="caption" color="textSecondary">
                      {SOURCE_LABEL[session.source]} · {session.entries.length} SKUs · {totalUnits} bottles
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
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
});
