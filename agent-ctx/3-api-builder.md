# Task 3 - API Builder

## Work Summary
Created all 18 API route files for the SunStore e-commerce platform.

## Files Created
1. `/src/app/api/auth/route.ts` — Login + token validation
2. `/src/app/api/auth/change-password/route.ts` — Password change
3. `/src/app/api/sites/route.ts` — List/create sites
4. `/src/app/api/sites/[id]/route.ts` — Get/update/delete site
5. `/src/app/api/sites/[id]/products/route.ts` — List/create products
6. `/src/app/api/sites/[id]/products/[productId]/route.ts` — Single product CRUD
7. `/src/app/api/sites/[id]/orders/route.ts` — List orders + update status
8. `/src/app/api/orders/route.ts` — Global orders list
9. `/src/app/api/products/route.ts` — Global products list
10. `/src/app/api/payment/init/route.ts` — Payment initiation
11. `/src/app/api/payment/webhook/route.ts` — T-Bank webhook
12. `/src/app/api/payment/status/route.ts` — Payment status check
13. `/src/app/api/crm/tickets/route.ts` — Ticket list/create
14. `/src/app/api/crm/tickets/[id]/route.ts` — Ticket get/reply
15. `/src/app/api/crm/subscribers/route.ts` — Subscriber list/create
16. `/src/app/api/config/route.ts` — Platform config CRUD
17. `/src/app/api/storefront/[slug]/route.ts` — Public storefront
18. `/src/app/api/stats/route.ts` — Dashboard statistics

## Key Design Decisions
- Orders PATCH on `/sites/[id]/orders` accepts `{orderId, status}` in body (no [orderId] route segment)
- Payment init creates order with NEW → PENDING status flow
- Stock decremented immediately on payment init, restored on T-Bank rejection
- Webhook uses timing-safe token comparison for security
- Storefront only returns active products from READY sites
- Subscribers use upsert with lowercase email for dedup
- All pagination capped at 100 items max