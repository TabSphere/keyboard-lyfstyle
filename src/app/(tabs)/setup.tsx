import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Check, ChevronDown, ChevronRight, ChevronUp, Copy, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react-native';
import NativeKeyboard, { type AndroidKeyboardStatus } from '@/nativeKeyboard';
import { useComposer } from '../../state/ComposerContext';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, Eyebrow, PageTitle, Screen, Wordmark, type } from '../../components/ui';

export default function SetupScreen() {
  const composer = useComposer();
  const [status, setStatus] = useState<AndroidKeyboardStatus>({ enabled: false, selected: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [fullAccessOpen, setFullAccessOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      setStatus(await NativeKeyboard.getAndroidKeyboardStatus());
    } catch {
      setNotice('Keyboard status needs a native Android build.');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setNotice('');
    try {
      await action();
      if (Platform.OS === 'android') await refresh();
    } catch {
      setNotice('Open this screen in the native iPhone or Android app to continue.');
    } finally {
      setBusy(false);
    }
  };

  const copySample = async () => {
    await Clipboard.setStringAsync(composer.output || 'Make it yours.');
    setNotice('Preview copied. Paste it into any app to compare.');
  };

  return (
    <Screen>
      <View style={styles.header}><Wordmark height={27} /><Eyebrow>DEVICE SETUP</Eyebrow></View>
      <PageTitle title="Meet your" italic="keyboard." compact>
        Style as you type. No ads, purchases or rating prompts inside the keyboard.
      </PageTitle>

      {Platform.OS === 'web' ? (
        <View style={styles.webNotice}>
          <View style={styles.webHeading}>
            <Eyebrow light>WEB PREVIEW</Eyebrow>
            <Text style={styles.webTitle}>Setup continues on your phone.</Text>
          </View>
          <Text style={styles.webCopy}>The composer works here. Keyboard installation and purchases require a native iPhone or Android build.</Text>
        </View>
      ) : null}

      {Platform.OS === 'android' ? (
        <View style={styles.setupBlock}>
          <View style={styles.statusRow}>
            <StatusItem label="Installed" complete={status.enabled} />
            <StatusItem label="Selected" complete={status.selected} />
            <Pressable accessibilityRole="button" accessibilityLabel="Refresh keyboard status" onPress={() => void refresh()} style={styles.refresh}>
              <RefreshCw size={17} color={colors.ink} />
            </Pressable>
          </View>
          <SetupStep
            number="01"
            title="Enable Lyfstyle"
            copy="Allow Lyfstyle in your device’s keyboard list. Android shows its standard input-method warning before you enable any custom keyboard."
            action="Open keyboard settings"
            onPress={() => run(NativeKeyboard.openKeyboardSettings)}
            busy={busy}
          />
          <SetupStep
            number="02"
            title="Make it active"
            copy="Choose Lyfstyle from the input-method picker. You can switch back to your usual keyboard at any time."
            action="Show keyboard picker"
            onPress={() => run(NativeKeyboard.showKeyboardPicker)}
            busy={busy}
          />
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <View style={styles.setupBlock}>
          <SetupStep
            number="01"
            title="Add the keyboard"
            copy="In Settings, go to General → Keyboard → Keyboards → Add New Keyboard, then choose Lyfstyle."
            action="Open Lyfstyle settings"
            onPress={() => run(NativeKeyboard.openKeyboardSettings)}
            busy={busy}
          />
          <SetupStep
            number="02"
            title="Switch while typing"
            copy="Tap and hold the globe on your current keyboard, then choose Lyfstyle. Core typing works without Full Access."
            action="Copy a test phrase"
            onPress={copySample}
            busy={false}
          />
        </View>
      ) : null}

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

      <View style={styles.privacyBlock}>
        <View style={styles.privacyHeading}>
          <ShieldCheck size={23} color={colors.accentDeep} strokeWidth={1.6} />
          <Text style={styles.privacyTitle}>Your typing stays yours.</Text>
        </View>
        <Text style={styles.privacyCopy}>No account, analytics, ads, prediction engine or keystroke-upload code. Password, email, URL, phone, numeric and OTP fields automatically use Normal mode.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/privacy')} style={({ pressed }) => [styles.privacyLink, pressed && styles.pressed]}>
          <Text style={styles.privacyLinkText}>Read the plain-English privacy note</Text>
          <ChevronRight size={16} color={colors.accentDeep} />
        </Pressable>
      </View>

      <View style={styles.fullAccess}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: fullAccessOpen }}
          onPress={() => setFullAccessOpen((open) => !open)}
          style={styles.fullAccessToggle}
        >
          <View style={styles.fullAccessToggleCopy}>
            <Eyebrow>FULL ACCESS ON IPHONE</Eyebrow>
            <Text style={styles.fullAccessTitle}>Optional, not required.</Text>
          </View>
          {fullAccessOpen ? <ChevronUp size={19} color={colors.muted} /> : <ChevronDown size={19} color={colors.muted} />}
        </Pressable>
        {fullAccessOpen ? (
          <Text style={styles.fullAccessCopy}>Core typing works without it. Lyfstyle reads StoreKit entitlements directly first. Full Access is only an optional fallback for sharing Pro status through the private App Group when that direct path is unavailable.</Text>
        ) : null}
      </View>

      <ActionButton onPress={() => router.push('/')} variant="outline" icon={<Copy size={17} color={colors.ink} />}>Try the composer</ActionButton>
    </Screen>
  );
}

function StatusItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, complete && styles.statusDotComplete]}>{complete ? <Check size={10} color={colors.white} /> : null}</View>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

function SetupStep({ number, title, copy, action, onPress, busy }: {
  number: string;
  title: string;
  copy: string;
  action: string;
  onPress: () => void | Promise<void>;
  busy: boolean;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHeading}>
        <Text style={styles.stepNumber}>{number}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepCopy}>{copy}</Text>
      <ActionButton onPress={onPress} variant="dark" busy={busy} icon={<ExternalLink size={16} color={colors.white} />}>{action}</ActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  webNotice: { backgroundColor: colors.ink, borderRadius: radii.medium, padding: 18, marginBottom: 20 },
  webHeading: { gap: 6 },
  webTitle: { fontFamily: type.display, color: colors.canvas, fontSize: 24, lineHeight: 30 },
  webCopy: { fontFamily: type.sans, color: '#CEC7BC', fontSize: 12, lineHeight: 19, marginTop: 9 },
  setupBlock: { borderTopWidth: 1, borderTopColor: colors.line },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 18, height: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  statusDotComplete: { backgroundColor: colors.success, borderColor: colors.success },
  statusText: { fontFamily: type.medium, fontSize: 12, color: colors.ink },
  refresh: { marginLeft: 'auto', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  step: { paddingVertical: 21, borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: 'flex-start' },
  stepHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  stepNumber: { fontFamily: type.mono, fontSize: 11, letterSpacing: 0.6, color: colors.accentDeep },
  stepTitle: { fontFamily: type.display, fontSize: 27, lineHeight: 33, color: colors.ink },
  stepCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 8, marginBottom: 16 },
  notice: { fontFamily: type.medium, color: colors.success, fontSize: 13, lineHeight: 20, marginTop: 16 },
  privacyBlock: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radii.medium, padding: 19, marginTop: 24 },
  privacyHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyTitle: { fontFamily: type.display, fontSize: 24, lineHeight: 30, color: colors.ink },
  privacyCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 10 },
  privacyLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  privacyLinkText: { fontFamily: type.semibold, fontSize: 12, color: colors.ink },
  fullAccess: { paddingVertical: 20 },
  fullAccessToggle: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fullAccessToggleCopy: { flex: 1 },
  fullAccessTitle: { fontFamily: type.display, fontSize: 23, lineHeight: 29, color: colors.ink, marginTop: 4 },
  fullAccessCopy: { fontFamily: type.sans, fontSize: 12, lineHeight: 20, color: colors.muted, marginTop: 5, marginBottom: 15 },
  pressed: { opacity: 0.65 },
});
