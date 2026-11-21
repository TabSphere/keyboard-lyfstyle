import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Check, Copy, LockKeyhole, Share2, Sparkles } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { catalogue, compatibilityMessage, decorations, getStyle, transformText } from '../../styleEngine';
import { colors } from '../../theme/tokens';
import { ActionButton, Eyebrow, PageTitle, ProLabel, Screen, Wordmark, type } from '../../components/ui';

export default function ComposerScreen() {
  const composer = useComposer();
  const [notice, setNotice] = useState('');
  const selected = getStyle(composer.selectedStyle);

  const copy = async () => {
    if (composer.locked) return router.push('/pro');
    if (!composer.output.trim()) return setNotice('Write something first.');
    try {
      await Clipboard.setStringAsync(composer.output);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotice('Copied — ready to paste.');
    } catch {
      setNotice('Copy was blocked. Select the preview and copy it manually.');
    }
  };

  const share = async () => {
    if (composer.locked) return router.push('/pro');
    if (!composer.output.trim()) return setNotice('Write something first.');
    try {
      await Share.share({ message: composer.output });
    } catch {
      setNotice('Sharing is unavailable here. Copy your text instead.');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Wordmark />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={composer.pro.isPro ? 'Lifetime Pro is active' : 'View Lifetime Pro'}
          onPress={() => router.push('/pro')}
          style={({ pressed }) => [styles.proButton, composer.pro.isPro && styles.proButtonActive, pressed && styles.pressed]}
        >
          {composer.pro.isPro ? <Check size={13} color={colors.ivory} /> : <Sparkles size={13} color={colors.ivory} />}
          <Text style={styles.proButtonText}>{composer.pro.isPro ? 'PRO ACTIVE' : 'LIFETIME PRO'}</Text>
        </Pressable>
      </View>

      <PageTitle title="Say it with" italic="character.">
        Your words, set in Unicode. Type below, find a look, then copy or share.
      </PageTitle>

      <View style={styles.composer}>
        <View style={styles.inputHeading}>
          <Eyebrow>01 / YOUR WORDS</Eyebrow>
          <Text style={styles.counter}>{composer.text.length}/280</Text>
        </View>
        <TextInput
          accessibilityLabel="Text to style"
          value={composer.text}
          onChangeText={composer.setText}
          placeholder="Write a caption, bio or message…"
          placeholderTextColor="#8C867C"
          multiline
          maxLength={280}
          style={styles.input}
          textAlignVertical="top"
        />
        <View style={styles.previewHeading}>
          <View style={styles.previewLabelRow}>
            <Eyebrow>02 / LIVE PREVIEW</Eyebrow>
            {selected.isPro && !composer.pro.isPro ? <ProLabel /> : null}
          </View>
          <Text style={styles.styleName}>{selected.name}</Text>
        </View>
        <Text selectable style={styles.output}>{composer.output || 'Your preview appears here.'}</Text>
        <Text style={styles.compatibility}>{compatibilityMessage(composer.text, composer.selectedStyle)}</Text>
      </View>

      <View style={styles.railHeading}>
        <Eyebrow>CHOOSE A LOOK</Eyebrow>
        <Pressable onPress={() => router.push('/looks')} hitSlop={8}>
          <Text style={styles.viewAll}>VIEW ALL 24</Text>
        </Pressable>
      </View>
      <View style={styles.railClip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleRail}>
          {catalogue.styles.map((style) => {
            const active = composer.selectedStyle === style.id;
            return (
              <Pressable
                key={style.id}
                accessibilityRole="button"
                accessibilityLabel={`${style.name}${style.isPro && !composer.pro.isPro ? ', Pro preview' : ''}`}
                accessibilityState={{ selected: active }}
                onPress={() => composer.selectStyle(style.id)}
                style={({ pressed }) => [styles.styleChoice, active && styles.styleChoiceActive, pressed && styles.pressed]}
              >
                <Text numberOfLines={1} style={[styles.styleSample, active && { color: colors.coralDark }]}>
                  {transformText('Aa', style.id)}
                </Text>
                <View style={styles.styleChoiceNameRow}>
                  <Text numberOfLines={1} style={styles.styleChoiceName}>{style.name}</Text>
                  {style.isPro && !composer.pro.isPro ? <LockKeyhole size={10} color={colors.muted} /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <ActionButton onPress={copy} icon={composer.locked ? <LockKeyhole size={17} color={colors.white} /> : <Copy size={17} color={colors.white} />}>
          {composer.locked ? 'Unlock to copy' : 'Copy text'}
        </ActionButton>
        <ActionButton onPress={share} variant="outline" icon={<Share2 size={17} color={colors.ink} />}>
          Share
        </ActionButton>
      </View>
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

      <View style={styles.decorationSection}>
        <View style={styles.decorationTitleRow}>
          <View>
            <Eyebrow>FINISHING TOUCH</Eyebrow>
            <Text style={styles.decorationTitle}>A little extra, only when you ask.</Text>
          </View>
        </View>
        <View style={styles.decorationList}>
          <Pressable onPress={() => composer.selectDecoration('')} style={[styles.decorationItem, !composer.selectedDecoration && styles.decorationActive]}>
            <Text style={styles.decorationText}>None</Text>
          </Pressable>
          {decorations.map((decoration) => {
            const active = composer.selectedDecoration === decoration.id;
            return (
              <Pressable
                key={decoration.id}
                onPress={() => composer.selectDecoration(active ? '' : decoration.id)}
                accessibilityState={{ selected: active }}
                style={[styles.decorationItem, active && styles.decorationActive]}
              >
                <Text style={styles.decorationText}>{decoration.name}</Text>
                {decoration.isPro && !composer.pro.isPro ? <LockKeyhole size={11} color={colors.muted} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footnote}>
        <Text style={styles.footnoteText}>
          Styled characters stay on your device. Some apps, fonts and platforms display Unicode differently.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
  proButton: { minHeight: 34, borderRadius: 2, paddingHorizontal: 11, backgroundColor: colors.coralDark, flexDirection: 'row', alignItems: 'center', gap: 6 },
  proButtonActive: { backgroundColor: colors.success },
  proButtonText: { fontFamily: type.bold, color: colors.white, fontSize: 9, letterSpacing: 0.8 },
  composer: { backgroundColor: colors.paper, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 18 },
  inputHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontFamily: type.sans, color: colors.muted, fontSize: 11 },
  input: { minHeight: 95, maxHeight: 190, paddingVertical: 15, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: colors.line, color: colors.ink, fontFamily: type.serif, fontSize: 31, lineHeight: 39, outlineStyle: 'none' } as never,
  previewHeading: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabelRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  styleName: { fontFamily: type.medium, fontSize: 11, color: colors.muted },
  output: { minHeight: 76, paddingTop: 14, color: colors.ink, fontSize: 27, lineHeight: 39 },
  compatibility: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  railHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 10 },
  viewAll: { fontFamily: type.bold, fontSize: 9, letterSpacing: 0.9, color: colors.coralDark },
  railClip: { marginHorizontal: -22 },
  styleRail: { flexDirection: 'row', paddingHorizontal: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line },
  styleChoice: { width: 92, minHeight: 88, paddingVertical: 12, paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: colors.line, borderBottomWidth: 3, borderBottomColor: 'transparent', justifyContent: 'center' },
  styleChoiceActive: { backgroundColor: colors.paper, borderBottomColor: colors.coralDark },
  styleSample: { color: colors.ink, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  styleChoiceNameRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 8 },
  styleChoiceName: { fontFamily: type.medium, color: colors.muted, fontSize: 9, maxWidth: 63 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  notice: { fontFamily: type.medium, color: colors.success, fontSize: 13, marginTop: 12 },
  decorationSection: { marginTop: 30 },
  decorationTitleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  decorationTitle: { fontFamily: type.serifItalic, color: colors.ink, fontSize: 23, lineHeight: 28, marginTop: 5 },
  decorationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  decorationItem: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 5, borderBottomWidth: 1, borderBottomColor: colors.line, paddingHorizontal: 8 },
  decorationActive: { borderBottomColor: colors.coralDark, backgroundColor: colors.paper },
  decorationText: { fontFamily: type.medium, color: colors.ink, fontSize: 12 },
  footnote: { marginTop: 28, paddingTop: 17, borderTopWidth: 1, borderTopColor: colors.line },
  footnoteText: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 18 },
  pressed: { opacity: 0.65 },
});
