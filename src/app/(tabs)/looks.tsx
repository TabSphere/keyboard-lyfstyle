import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LockKeyhole, Star } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { styles as fontStyles, themes, transformText, type KeyboardTheme } from '../../styleEngine';
import { colors, radii } from '../../theme/tokens';
import { Eyebrow, PageTitle, ProLabel, Screen, type } from '../../components/ui';

const collection = fontStyles.filter((style) => style.id !== 'normal');
const filters = ['All', 'Favorites', ...new Set(collection.map((style) => style.category))];

export default function LooksScreen() {
  const composer = useComposer();
  const [filter, setFilter] = useState('All');
  const visible = useMemo(() => collection.filter((style) => {
    if (filter === 'All') return true;
    if (filter === 'Favorites') return composer.favorites.includes(style.id);
    return style.category === filter;
  }), [composer.favorites, filter]);
  const sample = composer.text.trim().split('\n')[0].slice(0, 30) || 'Make it yours.';

  return (
    <Screen>
      <PageTitle title="Find your" italic="look." compact>
        Every specimen uses your words. Tap one to write with it.
      </PageTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)}
            style={({ pressed }) => [styles.filter, filter === item && styles.filterActive, pressed && styles.pressed]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.collectionHeading}>
        <Eyebrow>{filter === 'All' ? 'THE COLLECTION' : filter.toUpperCase()}</Eyebrow>
        <Text style={styles.resultCount}>{visible.length} {visible.length === 1 ? 'LOOK' : 'LOOKS'}</Text>
      </View>

      <View style={styles.styleGrid}>
        {visible.map((style, index) => {
          const favorite = composer.favorites.includes(style.id);
          const selected = composer.selectedStyle === style.id;
          return (
            <View key={style.id} style={[styles.styleCard, selected && styles.styleCardSelected]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use ${style.name}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  composer.selectStyle(style.id);
                  router.push('/');
                }}
                style={({ pressed }) => [styles.styleMain, pressed && styles.pressed]}
              >
                <View style={styles.styleMeta}>
                  <Text style={styles.styleIndex}>{String(index + 1).padStart(2, '0')}</Text>
                  {selected ? <Text style={styles.inUse}>IN USE</Text> : null}
                </View>
                <Text numberOfLines={3} style={styles.preview}>{transformText(sample, style.id)}</Text>
                <View style={styles.styleNameRow}>
                  <Text numberOfLines={1} style={styles.styleName}>{style.name}</Text>
                  {style.isPro ? <ProLabel /> : null}
                  {style.isPro && !composer.pro.isPro ? <LockKeyhole size={12} color={colors.muted} /> : null}
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${style.name} ${favorite ? 'from' : 'to'} favorites`}
                onPress={() => composer.toggleFavorite(style.id)}
                hitSlop={6}
                style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
              >
                <Star size={18} color={favorite ? colors.accentDeep : colors.tertiary} fill={favorite ? colors.accent : 'transparent'} strokeWidth={1.6} />
              </Pressable>
            </View>
          );
        })}
      </View>
      {!visible.length ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No favorites yet.</Text>
          <Text style={styles.emptyCopy}>Star a look and it will wait for you here.</Text>
          <Pressable accessibilityRole="button" onPress={() => setFilter('All')} style={styles.emptyAction}>
            <Text style={styles.emptyActionText}>Browse all looks</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.themeSection}>
        <Eyebrow>KEYBOARD THEMES</Eyebrow>
        <Text style={styles.themeTitle}>Four quiet palettes.</Text>
        <Text style={styles.themeIntro}>Switch between Porcelain, Ink, Mono and Blush with the palette control inside Lyfstyle Keyboard.</Text>
        <View style={styles.themeGrid}>
          {themes.map((theme) => <ThemePreview key={theme.id} theme={theme} />)}
        </View>
      </View>
    </Screen>
  );
}

function ThemePreview({ theme }: { theme: KeyboardTheme }) {
  return (
    <View style={[styles.themeCard, { backgroundColor: theme.background, borderColor: theme.dark ? theme.secondary : colors.line }]}>
      <View style={styles.themeHeader}>
        <Text style={[styles.themeName, { color: theme.text }]}>{theme.name}</Text>
        <View style={[styles.themeAccent, { backgroundColor: theme.accent }]} />
      </View>
      {['QWERTYUI', 'ASDFGHJ', 'ZXCVBNM'].map((row) => (
        <View key={row} style={styles.keyRow}>
          {[...row].map((key) => (
            <View key={key} style={[styles.key, { backgroundColor: theme.key }]}>
              <Text style={[styles.keyText, { color: theme.text }]}>{key}</Text>
            </View>
          ))}
        </View>
      ))}
      <View style={[styles.space, { backgroundColor: theme.key }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  filterScroll: { marginHorizontal: -20 },
  filters: { paddingHorizontal: 20, gap: 8, paddingBottom: 20 },
  filter: { paddingHorizontal: 15, minHeight: 38, justifyContent: 'center', borderRadius: radii.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  filterActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  filterText: { fontFamily: type.medium, color: colors.muted, fontSize: 12 },
  filterTextActive: { color: colors.accentDeep },
  collectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12 },
  resultCount: { fontFamily: type.mono, fontSize: 10, letterSpacing: 0.7, color: colors.muted },
  styleGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  styleCard: { flexBasis: '47%', flexGrow: 1, maxWidth: '49%', minHeight: 184, borderRadius: radii.medium, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' },
  styleCardSelected: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  styleMain: { flex: 1, padding: 14, paddingTop: 12 },
  styleMeta: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 30 },
  styleIndex: { fontFamily: type.mono, fontSize: 10, color: colors.tertiary },
  inUse: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5, color: colors.accentDeep },
  preview: { color: colors.ink, fontSize: 21, lineHeight: 29, minHeight: 87, marginTop: 8 },
  styleNameRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 8 },
  styleName: { fontFamily: type.semibold, color: colors.ink, fontSize: 12 },
  favorite: { position: 'absolute', top: 5, right: 5, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.64 },
  empty: { paddingVertical: 42, paddingHorizontal: 20, alignItems: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: radii.medium, backgroundColor: colors.surface },
  emptyTitle: { fontFamily: type.display, color: colors.ink, fontSize: 28 },
  emptyCopy: { fontFamily: type.sans, color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  emptyAction: { minHeight: 44, marginTop: 12, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.accentDeep },
  emptyActionText: { fontFamily: type.semibold, color: colors.accentDeep, fontSize: 13 },
  themeSection: { marginTop: 36, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.line },
  themeTitle: { fontFamily: type.display, color: colors.ink, fontSize: 29, lineHeight: 35, marginTop: 6 },
  themeIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 7, maxWidth: 480 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  themeCard: { width: '47%', minWidth: 145, flexGrow: 1, borderWidth: 1, padding: 11, borderRadius: radii.small },
  themeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  themeName: { fontFamily: type.semibold, fontSize: 12 },
  themeAccent: { width: 18, height: 5, borderRadius: 4 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginBottom: 3 },
  key: { width: 15, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: type.medium, fontSize: 7 },
  space: { height: 17, width: '56%', alignSelf: 'center', borderRadius: 4, marginTop: 2 },
});
