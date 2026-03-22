import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MILK_OPTIONS, SIZE_OPTIONS, SYRUP_OPTIONS, getSyrupChipColors } from '../data/mock';

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

export default function ItemDetailSheet({ item, onClose, onAddToCart, milkOptions = MILK_OPTIONS, sizeOptions = SIZE_OPTIONS, syrupOptions = SYRUP_OPTIONS, alterationOptions = [] }) {
  const [size, setSize] = useState('Regular');
  const [milk, setMilk] = useState('Full Fat');
  const [syrup, setSyrup] = useState(null);
  const [alterations, setAlterations] = useState([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (item) {
      setSize('Regular');
      setMilk(milkOptions[0]?.name ?? 'Full Fat');
      setSyrup(null);
      setAlterations([]);
      setQuantity(1);
    }
  }, [item?.catalogObjectId]);

  const toggleAlteration = (name) => {
    setAlterations((prev) => prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]);
  };

  const sizeDelta = sizeOptions.find((s) => s.name === size)?.delta ?? 0;
  const milkDelta = milkOptions.find((m) => m.name === milk)?.delta ?? 0;
  const syrupDelta = syrup ? (syrupOptions.find((s) => s.name === syrup)?.delta ?? 0) : 0;
  const alterationsDelta = alterations.reduce((sum, name) => sum + (alterationOptions.find((a) => a.name === name)?.delta ?? 0), 0);
  const unitPrice = item ? (item.price + sizeDelta + milkDelta + syrupDelta + alterationsDelta) : 0;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (!item) return;
    const cartId = `${item.catalogObjectId}|${size}|${milk}|${syrup ?? 'none'}|${alterations.join(',')}|${Date.now()}`;
    onAddToCart({
      cartId,
      catalogObjectId: item.catalogObjectId,
      name: item.name,
      emoji: item.emoji,
      category: item.category,
      size,
      milk,
      syrup,
      alterations,
      quantity,
      totalPrice: unitPrice,
    });
    onClose();
  };

  const isCoffee = item?.showCoffeeOptions ?? false;

  const sectionLabel = {
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'rgba(26,46,26,0.45)',
    marginBottom: 10,
    display: 'block',
  };

  const activeOption = {
    background: '#1a2e1a',
    color: '#f0e6d0',
    border: 'none',
  };

  const inactiveOption = {
    background: 'rgba(240,230,208,0.6)',
    border: '1.5px solid #d4c0a0',
    color: '#6a5a48',
  };

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
              maxHeight: '85vh',
              overflowY: 'auto',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Dark green hero header */}
            <div style={{
              background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              {/* Grain */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: GRAIN,
                backgroundRepeat: 'repeat',
                pointerEvents: 'none',
              }} />
              {/* Drag handle */}
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, position: 'relative' }}>
                <div style={{ width: 40, height: 4, background: 'rgba(240,230,208,0.3)', borderRadius: 100 }} />
              </div>
              {/* Hero content */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px 22px', position: 'relative' }}>
                <span style={{ fontSize: 56, lineHeight: 1 }}>{item.emoji}</span>
                <div>
                  <h2 style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#f0e6d0',
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}>
                    {item.name}
                  </h2>
                  <p style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#c8902a',
                    marginTop: 6,
                    margin: '6px 0 0',
                  }}>
                    £{(unitPrice / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 20px 32px', overflowY: 'auto' }}>

              {/* Size picker */}
              {isCoffee && (
                <div style={{ marginBottom: 20 }}>
                  <span style={sectionLabel}>Size</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sizeOptions.map((opt) => (
                      <button
                        key={opt.name}
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
                          ...(size === opt.name ? activeOption : inactiveOption),
                        }}
                      >
                        {opt.name}
                        {opt.delta !== 0 && (
                          <span style={{ display: 'block', fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.7 }}>
                            {opt.delta > 0 ? `+${(opt.delta / 100).toFixed(2)}` : `-${(Math.abs(opt.delta) / 100).toFixed(2)}`}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Milk picker */}
              {isCoffee && (
                <div style={{ marginBottom: 20 }}>
                  <span style={sectionLabel}>Milk</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {milkOptions.map((opt) => (
                      <button
                        key={opt.name}
                        onClick={() => setMilk(opt.name)}
                        style={{
                          padding: '9px 16px',
                          borderRadius: 100,
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          ...(milk === opt.name ? activeOption : inactiveOption),
                        }}
                      >
                        {opt.name}
                        {opt.delta > 0 && (
                          <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>+{(opt.delta / 100).toFixed(2)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Syrup picker */}
              {isCoffee && syrupOptions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <span style={sectionLabel}>Syrup</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      onClick={() => setSyrup(null)}
                      style={{
                        padding: '9px 16px',
                        borderRadius: 100,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        ...(syrup === null ? activeOption : inactiveOption),
                      }}
                    >
                      None
                    </button>
                    {syrupOptions.map((opt) => {
                      const colors = getSyrupChipColors(opt.name);
                      const isActive = syrup === opt.name;
                      return (
                        <button
                          key={opt.name}
                          onClick={() => setSyrup(opt.name)}
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
                            <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>+{(opt.delta / 100).toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alterations */}
              {isCoffee && alterationOptions.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <span style={sectionLabel}>Alterations</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {alterationOptions.map((opt) => {
                      const isActive = alterations.includes(opt.name);
                      return (
                        <button
                          key={opt.name}
                          onClick={() => toggleAlteration(opt.name)}
                          style={{
                            padding: '9px 16px',
                            borderRadius: 100,
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            ...(isActive ? activeOption : inactiveOption),
                          }}
                        >
                          {opt.name}
                          {opt.delta > 0 && (
                            <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.7 }}>+{(opt.delta / 100).toFixed(2)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={sectionLabel}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button
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
                  <span style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1a2e1a',
                    width: 24,
                    textAlign: 'center',
                  }}>
                    {quantity}
                  </span>
                  <button
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

              {/* Add to order */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                style={{
                  width: '100%',
                  background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
                  color: '#122012',
                  borderRadius: 22,
                  padding: '18px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 20px rgba(200,144,42,0.35)',
                }}
              >
                <span style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Add to order
                </span>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700 }}>
                  £{(totalPrice / 100).toFixed(2)}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
