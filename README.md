# FasNexi — Feature Branch: feature/v2-features

This branch contains the MVP implementation for v2 features (community, creator commerce, realtime, stories, and challenges). It is work-in-progress and intended for review in small PRs; all changes in this branch are grouped to make local testing simple.

NOTE: This README documents how to run the server, apply DB migrations, run workers & tests, and a summary of implemented features on this branch.

## Key branch
- Branch: feature/v2-features
- Opened commits include: social models (posts, likes, comments, follows), marketplace (products/orders), stories, challenges, realtime Socket.IO + Redis, workers, and minimal React Native screens.

## Implemented MVP features
- Community Feed (posts, images, likes, simple ranking by follows/likes/recency)
- Creator Profiles (bio, portfolio surface, follow/unfollow, follower count)
- Comments & Replies (1-level replies, realtime comment events)
- Vendor Dashboard (product CRUD, manual-payment order lifecycle, shipping with tracking)
- Stories (24-hour ephemeral image stories with expiry worker)
- Fashion Challenges (create challenges, submit entries, vote, compute winners & award badges)

## Quickstart (local development)
Prerequisites
- Node.js 18+ (or as used in CI)
- PostgreSQL (or a connection configured via DATABASE_URL)
- Redis (for Socket.IO adapter & pub/sub)
- Expo / React Native environment if running mobile frontend

1) Checkout branch

```bash
git fetch origin
git checkout feature/v2-features
```

2) Server dependencies & Prisma

```bash
cd server
npm ci
npx prisma generate
```

3) Configure environment variables
Copy `.env.example` (if present) or set these env vars in your shell. Minimum required:

- DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
- REDIS_URL=redis://127.0.0.1:6379
- JWT_SECRET=your_jwt_secret
- CLOUDINARY_CLOUD_NAME=...
- CLOUDINARY_API_KEY=...
- CLOUDINARY_API_SECRET=...
- PLATFORM_FEE_PERCENT=15

For development convenience the server supports `DEV_AUTH=true` which enables a test token endpoint used by some integration tests.

4) Run Prisma migration

This branch updates `schema.prisma`. Run the migration locally to update your DB.

```bash
npx prisma migrate dev --name add_social_models
```

5) Start Redis (local)

```bash
docker run -p 6379:6379 --rm redis:7
```

6) Start the server

From `server/`:

```bash
DEV_AUTH=true REDIS_URL=redis://127.0.0.1:6379 JWT_SECRET=your_secret PLATFORM_FEE_PERCENT=15 node index.js
```

The server listens on port 4000 by default.

7) Start workers (optional but recommended)

Workers handle story expiry and challenge winner computation. Start them in separate terminals:

```bash
# story expiry
node workers/storyExpiryWorker.js &
# challenge computation
node workers/challengeWorker.js &
```

8) Start React Native app (optional)

From project root, run your RN or Expo start command. Ensure `API_BASE` in the RN environment points to `http://localhost:4000` (or use device IP).

## Tests
Unit tests are in `server/tests/` (Jest + Supertest). Run unit tests:

```bash
cd server
npm test -- --runInBand --testPathPattern=server/tests/*.unit.test.js
```

Integration tests that require Redis are configured in `.github/workflows/tests.yml` and will run on CI for this branch.

## CI
A GitHub Actions workflow `.github/workflows/tests.yml` is present to run unit tests and an integration job using `services: redis` to run Redis. The workflow triggers on pushes to `feature/v2-features` and on PRs targeting `main`.

## API overview (selected endpoints)
- /api/posts — POST (create), GET (feed), PUT/DELETE /:postId, POST /:postId/like, DELETE /:postId/like
- /api/posts/:postId/comments — POST/GET, DELETE /api/comments/:commentId
- /api/users/:id — GET profile, PUT update, POST/DELETE /:id/follow
- /api/vendor/products — vendor CRUD
- /api/orders — POST place order (PENDING_PAYMENT), GET /api/orders/vendor, POST /api/orders/:id/mark-paid, /mark-shipped, /refund
- /api/stories — POST create, GET /api/stories/:creatorId
- /api/challenges — POST create, GET list, POST /:id/submissions, POST vote, GET /:id
- /api/uploads/sign — Cloudinary signed upload fields (used by RN client)

Authentication
- JWT-based auth. Include `Authorization: Bearer <token>` header. For dev flows use `DEV_AUTH=true` and the /api/auth/test-token endpoint (present in server code) to mint test tokens.

Platform commission
- Platform fee is applied per order. `PLATFORM_FEE_PERCENT` defaults to 15. The order model stores `platformFeeCents` and `vendorAmountCents` where applicable.

## Realtime
- Socket.IO is used for realtime; the server attaches a Redis adapter. Clients can join rooms such as `profile:<id>` or `post:<id>`. The server subscribes to Redis channels (e.g., `feed:updates`, `post:comments`, `order:updated`) and emits events to appropriate rooms.

## Workers
- `workers/storyExpiryWorker.js` — expires stories after 24 hours
- `workers/challengeWorker.js` — computes winners once challenges end, awards badges

Run them with `node workers/...` in separate shells or orchestrate with PM2 or Docker in production.

## Notes, caveats & TODOs
- Migrations: PR includes Prisma schema changes. Running migrations is required locally.
- Image moderation: image uploads enqueue moderation jobs (hooked into `moderationQueue` if present). Please ensure moderation workers are configured in production.
- Multi-vendor orders: MVP assumes a single vendor per order. The server returns `multi_vendor_not_supported` if a cart contains products from different vendors. Future improvements: split carts into multiple orders or support marketplace checkout.
- Payment: MVP uses manual payment flow — vendor/admin marks orders as PAID.
- Rate-limits, abuse protection, and advanced anti-fraud are not fully implemented in MVP.
- Frontend screens in `app/` are minimal, meant as examples and starting points. Styling and navigation wiring may need adjustments.

## Next steps (recommended)
- Open a draft PR for `feature/v2-features` → `main` and review incremental commits (one per feature).
- Add end-to-end tests for key flows (create post → like → comment → realtime update; create product → place order → mark paid/ship).
- Add CI job to run the workers and integration test suites for additional coverage.

## Contributors / Contact
If you want me to open the draft PR, run the CI workflow and report back, or split this feature set into smaller PRs for review, reply and I will proceed.

