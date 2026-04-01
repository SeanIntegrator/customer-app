# Architecture Debt Register

This register captures high-risk seams to prioritize while refactoring.

## Ownership and High-Risk Modules

- `src/components/CartDrawer.jsx`
  - Current scope: cart UI, checkout orchestration, Stripe redirect, reward UX, in-progress order edits.
  - Debt: too many responsibilities, high blast radius.

- `src/context/CartContext.jsx`
  - Current scope: cart lines, edit/add mode, KDS completion bridge, post-checkout feedback trigger.
  - Debt: mixed domains and coupled side effects.

- `src/pages/OrderShell.jsx`
  - Current scope: route shell orchestration, fetch/load order state, blocker, cart drawer wiring.
  - Debt: orchestration + rendering in one file.

- `src/pages/Profile.jsx`
  - Current scope: profile, history, events, feedback UX.
  - Debt: oversized page component.

- `src/components/EditOrderModal.jsx`
  - Current scope: order read/update orchestration + UI.
  - Debt: heavy modal with mixed concerns.

## API Contract Seams

- `src/lib/api.js` is the single integration boundary and should become the only place with envelope compatibility logic.
- Mixed response envelope in backend (`ok` vs `success`) creates duplicated call-site checks.

## Realtime Seams

- Socket event listeners currently duplicated across Home and PostOrderFeedbackLayer for overlapping events.
- Needs a single subscriber pipeline translating socket payloads into app-domain actions.

## Styling Seams

- Extensive inline style usage in page-level files (notably Home/Order shell paths) increases duplication and blocks theme consistency.
- Shared visual tokens/primitives are inconsistent across features.
