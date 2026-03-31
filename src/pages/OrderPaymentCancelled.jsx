import { useNavigate } from 'react-router-dom';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';

export default function OrderPaymentCancelled() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center gap-6">
      <p className="font-serif text-2xl font-bold text-[#1a2e1a]">Payment was cancelled</p>
      <p className="text-sm text-[#1a2e1a]/55 max-w-sm">
        No charge was made. Your cart is still here when you return to the menu.
      </p>
      <button
        type="button"
        onClick={() => navigate('/order', { replace: true })}
        className="rounded-2xl px-8 py-3 font-bold font-serif border-none cursor-pointer"
        style={{
          background: CHECKOUT_PRIMARY_GRADIENT,
          color: CHECKOUT_PRIMARY_TEXT,
          boxShadow: CHECKOUT_PRIMARY_SHADOW,
        }}
      >
        Return to menu
      </button>
    </div>
  );
}
