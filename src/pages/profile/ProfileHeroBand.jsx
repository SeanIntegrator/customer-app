import { motion } from 'framer-motion';
import { PROFILE_GRAIN } from '../../lib/profileUtils';

export default function ProfileHeroBand({
  user,
  profileInitials,
  heroFirstName,
  memberSinceLabel,
  orderCount,
  isAuthenticated,
  loyaltyLoading,
  stampsCount,
  stampsGoal,
  eventsEngagementCount,
  logout,
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
        paddingTop: 48,
        paddingBottom: 36,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: PROFILE_GRAIN,
          pointerEvents: 'none',
        }}
      />

      {/* Amber glow */}
      <motion.div
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(210,150,40,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Green glow */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(60,120,60,0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />

      {/* Decorative concentric rings — like coffee ripples */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        preserveAspectRatio="xMaxYMid slice"
      >
        {[48, 88, 130, 174, 222].map((r, i) => (
          <circle
            key={i}
            cx="105%"
            cy="52%"
            r={r}
            fill="none"
            stroke="white"
            strokeWidth="0.7"
            opacity={0.045 + i * 0.008}
            strokeDasharray={i % 2 === 0 ? '6 5' : 'none'}
          />
        ))}
      </svg>

      {/* Botanical frond */}
      <motion.div
        style={{
          position: 'absolute',
          right: '8%',
          top: -10,
          opacity: 0.24,
          pointerEvents: 'none',
          transformOrigin: '50% 100%',
        }}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width={44} height={105} viewBox="0 0 50 120" fill="none">
          <path
            d="M25 118 C25 100 25 15 25 4"
            stroke="#6aaa6a"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {[22, 40, 58, 76, 94].map((cy, i) => {
            const w = 22 - i * 2;
            return (
              <g key={i}>
                <path
                  d={`M25 ${cy} C${25 - w} ${cy - 10} ${25 - w - 8} ${cy} ${25 - w - 2} ${cy + 10} C${25 - 6} ${cy + 14} ${25 - 3} ${cy + 5} 25 ${cy}`}
                  fill="#4a8a4a"
                  opacity={0.75 - i * 0.09}
                />
                <path
                  d={`M25 ${cy} C${25 + w} ${cy - 10} ${25 + w + 8} ${cy} ${25 + w + 2} ${cy + 10} C${25 + 6} ${cy + 14} ${25 + 3} ${cy + 5} 25 ${cy}`}
                  fill="#4a8a4a"
                  opacity={0.68 - i * 0.09}
                />
              </g>
            );
          })}
        </svg>
      </motion.div>

      <div style={{ position: 'relative', padding: '0 22px' }}>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: '#c8902a',
            marginBottom: 18,
          }}
        >
          ✦ Your profile
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.08 }}
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: user?.avatarUrl
                ? 'transparent'
                : 'linear-gradient(140deg, #c8902a 0%, #deb040 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 28,
              fontWeight: 900,
              color: '#122012',
              boxShadow: '0 0 0 3px rgba(200,144,42,0.25), 0 6px 24px rgba(200,144,42,0.3)',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              profileInitials
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 300, damping: 28 }}
          >
            <h1
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 42,
                fontWeight: 900,
                color: '#f0e6d0',
                letterSpacing: '-0.035em',
                lineHeight: 0.95,
                marginBottom: 6,
              }}
            >
              {heroFirstName}
            </h1>
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: 'rgba(240,230,208,0.5)',
              }}
            >
              {isAuthenticated
                ? memberSinceLabel
                  ? `Member since ${memberSinceLabel} · ${orderCount} order${orderCount === 1 ? '' : 's'}`
                  : `${orderCount} order${orderCount === 1 ? '' : 's'} with Clay & Bean`
                : 'Sign in with Google to sync orders and rewards'}
            </p>
          </motion.div>
        </div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 8 }}
        >
          {[
            { label: 'Orders', value: isAuthenticated ? String(orderCount) : '—' },
            {
              label: 'Stamps',
              value: isAuthenticated
                ? loyaltyLoading
                  ? '…'
                  : `${stampsCount}/${stampsGoal}`
                : '—',
            },
            { label: 'Events', value: String(eventsEngagementCount) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 100,
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <span
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#f0e6d0',
                }}
              >
                {value}
              </span>
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'rgba(240,230,208,0.45)',
                  letterSpacing: '0.04em',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {isAuthenticated && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
            onClick={() => logout()}
            style={{
              marginTop: 16,
              alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 100,
              padding: '8px 16px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(240,230,208,0.65)',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Sign out
          </motion.button>
        )}
      </div>
    </div>
  );
}
