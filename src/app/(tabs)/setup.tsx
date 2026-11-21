import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Check, ChevronRight, Copy, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react-native';
import NativeKeyboard, { type AndroidKeyboardStatus } from '@/nativeKeyboard';
import { useComposer } from '../../state/ComposerContext';
import { colors } from '../../theme/tokens';
import { ActionButton, Eyebrow, PageTitle, Screen, Wordmark, type } from '../../components/ui';

export default function SetupScreen() {
  const composer = useComposer();
  const [status, setStatus] = useState<AndroidKeyboardStatus>({ enabled: false, selected: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

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
      <View style={styles.header}><Wordmark /><Eyebrow>DEVICE SETUP</Eyebrow></View>
      <PageTitle title="Your keyboard," italic="re-composed.">
        Style as you type, or keep using the composer. The keyboard never shows purchases, ads or rating prompts.
      </PageTitle>

      {Platform.OS === 'web' ? (
        <View style={styles.webNotice}>
          <Eyebrow light>WEB PREVIEW</Eyebrow>
          <Text style={styles.webTitle}>Native setup happens on your phone.</Text>
          <Text style={styles.webCopy}>This browser preview includes the working composer and catalogue. Keyboard installation and purchases require an iPhone or Android development/store build.</Text>
        </View>
      ) : null}

      {Platform.OS === 'android' ? (
        <View style={styles.setupBlock}>
          <View style={styles.statusRow}>
            <StatusItem label="Installed" complete={status.enabled} />
            <StatusItem label="Selected" complete={status.selected} />
            <Pressable accessibilityLabel="Refresh keyboard status" onPress={() => void refresh()} style={styles.refresh}><RefreshCw size={17} color={colors.ink} /></Pressable>
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
        <ShieldCheck size={26} color={colors.coralDark} strokeWidth={1.5} />
        <Text style={styles.privacyTitle}>Your typing stays yours.</Text>
        <Text style={styles.privacyCopy}>No account, analytics, ads, prediction engine or keystroke-upload code. Password, email, URL, phone, numeric and OTP fields automatically use Normal mode.</Text>
        <Pressable onPress={() => router.push('/privacy')} style={styles.privacyLink}>
          <Text style={styles.privacyLinkText}>Read the plain-English privacy note</Text>
          <ChevronRight size={16} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.fullAccess}>
        <Eyebrow>ABOUT FULL ACCESS ON IPHONE</Eyebrow>
        <Text style={styles.fullAccessTitle}>Optional, not the price of admission.</Text>
        <Text style={styles.fullAccessCopy}>Core typing works without it. Lyfstyle tests direct StoreKit entitlement reading first; optional Full Access is only a fallback for sharing Pro status through the private App Group when that direct path is unavailable.</Text>
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
      <Text style={styles.stepNumber}>{number}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepCopy}>{copy}</Text>
      <ActionButton onPress={onPress} variant="dark" busy={busy} icon={<ExternalLink size={16} color={colors.white} />}>{action}</ActionButton>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  webNotice: { backgroundColor: colors.ink, padding: 20, marginBottom: 22 },
  webTitle: { fontFamily: type.serif, color: colors.ivory, fontSize: 27, marginTop: 7 },
  webCopy: { fontFamily: type.sans, color: '#D7D2C8', fontSize: 13, lineHeight: 20, marginTop: 8 },
  setupBlock: { borderTopWidth: 1, borderTopColor: colors.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.line },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 17, height: 17, borderRadius: 17, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  statusDotComplete: { backgroundColor: colors.success, borderColor: colors.success },
  statusText: { fontFamily: type.medium, fontSize: 12, color: colors.ink },
  refresh: { marginLeft: 'auto', width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  step: { paddingVertical: 23, borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: 'flex-start' },
  stepNumber: { fontFamily: type.bold, fontSize: 10, letterSpacing: 1, color: colors.coralDark },
  stepTitle: { fontFamily: type.serif, fontSize: 31, color: colors.ink, marginTop: 4 },
  stepCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 7, marginBottom: 17 },
  notice: { fontFamily: type.medium, color: colors.success, fontSize: 13, lineHeight: 20, marginTop: 16 },
  privacyBlock: { backgroundColor: colors.paper, padding: 20, marginTop: 28, borderLeftWidth: 3, borderLeftColor: colors.coralDark },
  privacyTitle: { fontFamily: type.serif, fontSize: 29, color: colors.ink, marginTop: 12 },
  privacyCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 21, color: colors.muted, marginTop: 8 },
  privacyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 },
  privacyLinkText: { fontFamily: type.semibold, fontSize: 12, color: colors.ink },
  fullAccess: { paddingVertical: 27 },
  fullAccessTitle: { fontFamily: type.serifItalic, fontSize: 26, color: colors.ink, marginTop: 7 },
  fullAccessCopy: { fontFamily: type.sans, fontSize: 12, lineHeight: 20, color: colors.muted, marginTop: 8, marginBottom: 18 },
});
