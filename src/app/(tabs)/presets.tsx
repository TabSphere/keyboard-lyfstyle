import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Lock, PenLine } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { useCopy } from '../../hooks/useCopy';
import { presetCount, presetPacks } from '../../content/presets';
import { colors, pastels, radii } from '../../theme/tokens';
import { Chip, ChipRow, PageTitle, ProLabel, Screen, TopBar, type } from '../../components/ui';

export default function PresetsScreen() {
  const composer = useComposer();
  const { pro } = composer;
  const { copiedKey, copy } = useCopy();
  const [packId, setPackId] = useState(presetPacks[0].id);
  const pack = presetPacks.find((item) => item.id === packId) ?? presetPacks[0];
  const locked = pack.isPro && !pro.isPro;

  const edit = (text: string) => {
    composer.setText(text);
    composer.selectStyle('normal');
    router.navigate('/');
  };

  return (
    <Screen>
      <TopBar isPro={pro.isPro} />
      <PageTitle title="Ready-made" mark="bios">
        {presetCount} bios and captions. Tap to copy, or edit one in Write.
      </PageTitle>

      <ChipRow>
        {presetPacks.map((item, index) => (
          <Chip
            key={item.id}
            label={`${item.emoji} ${item.name}${item.isPro && !pro.isPro ? ' 🔒' : ''}`}
            active={item.id === packId}
            onPress={() => setPackId(item.id)}
            tint={pastels[index % pastels.length]}
          />
        ))}
      </ChipRow>

      {locked ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={({ pressed }) => [styles.lockBanner, pressed && styles.pressed]}>
          <Lock size={18} color={colors.ink} strokeWidth={2.4} />
          <Text style={styles.lockText}>The {pack.name} pack is part of Lifetime Pro. Tap to unlock every pack.</Text>
        </Pressable>
      ) : null}

      <View style={styles.list}>
        {pack.items.map((item, index) => {
          const key = `${pack.id}-${index}`;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={locked ? `Pro preset: ${item}` : `Copy preset: ${item}`}
              onPress={() => (locked ? router.push('/pro') : void copy(key, item))}
              style={({ pressed }) => [styles.card, { backgroundColor: pastels[index % pastels.length] }, pressed && styles.pressed]}
            >
              <Text style={[styles.cardText, locked && styles.cardTextLocked]}>{item}</Text>
              <View style={styles.cardFoot}>
                {locked ? <ProLabel /> : <Text style={styles.hint}>{copiedKey === key ? 'Copied ✓' : 'Tap to copy'}</Text>}
                {!locked ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Edit this preset in Write" onPress={() => edit(item)} hitSlop={8} style={styles.edit}>
                    <PenLine size={14} color={colors.violet} strokeWidth={2.4} />
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lockBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.sun, borderRadius: radii.medium, padding: 14, marginTop: 14 },
  lockText: { flex: 1, fontFamily: type.semibold, fontSize: 13, lineHeight: 19, color: colors.ink },
  list: { marginTop: 14, gap: 9 },
  card: { borderRadius: radii.medium, padding: 14 },
  cardText: { fontSize: 18, lineHeight: 26, color: colors.ink },
  cardTextLocked: { opacity: 0.55 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  hint: { fontFamily: type.black, fontSize: 10, letterSpacing: 0.8, color: colors.muted, textTransform: 'uppercase' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: radii.pill, paddingHorizontal: 10, height: 28 },
  editText: { fontFamily: type.black, fontSize: 12, color: colors.violet },
  pressed: { opacity: 0.75 },
});
