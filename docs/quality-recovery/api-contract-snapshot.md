# Customer App API Contract Snapshot

Snapshot source: `customer-app/src/lib/api.js` and current `cafe-orders/routes/*`.

## Envelope Normalization Target

Preferred response contract:

- Success: `{ ok: true, ...payload }`
- Failure: `{ ok: false, error: string, code?: string }`

Transitional compatibility accepted for existing calls:

- `success: true|false` (legacy feedback/auth patterns)
- fallback error fields: `reason`, missing payload keys

## Endpoints Used by Customer App

### Auth

- `GET /api/auth/me`
  - success: `{ user: object | null }`
- `POST /api/auth/google`
  - success: `{ token, user }`
- `POST /api/auth/logout`
  - success: `{ ok: true }`

### Catalog/Menu

- `GET /api/modifier-categories`
  - success: `{ ok: true, categories: [] }`
- `GET /api/catalog-items`
  - success: `{ ok: true, items: [] }`

### Stripe Checkout

- `POST /api/stripe/create-checkout-session`
  - body: `{ line_items, customer_name, pickup_minutes, allergens, apply_reward, notes }`
  - success: `{ ok: true, sessionId, url }`
- `POST /api/stripe/create-incremental-checkout`
  - body: `{ order_id, additional_line_items, apply_reward }`
  - success: `{ ok: true, sessionId, url, difference, original_total, new_total }`

### Customer Orders

- `GET /api/customer/orders?status=&days=`
  - success: `{ ok: true, orders: [] }`
- `GET /api/customer/orders/:id`
  - success: `{ ok: true, order }`
- `PATCH /api/customer/orders/:id`
  - success: `{ ok: true, order }`
- `POST /api/customer/orders/:id/cancel`
  - success: `{ ok: true, cancelled: true, refunded_amount, refund_ids }`
- `GET /api/customer/order-by-checkout-session?session_id=...`
  - success: `{ ok: true, order }`
  - not-ready case currently surfaced as HTTP 404

### Loyalty/Rewards

- `GET /api/customer/loyalty`
  - success: `{ ok: true, stamps_count, rewards_available, stamps_to_next_reward, last_stamp_date }`
- `GET /api/customer/rewards`
  - success: `{ ok: true, available_rewards, recent_redemptions }`

### Feedback

- `POST /api/order-feedback`
  - legacy success: `{ success: true, shouldShowGooglePrompt, googleReviewUrl }`
  - normalized target: `{ ok: true, shouldShowGooglePrompt, googleReviewUrl }`

## Known Contract Risks

- Mixed `ok` and `success` envelope fields across routes.
- Error payload field drift (`error` vs `reason`).
- Order success poll relies on 404 as "not ready yet".
- Auth routes historically returned payloads without explicit `ok`.
