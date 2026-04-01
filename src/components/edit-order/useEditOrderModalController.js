import { useState, useEffect, useCallback } from 'react';
import { fetchCustomerOrder, updateCustomerOrder } from '../../lib/api';
import { adjustPickupStepper, pickupIsoToStepperMinutes } from '../../lib/pickup';
import { mapApiOrderToEditableLines, mapEditableLinesToUpdatePayload } from './mappers';

/**
 * Load/update flow for EditOrderModal. PATCH payload line_items always go through mappers.
 */
export function useEditOrderModalController({ orderId, open, authFetch, onSaved, onClose, user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [allergens, setAllergens] = useState([]);
  const [allergyToggle, setAllergyToggle] = useState(false);
  const [pickupMinutes, setPickupMinutes] = useState(10);
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isPaidViaStripe, setIsPaidViaStripe] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setUpdateSuccess(false);
      setIsPaidViaStripe(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || orderId == null) return;
    let cancelled = false;
    setUpdateSuccess(false);
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await fetchCustomerOrder(authFetch, orderId);
        if (cancelled) return;
        setIsPaidViaStripe(Boolean(o.is_paid_via_stripe));
        const ag = Array.isArray(o.allergens)
          ? o.allergens.map((x) => String(x).trim()).filter(Boolean)
          : [];
        setAllergens(ag);
        setAllergyToggle(ag.length > 0);
        setPickupMinutes(pickupIsoToStepperMinutes(o.pickup_time));
        setStatus(o.status || '');
        setLines(mapApiOrderToEditableLines(o));
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, orderId, authFetch]);

  const editable = status === 'pending' || status === 'confirmed';

  const adjustPickup = (delta) => {
    setPickupMinutes((m) => adjustPickupStepper(m, delta));
  };

  const bumpQty = (key, delta) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const removeLine = (key) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.key !== key);
      return next.length === 0 ? prev : next;
    });
  };

  const setLineCustomerNote = (key, text) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, customer_note: text } : l)));
  };

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  const handleSave = async () => {
    if (!editable || lines.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const allergenPayload = allergyToggle ? allergens : [];
      await updateCustomerOrder(authFetch, orderId, {
        customer_name: user?.displayName ?? 'Customer',
        note: null,
        allergens: allergenPayload,
        pickup_minutes: pickupMinutes,
        line_items: mapEditableLinesToUpdatePayload(lines),
      });
      onSaved?.();
      setUpdateSuccess(true);
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessDone = useCallback(() => {
    setUpdateSuccess(false);
    onClose();
  }, [onClose]);

  const onSwipeClose = useCallback(() => {
    if (updateSuccess) handleSuccessDone();
    else if (!loading) onClose();
  }, [updateSuccess, loading, onClose, handleSuccessDone]);

  return {
    loading,
    saving,
    error,
    allergens,
    setAllergens,
    allergyToggle,
    setAllergyToggle,
    pickupMinutes,
    lines,
    status,
    updateSuccess,
    isPaidViaStripe,
    editable,
    subtotal,
    bumpQty,
    removeLine,
    setLineCustomerNote,
    adjustPickup,
    handleSave,
    handleSuccessDone,
    onSwipeClose,
  };
}
