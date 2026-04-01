import { useCallback, useRef, useState } from 'react';

export function usePostCheckoutFeedbackDomain({
  editOrderId,
  addingToOrderId,
  setEditOrderId,
  setAddingToOrderId,
  setActiveOrder,
  setItems,
  setOrderAllergens,
}) {
  const [postCheckoutFeedbackOrderId, setPostCheckoutFeedbackOrderId] = useState(null);
  const pendingKdsFeedbackRef = useRef([]);
  const editOrderIdRef = useRef(editOrderId);
  const addingToOrderIdRef = useRef(addingToOrderId);
  editOrderIdRef.current = editOrderId;
  addingToOrderIdRef.current = addingToOrderId;

  const beginPostCheckoutFeedback = useCallback((orderId) => {
    if (orderId == null || orderId === '') return;
    setPostCheckoutFeedbackOrderId(orderId);
  }, []);

  const clearPostCheckoutFeedback = useCallback(() => setPostCheckoutFeedbackOrderId(null), []);

  const registerPendingKdsFeedback = useCallback(({ dbOrderId, squareOrderId }) => {
    if (dbOrderId == null || squareOrderId == null || squareOrderId === '') return;
    pendingKdsFeedbackRef.current.push({
      dbOrderId: Number(dbOrderId),
      squareOrderId: String(squareOrderId),
    });
  }, []);

  const applyKdsOrderCompleted = useCallback(
    (payload) => {
      const incomingDb = payload?.dbOrderId;
      const sq = payload?.squareOrderId != null ? String(payload.squareOrderId) : '';

      setActiveOrder((prev) => {
        if (!prev) return prev;
        const prevDb = prev.dbOrderId ?? prev.orderId;
        const matchDb = incomingDb != null && prevDb != null && Number(prevDb) === Number(incomingDb);
        const matchSq = sq !== '' && prev.squareOrderId != null && String(prev.squareOrderId) === sq;
        if (matchDb || matchSq) return null;
        return prev;
      });

      const list = pendingKdsFeedbackRef.current;
      const idx = list.findIndex(
        (o) =>
          (incomingDb != null && Number(o.dbOrderId) === Number(incomingDb)) ||
          (sq !== '' && o.squareOrderId === sq)
      );

      let feedbackOrderId = null;
      if (idx !== -1) {
        const [hit] = list.splice(idx, 1);
        feedbackOrderId = hit.dbOrderId;
      }

      if (incomingDb != null) {
        const dbN = Number(incomingDb);
        const ed = editOrderIdRef.current;
        const ad = addingToOrderIdRef.current;
        if (ed != null && Number(ed) === dbN) {
          setEditOrderId(null);
          setItems([]);
          setOrderAllergens([]);
          if (feedbackOrderId == null) feedbackOrderId = dbN;
        }
        if (ad != null && Number(ad) === dbN) {
          setAddingToOrderId(null);
          setItems([]);
          setOrderAllergens([]);
          if (feedbackOrderId == null) feedbackOrderId = dbN;
        }
      }

      if (feedbackOrderId != null) {
        beginPostCheckoutFeedback(feedbackOrderId);
      }
    },
    [beginPostCheckoutFeedback, setActiveOrder, setAddingToOrderId, setEditOrderId, setItems, setOrderAllergens]
  );

  return {
    postCheckoutFeedbackOrderId,
    beginPostCheckoutFeedback,
    clearPostCheckoutFeedback,
    registerPendingKdsFeedback,
    applyKdsOrderCompleted,
  };
}
