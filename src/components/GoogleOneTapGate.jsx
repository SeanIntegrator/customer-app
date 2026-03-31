import { useLocation } from 'react-router-dom';
import GoogleOneTap from './GoogleOneTap';

/**
 * One Tap + GoogleLogin both touch GSI; hide One Tap under /order (menu + checkout return)
 * to avoid duplicate google.accounts.id.initialize() and FedCM conflicts.
 */
export default function GoogleOneTapGate() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/order')) {
    return null;
  }
  return <GoogleOneTap />;
}
