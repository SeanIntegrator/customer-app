import { motion } from 'framer-motion';
import { lineMetaCaption, sectionLabelStyle } from './cartLineHelpers';
import CartDrawerPenIcon from './CartDrawerPenIcon';
import { checkoutStepperButtonStyle } from '../../lib/pickup';

const stepperBtn = checkoutStepperButtonStyle;

export default function CartDrawerScrollBody({
  basketLocked,
  isUpdateEditMode,
  existingItems,
  newItems,
  lineEditsBlocked,
  onEditLine,
  updateQuantity,
  addingToOrderId,
  lockedOrder,
  items,
  cartStampPreviewLine,
}) {
  return (
    <>
{basketLocked ? (
  <div
    role="status"
    className="flex-shrink-0"
    style={{
      padding: '12px 20px',
      background: 'rgba(179, 74, 42, 0.1)',
      borderBottom: '1px solid rgba(179, 74, 42, 0.22)',
    }}
  >
    <p
      style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 13,
        fontWeight: 700,
        color: '#5c2e22',
        margin: 0,
        lineHeight: 1.45,
        textAlign: 'center',
      }}
    >
      It is too close to your pickup time to edit your order.
    </p>
  </div>
) : null}

<div className="flex-1 overflow-y-auto scrollbar-hide min-h-0" style={{ padding: '12px 20px' }}>
  {isUpdateEditMode ? (
    <>
      <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Already on your order</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {existingItems.map((item) => (
          <motion.div
            key={item.cartId}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              opacity: 0.75,
              background: '#e4dfd4',
              border: '1.5px solid rgba(26,46,26,0.16)',
              borderRadius: 18,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'rgba(26,46,26,0.75)',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {item.quantity > 1 ? `${item.quantity}× ` : ''}
                {item.name}
              </p>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  color: 'rgba(26,46,26,0.4)',
                  margin: '4px 0 0',
                }}
              >
                {lineMetaCaption(item)}
              </p>
              {item.customerNote ? (
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fontStyle: 'italic',
                    color: 'rgba(26,46,26,0.45)',
                    margin: '4px 0 0',
                  }}
                >
                  {item.customerNote}
                </p>
              ) : null}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'rgba(26,46,26,0.55)',
                  margin: 0,
                }}
              >
                £{((item.totalPrice * item.quantity) / 100).toFixed(2)}
              </p>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  color: 'rgba(26,46,26,0.35)',
                  margin: '4px 0 0',
                }}
              >
                Paid / on order
              </p>
            </div>
          </motion.div>
        ))}
      </div>
      <p style={{ ...sectionLabelStyle, marginBottom: 10 }}>Adding to order</p>
      {newItems.length === 0 ? (
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 14,
            color: 'rgba(26,46,26,0.5)',
            margin: '0 0 12px',
            lineHeight: 1.45,
          }}
        >
          Nothing added yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {newItems.map((item) => (
            <motion.div
              key={item.cartId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{
                background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
                border: '1.5px solid #e0d0b0',
                borderRadius: 18,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 30, flexShrink: 0 }}>{item.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#1a2e1a',
                      lineHeight: 1.3,
                      margin: 0,
                      flex: 1,
                      minWidth: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.name}
                  </p>
                  <button
                    type="button"
                    aria-label={`Edit ${item.name}`}
                    disabled={lineEditsBlocked(item)}
                    onClick={() => {
                      if (!lineEditsBlocked(item)) onEditLine?.(item);
                    }}
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      border: '1.5px solid #d4c0a0',
                      background: 'rgba(255,255,255,0.6)',
                      color: '#1a2e1a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: lineEditsBlocked(item) ? 'not-allowed' : 'pointer',
                      opacity: lineEditsBlocked(item) ? 0.4 : 1,
                    }}
                  >
                    <CartDrawerPenIcon />
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    color: 'rgba(26,46,26,0.45)',
                    margin: '4px 0 0',
                  }}
                >
                  {lineMetaCaption(item)}
                </p>
                {item.customerNote ? (
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 11,
                      fontStyle: 'italic',
                      color: 'rgba(26,46,26,0.55)',
                      margin: '4px 0 0',
                    }}
                  >
                    {item.customerNote}
                  </p>
                ) : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    disabled={lineEditsBlocked(item)}
                    onClick={() => updateQuantity(item.cartId, -1)}
                    style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#1a2e1a',
                      width: 18,
                      textAlign: 'center',
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    disabled={lineEditsBlocked(item)}
                    onClick={() => updateQuantity(item.cartId, 1)}
                    style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
                  >
                    +
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#c8902a',
                    margin: 0,
                  }}
                >
                  £{(item.totalPrice / 100).toFixed(2)} ea.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  ) : null}

  {!isUpdateEditMode && addingToOrderId != null ? (
    <div style={{ marginBottom: 14 }}>
      <p style={sectionLabelStyle}>
        Already ordered
      </p>
      {!lockedOrder ? (
        <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: 'rgba(26,46,26,0.5)' }}>
          Loading your order…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(lockedOrder.items || []).map((it, i) => {
            const modStr = Array.isArray(it.modifiers)
              ? it.modifiers.map((m) => (m && typeof m === 'object' ? m.name : m)).filter(Boolean).join(', ')
              : '';
            return (
              <div
                key={it.id ?? i}
                style={{
                  background: 'rgba(255,255,255,0.45)',
                  border: '1.5px solid #e0d0b0',
                  borderRadius: 14,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 22 }}>{it.item_emoji || '☕'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1a2e1a',
                      margin: 0,
                    }}
                  >
                    {it.quantity > 1 ? `${it.quantity}× ` : ''}
                    {it.item_name}
                  </p>
                  {modStr ? (
                    <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: 'rgba(26,46,26,0.45)', margin: '2px 0 0' }}>
                      {modStr}
                    </p>
                  ) : null}
                </div>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#1a2e1a' }}>
                  £{((Number(it.unit_price) * Number(it.quantity)) / 100).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  ) : null}

  {!isUpdateEditMode && addingToOrderId != null ? <p style={{ ...sectionLabelStyle, marginTop: 0 }}>Adding</p> : null}

  {!isUpdateEditMode && items.length === 0 && addingToOrderId == null ? (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
      <span style={{ fontSize: 48, marginBottom: 12 }}>🛒</span>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: 'rgba(26,46,26,0.4)' }}>Your cart is empty</p>
    </div>
  ) : !isUpdateEditMode && items.length === 0 && addingToOrderId != null ? (
    <div style={{ textAlign: 'center', padding: '28px 12px 48px' }}>
      <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 17, fontWeight: 700, color: 'rgba(26,46,26,0.55)', margin: 0 }}>
        Choose items from the menu to add to this order.
      </p>
    </div>
  ) : !isUpdateEditMode && items.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <motion.div
          key={item.cartId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          style={{
            background: 'linear-gradient(148deg, #fef9f0 0%, #f5ead8 100%)',
            border: '1.5px solid #e0d0b0',
            borderRadius: 18,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 30, flexShrink: 0 }}>{item.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
              <p style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 14,
                fontWeight: 700,
                color: '#1a2e1a',
                lineHeight: 1.3,
                margin: 0,
                flex: 1,
                minWidth: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {item.name}
              </p>
              <button
                type="button"
                aria-label={`Edit ${item.name}`}
                disabled={lineEditsBlocked(item)}
                onClick={() => {
                  if (!lineEditsBlocked(item)) onEditLine?.(item);
                }}
                style={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1.5px solid #d4c0a0',
                  background: 'rgba(255,255,255,0.6)',
                  color: '#1a2e1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: lineEditsBlocked(item) ? 'not-allowed' : 'pointer',
                  opacity: lineEditsBlocked(item) ? 0.4 : 1,
                }}
              >
                <CartDrawerPenIcon />
              </button>
            </div>
            <p style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 11,
              color: 'rgba(26,46,26,0.45)',
              margin: '4px 0 0',
            }}>
              {lineMetaCaption(item)}
            </p>
            {item.customerNote ? (
              <p style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 11,
                fontStyle: 'italic',
                color: 'rgba(26,46,26,0.55)',
                margin: '4px 0 0',
              }}>
                {item.customerNote}
              </p>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                disabled={lineEditsBlocked(item)}
                onClick={() => updateQuantity(item.cartId, -1)}
                style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
              >
                −
              </button>
              <span style={{
                fontFamily: 'Fraunces, Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#1a2e1a',
                width: 18,
                textAlign: 'center',
              }}>
                {item.quantity}
              </span>
              <button
                type="button"
                disabled={lineEditsBlocked(item)}
                onClick={() => updateQuantity(item.cartId, 1)}
                style={{ ...stepperBtn, opacity: lineEditsBlocked(item) ? 0.35 : 1 }}
              >
                +
              </button>
            </div>
            <p style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: '#c8902a',
              margin: 0,
            }}>
              £{(item.totalPrice / 100).toFixed(2)} ea.
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  ) : null}

  {cartStampPreviewLine ? (
    <p
      style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        fontWeight: 600,
        color: 'rgba(26,46,26,0.48)',
        margin: '14px 0 4px',
        lineHeight: 1.45,
      }}
    >
      {cartStampPreviewLine}
    </p>
  ) : null}
</div>    </>
  );
}
