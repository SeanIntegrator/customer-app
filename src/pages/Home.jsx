import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { USER, EVENTS, PAST_EVENTS, PROMOTIONS } from '../data/mock';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────

function Frond({ x = 0, y = 0, size = 44, rotate = 0, delay = 0, opacity = 0.22 }) {
  return (
    <motion.div
      style={{ position: 'absolute', left: x, top: y, rotate, originX: '50%', originY: '100%' }}
      animate={{ rotate: [rotate - 6, rotate + 6, rotate - 6] }}
      transition={{ duration: 5 + delay * 0.8, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <svg width={size} height={size * 2.4} viewBox="0 0 50 120" fill="none" style={{ opacity }}>
        <path d="M25 118 C25 100 25 15 25 4" stroke="#6aaa6a" strokeWidth="1.4" strokeLinecap="round" />
        {[22, 40, 58, 76, 94].map((cy, i) => {
          const w = 22 - i * 2;
          return (
            <g key={i}>
              <path d={`M25 ${cy} C${25-w} ${cy-10} ${25-w-8} ${cy} ${25-w-2} ${cy+10} C${25-6} ${cy+14} 25 ${cy}`} fill="#4a8a4a" opacity={0.75 - i * 0.09} />
              <path d={`M25 ${cy} C${25+w} ${cy-10} ${25+w+8} ${cy} ${25+w+2} ${cy+10} C${25+6} ${cy+14} 25 ${cy}`} fill="#4a8a4a" opacity={0.68 - i * 0.09} />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

function Blob({ style }) {
  return (
    <motion.div
      style={{ position: 'absolute', borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%', ...style }}
      animate={{ borderRadius: ['60% 40% 55% 45% / 50% 60% 40% 50%', '45% 55% 40% 60% / 60% 45% 55% 40%', '60% 40% 55% 45% / 50% 60% 40% 50%'] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function Steam() {
  const wisps = [{ x: -7, delay: 0 }, { x: 1, delay: 0.45 }, { x: 9, delay: 0.2 }];
  return (
    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', width: 36, height: 28, pointerEvents: 'none' }}>
      {wisps.map((s, i) => (
        <motion.div
          key={i}
          style={{ position: 'absolute', left: s.x, bottom: 0, width: 2.5, height: 18, background: 'linear-gradient(to top, rgba(255,255,255,0.65), transparent)', borderRadius: 8 }}
          animate={{ opacity: [0, 0.85, 0], y: [6, -8, -18], scaleX: [1, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: s.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── QR CODE ─────────────────────────────────────────────────────────────────

function QRCode({ size = 160 }) {
  const M = 10;
  const G = 21;

  function isFilled(r, c) {
    if (r < 8 && c < 8) return false;
    if (r < 8 && c > G - 9) return false;
    if (r > G - 9 && c < 8) return false;
    if (r === 6 && c > 7 && c < G - 8) return c % 2 === 0;
    if (c === 6 && r > 7 && r < G - 8) return r % 2 === 0;
    return (r * 31 + c * 17 + r * c * 7 + (r ^ c) * 3) % 100 < 48;
  }

  const S = M * G;
  const modules = [];
  for (let r = 0; r < G; r++)
    for (let c = 0; c < G; c++)
      if (isFilled(r, c)) modules.push([c * M, r * M]);

  return (
    <svg viewBox={`0 0 ${S} ${S}`} width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <rect width={S} height={S} fill="white" />
      {modules.map(([x, y], i) => (
        <rect key={i} x={x + 0.5} y={y + 0.5} width={M - 1} height={M - 1} rx="1.5" fill="#122012" />
      ))}
      <rect x={0} y={0} width={M*7} height={M*7} rx={6} fill="#122012" />
      <rect x={M} y={M} width={M*5} height={M*5} rx={4} fill="white" />
      <rect x={M*2} y={M*2} width={M*3} height={M*3} rx={2} fill="#122012" />
      <rect x={M*14} y={0} width={M*7} height={M*7} rx={6} fill="#122012" />
      <rect x={M*15} y={M} width={M*5} height={M*5} rx={4} fill="white" />
      <rect x={M*16} y={M*2} width={M*3} height={M*3} rx={2} fill="#122012" />
      <rect x={0} y={M*14} width={M*7} height={M*7} rx={6} fill="#122012" />
      <rect x={M} y={M*15} width={M*5} height={M*5} rx={4} fill="white" />
      <rect x={M*2} y={M*16} width={M*3} height={M*3} rx={2} fill="#122012" />
    </svg>
  );
}

// ── QR MODAL ────────────────────────────────────────────────────────────────

function QRModal({ onClose }) {
  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;
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
        <div style={{ position: 'absolute', inset: 0, backgroundImage: grain, pointerEvents: 'none', borderRadius: 28 }} />
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
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(140deg, #c8902a, #deb040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 800, color: '#122012', flexShrink: 0 }}>
              {USER.initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 700, color: '#f0e6d0', lineHeight: 1.2 }}>{USER.name}</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(240,230,208,0.45)' }}>Member since {USER.memberSince}</p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 24, fontWeight: 900, color: '#c8902a', lineHeight: 1 }}>{USER.stamps}</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(240,230,208,0.45)' }}>stamps</p>
            </div>
          </div>
          <button
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

// ── EVENT CARDS ──────────────────────────────────────────────────────────────

const EVENT_THEMES = [
  {
    gradient: 'linear-gradient(148deg, #a04820 0%, #c87040 55%, #e09858 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[0,1,2,3,4,5].map((i) => (
          <line key={i} x1={220+i*22} y1={-10} x2={80+i*22} y2={260} stroke="white" strokeWidth="0.7" opacity="0.18" />
        ))}
        <g transform="translate(295,55)" opacity="0.22" stroke="white" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="-18" x2="0" y2="18" /><line x1="-18" y1="0" x2="18" y2="0" />
          <line x1="-13" y1="-13" x2="13" y2="13" /><line x1="13" y1="-13" x2="-13" y2="13" />
        </g>
        <circle cx="60" cy="38" r="28" fill="none" stroke="white" strokeWidth="0.8" opacity="0.12" strokeDasharray="4 3" />
        <circle cx="60" cy="38" r="16" fill="none" stroke="white" strokeWidth="0.6" opacity="0.1" />
        {[[140,30],[170,18],[155,48],[320,160],[335,140]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="white" opacity="0.15" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #2a0812 0%, #5a1428 55%, #782038 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[[280,80,48],[310,140,30],[255,165,18],[290,40,14],[240,50,8]].map(([cx,cy,r],i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="0.9" opacity={0.14+i*0.02} />
        ))}
        <path d="M320 240 C300 180 280 140 300 80 C315 40 290 20 260 30" fill="none" stroke="white" strokeWidth="1" opacity="0.16" strokeLinecap="round" />
        <path d="M300 80 C280 70 265 80 260 95" fill="none" stroke="white" strokeWidth="0.8" opacity="0.14" strokeLinecap="round" />
        <path d="M290 120 C268 110 258 118 252 135" fill="none" stroke="white" strokeWidth="0.8" opacity="0.14" strokeLinecap="round" />
        {[[265,95],[268,102],[272,98],[275,106],[261,101]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3.5" fill="white" opacity="0.12" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #7a5008 0%, #a87020 55%, #c89038 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[{x:230,w:18,h:120,r:-8},{x:256,w:24,h:140,r:-3},{x:288,w:20,h:130,r:4},{x:316,w:16,h:110,r:10},{x:340,w:22,h:125,r:16}].map((b,i) => (
          <rect key={i} x={b.x} y={50} width={b.w} height={b.h} rx="3" fill="none" stroke="white" strokeWidth="0.9" opacity="0.15" transform={`rotate(${b.r} ${b.x+b.w/2} 110)`} />
        ))}
        <path d="M40 70 C80 60 110 65 120 70 C110 75 80 80 40 70Z" fill="white" opacity="0.08" />
        <path d="M40 70 C10 55 8 40 20 30 C35 58 40 70 40 70Z" fill="white" opacity="0.07" />
        {[[170,30],[182,30],[194,30]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="white" opacity="0.18" />
        ))}
      </svg>
    ),
  },
  {
    gradient: 'linear-gradient(148deg, #4a2810 0%, #7a4820 55%, #a06830 100%)',
    svg: (
      <svg width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        {[60,42,26,14].map((r,i) => (
          <circle key={i} cx="295" cy="80" r={r} fill="none" stroke="white" strokeWidth="0.8" opacity={0.1+i*0.03} />
        ))}
        {[0,45,90,135,180,225,270,315].map((deg,i) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={i} x1={295} y1={80} x2={295+Math.cos(rad)*64} y2={80+Math.sin(rad)*64} stroke="white" strokeWidth="0.7" opacity="0.14" />;
        })}
        <path d="M60 240 C62 200 58 160 64 120" stroke="white" strokeWidth="1" fill="none" opacity="0.18" strokeLinecap="round" />
        {[[64,120],[62,135],[66,148],[60,162]].map(([x,y],i) => (
          <ellipse key={i} cx={x} cy={y} rx="8" ry="4" fill="white" opacity="0.12" transform={`rotate(${i%2===0?30:-30} ${x} ${y})`} />
        ))}
        <path d="M85 240 C87 195 83 155 88 110" stroke="white" strokeWidth="1" fill="none" opacity="0.14" strokeLinecap="round" />
      </svg>
    ),
  },
];

const CARD_ROTATIONS = [-1.8, 1.2, -0.7, 2.1];

function EventFeatureCard({ event, onToggle, index }) {
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

// ── PAGE ─────────────────────────────────────────────────────────────────────

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E")`;

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState(EVENTS);
  const [showPast, setShowPast] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const toggleEvent = (id) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, registered: !e.registered } : e)));
  };

  const promo = PROMOTIONS[0];
  const registeredEvents = events.filter((e) => e.registered);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="h-full overflow-y-auto scrollbar-hide"
      style={{ background: '#f0e6d0' }}
    >
      {/* ── HERO — 65vh, CTA bridges the fold ─────────────────────────── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 50%, #223828 100%)',
          height: '65vh',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 44,
          paddingBottom: 44,
        }}
      >
        {/* Grain */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none' }} />

        {/* Throbbing amber glow — top right */}
        <motion.div
          style={{ position: 'absolute', top: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(210,150,40,0.26) 0%, transparent 65%)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.22, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Secondary green glow — bottom left */}
        <motion.div
          style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(60,120,60,0.2) 0%, transparent 65%)', pointerEvents: 'none' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <Blob style={{ bottom: -50, left: -60, width: 200, height: 180, background: 'rgba(60,110,60,0.1)', pointerEvents: 'none' }} />

        {/* Botanical fronds */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Frond x="66%" y={-18} size={56} rotate={22} delay={0} opacity={0.34} />
          <Frond x="81%" y={22} size={36} rotate={38} delay={1.4} opacity={0.22} />
          <Frond x="-7%" y={28} size={46} rotate={-28} delay={0.7} opacity={0.26} />
          <Frond x="52%" y={55} size={26} rotate={14} delay={2.1} opacity={0.15} />

          {/* Technical grid */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.055 }} preserveAspectRatio="none">
            {[20,40,60,80].map((p) => <line key={`v${p}`} x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" stroke="white" strokeWidth="1" />)}
            {[33,66].map((p) => <line key={`h${p}`} x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} stroke="white" strokeWidth="1" />)}
            {[20,40,60,80].map((x) => [33,66].map((y) => (
              <g key={`x${x}${y}`}>
                <line x1={`${x-1}%`} y1={`${y}%`} x2={`${x+1}%`} y2={`${y}%`} stroke="white" strokeWidth="1" />
                <line x1={`${x}%`} y1={`${y-2}%`} x2={`${x}%`} y2={`${y+2}%`} stroke="white" strokeWidth="1" />
              </g>
            )))}
          </svg>

          {/* Corner brackets */}
          <svg style={{ position: 'absolute', bottom: 22, left: 24, opacity: 0.26 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M0 10 L0 0 L10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <svg style={{ position: 'absolute', bottom: 22, right: 24, opacity: 0.26 }} width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M20 10 L20 0 L10 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        {/* TOP: Greeting + avatar */}
        <div style={{ position: 'relative', padding: '0 24px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 28 }}
            >
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c8902a', marginBottom: 6 }}>
                ✦ {getGreeting()},
              </p>
              <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 50, fontWeight: 900, color: '#f0e6d0', letterSpacing: '-0.035em', lineHeight: 0.92, textShadow: '0 2px 30px rgba(0,0,0,0.3)' }}>
                {USER.name}.
              </h1>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate('/profile')}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.14, type: 'spring', stiffness: 320, damping: 24 }}
              style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(140deg, #c8902a 0%, #deb040 100%)', color: '#122012', fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2.5px rgba(200,144,42,0.28), 0 4px 20px rgba(200,144,42,0.35)', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              {USER.initials}
            </motion.button>
          </div>
        </div>

        {/* Flex spacer */}
        <div style={{ flex: 1 }} />

                {/* ── LOYALTY CARD — gold physical card style ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, type: 'spring', stiffness: 260, damping: 28 }}
          style={{ padding: '0 18px', marginBottom: 10, position: 'relative', zIndex: 1 }}
        >
          <motion.div
            whileTap={{ scale: 0.982 }}
            onClick={() => setShowQR(true)}
            style={{
              background: 'linear-gradient(148deg, #faf2e2 0%, #f2e4cc 100%)',
              borderRadius: 20,
              padding: '16px 18px 15px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            {/* Grain texture */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, pointerEvents: 'none', opacity: 0.35 }} />

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 11 }}>

              {/* Row 1: label + rewards button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,46,26,0.45)' }}>
                  Loyalty Card
                </p>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={(e) => { e.stopPropagation(); navigate('/profile'); }}
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#f0e6d0', background: '#1a2e1a', border: 'none', borderRadius: 100, padding: '4px 11px', cursor: 'pointer', letterSpacing: '0.02em' }}
                >
                  ★ My rewards · 1
                </motion.button>
              </div>

              {/* Row 2: stamp dots */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 6 }}>
                {Array.from({ length: USER.stampsGoal }).map((_, i) => {
                  const filled = i < USER.stamps;
                  return (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={filled ? { scale: 1, opacity: 1 } : { scale: 0.88, opacity: 0.5 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22, delay: filled ? i * 0.04 : 0 }}
                      style={{ aspectRatio: '1', borderRadius: '50%', background: filled ? 'linear-gradient(140deg, #c8902a, #d8aa38)' : 'rgba(26,46,26,0.1)', border: filled ? '1px solid rgba(210,160,50,0.5)' : '1.5px solid rgba(26,46,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: filled ? '0 2px 6px rgba(180,120,20,0.28)' : 'none' }}
                    >
                      {filled && <div style={{ width: '38%', height: '38%', borderRadius: '50%', background: 'rgba(255,245,210,0.65)' }} />}
                    </motion.div>
                  );
                })}
              </div>

              {/* Row 3: progress + tap hint */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 600, color: 'rgba(26,46,26,0.65)', letterSpacing: '0.01em' }}>
                  {USER.stampsGoal - USER.stamps} to go until next reward
                </p>
                
              </div>

            </div>
          </motion.div>
        </motion.div>

          {/* Flex spacer */}
        <div style={{ flex: 1 }} />

        {/* BOTTOM SUMMARY: booked events + promo */}
        <div style={{ position: 'relative', padding: '0 18px 22px', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

      


          {/* Registered events */}
          {registeredEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.22 + idx * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 16, padding: '13px 16px' }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{event.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 700, color: '#f0e6d0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.title}
                </p>
                <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(240,230,208,0.5)' }}>
                  {event.date} · {event.time}
                </p>
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#7aca7a', background: 'rgba(80,180,80,0.14)', border: '1px solid rgba(80,180,80,0.22)', borderRadius: 100, padding: '3px 10px', flexShrink: 0, letterSpacing: '0.05em' }}>
                ✓ Going
              </span>
            </motion.div>
          ))}

          {/* Promo summary card */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + registeredEvents.length * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(200,144,42,0.1)', border: '1px solid rgba(200,144,42,0.2)', borderRadius: 16, padding: '13px 16px' }}
          >
            <motion.span
              style={{ fontSize: 20, flexShrink: 0, display: 'block' }}
              animate={{ scale: [1, 1.18, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {promo.emoji}
            </motion.span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 14, fontWeight: 700, color: '#f0e6d0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {promo.title}
              </p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(240,230,208,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {promo.description}
              </p>
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8902a', background: 'rgba(200,144,42,0.18)', padding: '3px 9px', borderRadius: 100, flexShrink: 0 }}>
              {promo.tag}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── BRIDGING CTA — straddles hero/cream boundary ───────────────── */}
      <div style={{ margin: '-30px 18px 0', position: 'relative', zIndex: 10 }}>
        <motion.button
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: [
              '0 10px 48px rgba(180,120,18,0.44), 0 2px 8px rgba(0,0,0,0.14)',
              '0 14px 72px rgba(210,150,30,0.78), 0 2px 8px rgba(0,0,0,0.14)',
              '0 10px 48px rgba(180,120,18,0.44), 0 2px 8px rgba(0,0,0,0.14)',
            ],
          }}
          transition={{
            opacity: { delay: 0.26, duration: 0.4 },
            y: { delay: 0.26, type: 'spring', stiffness: 280, damping: 26 },
            scale: { delay: 0.26, type: 'spring', stiffness: 280, damping: 26 },
            boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/order')}
          style={{ width: '100%', background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)', borderRadius: 24, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', cursor: 'pointer' }}
        >
          <div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(18,32,18,0.52)', marginBottom: 5 }}>
              Ready to order?
            </p>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 28, fontWeight: 800, color: '#122012', letterSpacing: '-0.025em', lineHeight: 1.0 }}>
              Start your order
            </p>
          </div>
          <div style={{ position: 'relative', paddingBottom: 18, flexShrink: 0 }}>
            <span style={{ fontSize: 44, lineHeight: 1, display: 'block' }}>☕</span>
            <Steam />
          </div>
        </motion.button>
      </div>

      {/* ── SCROLLABLE CONTENT ────────────────────────────────────────── */}
      <div style={{ padding: '40px 18px 60px' }}>



        {/* ── EVENTS ──────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.52, type: 'spring', stiffness: 260, damping: 28 }}
        >
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e1a', letterSpacing: '-0.02em' }}>
                What's on
              </h2>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#8a7868' }}>
                {events.filter((e) => !e.registered).length} coming up
              </span>
            </div>
            <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#8a7868', lineHeight: 1.4, marginBottom: 18 }}>
              Something's always happening at Clay & Bean — come for the coffee, stay for the moment.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {events.map((event, i) => (
              <EventFeatureCard key={event.id} event={event} onToggle={toggleEvent} index={i} />
            ))}
          </div>

          {/* Past events toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} style={{ marginTop: 24 }}>
            <button
              onClick={() => setShowPast((v) => !v)}
              style={{ width: '100%', background: 'none', border: '1.5px dashed #c8b898', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#8a7868', letterSpacing: '0.02em' }}
            >
              <span style={{ fontSize: 16 }}>🕰</span>
              {showPast ? 'Hide past events' : `See ${PAST_EVENTS.length} events you attended`}
              <motion.span animate={{ rotate: showPast ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} style={{ display: 'inline-block', lineHeight: 1 }}>
                ↓
              </motion.span>
            </button>

            <AnimatePresence>
              {showPast && (
                <motion.div key="past" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }} style={{ overflow: 'hidden' }}>
                  <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {PAST_EVENTS.map((pe) => (
                      <div key={pe.id} style={{ background: 'rgba(255,255,255,0.5)', border: '1.5px solid #e0d0b8', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(145deg, #e8e0d0, #d4c8b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                          {pe.emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 15, fontWeight: 600, color: '#1a2e1a' }}>{pe.title}</p>
                            <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a9a78', background: '#d4e8d0', padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>✓ Attended</span>
                          </div>
                          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#8a7868', marginBottom: 3 }}>{pe.date}</p>
                          <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#6a5a4a', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{pe.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      </div>

      {/* ── QR MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showQR && <QRModal onClose={() => setShowQR(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}
