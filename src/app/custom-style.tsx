import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, ChevronDown, ChevronUp, Lock, Trash2 } from 'lucide-react-native';
import {
  BASE_OPTIONS,
  EFFECT_OPTIONS,
  FRAME_PRESETS,
  JOINER_PRESETS,
  LIMITS,
  letterChoices,
  newCustomStyle,
  resolveCustomStyle,
  type CustomStyleSpec,
} from '../customStyles';
import { useComposer } from '../state/ComposerContext';
import { colors, radii } from '../theme/tokens';
import { ActionButton, BackBar, Chip, ChipRow, PageTitle, Screen, type } from '../components/ui';

const LOWER = [...'abcdefghijklmnopqrstuvwxyz'];
const UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const DIGITS = [...'0123456789'];
const CASES = [
  { id: 'lower', label: 'abc', letters: LOWER },
  { id: 'upper', label: 'ABC', letters: UPPER },
  { id: 'digits', label: '123', letters: DIGITS },
] as const;

/** Styles a sample with a one-off style, without registering it. */
function sample(text: string, style: ReturnType<typeof resolveCustomStyle>) {
  const chars = Array.from(text);
  let out = '';
  chars.forEach((c, i) => {
    out += style.mapping[c] ?? c;
    const next = chars[i + 1];
    if (style.joiner && next !== undefined && /^[A-Za-z0-9]$/.test(c) && /^[A-Za-z0-9]$/.test(next)) out += style.joiner;
  });
  return text.trim() ? `${style.prefix ?? ''}${out}${style.suffix ?? ''}` : out;
}

const plainSpec = (patch: Partial<CustomStyleSpec>) => resolveCustomStyle({ ...newCustomStyle(0), base: 'normal', ...patch });

