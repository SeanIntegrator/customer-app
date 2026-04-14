import { inProgressBanner, inProgressText, inProgressCartBtn } from '../../styles/orderShellUi';

export default function OrderShellInProgressBanner({ pickupLine, onOpenCart }) {
  return (
    <div style={inProgressBanner}>
      <div
        className="app-content w-full"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <p style={inProgressText}>{pickupLine}</p>
        <button type="button" onClick={onOpenCart} style={inProgressCartBtn}>
          Cart
        </button>
      </div>
    </div>
  );
}
