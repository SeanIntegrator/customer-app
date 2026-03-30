import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession, orderLineItemsFromCartItems, updateCustomerOrder } from '../lib/api';
import OrderSuccess from './OrderSuccess';
import SignInButton from './SignInButton';
import AllergyChipsInput from './AllergyChipsInput';
import {
  PAPER_GRAIN_BACKGROUND,
  PICKUP_MIN_PICKUP,
  PICKUP_STEP,
  DEFAULT_PICKUP_MINUTES,
  adjustPickupStepper,
  checkoutStepperButtonStyle,
  formatPickupTimeWithAtPrefix,
} from '../lib/pickup';

const stepperBtn = checkoutStepperButtonStyle;

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function CartDrawer({ open, onClose, onEditLine }) {
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
    orderAllergens,
    setOrderAllergens,
  } = useCart();
  const { user, isAuthenticated, authFetch } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderSuccessVariant, setOrderSuccessVariant] = useState('placed');
  const [pickupMinutes, setPickupMinutes] = useState(DEFAULT_PICKUP_MINUTES);
  const [showCheckoutSignIn, setShowCheckoutSignIn] = useState(false);
  const [allergyToggle, setAllergyToggle] = useState(false);

  useEffect(() => {
    if (isAuthenticated) setShowCheckoutSignIn(false);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!open) {
      setOrderSuccess(false);
      setOrderSuccessVariant('placed');
    }
  }, [open]);

  useEffect(() => {
    if (open && orderAllergens.length > 0) setAllergyToggle(true);
  }, [open, orderAllergens.length]);

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

    const allergensPayload = allergyToggle ? orderAllergens : [];

    const orderSnapshot = {
      items: items.map((i) => ({
        name: i.name,
        emoji: i.emoji,
        quantity: i.quantity,
        size: i.size,
        milk: i.milk,
        category: i.category,
        totalPrice: i.totalPrice,
      })),
      pickupMinutes,
      total: subtotal,
      placedAt: Date.now(),
    };

    try {
      if (editOrderId != null) {
        setOrderSuccessVariant('updated');
        const updated = await updateCustomerOrder(authFetch, editOrderId, {
          customer_name: user.displayName,
          note: null,
          allergens: allergensPayload,
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
        clearCart();
        setAllergyToggle(false);
        setOrderSuccess(true);
      } else {
        setOrderSuccessVariant('placed');
        const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!pubKey) {
          setError('Checkout is not configured (missing VITE_STRIPE_PUBLISHABLE_KEY).');
        } else {
          const { sessionId, url } = await createCheckoutSession(authFetch, {
            line_items: orderLineItemsFromCartItems(items),
            customer_name: user.displayName,
            pickup_minutes: pickupMinutes,
            allergens: allergensPayload,
          });
          const stripe = await loadStripe(pubKey);
          if (!stripe) {
            throw new Error('Stripe.js failed to load');
          }
          const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId });
          if (stripeErr) {
            if (url) {
              window.location.assign(url);
              return;
            }
            throw new Error(stripeErr.message || 'Could not redirect to payment');
          }
        }
      }
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
                <div
                  className="flex-shrink-0"
                  style={{
                    background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: PAPER_GRAIN_BACKGROUND,
                    backgroundRepeat: 'repeat',
                    pointerEvents: 'none',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 2, position: 'relative' }}>
                    <div style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }} />
                  </div>
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
                      type="button"
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
                            alignItems: 'flex-start',
                            gap: 12,
                          }}
                        >
                          <span style={{ fontSize: 30, flexShrink: 0 }}>{item.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                              <p style={{
                                fontFamily: 'Fraunces, Georgia, serif',
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#1a2e1a',
                                lineHeight: 1.3,
                                margin: 0,
                                flex: 1,
                                minWidth: 0,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {item.name}
                              </p>
                              <button
                                type="button"
                                aria-label={`Edit ${item.name}`}
                                onClick={() => onEditLine?.(item)}
                                style={{
                                  flexShrink: 0,
                                  width: 32,
                                  height: 32,
                                  borderRadius: 10,
                                  border: '1.5px solid #d4c0a0',
                                  background: 'rgba(255,255,255,0.6)',
                                  color: '#1a2e1a',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <PenIcon />
                              </button>
                            </div>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 11,
                              color: 'rgba(26,46,26,0.45)',
                              margin: '4px 0 0',
                            }}>
                              {[
                                item.size !== 'Regular' && item.size,
                                !['Full Fat', 'Regular'].includes(item.milk) && item.milk,
                                item.syrup && `${item.syrup} syrup`,
                                ...(item.alterations ?? []),
                              ].filter(Boolean).join(', ') || (item.category === 'coffee' ? 'Regular' : null)}
                            </p>
                            {item.customerNote ? (
                              <p style={{
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 11,
                                fontStyle: 'italic',
                                color: 'rgba(26,46,26,0.55)',
                                margin: '4px 0 0',
                              }}>
                                {item.customerNote}
                              </p>
                            ) : null}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button type="button" onClick={() => updateQuantity(item.cartId, -1)} style={stepperBtn}>−</button>
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
                              <button type="button" onClick={() => updateQuantity(item.cartId, 1)} style={stepperBtn}>+</button>
                            </div>
                            <p style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#c8902a',
                              margin: 0,
                            }}>
                              £{(item.totalPrice / 100).toFixed(2)} ea.
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

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
                          margin: '2px 0 0',
                        }}>
                          {formatPickupTimeWithAtPrefix(pickupMinutes)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
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
                        <button type="button" onClick={() => adjustPickup(PICKUP_STEP)} style={stepperBtn}>+</button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.35)',
                        border: '1.5px solid #e0d0b0',
                        borderRadius: 16,
                        padding: '12px 16px',
                      }}
                    >
                      <span style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#1a2e1a',
                      }}>
                        Do you have any allergies?
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={allergyToggle}
                        onClick={() => {
                          setAllergyToggle((v) => !v);
                          if (allergyToggle) setOrderAllergens([]);
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
                      <AllergyChipsInput value={orderAllergens} onChange={setOrderAllergens} />
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
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
