## 1) Project Identity

- Project: `forgehub_backend`
- Type: API backend
- Runtime: Node.js + TypeScript (ESM)
- Framework: Express 5
- Database: PostgreSQL (via Drizzle ORM)
- Auth state: registration implemented, full auth lifecycle partially planned
- Current date baseline for this file: `2026-09-20`

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

Implemented endpoint:

- `POST /api/v1/auth/register`

Not implemented yet (planned):

- `POST /api/v1/auth/login`
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

## 8) Database Model Snapshot

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

## 9) Security Snapshot

- Password hashing: Argon2id in `src/utils/password.ts`
- JWT utility in `src/utils/jwt.ts`
- Access token payload: `{ userId }`
- Refresh token payload: `{ userId, sessionId }`

## 10) Migrations Status

Drizzle SQL migration files detected:

- `drizzle/0000_public_lorna_dane.sql`
- `drizzle/0001_tricky_nicolaos.sql`
- `drizzle/0002_thankful_paibok.sql`
- `drizzle/0003_nebulous_stingray.sql`

## 11) Known Gaps and Cleanup Items

- `src/modules/auth/auth.types.ts` is empty.
- `src/db/seeds.ts` is empty.
- Full auth lifecycle endpoints are not implemented yet.
- Middleware for auth/tenant/RBAC is not implemented yet.
- Some docs mention stack pieces not yet present in code.

## 12) Recommended Next Build Order

1. Auth login endpoint + session creation.
2. Refresh token rotation with hash validation.
3. Logout (single session) and logout-all.
4. Auth middleware (`Bearer` access token verification).
5. `GET /api/v1/auth/me` with org memberships.
6. Tenant context middleware.
7. RBAC authorization middleware.

## 13) How To Keep This File Updated

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

## 14) AI Instruction Block (Copy-Paste Ready)

When using this repo with any AI, share this:

```text
You are working on ForgeHub backend (Node.js + Express + TypeScript + PostgreSQL + Drizzle).

Read and follow:
1) ProjectRequirement_Setup/ForgeHub_Backend_Architecture_Progress.md (source of truth)
2) Existing code patterns in src/modules/auth and src/db/schema.ts

Rules:
- Keep architecture consistent with current implemented stack.
- Do not assume Redis/BullMQ/Socket.IO/MongoDB exist unless added.
- Prefer transaction-safe writes for auth/account creation flows.
- Preserve response format style used in current controllers.
- Update this architecture progress file whenever code or schema changes.
```

## Change Log

- 2026-09-20: Rewrote file into an AI-ready, code-accurate context document with implemented vs planned separation and maintenance checklist.
