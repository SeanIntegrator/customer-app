import { PAPER_GRAIN_BACKGROUND } from '../../lib/pickup';

export default function EditOrderModalSheetHeader({ onGreenHeaderPointerDown, onClose }) {
  return (
    <div
      onPointerDown={onGreenHeaderPointerDown}
      style={{
        flexShrink: 0,
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
        position: 'relative',
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
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
        <div
          style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 18px',
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
          }}
        >
          Edit order
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
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
