import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import GoogleOneTapGate from './components/GoogleOneTapGate';
import BottomNav from './components/BottomNav';
import PostOrderFeedbackLayer from './components/PostOrderFeedbackLayer';

const HAS_GOOGLE_CLIENT = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

export default function App() {
  const location = useLocation();
  const hideBottomNav = ['/order', '/order/success', '/order/cancelled'].includes(location.pathname);

  return (
    <>
      {HAS_GOOGLE_CLIENT && <GoogleOneTapGate />}
      <div className="flex flex-col h-full bg-cream overflow-hidden">
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <Outlet key={location.pathname} />
          </AnimatePresence>
        </div>

        {!hideBottomNav && <BottomNav />}
        <PostOrderFeedbackLayer />
      </div>
    </>
  );
}
