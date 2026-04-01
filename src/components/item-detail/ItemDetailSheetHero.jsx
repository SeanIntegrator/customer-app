import { ITEM_DETAIL_GRAIN } from './itemDetailSheetStyles';

export default function ItemDetailSheetHero({ item, unitPricePence, onGreenHeaderPointerDown }) {
  return (
    <div
      onPointerDown={onGreenHeaderPointerDown}
      style={{
        background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
        position: 'relative',
        flexShrink: 0,
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: ITEM_DETAIL_GRAIN,
          backgroundRepeat: 'repeat',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 12,
          paddingBottom: 4,
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
          gap: 16,
          padding: '16px 20px 22px',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: 56, lineHeight: 1 }}>{item.emoji}</span>
        <div>
          <h2
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontSize: 24,
              fontWeight: 800,
              color: '#f0e6d0',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {item.name}
          </h2>
          <p
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: '#c8902a',
              margin: '6px 0 0',
            }}
          >
            £{(unitPricePence / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
