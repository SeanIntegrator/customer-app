import { useLocation } from 'react-router-dom';
import GoogleOneTap from './GoogleOneTap';

const HIDE_ONE_TAP = new Set(['/order/success', '/order/cancelled']);

/**
 * One Tap + GoogleLogin both touch GSI; hide One Tap on post-checkout routes to avoid
 * duplicate google.accounts.id.initialize() and FedCM conflicts.
 */
export default function GoogleOneTapGate() {
  const { pathname } = useLocation();
  if (HIDE_ONE_TAP.has(pathname)) {
    return null;
  }
  return <GoogleOneTap />;
}
