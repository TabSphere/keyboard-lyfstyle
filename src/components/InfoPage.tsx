import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/tokens';
import { BackBar, Eyebrow, PageTitle, Screen, type } from './ui';

export function InfoPage({ title, italic, intro, children }: PropsWithChildren<{ title: string; italic: string; intro: string }>) {
  return (
    <Screen>
      <BackBar fallback="/settings" />
      <PageTitle title={title} mark={italic}>{intro}</PageTitle>
      <View style={styles.list}>{children}</View>
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
  list: { gap: 10 },
  section: { backgroundColor: colors.surface, borderRadius: radii.large, padding: 16 },
  sectionTitle: { fontFamily: type.displayBold, color: colors.ink, fontSize: 20, lineHeight: 26, marginTop: 4 },
  sectionCopy: { fontFamily: type.sans, color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 6 },
});
