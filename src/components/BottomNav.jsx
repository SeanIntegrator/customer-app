import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { navBasketBadgeCount } from '../lib/basketUnpaidQty';

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l9-9 9 9M4.5 10.5V20a1 1 0 001 1h4.5v-5h4v5H18a1 1 0 001-1v-9.5"
        />
      </svg>
    ),
  },
  {
    to: '/order',
    label: 'Order',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM6 8v11h12V8H6z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 15h4" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Me',
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 12a5 5 0 100-10 5 5 0 000 10zM3.5 21a8.5 8.5 0 0117 0"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const { items, editOrderId, addingToOrderId, suppressNavBasketForPaidGoldCard } = useCart();
  const orderBadgeCount = navBasketBadgeCount(
    items,
    editOrderId,
    addingToOrderId,
    suppressNavBasketForPaidGoldCard
  );

  return (
    <nav className="flex-shrink-0 bg-bark border-t border-bark/20 safe-bottom">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = location.pathname === tab.to;
          const iconNode =
            tab.to === '/order' ? (
              <span className="relative inline-flex">
                {tab.icon(active)}
                {orderBadgeCount > 0 ? (
                  <span
                    className="absolute -top-1 -right-2 min-w-[17px] h-[17px] px-0.5 rounded-full bg-cream text-clay text-[9px] font-sans font-bold flex items-center justify-center leading-none shadow-sm ring-1 ring-bark/20"
                    aria-label={`${orderBadgeCount} items in basket`}
                  >
                    {orderBadgeCount > 99 ? '99+' : orderBadgeCount}
                  </span>
                ) : null}
              </span>
            ) : (
              tab.icon(active)
            );
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 relative"
            >
              <motion.div
                animate={{ scale: active ? 1 : 0.9, opacity: active ? 1 : 0.55 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className={`flex flex-col items-center gap-1 ${active ? 'text-cream' : 'text-cream/60'}`}
              >
                {iconNode}
                <span
                  className={`text-[10px] font-sans font-semibold tracking-wide uppercase ${active ? 'text-cream' : 'text-cream/60'}`}
                >
                  {tab.label}
                </span>
              </motion.div>

              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sage rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
