import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Check, ChevronRight, ExternalLink, RotateCcw, Sparkles } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useComposer } from '../state/ComposerContext';
import { colors, radii } from '../theme/tokens';
import { ActionButton, BackBar, Eyebrow, PageTitle, Screen, type } from '../components/ui';

export default function SettingsScreen() {
  const composer = useComposer();
  const { pro } = composer;
  const [resetArmed, setResetArmed] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const resetDraft = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    composer.setText('');
    setResetArmed(false);
  };

  return (
    <Screen>
      <BackBar title="Settings" />
      <PageTitle title="Settings &" mark="privacy">Everything stays on this phone. No account needed.</PageTitle>

      <Pressable accessibilityRole="button" onPress={() => router.push('/pro')} style={({ pressed }) => [styles.pro, pressed && styles.pressed]}>
        <Sparkles size={22} color={colors.ink} strokeWidth={2.2} />
        <View style={styles.proBody}>
          <Text style={styles.proTitle}>{pro.isPro ? 'Lifetime Pro is active ♡' : 'Get Lifetime Pro'}</Text>
          <Text style={styles.proCopy}>{pro.isPro ? 'Every style, theme and preset pack is yours.' : 'All styles, themes and preset packs. Pay once.'}</Text>
        </View>
        <ChevronRight size={20} color={colors.ink} />
      </Pressable>

      <View style={styles.menu}>
        <Row title="Privacy, in plain English" subtitle="What stays on your device, and why" href="/privacy" />
        <Row title="How styled text works" subtitle="Unicode, compatibility and safe fields" href="/about" />
        <Row title="Keyboard setup & themes" subtitle="Switch the keyboard on, pick a theme" href="/keyboard" />
        <Row title="Help & feedback" subtitle="Report a problem or suggest a style" external onPress={() => void Linking.openURL('https://github.com/TabSphere/keyboard-lyfstyle/issues')} />
      </View>

      <View style={styles.section}>
        <Eyebrow>PURCHASES</Eyebrow>
        <Text style={styles.copy}>Bought Pro before? Restore it from Apple or Google for free.</Text>
        <ActionButton onPress={pro.restore} busy={pro.busy} variant="outline" icon={<RotateCcw size={16} color={colors.ink} />}>Restore purchases</ActionButton>
        {pro.message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{pro.message}</Text> : null}
      </View>

      <View style={styles.section}>
        <Eyebrow>YOUR DRAFT</Eyebrow>
        <Text style={styles.copy}>Your text, saved styles and recents are stored only in this app.</Text>
        <Pressable accessibilityRole="button" onPress={resetDraft} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
          <Text style={[styles.resetText, resetArmed && { color: colors.pink }]}>{resetArmed ? 'Tap again to clear your text' : 'Clear my text'}</Text>
          {resetArmed ? <Check size={16} color={colors.pink} /> : null}
        </Pressable>
      </View>

      <Text style={styles.footer}>Lyfstyle {version} · TabSphere Ltd</Text>
    </Screen>
  );
}

function Row({ title, subtitle, href, onPress, external = false }: {
  title: string; subtitle: string; href?: Href; onPress?: () => void; external?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => href && router.push(href))}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {external ? <ExternalLink size={17} color={colors.tertiary} /> : <ChevronRight size={19} color={colors.tertiary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pro: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.sun, borderRadius: radii.large, padding: 16 },
  proBody: { flex: 1 },
  proTitle: { fontFamily: type.displayBold, fontSize: 18, color: colors.ink },
  proCopy: { fontFamily: type.sans, fontSize: 13, color: colors.ink, marginTop: 2 },
  menu: { backgroundColor: colors.surface, borderRadius: radii.large, marginTop: 14, paddingHorizontal: 16 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: type.bold, fontSize: 15, color: colors.ink },
  rowSubtitle: { fontFamily: type.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  section: { marginTop: 24, alignItems: 'stretch' },
  copy: { fontFamily: type.sans, fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 6, marginBottom: 12 },
  message: { fontFamily: type.semibold, color: colors.brandDeep, fontSize: 13, marginTop: 10 },
  reset: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetText: { fontFamily: type.black, fontSize: 14, color: colors.ink, textDecorationLine: 'underline' },
  footer: { fontFamily: type.semibold, fontSize: 12, color: colors.tertiary, textAlign: 'center', marginTop: 32 },
  pressed: { opacity: 0.75 },
});
