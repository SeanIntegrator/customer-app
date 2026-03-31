import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import MenuItem from '../components/MenuItem';

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
              ...(categorySlug === cat.slug
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
            {countsBySlug[cat.slug] > 0 && (
              <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6 }}>{countsBySlug[cat.slug]}</span>
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

        {!loading && !error && slugSet.has(categorySlug) && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>🫙</span>
            <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e1a' }}>Nothing here yet</p>
          </div>
        )}

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
