import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LockKeyhole, Star } from 'lucide-react-native';
import { useComposer } from '../../state/ComposerContext';
import { styles as fontStyles, themes, transformText, type KeyboardTheme } from '../../styleEngine';
import { colors } from '../../theme/tokens';
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
      <PageTitle title="One alphabet." italic="Many moods.">
        Browse every look with your own words. Tap a style to take it back to the composer; star the ones you love.
      </PageTitle>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            accessibilityState={{ selected: filter === item }}
            style={[styles.filter, filter === item && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.collectionHeading}>
        <Eyebrow>{filter === 'All' ? 'THE COMPLETE COLLECTION' : filter.toUpperCase()}</Eyebrow>
        <Text style={styles.resultCount}>{visible.length} {visible.length === 1 ? 'LOOK' : 'LOOKS'}</Text>
      </View>

      <View style={styles.styleList}>
        {visible.map((style, index) => {
          const favorite = composer.favorites.includes(style.id);
          const selected = composer.selectedStyle === style.id;
          return (
            <View key={style.id} style={[styles.styleRow, selected && styles.styleRowSelected]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Use ${style.name}`}
                onPress={() => {
                  composer.selectStyle(style.id);
                  router.push('/');
                }}
                style={({ pressed }) => [styles.styleMain, pressed && styles.pressed]}
              >
                <Text style={styles.styleIndex}>{String(index + 1).padStart(2, '0')}</Text>
                <View style={styles.styleCopy}>
                  <View style={styles.styleNameRow}>
                    <Text style={styles.styleName}>{style.name}</Text>
                    {style.isPro ? <ProLabel /> : null}
                  </View>
                  <Text numberOfLines={2} style={styles.preview}>{transformText(sample, style.id)}</Text>
                  <Text style={styles.description}>{style.description}</Text>
                </View>
                {style.isPro && !composer.pro.isPro ? <LockKeyhole size={15} color={colors.muted} /> : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${style.name} ${favorite ? 'from' : 'to'} favorites`}
                onPress={() => composer.toggleFavorite(style.id)}
                hitSlop={8}
                style={({ pressed }) => [styles.favorite, pressed && styles.pressed]}
              >
                <Star size={19} color={favorite ? colors.ink : colors.muted} fill={favorite ? colors.accent : 'transparent'} strokeWidth={1.5} />
              </Pressable>
            </View>
          );
        })}
        {!visible.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No favorites yet.</Text>
            <Text style={styles.emptyCopy}>Star a look and it will wait for you here.</Text>
            <Pressable onPress={() => setFilter('All')} style={styles.emptyAction}><Text style={styles.emptyActionText}>Browse all looks</Text></Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.themeSection}>
        <Eyebrow>THE KEYBOARD, DRESSED UP</Eyebrow>
        <Text style={styles.themeTitle}>Four quiet palettes.</Text>
        <Text style={styles.themeIntro}>Porcelain, Ink, Mono and Blush. Use the palette control inside Lyfstyle Keyboard to switch themes.</Text>
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
  filterScroll: { marginHorizontal: -22 },
  filters: { paddingHorizontal: 22, gap: 6, paddingBottom: 22 },
  filter: { paddingHorizontal: 13, minHeight: 36, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.line },
  filterActive: { borderBottomColor: colors.ink, backgroundColor: colors.accent },
  filterText: { fontFamily: type.medium, color: colors.muted, fontSize: 12 },
  filterTextActive: { color: colors.ink },
  collectionHeading: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.ink },
  resultCount: { fontFamily: type.bold, fontSize: 9, letterSpacing: 1, color: colors.muted },
  styleList: { width: '100%' },
  styleRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, paddingRight: 2 },
  styleRowSelected: { backgroundColor: colors.surface },
  styleMain: { flex: 1, flexDirection: 'row', gap: 13, paddingVertical: 19, alignItems: 'flex-start' },
  styleIndex: { fontFamily: type.bold, fontSize: 9, color: colors.muted, marginTop: 5, width: 18 },
  styleCopy: { flex: 1 },
  styleNameRow: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  styleName: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  preview: { color: colors.ink, fontSize: 24, lineHeight: 34, marginTop: 5, marginRight: 5 },
  description: { fontFamily: type.sans, color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3, marginRight: 8 },
  favorite: { width: 42, height: 48, justifyContent: 'center', alignItems: 'flex-end' },
  pressed: { opacity: 0.6 },
  empty: { paddingVertical: 44, alignItems: 'flex-start' },
  emptyTitle: { fontFamily: type.display, color: colors.ink, fontSize: 31 },
  emptyCopy: { fontFamily: type.sans, color: colors.muted, fontSize: 14, marginTop: 6 },
  emptyAction: { marginTop: 18, borderBottomWidth: 1, borderBottomColor: colors.ink, paddingBottom: 4 },
  emptyActionText: { fontFamily: type.semibold, color: colors.ink, fontSize: 13 },
  themeSection: { marginTop: 42 },
  themeTitle: { fontFamily: type.display, color: colors.ink, fontSize: 35, marginTop: 6 },
  themeIntro: { fontFamily: type.sans, color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 450 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  themeCard: { width: '47%', minWidth: 145, flexGrow: 1, borderWidth: 1, padding: 10, borderRadius: 8 },
  themeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  themeName: { fontFamily: type.semibold, fontSize: 12 },
  themeAccent: { width: 16, height: 4, borderRadius: 4 },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginBottom: 3 },
  key: { width: 15, height: 21, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: type.medium, fontSize: 6 },
  space: { height: 16, width: '56%', alignSelf: 'center', borderRadius: 3, marginTop: 2 },
});
