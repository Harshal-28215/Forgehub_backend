## 1) Project Identity

- Project: `forgehub_backend`
- Type: API backend
- Runtime: Node.js + TypeScript (ESM)
- Framework: Express 5
- Database: PostgreSQL (via Drizzle ORM)
- Auth state: registration and login implemented; refresh/logout/middleware still planned
- Current date baseline for this file: `2026-09-22`

## 2) Tech Stack (Actual vs Planned)

### Currently in codebase (verified)

- `express`
- `typescript`
- `tsx`
- `dotenv`
- `drizzle-orm`
- `drizzle-kit`
- `pg`
- `zod`
- `argon2`
- `jsonwebtoken`

### Mentioned in product architecture but not yet implemented in dependencies/code

- Redis
- BullMQ
- MongoDB
- Socket.IO
- Dockerized app runtime (database setup docs exist)
- GitHub Actions CI/CD

## 3) Scripts and Commands

From `package.json`:

```bash
npm run dev          # tsx watch src/server.ts
npm run build        # tsc
npm run start        # node dist/server.js
npm run db:generate  # drizzle-kit generate
npm run db:migrate   # drizzle-kit migrate
```

## 4) Workspace Structure (Current)

```text
drizzle.config.ts
package.json
tsconfig.json
drizzle/
  0000_public_lorna_dane.sql
  0001_tricky_nicolaos.sql
  0002_thankful_paibok.sql
  0003_nebulous_stingray.sql
  meta/
    _journal.json
    0000_snapshot.json
    0001_snapshot.json
    0002_snapshot.json
    0003_snapshot.json
ProjectRequirement_Setup/
  ForgeHub_Backend_Architecture_Progress.md
  ForgeHub_Backend_Database_Auth_Plan.md
  ForgeHub_Docker_PostgreSQL_Setup.md
  ForgeHub_Drizzle_Setup_and_Migrations.md
  ForgeHub_Project_Requirements.md
src/
  app.ts
  server.ts
  config/
    env.ts
  db/
    index.ts
    schema.ts
    seeds.ts
  modules/
    auth/
      auth.controller.ts
      auth.routes.ts
      auth.service.ts
      auth.types.ts
      auth.validation.ts
  utils/
    jwt.ts
    password.ts
```

## 5) Runtime and Config

### Environment variables

Required in `src/config/env.ts`:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional defaults:

- `PORT` -> default `5000`
- `NODE_ENV` -> default `development`
- `JWT_ACCESS_EXPIRES_IN` -> default `15m`
- `JWT_REFRESH_EXPIRES_IN` -> default `30d`

### Server entry

- `src/server.ts` starts app on `env.port` (default `5000`)
- `src/app.ts` configures JSON middleware and routes

## 6) Current API Surface

### Auth

Mounted under: `app.use("/api/v1/auth", authRoutes)`

Implemented endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Login behavior:

- Validates email/password with Zod.
- Looks up the user record and verifies the Argon2 password hash.
- Creates a per-device session row with a hashed refresh token stored in `sessions.refresh_token_hash`.
- Returns: `user`, `accessToken`, and `refreshToken` in the JSON response for local development/testing.

Important future note:

- For now, we're returning the refresh token in JSON because we're developing and testing the API.
- Later, when we build the browser frontend, we'll decide the browser storage strategy carefully.
- For a production web application, an `HttpOnly`, `Secure` cookie is generally preferable for refresh tokens, with appropriate CSRF protections.

Not implemented yet (planned):

- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`

## 7) Registration Flow (Implemented)

Input validation via Zod (`auth.validation.ts`):

- `email` (trim + lowercase + valid email)
- `password` (8 to 128 chars)
- `firstName` (1 to 100 chars)
- `lastName` (1 to 100 chars)
- `organizationName` (2 to 150 chars)

Service flow (`auth.service.ts`):

1. Check user by email.
2. Load role `OWNER` from `roles` table.
3. Hash password with Argon2id.
4. Run transaction:
5. Insert user.
6. Create org slug from organization name + UUID suffix.
7. Insert organization.
8. Insert organization membership with `OWNER` role.
9. Return `user`, `organization`, and `role`.

## 8) Login Flow (Implemented)

Input validation via Zod (`auth.validation.ts`):

- `email` (trim + lowercase + valid email)
- `password` (minimum 8 chars)

Service flow (`auth.service.ts`):

1. Find user by normalized email.
2. Reject inactive accounts.
3. Verify password hash using Argon2.
4. Create a new `sessions` record for the device/IP combination.
5. Generate access token and refresh token.
6. Hash the refresh token with Argon2 and persist it in `sessions.refresh_token_hash`.
7. Return the authenticated user payload plus both token strings.

Current dev/testing decision:

- Refresh token is returned in the JSON body so the API can be tested quickly while the product is still under active development.
- This is not the final production token strategy for browser-based clients.

## 9) Database Model Snapshot

Source: `src/db/schema.ts`

Tables present:

- `users`
- `organizations`
- `organization_members`
- `roles`
- `permissions`
- `role_permissions`
- `sessions`

Key relationships:

- `organization_members.organization_id -> organizations.id`
- `organization_members.user_id -> users.id`
- `organization_members.role_id -> roles.id`
- `role_permissions.role_id -> roles.id`
- `role_permissions.permission_id -> permissions.id`
- `sessions.user_id -> users.id`

Important constraints:

- `users.email` unique
- `organizations.slug` unique
- `organization_members` unique `(organization_id, user_id)`
- `role_permissions` unique `(role_id, permission_id)`

Session design notes:

- Session table supports per-device session records.
- `refresh_token_hash` is stored (not raw token).
- Session revocation and expiry are represented with `revoked_at` and `expires_at`.

## 10) Security Snapshot

- Password hashing: Argon2id in `src/utils/password.ts`
- JWT utility in `src/utils/jwt.ts`
- Access token payload: `{ userId }`
- Refresh token payload: `{ userId, sessionId }`

## 11) Migrations Status

Drizzle SQL migration files detected:

- `drizzle/0000_public_lorna_dane.sql`
- `drizzle/0001_tricky_nicolaos.sql`
- `drizzle/0002_thankful_paibok.sql`
- `drizzle/0003_nebulous_stingray.sql`

## 12) Known Gaps and Cleanup Items

- `src/modules/auth/auth.types.ts` is empty.
- `src/db/seeds.ts` is empty.
- Refresh token rotation and reuse detection are not implemented yet.
- Logout and logout-all flows are not implemented yet.
- Middleware for auth/tenant/RBAC is not implemented yet.
- Some docs mention stack pieces not yet present in code.

## 13) Recommended Next Build Order

1. `POST /api/v1/auth/refresh` with rotation and reuse detection.
2. Logout (single session) and logout-all.
3. Auth middleware (`Bearer` access token verification).
4. `GET /api/v1/auth/me` with org memberships.
5. Tenant context middleware.
6. RBAC authorization middleware.

## 14) Next Security/Architecture Update

After login succeeds, the next step is the interesting part:

- `POST /auth/refresh`

We'll implement refresh-token rotation and reuse detection, which means ForgeHub can detect an old refresh token being used again after rotation.

Then we'll implement logout and the authentication middleware.

## 15) How To Keep This File Updated

After each feature, update these sections:

1. `Current API Surface` with new endpoints and status codes.
2. `Database Model Snapshot` when schema changes.
3. `Tech Stack (Actual vs Planned)` when new dependencies are added.
4. `Known Gaps and Cleanup Items` by removing completed items and adding new gaps.
5. `Recommended Next Build Order` based on current priorities.

Use this short change log block at the bottom each time:

```md
## Change Log
- YYYY-MM-DD: <feature/decision summary>
```

## Change Log

- 2026-09-20: Rewrote file into an AI-ready, code-accurate context document with implemented vs planned separation and maintenance checklist.
- 2026-09-22: Added the implemented login flow, refreshed the auth status, documented the current JSON refresh-token tradeoff for API testing, and set the next refresh-rotation/logout milestones.

## Auth Route Details

This section documents the current auth-related routes and their expected request/response shapes.

- GET `/api/v1/auth/me`
  - Auth: Bearer access token (header `Authorization: Bearer <accessToken>`)
  - Success (200):
    ```json
    { "success": true, "data": { "id": "<userId>", "email": "user@example.com", "firstName": "..." } }
    ```
  - Errors: `401 AUTHENTICATION_REQUIRED`, `401 INVALID_ACCESS_TOKEN`, `500 INTERNAL_SERVER_ERROR`

- POST `/api/v1/auth/refresh`
  - Body: `{ "refreshToken": "<refresh token>" }`
  - Success (200):
    ```json
    { "success": true, "data": { "accessToken": "<jwt>", "refreshToken": "<rotated-refresh-token>" } }
    ```
  - Errors: `400 INVALID_REFRESH_TOKEN`, `401 INVALID_REFRESH_TOKEN`, `500 INTERNAL_SERVER_ERROR`

- POST `/api/v1/auth/logout`
  - Body: `{ "refreshToken": "<refresh token>" }`
  - Success (200):
    ```json
    { "success": true, "data": { "message": "Logged out successfully" } }
    ```
  - Errors: `400 REFRESH_TOKEN_REQUIRED`, `500 INTERNAL_SERVER_ERROR`

- POST `/api/v1/auth/logout-all`
  - Auth: Bearer access token (requires authenticated user)
  - Success (200):
    ```json
    { "success": true, "data": { "message": "All sessions logged out successfully" } }
    ```
  - Errors: `401 AUTHENTICATION_REQUIRED`, `500 INTERNAL_SERVER_ERROR`

Example curl (get current user):

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.example.com/api/v1/auth/me
```

Example curl (refresh):

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"refreshToken":"<token>"}' \
  https://api.example.com/api/v1/auth/refresh
```
