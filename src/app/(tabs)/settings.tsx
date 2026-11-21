import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronRight, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, Divider, Eyebrow, PageTitle, Screen, Wordmark, type } from '../../components/ui';

export default function SettingsScreen() {
  const composer = useComposer();
  const { pro } = composer;
  const [resetArmed, setResetArmed] = useState(false);

  const resetDraft = () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    composer.setText('');
    composer.selectStyle('script');
    composer.selectDecoration('');
    setResetArmed(false);
  };

  return (
    <Screen>
      <View style={styles.header}><Wordmark height={27} /><Text style={styles.version}>VERSION 1.0.0</Text></View>
      <PageTitle title="Settings &" italic="privacy." compact>
        Clear choices, local storage and no hidden data pipeline.
      </PageTitle>

      <View style={styles.menu}>
        <MenuRow title="Privacy, in plain English" subtitle="What stays on your device—and why" onPress={() => router.push('/privacy')} />
        <MenuRow title="How Unicode styling works" subtitle="Compatibility, Normal mode and limitations" onPress={() => router.push('/about')} />
        <MenuRow title="Keyboard setup" subtitle={Platform.OS === 'web' ? 'Native setup instructions' : 'Enable, switch or check your keyboard'} onPress={() => router.push('/setup')} />
        <MenuRow
          title="Support & known issues"
          subtitle="Open the project issue tracker"
          external
          onPress={() => void Linking.openURL('https://github.com/TabSphere/keyboard-lyfstyle/issues')}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={pro.isPro ? 'Manage active Lifetime Pro' : 'View Lifetime Pro'}
        onPress={() => router.push('/pro')}
        style={({ pressed }) => [styles.proPanel, pressed && styles.pressed]}
      >
        <View style={styles.proIcon}>
          {pro.isPro ? <ShieldCheck size={22} color={colors.accentDeep} strokeWidth={1.6} /> : <Sparkles size={22} color={colors.accentDeep} strokeWidth={1.6} />}
        </View>
        <View style={styles.proCopyBlock}>
          <Eyebrow>{pro.isPro ? 'LIFETIME PRO / ACTIVE' : 'LYFSTYLE / FREE'}</Eyebrow>
          <Text style={styles.proTitle}>{pro.isPro ? 'Every look is yours.' : 'Unlock the full collection.'}</Text>
          <Text style={styles.proCopy}>{pro.isPro ? '12 Pro styles and Pro decorations are available on this device.' : '12 more styles and three decorations. Pay once, no subscription.'}</Text>
        </View>
        <ChevronRight size={19} color={colors.accentDeep} />
      </Pressable>

      <View style={styles.purchaseSection}>
        <Eyebrow>PURCHASES</Eyebrow>
        <Text style={styles.sectionCopy}>Bought Lyfstyle before? Restore directly from Apple or Google. No Lyfstyle account is needed.</Text>
        <ActionButton onPress={pro.restore} busy={pro.busy} variant="outline" icon={<RotateCcw size={16} color={colors.ink} />}>Restore purchases</ActionButton>
        {pro.message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{pro.message}</Text> : null}
      </View>

      <Divider />

      <View style={styles.localSection}>
        <Eyebrow>YOUR LOCAL DRAFT</Eyebrow>
        <Text style={styles.sectionCopy}>Your draft, recent looks and favorites are stored only in this app on this device. Clearing the draft does not affect purchases.</Text>
        <Pressable accessibilityRole="button" onPress={resetDraft} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
          <Text style={[styles.resetText, resetArmed && styles.resetTextArmed]}>{resetArmed ? 'Tap again to clear your draft' : 'Clear draft'}</Text>
          {resetArmed ? <Check size={16} color={colors.accentDeep} /> : null}
        </Pressable>
      </View>

      <Text style={styles.footer}>LYFSTYLE / TABSPHERE LTD{'\n'}TEXT, WITH A POINT OF VIEW.</Text>
    </Screen>
  );
}

function MenuRow({ title, subtitle, onPress, external = false }: {
  title: string;
  subtitle: string;
  onPress: () => void;
  external?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {external ? <ExternalLink size={17} color={colors.tertiary} /> : <ChevronRight size={19} color={colors.tertiary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  version: { fontFamily: type.mono, fontSize: 10, letterSpacing: 0.6, color: colors.muted },
  menu: { borderTopWidth: 1, borderTopColor: colors.line },
  menuRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  menuCopy: { flex: 1 },
  menuTitle: { fontFamily: type.semibold, fontSize: 14, color: colors.ink },
  menuSubtitle: { fontFamily: type.sans, fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 3 },
  proPanel: { marginTop: 22, borderRadius: radii.medium, padding: 16, backgroundColor: colors.accentTint, borderWidth: 1, borderColor: '#F2D2C7', flexDirection: 'row', alignItems: 'center', gap: 12 },
  proIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  proCopyBlock: { flex: 1 },
  proTitle: { fontFamily: type.display, color: colors.ink, fontSize: 22, lineHeight: 27, marginTop: 4 },
  proCopy: { fontFamily: type.sans, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  pressed: { opacity: 0.65 },
  purchaseSection: { marginTop: 27, alignItems: 'flex-start' },
  sectionCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 8, marginBottom: 16 },
  message: { fontFamily: type.medium, color: colors.success, fontSize: 12, lineHeight: 19, marginTop: 12 },
  localSection: { alignItems: 'flex-start' },
  resetButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.ink },
  resetText: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  resetTextArmed: { color: colors.accentDeep },
  footer: { fontFamily: type.mono, color: colors.tertiary, fontSize: 10, lineHeight: 18, letterSpacing: 0.8, marginTop: 32 },
});
