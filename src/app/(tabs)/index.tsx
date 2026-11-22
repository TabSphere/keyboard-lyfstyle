import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, Copy, LockKeyhole, Share2, Sparkles, X } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import {
  applyDecoration,
  catalogue,
  compatibilityMessage,
  decorations,
  getStyle,
  transformText,
} from '../../styleEngine';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, Eyebrow, PageTitle, ProLabel, Screen, Wordmark, type, useReducedMotion } from '../../components/ui';

export default function ComposerScreen() {
  const composer = useComposer();
  const reduceMotion = useReducedMotion();
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [decorationOpen, setDecorationOpen] = useState(false);
  const outputOpacity = useRef(new Animated.Value(1)).current;
  const firstRender = useRef(true);
  const selected = getStyle(composer.selectedStyle);
  const selectedDecoration = decorations.find((item) => item.id === composer.selectedDecoration);
  const railSample = composer.text.trim().split('\n')[0].slice(0, 14) || 'Your words';

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setCopied(false);
    if (reduceMotion) return;
    outputOpacity.setValue(0.35);
    Animated.timing(outputOpacity, {
      toValue: 1,
      duration: 170,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [composer.selectedDecoration, composer.selectedStyle, outputOpacity, reduceMotion]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    setNotice('');
    setCopied(false);
  }, [composer.text]);

  const copy = async () => {
    if (composer.locked) return router.push('/pro');
    if (!composer.output.trim()) return setNotice('Write something first.');
    try {
      await Clipboard.setStringAsync(composer.output);
      if (Platform.OS !== 'web') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
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

  const chooseDecoration = (id: string) => {
    composer.selectDecoration(id);
    setDecorationOpen(false);
  };

  return (
    <Screen footer={
      <View>
        {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
        <View style={styles.actions}>
          <ActionButton
            onPress={copy}
            style={styles.copyAction}
            accessibilityLabel={composer.locked ? 'Unlock Pro to copy' : copied ? 'Text copied' : 'Copy styled text'}
            icon={composer.locked
              ? <LockKeyhole size={17} color={colors.white} />
              : copied ? <Check size={17} color={colors.white} /> : <Copy size={17} color={colors.white} />}
          >
            {composer.locked ? 'Unlock to copy' : copied ? 'Copied' : 'Copy text'}
          </ActionButton>
          <ActionButton onPress={share} variant="outline" icon={<Share2 size={17} color={colors.ink} />}>
            Share
          </ActionButton>
        </View>
      </View>
    }>
      <View style={styles.header}>
        <Wordmark height={27} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={composer.pro.isPro ? 'Lifetime Pro is active' : 'View Lifetime Pro'}
          onPress={() => router.push('/pro')}
          style={({ pressed }) => [styles.proButton, composer.pro.isPro && styles.proButtonActive, pressed && styles.pressed]}
        >
          {composer.pro.isPro ? <Check size={13} color={colors.success} /> : <Sparkles size={13} color={colors.accentDeep} />}
          <Text style={[styles.proButtonText, composer.pro.isPro && styles.proButtonTextActive]}>
            {composer.pro.isPro ? 'PRO ACTIVE' : 'LIFETIME PRO'}
          </Text>
        </Pressable>
      </View>

      <PageTitle title="Make it" italic="yours." compact />

      <View style={styles.composer}>
        <View style={styles.inputHeading}>
          <Eyebrow>YOUR WORDS</Eyebrow>
          <Text style={styles.counter}>{composer.text.length}/280</Text>
        </View>
        <TextInput
          accessibilityLabel="Text to style"
          value={composer.text}
          onChangeText={(text) => {
            setNotice('');
            setCopied(false);
            composer.setText(text);
          }}
          placeholder="Write a caption, bio or message…"
          placeholderTextColor={colors.tertiary}
          multiline
          maxLength={280}
          style={styles.input}
          textAlignVertical="top"
        />
        <View style={styles.previewHeading}>
          <View style={styles.previewLabelRow}>
            <Eyebrow>LIVE PREVIEW</Eyebrow>
            {selected.isPro && !composer.pro.isPro ? <ProLabel /> : null}
          </View>
          <Text style={styles.styleName}>{selected.name}</Text>
        </View>
        <Animated.Text selectable style={[styles.output, { opacity: outputOpacity }]}>
          {composer.output || 'Your preview appears here.'}
        </Animated.Text>
        <Text style={styles.compatibility}>{compatibilityMessage(composer.text, composer.selectedStyle)}</Text>
      </View>

      <View style={styles.railHeading}>
        <Eyebrow>CHOOSE A LOOK</Eyebrow>
        <Pressable accessibilityRole="button" onPress={() => router.push('/looks')} hitSlop={8} style={styles.viewAllButton}>
          <Text style={styles.viewAll}>VIEW ALL 24</Text>
          <ChevronRight size={14} color={colors.accentDeep} />
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
                <Text numberOfLines={1} style={styles.styleSample}>{transformText(railSample, style.id)}</Text>
                <View style={styles.styleChoiceNameRow}>
                  <Text numberOfLines={1} style={[styles.styleChoiceName, active && styles.styleChoiceNameActive]}>{style.name}</Text>
                  {style.isPro && !composer.pro.isPro ? <LockKeyhole size={11} color={colors.muted} /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose a text decoration"
        onPress={() => setDecorationOpen(true)}
        style={({ pressed }) => [styles.decorationButton, pressed && styles.pressed]}
      >
        <View style={styles.decorationButtonCopy}>
          <Eyebrow>FINISHING TOUCH</Eyebrow>
          <Text style={styles.decorationButtonTitle}>{selectedDecoration?.name ?? 'No decoration'}</Text>
        </View>
        <Text numberOfLines={1} style={styles.decorationPreview}>
          {applyDecoration(transformText('Aa', composer.selectedStyle), composer.selectedDecoration)}
        </Text>
        <ChevronRight size={18} color={colors.muted} />
      </Pressable>

      <View style={styles.footnote}>
        <Text style={styles.footnoteText}>
          Your typing stays on this device. Unicode may look different in some apps and fonts.
        </Text>
      </View>

      <Modal
        transparent
        visible={decorationOpen}
        animationType={reduceMotion ? 'none' : 'fade'}
        onRequestClose={() => setDecorationOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Close decoration picker" style={styles.backdrop} onPress={() => setDecorationOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Eyebrow>FINISHING TOUCH</Eyebrow>
                <Text style={styles.sheetTitle}>Frame your words.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close decoration picker" onPress={() => setDecorationOpen(false)} style={styles.close}>
                <X size={21} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={styles.sheetIntro}>Decorations are added only when you choose one here.</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: !composer.selectedDecoration }}
                onPress={() => chooseDecoration('')}
                style={({ pressed }) => [styles.decorationItem, !composer.selectedDecoration && styles.decorationActive, pressed && styles.pressed]}
              >
                <View style={styles.decorationItemCopy}>
                  <Text style={styles.decorationName}>None</Text>
                  <Text style={styles.decorationItemPreview}>{transformText('Your words', composer.selectedStyle)}</Text>
                </View>
                {!composer.selectedDecoration ? <Check size={18} color={colors.accentDeep} /> : null}
              </Pressable>
              {decorations.map((decoration) => {
                const active = composer.selectedDecoration === decoration.id;
                return (
                  <Pressable
                    key={decoration.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${decoration.name}${decoration.isPro && !composer.pro.isPro ? ', Pro' : ''}`}
                    accessibilityState={{ selected: active }}
                    onPress={() => chooseDecoration(active ? '' : decoration.id)}
                    style={({ pressed }) => [styles.decorationItem, active && styles.decorationActive, pressed && styles.pressed]}
                  >
                    <View style={styles.decorationItemCopy}>
                      <View style={styles.decorationNameRow}>
                        <Text style={styles.decorationName}>{decoration.name}</Text>
                        {decoration.isPro && !composer.pro.isPro ? <ProLabel /> : null}
                      </View>
                      <Text numberOfLines={2} style={styles.decorationItemPreview}>
                        {applyDecoration(transformText('Your words', composer.selectedStyle), decoration.id)}
                      </Text>
                    </View>
                    {active ? <Check size={18} color={colors.accentDeep} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  proButton: { minHeight: 36, borderRadius: radii.pill, paddingHorizontal: 12, backgroundColor: colors.accentTint, flexDirection: 'row', alignItems: 'center', gap: 6 },
  proButtonActive: { backgroundColor: '#EAF3ED' },
  proButtonText: { fontFamily: type.mono, color: colors.accentDeep, fontSize: 10, letterSpacing: 0.55 },
  proButtonTextActive: { color: colors.success },
  composer: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radii.medium, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 17 },
  inputHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontFamily: type.mono, color: colors.tertiary, fontSize: 11 },
  input: { minHeight: 78, maxHeight: 170, paddingVertical: 12, paddingHorizontal: 0, borderBottomWidth: 1, borderBottomColor: colors.lineSoft, color: colors.ink, fontFamily: type.display, fontSize: 28, lineHeight: 36, outlineStyle: 'none' } as never,
  previewHeading: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabelRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  styleName: { fontFamily: type.medium, fontSize: 12, color: colors.muted },
  output: { minHeight: 66, paddingTop: 12, color: colors.ink, fontSize: 25, lineHeight: 35 },
  compatibility: { fontFamily: type.sans, color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  railHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 10 },
  viewAllButton: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAll: { fontFamily: type.mono, fontSize: 10, letterSpacing: 0.65, color: colors.accentDeep },
  railClip: { marginHorizontal: -20 },
  styleRail: { flexDirection: 'row', paddingHorizontal: 20, gap: 9, paddingBottom: 3 },
  styleChoice: { width: 132, minHeight: 88, paddingVertical: 13, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, borderRadius: radii.small, backgroundColor: colors.surface, justifyContent: 'center' },
  styleChoiceActive: { backgroundColor: colors.accentTint, borderColor: colors.accent },
  styleSample: { color: colors.ink, fontSize: 18, lineHeight: 27, textAlign: 'center' },
  styleChoiceNameRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 9 },
  styleChoiceName: { fontFamily: type.medium, color: colors.muted, fontSize: 11, maxWidth: 91 },
  styleChoiceNameActive: { color: colors.accentDeep },
  decorationButton: { minHeight: 76, marginTop: 19, paddingHorizontal: 15, paddingVertical: 12, borderRadius: radii.small, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
  decorationButtonCopy: { flex: 1 },
  decorationButtonTitle: { fontFamily: type.semibold, color: colors.ink, fontSize: 14, marginTop: 4 },
  decorationPreview: { maxWidth: 100, color: colors.ink, fontSize: 18 },
  notice: { fontFamily: type.medium, color: colors.success, fontSize: 12, lineHeight: 18, marginBottom: 8, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
  copyAction: { flex: 1 },
  footnote: { marginTop: 22, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.lineSoft },
  footnoteText: { fontFamily: type.sans, color: colors.muted, fontSize: 12, lineHeight: 19 },
  pressed: { opacity: 0.68 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(27,25,22,0.28)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { maxHeight: '78%', backgroundColor: colors.canvas, borderTopLeftRadius: radii.large, borderTopRightRadius: radii.large, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  sheetHandle: { width: 38, height: 4, borderRadius: 4, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: type.display, color: colors.ink, fontSize: 29, lineHeight: 35, marginTop: 5 },
  sheetIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 13 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  decorationItem: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingHorizontal: 12, paddingVertical: 13 },
  decorationActive: { backgroundColor: colors.accentTint, borderRadius: radii.small, borderTopColor: 'transparent' },
  decorationItemCopy: { flex: 1 },
  decorationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  decorationName: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  decorationItemPreview: { fontFamily: type.sans, color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 5 },
});
