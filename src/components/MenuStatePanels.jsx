export function MenuLoadingPanel() {
  return (
    <div className="menu-state-panel" style={{ gap: 12 }}>
      <svg
        className="w-8 h-8 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: '#6a5a48', width: 32, height: 32 }}
      >
        <circle
          style={{ opacity: 0.25 }}
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          style={{ opacity: 0.75 }}
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <p className="menu-state-subtitle" style={{ fontSize: 14 }}>
        Loading menu…
      </p>
    </div>
  );
}

export function MenuErrorPanel() {
  return (
    <div className="menu-state-panel">
      <span style={{ fontSize: 48, marginBottom: 12 }}>😔</span>
      <p className="menu-state-title" style={{ marginBottom: 4 }}>
        Couldn&apos;t load the menu
      </p>
      <p className="menu-state-subtitle">Make sure the server is running</p>
    </div>
  );
}

export function MenuEmptyPanel() {
  return (
    <div className="menu-state-panel">
      <span style={{ fontSize: 48, marginBottom: 12 }}>🫙</span>
      <p className="menu-state-title">Nothing here yet</p>
    </div>
  );
}
