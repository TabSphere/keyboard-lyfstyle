import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Check, Lock } from 'lucide-react-native';
import NativeKeyboard from '@/nativeKeyboard';
import { useComposer } from '../state/ComposerContext';
import { colors, radii } from '../theme/tokens';
import { ActionButton, BackBar, Chip, ChipRow, PageTitle, Screen, type } from '../components/ui';
import { ColourWheel, hexToHsv, hsvToHex, type Hsv } from '../components/ColourWheel';
import { CUSTOM_KEY, DEFAULT_CUSTOM, KeyboardPreview, THEME_KEY, customTheme, type CustomColours } from '../components/KeyboardPreview';


type Part = 'background' | 'key' | 'text' | 'accent';
const PARTS: { id: Part; label: string }[] = [
  { id: 'background', label: 'Background' },
  { id: 'key', label: 'Keys' },
  { id: 'text', label: 'Letters' },
  { id: 'accent', label: 'Accent' },
];
const SEE_THROUGH = [
  { label: 'Solid', value: 1 },
  { label: 'Soft', value: 0.85 },
  { label: 'Glass', value: 0.6 },
  { label: 'Clear', value: 0.3 },
];

/** Pro: mix your own keyboard on a colour wheel. */
export default function CustomThemeScreen() {
  const { pro } = useComposer();
  const [colours, setColours] = useState<CustomColours>(DEFAULT_CUSTOM);
  const [part, setPart] = useState<Part>('background');
  const [wheel, setWheel] = useState<Hsv>(hexToHsv(DEFAULT_CUSTOM.background));
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CUSTOM_KEY).then((saved) => {
      if (!saved) return;
      const parsed = { ...DEFAULT_CUSTOM, ...(JSON.parse(saved) as Partial<CustomColours>) };
      setColours(parsed);
      setWheel(hexToHsv(parsed.background));
    }).catch(() => undefined);
  }, []);

  const choosePart = (next: Part) => {
    setPart(next);
    setWheel(hexToHsv(colours[next]));
  };

  const changeWheel = (next: Hsv) => {
    setWheel(next);
    setColours((current) => ({ ...current, [part]: hsvToHex(next) }));
  };

  const save = async () => {
    if (!pro.isPro) {
      router.push('/pro');
      return;
    }
    setBusy(true);
    setNotice('');
    const json = JSON.stringify(colours);
    try {
      await AsyncStorage.multiSet([[CUSTOM_KEY, json], [THEME_KEY, 'custom-colors']]);
      if (Platform.OS !== 'web') await NativeKeyboard.setCustomTheme(json);
      setNotice(Platform.OS === 'ios'
        ? 'Saved. On iPhone, turn on Full Access for Lyfstyle (Settings → Keyboards) so the keyboard can use your colours.'
        : 'Saved. Your keyboard now uses your colours.');
    } catch {
      setNotice('Saved here. Open the iPhone or Android app to use it on the keyboard.');
    } finally {
      setBusy(false);
    }
  };

  const theme = customTheme(colours);

  return (
    <Screen
      footer={(
        <ActionButton onPress={save} busy={busy} variant={pro.isPro ? 'primary' : 'sun'} icon={pro.isPro ? <Check size={17} color={colors.onBrand} /> : <Lock size={16} color={colors.ink} />}>
          {pro.isPro ? 'Use these colours' : 'Unlock with Pro'}
        </ActionButton>
      )}
    >
      <BackBar title="My colours" fallback="/keyboard" />
      <PageTitle title="Mix your" mark="keyboard">Pick a part, then drag on the wheel.</PageTitle>

      <KeyboardPreview theme={theme} />

      <ChipRow>
        {PARTS.map((item) => (
          <Chip key={item.id} label={item.label} active={part === item.id} onPress={() => choosePart(item.id)} />
        ))}
      </ChipRow>

      <View style={styles.wheel}>
        <ColourWheel value={wheel} onChange={changeWheel} />
        <Text style={styles.hex}>{colours[part]}</Text>
      </View>

      <Text style={styles.label}>KEYS</Text>
      <ChipRow>
        {SEE_THROUGH.map((item) => (
          <Chip
            key={item.label}
            label={item.label}
            active={Math.abs(colours.keyAlpha - item.value) < 0.01}
            onPress={() => setColours((current) => ({ ...current, keyAlpha: item.value }))}
          />
        ))}
      </ChipRow>

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wheel: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.large, paddingVertical: 20, marginTop: 14, marginBottom: 18, gap: 10 },
  hex: { fontFamily: type.bold, fontSize: 13, color: colors.muted, letterSpacing: 1 },
  label: { fontFamily: type.black, fontSize: 11, letterSpacing: 1.2, color: colors.muted, marginBottom: 8 },
  notice: { fontFamily: type.semibold, color: colors.success, fontSize: 13, lineHeight: 19, marginTop: 14 },
});
