import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { MenuLoadingPanel, MenuErrorPanel, MenuEmptyPanel } from '../components/MenuStatePanels';

export default function OrderHub() {
  const { catalogItems, menuCategories, loading, error, navigate } = useOutletContext();

  const countsBySlug = useMemo(() => {
    const acc = {};
    for (const cat of menuCategories) {
      acc[cat.slug] = catalogItems.filter((i) => i.category === cat.slug).length;
    }
    return acc;
  }, [menuCategories, catalogItems]);

  const visibleCategories = useMemo(
    () => menuCategories.filter((c) => countsBySlug[c.slug] > 0),
    [menuCategories, countsBySlug]
  );

  return (
    <div className="scrollbar-hide" style={{ padding: '16px 16px 96px' }}>
      {loading && (
        <MenuLoadingPanel />
      )}

      {error && !loading && (
        <MenuErrorPanel />
      )}

      {!loading && !error && visibleCategories.length === 0 && (
        <MenuEmptyPanel />
      )}

      {!loading && !error && visibleCategories.length > 0 && (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {visibleCategories.map((cat, i) => (
            <motion.button
              key={cat.slug}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 400, damping: 30 }}
              onClick={() => navigate(`/order/menu/${encodeURIComponent(cat.slug)}`)}
              style={{
                textAlign: 'left',
                padding: '18px 16px',
                borderRadius: 20,
                border: '1.5px solid #d4c0a0',
                background: 'rgba(240,230,208,0.75)',
                cursor: 'pointer',
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#1a2e1a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                {cat.label}
              </span>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#6a5a48' }}>
                {countsBySlug[cat.slug]} items
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
