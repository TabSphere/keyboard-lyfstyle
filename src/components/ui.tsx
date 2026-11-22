import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Lock, Settings2, Sparkles } from 'lucide-react-native';
import { colors, radii } from '../theme/tokens';

// Pop Sugar type: chunky Bricolage Grotesque for headlines, friendly Nunito for UI.
export const type = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  sans: 'Nunito_500Medium',
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => subscription.remove();
  }, []);
  return reduced;
}

export function Screen({ children, scroll = true, contentStyle, footer }: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}>) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={footer ? ['top', 'bottom'] : ['top']}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : content}
      {footer ? <View style={styles.footer}><View style={styles.footerInner}>{footer}</View></View> : null}
    </SafeAreaView>
  );
}

/** "lyf" in hot pink + "style" in plum ink, set in Bricolage Grotesque. */
export function Wordmark({ size = 24, light = false }: { size?: number; light?: boolean }) {
  return (
    <Text accessibilityRole="header" accessibilityLabel="Lyfstyle" style={[styles.wordmark, { fontSize: size, lineHeight: size * 1.15 }]}>
      <Text style={{ color: light ? colors.sun : colors.brand }}>lyf</Text>
      <Text style={{ color: light ? colors.white : colors.ink }}>style</Text>
    </Text>
  );
}

/** Top bar used on every tab: wordmark, Pro pill and settings. */
export function TopBar({ isPro }: { isPro: boolean }) {
  return (
    <View style={styles.topBar}>
      <Wordmark />
      <View style={styles.topBarActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPro ? 'Lifetime Pro is active' : 'Get Lifetime Pro'}
          onPress={() => router.push('/pro')}
          style={({ pressed }) => [styles.proPill, pressed && styles.pressed]}
        >
          <Sparkles size={13} color={colors.ink} strokeWidth={2.2} />
          <Text style={styles.proPillText}>{isPro ? 'PRO ♡' : 'PRO'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Settings2 size={20} color={colors.ink} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

export function BackBar({ title, fallback = '/' }: { title?: string; fallback?: '/' | '/tools' | '/settings' }) {
  const close = () => (router.canGoBack() ? router.back() : router.replace(fallback));
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={close} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <ArrowLeft size={20} color={colors.ink} strokeWidth={2.2} />
      </Pressable>
      {title ? <Text style={styles.backTitle} numberOfLines={1}>{title}</Text> : <Wordmark />}
      <View style={styles.backSpacer} />
    </View>
  );
}

export function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <Text style={[styles.eyebrow, light && { color: colors.lilac }]}>{children}</Text>;
}

/** Big Bricolage headline; `mark` gets a sun-yellow sticker highlight. */
export function PageTitle({ title, mark, children }: PropsWithChildren<{ title: string; mark?: string }>) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.pageTitle}>
        {title}
        {mark ? <Text>{' '}<Text style={styles.pageTitleMark}>{` ${mark} `}</Text></Text> : null}
      </Text>
      {children ? <Text style={styles.pageIntro}>{children}</Text> : null}
    </View>
  );
}

type ButtonVariant = 'primary' | 'sun' | 'pink' | 'dark' | 'outline' | 'soft';

export function ActionButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  icon,
  accessibilityLabel,
  style,
}: PropsWithChildren<{
  onPress: () => void | Promise<void>;
  variant?: ButtonVariant;
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}>) {
  const textColor = buttonText[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: buttonFill[variant] },
        variant === 'outline' && styles.actionOutline,
        pressed && styles.pressedButton,
        (disabled || busy) && styles.disabled,
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={textColor} /> : (
        <>
          <Text style={[styles.actionText, { color: textColor }]}>{children}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}

const buttonFill: Record<ButtonVariant, string> = {
  primary: colors.brand, sun: colors.sun, pink: colors.pink, dark: colors.ink, outline: colors.surface, soft: colors.peachSoft,
};
const buttonText: Record<ButtonVariant, string> = {
  primary: colors.onBrand, sun: colors.ink, pink: colors.white, dark: colors.white, outline: colors.ink, soft: colors.brandDeep,
};

/** Rounded filter chip. */
export function Chip({ label, active, onPress, tint = colors.surface }: { label: string; active: boolean; onPress: () => void; tint?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: active ? colors.ink : tint }, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: PropsWithChildren) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} style={styles.chipScroll}>
      {children}
    </ScrollView>
  );
}

export function ProLabel() {
  return (
    <View style={styles.proLabel} accessibilityLabel="Pro">
      <Lock size={10} color={colors.ink} strokeWidth={2.6} />
      <Text style={styles.proLabelText}>PRO</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 34 },
  footer: { backgroundColor: colors.canvas, borderTopWidth: 1, borderTopColor: colors.line },
  footerInner: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
  wordmark: { fontFamily: type.display, letterSpacing: -0.8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 6, minHeight: 52 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  proPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.sun, paddingHorizontal: 12, height: 34, borderRadius: radii.pill },
  proPillText: { fontFamily: type.black, fontSize: 11, letterSpacing: 0.6, color: colors.ink },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  backTitle: { flex: 1, textAlign: 'center', fontFamily: type.displayBold, fontSize: 18, color: colors.ink },
  backSpacer: { width: 40 },
  eyebrow: { fontFamily: type.black, fontSize: 11, lineHeight: 15, color: colors.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  titleBlock: { marginTop: 14, marginBottom: 16 },
  pageTitle: { fontFamily: type.display, color: colors.ink, fontSize: 36, lineHeight: 42, letterSpacing: -1.2 },
  pageTitleMark: { backgroundColor: colors.sun, color: colors.ink },
  pageIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  action: { minHeight: 52, paddingHorizontal: 20, borderRadius: radii.pill, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  actionOutline: { borderWidth: 2, borderColor: colors.line },
  actionText: { fontFamily: type.bold, fontSize: 15 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  pressedButton: { transform: [{ scale: 0.97 }] },
  chipScroll: { marginHorizontal: -18, flexGrow: 0 },
  chipRow: { gap: 8, paddingHorizontal: 18, paddingVertical: 2 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: type.bold, fontSize: 13, color: colors.ink },
  proLabel: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.sun, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  proLabelText: { fontFamily: type.black, fontSize: 9, letterSpacing: 0.6, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 20 },
});
