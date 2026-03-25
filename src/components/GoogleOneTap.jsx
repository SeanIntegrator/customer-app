import { useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleOneTap() {
  const { isAuthenticated, handleGoogleCredential } = useAuth();

  useGoogleOneTapLogin({
    onSuccess: handleGoogleCredential,
    onError: () => {},
    disabled: !CLIENT_ID || isAuthenticated,
    cancel_on_tap_outside: true,
    context: 'signin',
    auto_select: false,
    use_fedcm_for_prompt: false,
  });

  return null;
}
