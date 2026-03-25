import { motion } from 'framer-motion';
import { EVENT_THEMES, CARD_ROTATIONS } from './eventThemes';

export default function EventFeatureCard({ event, onToggle, index }) {
  const { title, date, time, description, spotsLeft, emoji, registered, id } = event;
  const nearlyFull = spotsLeft != null && spotsLeft <= 3;
  const theme = EVENT_THEMES[index % EVENT_THEMES.length];
  const rotate = CARD_ROTATIONS[index % CARD_ROTATIONS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1, type: 'spring', stiffness: 240, damping: 28 }}
      style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', height: 248, rotate, boxShadow: '0 10px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: theme.gradient }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{theme.svg}</div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.04) 100%)' }} />

      <div style={{ position: 'absolute', top: 16, left: 18, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
        {emoji}
      </div>

      {registered && (
        <div style={{ position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 100, padding: '5px 12px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.08em' }}>
          ✓ Going
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px 20px' }}>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
          {date} · {time}
        </p>
        <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 7 }}>
          {title}
        </h3>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 600, color: nearlyFull ? '#ffaa80' : 'rgba(255,255,255,0.52)', letterSpacing: '0.06em' }}>
            {spotsLeft == null ? '● Drop in anytime' : spotsLeft === 0 ? '● Full' : nearlyFull ? `● Only ${spotsLeft} spots left!` : `● ${spotsLeft} spots remaining`}
          </span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onToggle?.(id)}
            style={{ background: registered ? 'rgba(255,255,255,0.15)' : '#fff', color: registered ? 'rgba(255,255,255,0.85)' : '#122012', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 700, padding: '9px 20px', borderRadius: 100, border: registered ? '1px solid rgba(255,255,255,0.25)' : 'none', cursor: 'pointer', letterSpacing: '0.03em', backdropFilter: 'blur(6px)' }}
          >
            {registered ? '✓ Going' : 'Join →'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
