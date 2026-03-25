import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useCatalog from '../hooks/useCatalog';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import { PAPER_GRAIN_BACKGROUND, orderReadyInOneLine } from '../lib/pickup';
import MenuItem from '../components/MenuItem';
import ItemDetailSheet from '../components/ItemDetailSheet';
import CartDrawer from '../components/CartDrawer';

export default function Order() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, authFetch } = useAuth();
  const { items: catalogItems, categories, milkOptions, sizeOptions, syrupOptions, alterationOptions, loading, error } = useCatalog();
  const { addItem, totalItems, subtotal, editOrderId, loadCartFromOrderEdit, items: cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [serverActiveOrderResolved, setServerActiveOrderResolved] = useState(false);
  const [inProgressPickupIso, setInProgressPickupIso] = useState(null);

  const hasAuthToken =
    typeof sessionStorage !== 'undefined' && !!sessionStorage.getItem('auth_token');

  const qtyByCatalogId = useMemo(() => {
    const m = new Map();
    for (const line of cartItems) {
      const cid = line.catalogObjectId;
      if (!cid) continue;
      const fromOrder =
        editOrderId != null &&
        (line.fromExistingOrder === true || String(line.cartId || '').startsWith('edit-'));
      const cur = m.get(cid) || { basket: 0, ordered: 0 };
      if (fromOrder) cur.ordered += line.quantity;
      else cur.basket += line.quantity;
      m.set(cid, cur);
    }
    return m;
  }, [cartItems, editOrderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setServerActiveOrderResolved(true);
      setInProgressPickupIso(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setServerActiveOrderResolved(false);
      try {
        if (editOrderId != null) {
          const o = await fetchCustomerOrder(authFetch, editOrderId);
          if (!cancelled) setInProgressPickupIso(o?.pickup_time ?? null);
        } else {
          const list = await fetchCustomerOrders(authFetch, { status: 'pending,confirmed' });
          if (cancelled) return;
          if (list[0]) {
            setInProgressPickupIso(list[0].pickup_time ?? null);
            loadCartFromOrderEdit(list[0]);
          } else {
            setInProgressPickupIso(null);
          }
        }
      } catch {
        if (!cancelled) setInProgressPickupIso(null);
      } finally {
        if (!cancelled) setServerActiveOrderResolved(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, editOrderId, authFetch, loadCartFromOrderEdit]);

  const addToMenuBlocked =
    (authLoading && hasAuthToken) || (!!user && !serverActiveOrderResolved);

  useEffect(() => {
    if (location.state?.openCart) {
      setCartOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state?.openCart]);

  const filtered =
    activeCategory === 'all'
      ? catalogItems
      : catalogItems.filter((i) => i.category === activeCategory);

  const counts = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.id === 'all' ? catalogItems.length : catalogItems.filter((i) => i.category === cat.id).length;
    return acc;
  }, {});

  const handleAddToCart = (item) => {
    addItem(item);
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);
  };

  const showInProgressBanner = editOrderId != null;

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full relative"
      style={{ display: 'flex', flexDirection: 'column', background: '#f0e6d0' }}
    >
      <div
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Scrolls away with content — compact green header */}
        <div
          style={{
            background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
            position: 'relative',
            padding: '10px 16px 14px',
            paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: PAPER_GRAIN_BACKGROUND,
              backgroundRepeat: 'repeat',
              opacity: 1,
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1px solid rgba(240,230,208,0.2)',
                background: 'rgba(0,0,0,0.15)',
                color: '#f0e6d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#f0e6d0',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Menu
              </h1>
              {!showInProgressBanner && (
                <p
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 12,
                    color: 'rgba(240,230,208,0.55)',
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  Pickup in ~10 minutes
                </p>
              )}
            </div>
          </div>
        </div>

        {showInProgressBanner && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 16px',
              background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
              borderBottom: '1px solid rgba(18,32,18,0.12)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}
          >
            <p
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#122012',
                margin: 0,
                lineHeight: 1.25,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
            >
              {orderReadyInOneLine(inProgressPickupIso)}
            </p>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              style={{
                flexShrink: 0,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 700,
                color: '#f0e6d0',
                background: '#1a2e1a',
                border: 'none',
                borderRadius: 100,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              Cart
            </button>
          </div>
        )}

        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ padding: '10px 16px', background: '#f0e6d0' }}
        >
          {categories.filter((c) => counts[c.id] > 0 || c.id === 'all').map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: 100,
                fontSize: 12,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                border: 'none',
                ...(activeCategory === cat.id
                  ? {
                      background: '#1a2e1a',
                      color: '#f0e6d0',
                    }
                  : {
                      background: 'rgba(240,230,208,0.6)',
                      border: '1.5px solid #d4c0a0',
                      color: '#6a5a48',
                    }),
              }}
            >
              {cat.label}
              {counts[cat.id] > 0 && (
                <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6 }}>{counts[cat.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="scrollbar-hide" style={{ padding: '0 16px 96px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 12 }}>
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: '#6a5a48', width: 32, height: 32 }}>
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, color: '#6a5a48' }}>Loading menu…</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>😔</span>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e1a', marginBottom: 4 }}>Couldn&apos;t load the menu</p>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#6a5a48' }}>Make sure the server is running</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 48, marginBottom: 12 }}>🫙</span>
              <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e1a' }}>Nothing here yet</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <motion.div layout style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4 }}>
              <AnimatePresence mode="popLayout">
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.catalogObjectId}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    <MenuItem
                      item={item}
                      onTap={setSelectedItem}
                      disabled={addToMenuBlocked}
                      basketQty={qtyByCatalogId.get(item.catalogObjectId)?.basket ?? 0}
                      orderedQty={qtyByCatalogId.get(item.catalogObjectId)?.ordered ?? 0}
                      orderEditMode={editOrderId != null}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{
              position: 'absolute',
              bottom: 12,
              left: 16,
              right: 16,
              zIndex: 30,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <motion.button
              type="button"
              animate={cartBounce ? { scale: [1, 1.05, 0.98, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              onClick={() => setCartOpen(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
                color: '#122012',
                borderRadius: 22,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: 'none',
                cursor: 'pointer',
                boxShadow: cartBounce ? '0 4px 24px rgba(200,144,42,0.5)' : '0 4px 20px rgba(200,144,42,0.38)',
                fontFamily: 'Fraunces, Georgia, serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    background: 'rgba(18,32,18,0.18)',
                    color: '#122012',
                    fontSize: 11,
                    fontWeight: 800,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {totalItems}
                </span>
                <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {editOrderId != null ? 'Update order' : 'View order'}
                </span>
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 15, fontWeight: 700 }}>
                £{(subtotal / 100).toFixed(2)}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <ItemDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={handleAddToCart}
        milkOptions={milkOptions}
        sizeOptions={sizeOptions}
        syrupOptions={syrupOptions}
        alterationOptions={alterationOptions}
        addDisabled={addToMenuBlocked}
      />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </motion.div>
  );
}
