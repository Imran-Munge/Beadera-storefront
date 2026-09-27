# Beadera

Beadera is a warm, story-led storefront for handmade bead accessories, gifting, and hands-on workshops.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `VITE_WHATSAPP_NUMBER`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/beadera/src/components/Storefront.tsx` — public storefront, cart, product detail, WhatsApp ordering, and workshop form
- `artifacts/beadera/src/pages/AdminDashboard.tsx` — protected catalogue and workshop management
- `artifacts/api-server/src/routes/catalog.ts` — public product and workshop endpoints
- `artifacts/api-server/src/routes/admin.ts` — admin login, product CRUD, summaries, and enquiry status updates
- `lib/db/src/schema/products.ts` and `lib/db/src/schema/workshopEnquiries.ts` — PostgreSQL source of truth
- `lib/api-spec/openapi.yaml` — API contract and codegen source
- `artifacts/beadera/src/index.css` — Beadera visual theme and motion utilities

## Architecture decisions

- Public catalog data is served from PostgreSQL through the shared Express API; the frontend does not hardcode products.
- The cart is intentionally lightweight and stored in browser local storage; ordering opens WhatsApp rather than introducing payment infrastructure.
- Admin access uses a signed, HTTP-only session cookie; production credentials should be supplied through `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Product image URLs are stored as metadata in PostgreSQL, while the first catalogue uses brand-owned generated assets under the storefront public directory.

## Product

- Story-led Beadera storefront with responsive browsing, category filters, product detail modal, cart drawer, and WhatsApp ordering.
- Workshop enquiry form with name, contact, group details, preferred date/time, and message persisted in PostgreSQL.
- Protected studio dashboard with product create/edit/delete, visibility/featured controls, catalogue search, summary counts, and enquiry status management.

## User preferences

- Keep the Beadera logo recognizable and make the brand feel handmade, emotional, warm, premium, and feminine rather than generic or corporate.

## Gotchas

- The frontend Vite build requires workflow-provided `PORT` and `BASE_PATH`; for a standalone build use `PORT=23942 BASE_PATH=/`.
- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
