import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../utils/api';

export const UsageContext = createContext({
  status: null,
  loading: true,
  canUse: () => true,
  remaining: () => null,
  limit: () => null,
  used: () => 0,
  refresh: () => {},
  isPremium: false,
  onUpgrade: () => {}
});

export function useUsage() {
  return useContext(UsageContext);
}

export function UsageProvider({ children, onUpgrade }) {
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
    if (!status) return true;
    return status.features?.[feature]?.allowed ?? true;
  }, [status]);

  const remaining = useCallback((feature) => {
    const r = status?.features?.[feature]?.remaining;
    return (r === Infinity || r === null || r === undefined) ? null : r;
  }, [status]);

  const limit = useCallback((feature) => {
    const l = status?.features?.[feature]?.limit;
    return (l === Infinity || l === null || l === undefined) ? null : l;
  }, [status]);

  const used = useCallback((feature) => {
    return status?.features?.[feature]?.used ?? 0;
  }, [status]);

  return (
    <UsageContext.Provider value={{
      status, loading, canUse, remaining, limit, used, refresh,
      isPremium: status?.isPremium ?? false,
      onUpgrade
    }}>
      {children}
    </UsageContext.Provider>
  );
}
