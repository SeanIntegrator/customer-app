import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';

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

      {!loading && !error && visibleCategories.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
          <span style={{ fontSize: 48, marginBottom: 12 }}>🫙</span>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18, fontWeight: 700, color: '#1a2e1a' }}>Nothing here yet</p>
        </div>
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
