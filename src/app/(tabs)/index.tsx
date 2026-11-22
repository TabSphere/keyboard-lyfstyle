import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Copy, Lock, Share2, Star, X } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { useCopy } from '../../hooks/useCopy';
import { CATEGORIES, getStyle, styles as allStyles, transformText, type Lyfstyle } from '../../styleEngine';
import { colors, pastels, radii } from '../../theme/tokens';
import { Chip, ChipRow, ProLabel, Screen, TopBar, type } from '../../components/ui';

const MAX_LENGTH = 280;
const CATEGORY_LABELS: Record<string, string> = {
  Emoji: '✨ Emoji', Cute: '🌸 Cute', Bold: '𝗕 Bold', Fancy: '𝓕 Fancy', Soft: '☁️ Soft', Dark: '𝔇 Dark',
  Playful: '🎈 Playful', Effects: 'G̴l̴i̴t̴c̴h̴', Kaomoji: '(◕‿◕)', Classic: 'Classic', Decorated: 'Lines',
};

type Filter = 'all' | 'saved' | 'recent' | string;

export default function WriteScreen() {
  const composer = useComposer();
  const { pro } = composer;
  const { copiedKey, copy } = useCopy();
  const [filter, setFilter] = useState<Filter>('all');
  const sample = composer.text.trim() ? composer.text : 'your text';
  const selected = getStyle(composer.selectedStyle);

  const visible = useMemo(() => {
    const styled = allStyles.filter((style) => style.id !== 'normal');
    if (filter === 'all') return styled;
    if (filter === 'saved') return styled.filter((style) => composer.favorites.includes(style.id));
    if (filter === 'recent') return composer.recents.map(getStyle).filter((style) => style.id !== 'normal');
    return styled.filter((style) => style.category === filter);
  }, [composer.favorites, composer.recents, filter]);

  const categories = useMemo(
    () => CATEGORIES.filter((category) => allStyles.some((style) => style.category === category)),
    [],
  );

  const copyStyle = async (style: Lyfstyle) => {
    if (style.isPro && !pro.isPro) {
      router.push('/pro');
      return;
    }
    composer.rememberCopy(style.id);
    await copy(style.id, transformText(composer.text, style.id));
  };

  const shareSelected = async () => {
    if (composer.locked) {
      router.push('/pro');
      return;
    }
    await Share.share({ message: composer.output }).catch(() => undefined);
  };

  return (
    <Screen>
      <TopBar isPro={pro.isPro} />

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>YOUR WORDS</Text>
          <Text style={styles.counter}>{composer.text.length}/{MAX_LENGTH}</Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Your words"
            value={composer.text}
            onChangeText={composer.setText}
            maxLength={MAX_LENGTH}
            multiline
            placeholder="Type your bio, caption or name…"
            placeholderTextColor="rgba(255,255,255,0.75)"
            style={styles.input}
          />
          {composer.text ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear text" onPress={() => composer.setText('')} hitSlop={10} style={styles.clear}>
              <X size={16} color={colors.brand} strokeWidth={3} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.previewBox}>
          <View style={styles.previewHead}>
            <Text style={styles.previewName}>{selected.name}</Text>
            {selected.isPro && !pro.isPro ? <ProLabel /> : null}
          </View>
          <Text selectable style={styles.previewText}>{transformText(sample, selected.id)}</Text>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void copyStyle(selected)}
              style={({ pressed }) => [styles.heroCopy, pressed && styles.pressed]}
            >
              {composer.locked ? <Lock size={16} color={colors.ink} strokeWidth={2.4} /> : copiedKey === selected.id ? <Check size={17} color={colors.ink} strokeWidth={3} /> : <Copy size={16} color={colors.ink} strokeWidth={2.4} />}
              <Text style={styles.heroCopyText}>{composer.locked ? 'Unlock with Pro' : copiedKey === selected.id ? 'Copied!' : 'Copy'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share styled text"
              onPress={() => void shareSelected()}
              style={({ pressed }) => [styles.heroShare, pressed && styles.pressed]}
            >
              <Share2 size={18} color={colors.white} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </View>

      <ChipRow>
        <Chip label={`All ${allStyles.length - 1}`} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="♡ Saved" active={filter === 'saved'} onPress={() => setFilter('saved')} tint={colors.pinkSoft} />
        <Chip label="Recent" active={filter === 'recent'} onPress={() => setFilter('recent')} tint={colors.peachSoft} />
        {categories.map((category, index) => (
          <Chip
            key={category}
            label={CATEGORY_LABELS[category] ?? category}
            active={filter === category}
            onPress={() => setFilter(category)}
            tint={category === 'Emoji' ? colors.sun : pastels[index % pastels.length]}
          />
        ))}
      </ChipRow>

      <View style={styles.feed}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>
            {filter === 'saved' ? 'Tap the star on any style to save it here.' : 'Styles you copy will show up here.'}
          </Text>
        ) : null}
        {visible.map((style, index) => {
          const locked = style.isPro && !pro.isPro;
          const favourite = composer.favorites.includes(style.id);
          const active = style.id === composer.selectedStyle;
          return (
            <Pressable
              key={style.id}
              accessibilityRole="button"
              accessibilityLabel={`${style.name} style${locked ? ', Pro' : ''}. Show in preview.`}
              onPress={() => composer.selectStyle(style.id)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: pastels[index % pastels.length] },
                active && styles.cardActive,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardBody}>
                <Text numberOfLines={2} style={styles.cardText}>{transformText(sample, style.id)}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardName}>{style.name}</Text>
                  {locked ? <ProLabel /> : null}
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favourite ? `Remove ${style.name} from saved` : `Save ${style.name}`}
                onPress={() => composer.toggleFavorite(style.id)}
                hitSlop={8}
                style={styles.star}
              >
                <Star size={18} color={favourite ? colors.pink : colors.tertiary} fill={favourite ? colors.pink : 'transparent'} strokeWidth={2} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locked ? `Unlock ${style.name} with Pro` : `Copy ${style.name}`}
                onPress={() => void copyStyle(style)}
                style={({ pressed }) => [styles.copyButton, locked && styles.copyButtonLocked, pressed && styles.pressed]}
              >
                <Text style={[styles.copyText, locked && { color: colors.ink }]}>
                  {locked ? 'Pro' : copiedKey === style.id ? 'Copied' : 'Copy'}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>Your typing stays on this device. Styled letters can look different in some apps and fonts.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: radii.large, padding: 16, marginTop: 6, marginBottom: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between' },
  heroLabel: { fontFamily: type.black, fontSize: 11, letterSpacing: 1.2, color: colors.ink },
  counter: { fontFamily: type.semibold, fontSize: 11, color: colors.ink },
  inputRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  input: { flex: 1, fontFamily: type.bold, fontSize: 20, lineHeight: 27, color: colors.white, minHeight: 56, paddingVertical: 8, textAlignVertical: 'top' },
  clear: { marginTop: 10, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  previewBox: { backgroundColor: colors.white, borderRadius: radii.medium, padding: 14, marginTop: 8 },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewName: { fontFamily: type.black, fontSize: 11, letterSpacing: 1, color: colors.brand, textTransform: 'uppercase' },
  previewText: { fontSize: 24, lineHeight: 34, color: colors.ink, marginTop: 6, minHeight: 34 },
  heroActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  heroCopy: { flex: 1, height: 48, borderRadius: radii.pill, backgroundColor: colors.sun, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  heroCopyText: { fontFamily: type.black, fontSize: 15, color: colors.ink },
  heroShare: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  feed: { marginTop: 14, gap: 9 },
  empty: { fontFamily: type.sans, fontSize: 14, color: colors.muted, textAlign: 'center', paddingVertical: 28 },
  card: { borderRadius: radii.medium, paddingVertical: 12, paddingLeft: 14, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent' },
  cardActive: { borderColor: colors.brand },
  cardBody: { flex: 1 },
  cardText: { fontSize: 17, lineHeight: 24, color: colors.ink },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  cardName: { fontFamily: type.black, fontSize: 10, letterSpacing: 0.8, color: colors.muted, textTransform: 'uppercase' },
  star: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  copyButton: { height: 34, minWidth: 64, paddingHorizontal: 12, borderRadius: radii.pill, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  copyButtonLocked: { backgroundColor: colors.sun },
  copyText: { fontFamily: type.black, fontSize: 12, color: colors.white },
  note: { fontFamily: type.sans, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center', marginTop: 22 },
  pressed: { opacity: 0.75 },
});
