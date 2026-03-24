import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useCatalog from '../hooks/useCatalog';
import { fetchCustomerOrders } from '../lib/api';
import MenuItem from '../components/MenuItem';
import ItemDetailSheet from '../components/ItemDetailSheet';
import CartDrawer from '../components/CartDrawer';

const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='280'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='280' height='280' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E\")";

export default function Order() {
  const location = useLocation();
  const { user, loading: authLoading, authFetch } = useAuth();
  const { items: catalogItems, categories, milkOptions, sizeOptions, syrupOptions, alterationOptions, loading, error } = useCatalog();
  const { addItem, totalItems, subtotal, editOrderId, loadCartFromOrderEdit, items: cartItems } = useCart();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [serverActiveOrderResolved, setServerActiveOrderResolved] = useState(false);

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
      return;
    }
    if (editOrderId != null) {
      setServerActiveOrderResolved(true);
      return;
    }
    setServerActiveOrderResolved(false);
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchCustomerOrders(authFetch, { status: 'pending,confirmed' });
        if (!cancelled && list[0]) {
          loadCartFromOrderEdit(list[0]);
        }
      } catch {
        /* ignore */
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full"
      style={{ display: 'flex', flexDirection: 'column', background: '#f0e6d0' }}
    >
      {/* Header — dark green band */}
      <div
        style={{
          background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
          position: 'relative',
          flexShrink: 0,
          padding: '48px 20px 20px',
          overflow: 'hidden',
        }}
      >
        {/* Grain overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: GRAIN,
            backgroundRepeat: 'repeat',
            opacity: 1,
            pointerEvents: 'none',
          }}
        />
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c8902a',
          marginBottom: 8,
          position: 'relative',
        }}>
          ✦ Clay &amp; Bean
        </p>
        <h1 style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontSize: 42,
          fontWeight: 800,
          color: '#f0e6d0',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: 0,
          position: 'relative',
        }}>
          Menu.
        </h1>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13,
          color: 'rgba(240,230,208,0.55)',
          marginTop: 6,
          position: 'relative',
        }}>
          Pickup in ~10 minutes
        </p>
      </div>

      {showInProgressBanner && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 20px',
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
              lineHeight: 1.35,
            }}
          >
            You have an order in progress — add items or save changes from your cart.
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
            View cart
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ padding: '14px 20px', flexShrink: 0 }}
      >
        {categories.filter((c) => counts[c.id] > 0 || c.id === 'all').map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              flexShrink: 0,
              padding: '8px 18px',
              borderRadius: 100,
              fontSize: 13,
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
              <span style={{
                marginLeft: 5,
                fontSize: 10,
                opacity: 0.6,
              }}>
                {counts[cat.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ padding: '0 20px 120px' }}
      >
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
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e1a', marginBottom: 4 }}>Couldn't load the menu</p>
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
          <motion.div
            layout
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
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

      {/* Floating cart button */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{ position: 'absolute', bottom: 12, left: 18, right: 18, zIndex: 30 }}
          >
            <motion.button
              animate={cartBounce ? { scale: [1, 1.05, 0.98, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              onClick={() => setCartOpen(true)}
              style={{
                width: '100%',
                background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
                color: '#122012',
                borderRadius: 22,
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: 'none',
                cursor: 'pointer',
                boxShadow: cartBounce
                  ? '0 4px 24px rgba(200,144,42,0.5)'
                  : '0 4px 20px rgba(200,144,42,0.38)',
                fontFamily: 'Fraunces, Georgia, serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
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
                }}>
                  {totalItems}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
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

      {/* Item detail sheet */}
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

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </motion.div>
  );
}
