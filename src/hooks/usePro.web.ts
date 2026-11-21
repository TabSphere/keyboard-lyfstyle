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
    isPro: false,
    price: '',
    connected: false,
    busy,
    message,
    setMessage,
    purchase: explain,
    restore: explain,
  };
}
