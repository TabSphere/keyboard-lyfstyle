import type { PropsWithChildren, ReactNode } from 'react';
import {
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
import { colors } from '../theme/tokens';

export const type = {
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export function Screen({ children, scroll = true, contentStyle }: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
}>) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
    </SafeAreaView>
  );
}

export function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <View style={styles.wordmarkRow} accessibilityLabel="Lyfstyle">
      <Text style={[styles.wordmark, dark && { color: colors.ivory }]}>Lyfstyle</Text>
      <View style={styles.wordmarkDot} />
    </View>
  );
}

export function Eyebrow({ children, light = false }: PropsWithChildren<{ light?: boolean }>) {
  return <Text style={[styles.eyebrow, light && { color: colors.ivory }]}>{children}</Text>;
}

export function PageTitle({ title, italic, children }: PropsWithChildren<{ title: string; italic?: string }>) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.pageTitle}>
        {title}{italic ? <Text style={styles.pageTitleItalic}> {italic}</Text> : null}
      </Text>
      {children ? <Text style={styles.pageIntro}>{children}</Text> : null}
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
}: PropsWithChildren<{
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline' | 'text';
  disabled?: boolean;
  busy?: boolean;
  icon?: ReactNode;
  accessibilityLabel?: string;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        styles[`action_${variant}`],
        pressed && styles.pressed,
        (disabled || busy) && styles.disabled,
      ]}
    >
      {busy ? <ActivityIndicator color={variant === 'outline' || variant === 'text' ? colors.ink : colors.white} /> : (
        <>
          <Text style={[styles.actionText, styles[`actionText_${variant}`]]}>{children}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}

export function TextLink({ children, onPress }: PropsWithChildren<{ onPress: () => void }>) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}>
      <Text style={styles.textLinkText}>{children}</Text>
      <ArrowUpRight size={16} color={colors.ink} strokeWidth={1.8} />
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
  safe: { flex: 1, backgroundColor: colors.ivory },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 640, alignSelf: 'center', paddingHorizontal: 22, paddingBottom: 34 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'flex-end' },
  wordmark: { fontFamily: type.serif, fontSize: 38, lineHeight: 42, color: colors.ink, letterSpacing: -1.2 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.coral, marginLeft: 3, marginBottom: 7 },
  eyebrow: { fontFamily: type.bold, fontSize: 10, lineHeight: 15, color: colors.muted, letterSpacing: 1.7, textTransform: 'uppercase' },
  titleBlock: { marginTop: 26, marginBottom: 26 },
  pageTitle: { fontFamily: type.serif, color: colors.ink, fontSize: 48, lineHeight: 49, letterSpacing: -1.4, maxWidth: 520 },
  pageTitleItalic: { fontFamily: type.serifItalic, color: colors.coralDark },
  pageIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13, maxWidth: 480 },
  action: { minHeight: 50, paddingHorizontal: 20, borderRadius: 3, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  action_primary: { backgroundColor: colors.coralDark },
  action_dark: { backgroundColor: colors.ink },
  action_outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  action_text: { backgroundColor: 'transparent', paddingHorizontal: 4 },
  actionText: { fontFamily: type.semibold, fontSize: 14, lineHeight: 20 },
  actionText_primary: { color: colors.white },
  actionText_dark: { color: colors.white },
  actionText_outline: { color: colors.ink },
  actionText_text: { color: colors.ink },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  textLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  textLinkText: { fontFamily: type.semibold, fontSize: 14, color: colors.ink },
  proLabel: { fontFamily: type.bold, color: colors.coralDark, fontSize: 9, letterSpacing: 1.1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 22 },
});
