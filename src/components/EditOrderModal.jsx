import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCustomerOrder, updateCustomerOrder } from '../lib/api';

const MIN_PICKUP = 0;
const STEP = 5;
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

function minutesFromPickup(iso) {
  if (!iso) return 10;
  return Math.max(0, Math.round((new Date(iso) - Date.now()) / 60000));
}

function formatPickupLabel(minutes) {
  if (minutes === 0) return 'ASAP';
  const d = new Date(Date.now() + minutes * 60 * 1000);
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const stepperBtn = {
  width: 28,
  height: 28,
  borderRadius: '48%',
  background: 'rgba(26,46,26,0.08)',
  border: '1.5px solid #d4c0a0',
  color: '#1a2e1a',
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export default function EditOrderModal({
  orderId,
  open,
  onClose,
  authFetch,
  onSaved,
  onAddMoreItems,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [pickupMinutes, setPickupMinutes] = useState(10);
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open || orderId == null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await fetchCustomerOrder(authFetch, orderId);
        if (cancelled) return;
        setCustomerName(o.customer_name || '');
        setNote(o.notes || '');
        setPickupMinutes(minutesFromPickup(o.pickup_time));
        setStatus(o.status || '');
        setLines(
          (o.items || []).map((it, idx) => ({
            key: `${it.id}-${idx}`,
            square_variation_id: it.square_variation_id,
            item_name: it.item_name,
            item_emoji: it.item_emoji || '☕',
            quantity: it.quantity,
            unit_price: it.unit_price,
            modifiers: it.modifiers || [],
          }))
        );
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
    setPickupMinutes((m) => Math.max(MIN_PICKUP, m + delta));
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

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);

  const handleSave = async () => {
    if (!editable || lines.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateCustomerOrder(authFetch, orderId, {
        customer_name: customerName,
        note,
        pickup_minutes: pickupMinutes,
        line_items: lines.map((l) => ({
          catalog_object_id: l.square_variation_id,
          quantity: l.quantity,
          item_name: l.item_name,
          unit_price: l.unit_price,
          emoji: l.item_emoji,
          modifiers: l.modifiers,
        })),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 160,
              background: 'rgba(8,16,8,0.82)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 170,
              maxHeight: '92vh',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#f0e6d0',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: GRAIN,
                  backgroundRepeat: 'repeat',
                  pointerEvents: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                <div style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px 18px',
                  position: 'relative',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#f0e6d0',
                    margin: 0,
                  }}
                >
                  Edit order
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(240,230,208,0.15)',
                    border: '1.5px solid rgba(240,230,208,0.2)',
                    color: '#f0e6d0',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0" style={{ padding: '16px 20px 100px' }}>
              {loading && (
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'rgba(26,46,26,0.5)' }}>
                  Loading…
                </p>
              )}
              {!loading && error && !lines.length && (
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#b34a2a' }}>{error}</p>
              )}
              {!loading && !editable && (
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#8a6a48' }}>
                  This order can no longer be edited (status: {status}).
                </p>
              )}
              {!loading && editable && (
                <>
                  <label
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(26,46,26,0.45)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Name
                  </label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1.5px solid #e0d0b0',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 14,
                      marginBottom: 14,
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {lines.map((l) => (
                      <div
                        key={l.key}
                        style={{
                          background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
                          border: '1.5px solid #e0d0b0',
                          borderRadius: 18,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <span style={{ fontSize: 26 }}>{l.item_emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#1a2e1a',
                              margin: 0,
                            }}
                          >
                            {l.item_name}
                          </p>
                          <p
                            style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 11,
                              color: 'rgba(26,46,26,0.45)',
                              margin: '4px 0 0',
                            }}
                          >
                            £{(l.unit_price / 100).toFixed(2)} ea.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" onClick={() => bumpQty(l.key, -1)} style={stepperBtn}>
                            −
                          </button>
                          <span
                            style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontSize: 15,
                              fontWeight: 700,
                              width: 18,
                              textAlign: 'center',
                            }}
                          >
                            {l.quantity}
                          </span>
                          <button type="button" onClick={() => bumpQty(l.key, 1)} style={stepperBtn}>
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(l.key)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#b34a2a',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 12,
                      color: 'rgba(26,46,26,0.5)',
                      marginBottom: 10,
                    }}
                  >
                    Want more drinks? Add from the menu — we&apos;ll merge into this order at checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddMoreItems?.()}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 14,
                      border: '1.5px dashed #c8b090',
                      background: 'rgba(255,255,255,0.4)',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#5a6a48',
                      cursor: 'pointer',
                      marginBottom: 16,
                    }}
                  >
                    Add more items →
                  </button>

                  <label
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgba(26,46,26,0.45)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Note for barista
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Optional"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1.5px solid #e0d0b0',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 13,
                      resize: 'none',
                      marginBottom: 16,
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.5)',
                      border: '1.5px solid #e0d0b0',
                      borderRadius: 16,
                      padding: '12px 16px',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#1a2e1a',
                          margin: 0,
                        }}
                      >
                        Pickup
                      </p>
                      <p
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 12,
                          color: 'rgba(26,46,26,0.45)',
                          margin: '4px 0 0',
                        }}
                      >
                        {pickupMinutes === 0 ? 'ASAP' : formatPickupLabel(pickupMinutes)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => adjustPickup(-STEP)}
                        disabled={pickupMinutes === MIN_PICKUP}
                        style={{ ...stepperBtn, opacity: pickupMinutes === MIN_PICKUP ? 0.35 : 1 }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontWeight: 700,
                          fontSize: 14,
                          minWidth: 36,
                          textAlign: 'center',
                        }}
                      >
                        {pickupMinutes === 0 ? 'ASAP' : `${pickupMinutes}m`}
                      </span>
                      <button type="button" onClick={() => adjustPickup(STEP)} style={stepperBtn}>
                        +
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(26,46,26,0.45)',
                      }}
                    >
                      Total
                    </span>
                    <span
                      style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#1a2e1a',
                      }}
                    >
                      £{(subtotal / 100).toFixed(2)}
                    </span>
                  </div>

                  {error && (
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#b34a2a', marginBottom: 10 }}>
                      {error}
                    </p>
                  )}

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={saving || lines.length === 0}
                    style={{
                      width: '100%',
                      background: '#1a2e1a',
                      color: '#f0e6d0',
                      borderRadius: 20,
                      padding: '16px 20px',
                      border: 'none',
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 18,
                      fontWeight: 800,
                      cursor: saving || lines.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: saving || lines.length === 0 ? 0.55 : 1,
                    }}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
