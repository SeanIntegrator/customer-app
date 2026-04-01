import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { fetchCustomerConfig } from '../lib/api';

const DEFAULT_CONFIG = {
  loyalty: {
    stampThresholdPence: 200,
    stampsPerReward: 9,
    rewardMaxPence: 700,
    stripeMinAmountPence: 30,
    doubleStampWeekday: 2,
  },
  reward: {
    drinkCategorySlugs: ['matcha', 'hot-drinks', 'iced-drinks'],
  },
};

const AppConfigContext = createContext(null);

export function AppConfigProvider({ children }) {
  const { isAuthenticated, authFetch } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated) {
      setConfig(DEFAULT_CONFIG);
      return undefined;
    }

    (async () => {
      try {
        const data = await fetchCustomerConfig(authFetch);
        if (cancelled) return;
        setConfig({
          loyalty: { ...DEFAULT_CONFIG.loyalty, ...(data.loyalty || {}) },
          reward: { ...DEFAULT_CONFIG.reward, ...(data.reward || {}) },
        });
      } catch {
        if (!cancelled) setConfig(DEFAULT_CONFIG);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authFetch]);

  const value = useMemo(() => config, [config]);
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const ctx = useContext(AppConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within AppConfigProvider');
  return ctx;
}
