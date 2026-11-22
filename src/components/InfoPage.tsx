import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../theme/tokens';
import { Eyebrow, PageTitle, Screen, Wordmark, type } from './ui';

export function InfoPage({ title, italic, intro, children }: PropsWithChildren<{ title: string; italic: string; intro: string }>) {
  const close = () => router.canGoBack() ? router.back() : router.replace('/settings');
  return (
    <Screen>
      <View style={styles.header}>
        <Wordmark />
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={close} style={styles.back}>
          <ArrowLeft size={17} color={colors.ink} /><Text style={styles.backText}>BACK</Text>
        </Pressable>
      </View>
      <PageTitle title={title} italic={italic}>{intro}</PageTitle>
      {children}
    </Screen>
  );
}

export function InfoSection({ number, title, children }: PropsWithChildren<{ number: string; title: string }>) {
  return (
    <View style={styles.section}>
      <Eyebrow>{number}</Eyebrow>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCopy}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontFamily: type.bold, fontSize: 9, letterSpacing: 1, color: colors.ink },
  section: { paddingVertical: 22, borderTopWidth: 1, borderTopColor: colors.line },
  sectionTitle: { fontFamily: type.display, color: colors.ink, fontSize: 29, lineHeight: 34, marginTop: 7 },
  sectionCopy: { fontFamily: type.sans, color: colors.muted, fontSize: 14, lineHeight: 23, marginTop: 8 },
});
