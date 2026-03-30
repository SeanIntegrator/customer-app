import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import GoogleOneTapGate from './components/GoogleOneTapGate';
import BottomNav from './components/BottomNav';
import PostOrderFeedbackLayer from './components/PostOrderFeedbackLayer';
import Home from './pages/Home';
import Order from './pages/Order';
import OrderPaymentSuccess from './pages/OrderPaymentSuccess';
import OrderPaymentCancelled from './pages/OrderPaymentCancelled';
import Profile from './pages/Profile';

const HAS_GOOGLE_CLIENT = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function App() {
  const location = useLocation();
  const hideBottomNav = ['/order', '/order/success', '/order/cancelled'].includes(location.pathname);

  return (
    <CartProvider>
      {HAS_GOOGLE_CLIENT && <GoogleOneTapGate />}
      <div className="flex flex-col h-full bg-cream overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/order" element={<Order />} />
              <Route path="/order/success" element={<OrderPaymentSuccess />} />
              <Route path="/order/cancelled" element={<OrderPaymentCancelled />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {!hideBottomNav && <BottomNav />}
        <PostOrderFeedbackLayer />
      </div>
    </CartProvider>
  );
}
