import { Tabs } from 'expo-router';
import { Keyboard, Settings2, Sparkles, Type } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import { type } from '../../components/ui';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: type.semibold,
          fontSize: 10,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Write',
          tabBarIcon: ({ color }) => <Type size={21} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="looks"
        options={{
          title: 'Looks',
          tabBarIcon: ({ color }) => <Sparkles size={21} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="setup"
        options={{
          title: 'Keyboard',
          tabBarIcon: ({ color }) => <Keyboard size={21} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings2 size={21} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
