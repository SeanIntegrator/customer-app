import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { fetchCustomerRewards } from '../lib/api';
import SignInButton from '../components/SignInButton';

export default function Rewards() {
  const navigate = useNavigate();
  const { isAuthenticated, authFetch, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchCustomerRewards(authFetch);
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load rewards');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading, authFetch]);

  const headStyle = {
    fontFamily: 'Fraunces, Georgia, serif',
    fontSize: 26,
    fontWeight: 900,
    color: '#1a2e1a',
    letterSpacing: '-0.03em',
    margin: '0 0 6px',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto scrollbar-hide"
      style={{ background: '#f0e6d0', minHeight: '100%' }}
    >
      <div style={{ padding: '20px 18px 100px' }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            fontWeight: 700,
            color: '#1a2e1a',
            background: 'rgba(255,255,255,0.5)',
            border: '1.5px solid #e0d0b0',
            borderRadius: 100,
            padding: '8px 16px',
            marginBottom: 20,
            cursor: 'pointer',
          }}
        >
          ← Back
        </button>

        <h1 style={headStyle}>Your rewards</h1>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: 'rgba(26,46,26,0.5)', margin: '0 0 28px', lineHeight: 1.45 }}>
          Free drinks earned from your stamp card. Apply one at checkout when your basket includes a drink.
        </p>

        {!isAuthenticated && !authLoading ? (
          <div style={{ background: 'linear-gradient(148deg, #fef9f0, #f5ead8)', border: '1.5px solid #e0d0b0', borderRadius: 20, padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: '#1a2e1a', margin: '0 0 14px' }}>Sign in to see rewards</p>
            <SignInButton />
          </div>
        ) : null}

        {isAuthenticated && loading ? (
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: '#8a7868' }}>Loading…</p>
        ) : null}

        {error ? (
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: '#b34a2a' }}>{error}</p>
        ) : null}

        {data && isAuthenticated ? (
          <>
            <h2 style={{ ...headStyle, fontSize: 17, marginBottom: 12 }}>Available</h2>
            {data.available?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {data.available.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'linear-gradient(148deg, #faf2e2 0%, #f2e4cc 100%)',
                      borderRadius: 18,
                      padding: '16px 18px',
                      border: '1.5px solid #e0d0b0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  >
                    <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 800, color: '#1a2e1a', margin: '0 0 4px' }}>
                      Free drink ☕
                    </p>
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: 'rgba(26,46,26,0.5)', margin: 0 }}>
                      Up to £{((r.max_value ?? r.value ?? 0) / 100).toFixed(2)} off · use at checkout
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: 'rgba(26,46,26,0.45)', marginBottom: 32 }}>
                No rewards yet — keep ordering to fill your stamp card.
              </p>
            )}

            <h2 style={{ ...headStyle, fontSize: 17, marginBottom: 12 }}>Redemption history</h2>
            {data.recent_redemptions?.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.recent_redemptions.map((row, idx) => (
                  <li
                    key={`${row.order_id}-${row.redeemed_at}-${idx}`}
                    style={{
                      background: 'rgba(255,255,255,0.45)',
                      border: '1px solid #e0d0b0',
                      borderRadius: 14,
                      padding: '12px 14px',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 13,
                      color: '#1a2e1a',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>−£{((row.discount_amount || 0) / 100).toFixed(2)}</span>
                    <span style={{ color: 'rgba(26,46,26,0.45)' }}>
                      {' '}
                      · Order #{row.order_id}
                      {row.redeemed_at
                        ? ` · ${new Date(row.redeemed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: 'rgba(26,46,26,0.45)' }}>No redemptions yet.</p>
            )}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}
