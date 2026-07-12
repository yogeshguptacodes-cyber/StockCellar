import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import {
  ChevronRight,
  ClipboardList,
  History,
  ScanLine,
  Settings,
  SquarePen,
  Wine,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { summarizeRegister } from '@/domain/models';
import { useHistoryStore } from '@/features/history/store/history-store';
import { DEFAULT_BAR_NAME, useRegisterStore } from '@/features/inventory/store/register-store';
import { Screen } from '@/shared/components/layouts/screen';
import { AppCard, AppText } from '@/shared/components/ui';
import { formatRupees } from '@/shared/utils/format-currency';
import { formatDate } from '@/shared/utils/format-date';
import { palette, useTheme } from '@/theme';

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
  readonly icon: LucideIcon;
  readonly label: string;
  readonly hint: string;
  readonly href: Href;
}

const QUICK_ACTIONS: readonly QuickAction[] = [
  { icon: SquarePen, label: 'New register', hint: 'Fill today’s counts', href: '/(tabs)/inventory' },
  { icon: ScanLine, label: 'Scan sheet', hint: 'Photo → auto-fill', href: '/(tabs)/scanner' },
  { icon: History, label: 'History', hint: 'Past registers', href: '/(tabs)/history' },
  { icon: Settings, label: 'Settings', hint: 'Theme & more', href: '/(tabs)/settings' },
];

const RECENT_ACTIVITY_LIMIT = 3;
const STAGGER_MS = 60;

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
  const recent = useMemo(() => registers.slice(0, RECENT_ACTIVITY_LIMIT), [registers]);

  return (
    <Screen>
      <View style={{ gap: theme.spacing.xl, paddingTop: theme.spacing.md }}>
        {/* Greeting */}
        <Animated.View
          entering={FadeInDown.duration(theme.motion.duration.normal)}
          style={{ gap: theme.spacing.xxs }}>
          <AppText variant="caption" color="textSecondary">
            {greeting()} · {DEFAULT_BAR_NAME}
          </AppText>
          <AppText variant="headline">StockCellar</AppText>
        </Animated.View>

        {/* Hero: last register performance */}
        <Animated.View entering={FadeInDown.delay(STAGGER_MS).duration(theme.motion.duration.normal)}>
          <LinearGradient
            colors={[palette.wine600, palette.wine800]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderRadius: theme.radius.xl, padding: theme.spacing.xl }]}>
            <View style={{ gap: theme.spacing.xs }}>
              {lastRegister && lastSummary ? (
                <>
                  <AppText variant="caption" style={{ color: palette.wine200 }}>
                    LAST REGISTER · {formatDate(lastRegister.date).toUpperCase()}
                  </AppText>
                  <AppText variant="display" style={{ color: palette.neutral0 }}>
                    {formatRupees(lastSummary.totalAmountRs)}
                  </AppText>
                  <AppText variant="label" style={{ color: palette.wine200 }}>
                    {lastSummary.saleUnits} bottles sold · {lastSummary.rowCount} items
                  </AppText>
                </>
              ) : (
                <>
                  <AppText variant="caption" style={{ color: palette.wine200 }}>
                    WELCOME
                  </AppText>
                  <AppText variant="title" style={{ color: palette.neutral0 }}>
                    Start your first register
                  </AppText>
                  <AppText variant="label" style={{ color: palette.wine200 }}>
                    Fill counts by hand or scan the paper sheet.
                  </AppText>
                </>
              )}
            </View>
            <View style={styles.heroIcon}>
              <Wine size={64} color={palette.wine400} strokeWidth={1.2} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(STAGGER_MS * 2).duration(theme.motion.duration.normal)}
          style={[styles.statsRow, { gap: theme.spacing.md }]}>
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
        </Animated.View>

        {/* Quick actions */}
        <Animated.View
          entering={FadeInDown.delay(STAGGER_MS * 3).duration(theme.motion.duration.normal)}
          style={{ gap: theme.spacing.md }}>
          <AppText variant="subtitle">Quick actions</AppText>
          <View style={[styles.actionsGrid, { gap: theme.spacing.md }]}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <AppCard
                  key={action.label}
                  onPress={() => router.navigate(action.href)}
                  accessibilityLabel={action.label}
                  style={styles.actionCard}>
                  <View style={{ gap: theme.spacing.sm }}>
                    <View
                      style={[
                        styles.iconBubble,
                        { backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.md },
                      ]}>
                      <Icon size={19} color={theme.colors.primary} strokeWidth={2} />
                    </View>
                    <View>
                      <AppText variant="bodyStrong">{action.label}</AppText>
                      <AppText variant="caption" color="textSecondary">
                        {action.hint}
                      </AppText>
                    </View>
                  </View>
                </AppCard>
              );
            })}
          </View>
        </Animated.View>

        {/* Recent activity */}
        {recent.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(STAGGER_MS * 4).duration(theme.motion.duration.normal)}
            style={{ gap: theme.spacing.md }}>
            <AppText variant="subtitle">Recent activity</AppText>
            {recent.map((register) => {
              const summary = summarizeRegister(register);
              return (
                <AppCard
                  key={register.id}
                  onPress={() => router.push({ pathname: '/register/[id]', params: { id: register.id } })}
                  accessibilityLabel={`Register from ${formatDate(register.date)}`}
                  style={{ padding: theme.spacing.md }}>
                  <View style={[styles.activityRow, { gap: theme.spacing.md }]}>
                    <View
                      style={[
                        styles.iconBubble,
                        { backgroundColor: theme.colors.accentMuted, borderRadius: theme.radius.md },
                      ]}>
                      <ClipboardList size={18} color={theme.colors.accent} strokeWidth={2} />
                    </View>
                    <View style={styles.activityInfo}>
                      <AppText variant="label">{formatDate(register.date)}</AppText>
                      <AppText variant="caption" color="textSecondary">
                        {summary.rowCount} items · {summary.saleUnits} sold
                      </AppText>
                    </View>
                    <AppText variant="bodyStrong" color="primary">
                      {formatRupees(summary.totalAmountRs)}
                    </AppText>
                    <ChevronRight size={16} color={theme.colors.textTertiary} strokeWidth={2} />
                  </View>
                </AppCard>
              );
            })}
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroIcon: {
    marginLeft: 'auto',
    opacity: 0.5,
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
});
