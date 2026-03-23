import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import GoogleOneTap from './components/GoogleOneTap';

const HAS_GOOGLE_CLIENT = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Order from './pages/Order';
import Profile from './pages/Profile';

export default function App() {
  const location = useLocation();

  return (
    <CartProvider>
      {HAS_GOOGLE_CLIENT && <GoogleOneTap />}
      <div className="flex flex-col h-full bg-cream overflow-hidden">
        {/* Page content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/order" element={<Order />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Bottom navigation */}
        <BottomNav />
      </div>
    </CartProvider>
  );
}
