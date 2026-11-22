import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Minus, Plus, Share2 } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { getStyle, transformText } from '../../styleEngine';
import { shareViewAsImage } from '../../tools/shareImage';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, BackBar, Chip, ChipRow, Eyebrow, PageTitle, Screen, type } from '../../components/ui';

type Background = { id: string; name: string; fill: string; text: string; accent: string; isPro: boolean };

const BACKGROUNDS: Background[] = [
  { id: 'pop-pink', name: 'Hot pink', fill: colors.brand, text: colors.ink, accent: colors.sun, isPro: false },
  { id: 'sun', name: 'Sun', fill: colors.sun, text: colors.ink, accent: colors.brand, isPro: false },
  { id: 'blush', name: 'Blush', fill: colors.pinkSoft, text: colors.ink, accent: colors.pink, isPro: false },
  { id: 'mint', name: 'Mint', fill: colors.mint, text: colors.ink, accent: colors.brand, isPro: false },
  { id: 'plum', name: 'Plum', fill: colors.ink, text: colors.white, accent: colors.pink, isPro: false },
  { id: 'paper', name: 'Paper', fill: colors.white, text: colors.ink, accent: colors.brand, isPro: false },
  { id: 'emerald', name: 'Emerald', fill: '#12B886', text: colors.white, accent: colors.sun, isPro: true },
  { id: 'candy', name: 'Candy', fill: colors.lilac, text: colors.ink, accent: colors.white, isPro: true },
  { id: 'ocean', name: 'Ocean', fill: '#2563EB', text: colors.white, accent: colors.mint, isPro: true },
  { id: 'cherry', name: 'Cherry', fill: '#E8304A', text: colors.white, accent: colors.sun, isPro: true },
  { id: 'neon', name: 'Neon Night', fill: '#0F0F1A', text: '#E8FFF9', accent: '#38F2C0', isPro: true },
  { id: 'peach', name: 'Peach', fill: '#FFD3C2', text: colors.ink, accent: colors.pink, isPro: true },
];

const SIZES = [20, 24, 28, 34, 40];

export default function CardMakerScreen() {
  const composer = useComposer();
  const { pro } = composer;
  const cardRef = useRef<View>(null);
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [size, setSize] = useState(2);
  const [caption, setCaption] = useState('@yourname');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const style = getStyle(composer.selectedStyle);
  const locked = (background.isPro || style.isPro) && !pro.isPro;
  const text = transformText(composer.text.trim() || 'your words here', style.id);

  const share = async () => {
    if (locked) {
      router.push('/pro');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await shareViewAsImage(cardRef);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BackBar title="Story card" fallback="/tools" />
      <PageTitle title="Card" mark="maker">Uses the words and style from Write. Change them there.</PageTitle>

      <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: background.fill }]}>
        <Text style={[styles.cardSpark, { color: background.accent }]}>✦</Text>
        <Text style={[styles.cardText, { color: background.text, fontSize: SIZES[size], lineHeight: SIZES[size] * 1.35 }]}>{text}</Text>
        {caption.trim() ? <Text style={[styles.cardCaption, { color: background.text }]}>{caption.trim()}</Text> : null}
        <Text style={[styles.cardSparkBottom, { color: background.accent }]}>✦</Text>
      </View>

      <Eyebrow>BACKGROUND</Eyebrow>
      <ChipRow>
        {BACKGROUNDS.map((item) => (
          <Chip
            key={item.id}
            label={`${item.name}${item.isPro && !pro.isPro ? ' 🔒' : ''}`}
            active={item.id === background.id}
            onPress={() => setBackground(item)}
            tint={item.fill === colors.white ? colors.lineSoft : item.fill}
          />
        ))}
      </ChipRow>

      <View style={styles.row}>
        <Eyebrow>TEXT SIZE</Eyebrow>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="Smaller text" onPress={() => setSize((v) => Math.max(0, v - 1))} style={styles.stepButton}><Minus size={16} color={colors.ink} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Bigger text" onPress={() => setSize((v) => Math.min(SIZES.length - 1, v + 1))} style={styles.stepButton}><Plus size={16} color={colors.ink} /></Pressable>
        </View>
      </View>

      <Eyebrow>CAPTION</Eyebrow>
      <TextInput accessibilityLabel="Card caption" value={caption} onChangeText={setCaption} maxLength={40} style={styles.input} placeholder="@yourname" placeholderTextColor={colors.tertiary} />

      <ActionButton onPress={share} busy={busy} variant={locked ? 'sun' : 'primary'} icon={<Share2 size={17} color={colors.ink} />} style={styles.share}>
        {locked ? 'Unlock with Pro' : 'Share as image'}
      </ActionButton>
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { aspectRatio: 4 / 5, borderRadius: radii.large, padding: 28, justifyContent: 'center', marginBottom: 18 },
  cardSpark: { position: 'absolute', top: 22, left: 24, fontSize: 26 },
  cardSparkBottom: { position: 'absolute', bottom: 22, right: 24, fontSize: 26 },
  cardText: { textAlign: 'center' },
  cardCaption: { fontFamily: type.bold, fontSize: 14, textAlign: 'center', marginTop: 18, opacity: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 12 },
  stepper: { flexDirection: 'row', gap: 8 },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 14, height: 48, fontFamily: type.semibold, fontSize: 15, color: colors.ink, marginTop: 8 },
  share: { marginTop: 20 },
  message: { fontFamily: type.semibold, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10 },
});
