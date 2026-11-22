import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { usePro } from '../hooks/usePro';
import { getStyle, transformText } from '../styleEngine';

const DRAFT_KEY = 'lyfstyle.composer.v2';

type StoredComposer = {
  text: string;
  selectedStyle: string;
  favorites: string[];
  recents: string[];
};

type ComposerContextValue = StoredComposer & {
  output: string;
  locked: boolean;
  hydrated: boolean;
  pro: ReturnType<typeof usePro>;
  setText: (value: string) => void;
  selectStyle: (value: string) => void;
  toggleFavorite: (value: string) => void;
  rememberCopy: (value: string) => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: PropsWithChildren) {
  const pro = usePro();
  const [text, setText] = useState('soft but savage');
  const [selectedStyle, setSelectedStyle] = useState('frame-sparkles');
  const [favorites, setFavorites] = useState<string[]>(['frame-sparkles', 'script']);
  const [recents, setRecents] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((stored) => {
      if (!stored) return;
      const value = JSON.parse(stored) as Partial<StoredComposer>;
      if (typeof value.text === 'string') setText(value.text);
      if (typeof value.selectedStyle === 'string') setSelectedStyle(getStyle(value.selectedStyle).id);
      if (Array.isArray(value.favorites)) setFavorites(value.favorites.filter((id) => typeof id === 'string'));
      if (Array.isArray(value.recents)) setRecents(value.recents.filter((id) => typeof id === 'string').slice(0, 8));
    }).catch(() => undefined).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const value: StoredComposer = { text, selectedStyle, favorites, recents };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(value)).catch(() => undefined);
  }, [favorites, hydrated, recents, selectedStyle, text]);

  const selectStyle = useCallback((value: string) => setSelectedStyle(getStyle(value).id), []);

  const rememberCopy = useCallback((value: string) => {
    if (value === 'normal') return;
    setRecents((current) => [value, ...current.filter((item) => item !== value)].slice(0, 8));
  }, []);

  const toggleFavorite = useCallback((value: string) => {
    setFavorites((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }, []);

  const output = useMemo(() => transformText(text, selectedStyle), [selectedStyle, text]);
  const locked = !pro.isPro && getStyle(selectedStyle).isPro;

  const value = useMemo<ComposerContextValue>(() => ({
    text,
    selectedStyle,
    favorites,
    recents,
    output,
    locked,
    hydrated,
    pro,
    setText,
    selectStyle,
    toggleFavorite,
    rememberCopy,
  }), [favorites, hydrated, locked, output, pro, recents, rememberCopy, selectStyle, selectedStyle, text, toggleFavorite]);

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useComposer() {
  const value = useContext(ComposerContext);
  if (!value) throw new Error('useComposer must be used inside ComposerProvider');
  return value;
}
