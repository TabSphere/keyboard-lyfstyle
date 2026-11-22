import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { colors, radii } from '../../theme/tokens';
import { PageTitle, ProLabel, Screen, TopBar, type } from '../../components/ui';

const TOOLS: { href: Href; emoji: string; title: string; copy: string; tint: string; pro?: boolean }[] = [
  { href: '/tool/card', emoji: '🖼️', title: 'Story card maker', copy: 'Put your styled text on a colourful card and share it as an image.', tint: colors.sun },
  { href: '/tool/emoji-art', emoji: '💖', title: 'Emoji letters', copy: 'Draw a word in giant letters made of any emoji.', tint: colors.pinkSoft },
  { href: '/tool/usernames', emoji: '@', title: 'Username ideas', copy: 'Handles you can actually use, plus a styled display name.', tint: colors.peachSoft },
  { href: '/tool/repeater', emoji: '🔁', title: 'Text repeater', copy: 'Repeat a word or message up to 500 times.', tint: colors.mintSoft },
  { href: '/tool/symbols', emoji: '(◕‿◕)', title: 'Symbols & kaomoji', copy: 'Hearts, stars, arrows, dividers and cute faces to copy.', tint: colors.sunSoft },
];

export default function ToolsScreen() {
  const { pro } = useComposer();
  return (
    <Screen>
      <TopBar isPro={pro.isPro} />
      <PageTitle title="Make it" mark="extra">
        Little tools for bios, chats and stories. All offline, nothing uploaded.
      </PageTitle>
      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.title}
            accessibilityRole="button"
            onPress={() => router.push(tool.href)}
            style={({ pressed }) => [styles.card, { backgroundColor: tool.tint }, pressed && styles.pressed]}
          >
            <Text style={styles.emoji}>{tool.emoji}</Text>
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{tool.title}</Text>
                {tool.pro && !pro.isPro ? <ProLabel /> : null}
              </View>
              <Text style={styles.copy}>{tool.copy}</Text>
            </View>
            <ChevronRight size={20} color={colors.ink} strokeWidth={2.2} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 10 },
  card: { borderRadius: radii.large, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  emoji: { fontSize: 30, minWidth: 44, textAlign: 'center' },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: type.displayBold, fontSize: 19, color: colors.ink },
  copy: { fontFamily: type.sans, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 3 },
  pressed: { opacity: 0.75 },
});
