import { useLocation } from 'react-router-dom';
import GoogleOneTap from './GoogleOneTap';
import { useAuth } from '../context/AuthContext';

const ENABLE_ONE_TAP =
  String(import.meta.env.VITE_ENABLE_GOOGLE_ONE_TAP || '').toLowerCase() === 'true';

/**
 * One Tap + GoogleLogin both touch GSI; hide One Tap under /order (menu + checkout return)
 * to avoid duplicate google.accounts.id.initialize() and FedCM conflicts.
 */
export default function GoogleOneTapGate() {
  const { pathname } = useLocation();
  const { isAuthenticated, loading } = useAuth();
  if (!ENABLE_ONE_TAP || loading || isAuthenticated || pathname.startsWith('/order')) {
    return null;
  }
  return <GoogleOneTap />;
}
