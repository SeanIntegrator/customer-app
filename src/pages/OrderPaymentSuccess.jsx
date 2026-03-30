import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { fetchOrderByCheckoutSession } from '../lib/api';
import OrderSuccess from '../components/OrderSuccess';
import SignInButton from '../components/SignInButton';

function pickupMinutesFromOrder(order) {
  if (!order?.pickup_time) return 15;
  const ms = new Date(order.pickup_time).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

export default function OrderPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { authFetch, isAuthenticated } = useAuth();
  const { clearCart, setActiveOrder, registerPendingKdsFeedback } = useCart();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('loading');
  const [order, setOrder] = useState(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setPhase('error');
      return;
    }
    if (!isAuthenticated) {
      setPhase('auth');
      return;
    }

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
          setActiveOrder({
            dbOrderId: o.id,
            squareOrderId: o.square_order_id,
            orderId: o.id,
          });
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
  }, [sessionId, isAuthenticated, authFetch, clearCart, setActiveOrder]);

  const handleDone = () => {
    if (order?.id != null && order?.square_order_id) {
      registerPendingKdsFeedback({
        dbOrderId: order.id,
        squareOrderId: order.square_order_id,
      });
    }
    navigate('/');
  };

  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <p className="font-serif text-lg text-[#1a2e1a] mb-4">Missing checkout session.</p>
        <button
          type="button"
          onClick={() => navigate('/order')}
          className="rounded-2xl bg-[#1a2e1a] text-[#f0e6d0] px-6 py-3 font-bold"
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
          className="rounded-2xl bg-[#1a2e1a] text-[#f0e6d0] px-6 py-3 font-bold"
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
    <div className="relative flex-1 min-h-0">
      <OrderSuccess
        variant="placed"
        pickupMinutes={pickupMinutesFromOrder(order)}
        onDone={handleDone}
      />
    </div>
  );
}
