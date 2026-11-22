import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, LockKeyhole, RotateCcw, X } from 'lucide-react-native';
import { useComposer } from '../state/ComposerContext';
import { transformText } from '../styleEngine';
import { colors } from '../theme/tokens';
import { ActionButton, Eyebrow, Screen, Wordmark, type } from '../components/ui';

export default function ProScreen() {
  const { pro } = useComposer();
  const close = () => router.canGoBack() ? router.back() : router.replace('/');

  return (
    <Screen contentStyle={styles.screenContent}>
      <View style={styles.topbar}>
        <Wordmark />
        <Pressable accessibilityRole="button" accessibilityLabel="Close Lifetime Pro" onPress={close} style={styles.close}><X size={22} color={colors.ink} /></Pressable>
      </View>

      <View style={styles.hero}>
        <Eyebrow light>ONE PURCHASE / YOURS FOR GOOD</Eyebrow>
        <Text style={styles.title}>More ways to{`\n`}<Text style={styles.titleItalic}>make it yours.</Text></Text>
        <View style={styles.specimen} accessibilityLabel="Examples of Pro styles">
          <Text style={styles.specimenText}>{transformText('Make it yours.', 'bold-script')}</Text>
          <Text style={styles.specimenText}>{transformText('MAKE IT YOURS.', 'negative-circled')}</Text>
          <Text style={styles.specimenText}>{transformText('Make it yours.', 'strike')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.intro}>The free collection is not going anywhere. Pro simply opens the other half—without a subscription or an account.</Text>
        <View style={styles.benefits}>
          <Benefit>12 additional hand-audited Unicode styles</Benefit>
          <Benefit>Ornate Frame, Sparkle Frame and Botanical Divider</Benefit>
          <Benefit>Lifetime access with store restore support</Benefit>
          <Benefit>Same private, on-device typing experience</Benefit>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>LIFETIME PRO</Text>
          <Text style={styles.price}>{pro.isPro ? 'Unlocked' : pro.price || 'Store-localised price'}</Text>
          <Text style={styles.priceNote}>{pro.isPro ? 'Thank you for supporting Lyfstyle.' : 'One time. No auto-renewal. Final price and currency are confirmed by your app store.'}</Text>
        </View>

        {pro.isPro ? (
          <ActionButton onPress={close} variant="dark" icon={<Check size={17} color={colors.white} />}>Continue writing</ActionButton>
        ) : (
          <ActionButton
            onPress={pro.purchase}
            busy={pro.busy}
            variant="primary"
            icon={<LockKeyhole size={17} color={colors.onAccent} />}
          >
            {pro.price ? `Unlock lifetime · ${pro.price}` : 'Unlock Lifetime Pro'}
          </ActionButton>
        )}

        {!pro.connected && Platform.OS !== 'web' && !pro.isPro ? <Text style={styles.storeStatus}>Connecting to the store… You can still use Restore Purchases.</Text> : null}
        {pro.message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{pro.message}</Text> : null}

        <Pressable accessibilityRole="button" onPress={pro.restore} disabled={pro.busy} style={styles.restore}>
          <RotateCcw size={14} color={colors.ink} />
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.legal}>Purchase is processed by Apple or Google. Lyfstyle does not collect payment details. Pro availability in the keyboard is synchronised locally; the iPhone TestFlight spike must confirm whether optional Full Access is needed on your device.</Text>
      </View>
    </Screen>
  );
}

function Benefit({ children }: { children: string }) {
  return (
    <View style={styles.benefit}>
      <Check size={16} color={colors.ink} strokeWidth={1.8} />
      <Text style={styles.benefitText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 0, maxWidth: 640 },
  topbar: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: colors.ink, paddingHorizontal: 24, paddingTop: 29, paddingBottom: 26 },
  title: { fontFamily: type.display, fontSize: 51, lineHeight: 51, letterSpacing: -1.2, color: colors.canvas, marginTop: 17 },
  titleItalic: { fontFamily: type.display, color: colors.accent },
  specimen: { marginTop: 29, paddingTop: 19, borderTopWidth: 1, borderTopColor: '#2E2E33', gap: 10 },
  specimenText: { color: colors.canvas, fontSize: 19, lineHeight: 28 },
  body: { paddingHorizontal: 24, paddingTop: 25, paddingBottom: 38 },
  intro: { fontFamily: type.sans, color: colors.muted, fontSize: 14, lineHeight: 22 },
  benefits: { marginTop: 22, gap: 13 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  benefitText: { flex: 1, fontFamily: type.medium, color: colors.ink, fontSize: 13, lineHeight: 20 },
  priceBlock: { marginVertical: 25, paddingVertical: 19, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  priceLabel: { fontFamily: type.bold, color: colors.muted, fontSize: 9, letterSpacing: 1.2 },
  price: { fontFamily: type.display, color: colors.ink, fontSize: 38, marginTop: 4 },
  priceNote: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  storeStatus: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 12 },
  message: { fontFamily: type.medium, color: colors.success, fontSize: 12, lineHeight: 19, marginTop: 12 },
  restore: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  restoreText: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  legal: { fontFamily: type.sans, color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: 14 },
});
