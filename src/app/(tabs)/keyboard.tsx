import { useCallback, useState } from 'react';
import { ImageBackground, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Camera, Check, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Languages, Lock, Mic, Palette, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react-native';
import NativeKeyboard, { type AndroidKeyboardStatus } from '@/nativeKeyboard';
import { useComposer } from '../../state/ComposerContext';
import { getStyle, themes, type KeyboardTheme } from '../../styleEngine';
import { colors, radii } from '../../theme/tokens';
import { pickKeyboardPhoto, removeKeyboardPhoto } from '../../tools/keyboardPhoto';
import { ActionButton, Chip, ChipRow, Eyebrow, PageTitle, Screen, TopBar, type } from '../../components/ui';
import {
  CUSTOM_KEY, DEFAULT_CUSTOM, KeyboardPreview, PHOTO_DIM_KEY, PHOTO_KEY, PHOTO_THEME, THEME_KEY,
  customTheme, keyColor, pictureSource, type CustomColours,
} from '../../components/KeyboardPreview';

const colourThemes = themes.filter((item) => !item.image);
const PICTURE_GROUPS = ['Cute & sweet', 'Nature & sky', 'Art', 'K-pop', 'Movies', 'Music', 'Pride', 'City & neon', 'Luxe & textures'];
const pictureGroups = PICTURE_GROUPS
  .map((group) => ({ group, items: themes.filter((item) => item.image && item.group === group) }))
  .filter((entry) => entry.items.length);
const PICTURES_SHOWN = 6;
const DARKNESS = [
  { label: 'None', value: 0 },
  { label: 'Light', value: 0.15 },
  { label: 'Medium', value: 0.3 },
  { label: 'Dark', value: 0.5 },
];

export default function KeyboardScreen() {
  const { pro, selectedStyle } = useComposer();
  const [status, setStatus] = useState<AndroidKeyboardStatus>({ enabled: false, selected: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [themeId, setThemeId] = useState(themes[0].id);
  const [fullAccessOpen, setFullAccessOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoDim, setPhotoDim] = useState(0.3);
  const [custom, setCustom] = useState<CustomColours | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const customOption = custom ? customTheme(custom) : null;
  // The keyboard shows letters in the chosen style; whole-message frames are app-only.
  const previewStyle = getStyle(selectedStyle).keyboard && !(getStyle(selectedStyle).isPro && !pro.isPro) ? selectedStyle : 'script';
  const current = themeId === PHOTO_THEME.id && photoUri ? PHOTO_THEME
    : themeId === 'custom-colors' && customOption ? customOption
      : themes.find((item) => item.id === themeId) ?? themes[0];

  // Reload on focus: the colour wheel screen may have saved new colours.
  useFocusEffect(useCallback(() => {
    AsyncStorage.multiGet([THEME_KEY, PHOTO_KEY, PHOTO_DIM_KEY, CUSTOM_KEY]).then(([[, theme], [, photo], [, dim], [, saved]]) => {
      if (photo) setPhotoUri(photo);
      if (dim) setPhotoDim(Number(dim));
      const parsed = saved ? { ...DEFAULT_CUSTOM, ...(JSON.parse(saved) as Partial<CustomColours>) } : null;
      setCustom(parsed);
      if (theme && (themes.some((item) => item.id === theme) || (theme === PHOTO_THEME.id && photo) || (theme === 'custom-colors' && parsed))) setThemeId(theme);
    }).catch(() => undefined);
  }, []));

  const choosePhoto = async () => {
    if (!pro.isPro) {
      router.push('/pro');
      return;
    }
    setNotice('');
    try {
      const uri = await pickKeyboardPhoto();
      if (!uri) return;
      setPhotoUri(uri);
      setThemeId(PHOTO_THEME.id);
      await AsyncStorage.multiSet([[PHOTO_KEY, uri], [THEME_KEY, PHOTO_THEME.id]]).catch(() => undefined);
      setNotice(Platform.OS === 'ios'
        ? 'Photo saved. On iPhone, turn on Full Access for Lyfstyle (Settings → Keyboards) so the keyboard can show it.'
        : 'Your photo is now your keyboard background.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not use that photo.');
    }
  };

  const removePhoto = async () => {
    await removeKeyboardPhoto().catch(() => undefined);
    setPhotoUri(null);
    if (themeId === PHOTO_THEME.id) setThemeId(themes[0].id);
    await AsyncStorage.multiRemove([PHOTO_KEY]).catch(() => undefined);
    await AsyncStorage.setItem(THEME_KEY, themes[0].id).catch(() => undefined);
    setNotice('Photo removed.');
  };

  const changeDarkness = async (value: number) => {
    setPhotoDim(value);
    await AsyncStorage.setItem(PHOTO_DIM_KEY, String(value)).catch(() => undefined);
    if (Platform.OS !== 'web') await NativeKeyboard.setPhotoDim(value).catch(() => undefined);
  };

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      setMicOn(await NativeKeyboard.hasMicrophone());
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
      if (theme.id === 'custom-colors' && custom) await NativeKeyboard.setCustomTheme(JSON.stringify(custom));
      else await NativeKeyboard.setKeyboardTheme(theme.id);
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

      <KeyboardPreview theme={current} photoUri={photoUri} photoDim={photoDim} styleId={previewStyle} />

      <View style={styles.photoCard}>
        <View style={styles.photoHead}>
          <Camera size={20} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.photoTitle}>Your photo as the background</Text>
          {!pro.isPro ? <Lock size={14} color={colors.ink} strokeWidth={2.4} /> : null}
        </View>
        <Text style={styles.photoCopy}>Pick any picture from your phone. It stays on your device.</Text>
        <View style={styles.photoActions}>
          <ActionButton onPress={choosePhoto} variant={pro.isPro ? 'dark' : 'sun'} style={styles.photoButton}>
            {pro.isPro ? (photoUri ? 'Change photo' : 'Choose a photo') : 'Unlock with Pro'}
          </ActionButton>
          {photoUri && pro.isPro ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Remove keyboard photo" onPress={() => void removePhoto()} style={styles.photoRemove}>
              <Trash2 size={18} color={colors.ink} />
            </Pressable>
          ) : null}
        </View>
        {photoUri && pro.isPro ? (
          <>
            <Text style={styles.darkLabel}>DARKEN PHOTO SO KEYS STAND OUT</Text>
            <ChipRow>
              {DARKNESS.map((item) => (
                <Chip key={item.label} label={item.label} active={Math.abs(photoDim - item.value) < 0.01} onPress={() => void changeDarkness(item.value)} />
              ))}
            </ChipRow>
            {Platform.OS === 'ios' ? (
              <View style={styles.fullAccess}>
                <Text style={styles.fullAccessTitle}>One more step on iPhone</Text>
                <Text style={styles.fullAccessCopy}>
                  iPhone only lets the keyboard see your photo when Full Access is on. Open Settings → Keyboards → Lyfstyle → turn on Allow Full Access. Then pick “Your photo” from the 🎨 button on the keyboard.
                </Text>
                <ActionButton variant="dark" onPress={() => run(NativeKeyboard.openKeyboardSettings)} icon={<ExternalLink size={16} color={colors.white} />}>
                  Open Settings
                </ActionButton>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/custom-theme')} style={({ pressed }) => [styles.photoCard, styles.mixCard, pressed && styles.pressed]}>
        <View style={styles.photoHead}>
          <Palette size={20} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.photoTitle}>Mix your own colours</Text>
          {!pro.isPro ? <Lock size={14} color={colors.ink} strokeWidth={2.4} /> : <ChevronRight size={18} color={colors.ink} />}
        </View>
        <Text style={[styles.photoCopy, styles.mixCopy]}>Pick the background, keys, letters and accent on a colour wheel.</Text>
      </Pressable>

      <View style={[styles.photoCard, styles.extraCard]}>
        <View style={styles.photoHead}>
          <Mic size={20} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.photoTitle}>Speak to type</Text>
          {micOn ? <Check size={18} color={colors.success} strokeWidth={3} /> : null}
        </View>
        {Platform.OS === 'android' ? (
          <>
            <Text style={styles.photoCopy}>Tap 🎙 on the Lyfstyle keyboard and talk. Your words go in with your chosen style.</Text>
            {!micOn ? (
              <ActionButton
                variant="dark"
                onPress={async () => {
                  await NativeKeyboard.requestMicrophone().catch(() => undefined);
                  setTimeout(() => { void refresh(); }, 1500);
                }}
              >
                Allow the microphone
              </ActionButton>
            ) : null}
          </>
        ) : (
          <Text style={[styles.photoCopy, styles.mixCopy]}>Apple doesn’t let any add-on keyboard use the microphone. Tap the 🎙 at the bottom right of your screen, under the keyboard, to speak instead.</Text>
        )}
      </View>

      <View style={[styles.photoCard, styles.extraCard]}>
        <View style={styles.photoHead}>
          <Languages size={20} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.photoTitle}>Translate as you type</Text>
        </View>
        <Text style={[styles.photoCopy, styles.mixCopy]}>
          {Platform.OS === 'ios'
            ? 'Type your message, tap 文A on the keyboard and pick a language. Works on iOS 26 or later using Apple’s on-device translation; download languages in Settings → Apps → Translate.'
            : 'Type your message, tap 文A on the keyboard and pick a language. Translation happens on your phone; each language downloads once (about 30 MB).'}
        </Text>
      </View>

      {photoUri || customOption ? (
        <>
          <View style={styles.sectionHead}><Eyebrow>YOURS</Eyebrow></View>
          <View style={styles.themeGrid}>
            {photoUri ? <ThemeTile theme={PHOTO_THEME} photoUri={photoUri} active={themeId === PHOTO_THEME.id} locked={!pro.isPro} onPress={() => void chooseTheme(PHOTO_THEME)} /> : null}
            {customOption ? <ThemeTile theme={customOption} active={themeId === customOption.id} locked={!pro.isPro} onPress={() => void chooseTheme(customOption)} /> : null}
          </View>
        </>
      ) : null}

      {pictureGroups.map(({ group, items }) => {
        const expanded = openGroups.includes(group);
        const shown = expanded ? items : items.slice(0, PICTURES_SHOWN);
        return (
          <View key={group}>
            <View style={styles.sectionHead}>
              <Eyebrow>{group.toUpperCase()} · {items.length}</Eyebrow>
              <Text style={styles.sectionNote}>Pro</Text>
            </View>
            <View style={styles.themeGrid}>
              {shown.map((theme) => (
                <ThemeTile key={theme.id} theme={theme} active={theme.id === themeId} locked={theme.isPro && !pro.isPro} onPress={() => void chooseTheme(theme)} />
              ))}
            </View>
            {items.length > PICTURES_SHOWN ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setOpenGroups((current) => (expanded ? current.filter((id) => id !== group) : [...current, group]))}
                style={({ pressed }) => [styles.more, pressed && styles.pressed]}
              >
                <Text style={styles.moreText}>{expanded ? 'Show less' : `Show all ${items.length}`}</Text>
                {expanded ? <ChevronUp size={16} color={colors.ink} /> : <ChevronDown size={16} color={colors.ink} />}
              </Pressable>
            ) : null}
          </View>
        );
      })}

      <View style={styles.sectionHead}>
        <Eyebrow>COLOUR THEMES · {colourThemes.length}</Eyebrow>
        <Text style={styles.sectionNote}>{colourThemes.filter((item) => !item.isPro).length} free</Text>
      </View>
      <View style={styles.themeGrid}>
        {colourThemes.map((theme) => (
          <ThemeTile key={theme.id} theme={theme} active={theme.id === themeId} locked={theme.isPro && !pro.isPro} onPress={() => void chooseTheme(theme)} />
        ))}
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

function ThemeTile({ theme, active, locked, onPress, photoUri }: { theme: KeyboardTheme; active: boolean; locked: boolean; onPress: () => void; photoUri?: string | null }) {
  const source = pictureSource(theme, photoUri);
  const body = (
    <>
      <View style={styles.themeKeys}>
        {[0, 1, 2, 3].map((index) => <View key={index} style={[styles.themeKey, { backgroundColor: index === 3 ? theme.accent : keyColor(theme) }]} />)}
      </View>
      <View style={styles.themeFoot}>
        <Text numberOfLines={1} style={[styles.themeName, { color: theme.text }, source ? styles.themeNameOnPicture : null]}>{theme.name}</Text>
        {locked ? <Lock size={11} color={theme.text} strokeWidth={2.6} /> : active ? <Check size={13} color={theme.text} strokeWidth={3} /> : null}
      </View>
    </>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${theme.name} keyboard theme${locked ? ', Pro' : ''}${active ? ', selected' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.theme, { backgroundColor: theme.background }, active && styles.themeActive, pressed && styles.pressed]}
    >
      {source ? <ImageBackground source={source} resizeMode="cover" style={styles.themeImage} imageStyle={styles.themeImageInner}>{body}</ImageBackground> : <View style={styles.themeInner}>{body}</View>}
    </Pressable>
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
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 },
  sectionNote: { fontFamily: type.bold, fontSize: 12, color: colors.muted },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  theme: { width: '31%', borderRadius: radii.medium, borderWidth: 3, borderColor: 'transparent', overflow: 'hidden' },
  themeInner: { padding: 9 },
  themeImage: { width: '100%', padding: 9, minHeight: 64, justifyContent: 'space-between' },
  themeImageInner: { borderRadius: radii.medium - 3 },
  themeNameOnPicture: { textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } },
  photoCard: { backgroundColor: colors.surface, borderRadius: radii.large, padding: 16, marginBottom: 18 },
  photoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoTitle: { flex: 1, fontFamily: type.displayBold, fontSize: 17, color: colors.ink },
  photoCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 4, marginBottom: 12 },
  photoActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoButton: { flex: 1 },
  darkLabel: { fontFamily: type.black, fontSize: 10, letterSpacing: 1.1, color: colors.muted, marginTop: 14, marginBottom: 8 },
  mixCard: { backgroundColor: colors.mintSoft },
  mixCopy: { marginBottom: 0 },
  extraCard: { backgroundColor: colors.sunSoft },
  fullAccess: { backgroundColor: colors.pinkSoft, borderRadius: radii.medium, padding: 12, marginTop: 14, gap: 6 },
  fullAccessTitle: { fontFamily: type.black, fontSize: 14, color: colors.ink },
  fullAccessCopy: { fontFamily: type.sans, fontSize: 13, lineHeight: 19, color: colors.ink, marginBottom: 4 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.lineSoft, marginBottom: 8 },
  moreText: { fontFamily: type.black, fontSize: 13, color: colors.ink },
  photoRemove: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
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
