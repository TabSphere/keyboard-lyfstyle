import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Check, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Lock, RefreshCw, ShieldCheck } from 'lucide-react-native';
import NativeKeyboard, { type AndroidKeyboardStatus } from '@/nativeKeyboard';
import { useComposer } from '../../state/ComposerContext';
import { themes, type KeyboardTheme } from '../../styleEngine';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, Eyebrow, PageTitle, Screen, TopBar, type } from '../../components/ui';

const THEME_KEY = 'lyfstyle.keyboardTheme';

export default function KeyboardScreen() {
  const { pro } = useComposer();
  const [status, setStatus] = useState<AndroidKeyboardStatus>({ enabled: false, selected: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [themeId, setThemeId] = useState(themes[0].id);
  const [fullAccessOpen, setFullAccessOpen] = useState(false);
  const current = themes.find((item) => item.id === themeId) ?? themes[0];

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value && themes.some((item) => item.id === value)) setThemeId(value);
    }).catch(() => undefined);
  }, []);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      setStatus(await NativeKeyboard.getAndroidKeyboardStatus());
    } catch {
      setNotice('Keyboard status needs the Android app.');
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
      setNotice('Open this screen in the iPhone or Android app to continue.');
    } finally {
      setBusy(false);
    }
  };

  const chooseTheme = async (theme: KeyboardTheme) => {
    if (theme.isPro && !pro.isPro) {
      router.push('/pro');
      return;
    }
    setThemeId(theme.id);
    await AsyncStorage.setItem(THEME_KEY, theme.id).catch(() => undefined);
    if (Platform.OS === 'web') return;
    try {
      await NativeKeyboard.setKeyboardTheme(theme.id);
      setNotice(Platform.OS === 'ios'
        ? `${theme.name} saved. With Full Access off, pick it from the 🎨 button on the keyboard.`
        : `${theme.name} is now your keyboard theme.`);
    } catch {
      setNotice('Pick this theme from the 🎨 button on the keyboard.');
    }
  };

  return (
    <Screen>
      <TopBar isPro={pro.isPro} />
      <PageTitle title="Your" mark="keyboard">Style as you type in any app. Pick a theme, then switch it on.</PageTitle>

      <KeyboardPreview theme={current} />

      <View style={styles.sectionHead}>
        <Eyebrow>THEMES · {themes.length}</Eyebrow>
        <Text style={styles.sectionNote}>{themes.filter((item) => !item.isPro).length} free</Text>
      </View>
      <View style={styles.themeGrid}>
        {themes.map((theme) => {
          const locked = theme.isPro && !pro.isPro;
          const active = theme.id === themeId;
          return (
            <Pressable
              key={theme.id}
              accessibilityRole="button"
              accessibilityLabel={`${theme.name} keyboard theme${locked ? ', Pro' : ''}${active ? ', selected' : ''}`}
              onPress={() => void chooseTheme(theme)}
              style={({ pressed }) => [styles.theme, { backgroundColor: theme.background }, active && styles.themeActive, pressed && styles.pressed]}
            >
              <View style={styles.themeKeys}>
                {[0, 1, 2, 3].map((index) => <View key={index} style={[styles.themeKey, { backgroundColor: index === 3 ? theme.accent : theme.key }]} />)}
              </View>
              <View style={styles.themeFoot}>
                <Text numberOfLines={1} style={[styles.themeName, { color: theme.text }]}>{theme.name}</Text>
                {locked ? <Lock size={11} color={theme.text} strokeWidth={2.6} /> : active ? <Check size={13} color={theme.text} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

      <View style={styles.setup}>
        <Eyebrow>SWITCH IT ON</Eyebrow>
        {Platform.OS === 'web' ? (
          <Text style={styles.stepCopy}>Keyboard setup happens in the iPhone or Android app. Everything else works here.</Text>
        ) : null}
        {Platform.OS === 'android' ? (
          <>
            <View style={styles.statusRow}>
              <StatusItem label="Enabled" complete={status.enabled} />
              <StatusItem label="Selected" complete={status.selected} />
              <Pressable accessibilityRole="button" accessibilityLabel="Refresh keyboard status" onPress={() => void refresh()} style={styles.refresh}>
                <RefreshCw size={17} color={colors.ink} />
              </Pressable>
            </View>
            <Step number="1" title="Enable Lyfstyle" copy="Turn Lyfstyle on in your keyboard list. Android shows its usual warning for any new keyboard." action="Open keyboard settings" onPress={() => run(NativeKeyboard.openKeyboardSettings)} busy={busy} />
            <Step number="2" title="Make it active" copy="Choose Lyfstyle in the keyboard picker. You can switch back any time." action="Show keyboard picker" onPress={() => run(NativeKeyboard.showKeyboardPicker)} busy={busy} />
          </>
        ) : null}
        {Platform.OS === 'ios' ? (
          <>
            <Step number="1" title="Add the keyboard" copy="Settings → General → Keyboard → Keyboards → Add New Keyboard → Lyfstyle." action="Open Settings" onPress={() => run(NativeKeyboard.openKeyboardSettings)} busy={busy} />
            <Step number="2" title="Switch while typing" copy="Hold the 🌐 globe on your keyboard and choose Lyfstyle. Typing works without Full Access." />
          </>
        ) : null}
      </View>

      <View style={styles.privacy}>
        <View style={styles.privacyHead}>
          <ShieldCheck size={22} color={colors.brand} strokeWidth={2} />
          <Text style={styles.privacyTitle}>Your typing stays yours.</Text>
        </View>
        <Text style={styles.privacyCopy}>No account, ads, analytics or keystroke uploads. Password, email, web address, phone, number and one-time-code fields always type normal text.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/privacy')} style={styles.privacyLink}>
          <Text style={styles.privacyLinkText}>Read the privacy note</Text>
          <ChevronRight size={16} color={colors.brand} />
        </Pressable>
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: fullAccessOpen }} onPress={() => setFullAccessOpen((open) => !open)} style={styles.faq}>
        <Text style={styles.faqTitle}>Do I need “Full Access” on iPhone?</Text>
        {fullAccessOpen ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
      </Pressable>
      {fullAccessOpen ? (
        <Text style={styles.faqCopy}>No. Typing, styles and themes work without it. Full Access only lets the app pass your theme choice and Pro status to the keyboard automatically; without it, pick themes with the 🎨 button on the keyboard.</Text>
      ) : null}
    </Screen>
  );
}

function KeyboardPreview({ theme }: { theme: KeyboardTheme }) {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  return (
    <View style={[styles.preview, { backgroundColor: theme.background }]} accessibilityLabel={`Preview of the ${theme.name} keyboard`}>
      <View style={styles.previewBar}>
        {['𝓢𝓬𝓻𝓲𝓹𝓽', '✨ ✨', '𝗕𝗼𝗹𝗱', 'ⓑⓤⓑ', '(◕‿◕)'].map((label, index) => (
          <View key={label} style={[styles.previewChip, { backgroundColor: index === 0 ? theme.accent : theme.key }]}>
            <Text style={[styles.previewChipText, { color: index === 0 ? accentText(theme.accent) : theme.text }]}>{label}</Text>
          </View>
        ))}
      </View>
      {rows.map((row) => (
        <View key={row} style={styles.previewRow}>
          {Array.from(row).map((letter) => (
            <View key={letter} style={[styles.previewKey, { backgroundColor: theme.key }]}>
              <Text style={[styles.previewKeyText, { color: theme.text }]}>{letter}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={styles.previewRow}>
        <View style={[styles.previewKey, styles.previewWide, { backgroundColor: theme.key }]}><Text style={[styles.previewKeyText, { color: theme.text }]}>123</Text></View>
        <View style={[styles.previewKey, styles.previewSpace, { backgroundColor: theme.key }]}><Text style={[styles.previewKeyText, { color: theme.secondary }]}>lyfstyle</Text></View>
        <View style={[styles.previewKey, styles.previewWide, { backgroundColor: theme.accent }]}><Text style={[styles.previewKeyText, { color: accentText(theme.accent) }]}>↵</Text></View>
      </View>
    </View>
  );
}

function accentText(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55 ? colors.ink : colors.white;
}

function StatusItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusDot, complete && styles.statusDotComplete]}>{complete ? <Check size={10} color={colors.white} /> : null}</View>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

function Step({ number, title, copy, action, onPress, busy = false }: {
  number: string; title: string; copy: string; action?: string; onPress?: () => void | Promise<void>; busy?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHead}>
        <Text style={styles.stepNumber}>{number}</Text>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepCopy}>{copy}</Text>
      {action && onPress ? (
        <ActionButton onPress={onPress} busy={busy} variant="dark" icon={<ExternalLink size={16} color={colors.white} />}>{action}</ActionButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { borderRadius: radii.large, padding: 8, gap: 6, marginBottom: 18 },
  previewBar: { flexDirection: 'row', gap: 5, overflow: 'hidden', marginBottom: 2 },
  previewChip: { borderRadius: radii.pill, paddingHorizontal: 10, height: 28, justifyContent: 'center' },
  previewChipText: { fontSize: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  previewKey: { flex: 1, maxWidth: 34, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  previewKeyText: { fontFamily: type.semibold, fontSize: 15 },
  previewWide: { maxWidth: 56, flex: 1.6 },
  previewSpace: { maxWidth: 220, flex: 6 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionNote: { fontFamily: type.bold, fontSize: 12, color: colors.muted },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  theme: { width: '31%', borderRadius: radii.medium, padding: 9, borderWidth: 3, borderColor: 'transparent' },
  themeActive: { borderColor: colors.ink },
  themeKeys: { flexDirection: 'row', gap: 3 },
  themeKey: { flex: 1, height: 16, borderRadius: 4 },
  themeFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 4 },
  themeName: { flex: 1, fontFamily: type.bold, fontSize: 11 },
  notice: { fontFamily: type.semibold, color: colors.success, fontSize: 13, lineHeight: 19, marginTop: 12 },
  setup: { marginTop: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  statusDotComplete: { backgroundColor: colors.success, borderColor: colors.success },
  statusText: { fontFamily: type.bold, fontSize: 12, color: colors.ink },
  refresh: { marginLeft: 'auto', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  step: { backgroundColor: colors.surface, borderRadius: radii.large, padding: 16, marginTop: 10, gap: 6 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.sun, textAlign: 'center', lineHeight: 26, fontFamily: type.black, fontSize: 13, color: colors.ink, overflow: 'hidden' },
  stepTitle: { fontFamily: type.displayBold, fontSize: 19, color: colors.ink },
  stepCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 20, color: colors.muted, marginBottom: 6 },
  privacy: { backgroundColor: colors.peachSoft, borderRadius: radii.large, padding: 16, marginTop: 20 },
  privacyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyTitle: { fontFamily: type.displayBold, fontSize: 19, color: colors.ink },
  privacyCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 6 },
  privacyLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, minHeight: 36 },
  privacyLinkText: { fontFamily: type.black, fontSize: 13, color: colors.brand },
  faq: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56, marginTop: 10 },
  faqTitle: { fontFamily: type.bold, fontSize: 14, color: colors.ink, flex: 1 },
  faqCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 20, color: colors.muted },
  pressed: { opacity: 0.75 },
});
