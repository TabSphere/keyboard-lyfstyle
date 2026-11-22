import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Lock, RotateCcw, X } from 'lucide-react-native';
import { useComposer } from '../state/ComposerContext';
import { styles as allStyles, themes, transformText } from '../styleEngine';
import { presetCount, presetPacks } from '../content/presets';
import { colors, radii } from '../theme/tokens';
import { ActionButton, Screen, Wordmark, type } from '../components/ui';

const proStyles = allStyles.filter((style) => style.isPro).length;
const proThemes = themes.filter((item) => item.isPro).length;
const proPacks = presetPacks.filter((pack) => pack.isPro).length;

export default function ProScreen() {
  const { pro } = useComposer();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const footer = pro.isPro ? (
    <ActionButton onPress={close} variant="primary" icon={<Check size={17} color={colors.onBrand} />}>Back to styling</ActionButton>
  ) : (
    <View style={styles.footerRow}>
      <View style={styles.priceBlock}>
        <Text style={styles.priceLabel}>PAY ONCE · KEEP FOREVER</Text>
        <Text style={styles.price}>{pro.price || 'Store price'}</Text>
      </View>
      <ActionButton onPress={pro.purchase} busy={pro.busy} variant="sun" icon={<Lock size={16} color={colors.ink} />} style={styles.buy}>
        Unlock Pro
      </ActionButton>
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={styles.top}>
        <Wordmark />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}><X size={20} color={colors.ink} strokeWidth={2.4} /></Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>LIFETIME PRO</Text>
        <Text style={styles.heroTitle}>Every style.{'\n'}<Text style={styles.heroMark}>{' '}Forever.{' '}</Text></Text>
        <View style={styles.specimens}>
          <Text style={styles.specimen}>{transformText('main character', 'frame-wings')}</Text>
          <Text style={styles.specimen}>{transformText('soft era', 'frame-heart-ribbon')}</Text>
          <Text style={styles.specimen}>{transformText('no days off', 'asian')}</Text>
        </View>
      </View>

      <View style={styles.list}>
        <Benefit tint={colors.peachSoft} big={`${proStyles}`} text="more text styles: wings, ribbons, runes, brush and every emoji frame" />
        <Benefit tint={colors.pinkSoft} big={`${proThemes}`} text="extra keyboard themes, including picture themes and your own photo" />
        <Benefit tint={colors.mintSoft} big={`${proPacks}`} text={`preset packs (Savage, Gym, Travel, Gaming). ${presetCount} bios in total`} />
        <Benefit tint={colors.sunSoft} big="10" text="extra story-card backgrounds" />
      </View>

      <View style={styles.promise}>
        {['No subscription, ever', 'No ads, no tracking', 'Restore free on a new phone'].map((line) => (
          <View key={line} style={styles.promiseRow}>
            <Check size={16} color={colors.success} strokeWidth={3} />
            <Text style={styles.promiseText}>{line}</Text>
          </View>
        ))}
      </View>

      {!pro.connected && Platform.OS !== 'web' && !pro.isPro ? <Text style={styles.status}>Connecting to the store…</Text> : null}
      {pro.message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{pro.message}</Text> : null}

      <Pressable accessibilityRole="button" onPress={pro.restore} disabled={pro.busy} style={styles.restore}>
        <RotateCcw size={14} color={colors.ink} />
        <Text style={styles.restoreText}>Restore purchases</Text>
      </Pressable>
      <Text style={styles.legal}>Payment is handled by Apple or Google; Lyfstyle never sees your card. The price shown is set by your app store in your currency.</Text>
    </Screen>
  );
}

function Benefit({ big, text, tint }: { big: string; text: string; tint: string }) {
  return (
    <View style={[styles.benefit, { backgroundColor: tint }]}>
      <Text style={styles.benefitBig}>{big}</Text>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, minHeight: 52 },
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: colors.brand, borderRadius: radii.large, padding: 22, marginTop: 8 },
  heroEyebrow: { fontFamily: type.black, fontSize: 11, letterSpacing: 1.4, color: colors.white },
  heroTitle: { fontFamily: type.display, fontSize: 40, lineHeight: 48, letterSpacing: -1.2, color: colors.ink, marginTop: 8 },
  heroMark: { backgroundColor: colors.sun, color: colors.ink },
  specimens: { marginTop: 18, gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(34,23,47,0.2)', paddingTop: 14 },
  specimen: { color: colors.ink, fontSize: 18, lineHeight: 26 },
  list: { gap: 8, marginTop: 14 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: radii.medium, padding: 14 },
  benefitBig: { fontFamily: type.display, fontSize: 30, color: colors.ink, minWidth: 48, textAlign: 'center' },
  benefitText: { flex: 1, fontFamily: type.semibold, fontSize: 14, lineHeight: 20, color: colors.ink },
  promise: { marginTop: 16, gap: 8 },
  promiseRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  promiseText: { fontFamily: type.bold, fontSize: 14, color: colors.ink },
  status: { fontFamily: type.sans, color: colors.muted, fontSize: 12, marginTop: 12 },
  message: { fontFamily: type.semibold, color: colors.brandDeep, fontSize: 13, lineHeight: 19, marginTop: 12 },
  restore: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  restoreText: { fontFamily: type.bold, color: colors.ink, fontSize: 14 },
  legal: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  priceBlock: { flex: 1 },
  priceLabel: { fontFamily: type.black, fontSize: 9, letterSpacing: 1, color: colors.muted },
  price: { fontFamily: type.display, fontSize: 26, color: colors.ink },
  buy: { flex: 1 },
});
