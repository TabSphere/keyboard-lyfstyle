import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { keyboardPayload, MAX_CUSTOM_STYLES, resolveCustomStyle, sanitizeSpec, type CustomStyleSpec } from '../customStyles';
import { usePro } from '../hooks/usePro';
import NativeKeyboard from '../nativeKeyboard';
import { getStyle, registerCustomStyles, transformText, type Lyfstyle } from '../styleEngine';

const DRAFT_KEY = 'lyfstyle.composer.v2';
const CUSTOM_KEY = 'lyfstyle.customStyles.v1';

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
  /** Styles the person made, newest first. */
  customSpecs: CustomStyleSpec[];
  customs: Lyfstyle[];
  saveCustomStyle: (spec: CustomStyleSpec) => void;
  deleteCustomStyle: (id: string) => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: PropsWithChildren) {
  const pro = usePro();
  const [text, setText] = useState('soft but savage');
  const [selectedStyle, setSelectedStyle] = useState('frame-sparkles');
  const [favorites, setFavorites] = useState<string[]>(['frame-sparkles', 'script']);
  const [recents, setRecents] = useState<string[]>([]);
  const [customSpecs, setCustomSpecs] = useState<CustomStyleSpec[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Custom styles are registered before the saved selection is read, so a chosen custom style survives a restart.
  const customs = useMemo(() => {
    const list = customSpecs.map(resolveCustomStyle);
    registerCustomStyles(list);
    return list;
  }, [customSpecs]);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(DRAFT_KEY), AsyncStorage.getItem(CUSTOM_KEY)]).then(([stored, storedCustoms]) => {
      if (storedCustoms) {
        const parsed = JSON.parse(storedCustoms) as unknown;
        const specs = Array.isArray(parsed) ? parsed.map(sanitizeSpec).filter((spec): spec is CustomStyleSpec => spec !== null) : [];
        registerCustomStyles(specs.map(resolveCustomStyle));
        setCustomSpecs(specs);
      }
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

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(customSpecs)).catch(() => undefined);
    // The keyboards show these under "My styles" (letters only).
    if (Platform.OS !== 'web') NativeKeyboard.setCustomStyles(keyboardPayload(customs)).catch(() => undefined);
  }, [customSpecs, customs, hydrated]);

  const saveCustomStyle = useCallback((spec: CustomStyleSpec) => {
    setCustomSpecs((current) => {
      const exists = current.some((item) => item.id === spec.id);
      if (exists) return current.map((item) => (item.id === spec.id ? spec : item));
      return [spec, ...current].slice(0, MAX_CUSTOM_STYLES);
    });
  }, []);

  const deleteCustomStyle = useCallback((id: string) => {
    setCustomSpecs((current) => current.filter((item) => item.id !== id));
    setFavorites((current) => current.filter((item) => item !== id));
    setRecents((current) => current.filter((item) => item !== id));
    setSelectedStyle((current) => (current === id ? 'frame-sparkles' : current));
  }, []);

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

  // customs is a dependency so edits to the selected custom style show at once.
  const output = useMemo(() => (customs ? transformText(text, selectedStyle) : text), [customs, selectedStyle, text]);
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
    customSpecs,
    customs,
    saveCustomStyle,
    deleteCustomStyle,
  }), [customSpecs, customs, deleteCustomStyle, favorites, hydrated, locked, output, pro, recents, rememberCopy, saveCustomStyle, selectStyle, selectedStyle, text, toggleFavorite]);

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>;
}

export function useComposer() {
  const value = useContext(ComposerContext);
  if (!value) throw new Error('useComposer must be used inside ComposerProvider');
  return value;
}
