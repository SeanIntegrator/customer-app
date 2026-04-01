import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { getCafeSocket } from '../lib/cafeSocket';

const OrderEventsContext = createContext(null);

export function OrderEventsProvider({ children }) {
  const listenersRef = useRef({
    customerOrderCompleted: new Set(),
    orderCancelled: new Set(),
    orderUpdated: new Set(),
  });

  useEffect(() => {
    const socket = getCafeSocket();
    if (!socket) return undefined;

    const dispatch = (eventName, payload) => {
      for (const cb of listenersRef.current[eventName] || []) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[order-events] ${eventName} listener failed`, err);
        }
      }
    };

    const onCompleted = (payload) => dispatch('customerOrderCompleted', payload);
    const onCancelled = (payload) => dispatch('orderCancelled', payload);
    const onUpdated = (payload) => dispatch('orderUpdated', payload);

    socket.on('customerOrderCompleted', onCompleted);
    socket.on('orderCancelled', onCancelled);
    socket.on('orderUpdated', onUpdated);

    return () => {
      socket.off('customerOrderCompleted', onCompleted);
      socket.off('orderCancelled', onCancelled);
      socket.off('orderUpdated', onUpdated);
    };
  }, []);

  const subscribe = useCallback((eventName, listener) => {
    const set = listenersRef.current[eventName];
    if (!set || typeof listener !== 'function') return () => {};
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }, []);

  const value = useMemo(() => ({ subscribe }), [subscribe]);
  return <OrderEventsContext.Provider value={value}>{children}</OrderEventsContext.Provider>;
}

export function useOrderEvents() {
  const ctx = useContext(OrderEventsContext);
  if (!ctx) throw new Error('useOrderEvents must be used within OrderEventsProvider');
  return ctx;
}
