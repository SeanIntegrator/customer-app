import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { fetchOrderByCheckoutSession, finalizeCheckoutSession } from '../lib/api';
import {
  buildActiveOrderSnapshotFromApiOrder,
  pickupMinutesFromOrderForSuccess,
} from '../lib/orderViewModels';
import OrderSuccess from '../components/OrderSuccess';
import SignInButton from '../components/SignInButton';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';
import { PAPER_GRAIN_BACKGROUND } from '../lib/pickup';

/** Matches OrderSuccess background + CheckoutTransitionOverlay cream card / typography. */
const CHECKOUT_GREEN_BG =
  'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)';
const HANDOFF_GREEN = '#1a2e1a';
const HANDOFF_CREAM = '#f0e6d0';

function CheckoutHandoffShell({ title, subtitle, spinner, children }) {
  const titleMarginBottom =
    subtitle != null ? 8 : children != null && !spinner ? 16 : 8;
  return (
    <div
      className="relative w-full min-h-[100dvh] flex-1 flex flex-col items-center justify-center px-6 py-8"
      style={{ background: CHECKOUT_GREEN_BG }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: PAPER_GRAIN_BACKGROUND,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: HANDOFF_CREAM,
          borderRadius: 24,
          padding: '32px 36px',
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 12px 48px rgba(0,0,0,0.35)',
        }}
      >
        {spinner}
        <p
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 800,
            color: HANDOFF_GREEN,
            margin: `0 0 ${titleMarginBottom}px`,
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </p>
        {subtitle ? (
          <p
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 14,
              color: 'rgba(26,46,26,0.55)',
              margin: children ? '0 0 16px' : 0,
              lineHeight: 1.45,
            }}
          >
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function handoffSpinner() {
  return (
    <div
      className="animate-spin"
      style={{
        width: 40,
        height: 40,
        margin: '0 auto 20px',
        border: '3px solid rgba(26,46,26,0.15)',
        borderTopColor: HANDOFF_GREEN,
        borderRadius: '50%',
      }}
    />
  );
}

export default function OrderPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const incremental = searchParams.get('incremental') === '1';
  const { authFetch, isAuthenticated, loading: authLoading } = useAuth();
  const { clearCart, setActiveOrder, registerPendingKdsFeedback, clearAddingToOrder } = useCart();
  const { refreshAfterOrder } = useLoyalty();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [order, setOrder] = useState(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setPhase('error');
      return;
    }
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      setPhase('auth');
      return;
    }

    setPhase((p) => (p === 'auth' || p === 'loading' ? 'loading' : p));

    let cancelled = false;
    let attempts = 0;
    let finalizeAttempts = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const o = await fetchOrderByCheckoutSession(authFetch, sessionId);
        if (cancelled) return;
        setOrder(o);
        setPhase('ready');
        if (!clearedRef.current && o.status === 'confirmed') {
          clearedRef.current = true;
          clearCart();
          if (incremental) {
            clearAddingToOrder();
          }
          setActiveOrder(buildActiveOrderSnapshotFromApiOrder(o));
        }
      } catch (e) {
        if (cancelled) return;
        if (e.code === 'NOT_READY') {
          attempts += 1;
          // Fallback fulfillment trigger for delayed/missed webhook processing.
          if (attempts >= 3 && (attempts === 3 || attempts % 5 === 0) && finalizeAttempts < 8) {
            finalizeAttempts += 1;
            try {
              await finalizeCheckoutSession(authFetch, sessionId);
            } catch {
              /* keep polling; webhook/finalizer may still complete shortly */
            }
          }
          if (attempts >= 90) {
            setPhase('error');
            return;
          }
          setTimeout(tick, 2000);
          return;
        }
        setPhase('error');
      }
    };

    tick();
    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    incremental,
    isAuthenticated,
    authLoading,
    authFetch,
    clearCart,
    clearAddingToOrder,
    setActiveOrder,
  ]);

  useEffect(() => {
    if (phase === 'ready' && order?.id) {
      refreshAfterOrder();
    }
  }, [phase, order?.id, refreshAfterOrder]);

  const handleDone = () => {
    if (order?.id != null && order?.square_order_id) {
      registerPendingKdsFeedback({
        dbOrderId: order.id,
        squareOrderId: order.square_order_id,
      });
    }
    navigate('/');
  };

  if (authLoading && sessionId) {
    return (
      <CheckoutHandoffShell title="Checking your session…" spinner={handoffSpinner()} />
    );
  }

  if (!sessionId) {
    return (
      <CheckoutHandoffShell title="Missing checkout session">
        <button
          type="button"
          onClick={() => navigate('/order')}
          className="rounded-2xl px-6 py-3 font-bold border-none cursor-pointer"
          style={{
            background: CHECKOUT_PRIMARY_GRADIENT,
            color: CHECKOUT_PRIMARY_TEXT,
            boxShadow: CHECKOUT_PRIMARY_SHADOW,
          }}
        >
          Back to menu
        </button>
      </CheckoutHandoffShell>
    );
  }

  if (phase === 'auth') {
    return (
      <CheckoutHandoffShell title="Sign in to see your order status">
        <div className="flex flex-col items-center gap-4">
          <SignInButton />
          <button
            type="button"
            onClick={() => navigate('/order')}
            className="text-sm underline border-none bg-transparent cursor-pointer"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'rgba(26,46,26,0.55)' }}
          >
            Back to menu
          </button>
        </div>
      </CheckoutHandoffShell>
    );
  }

  if (phase === 'loading') {
    return (
      <CheckoutHandoffShell
        title="Processing your payment…"
        subtitle="This usually takes a few seconds."
        spinner={handoffSpinner()}
      />
    );
  }

  if (phase === 'error') {
    return (
      <CheckoutHandoffShell
        title="Something went wrong"
        subtitle="We could not confirm your order yet. If you were charged, check your order history in your profile."
      >
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-2xl px-6 py-3 font-bold border-none cursor-pointer"
            style={{
              background: CHECKOUT_PRIMARY_GRADIENT,
              color: CHECKOUT_PRIMARY_TEXT,
              boxShadow: CHECKOUT_PRIMARY_SHADOW,
            }}
          >
            Order history
          </button>
          <button
            type="button"
            onClick={() => navigate('/order')}
            className="text-sm underline border-none bg-transparent cursor-pointer"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: 'rgba(26,46,26,0.55)' }}
          >
            Back to menu
          </button>
        </div>
      </CheckoutHandoffShell>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] flex-1">
      <OrderSuccess
        variant="placed"
        pickupMinutes={pickupMinutesFromOrderForSuccess(order)}
        onDone={handleDone}
        stampPreviewTotalPence={
          order?.total_amount != null ? Number(order.total_amount) : undefined
        }
      />
    </div>
  );
}
