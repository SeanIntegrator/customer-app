# Customer App Recovery Smoke Checklist

Use this checklist before and after each refactor batch.

## Environment

- Customer app boot: `npm run dev` in `customer-app`
- API boot: `npm run dev` in `cafe-orders`
- Browser starts with clean storage (no stale token noise)

## Critical Flows

### 1) Auth session lifecycle

- Sign in with Google succeeds and user profile appears.
- Refresh page keeps session (no forced relogin).
- Logout clears user state and protected actions require login.

### 2) Browse and basket

- Home renders without console errors.
- Navigate to menu, open item sheet, add item, edit quantity, remove item.
- Modifiers (size/milk/syrup/alterations) persist correctly in basket line details.

### 3) Initial checkout

- Start checkout from a non-empty basket.
- Redirect to Stripe Checkout succeeds.
- Return to `/order/success` with `session_id`.
- Polling resolves to a created order and user sees order success state.

### 4) Incremental add-to-order checkout

- From active Stripe-paid order, enter add-to-order flow.
- Add extra items and complete incremental checkout.
- Return flow resolves and merged order reflects additional lines.

### 5) Edit/cancel order

- Open edit flow for an eligible pending/confirmed order.
- Save update path succeeds (line item and pickup/allergen changes).
- Cancel path issues refund and order leaves active card state.

### 6) Realtime updates

- `customerOrderCompleted` updates relevant UI states once.
- `orderCancelled` clears in-progress/active state correctly.
- No duplicate side effects from duplicate listeners.

### 7) Feedback flow

- Post-checkout feedback modal opens when matching order completes.
- Submitting >=4 stars opens Google prompt.
- Submitting <=3 stars closes flow and shows apology toast.

## Regression Guard Notes

- Money-path changes require manual run of sections 3, 4, and 5.
- Context/state changes require manual run of sections 2 and 6.
- UI/styling migrations require manual run of section 2 and visual check of Home, Order, Profile.
