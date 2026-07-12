import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { useHistoryStore } from '@/features/history/store/history-store';
import { DEFAULT_BAR_NAME, useRegisterStore } from '@/features/inventory/store/register-store';
import { summarizeRegister } from '@/domain/models';
import { Screen } from '@/shared/components/layouts/screen';
import { AppCard, AppText } from '@/shared/components/ui';
import { formatRupees } from '@/shared/utils/format-currency';
import { formatDate } from '@/shared/utils/format-date';
import { useTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

interface QuickAction {
  readonly icon: IconName;
  readonly label: string;
  readonly hint: string;
  readonly href: Href;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { icon: 'create-outline', label: 'New register', hint: 'Fill today’s counts', href: '/(tabs)/inventory' },
  { icon: 'scan-outline', label: 'Scan sheet', hint: 'Photo → auto-fill', href: '/(tabs)/scanner' },
  { icon: 'time-outline', label: 'History', hint: 'Past registers', href: '/(tabs)/history' },
  { icon: 'settings-outline', label: 'Settings', hint: 'Theme & more', href: '/(tabs)/settings' },
];

export function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const catalog = useRegisterStore((state) => state.catalog);
  const initialize = useRegisterStore((state) => state.initialize);
  const registers = useHistoryStore((state) => state.registers);
  const loadHistory = useHistoryStore((state) => state.load);

  useEffect(() => {
    void initialize();
    void loadHistory();
  }, [initialize, loadHistory]);

  const lastRegister = registers[0];
  const lastSummary = useMemo(
    () => (lastRegister ? summarizeRegister(lastRegister) : null),
    [lastRegister],
  );

  return (
    <Screen>
      <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.md }}>
        {/* Greeting */}
        <View style={{ gap: theme.spacing.xxs }}>
          <AppText variant="caption" color="textSecondary">
            {greeting()} · {DEFAULT_BAR_NAME}
          </AppText>
          <AppText variant="headline">StockCellar</AppText>
        </View>

        {/* Hero: last register performance */}
        <AppCard style={styles.heroCard}>
          <View style={[styles.heroAccent, { backgroundColor: theme.colors.accent }]} />
          <View style={[styles.heroBody, { padding: theme.spacing.lg, gap: theme.spacing.xs }]}>
            {lastRegister && lastSummary ? (
              <>
                <AppText variant="caption" color="textSecondary">
                  LAST REGISTER · {formatDate(lastRegister.date).toUpperCase()}
                </AppText>
                <AppText variant="display" color="primary">
                  {formatRupees(lastSummary.totalAmountRs)}
                </AppText>
                <AppText variant="label" color="textSecondary">
                  {lastSummary.saleUnits} bottles sold across {lastSummary.rowCount} items
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="caption" color="textSecondary">
                  NO REGISTERS YET
                </AppText>
                <AppText variant="title">Start your first count</AppText>
                <AppText variant="label" color="textSecondary">
                  Fill the register by hand or scan a paper sheet.
                </AppText>
              </>
            )}
          </View>
        </AppCard>

        {/* Stats */}
        <View style={[styles.statsRow, { gap: theme.spacing.md }]}>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {catalog.length}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Items in catalog
            </AppText>
          </AppCard>
          <AppCard style={styles.statCard}>
            <AppText variant="title" color="primary">
              {registers.length}
            </AppText>
            <AppText variant="caption" color="textSecondary">
              Registers saved
            </AppText>
          </AppCard>
        </View>

        {/* Quick actions */}
        <View style={{ gap: theme.spacing.md }}>
          <AppText variant="subtitle">Quick actions</AppText>
          <View style={[styles.actionsGrid, { gap: theme.spacing.md }]}>
            {QUICK_ACTIONS.map((action) => (
              <AppCard
                key={action.label}
                onPress={() => router.navigate(action.href)}
                accessibilityLabel={action.label}
                style={styles.actionCard}>
                <View style={{ gap: theme.spacing.sm }}>
                  <View
                    style={[
                      styles.iconBubble,
                      { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.full },
                    ]}>
                    <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
                  </View>
                  <View>
                    <AppText variant="bodyStrong">{action.label}</AppText>
                    <AppText variant="caption" color="textSecondary">
                      {action.hint}
                    </AppText>
                  </View>
                </View>
              </AppCard>
            ))}
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  heroAccent: {
    width: 4,
  },
  heroBody: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionCard: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  iconBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
