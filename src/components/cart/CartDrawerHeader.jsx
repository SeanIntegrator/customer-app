import { PAPER_GRAIN_BACKGROUND } from '../../lib/pickup';

/**
 * @param {{
 *   title: string,
 *   onClose: () => void,
 *   onGreenHeaderPointerDown: (e: import('react').PointerEvent) => void,
 * }} props
 */
export default function CartDrawerHeader({ title, onClose, onGreenHeaderPointerDown }) {
  return (
    <div
      className="flex-shrink-0"
      onPointerDown={onGreenHeaderPointerDown}
      style={{
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: PAPER_GRAIN_BACKGROUND,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 12,
          paddingBottom: 2,
          position: 'relative',
        }}
      >
        <div
          style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px 16px',
          position: 'relative',
        }}
      >
        <h2
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 20,
            fontWeight: 800,
            color: '#f0e6d0',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(240,230,208,0.15)',
            border: '1.5px solid rgba(240,230,208,0.2)',
            color: '#f0e6d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 14, height: 14 }}>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
