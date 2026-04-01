import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useCatalog from '../hooks/useCatalog';
import { useOrderFlowGuard } from '../hooks/useOrderFlowGuard';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import { PAPER_GRAIN_BACKGROUND, orderReadyInOneLine, isPickupTooCloseForOrderModify } from '../lib/pickup';
import {
  CHECKOUT_PRIMARY_GRADIENT,
  CHECKOUT_PRIMARY_SHADOW,
  CHECKOUT_PRIMARY_TEXT,
} from '../lib/checkoutTheme';
import ItemDetailSheet from '../components/ItemDetailSheet';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';

export default function OrderShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading, authFetch, hasStoredToken } = useAuth();
  const {
    items: catalogItems,
    menuCategories,
    milkOptions,
    sizeOptions,
    syrupOptions,
    alterationOptions,
    loading,
    error,
  } = useCatalog();
  const {
    addItem,
    totalItems,
    subtotal,
    editOrderId,
    addingToOrderId,
    loadCartFromOrderEdit,
    items: cartItems,
    updateCartLine,
    clearCart,
    clearEditMode,
    clearAddingToOrder,
  } = useCart();
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartEditLine, setCartEditLine] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [serverActiveOrderResolved, setServerActiveOrderResolved] = useState(false);
  const [inProgressPickupIso, setInProgressPickupIso] = useState(null);
  const [basketToast, setBasketToast] = useState({ message: '', visible: false });
  const basketToastTimerRef = useRef(null);

  const { blocker, qtyByCatalogId } = useOrderFlowGuard({
    addingToOrderId,
    editOrderId,
    cartItems,
  });
  const hasAuthToken = hasStoredToken();

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
        } else if (addingToOrderId != null) {
          const o = await fetchCustomerOrder(authFetch, addingToOrderId);
          if (!cancelled) setInProgressPickupIso(o?.pickup_time ?? null);
        } else {
          const list = await fetchCustomerOrders(authFetch, { status: 'pending,confirmed' });
          if (cancelled) return;
          if (list[0]) {
            setInProgressPickupIso(list[0].pickup_time ?? null);
            await loadCartFromOrderEdit(list[0]);
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
  }, [authLoading, user, editOrderId, addingToOrderId, authFetch, loadCartFromOrderEdit]);

  const addToMenuBlocked =
    (authLoading && hasAuthToken) || (!!user && !serverActiveOrderResolved);

  useEffect(() => {
    if (location.state?.openCart) {
      setCartOpen(true);
      window.history.replaceState({}, '');
    }
  }, [location.state?.openCart]);

  const sheetItem = useMemo(() => {
    if (cartEditLine?.catalogObjectId) {
      const c = catalogItems.find((x) => x.catalogObjectId === cartEditLine.catalogObjectId);
      if (c) return c;
      return {
        catalogObjectId: cartEditLine.catalogObjectId,
        name: cartEditLine.name,
        emoji: cartEditLine.emoji,
        category: cartEditLine.category,
        price: cartEditLine.totalPrice,
        showDrinkModifiers: cartEditLine.showDrinkModifiers ?? cartEditLine.showCoffeeOptions ?? false,
      };
    }
    return selectedItem;
  }, [cartEditLine, selectedItem, catalogItems]);

  const handleAddToCart = (item) => {
    addItem(item);
    if (editOrderId != null || addingToOrderId != null) {
      const label = item.name || 'Item';
      if (basketToastTimerRef.current) window.clearTimeout(basketToastTimerRef.current);
      setBasketToast({ message: `${label} added to order`, visible: true });
      basketToastTimerRef.current = window.setTimeout(() => {
        setBasketToast((s) => ({ ...s, visible: false }));
        basketToastTimerRef.current = null;
      }, 3200);
    }
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);
  };

  const showInProgressBanner = editOrderId != null || addingToOrderId != null;

  const orderModifyLocked =
    showInProgressBanner && isPickupTooCloseForOrderModify(inProgressPickupIso);

  const goBack = () => {
    if (location.pathname.startsWith('/order/menu/')) {
      navigate('/order');
    } else {
      navigate('/');
    }
  };

  const outletContext = useMemo(
    () => ({
      catalogItems,
      menuCategories,
      loading,
      error,
      navigate,
      setSelectedItem,
      addToMenuBlocked,
      qtyByCatalogId,
      editOrderId,
      addingToOrderId,
    }),
    [
      catalogItems,
      menuCategories,
      loading,
      error,
      navigate,
      setSelectedItem,
      addToMenuBlocked,
      qtyByCatalogId,
      editOrderId,
      addingToOrderId,
    ]
  );

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
                color: '#1a2e1a',
                background: 'rgba(26,46,26,0.1)',
                border: '1.5px solid rgba(26,46,26,0.28)',
                borderRadius: 100,
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              Cart
            </button>
          </div>
        )}

        <Outlet context={outletContext} />
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
                background: CHECKOUT_PRIMARY_GRADIENT,
                color: CHECKOUT_PRIMARY_TEXT,
                borderRadius: 22,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: 'none',
                cursor: 'pointer',
                boxShadow: cartBounce ? '0 4px 24px rgba(200,144,42,0.5)' : CHECKOUT_PRIMARY_SHADOW,
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
                  {addingToOrderId != null ? 'Add-ons' : editOrderId != null ? 'Update order' : 'View order'}
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
        item={sheetItem}
        editCartLine={cartEditLine}
        onSaveCartLine={(line) => {
          updateCartLine(line.cartId, {
            name: line.name,
            emoji: line.emoji,
            category: line.category,
            showDrinkModifiers: line.showDrinkModifiers,
            size: line.size,
            milk: line.milk,
            syrup: line.syrup,
            alterations: line.alterations,
            quantity: line.quantity,
            totalPrice: line.totalPrice,
            customerNote: line.customerNote,
          });
          setCartEditLine(null);
          setCartOpen(true);
        }}
        onClose={() => {
          const wasEdit = cartEditLine != null;
          setCartEditLine(null);
          setSelectedItem(null);
          if (wasEdit) setCartOpen(true);
        }}
        onAddToCart={handleAddToCart}
        milkOptions={milkOptions}
        sizeOptions={sizeOptions}
        syrupOptions={syrupOptions}
        alterationOptions={alterationOptions}
        addDisabled={addToMenuBlocked && !cartEditLine}
        orderModifyLocked={orderModifyLocked}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        orderModifyLocked={orderModifyLocked}
        onEditLine={(line) => {
          setCartEditLine(line);
          setCartOpen(false);
        }}
      />

      <Toast
        message={basketToast.message}
        visible={basketToast.visible}
        bottomClassName="bottom-8"
      />

      <AnimatePresence>
        {blocker.state === 'blocked' ? (
          <motion.div
            key="leave-basket-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[280] flex items-start justify-center pt-[22vh] px-4"
            style={{ background: 'rgba(8,16,8,0.78)' }}
            onClick={() => blocker.reset()}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
              style={{ background: '#faf5eb', border: '1.5px solid rgba(26,46,26,0.12)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#1a2e1a',
                  margin: '0 0 12px',
                }}
              >
                Leave the menu?
              </h3>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 14,
                  color: 'rgba(26,46,26,0.6)',
                  margin: '0 0 20px',
                  lineHeight: 1.45,
                }}
              >
                Leaving this page will clear your edits to your basket.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => blocker.reset()}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: 16,
                    border: 'none',
                    background: CHECKOUT_PRIMARY_GRADIENT,
                    color: CHECKOUT_PRIMARY_TEXT,
                    fontFamily: 'Fraunces, Georgia, serif',
                    fontSize: 17,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: CHECKOUT_PRIMARY_SHADOW,
                  }}
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    clearEditMode();
                    clearAddingToOrder();
                    blocker.proceed();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: 16,
                    border: '1.5px solid rgba(26,46,26,0.2)',
                    background: 'transparent',
                    color: '#1a2e1a',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Leave and clear edits
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
