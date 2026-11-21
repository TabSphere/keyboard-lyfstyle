import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ExternalLink, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { colors } from '../../theme/tokens';
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
      <View style={styles.header}><Wordmark /><Text style={styles.version}>VERSION 1.0.0</Text></View>
      <PageTitle title="The small" italic="print.">
        Clear choices, local storage and no hidden data pipeline.
      </PageTitle>

      <View style={styles.proPanel}>
        <View style={styles.proPanelTop}>
          {pro.isPro ? <ShieldCheck size={25} color={colors.ivory} strokeWidth={1.5} /> : <Sparkles size={25} color={colors.ivory} strokeWidth={1.5} />}
          <Eyebrow light>{pro.isPro ? 'LIFETIME PRO / ACTIVE' : 'LYFSTYLE / FREE'}</Eyebrow>
        </View>
        <Text style={styles.proTitle}>{pro.isPro ? 'Every look is yours.' : 'Keep the whole collection.'}</Text>
        <Text style={styles.proCopy}>{pro.isPro ? 'Your 12 Pro styles and Pro decorations are unlocked on this device.' : '12 styles are free forever. Lifetime Pro adds 12 more, plus three Pro decorations—one purchase, no subscription.'}</Text>
        <ActionButton onPress={() => router.push('/pro')} variant="primary">{pro.isPro ? 'Manage Lifetime Pro' : 'See Lifetime Pro'}</ActionButton>
      </View>

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
        <Pressable onPress={resetDraft} style={styles.resetButton}>
          <Text style={styles.resetText}>{resetArmed ? 'Tap again to clear your draft' : 'Clear draft'}</Text>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuCopy}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {external ? <ExternalLink size={17} color={colors.muted} /> : <ChevronRight size={19} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  version: { fontFamily: type.bold, fontSize: 9, letterSpacing: 1, color: colors.muted },
  proPanel: { backgroundColor: colors.ink, padding: 22 },
  proPanelTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  proTitle: { fontFamily: type.serif, color: colors.ivory, fontSize: 34, lineHeight: 38, marginTop: 18 },
  proCopy: { fontFamily: type.sans, color: '#D7D2C8', fontSize: 13, lineHeight: 21, marginTop: 8, marginBottom: 19 },
  menu: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.ink },
  menuRow: { minHeight: 77, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  menuCopy: { flex: 1 },
  menuTitle: { fontFamily: type.semibold, fontSize: 14, color: colors.ink },
  menuSubtitle: { fontFamily: type.sans, fontSize: 11, lineHeight: 17, color: colors.muted, marginTop: 4 },
  pressed: { opacity: 0.6 },
  purchaseSection: { marginTop: 29, alignItems: 'flex-start' },
  sectionCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 8, marginBottom: 16 },
  message: { fontFamily: type.medium, color: colors.success, fontSize: 12, lineHeight: 19, marginTop: 12 },
  localSection: { alignItems: 'flex-start' },
  resetButton: { minHeight: 42, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.coralDark },
  resetText: { fontFamily: type.semibold, color: colors.coralDark, fontSize: 13 },
  footer: { fontFamily: type.bold, color: colors.muted, fontSize: 9, lineHeight: 17, letterSpacing: 1.2, marginTop: 36 },
});
