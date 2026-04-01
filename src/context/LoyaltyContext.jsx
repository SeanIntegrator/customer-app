import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useAppConfig } from './AppConfigContext';
import { fetchCustomerLoyalty } from '../lib/api';
import { STAMPS_PER_REWARD } from '../lib/loyaltyDiscount';

const LoyaltyContext = createContext(null);

export function LoyaltyProvider({ children }) {
  const { isAuthenticated, authFetch } = useAuth();
  const { loyalty } = useAppConfig();
  const stampsGoal = loyalty?.stampsPerReward ?? STAMPS_PER_REWARD;
  const [stampsCount, setStampsCount] = useState(0);
  const [rewardsAvailable, setRewardsAvailable] = useState(0);
  const [stampsToNextReward, setStampsToNextReward] = useState(stampsGoal);
  const [lastStampDate, setLastStampDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoyaltyState = useCallback(async () => {
    if (!isAuthenticated) {
      setStampsCount(0);
      setRewardsAvailable(0);
      setStampsToNextReward(stampsGoal);
      setLastStampDate(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerLoyalty(authFetch);
      setStampsCount(data.stamps_count ?? 0);
      setRewardsAvailable(data.rewards_available ?? 0);
      setStampsToNextReward(
        data.stamps_to_next_reward != null ? data.stamps_to_next_reward : stampsGoal
      );
      setLastStampDate(data.last_stamp_date ?? null);
    } catch (e) {
      setError(e?.message || 'Could not load loyalty');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authFetch, stampsGoal]);

  useEffect(() => {
    fetchLoyaltyState();
  }, [fetchLoyaltyState]);

  const refreshAfterOrder = useCallback(() => {
    return fetchLoyaltyState();
  }, [fetchLoyaltyState]);

  const value = useMemo(
    () => ({
      stampsCount,
      rewardsAvailable,
      stampsToNextReward,
      stampsGoal,
      lastStampDate,
      loading,
      error,
      fetchLoyaltyState,
      refreshAfterOrder,
      hasAvailableRewards: rewardsAvailable > 0,
    }),
    [
      stampsCount,
      rewardsAvailable,
      stampsToNextReward,
      stampsGoal,
      lastStampDate,
      loading,
      error,
      fetchLoyaltyState,
      refreshAfterOrder,
    ]
  );

  return <LoyaltyContext.Provider value={value}>{children}</LoyaltyContext.Provider>;
}

export function useLoyalty() {
  const ctx = useContext(LoyaltyContext);
  if (!ctx) throw new Error('useLoyalty must be used within LoyaltyProvider');
  return ctx;
}
