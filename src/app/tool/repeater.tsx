import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Copy, Minus, Plus } from 'lucide-react-native';
import { useCopy } from '../../hooks/useCopy';
import { repeatText, type RepeatSeparator } from '../../tools/textTools';
import { colors, radii } from '../../theme/tokens';
import { ActionButton, BackBar, Chip, ChipRow, Eyebrow, PageTitle, Screen, type } from '../../components/ui';

const SEPARATORS: { id: RepeatSeparator; label: string }[] = [
  { id: 'newline', label: 'New line' },
  { id: 'space', label: 'Space' },
  { id: 'none', label: 'No gap' },
];

export default function RepeaterScreen() {
  const { copiedKey, copy } = useCopy();
  const [text, setText] = useState('love you ♡');
  const [count, setCount] = useState(10);
  const [separator, setSeparator] = useState<RepeatSeparator>('newline');
  const output = text ? repeatText(text, count, separator) : '';
  const preview = output.length > 600 ? `${output.slice(0, 600)}…` : output;

  return (
    <Screen>
      <BackBar title="Text repeater" fallback="/tools" />
      <PageTitle title="Say it" mark="again">Repeat any message up to 500 times.</PageTitle>

      <TextInput accessibilityLabel="Text to repeat" value={text} onChangeText={setText} maxLength={120} style={styles.input} placeholder="Type something" placeholderTextColor={colors.tertiary} />

      <View style={styles.row}>
        <Eyebrow>TIMES</Eyebrow>
        <View style={styles.stepper}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fewer" onPress={() => setCount((v) => Math.max(1, v - (v > 20 ? 10 : 1)))} style={styles.stepButton}><Minus size={16} color={colors.ink} /></Pressable>
          <TextInput
            accessibilityLabel="Number of repeats"
            value={String(count)}
            onChangeText={(value) => setCount(Math.max(1, Math.min(500, Number(value.replace(/\D/g, '')) || 1)))}
            keyboardType="number-pad"
            style={styles.countInput}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => setCount((v) => Math.min(500, v + (v >= 20 ? 10 : 1)))} style={styles.stepButton}><Plus size={16} color={colors.ink} /></Pressable>
        </View>
      </View>

      <Eyebrow>BETWEEN EACH</Eyebrow>
      <ChipRow>
        {SEPARATORS.map((item) => <Chip key={item.id} label={item.label} active={item.id === separator} onPress={() => setSeparator(item.id)} />)}
      </ChipRow>

      <View style={styles.preview}><Text selectable style={styles.previewText} numberOfLines={12}>{preview || 'Type something above.'}</Text></View>

      <ActionButton onPress={() => copy('rep', output)} disabled={!output} icon={<Copy size={16} color={colors.onBrand} />}>
        {copiedKey === 'rep' ? 'Copied!' : `Copy ${count}×`}
      </ActionButton>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: colors.surface, borderRadius: radii.medium, paddingHorizontal: 14, height: 52, fontFamily: type.bold, fontSize: 17, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  countInput: { width: 64, height: 40, borderRadius: radii.small, backgroundColor: colors.surface, textAlign: 'center', fontFamily: type.black, fontSize: 16, color: colors.ink },
  preview: { backgroundColor: colors.surface, borderRadius: radii.large, padding: 16, marginVertical: 16, minHeight: 100 },
  previewText: { fontFamily: type.sans, fontSize: 15, lineHeight: 21, color: colors.ink },
});
