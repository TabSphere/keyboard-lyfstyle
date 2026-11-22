import { useCallback, useState } from 'react';

export function usePro() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const explain = useCallback(async () => {
    setBusy(true);
    setMessage('Purchases and restore are available in the native iPhone and Android apps.');
    setBusy(false);
  }, []);

  return {
    // Web has no store. `lyfstyle.demoPro = 1` in localStorage shows the unlocked app
    // (used to capture store screenshots); it unlocks nothing on phones.
    isPro: typeof localStorage !== 'undefined' && localStorage.getItem('lyfstyle.demoPro') === '1',
    price: '',
    connected: false,
    busy,
    message,
    setMessage,
    purchase: explain,
    restore: explain,
  };
}
