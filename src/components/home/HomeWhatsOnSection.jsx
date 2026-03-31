import { motion } from 'framer-motion';

export default function HomeWhatsOnSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 28 }}
      style={{ marginTop: 28 }}
    >
      <div style={{ marginBottom: 6 }}>
        <h2
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            color: '#1a2e1a',
            letterSpacing: '-0.02em',
            margin: '0 0 4px',
          }}
        >
          What&apos;s on
        </h2>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            color: '#8a7868',
            lineHeight: 1.4,
            margin: '0 0 18px',
          }}
        >
          Something&apos;s always happening at Clay & Bean — come for the coffee, stay for the moment.
        </p>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.4)',
          border: '1.5px dashed #d4c0a0',
          borderRadius: 18,
          padding: '22px 20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(26,46,26,0.52)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          There are currently no upcoming events. Check back regularly for updates.
        </p>
      </div>
    </motion.section>
  );
}
