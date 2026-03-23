import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function SignInButton({ className, style }) {
  const { handleGoogleCredential } = useAuth();

  if (!CLIENT_ID) {
    return (
      <p
        className={className}
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          color: 'rgba(240,230,208,0.5)',
          margin: 0,
          ...style,
        }}
      >
        Sign-in unavailable (set VITE_GOOGLE_CLIENT_ID)
      </p>
    );
  }

  return (
    <div className={className} style={style}>
      <GoogleLogin
        onSuccess={handleGoogleCredential}
        onError={() => console.error('Google sign-in failed')}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        width="280"
      />
    </div>
  );
}
