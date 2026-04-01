import { inProgressBanner, inProgressText, inProgressCartBtn } from '../../styles/orderShellUi';

export default function OrderShellInProgressBanner({ pickupLine, onOpenCart }) {
  return (
    <div style={inProgressBanner}>
      <p style={inProgressText}>{pickupLine}</p>
      <button type="button" onClick={onOpenCart} style={inProgressCartBtn}>
        Cart
      </button>
    </div>
  );
}
