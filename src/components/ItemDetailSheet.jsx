import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSheetSwipeToClose } from '../lib/useSheetSwipeToClose';
import { MILK_OPTIONS, SIZE_OPTIONS, SYRUP_OPTIONS } from '../data/modifierDefaults';
import { getSyrupChipColors } from '../data/mock';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';
import ItemDetailSheetHero from './item-detail/ItemDetailSheetHero';
import {
  itemDetailSectionLabel,
  itemDetailActiveOption,
  itemDetailInactiveOption,
} from './item-detail/itemDetailSheetStyles';

function isSoyaMilkName(name) {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  if (n.includes('soya') || n.includes('soymilk')) return true;
  if (n.includes('soy') && n.includes('milk')) return true;
  return false;
}

export default function ItemDetailSheet({
  item,
  onClose,
  onAddToCart,
  editCartLine = null,
  onSaveCartLine,
  milkOptions = MILK_OPTIONS,
  sizeOptions = SIZE_OPTIONS,
  syrupOptions = SYRUP_OPTIONS,
  alterationOptions = [],
  addDisabled = false,
  /** When true (in-flight order + pickup within ORDER_MODIFY_CUTOFF), block all edits and add/save. */
  orderModifyLocked = false,
}) {
  const [size, setSize] = useState('Regular');
  const [milk, setMilk] = useState('Full Fat');
  const [syrup, setSyrup] = useState(null);
  const [alterations, setAlterations] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState('');
  const [syrupAccordionOpen, setSyrupAccordionOpen] = useState(false);

  const milkOptionsVisible = useMemo(
    () => milkOptions.filter((m) => !isSoyaMilkName(m.name)),
    [milkOptions]
  );

  const isEdit = Boolean(editCartLine?.cartId);
  const lockedLineEdit = Boolean(isEdit && editCartLine?.fromExistingOrder);
  const formLocked = orderModifyLocked || lockedLineEdit;

  // Intentionally depend on catalogObjectId + cartId, not full `item`, to avoid resetting on every parent render.
  useEffect(() => {
    if (!item) return;
    if (editCartLine) {
      setSize(editCartLine.size ?? 'Regular');
      const rawMilk = editCartLine.milk ?? milkOptionsVisible[0]?.name ?? 'Full Fat';
      setMilk(isSoyaMilkName(rawMilk) ? (milkOptionsVisible[0]?.name ?? 'Full Fat') : rawMilk);
      setSyrup(editCartLine.syrup ?? null);
      setAlterations(Array.isArray(editCartLine.alterations) ? [...editCartLine.alterations] : []);
      setQuantity(editCartLine.quantity ?? 1);
      setCustomerNote(editCartLine.customerNote != null ? String(editCartLine.customerNote) : '');
      setSyrupAccordionOpen(Boolean(editCartLine.syrup));
    } else {
      setSize('Regular');
      setMilk(milkOptionsVisible[0]?.name ?? 'Full Fat');
      setSyrup(null);
      setAlterations([]);
      setQuantity(1);
      setCustomerNote('');
      setSyrupAccordionOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable item identity via catalogObjectId
  }, [item?.catalogObjectId, editCartLine?.cartId, milkOptionsVisible, editCartLine]);

  useEffect(() => {
    setMilk((prev) =>
      milkOptionsVisible.some((m) => m.name === prev)
        ? prev
        : (milkOptionsVisible[0]?.name ?? 'Full Fat')
    );
  }, [milkOptionsVisible]);

  const toggleAlteration = (name) => {
    setAlterations((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const sizeDelta = sizeOptions.find((s) => s.name === size)?.delta ?? 0;
  const milkDelta =
    milkOptionsVisible.find((m) => m.name === milk)?.delta ??
    milkOptions.find((m) => m.name === milk)?.delta ??
    0;
  const syrupDelta = syrup ? (syrupOptions.find((s) => s.name === syrup)?.delta ?? 0) : 0;
  const alterationsDelta = alterations.reduce(
    (sum, name) => sum + (alterationOptions.find((a) => a.name === name)?.delta ?? 0),
    0
  );
  const unitPrice = item ? item.price + sizeDelta + milkDelta + syrupDelta + alterationsDelta : 0;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (!item || addDisabled || orderModifyLocked) return;
    const noteTrim = customerNote.trim();
    if (isEdit && onSaveCartLine) {
      if (editCartLine.fromExistingOrder) {
        onClose();
        return;
      }
      onSaveCartLine({
        cartId: editCartLine.cartId,
        catalogObjectId: item.catalogObjectId,
        name: item.name,
        emoji: item.emoji,
        category: item.category,
        showDrinkModifiers: item.showDrinkModifiers,
        size,
        milk,
        syrup,
        alterations,
        quantity,
        totalPrice: unitPrice,
        customerNote: noteTrim,
        fromExistingOrder: editCartLine.fromExistingOrder,
      });
      onClose();
      return;
    }
    const cartId = `${item.catalogObjectId}|${size}|${milk}|${syrup ?? 'none'}|${alterations.join(',')}|${Date.now()}`;
    onAddToCart({
      cartId,
      catalogObjectId: item.catalogObjectId,
      name: item.name,
      emoji: item.emoji,
      category: item.category,
      showDrinkModifiers: item.showDrinkModifiers,
      size,
      milk,
      syrup,
      alterations,
      quantity,
      totalPrice: unitPrice,
      customerNote: noteTrim,
    });
    onClose();
  };

  const showDrinkUi = item?.showDrinkModifiers ?? item?.showCoffeeOptions ?? false;

  const { sheetMotionProps, onGreenHeaderPointerDown } = useSheetSwipeToClose(onClose);

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 sheet-backdrop z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#f0e6d0',
              borderRadius: '28px 28px 0 0',
              zIndex: 50,
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
              maxHeight: '95vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            {...sheetMotionProps}
          >
            <ItemDetailSheetHero
              item={item}
              unitPricePence={unitPrice}
              onGreenHeaderPointerDown={onGreenHeaderPointerDown}
            />

            {orderModifyLocked ? (
              <div
                role="status"
                style={{
                  flexShrink: 0,
                  margin: 0,
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
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  padding: '24px 20px',
                  paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                {!orderModifyLocked && lockedLineEdit ? (
                  <p
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'rgba(26,46,26,0.65)',
                      margin: '0 0 20px',
                      lineHeight: 1.45,
                    }}
                  >
                    This item is already on your order and can&apos;t be changed here. Add new items
                    from the menu, then save from your cart.
                  </p>
                ) : null}

                <div
                  style={{
                    pointerEvents: formLocked ? 'none' : 'auto',
                    opacity: formLocked ? 0.5 : 1,
                  }}
                >
                  {/* Size picker */}
                  {showDrinkUi && (
                    <div style={{ marginBottom: 20 }}>
                      <span style={itemDetailSectionLabel}>Size</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {sizeOptions.map((opt) => (
                          <button
                            key={opt.name}
                            type="button"
                            disabled={formLocked}
                            onClick={() => setSize(opt.name)}
                            style={{
                              flex: 1,
                              padding: '11px 8px',
                              borderRadius: 14,
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              textAlign: 'center',
                              ...(size === opt.name
                                ? itemDetailActiveOption
                                : itemDetailInactiveOption),
                            }}
                          >
                            {opt.name}
                            {opt.delta !== 0 && (
                              <span
                                style={{
                                  display: 'block',
                                  fontSize: 10,
                                  fontWeight: 400,
                                  marginTop: 2,
                                  opacity: 0.7,
                                }}
                              >
                                {opt.delta > 0
                                  ? `+${(opt.delta / 100).toFixed(2)}`
                                  : `-${(Math.abs(opt.delta) / 100).toFixed(2)}`}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milk picker */}
                  {showDrinkUi && (
                    <div style={{ marginBottom: 20 }}>
                      <span style={itemDetailSectionLabel}>Milk</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {milkOptionsVisible.map((opt) => (
                          <button
                            key={opt.name}
                            type="button"
                            disabled={formLocked}
                            onClick={() => setMilk(opt.name)}
                            style={{
                              padding: '9px 16px',
                              borderRadius: 100,
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              ...(milk === opt.name
                                ? itemDetailActiveOption
                                : itemDetailInactiveOption),
                            }}
                          >
                            {opt.name}
                            {opt.delta > 0 && (
                              <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>
                                +{(opt.delta / 100).toFixed(2)}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Syrup picker (accordion; tap selected chip again to clear) */}
                  {showDrinkUi && syrupOptions.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <button
                        type="button"
                        disabled={formLocked}
                        onClick={() => setSyrupAccordionOpen((o) => !o)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '10px 4px',
                          marginBottom: syrupAccordionOpen ? 10 : 0,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        aria-expanded={syrupAccordionOpen}
                      >
                        <span style={{ ...itemDetailSectionLabel, marginBottom: 0 }}>Syrup</span>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                        >
                          <span
                            style={{
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                              fontSize: 12,
                              fontWeight: 600,
                              color: 'rgba(26,46,26,0.55)',
                              maxWidth: 160,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {syrup ? syrup.replace(/\s*syrup\s*/i, '').trim() : 'None selected'}
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="rgba(26,46,26,0.45)"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              transform: syrupAccordionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              flexShrink: 0,
                            }}
                            aria-hidden
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {syrupAccordionOpen && (
                          <motion.div
                            key="syrup-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                paddingBottom: 4,
                              }}
                            >
                              {syrupOptions.map((opt) => {
                                const colors = getSyrupChipColors(opt.name);
                                const isActive = syrup === opt.name;
                                return (
                                  <button
                                    key={opt.name}
                                    type="button"
                                    disabled={formLocked}
                                    onClick={() =>
                                      setSyrup((cur) => (cur === opt.name ? null : opt.name))
                                    }
                                    style={{
                                      padding: '9px 16px',
                                      borderRadius: 100,
                                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                                      fontSize: 13,
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      border: isActive ? 'none' : '1.5px solid #d4c0a0',
                                      background: isActive ? colors.bg : 'rgba(240,230,208,0.6)',
                                      color: isActive ? colors.text : '#6a5a48',
                                    }}
                                  >
                                    {opt.name.replace(/\s*syrup\s*/i, '').trim()}
                                    {opt.delta > 0 && (
                                      <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>
                                        +{(opt.delta / 100).toFixed(2)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Alterations */}
                  {showDrinkUi && alterationOptions.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <span style={itemDetailSectionLabel}>Alterations</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {alterationOptions.map((opt) => {
                          const isActive = alterations.includes(opt.name);
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              disabled={formLocked}
                              onClick={() => toggleAlteration(opt.name)}
                              style={{
                                padding: '9px 16px',
                                borderRadius: 100,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                ...(isActive ? itemDetailActiveOption : itemDetailInactiveOption),
                              }}
                            >
                              {opt.name}
                              {opt.delta > 0 && (
                                <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>
                                  +{(opt.delta / 100).toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Note for this item */}
                  <div style={{ marginBottom: 20 }}>
                    <span style={itemDetailSectionLabel}>Add a note</span>
                    <textarea
                      value={customerNote}
                      readOnly={formLocked}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder=""
                      rows={2}
                      className="focus:outline-none"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '8px 14px',
                        borderRadius: 14,
                        border: '1.5px solid #e0d0b0',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        resize: 'none',
                        color: '#1a2e1a',
                        background: 'rgba(255,255,255,0.5)',
                      }}
                    />
                  </div>

                  {/* Quantity */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <span style={itemDetailSectionLabel}>Quantity</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button
                        type="button"
                        disabled={formLocked}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(26,46,26,0.08)',
                          border: '1.5px solid #d4c0a0',
                          color: '#1a2e1a',
                          fontSize: 18,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          fontFamily: 'Fraunces, Georgia, serif',
                          fontSize: 20,
                          fontWeight: 700,
                          color: '#1a2e1a',
                          width: 24,
                          textAlign: 'center',
                        }}
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        disabled={formLocked}
                        onClick={() => setQuantity((q) => q + 1)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(26,46,26,0.08)',
                          border: '1.5px solid #d4c0a0',
                          color: '#1a2e1a',
                          fontSize: 18,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {addDisabled && !orderModifyLocked && (
                    <p
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        color: 'rgba(26,46,26,0.55)',
                        textAlign: 'center',
                        marginBottom: 0,
                      }}
                    >
                      One moment — loading your order…
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: '12px 20px calc(12px + env(safe-area-inset-bottom, 0px))',
                  background: '#f0e6d0',
                  borderTop: '1px solid rgba(26,46,26,0.1)',
                  boxShadow: '0 -8px 28px rgba(0,0,0,0.08)',
                }}
              >
                <motion.button
                  type="button"
                  whileTap={
                    lockedLineEdit || addDisabled || orderModifyLocked ? {} : { scale: 0.97 }
                  }
                  onClick={() => {
                    if (lockedLineEdit) {
                      onClose();
                      return;
                    }
                    handleAdd();
                  }}
                  disabled={!lockedLineEdit && (addDisabled || orderModifyLocked)}
                  style={{
                    width: '100%',
                    background:
                      !lockedLineEdit && (addDisabled || orderModifyLocked)
                        ? 'rgba(26,46,26,0.12)'
                        : CHECKOUT_PRIMARY_GRADIENT,
                    color:
                      !lockedLineEdit && (addDisabled || orderModifyLocked)
                        ? 'rgba(26,46,26,0.35)'
                        : CHECKOUT_PRIMARY_TEXT,
                    borderRadius: 22,
                    padding: '18px 24px',
                    border: 'none',
                    cursor:
                      !lockedLineEdit && (addDisabled || orderModifyLocked)
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow:
                      !lockedLineEdit && (addDisabled || orderModifyLocked)
                        ? 'none'
                        : CHECKOUT_PRIMARY_SHADOW,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {lockedLineEdit
                      ? 'Close'
                      : addDisabled
                        ? 'Please wait…'
                        : orderModifyLocked
                          ? 'Too close to pickup'
                          : isEdit
                            ? 'Save changes'
                            : 'Add to order'}
                  </span>
                  {!lockedLineEdit ? (
                    <span
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      £{(totalPrice / 100).toFixed(2)}
                    </span>
                  ) : null}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
