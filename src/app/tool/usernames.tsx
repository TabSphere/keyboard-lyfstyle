import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useComposer } from '../../state/ComposerContext';
import { getStyle } from '../../styleEngine';
import { useCopy } from '../../hooks/useCopy';
import { usernameIdeas } from '../../tools/textTools';
import { colors, pastels, radii } from '../../theme/tokens';
import { BackBar, PageTitle, Screen, type } from '../../components/ui';

export default function UsernamesScreen() {
  const { copiedKey, copy } = useCopy();
  const { pro } = useComposer();
  const [name, setName] = useState('');
  const ideas = usernameIdeas(name);

  return (
    <Screen>
      <BackBar title="Username ideas" fallback="/tools" />
      <PageTitle title="Find your" mark="@">Plain handles work on Instagram and TikTok. The styled version is for your display name.</PageTitle>

      <TextInput
        accessibilityLabel="Your name or nickname"
        value={name}
        onChangeText={setName}
        maxLength={24}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
        placeholder="Your name or nickname"
        placeholderTextColor={colors.tertiary}
      />

      {!ideas.length ? <Text style={styles.empty}>Type a name to see ideas.</Text> : null}
      <View style={styles.list}>
        {ideas.map((idea, index) => (
          <View key={idea.plain} style={[styles.card, { backgroundColor: pastels[index % pastels.length] }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Copy handle ${idea.plain}`} onPress={() => copy(`p-${idea.plain}`, idea.plain)} style={styles.half}>
              <Text style={styles.label}>{copiedKey === `p-${idea.plain}` ? 'COPIED ✓' : 'HANDLE'}</Text>
              <Text style={styles.plain} numberOfLines={1}>@{idea.plain}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Copy display name ${idea.styled}`} onPress={() => (getStyle(idea.styleId).isPro && !pro.isPro ? router.push('/pro') : copy(`s-${idea.plain}`, idea.styled))} style={[styles.half, styles.right]}>
              <Text style={styles.label}>{copiedKey === `s-${idea.plain}` ? 'COPIED ✓' : getStyle(idea.styleId).isPro && !pro.isPro ? 'DISPLAY NAME · PRO 🔒' : 'DISPLAY NAME'}</Text>
              <Text style={styles.styled} numberOfLines={1}>{idea.styled}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 14, height: 52, fontFamily: type.bold, fontSize: 17, color: colors.ink },
  empty: { fontFamily: type.sans, color: colors.muted, textAlign: 'center', marginTop: 24 },
  list: { gap: 9, marginTop: 14 },
  card: { borderRadius: radii.medium, flexDirection: 'row' },
  half: { flex: 1, padding: 12 },
  right: { borderLeftWidth: 2, borderLeftColor: colors.white },
  label: { fontFamily: type.black, fontSize: 9, letterSpacing: 0.8, color: colors.muted },
  plain: { fontFamily: type.bold, fontSize: 15, color: colors.ink, marginTop: 3 },
  styled: { fontSize: 16, color: colors.ink, marginTop: 3 },
});
