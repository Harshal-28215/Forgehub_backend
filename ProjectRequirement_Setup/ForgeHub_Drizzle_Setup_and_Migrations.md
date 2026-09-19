# ForgeHub — Drizzle ORM Setup and Migrations

## Overview

ForgeHub uses Drizzle ORM with PostgreSQL for transactional data.

Key benefits:

- Type-safe queries
- PostgreSQL via `pg`
- TypeScript schema files
- Versioned migrations
- Docker-based local database

## Required packages

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

## Migration workflow

Use this repeating flow for every schema change:

```text
Update schema.ts
   ↓
Generate migration
   ↓
Review SQL
   ↓
Apply migration
   ↓
Verify database
```

## Important rules

- Do not edit applied migrations on shared or deployed databases
- Commit migration files to Git
- Do not store database passwords in source control
- Review generated SQL before production deployment
- Never delete the database to solve normal schema changes

## Verifying PostgreSQL

Useful commands:

```bash
docker ps
docker exec -it forgehub-postgres psql -U forgehub -d forgehub
```

Inside PostgreSQL:

```sql
\dt
\d users
\q
```

## Local and VPS usage

Locally, `DATABASE_URL` points to `localhost:5432`.

On the VPS, PostgreSQL is bound to localhost, so it is not publicly exposed.

## Recommended Git flow

```bash
git pull
npm run db:generate
npm run db:migrate
npm run build
git add src/db drizzle drizzle.config.ts package.json package-lock.json
git commit -m "feat(db): update database schema"
git push
```

## Future schema growth

When the schema gets large, split it into modules such as:

```text
src/db/
├── index.ts
├── schema/
│   ├── users.ts
│   ├── organizations.ts
│   ├── roles.ts
│   ├── projects.ts
│   ├── tasks.ts
│   └── sessions.ts
```

## Next database step

Expand `users` into the full auth model:

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

Then add:

```text
organizations
organization_members
roles
permissions
role_permissions
sessions
authentication
```

Each step should follow the same migration workflow.
