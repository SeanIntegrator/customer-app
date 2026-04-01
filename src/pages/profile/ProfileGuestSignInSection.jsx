import { motion } from 'framer-motion';
import SignInButton from '../../components/SignInButton';

export default function ProfileGuestSignInSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(148deg, #fef9f0, #f5ead8)',
        border: '1.5px solid #e0d0b0',
        borderRadius: 20,
        padding: '20px 18px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 17,
          fontWeight: 800,
          color: '#1a2e1a',
          margin: '0 0 6px',
        }}
      >
        Sign in to get started
      </p>
      <p
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          color: 'rgba(26,46,26,0.5)',
          margin: '0 0 16px',
          lineHeight: 1.45,
        }}
      >
        Place orders, save your usual, and join events with your Google account.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <SignInButton />
      </div>
    </motion.section>
  );
}
