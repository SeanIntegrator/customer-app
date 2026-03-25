import { motion, AnimatePresence } from 'framer-motion';
import EventFeatureCard from './EventFeatureCard';

export default function HomeEventsSection({ events, pastEvents, showPast, setShowPast, onEventToggle }) {
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52, type: 'spring', stiffness: 260, damping: 28 }}>
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 22, fontWeight: 700, color: '#1a2e1a', letterSpacing: '-0.02em' }}>What&apos;s on</h2>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#8a7868' }}>{events.filter((e) => !e.registered).length} coming up</span>
        </div>
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#8a7868', lineHeight: 1.4, marginBottom: 18 }}>
          Something&apos;s always happening at Clay & Bean — come for the coffee, stay for the moment.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {events.map((event, i) => (
          <EventFeatureCard key={event.id} event={event} onToggle={onEventToggle} index={i} />
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => setShowPast((v) => !v)}
          style={{ width: '100%', background: 'none', border: '1.5px dashed #c8b898', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#8a7868', letterSpacing: '0.02em' }}
        >
          <span style={{ fontSize: 16 }}>🕰</span>
          {showPast ? 'Hide past events' : `See ${pastEvents.length} events you attended`}
          <motion.span animate={{ rotate: showPast ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }} style={{ display: 'inline-block', lineHeight: 1 }}>
            ↓
          </motion.span>
        </button>

        <AnimatePresence>
          {showPast && (
            <motion.div key="past" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pastEvents.map((pe) => (
                  <div key={pe.id} style={{ background: 'rgba(255,255,255,0.5)', border: '1.5px solid #e0d0b8', borderRadius: 18, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(145deg, #e8e0d0, #d4c8b0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{pe.emoji}</div>
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
  );
}
