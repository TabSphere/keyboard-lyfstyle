import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Keyboard, Sparkles, Type, Wand2 } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import { type } from '../../components/ui';

export default function TabLayout() {
  // Lift the tabs above the phone's own bottom bar (Android's buttons or gesture bar,
  // iPhone's home indicator) so the whole tab can be tapped.
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.lineSoft,
          borderTopWidth: 1,
          height: 72 + bottom,
          paddingTop: 8,
          paddingBottom: 10 + bottom,
        },
        tabBarLabelStyle: { fontFamily: type.bold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Write', tabBarIcon: ({ color }) => <Type size={22} color={color} strokeWidth={2.2} /> }}
      />
      <Tabs.Screen
        name="presets"
        options={{ title: 'Presets', tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={2.2} /> }}
      />
      <Tabs.Screen
        name="tools"
        options={{ title: 'Tools', tabBarIcon: ({ color }) => <Wand2 size={22} color={color} strokeWidth={2.2} /> }}
      />
      <Tabs.Screen
        name="keyboard"
        options={{ title: 'Keyboard', tabBarIcon: ({ color }) => <Keyboard size={22} color={color} strokeWidth={2.2} /> }}
      />
    </Tabs>
  );
}
