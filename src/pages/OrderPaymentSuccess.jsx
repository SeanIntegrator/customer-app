import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { fetchOrderByCheckoutSession } from '../lib/api';
import OrderSuccess from '../components/OrderSuccess';
import SignInButton from '../components/SignInButton';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';

function pickupMinutesFromOrder(order) {
  if (!order?.pickup_time) return 15;
  const ms = new Date(order.pickup_time).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

/** Full snapshot for Home gold card + KDS-complete matching (minimal { dbOrderId } breaks after server list clears). */
function activeOrderSnapshotFromApiOrder(o) {
  if (!o?.id) return null;
  const total = Number(o.total_amount);
  return {
    dbOrderId: o.id,
    orderId: o.id,
    squareOrderId: o.square_order_id,
    total: Number.isFinite(total) ? total : 0,
    pickupMinutes: pickupMinutesFromOrder(o),
    placedAt: Date.now(),
    items: (o.items || []).map((it) => ({
      name: it.item_name,
      emoji: it.item_emoji || '☕',
      quantity: it.quantity,
      totalPrice: it.unit_price,
      size: 'Regular',
      milk: 'Full Fat',
    })),
  };
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
          setActiveOrder(activeOrderSnapshotFromApiOrder(o));
        }
      } catch (e) {
        if (cancelled) return;
        if (e.code === 'NOT_READY') {
          attempts += 1;
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
  }, [sessionId, incremental, isAuthenticated, authLoading, authFetch, clearCart, clearAddingToOrder, setActiveOrder]);

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-3">
        <div className="w-10 h-10 border-2 border-[#1a2e1a]/20 border-t-[#1a2e1a] rounded-full animate-spin" />
        <p className="font-serif text-lg text-[#1a2e1a]">Checking your session…</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <p className="font-serif text-lg text-[#1a2e1a] mb-4">Missing checkout session.</p>
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
      </div>
    );
  }

  if (phase === 'auth') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4">
        <p className="font-serif text-lg text-[#1a2e1a]">Sign in to see your order status.</p>
        <SignInButton />
        <button type="button" onClick={() => navigate('/order')} className="text-sm text-[#1a2e1a]/60 underline">
          Back to menu
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-3">
        <div className="w-10 h-10 border-2 border-[#1a2e1a]/20 border-t-[#1a2e1a] rounded-full animate-spin" />
        <p className="font-serif text-lg text-[#1a2e1a]">Processing your payment…</p>
        <p className="text-sm text-[#1a2e1a]/55">This usually takes a few seconds.</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-4">
        <p className="font-serif text-lg text-[#1a2e1a]">Something went wrong</p>
        <p className="text-sm text-[#1a2e1a]/55 max-w-sm">
          We could not confirm your order yet. If you were charged, check your order history in your profile.
        </p>
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
        <button type="button" onClick={() => navigate('/order')} className="text-sm text-[#1a2e1a]/60 underline">
          Back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[100dvh] flex-1">
      <OrderSuccess
        variant="placed"
        pickupMinutes={pickupMinutesFromOrder(order)}
        onDone={handleDone}
        stampPreviewTotalPence={order?.total_amount != null ? Number(order.total_amount) : undefined}
      />
    </div>
  );
}
