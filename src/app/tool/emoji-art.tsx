import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Copy } from 'lucide-react-native';
import { useCopy } from '../../hooks/useCopy';
import { emojiArt, MAX_EMOJI_ART_CHARACTERS } from '../../tools/textTools';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, BackBar, Chip, ChipRow, Eyebrow, PageTitle, Screen, type } from '../../components/ui';

const EMOJIS = ['💖', '✨', '🌸', '🔥', '⭐', '💜', '🖤', '🍓', '🦋', '⚡', '🎀', '🍀'];
const BLANKS = [{ label: 'White squares ⬜', value: '⬜' }, { label: 'White hearts 🤍', value: '🤍' }, { label: 'Black squares ⬛', value: '⬛' }];

export default function EmojiArtScreen() {
  const { copiedKey, copy } = useCopy();
  const [text, setText] = useState('HI');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [blank, setBlank] = useState(BLANKS[0].value);
  const art = emojiArt(text, emoji, blank);

  return (
    <Screen>
      <BackBar title="Emoji letters" fallback="/tools" />
      <PageTitle title="Emoji" mark="letters">Letters A–Z, numbers, ! ? and ♥. Up to {MAX_EMOJI_ART_CHARACTERS} characters.</PageTitle>

      <TextInput
        accessibilityLabel="Word to draw"
        value={text}
        onChangeText={setText}
        maxLength={MAX_EMOJI_ART_CHARACTERS}
        autoCapitalize="characters"
        style={styles.input}
        placeholder="LOVE"
        placeholderTextColor={colors.tertiary}
      />

      <Eyebrow>DRAW WITH</Eyebrow>
      <ChipRow>
        {EMOJIS.map((item) => <Chip key={item} label={item} active={item === emoji} onPress={() => setEmoji(item)} />)}
      </ChipRow>
      <View style={styles.spacer} />
      <Eyebrow>BACKGROUND</Eyebrow>
      <ChipRow>
        {BLANKS.map((item) => <Chip key={item.value} label={item.label} active={item.value === blank} onPress={() => setBlank(item.value)} />)}
      </ChipRow>

      <View style={styles.preview}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text selectable style={styles.art}>{art || 'Type a word above.'}</Text>
        </ScrollView>
      </View>

      <ActionButton
        onPress={() => copy('art', art)}
        disabled={!art}
        icon={<Copy size={16} color={colors.onBrand} />}
      >
        {copiedKey === 'art' ? 'Copied!' : 'Copy emoji letters'}
      </ActionButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 14, height: 52, fontFamily: type.bold, fontSize: 18, color: colors.ink, marginBottom: 16 },
  spacer: { height: 12 },
  preview: { backgroundColor: colors.surface, borderRadius: radii.large, padding: 16, marginVertical: 16, minHeight: 120 },
  art: { fontSize: 18, lineHeight: 22 },
});
