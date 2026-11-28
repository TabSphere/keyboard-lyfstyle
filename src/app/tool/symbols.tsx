import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCopy } from '../../hooks/useCopy';
import { symbolGroups } from '../../content/symbols';
import { colors, pastels, radii } from '../../theme/tokens';
import { BackBar, Eyebrow, PageTitle, Screen, type } from '../../components/ui';

export default function SymbolsScreen() {
  const { copiedKey, copy } = useCopy();
  return (
    <Screen>
      <BackBar title="Symbols & kaomoji" fallback="/tools" />
      <PageTitle title="Tap to" mark="copy">Paste them anywhere. The Lyfstyle keyboard has a symbols panel too.</PageTitle>
      {symbolGroups.map((group, groupIndex) => (
        <View key={group.id} style={styles.group}>
          <Eyebrow>{group.name}</Eyebrow>
          <View style={styles.grid}>
            {group.items.map((item) => {
              const key = `${group.id}-${item}`;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy ${item}`}
                  onPress={() => copy(key, item)}
                  style={({ pressed }) => [styles.item, { backgroundColor: pastels[groupIndex % pastels.length] }, pressed && styles.pressed]}
                >
                  <Text style={styles.itemText}>{copiedKey === key ? '✓' : item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  item: { minWidth: 52, height: 48, paddingHorizontal: 12, borderRadius: radii.small, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 18, color: colors.ink, fontFamily: type.semibold },
  pressed: { opacity: 0.7 },
});
