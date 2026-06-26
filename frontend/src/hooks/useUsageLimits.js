import { useState, useCallback, useEffect, useContext } from 'react';
import { api } from '../utils/api';
import { UsageContext } from '../context/UsageContext';

/**
 * useUsageLimits
 * Fetches and caches usage status from /api/usage/status.
 * Returns helpers to check limits and increment usage.
 */
export function useUsageLimits() {
  const context = useContext(UsageContext);
  return context;
}

/**
 * Standalone hook for pages outside the UsageContext tree.
 * Generally prefer UsageContext via Dashboard.
 */
export function useUsageLimitsStandalone() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/usage/status');
      setStatus(data);
    } catch (err) {
      console.error('Usage status fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const canUse = useCallback((feature) => {
    if (!status) return true; // optimistic while loading
    return status.features?.[feature]?.allowed ?? true;
  }, [status]);

  const remaining = useCallback((feature) => {
    if (!status) return null;
    const r = status.features?.[feature]?.remaining;
    return r === Infinity ? null : r;
  }, [status]);

  const limit = useCallback((feature) => {
    if (!status) return null;
    const l = status.features?.[feature]?.limit;
    return l === Infinity ? null : l;
  }, [status]);

  const used = useCallback((feature) => {
    return status?.features?.[feature]?.used ?? 0;
  }, [status]);

  return { status, loading, canUse, remaining, limit, used, refresh, isPremium: status?.isPremium };
}
