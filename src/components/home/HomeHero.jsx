import { motion } from 'framer-motion';
import { PAPER_GRAIN_BACKGROUND } from '../../lib/pickup';
import { getHomeGreeting } from './homeGreeting';
import Frond from './Frond';
import Blob from './Blob';

export default function HomeHero({
  navigate,
  user,
  profileInitials,
  heroFirstName,
  onOpenLoyaltyCard,
  loyaltyStamps = 0,
  loyaltyGoal = 9,
  loyaltyStampsToNext = 9,
  loyaltyRewardsAvailable = 0,
  loyaltyLoading = false,
  isAuthenticated = false,
  /** Stamps expected when the in-flight gold-card order is collected (0 if under £2). */
  pendingStampEarnCount = 0,
  /** When true (active gold card), use a shorter hero. */
  hidePromotionalChips = false,
  orderCount: _orderCount = null,
  memberSinceLabel: _memberSinceLabel = null,
}) {
  const hasFreeDrinksBubble =
    isAuthenticated && !loyaltyLoading && loyaltyRewardsAvailable > 0;

  /** Min px values leave room for the loyalty card above HomeBridgingCta’s -42px overlap. Taller when the free-drinks row is shown (adds ~56px to the card). */
  const heroHeight = hidePromotionalChips
    ? hasFreeDrinksBubble
      ? 'clamp(412px, 50vh, 500px)'
      : 'clamp(328px, 48vh, 480px)'
    : hasFreeDrinksBubble
      ? 'clamp(392px, 54vh, 560px)'
      : 'clamp(348px, 52vh, 560px)';
  const heroPaddingTop = hidePromotionalChips ? 32 : 40;
  const heroPaddingBottom = hidePromotionalChips ? 20 : 32;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 50%, #223828 100%)',
        height: heroHeight,
        display: 'flex',
        flexDirection: 'column',
        paddingTop: heroPaddingTop,
        paddingBottom: heroPaddingBottom,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: PAPER_GRAIN_BACKGROUND,
          pointerEvents: 'none',
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(210,150,40,0.26) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.22, 1], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(60,120,60,0.2) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <Blob
        style={{
          bottom: -50,
          left: -60,
          width: 200,
          height: 180,
          background: 'rgba(60,110,60,0.1)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Frond x="66%" y={-18} size={56} rotate={22} delay={0} opacity={0.34} />
        <Frond x="81%" y={22} size={36} rotate={38} delay={1.4} opacity={0.22} />
        <Frond x="-7%" y={28} size={46} rotate={-28} delay={0.7} opacity={0.26} />
        <Frond x="52%" y={55} size={26} rotate={14} delay={2.1} opacity={0.15} />

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.055 }}
          preserveAspectRatio="none"
        >
          {[20, 40, 60, 80].map((p) => (
            <line
              key={`v${p}`}
              x1={`${p}%`}
              y1="0"
              x2={`${p}%`}
              y2="100%"
              stroke="white"
              strokeWidth="1"
            />
          ))}
          {[33, 66].map((p) => (
            <line
              key={`h${p}`}
              x1="0"
              y1={`${p}%`}
              x2="100%"
              y2={`${p}%`}
              stroke="white"
              strokeWidth="1"
            />
          ))}
          {[20, 40, 60, 80].map((x) =>
            [33, 66].map((y) => (
              <g key={`x${x}${y}`}>
                <line
                  x1={`${x - 1}%`}
                  y1={`${y}%`}
                  x2={`${x + 1}%`}
                  y2={`${y}%`}
                  stroke="white"
                  strokeWidth="1"
                />
                <line
                  x1={`${x}%`}
                  y1={`${y - 2}%`}
                  x2={`${x}%`}
                  y2={`${y + 2}%`}
                  stroke="white"
                  strokeWidth="1"
                />
              </g>
            ))
          )}
        </svg>

        <svg
          style={{ position: 'absolute', bottom: 22, left: 24, opacity: 0.26 }}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M0 10 L0 0 L10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg
          style={{ position: 'absolute', bottom: 22, right: 24, opacity: 0.26 }}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M20 10 L20 0 L10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="app-content w-full" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 28 }}
          >
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#c8902a',
                marginBottom: 6,
              }}
            >
              ✦ {getHomeGreeting()},
            </p>
            <h1
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 50,
                fontWeight: 900,
                color: '#f0e6d0',
                letterSpacing: '-0.035em',
                lineHeight: 0.92,
                textShadow: '0 2px 30px rgba(0,0,0,0.3)',
              }}
            >
              {heroFirstName}
            </h1>
          </motion.div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate('/profile')}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.14, type: 'spring', stiffness: 320, damping: 24 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: user?.avatarUrl
                ? 'transparent'
                : 'linear-gradient(140deg, #c8902a 0%, #deb040 100%)',
              color: '#122012',
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 18,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2.5px rgba(200,144,42,0.28), 0 4px 20px rgba(200,144,42,0.35)',
              border: 'none',
              cursor: 'pointer',
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
          </motion.button>
        </div>
      </div>

      <div style={{ flex: hidePromotionalChips ? 0.3 : 0.42 }} />

      <motion.div
        className="app-content w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, type: 'spring', stiffness: 260, damping: 28 }}
        style={{
          marginTop: 22,
          marginBottom: 26,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          whileTap={{ scale: 0.982 }}
          onClick={onOpenLoyaltyCard}
          className="w-full max-w-[min(100%,448px)] mx-auto lg:mx-0"
          style={{
            background: 'linear-gradient(148deg, #faf2e2 0%, #f2e4cc 100%)',
            borderRadius: 20,
            padding: '16px 18px 15px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow:
              '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: PAPER_GRAIN_BACKGROUND,
              pointerEvents: 'none',
              opacity: 0.35,
            }}
          />

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,46,26,0.45)',
                }}
              >
                Loyalty Card
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/profile');
                }}
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#f0e6d0',
                  background: '#1a2e1a',
                  border: 'none',
                  borderRadius: 100,
                  padding: '4px 11px',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                ★ Stamps · {loyaltyLoading ? '…' : `${loyaltyStamps}/${loyaltyGoal}`}
              </motion.button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', gap: 6 }}>
              {Array.from({ length: loyaltyGoal }).map((_, i) => {
                const filled = isAuthenticated && !loyaltyLoading && i < loyaltyStamps;
                const pending =
                  isAuthenticated &&
                  !loyaltyLoading &&
                  pendingStampEarnCount > 0 &&
                  i >= loyaltyStamps &&
                  i < loyaltyStamps + pendingStampEarnCount;
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={
                      filled
                        ? { scale: 1, opacity: 1 }
                        : pending
                          ? { scale: 0.94, opacity: 0.88 }
                          : { scale: 0.88, opacity: 0.5 }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 22,
                      delay: filled ? i * 0.04 : 0,
                    }}
                    style={{
                      aspectRatio: '1',
                      borderRadius: '50%',
                      background: filled
                        ? 'linear-gradient(140deg, #c8902a, #d8aa38)'
                        : pending
                          ? 'linear-gradient(145deg, rgba(90,130,90,0.22), rgba(120,160,120,0.28))'
                          : 'rgba(26,46,26,0.1)',
                      border: filled
                        ? '1px solid rgba(210,160,50,0.5)'
                        : pending
                          ? '1.5px solid rgba(60,100,60,0.28)'
                          : '1.5px solid rgba(26,46,26,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: filled
                        ? '0 2px 6px rgba(180,120,20,0.28)'
                        : pending
                          ? '0 1px 4px rgba(40,80,40,0.12)'
                          : 'none',
                    }}
                  >
                    {filled && (
                      <div
                        style={{
                          width: '38%',
                          height: '38%',
                          borderRadius: '50%',
                          background: 'rgba(255,245,210,0.65)',
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(26,46,26,0.65)',
                  letterSpacing: '0.01em',
                }}
              >
                {loyaltyLoading
                  ? 'Loading your card…'
                  : !isAuthenticated
                    ? 'Sign in to earn stamps on qualifying orders (£2+) when you collect'
                    : `${loyaltyStampsToNext} to go until next reward`}
              </p>
            </div>

            {isAuthenticated && !loyaltyLoading && loyaltyRewardsAvailable > 0 ? (
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                animate={{
                  boxShadow: [
                    '0 12px 36px rgba(26,46,26,0.12)',
                    '0 14px 40px rgba(60,100,60,0.14)',
                    '0 12px 36px rgba(26,46,26,0.12)',
                  ],
                }}
                transition={{ boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/rewards');
                }}
                style={{
                  marginTop: 12,
                  width: '100%',
                  textAlign: 'left',
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#1a2e1a',
                  background: 'linear-gradient(165deg, #fffdf8 0%, #f5f0e4 45%, #ebe4d4 100%)',
                  border: '1px solid rgba(26,46,26,0.1)',
                  borderRadius: 20,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  boxShadow:
                    '0 12px 36px rgba(26,46,26,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)',
                }}
              >
                <span style={{ flex: '1 1 auto', minWidth: 0, lineHeight: 1.2 }}>
                  {loyaltyRewardsAvailable} free drink{loyaltyRewardsAvailable === 1 ? '' : 's'}{' '}
                  available
                </span>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                  style={{ flexShrink: 0, opacity: 0.55 }}
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
