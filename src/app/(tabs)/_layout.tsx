import { Tabs } from 'expo-router';
import { History, House, ScanLine, Settings, SquarePen, type LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/theme';

interface TabConfig {
  readonly name: string;
  readonly title: string;
  readonly icon: LucideIcon;
}

const TABS: readonly TabConfig[] = [
  { name: 'index', title: 'Home', icon: House },
  { name: 'inventory', title: 'Register', icon: SquarePen },
  { name: 'scanner', title: 'Scan', icon: ScanLine },
  { name: 'history', title: 'History', icon: History },
  { name: 'settings', title: 'Settings', icon: Settings },
];

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: theme.typography.caption,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}>
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, focused }) => (
                <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