/** Pro: build your own font from a base alphabet, an effect, a frame and hand-picked letters. */
export default function CustomStyleScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { pro, customSpecs, saveCustomStyle, deleteCustomStyle, selectStyle } = useComposer();
  const existing = customSpecs.find((spec) => spec.id === id);
  const [spec, setSpec] = useState<CustomStyleSpec>(() => existing ?? newCustomStyle());
  const [words, setWords] = useState('main character');
  const [customFrame, setCustomFrame] = useState(() => Boolean(existing && (existing.prefix || existing.suffix) && !FRAME_PRESETS.some((f) => f.prefix === existing.prefix && f.suffix === existing.suffix)));
  const [customJoiner, setCustomJoiner] = useState(() => Boolean(existing?.joiner && !JOINER_PRESETS.includes(existing.joiner)));
  const [advanced, setAdvanced] = useState(() => Boolean(existing && Object.keys(existing.overrides).length));
  const [letterCase, setLetterCase] = useState<(typeof CASES)[number]['id']>('lower');
  const [letter, setLetter] = useState('a');

  const update = (patch: Partial<CustomStyleSpec>) => setSpec((current) => ({ ...current, ...patch }));
  const style = useMemo(() => resolveCustomStyle(spec), [spec]);
  const preview = sample(words || 'main character', style);
  const choices = useMemo(() => letterChoices(letter), [letter]);
  const overridden = Object.keys(spec.overrides).length;

  const setOverride = (character: string, form: string) => {
    setSpec((current) => {
      const overrides = { ...current.overrides };
      if (!form || form === character) delete overrides[character];
      else overrides[character] = Array.from(form).slice(0, LIMITS.letter).join('');
      return { ...current, overrides };
    });
  };

  const save = () => {
    if (!pro.isPro) {
      router.push('/pro');
      return;
    }
    const name = spec.name.trim() || `My style ${customSpecs.length + (existing ? 0 : 1)}`;
    const saved = { ...spec, name };
    saveCustomStyle(saved);
    selectStyle(saved.id);
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    const go = () => {
      deleteCustomStyle(existing.id);
      router.back();
    };
    if (Platform.OS === 'web') { go(); return; }
    Alert.alert(`Delete ${existing.name}?`, 'This removes it from the app and the keyboard.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: go },
    ]);
  };

  const framed = Boolean(spec.prefix || spec.suffix || spec.joiner);

  return (
    <Screen
      footer={(
        <ActionButton onPress={save} variant={pro.isPro ? 'primary' : 'sun'} icon={pro.isPro ? <Check size={17} color={colors.onBrand} /> : <Lock size={16} color={colors.ink} />}>
          {pro.isPro ? (existing ? 'Save changes' : 'Save my style') : 'Unlock with Pro to save'}
        </ActionButton>
      )}
    >
      <BackBar title={existing ? existing.name : 'New style'} />
      <PageTitle title="Make your" mark="own style">Mix a font, an effect and a frame. Swap any letter you like.</PageTitle>

      <View style={styles.preview}>
        <Text style={styles.previewText} selectable>{preview}</Text>
        <TextInput
          accessibilityLabel="Words to preview"
          value={words}
          onChangeText={setWords}
          maxLength={40}
          placeholder="Type to preview…"
          placeholderTextColor={colors.tertiary}
          style={styles.previewInput}
        />
      </View>

      <Text style={styles.label}>NAME</Text>
      <TextInput
        accessibilityLabel="Style name"
        value={spec.name}
        onChangeText={(name) => update({ name })}
        maxLength={LIMITS.name}
        placeholder="e.g. Soft girl script"
        placeholderTextColor={colors.tertiary}
        style={styles.field}
      />

      <Text style={styles.label}>LETTERS</Text>
      <ChipRow>
        {BASE_OPTIONS.map((option) => (
          <Chip
            key={option.id}
            label={option.id === 'normal' ? 'Plain' : sample(option.name, plainSpec({ base: option.id }))}
            active={spec.base === option.id}
            onPress={() => update({ base: option.id })}
          />
        ))}
      </ChipRow>

      <Text style={styles.label}>EFFECT</Text>
      <ChipRow>
        <Chip label="None" active={!spec.effect} onPress={() => update({ effect: null })} />
        {EFFECT_OPTIONS.map((option) => (
          <Chip key={option.id} label={sample(option.name, plainSpec({ effect: option.id }))} active={spec.effect === option.id} onPress={() => update({ effect: option.id })} />
        ))}
      </ChipRow>

      <Text style={styles.label}>FRAME</Text>
      <ChipRow>
        <Chip label="None" active={!customFrame && !spec.prefix && !spec.suffix} onPress={() => { setCustomFrame(false); update({ prefix: '', suffix: '' }); }} />
        {FRAME_PRESETS.map((frame) => (
          <Chip
            key={`${frame.prefix}|${frame.suffix}`}
            label={`${frame.prefix}abc${frame.suffix}`}
            active={!customFrame && spec.prefix === frame.prefix && spec.suffix === frame.suffix}
            onPress={() => { setCustomFrame(false); update({ prefix: frame.prefix, suffix: frame.suffix }); }}
          />
        ))}
        <Chip label="Your own…" active={customFrame} onPress={() => setCustomFrame(true)} />
      </ChipRow>
      {customFrame ? (
        <View style={styles.pair}>
          <TextInput accessibilityLabel="Before your words" value={spec.prefix} onChangeText={(prefix) => update({ prefix })} maxLength={LIMITS.frame} placeholder="Before ♡" placeholderTextColor={colors.tertiary} style={[styles.field, styles.half]} />
          <TextInput accessibilityLabel="After your words" value={spec.suffix} onChangeText={(suffix) => update({ suffix })} maxLength={LIMITS.frame} placeholder="After ♡" placeholderTextColor={colors.tertiary} style={[styles.field, styles.half]} />
        </View>
      ) : null}

      <Text style={styles.label}>BETWEEN LETTERS</Text>
      <ChipRow>
        <Chip label="None" active={!customJoiner && !spec.joiner} onPress={() => { setCustomJoiner(false); update({ joiner: '' }); }} />
        {JOINER_PRESETS.map((joiner) => (
          <Chip key={joiner} label={`a${joiner}b${joiner}c`} active={!customJoiner && spec.joiner === joiner} onPress={() => { setCustomJoiner(false); update({ joiner }); }} />
        ))}
        <Chip label="Your own…" active={customJoiner} onPress={() => setCustomJoiner(true)} />
      </ChipRow>
      {customJoiner ? (
        <TextInput accessibilityLabel="Between letters" value={spec.joiner} onChangeText={(joiner) => update({ joiner })} maxLength={LIMITS.joiner} placeholder="e.g. ♡ or ·" placeholderTextColor={colors.tertiary} style={styles.field} />
      ) : null}

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: advanced }} onPress={() => setAdvanced((v) => !v)} style={({ pressed }) => [styles.advanced, pressed && styles.pressed]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.advancedTitle}>Letter by letter{overridden ? ` · ${overridden} changed` : ''}</Text>
          <Text style={styles.advancedText}>Pick a different look for any single letter or number.</Text>
        </View>
        {advanced ? <ChevronUp size={20} color={colors.ink} /> : <ChevronDown size={20} color={colors.ink} />}
      </Pressable>

      {advanced ? (
        <View style={styles.editor}>
          <ChipRow>
            {CASES.map((item) => (
              <Chip key={item.id} label={item.label} active={letterCase === item.id} onPress={() => { setLetterCase(item.id); setLetter(item.letters[0]); }} />
            ))}
          </ChipRow>
          <View style={styles.grid}>
            {CASES.find((item) => item.id === letterCase)!.letters.map((character) => (
              <Pressable
                key={character}
                accessibilityRole="button"
                accessibilityLabel={`Letter ${character}`}
                accessibilityState={{ selected: letter === character }}
                onPress={() => setLetter(character)}
                style={[styles.cell, letter === character && styles.cellActive, spec.overrides[character] ? styles.cellChanged : null]}
              >
                <Text style={[styles.cellText, letter === character && { color: colors.white }]}>{style.mapping[character] ?? character}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{`LOOKS FOR “${letter}”`}</Text>
          <View style={styles.grid}>
            {choices.map((form) => {
              const active = (spec.overrides[letter] ?? '') === (form === letter ? '' : form);
              return (
                <Pressable key={form} accessibilityRole="button" accessibilityLabel={form === letter ? 'Use the font letter' : `Use ${form}`} onPress={() => setOverride(letter, form)} style={[styles.cell, active && styles.cellActive]}>
                  <Text style={[styles.cellText, active && { color: colors.white }]}>{form === letter ? '↺' : form}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            accessibilityLabel={`Your own look for ${letter}`}
            value={spec.overrides[letter] ?? ''}
            onChangeText={(form) => setOverride(letter, form)}
            maxLength={LIMITS.letter}
            placeholder={`Or type your own for “${letter}”`}
            placeholderTextColor={colors.tertiary}
            style={styles.field}
          />
          {overridden ? (
            <Pressable accessibilityRole="button" onPress={() => update({ overrides: {} })} hitSlop={8}>
              <Text style={styles.reset}>Reset all letters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.note}>
        {framed
          ? 'On the keyboard you get the letters. The frame and the bits between letters are added when you copy from the app.'
          : 'Saved styles show up under “My styles” in the app and on the keyboard.'}
        {Platform.OS === 'ios' ? ' On iPhone, the keyboard needs Full Access to see your styles.' : ''}
      </Text>

      {existing ? (
        <ActionButton variant="outline" onPress={remove} icon={<Trash2 size={16} color={colors.ink} />} style={styles.delete}>Delete this style</ActionButton>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { backgroundColor: colors.brand, borderRadius: radii.large, padding: 18, gap: 12, marginBottom: 18 },
  previewText: { fontFamily: type.bold, fontSize: 26, lineHeight: 34, color: colors.ink, minHeight: 34 },
  previewInput: { fontFamily: type.semibold, fontSize: 15, color: colors.ink, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radii.pill, paddingHorizontal: 16, height: 42 },
  label: { fontFamily: type.black, fontSize: 11, letterSpacing: 1.2, color: colors.muted, marginTop: 16, marginBottom: 8 },
  field: { fontFamily: type.semibold, fontSize: 15, color: colors.ink, backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 16, height: 48, marginTop: 8 },
  pair: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  advanced: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.sunSoft, borderRadius: radii.medium, padding: 16, marginTop: 24 },
  advancedTitle: { fontFamily: type.bold, fontSize: 15, color: colors.ink },
  advancedText: { fontFamily: type.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  editor: { backgroundColor: colors.surface, borderRadius: radii.medium, padding: 14, marginTop: 10, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  cell: { minWidth: 40, height: 40, paddingHorizontal: 6, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  cellActive: { backgroundColor: colors.ink },
  cellChanged: { borderWidth: 2, borderColor: colors.brand },
  cellText: { fontSize: 18, color: colors.ink },
  reset: { fontFamily: type.bold, fontSize: 13, color: colors.brandDeep, marginTop: 10 },
  note: { fontFamily: type.sans, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 20 },
  delete: { marginTop: 18 },
  pressed: { opacity: 0.7 },
});
