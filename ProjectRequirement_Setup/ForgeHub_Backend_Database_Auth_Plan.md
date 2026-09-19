# ForgeHub Backend — Database & Authentication Plan

## Current Status

The initial backend foundation is complete.

```text
ForgeHub Backend
├── Node.js
├── TypeScript
├── Express
├── /health endpoint
├── PostgreSQL
├── Docker PostgreSQL
├── Drizzle ORM
└── Drizzle migrations
```

The backend is connected to the local PostgreSQL Docker container and the first migration has been successfully executed.

---

# 1. Immediate Goal

Build the ForgeHub database foundation around:

- User identity
- Organizations
- Organization membership
- Roles
- Permissions
- Tenant isolation
- Authentication

The most important design principle is:

> Every organization-owned resource must be protected by organization/tenant boundaries.

This foundation should be established before building projects, tasks, chat, documents, or other business modules.

---

# 2. Development Strategy

Do not create the entire ForgeHub schema in one migration.

Build the database in dependency order:

```text
Users
  ↓
Organizations
  ↓
Organization Membership
  ↓
Roles
  ↓
Permissions
  ↓
Role Permissions
  ↓
Authentication
  ↓
Projects
  ↓
Tasks
  ↓
Remaining modules
```

Each stage should be migrated and tested before moving to the next stage.

---

# 3. Phase 1 — Users

The current test `users` table should be expanded into the real authentication user model.

## Target fields

```text
users
├── id
├── email
├── password_hash
├── first_name
├── last_name
├── avatar_url
├── email_verified_at
├── is_active
├── created_at
└── updated_at
```

## Requirements

- UUID primary key.
- Email is required and unique.
- Normalize email before storage.
- Never store plaintext passwords.
- Store `password_hash`.
- Use a strong password hashing algorithm such as Argon2id or bcrypt.
- `email_verified_at = NULL` means the email is not verified.
- `is_active` allows an account to be disabled without deleting it.
- Use `created_at` and `updated_at` timestamps.

---

# 4. Phase 2 — Organizations

An organization represents a ForgeHub tenant.

```text
organizations
├── id
├── name
├── slug
├── created_at
└── updated_at
```

Requirements:

- UUID primary key.
- Human-readable organization name.
- Unique URL-friendly slug.

---

# 5. Phase 3 — Organization Membership

Users can belong to multiple organizations, so `organization_id` should not be placed directly on `users`.

Use a membership table:

```text
organization_members
├── id
├── organization_id
├── user_id
├── role_id
├── joined_at
└── ...
```

Important constraint:

```text
UNIQUE(organization_id, user_id)
```

This prevents duplicate membership in the same organization.

Relationship:

```text
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Organization A  Organization B
```

---

# 6. Phase 4 — Roles

Initial built-in roles:

```text
OWNER
ADMIN
MANAGER
MEMBER
GUEST
```

Roles should belong to an organization so custom organization-specific roles can be supported later.

```text
Organization
    │
    └── Roles
         ├── OWNER
         ├── ADMIN
         ├── MANAGER
         ├── MEMBER
         └── GUEST
```

---

# 7. Phase 5 — Permissions

Permissions represent individual capabilities.

Examples:

```text
project.read
project.create
project.update
project.delete

task.read
task.create
task.update
task.delete
task.assign

document.read
document.create
document.update
document.delete

billing.read
billing.manage
```

The permission set will grow as ForgeHub modules are implemented.

---

# 8. Phase 6 — Role Permissions

Roles and permissions should be separated using a many-to-many relationship.

```text
roles
  │
  │ many-to-many
  ▼
permissions
```

Use:

```text
role_permissions
├── role_id
└── permission_id
```

Add:

```text
UNIQUE(role_id, permission_id)
```

Example:

```text
ADMIN
 ├── project.read
 ├── project.create
 ├── project.update
 ├── project.delete
 ├── task.read
 └── task.update
```

---

# 9. RBAC and tenancy summary

Keep the access model simple:

```text
User -> Organization membership -> Role -> Permission
```

Tenant rules:

- Always verify organization membership
- Never trust a client-provided organization ID alone
- Scope every tenant-owned query by organization

## Database constraints

Use PostgreSQL constraints for safety:

- `PRIMARY KEY`
- `FOREIGN KEY`
- `UNIQUE`
- `NOT NULL`
- `CHECK`

Key uniques:

- `users.email`
- `organizations.slug`
- `organization_members(organization_id, user_id)`
- `role_permissions(role_id, permission_id)`

# 10. Migration workflow

Use Drizzle migrations only:

1. Update `schema.ts`
2. Generate migration
3. Review SQL
4. Apply migration
5. Verify in PostgreSQL

Do not modify production tables manually.

# 11. Authentication plan

Auth should support:

- Register
- Login
- Access tokens
- Refresh tokens
- Refresh token rotation
- Logout current session
- Logout all sessions
- Password reset
- Email verification

Later:

- MFA / TOTP
- Session management
- Device tracking

Suggested session table:

```text
sessions
├── id
├── user_id
├── refresh_token_hash
├── user_agent
├── ip_address
├── expires_at
├── created_at
├── last_used_at
└── revoked_at
```

Do not store raw refresh tokens.

# 12. API order

Once the database foundation is ready:

1. Authentication service
2. Auth routes
3. Auth middleware
4. Organization context middleware
5. RBAC middleware
6. Protected routes

Initial endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`

# 13. Testing focus

### Authentication

- Valid login
- Invalid password
- Unknown email
- Inactive user
- Expired access token
- Invalid refresh token
- Revoked session
- Refresh token reuse

### Multi-tenancy

- User A can access Organization A
- User A cannot access Organization B
- User A cannot access Organization B projects or tasks

### RBAC

- OWNER can perform privileged actions
- ADMIN can perform admin actions
- MEMBER has limited access
- GUEST has minimal access

# 14. Out of scope for now

Do not start these yet:

- Redis
- MongoDB
- Socket.IO
- BullMQ
- Chat
- Documents
- File uploads
- GitHub integration
- Analytics
- Search

# 15. Milestone

This phase is complete when the flow works end to end:

```text
User -> Register -> Login -> Authenticated session -> Organization membership -> Role -> Permission -> Protected API endpoint
```

And the security rule is verified:

- An Organization A user can access Organization A
- The same user cannot access Organization B

Only after that should the Projects and Tasks domain be built.
