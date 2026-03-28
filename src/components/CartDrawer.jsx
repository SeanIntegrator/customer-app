import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder, orderLineItemsFromCartItems, updateCustomerOrder } from '../lib/api';
import OrderSuccess from './OrderSuccess';
import SignInButton from './SignInButton';
import {
  PAPER_GRAIN_BACKGROUND,
  PICKUP_MIN_PICKUP,
  PICKUP_STEP,
  DEFAULT_PICKUP_MINUTES,
  adjustPickupStepper,
  checkoutStepperButtonStyle,
  formatPickupTimeWithAtPrefix,
} from '../lib/pickup';

const DEFAULT_MILKS = ['Full Fat', 'Regular'];

const stepperBtn = checkoutStepperButtonStyle;

export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    clearCart,
    subtotal,
    setActiveOrder,
    activeOrder,
    editOrderId,
    clearEditMode,
    registerPendingKdsFeedback,
  } = useCart();
  const { user, isAuthenticated, authFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessVariant, setOrderSuccessVariant] = useState('placed');
  const [pickupMinutes, setPickupMinutes] = useState(DEFAULT_PICKUP_MINUTES);
  const [orderNote, setOrderNote] = useState('');
  const [showCheckoutSignIn, setShowCheckoutSignIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setShowCheckoutSignIn(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) {
      setOrderSuccess(false);
      setOrderSuccessVariant('placed');
    }
  }, [open]);

  const adjustPickup = (delta) => {
    setPickupMinutes((m) => adjustPickupStepper(m, delta));
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0 || submitting) return;
    if (!isAuthenticated) {
      setShowCheckoutSignIn(true);
      return;
    }
    setSubmitting(true);
    setError(null);

    const autoNote = items
      .map((item) => {
        const mods = [
          item.size !== 'Regular' && item.size,
          !DEFAULT_MILKS.includes(item.milk) && item.milk,
          item.syrup && `${item.syrup} syrup`,
          ...(item.alterations ?? []),
        ]
          .filter(Boolean)
          .join(', ');
        return mods ? `${item.name}: ${mods}` : item.name;
      })
      .join(' · ');

    const fullNote = orderNote.trim()
      ? `${autoNote} | Note: ${orderNote.trim()}`
      : autoNote;

    const orderSnapshot = {
      items: items.map((i) => ({ name: i.name, emoji: i.emoji, quantity: i.quantity, size: i.size, milk: i.milk, category: i.category, totalPrice: i.totalPrice })),
      pickupMinutes,
      total: subtotal,
      placedAt: Date.now(),
    };

    try {
      if (editOrderId != null) {
        setOrderSuccessVariant('updated');
        const updated = await updateCustomerOrder(authFetch, editOrderId, {
          customer_name: user.displayName,
          note: fullNote,
          pickup_minutes: pickupMinutes,
          line_items: orderLineItemsFromCartItems(items),
        });
        setActiveOrder({
          ...orderSnapshot,
          orderId: updated.id,
          dbOrderId: updated.id,
          squareOrderId: updated.square_order_id,
        });
        clearEditMode();
      } else {
        setOrderSuccessVariant('placed');
        const data = await submitOrder(
          {
            cartItems: items,
            customerName: user.displayName,
            note: fullNote,
            pickupMinutes,
          },
          authFetch
        );
        setActiveOrder({
          ...orderSnapshot,
          orderId: data.db_order_id ?? data.order_id,
          dbOrderId: data.db_order_id,
          squareOrderId: data.order_id,
        });
      }
      clearCart();
      setOrderSuccess(true);
    } catch (err) {
      setError(err.message || 'Could not place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    if (
      orderSuccessVariant === 'placed' &&
      activeOrder?.dbOrderId != null &&
      activeOrder?.squareOrderId
    ) {
      registerPendingKdsFeedback({
        dbOrderId: activeOrder.dbOrderId,
        squareOrderId: activeOrder.squareOrderId,
      });
    }
    onClose();
    setOrderNote('');
    setPickupMinutes(DEFAULT_PICKUP_MINUTES);
    navigate('/');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !orderSuccess && onClose()}
            className="fixed inset-0 sheet-backdrop z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
            className={`fixed bottom-0 left-0 right-0 rounded-t-3xl z-50 flex flex-col ${orderSuccess ? 'h-[70vh]' : 'max-h-[90vh]'}`}
            style={{ background: '#f0e6d0', overflow: 'hidden' }}
          >
            {orderSuccess ? (
              <OrderSuccess
                variant={orderSuccessVariant}
                onDone={handleSuccessDone}
                pickupMinutes={pickupMinutes}
              />
            ) : (
              <>
                {/* Dark green combined header */}
                <div
                  className="flex-shrink-0"
                  style={{
                    background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Grain */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: PAPER_GRAIN_BACKGROUND,
                    backgroundRepeat: 'repeat',
                    pointerEvents: 'none',
                  }} />
                  {/* Drag handle */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 2, position: 'relative' }}>
                    <div style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }} />
                  </div>
                  {/* Header row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 20px 16px',
                    position: 'relative',
                  }}>
                    <h2 style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#f0e6d0',
                      margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                      {editOrderId != null ? 'Update order' : 'Your order'}
                    </h2>
                    <button
                      onClick={onClose}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(240,230,208,0.15)',
                        border: '1.5px solid rgba(240,230,208,0.2)',
                        color: '#f0e6d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0" style={{ padding: '12px 20px' }}>
                  {items.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
                      <span style={{ fontSize: 48, marginBottom: 12 }}>🛒</span>
                      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(26,46,26,0.4)' }}>Your cart is empty</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {items.map((item) => (
                        <motion.div
                          key={item.cartId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          style={{
                            background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
                            border: '1.5px solid #e0d0b0',
                            borderRadius: 18,
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 30 }}>{item.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontSize: 14,
                              fontWeight: 700,
                              color: '#1a2e1a',
                              lineHeight: 1.3,
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {item.name}
                            </p>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 11,
                              color: 'rgba(26,46,26,0.45)',
                              marginTop: 2,
                              margin: '2px 0 0',
                            }}>
                              {[
                                item.size !== 'Regular' && item.size,
                                !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
                                item.syrup && `${item.syrup} syrup`,
                                ...(item.alterations ?? []),
                              ].filter(Boolean).join(', ') || (item.category === 'coffee' ? 'Regular' : null)}
                            </p>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#c8902a',
                              marginTop: 3,
                              margin: '3px 0 0',
                            }}>
                              £{(item.totalPrice / 100).toFixed(2)} ea.
                            </p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => updateQuantity(item.cartId, -1)} style={stepperBtn}>−</button>
                            <span style={{
                              fontFamily: 'Fraunces, Georgia, serif',
                              fontSize: 15,
                              fontWeight: 700,
                              color: '#1a2e1a',
                              width: 18,
                              textAlign: 'center',
                            }}>
                              {item.quantity}
                            </span>
                            <button onClick={() => updateQuantity(item.cartId, 1)} style={stepperBtn}>+</button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                  <div
                    className="flex-shrink-0"
                    style={{
                      borderTop: '1px solid rgba(26,46,26,0.1)',
                      background: '#f0e6d0',
                      padding: '16px 20px 28px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {showCheckoutSignIn && (
                      <div
                        style={{
                          textAlign: 'center',
                          background: 'rgba(26,46,26,0.06)',
                          borderRadius: 16,
                          padding: '14px 16px',
                          border: '1.5px solid #d4c0a0',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: 'Fraunces, Georgia, serif',
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#1a2e1a',
                            margin: '0 0 10px',
                          }}
                        >
                          Sign in to place your order
                        </p>
                        <SignInButton
                          style={{ display: 'flex', justifyContent: 'center' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCheckoutSignIn(false)}
                          style={{
                            marginTop: 10,
                            background: 'none',
                            border: 'none',
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'rgba(26,46,26,0.45)',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                        >
                          Close
                        </button>
                      </div>
                    )}

                    {error && (
                      <p style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        color: '#b34a2a',
                        textAlign: 'center',
                        background: 'rgba(179,74,42,0.08)',
                        borderRadius: 12,
                        padding: '8px 16px',
                        margin: 0,
                      }}>
                        {error}
                      </p>
                    )}

                    {/* Total */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'rgba(26,46,26,0.45)',
                      }}>
                        Total
                      </span>
                      <span style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#1a2e1a',
                        letterSpacing: '-0.03em',
                      }}>
                        £{(subtotal / 100).toFixed(2)}
                      </span>
                    </div>

                    {/* Pickup row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.5)',
                      border: '1.5px solid #e0d0b0',
                      borderRadius: 16,
                      padding: '12px 16px',
                    }}>
                      <div>
                        <p style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#1a2e1a',
                          margin: 0,
                        }}>
                          Pickup time
                        </p>
                        <p style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 12,
                          color: 'rgba(26,46,26,0.45)',
                          marginTop: 2,
                          margin: '2px 0 0',
                        }}>
                          {formatPickupTimeWithAtPrefix(pickupMinutes)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          onClick={() => adjustPickup(-PICKUP_STEP)}
                          disabled={pickupMinutes === PICKUP_MIN_PICKUP}
                          style={{ ...stepperBtn, opacity: pickupMinutes === PICKUP_MIN_PICKUP ? 0.3 : 1 }}
                        >
                          −
                        </button>
                        <span style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontWeight: 700,
                          color: '#1a2e1a',
                          fontSize: 14,
                          width: 40,
                          textAlign: 'center',
                        }}>
                          {pickupMinutes === PICKUP_MIN_PICKUP ? 'ASAP' : `${pickupMinutes}m`}
                          </span>
                        <button onClick={() => adjustPickup(PICKUP_STEP)} style={stepperBtn}>+</button>
                      </div>
                    </div>

                    {/* Note */}
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Add a note for the barista…"
                      rows={2}
                      className="focus:outline-none"
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.5)',
                        border: '1.5px solid #e0d0b0',
                        borderRadius: 14,
                        padding: '12px 16px',
                        fontSize: 13,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        color: '#1a2e1a',
                        resize: 'none',
                        boxSizing: 'border-box',
                      }}
                    />

                    {/* Place order */}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePlaceOrder}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        background: '#1a2e1a',
                        color: '#f0e6d0',
                        borderRadius: 22,
                        padding: '18px 24px',
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: submitting ? 0.6 : 1,
                        boxShadow: '0 4px 20px rgba(26,46,26,0.3)',
                      }}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Placing order…
                          </span>
                        </>
                      ) : (
                        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                          {editOrderId != null ? 'Save changes' : 'Place order'}
                        </span>
                      )}
                    </motion.button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
