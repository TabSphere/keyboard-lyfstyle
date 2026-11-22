import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, LockKeyhole, RotateCcw, X } from 'lucide-react-native';
import { useComposer } from '../state/ComposerContext';
import { transformText } from '../styleEngine';
import { colors, radii } from '../theme/tokens';
import { ActionButton, Eyebrow, Screen, Wordmark, type } from '../components/ui';

export default function ProScreen() {
  const { pro } = useComposer();
  const close = () => router.canGoBack() ? router.back() : router.replace('/');

  return (
    <Screen contentStyle={styles.screenContent} footer={
      <View>
        {pro.message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{pro.message}</Text> : null}
        <View style={styles.purchaseBar}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>{pro.isPro ? 'LIFETIME PRO' : 'PAY ONCE'}</Text>
            <Text numberOfLines={2} style={styles.price}>{pro.isPro ? 'Unlocked' : pro.price || 'Store price'}</Text>
          </View>
          {pro.isPro ? (
            <ActionButton onPress={close} variant="dark" icon={<Check size={17} color={colors.white} />}>Continue</ActionButton>
          ) : (
            <ActionButton
              onPress={pro.purchase}
              busy={pro.busy}
              variant="primary"
              accessibilityLabel={pro.price ? `Unlock Lifetime Pro for ${pro.price}` : 'Unlock Lifetime Pro'}
              icon={<LockKeyhole size={17} color={colors.white} />}
            >
              Unlock lifetime
            </ActionButton>
          )}
        </View>
      </View>
    }>
      <View style={styles.topbar}>
        <Wordmark height={27} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close Lifetime Pro" onPress={close} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <X size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Eyebrow light>LYFSTYLE PRO / LIFETIME</Eyebrow>
        <Text style={styles.title}>The collection,{`\n`}<Text style={styles.titleItalic}>fully yours.</Text></Text>
        <View style={styles.specimen} accessibilityLabel="Examples of Pro styles">
          <Text style={styles.specimenText}>{transformText('Make it yours.', 'bold-script')}</Text>
          <Text style={styles.specimenText}>{transformText('MAKE IT YOURS.', 'negative-circled')}</Text>
          <Text style={styles.specimenText}>{transformText('Make it yours.', 'strike')}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.intro}>Twelve more distinctive looks and three finishing touches. No subscription, account or ads.</Text>
        <View style={styles.benefits}>
          <Benefit>12 additional hand-audited Unicode styles</Benefit>
          <Benefit>Ornate, Sparkle and Botanical decorations</Benefit>
          <Benefit>Lifetime access with store restore support</Benefit>
        </View>

        <View style={styles.trustRow}>
          <Check size={17} color={colors.success} strokeWidth={1.8} />
          <Text style={styles.trustText}>The same private, on-device typing experience.</Text>
        </View>

        {!pro.connected && Platform.OS !== 'web' && !pro.isPro ? (
          <Text style={styles.storeStatus}>Connecting to the store… You can still use Restore Purchases.</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: pro.busy, busy: pro.busy }}
          onPress={pro.restore}
          disabled={pro.busy}
          style={({ pressed }) => [styles.restore, pressed && styles.pressed]}
        >
          <RotateCcw size={15} color={colors.ink} />
          <Text style={styles.restoreText}>Restore purchases</Text>
        </Pressable>

        <Text style={styles.legal}>
          Your app store confirms the final local price and processes payment. Lyfstyle never receives your payment details. Pro access is restored through your store account.
        </Text>
      </View>
    </Screen>
  );
}

function Benefit({ children }: { children: string }) {
  return (
    <View style={styles.benefit}>
      <View style={styles.benefitIcon}><Check size={14} color={colors.accentDeep} strokeWidth={2} /></View>
      <Text style={styles.benefitText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: 20, maxWidth: 680 },
  topbar: { paddingTop: 6, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: colors.ink, borderRadius: radii.large, paddingHorizontal: 23, paddingTop: 24, paddingBottom: 23, overflow: 'hidden' },
  title: { fontFamily: type.display, fontSize: 39, lineHeight: 44, letterSpacing: -1, color: colors.canvas, marginTop: 13 },
  titleItalic: { fontFamily: type.displayItalic, color: colors.accent },
  specimen: { marginTop: 22, paddingTop: 17, borderTopWidth: 1, borderTopColor: '#413B35', gap: 8 },
  specimenText: { color: colors.canvas, fontSize: 18, lineHeight: 27 },
  body: { paddingTop: 22, paddingBottom: 24 },
  intro: { fontFamily: type.sans, color: colors.muted, fontSize: 14, lineHeight: 22 },
  benefits: { marginTop: 20, gap: 13 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  benefitIcon: { width: 25, height: 25, borderRadius: 25, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontFamily: type.medium, color: colors.ink, fontSize: 13, lineHeight: 20 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 23, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  trustText: { flex: 1, fontFamily: type.sans, color: colors.muted, fontSize: 12, lineHeight: 19 },
  priceBlock: { flex: 1, paddingRight: 12, justifyContent: 'center' },
  priceLabel: { fontFamily: type.mono, color: colors.muted, fontSize: 10, letterSpacing: 0.9 },
  price: { fontFamily: type.display, color: colors.ink, fontSize: 23, lineHeight: 28, marginTop: 2 },
  purchaseBar: { flexDirection: 'row', alignItems: 'center' },
  storeStatus: { fontFamily: type.sans, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
  message: { fontFamily: type.medium, color: colors.success, fontSize: 12, lineHeight: 18, marginBottom: 9, textAlign: 'center' },
  restore: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 },
  restoreText: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  legal: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 18, marginTop: 8, textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
