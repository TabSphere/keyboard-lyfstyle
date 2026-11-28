import { Tabs } from 'expo-router';
import { Keyboard, Sparkles, Type, Wand2 } from 'lucide-react-native';
import { colors } from '../../theme/tokens';
import { type } from '../../components/ui';

export default function TabLayout() {
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
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
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
