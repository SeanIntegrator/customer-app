import OrderSuccess from '../OrderSuccess';

/**
 * @param {{
 *   orderSuccessVariant: string,
 *   onDone: () => void,
 *   pickupMinutes: number,
 *   orderSuccessStampTotalPence: number | null,
 *   onGreenHeaderPointerDown: (e: import('react').PointerEvent) => void,
 * }} props
 */
export default function CartDrawerSuccessPane({
  orderSuccessVariant,
  onDone,
  pickupMinutes,
  orderSuccessStampTotalPence,
  onGreenHeaderPointerDown,
}) {
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        role="presentation"
        aria-hidden
        onPointerDown={onGreenHeaderPointerDown}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 96,
          zIndex: 1,
          touchAction: 'none',
        }}
      />
      <OrderSuccess
        variant={orderSuccessVariant}
        onDone={onDone}
        pickupMinutes={pickupMinutes}
        stampPreviewTotalPence={orderSuccessStampTotalPence ?? undefined}
      />
    </div>
  );
}
