import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { finishTransaction, useIAP, type Purchase } from 'expo-iap';
import NativeKeyboard from '../nativeKeyboard';
import { PRODUCT_ID } from '../styleEngine';

const CACHE_KEY = 'lyfstyle.pro.cache';

export function usePro() {
  const [cachedPro, setCachedPro] = useState(false);
  const [storePro, setStorePro] = useState(false);
  const [storeChecked, setStoreChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const persist = useCallback(async (value: boolean) => {
    setCachedPro(value);
    setStorePro(value);
    await AsyncStorage.setItem(CACHE_KEY, value ? '1' : '0');
    if (Platform.OS !== 'web') await NativeKeyboard.setProUnlocked(value);
  }, []);

  const onPurchaseSuccess = useCallback(async (purchase: Purchase) => {
    if (purchase.productId !== PRODUCT_ID || purchase.purchaseState !== 'purchased') return;
    await persist(true);
    await finishTransaction({ purchase, isConsumable: false });
    setMessage('Lifetime Pro is unlocked.');
  }, [persist]);

  const {
    connected,
    fetchProducts,
    getAvailablePurchases,
    availablePurchases,
    requestPurchase,
    restorePurchases,
    products,
  } = useIAP({
    onPurchaseSuccess,
    onPurchaseError: (error) => {
      if (Platform.OS !== 'web') setMessage(error.message);
    },
    onError: (error) => {
      if (Platform.OS !== 'web') setMessage(error.message);
    },
  });

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then((value) => setCachedPro(value === '1')).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!connected || Platform.OS === 'web') return;
    setStoreChecked(false);
    Promise.all([
      fetchProducts({ skus: [PRODUCT_ID], type: 'in-app' }),
      getAvailablePurchases(),
    ]).then(() => setStoreChecked(true)).catch((error: Error) => setMessage(error.message));
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    if (!storeChecked || Platform.OS === 'web') return;
    const owns = availablePurchases.some((purchase) =>
      purchase.productId === PRODUCT_ID && purchase.purchaseState === 'purchased'
    );
    setStorePro(owns);
    setCachedPro(owns);
    AsyncStorage.setItem(CACHE_KEY, owns ? '1' : '0').catch(() => undefined);
    NativeKeyboard.setProUnlocked(owns).catch(() => undefined);
  }, [availablePurchases, storeChecked]);

  const purchase = useCallback(async () => {
    if (Platform.OS === 'web') {
      setMessage('Purchases are available in the iPhone and Android apps.');
      return;
    }
    setBusy(true); setMessage('');
    try {
      await requestPurchase({
        type: 'in-app',
        request: {
          apple: { sku: PRODUCT_ID, quantity: 1 },
          google: { skus: [PRODUCT_ID] },
        },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Purchase could not be started.');
    } finally {
      setBusy(false);
    }
  }, [requestPurchase]);

  const restore = useCallback(async () => {
    if (Platform.OS === 'web') {
      setMessage('Restore Purchases is available in the native apps.');
      return;
    }
    setBusy(true); setMessage('Checking the store…');
    try {
      await restorePurchases();
      await getAvailablePurchases();
      setStoreChecked(true);
      setMessage('Purchase history refreshed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Restore failed.');
    } finally {
      setBusy(false);
    }
  }, [restorePurchases, getAvailablePurchases]);

  const product = useMemo(() => products.find((item) => item.id === PRODUCT_ID), [products]);

  return {
    isPro: storePro || (!storeChecked && cachedPro),
    price: product?.displayPrice ?? '',
    connected,
    busy,
    message,
    setMessage,
    purchase,
    restore,
  };
}
