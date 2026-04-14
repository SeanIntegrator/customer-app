import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import useCatalog from '../hooks/useCatalog';
import { useOrderFlowGuard } from '../hooks/useOrderFlowGuard';
import { fetchCustomerOrders, fetchCustomerOrder } from '../lib/api';
import { orderReadyInOneLine, isPickupTooCloseForOrderModify } from '../lib/pickup';
import ItemDetailSheet from '../components/ItemDetailSheet';
import CartDrawer from '../components/CartDrawer';
import Toast from '../components/Toast';
import OrderShellMenuHeader from '../components/order-shell/OrderShellMenuHeader';
import OrderShellInProgressBanner from '../components/order-shell/OrderShellInProgressBanner';
import OrderShellCheckoutFab from '../components/order-shell/OrderShellCheckoutFab';
import OrderShellLeaveBasketModal from '../components/order-shell/OrderShellLeaveBasketModal';
import { orderShellPageBg, orderShellScrollArea } from '../styles/orderShellUi';

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

  const addToMenuBlocked = (authLoading && hasAuthToken) || (!!user && !serverActiveOrderResolved);

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
        showDrinkModifiers:
          cartEditLine.showDrinkModifiers ?? cartEditLine.showCoffeeOptions ?? false,
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
      style={orderShellPageBg}
    >
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide" style={orderShellScrollArea}>
        <OrderShellMenuHeader showInProgressBanner={showInProgressBanner} onBack={goBack} />

        {showInProgressBanner && (
          <OrderShellInProgressBanner
            pickupLine={orderReadyInOneLine(inProgressPickupIso)}
            onOpenCart={() => setCartOpen(true)}
          />
        )}

        <div className="app-content-max w-full">
          <Outlet context={outletContext} />
        </div>
      </div>

      <AnimatePresence>
        {totalItems > 0 && (
          <OrderShellCheckoutFab
            totalItems={totalItems}
            subtotalPence={subtotal}
            cartBounce={cartBounce}
            addingToOrderId={addingToOrderId}
            editOrderId={editOrderId}
            onOpenCart={() => setCartOpen(true)}
          />
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
          <OrderShellLeaveBasketModal
            key="leave-basket-layer"
            onStay={() => blocker.reset()}
            onLeaveAndClear={() => {
              clearCart();
              clearEditMode();
              clearAddingToOrder();
              blocker.proceed();
            }}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
