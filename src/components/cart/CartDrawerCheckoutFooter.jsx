import { motion } from 'framer-motion';
import SignInButton from '../SignInButton';
import { computeRewardDiscountPenceForCart } from '../../lib/loyaltyDiscount';
import {
  PICKUP_MIN_PICKUP,
  PICKUP_STEP,
  checkoutStepperButtonStyle,
  formatPickupTimeWithAtPrefix,
} from '../../lib/pickup';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../../lib/checkoutTheme';

const stepperBtn = checkoutStepperButtonStyle;

export default function CartDrawerCheckoutFooter({
  showCheckoutSignIn,
  setShowCheckoutSignIn,
  error,
  isUpdateEditMode,
  existingSubtotal,
  newSubtotal,
  eligibleForReward,
  reward,
  loyaltyConfig,
  items,
  rewardBelowStripeMin,
  applyReward,
  setApplyReward,
  STRIPE_MIN_CHECKOUT_PENCE,
  displayTotalPence,
  addingToOrderId,
  editOrderId,
  basketLocked,
  pickupMinutes,
  adjustPickup,
  handlePlaceOrder,
  submitting,
}) {
  return (
    <>
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

    {isUpdateEditMode ? (
      <>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(26,46,26,0.5)',
          }}>
            Already ordered
          </span>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 18,
            fontWeight: 800,
            color: 'rgba(26,46,26,0.65)',
          }}>
            £{(existingSubtotal / 100).toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(26,46,26,0.5)',
          }}>
            New items
          </span>
          <span style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 18,
            fontWeight: 800,
            color: '#1a2e1a',
          }}>
            £{(newSubtotal / 100).toFixed(2)}
          </span>
        </div>
        
      </>
    ) : null}

    {eligibleForReward ? (
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'rgba(200,144,42,0.08)',
          border: '1.5px solid rgba(200,144,42,0.25)',
          borderRadius: 16,
          padding: '12px 16px',
          cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#1a2e1a',
            margin: 0,
          }}>
            Use free drink reward
          </p>
          <p style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 11,
            color: 'rgba(26,46,26,0.5)',
            margin: '4px 0 0',
            lineHeight: 1.35,
          }}>
            Up to £
            {(
              computeRewardDiscountPenceForCart(
                items,
                loyaltyConfig?.rewardMaxPence,
                reward?.drinkCategorySlugs
              ) / 100
            ).toFixed(2)}{' '}
            off your cheapest drink
            {rewardBelowStripeMin && applyReward
              ? ` — add items so the total stays above £${(STRIPE_MIN_CHECKOUT_PENCE / 100).toFixed(2)}.`
              : ''}
          </p>
        </div>
        <input
          type="checkbox"
          checked={applyReward}
          onChange={() => setApplyReward((v) => !v)}
          style={{ width: 22, height: 22, accentColor: '#1a2e1a', flexShrink: 0 }}
        />
      </label>
    ) : null}

    {applyReward && rewardDiscountPence > 0 && eligibleForReward ? (
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(26,46,26,0.5)',
        }}>
          Free drink reward
        </span>
        <span style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 16,
          fontWeight: 800,
          color: '#2d6b2d',
        }}>
          −£{(rewardDiscountPence / 100).toFixed(2)}
        </span>
      </div>
    ) : null}

    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(26,46,26,0.45)',
      }}>
        {addingToOrderId != null ? 'Add-ons total' : isUpdateEditMode ? 'Order total' : 'Total'}
      </span>
      <span style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: 26,
        fontWeight: 900,
        color: '#1a2e1a',
        letterSpacing: '-0.03em',
      }}>
        £{(displayTotalPence / 100).toFixed(2)}
      </span>
    </div>

    {addingToOrderId == null ? (
      <>
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
              disabled={basketLocked || pickupMinutes === PICKUP_MIN_PICKUP}
              style={{
                ...stepperBtn,
                opacity: basketLocked || pickupMinutes === PICKUP_MIN_PICKUP ? 0.3 : 1,
              }}
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
            <button
              type="button"
              disabled={basketLocked}
              onClick={() => adjustPickup(PICKUP_STEP)}
              style={{ ...stepperBtn, opacity: basketLocked ? 0.3 : 1 }}
            >
              +
            </button>
          </div>
        </div>

        {/* Allergen toggle + chips removed until a robust flow is implemented; checkout sends no allergens. */}
      </>
    ) : null}

    <motion.button
      whileTap={{ scale: basketLocked || submitting ? 1 : 0.97 }}
      type="button"
      onClick={handlePlaceOrder}
      disabled={submitting || basketLocked}
      style={{
        width: '100%',
        background: basketLocked ? 'rgba(26,46,26,0.12)' : CHECKOUT_PRIMARY_GRADIENT,
        color: basketLocked ? 'rgba(26,46,26,0.35)' : CHECKOUT_PRIMARY_TEXT,
        borderRadius: 22,
        padding: '18px 24px',
        border: 'none',
        cursor: submitting || basketLocked ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: submitting ? 0.6 : 1,
        boxShadow: basketLocked ? 'none' : CHECKOUT_PRIMARY_SHADOW,
      }}
    >
      {submitting ? (
        <>
          <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {addingToOrderId != null ? 'Opening checkout…' : 'Placing order…'}
          </span>
        </>
      ) : (
        <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {addingToOrderId != null ? 'Pay for new items' : editOrderId != null ? 'Save changes' : 'Place order'}
        </span>
      )}
    </motion.button>
      </div>
      )}
    </>
  );
}
