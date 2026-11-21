import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { usePro } from '../hooks/usePro';
import {
  applyDecoration,
  decorations,
  getStyle,
  transformText,
} from '../styleEngine';

const DRAFT_KEY = 'lyfstyle.composer.v1';

type StoredComposer = {
  text: string;
  selectedStyle: string;
  selectedDecoration: string;
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
  selectDecoration: (value: string) => void;
  toggleFavorite: (value: string) => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: PropsWithChildren) {
  const pro = usePro();
  const [text, setText] = useState('Make it yours.');
  const [selectedStyle, setSelectedStyle] = useState('script');
  const [selectedDecoration, setSelectedDecoration] = useState('');
  const [favorites, setFavorites] = useState(['bold', 'script']);
  const [recents, setRecents] = useState(['script']);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then((stored) => {
      if (!stored) return;
      const value = JSON.parse(stored) as Partial<StoredComposer>;
      if (typeof value.text === 'string') setText(value.text);
      if (typeof value.selectedStyle === 'string') setSelectedStyle(getStyle(value.selectedStyle).id);
      if (typeof value.selectedDecoration === 'string') {
        setSelectedDecoration(decorations.some((item) => item.id === value.selectedDecoration) ? value.selectedDecoration : '');
      }
      if (Array.isArray(value.favorites)) setFavorites(value.favorites.filter((id) => typeof id === 'string'));
      if (Array.isArray(value.recents)) setRecents(value.recents.filter((id) => typeof id === 'string').slice(0, 6));
    }).catch(() => undefined).finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const value: StoredComposer = { text, selectedStyle, selectedDecoration, favorites, recents };
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(value)).catch(() => undefined);
  }, [favorites, hydrated, recents, selectedDecoration, selectedStyle, text]);

  const selectStyle = useCallback((value: string) => {
    const id = getStyle(value).id;
    setSelectedStyle(id);
    if (id !== 'normal') setRecents((current) => [id, ...current.filter((item) => item !== id)].slice(0, 6));
  }, []);

  const toggleFavorite = useCallback((value: string) => {
    setFavorites((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }, []);

  const output = useMemo(() => applyDecoration(
    transformText(text, selectedStyle),
    selectedDecoration,
  ), [selectedDecoration, selectedStyle, text]);

  const locked = useMemo(() => {
    const styleLocked = getStyle(selectedStyle).isPro;
    const decorationLocked = decorations.find((item) => item.id === selectedDecoration)?.isPro ?? false;
    return !pro.isPro && (styleLocked || decorationLocked);
  }, [pro.isPro, selectedDecoration, selectedStyle]);

  const value = useMemo<ComposerContextValue>(() => ({
    text,
    selectedStyle,
    selectedDecoration,
    favorites,
    recents,
    output,
    locked,
    hydrated,
    pro,
    setText,
    selectStyle,
    selectDecoration: setSelectedDecoration,
    toggleFavorite,
  }), [favorites, hydrated, locked, output, pro, recents, selectStyle, selectedDecoration, selectedStyle, text, toggleFavorite]);

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useComposer() {
  const value = useContext(ComposerContext);
  if (!value) throw new Error('useComposer must be used inside ComposerProvider');
  return value;
}
