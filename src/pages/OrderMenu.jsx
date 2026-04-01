import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import MenuItem from '../components/MenuItem';
import { MenuLoadingPanel, MenuErrorPanel, MenuEmptyPanel } from '../components/MenuStatePanels';

export default function OrderMenu() {
  const { categorySlug: rawSlug } = useParams();
  const navigate = useNavigate();
  const categorySlug = rawSlug ? decodeURIComponent(rawSlug) : '';
  const {
    catalogItems,
    menuCategories,
    loading,
    error,
    setSelectedItem,
    addToMenuBlocked,
    qtyByCatalogId,
    editOrderId,
    addingToOrderId,
  } = useOutletContext();

  const countsBySlug = useMemo(() => {
    const acc = {};
    for (const cat of menuCategories) {
      acc[cat.slug] = catalogItems.filter((i) => i.category === cat.slug).length;
    }
    return acc;
  }, [menuCategories, catalogItems]);

  const slugSet = useMemo(() => new Set(menuCategories.map((c) => c.slug)), [menuCategories]);

  useEffect(() => {
    if (loading) return;
    if (menuCategories.length === 0) return;
    if (!categorySlug || !slugSet.has(categorySlug)) {
      navigate('/order', { replace: true });
    }
  }, [loading, menuCategories.length, categorySlug, slugSet, navigate]);

  const filtered = useMemo(
    () => catalogItems.filter((i) => i.category === categorySlug),
    [catalogItems, categorySlug]
  );

  const visibleCategories = useMemo(
    () => menuCategories.filter((c) => countsBySlug[c.slug] > 0),
    [menuCategories, countsBySlug]
  );

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ padding: '10px 16px', background: '#f0e6d0' }}
      >
        {visibleCategories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => navigate(`/order/menu/${encodeURIComponent(cat.slug)}`)}
            className={`menu-chip ${categorySlug === cat.slug ? 'menu-chip--active' : 'menu-chip--idle'}`}
            style={{
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {cat.label}
            {countsBySlug[cat.slug] > 0 && (
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6 }}>{countsBySlug[cat.slug]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="scrollbar-hide" style={{ padding: '0 16px 96px' }}>
        {loading && (
          <MenuLoadingPanel />
        )}

        {error && !loading && <MenuErrorPanel />}

        {!loading && !error && slugSet.has(categorySlug) && filtered.length === 0 && <MenuEmptyPanel />}

        {!loading && !error && filtered.length > 0 && (
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
                    orderEditMode={editOrderId != null || addingToOrderId != null}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </>
  );
}
