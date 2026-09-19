# ForgeHub — Docker & PostgreSQL Setup

Minimal setup for PostgreSQL 17 in Docker on the ForgeHub VPS.

## Setup

on vps

```bash
mkdir -p ~/forgehub/infrastructure/postgres
cd ~/forgehub/infrastructure/postgres
```

Create `docker-compose.yml` in created path:

```yaml
services:
  postgres:
    image: postgres:17
    container_name: forgehub-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: forgehub
      POSTGRES_USER: forgehub
      POSTGRES_PASSWORD: CHANGE_THIS_TO_A_STRONG_PASSWORD
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - forgehub_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U forgehub -d forgehub"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  forgehub_postgres_data:
```

> Replace the password before using it in a real environment. Do not commit production secrets.

## Start it

```bash
docker compose up -d
```

Check status:

```bash
docker ps
docker logs forgehub-postgres
```

Verify health:

```bash
docker inspect --format='{{.State.Health.Status}}' forgehub-postgres
```

### Check containers

```bash
docker ps
```

### Check all containers

```bash
docker ps -a
```

Expected result:

```text
healthy
```

## Connect

```bash
docker exec -it forgehub-postgres psql -U forgehub -d forgehub
```

Useful checks:

```sql
SELECT version();
SELECT current_database();
```

## Notes

- `127.0.0.1:5432:5432` keeps PostgreSQL local to the VPS only.
- The named Docker volume keeps database data across container restarts.
- Do not run `docker compose down -v` unless you intentionally want to delete the database data.
- Common commands:

```bash
docker compose down
docker compose restart
docker logs -f forgehub-postgres
```

This is intentionally minimal and meant for local/private VPS use before exposing services more broadly.
