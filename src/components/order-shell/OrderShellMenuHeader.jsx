import { PAPER_GRAIN_BACKGROUND } from '../../lib/pickup';
import {
  menuHeroOuter,
  menuHeroGrain,
  menuHeroRow,
  menuBackButton,
  menuTitleBlock,
  menuTitle,
  menuSubtitle,
} from '../../styles/orderShellUi';

export default function OrderShellMenuHeader({ showInProgressBanner, onBack }) {
  return (
    <div style={menuHeroOuter}>
      <div
        style={{
          ...menuHeroGrain,
          backgroundImage: PAPER_GRAIN_BACKGROUND,
        }}
      />
      <div style={menuHeroRow}>
        <button type="button" onClick={onBack} aria-label="Back" style={menuBackButton}>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div style={menuTitleBlock}>
          <h1 style={menuTitle}>Menu</h1>
          {!showInProgressBanner && <p style={menuSubtitle}>Pickup in ~10 minutes</p>}
        </div>
      </div>
    </div>
  );
}
