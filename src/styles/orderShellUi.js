/** Shared inline style fragments for order flow shell (menu header, banners, FAB). */

export const orderShellPageBg = { display: 'flex', flexDirection: 'column', background: '#f0e6d0' };

export const orderShellScrollArea = { WebkitOverflowScrolling: 'touch' };

export const menuHeroOuter = {
  background: 'linear-gradient(155deg, #0e1c0e 0%, #1a2e1a 55%, #223828 100%)',
  position: 'relative',
  padding: '10px 0 14px',
  paddingTop: 'calc(10px + env(safe-area-inset-top, 0px))',
  overflow: 'hidden',
};

export const menuHeroGrain = {
  position: 'absolute',
  inset: 0,
  backgroundRepeat: 'repeat',
  opacity: 1,
  pointerEvents: 'none',
};

export const menuHeroRow = { position: 'relative', display: 'flex', alignItems: 'center', gap: 12 };

export const menuBackButton = {
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
};

export const menuTitleBlock = { flex: 1, minWidth: 0 };

export const menuTitle = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: 28,
  fontWeight: 800,
  color: '#f0e6d0',
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
  margin: 0,
};

export const menuSubtitle = {
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 12,
  color: 'rgba(240,230,208,0.55)',
  marginTop: 4,
  marginBottom: 0,
};

export const inProgressBanner = {
  padding: '10px 0',
  background: 'linear-gradient(128deg, #c8902a 0%, #d4a030 55%, #debc4a 100%)',
  borderBottom: '1px solid rgba(18,32,18,0.12)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};

export const inProgressText = {
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
};

export const inProgressCartBtn = {
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
};

/** Outer strip: full width, centers the FAB. Inner child sets max width. */
export const checkoutFabWrap = {
  position: 'absolute',
  bottom: 12,
  left: 0,
  right: 0,
  zIndex: 30,
  display: 'flex',
  justifyContent: 'center',
  paddingLeft: 16,
  paddingRight: 16,
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  pointerEvents: 'none',
};

export const checkoutFabInner = {
  width: '100%',
  maxWidth: 'var(--app-content-max)',
  pointerEvents: 'auto',
};
