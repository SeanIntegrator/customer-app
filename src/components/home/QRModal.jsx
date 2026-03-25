import { motion } from 'framer-motion';
import QRCode from './QRCode';

const LOYALTY_MODAL_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

export default function QRModal({ onClose, displayName, initials, avatarUrl, stamps, memberSubline }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(8,16,8,0.88)', backdropFilter: 'blur(10px)', paddingBottom: 72 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        style={{ background: 'linear-gradient(148deg, #1e3822 0%, #142012 100%)', borderRadius: 28, padding: '30px 26px 26px', width: '100%', margin: '0 16px', boxShadow: '0 -8px 60px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: 'absolute', inset: 0, backgroundImage: LOYALTY_MODAL_GRAIN, pointerEvents: 'none', borderRadius: 28 }} />
        <motion.div
          style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,144,42,0.22) 0%, transparent 65%)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c8902a', marginBottom: 5 }}>
            ✦ Clay & Bean
          </p>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 800, color: '#f0e6d0', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 4 }}>
            Your loyalty card
          </h2>
          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: 'rgba(240,230,208,0.55)', marginBottom: 26 }}>
            Show this to your barista to earn stamps
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
            <div style={{ background: '#f0e6d0', padding: 14, borderRadius: 18, boxShadow: '0 6px 28px rgba(0,0,0,0.28)' }}>
              <QRCode size={152} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(140deg, #c8902a, #deb040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 800, color: '#122012', flexShrink: 0, overflow: 'hidden' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 700, color: '#f0e6d0', lineHeight: 1.2 }}>{displayName}</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(240,230,208,0.45)' }}>{memberSubline}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, fontWeight: 900, color: '#c8902a', lineHeight: 1 }}>{stamps}</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,230,208,0.45)' }}>stamps</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(240,230,208,0.6)', cursor: 'pointer', letterSpacing: '0.03em' }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
