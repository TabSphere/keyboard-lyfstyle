import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpRight } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radii } from '../theme/tokens';
import { wordmark } from '../theme/wordmark';

export const type = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_600SemiBold_Italic',
  sans: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  mono: 'GeistMono_500Medium',
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

export function Wordmark({ dark = false, height = 30 }: { dark?: boolean; height?: number }) {
  const width = (height * wordmark.width) / wordmark.height;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Lyfstyle">
      <Svg width={width} height={height} viewBox={wordmark.viewBox}>
        <Path d={wordmark.d} fill={dark ? colors.canvas : colors.ink} />
      </Svg>
    </View>
  );
}

export function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <Text style={[styles.eyebrow, light && { color: colors.line }]}>{children}</Text>;
}

export function PageTitle({ title, italic, compact = false, children }: PropsWithChildren<{
  title: string;
  italic?: string;
  compact?: boolean;
}>) {
  return (
    <View style={[styles.titleBlock, compact && styles.titleBlockCompact]}>
      <Text style={[styles.pageTitle, compact && styles.pageTitleCompact]}>
        {title}{italic ? <Text style={styles.pageTitleMark}>{` ${italic}`}</Text> : null}
      </Text>
      {children ? <Text style={[styles.pageIntro, compact && styles.pageIntroCompact]}>{children}</Text> : null}
    </View>
  );
}

export function ActionButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  icon,
  accessibilityLabel,
  style: actionStyle,
}: PropsWithChildren<{
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline' | 'text';
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
}>) {
  const reduceMotion = useReducedMotion();
  const spinnerColor = variant === 'outline' || variant === 'text' ? colors.ink : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        styles[`action_${variant}`],
        actionStyle,
        pressed && styles.pressed,
        pressed && !reduceMotion && styles.pressedMotion,
        (disabled || busy) && styles.disabled,
      ]}
    >
      {busy ? <ActivityIndicator color={spinnerColor} /> : (
        <>
          <Text style={[styles.actionText, styles[`actionText_${variant}`]]}>{children}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}

export function TextLink({ children, onPress }: PropsWithChildren<{ onPress: () => void }>) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.textLink, pressed && styles.pressed, pressed && !reduceMotion && styles.pressedMotion]}
    >
      <Text style={styles.textLinkText}>{children}</Text>
      <ArrowUpRight size={16} color={colors.accentDeep} strokeWidth={1.8} />
    </Pressable>
  );
}

export function ProLabel() {
  return <Text style={styles.proLabel}>PRO</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 32 },
  footer: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  footerInner: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  eyebrow: { fontFamily: type.mono, fontSize: 11, lineHeight: 16, color: colors.muted, letterSpacing: 1.25, textTransform: 'uppercase' },
  titleBlock: { marginTop: 26, marginBottom: 24 },
  titleBlockCompact: { marginTop: 12, marginBottom: 18 },
  pageTitle: { fontFamily: type.display, color: colors.ink, fontSize: 38, lineHeight: 44, letterSpacing: -1.1, maxWidth: 560 },
  pageTitleCompact: { fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  pageTitleMark: { fontFamily: type.displayItalic, color: colors.accentDeep },
  pageIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 520 },
  pageIntroCompact: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  action: { minHeight: 52, paddingHorizontal: 20, borderRadius: radii.medium, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  action_primary: { backgroundColor: colors.accentDeep },
  action_dark: { backgroundColor: colors.ink },
  action_outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  action_text: { backgroundColor: 'transparent', paddingHorizontal: 4 },
  actionText: { fontFamily: type.semibold, fontSize: 14, lineHeight: 20 },
  actionText_primary: { color: colors.white },
  actionText_dark: { color: colors.white },
  actionText_outline: { color: colors.ink },
  actionText_text: { color: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
  pressedMotion: { transform: [{ scale: 0.985 }] },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  textLinkText: { fontFamily: type.semibold, fontSize: 14, color: colors.ink },
  proLabel: { fontFamily: type.mono, color: colors.accentDeep, backgroundColor: colors.accentTint, borderRadius: 5, fontSize: 10, lineHeight: 15, letterSpacing: 0.8, paddingHorizontal: 6, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 22 },
});
