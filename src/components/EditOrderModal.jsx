import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSheetSwipeToClose } from '../lib/useSheetSwipeToClose';
import { fetchCustomerOrder, updateCustomerOrder } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import OrderSuccess from './OrderSuccess';
import AllergyChipsInput from './AllergyChipsInput';
import {
  PAPER_GRAIN_BACKGROUND,
  PICKUP_STEP,
  adjustPickupStepper,
  checkoutStepperButtonStyle,
  formatPickupTimeShort,
  pickupIsoToStepperMinutes,
} from '../lib/pickup';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';

const stepperBtn = checkoutStepperButtonStyle;

export default function EditOrderModal({
  orderId,
  open,
  onClose,
  authFetch,
  onSaved,
  onAddMoreItems,
}) {
  const { user } = useAuth();
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
        const ag = Array.isArray(o.allergens) ? o.allergens.map((x) => String(x).trim()).filter(Boolean) : [];
        setAllergens(ag);
        setAllergyToggle(ag.length > 0);
        setPickupMinutes(pickupIsoToStepperMinutes(o.pickup_time));
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
            customer_note: it.customer_note != null ? String(it.customer_note) : '',
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
        line_items: lines.map((l) => {
          const cn = (l.customer_note || '').trim();
          return {
            catalog_object_id: l.square_variation_id,
            quantity: l.quantity,
            item_name: l.item_name,
            unit_price: l.unit_price,
            emoji: l.item_emoji,
            modifiers: l.modifiers,
            ...(cn ? { customer_note: cn } : {}),
          };
        }),
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

  const { sheetMotionProps, onGreenHeaderPointerDown } = useSheetSwipeToClose(onSwipeClose, {
    disabled: loading && !updateSuccess,
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="edit-order-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !updateSuccess && onClose()}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 160,
              background: 'rgba(8,16,8,0.82)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            key={orderId != null ? `edit-order-sheet-${orderId}` : 'edit-order-sheet'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 170,
              maxHeight: '92vh',
              minHeight: updateSuccess ? '55vh' : '48vh',
              borderRadius: '24px 24px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: '#f0e6d0',
              boxShadow: '0 -8px 48px rgba(0,0,0,0.35)',
            }}
            {...sheetMotionProps}
          >
            {updateSuccess ? (
              <div style={{ flex: 1, position: 'relative', minHeight: 'min(70vh, 520px)' }}>
                <div
                  role="presentation"
                  aria-hidden
                  onPointerDown={onGreenHeaderPointerDown}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 96,
                    zIndex: 1,
                    touchAction: 'none',
                  }}
                />
                <OrderSuccess
                  variant="updated"
                  pickupMinutes={pickupMinutes}
                  onDone={handleSuccessDone}
                />
              </div>
            ) : (
              <>
                <div
                  onPointerDown={onGreenHeaderPointerDown}
                  style={{
                    flexShrink: 0,
                    background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
                    position: 'relative',
                    touchAction: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: PAPER_GRAIN_BACKGROUND,
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
                      onPointerDown={(e) => e.stopPropagation()}
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

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  <div
                    className="flex-1 overflow-y-auto scrollbar-hide min-h-0"
                    style={{ padding: '16px 20px' }}
                  >
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
                        {isPaidViaStripe && (
                          <div
                            style={{
                              marginBottom: 14,
                              padding: '12px 14px',
                              borderRadius: 14,
                              background: 'rgba(200,144,42,0.14)',
                              border: '1.5px solid rgba(200,144,42,0.35)',
                            }}
                          >
                            <p
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#1a2e1a',
                                margin: 0,
                                lineHeight: 1.45,
                              }}
                            >
                              This order was paid online. To add drinks or food, use{' '}
                              <strong>Add more items</strong> so we can charge only the new items. Pickup time and line
                              items cannot be changed here.
                            </p>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, minHeight: 80 }}>
                          {lines.length === 0 && (
                            <p
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 13,
                                color: 'rgba(26,46,26,0.55)',
                                margin: '8px 0 4px',
                                lineHeight: 1.45,
                              }}
                            >
                              No line items left. Add drinks from the menu and save changes from your cart, or close and open
                              this order again to reload.
                            </p>
                          )}
                          {lines.map((l) => (
                            <div key={l.key}>
                              <div
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
                                    {l.quantity > 1 ? `${l.quantity}× ` : ''}
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
                                {!isPaidViaStripe ? (
                                  <>
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
                                  </>
                                ) : null}
                              </div>
                              {!isPaidViaStripe ? (
                                <textarea
                                  value={l.customer_note || ''}
                                  onChange={(e) => setLineCustomerNote(l.key, e.target.value)}
                                  placeholder="Note for this item (optional)"
                                  rows={2}
                                  style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    marginTop: 8,
                                    padding: '8px 10px',
                                    borderRadius: 12,
                                    border: '1.5px solid #e8dcc8',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: 12,
                                    resize: 'none',
                                  }}
                                />
                              ) : l.customer_note ? (
                                <p
                                  style={{
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: 12,
                                    fontStyle: 'italic',
                                    color: 'rgba(26,46,26,0.5)',
                                    margin: '8px 0 0',
                                  }}
                                >
                                  Note: {l.customer_note}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>

                        {!isPaidViaStripe ? (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.35)',
                                border: '1.5px solid #e0d0b0',
                                borderRadius: 16,
                                padding: '12px 16px',
                                marginBottom: 10,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: '#1a2e1a',
                                }}
                              >
                                Do you have any allergies?
                              </span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={allergyToggle}
                                onClick={() => {
                                  setAllergyToggle((v) => !v);
                                  if (allergyToggle) setAllergens([]);
                                }}
                                style={{
                                  width: 48,
                                  height: 28,
                                  borderRadius: 999,
                                  border: 'none',
                                  cursor: 'pointer',
                                  background: allergyToggle ? '#1a2e1a' : 'rgba(26,46,26,0.15)',
                                  position: 'relative',
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: 3,
                                    left: allergyToggle ? 24 : 3,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#f0e6d0',
                                    transition: 'left 0.15s ease',
                                  }}
                                />
                              </button>
                            </div>
                            {allergyToggle && (
                              <div style={{ marginBottom: 16 }}>
                                <AllergyChipsInput value={allergens} onChange={setAllergens} />
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255,255,255,0.5)',
                                border: '1.5px solid #e0d0b0',
                                borderRadius: 16,
                                padding: '12px 16px',
                                marginBottom: 8,
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
                                  {pickupMinutes === 0 ? 'ASAP' : formatPickupTimeShort(pickupMinutes)}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <button
                                  type="button"
                                  onClick={() => adjustPickup(-PICKUP_STEP)}
                                  disabled={pickupMinutes === 0}
                                  style={{ ...stepperBtn, opacity: pickupMinutes === 0 ? 0.35 : 1 }}
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
                                <button type="button" onClick={() => adjustPickup(PICKUP_STEP)} style={stepperBtn}>
                                  +
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.45)',
                              border: '1.5px solid #e0d0b0',
                              borderRadius: 16,
                              padding: '12px 16px',
                              marginBottom: 8,
                            }}
                          >
                            <p
                              style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#1a2e1a',
                                margin: '0 0 6px',
                              }}
                            >
                              Pickup
                            </p>
                            <p
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 13,
                                color: 'rgba(26,46,26,0.55)',
                                margin: 0,
                              }}
                            >
                              {pickupMinutes === 0 ? 'ASAP' : formatPickupTimeShort(pickupMinutes)}
                            </p>
                            <p
                              style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#1a2e1a',
                                margin: '14px 0 6px',
                              }}
                            >
                              Allergies
                            </p>
                            <p
                              style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 13,
                                color: 'rgba(26,46,26,0.55)',
                                margin: 0,
                              }}
                            >
                              {allergens.length ? allergens.join(', ') : 'None listed'}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {!loading && editable && (
                    <div
                      style={{
                        flexShrink: 0,
                        padding: '14px 20px',
                        paddingBottom: 'calc(22px + env(safe-area-inset-bottom, 0px))',
                        borderTop: '1px solid rgba(26,46,26,0.1)',
                        background: '#faf5eb',
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
                      }}
                    >
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
                        <p
                          style={{
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 13,
                            color: '#b34a2a',
                            marginBottom: 10,
                          }}
                        >
                          {error}
                        </p>
                      )}

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onAddMoreItems?.()}
                        style={{
                          width: '100%',
                          background: CHECKOUT_PRIMARY_GRADIENT,
                          color: CHECKOUT_PRIMARY_TEXT,
                          borderRadius: 20,
                          padding: '16px 20px',
                          border: 'none',
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 18,
                          fontWeight: 800,
                          cursor: 'pointer',
                          marginBottom: isPaidViaStripe ? 0 : 12,
                          boxShadow: CHECKOUT_PRIMARY_SHADOW,
                        }}
                      >
                        Add more items →
                      </motion.button>

                      {!isPaidViaStripe ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSave}
                          disabled={saving || lines.length === 0}
                          style={{
                            width: '100%',
                            background: CHECKOUT_PRIMARY_GRADIENT,
                            color: CHECKOUT_PRIMARY_TEXT,
                            borderRadius: 20,
                            padding: '16px 20px',
                            border: 'none',
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 18,
                            fontWeight: 800,
                            cursor: saving || lines.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: saving || lines.length === 0 ? 0.55 : 1,
                            boxShadow: CHECKOUT_PRIMARY_SHADOW,
                          }}
                        >
                          {saving ? 'Saving…' : 'Save changes'}
                        </motion.button>
                      ) : null}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
