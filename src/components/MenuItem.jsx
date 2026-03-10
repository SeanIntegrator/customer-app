import { motion } from 'framer-motion';

export default function MenuItem({ item, onTap }) {
  const pricePounds = (item.price / 100).toFixed(2);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onTap(item)}
      style={{
        background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
        border: '1.5px solid #e0d0b0',
        borderRadius: 20,
        overflow: 'hidden',
        width: '100%',
        cursor: 'pointer',
        boxShadow: '0 2px 12px rgba(26,46,26,0.07)',
        textAlign: 'left',
        padding: 0,
      }}
    >
      {/* Top section — emoji */}
      <div style={{
        background: 'linear-gradient(155deg, #f5ecd8 0%, #eedfc4 100%)',
        padding: '20px 16px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: 38, lineHeight: 1 }}>{item.emoji}</span>
      </div>

      {/* Bottom section — name + price */}
      <div style={{ padding: '10px 14px 14px' }}>
        <p style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 14,
          fontWeight: 700,
          color: '#1a2e1a',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {item.name}
        </p>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: '#c8902a',
          marginTop: 4,
          margin: '4px 0 0',
        }}>
          £{pricePounds}
        </p>
      </div>
    </motion.button>
  );
}
