# ForgeHub — Full-Stack Engineering Challenge

A production-grade multi-tenant SaaS project designed to showcase advanced frontend, backend, database, real-time, distributed-systems, DevOps, security, and system-design skills.

## 1. Product Overview

ForgeHub is a multi-tenant operations and collaboration platform combining ideas from Jira, Slack, Notion, and lightweight ERP systems.

**Core capabilities:** organizations, teams, projects, tasks, workflows, documents, real-time chat, notifications, file attachments, reports, automations, audit logs, and integrations.

The central requirement is strict tenant isolation: users may belong to multiple organizations, and no request may expose another organization's data.

## 2. Target Architecture

- React + Vite + TypeScript frontend
- Node.js + Express API
- PostgreSQL for transactional data
- MongoDB for activity/event data
- Redis for caching, rate limiting, distributed locks, and queue infrastructure
- BullMQ workers for asynchronous processing
- Socket.IO for real-time communication
- Object storage for files
- External integrations: GitHub, Slack, Google, Microsoft, email
- Docker + Docker Compose
- CI/CD with GitHub Actions
- VPS deployment
- Optional: Nginx, OpenTelemetry, Elasticsearch/OpenSearch

## 3. Authentication & Sessions

- Implement email/password authentication.
- Access tokens and refresh tokens with rotation.
- Logout from one device.
- Logout from all devices.
- Password reset.
- Email verification.
- MFA/TOTP.
- Session management.
- Use secure password hashing such as Argon2 or bcrypt.
- Store session/refresh-token state securely and support token revocation.

## 4. Multi-Tenancy

- Users can belong to multiple organizations with different roles in each organization.
- Every protected request must resolve:
  `user → organization membership → role → permissions → resource`
- Prevent cross-tenant access even when a user guesses another resource ID.
- Use tenant-aware database queries and authorization at the service layer.

## 5. RBAC & Permissions

- Create permissions such as:
  - `project.read/create/update/delete`
  - `task.read/create/update/delete/assign`
  - `document.read/edit`
  - `billing.read/manage`
  - etc.
- Provide `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, and `GUEST` roles.
- Allow organization administrators to create custom roles and assign permissions.
- Avoid hard-coded role checks scattered throughout the codebase.

## 6. Projects & Custom Workflows

- Projects contain members, tasks, workflows, documents, chat, and activity.
- Tasks support configurable states such as:
  - `BACKLOG`
  - `TODO`
  - `IN_PROGRESS`
  - `IN_REVIEW`
  - `DONE`
  - `CANCELLED`
- Organizations can create custom workflows and define valid state transitions.
- The backend must enforce valid transitions rather than trusting the frontend.

## 7. Task Management

Tasks support:

- Title
- Description
- Priority
- Status
- Assignee
- Reporter
- Due date
- Labels
- Custom fields
- Attachments
- Comments
- Subtasks
- Dependencies
- Watchers
- Time tracking

Additional requirements:

- Support task dependencies such as `A blocks B`.
- Detect and prevent circular dependencies.

## 8. Real-Time Collaboration

- Use Socket.IO for presence, typing indicators, task updates, notifications, and other live events.
- Support multiple API/socket instances using Redis as the shared pub/sub layer.
- A user connected to one server must still receive events generated on another server.

## 9. Collaborative Documents — Boss Fight

- Build a simple collaborative editor where multiple users can edit the same document concurrently.
- Use a CRDT approach such as Yjs, or implement Operational Transformation if you want the harder route.
- Handle concurrent edits, synchronization, reconnects, and user presence.

## 10. Chat System

- Implement organization and project channels.
- Messages support:
  - Replies
  - Reactions
  - Mentions
  - Attachments
  - Editing
  - Deletion
  - Read receipts
- Use Socket.IO + Redis + PostgreSQL.
- Ensure real-time delivery works across multiple server instances.

## 11. Notifications & Event Processing

- Use an event-driven architecture rather than performing every side effect inside the API request.
- Events may include:
  - `task.created`
  - `task.assigned`
  - `task.completed`
  - `comment.created`
  - `mention.created`
  - `project.member_added`
- Process email, push/in-app notifications, and integrations asynchronously through BullMQ.

## 12. BullMQ & Background Jobs

Implement scheduled and asynchronous jobs such as:

- Overdue-task summaries
- Periodic project metrics
- Report generation
- Notification delivery

Support:

- Retries
- Exponential/backoff delays
- Job monitoring
- Idempotency
- Dead-letter queue

Jobs must be safe to retry without duplicating side effects.

## 13. Redis Requirements

Use Redis for:

- Application caching
- Rate limiting
- Distributed locks
- BullMQ infrastructure

Implement:

- Cache-aside behavior for suitable reads.
- Distributed locking for jobs that must run once across multiple workers.
- Per-user/IP/API rate limits.

## 14. PostgreSQL

Use PostgreSQL as the primary transactional database.

### Suggested Entities

- organizations
- users
- organization_members
- teams
- team_members
- projects
- project_members
- tasks
- task_labels
- task_dependencies
- comments
- attachments
- notifications
- sessions
- roles
- permissions
- role_permissions

### Database Requirements

- Foreign keys
- Unique constraints
- Indexes
- Transactions
- Pagination
- Optimistic locking where appropriate
- Query optimization

## 15. MongoDB

- Use MongoDB for an append-oriented activity/event stream.
- Example fields:
  - `organizationId`
  - `actorId`
  - `event`
  - `entityId`
  - `metadata`
  - `timestamp`
- Build an activity timeline from these events.
- Keep transactional business data in PostgreSQL rather than using MongoDB simply because it is available.

## 16. Audit Logging

Record sensitive actions with:

- Actor
- Action
- Timestamp
- IP
- User agent
- Resource
- Relevant before/after values

Examples:

- Role changes
- Permission changes
- Resource deletion
- Organization settings changes

Audit records should be treated as immutable.

## 17. Search

- Build global search across projects, tasks, documents, messages, and users.
- Start with PostgreSQL full-text search.
- Optional advanced version: Elasticsearch/OpenSearch.
- Support pagination, filtering, tenant isolation, and relevance-aware results.

## 18. File Storage

- Support images, PDFs, documents, and task attachments.
- Use object storage rather than storing large files directly in PostgreSQL.
- Use signed URLs for uploads/downloads.
- Store file metadata and storage keys in PostgreSQL.
- Validate file type, size, permissions, and access ownership.

## 19. API Design

- Use versioned REST APIs such as:
  - `/api/v1/auth`
  - `/organizations`
  - `/projects`
  - `/tasks`
  - `/comments`
  - `/documents`
  - `/notifications`
  - `/search`
- Use consistent success and error response structures.
- Implement validation at the API boundary using TypeScript-friendly schemas such as Zod.
- Return stable machine-readable error codes.

## 20. React Frontend

Use:

- React
- TypeScript
- Vite
- Redux Toolkit
- React Query
- React Hook Form
- Zod
- Tailwind
- shadcn/ui

Build:

- Dashboards
- Project views
- Task boards
- Task detail screens
- Chat
- Notifications
- Documents
- Settings
- User management
- Role management
- Analytics
- Audit logs

## 21. Advanced Frontend Requirements

- Implement optimistic updates with rollback.
- Infinite scrolling for activity/chat/notifications.
- Debounced search.
- Proper loading/error/empty states.
- Virtualized lists for very large task collections.
- Avoid rendering tens of thousands of DOM nodes.

## 22. Offline Support — Advanced

- Allow selected task/document operations to work offline.
- Queue local changes and synchronize when connectivity returns.
- Handle conflicts explicitly.
- This is optional but strongly recommended for an advanced version.

## 23. Analytics

Provide organization-level analytics such as:

- Tasks completed
- Overdue tasks
- Average completion time
- Project progress
- Team velocity
- Member workload

Support:

- 7-day
- 30-day
- 90-day
- Custom date ranges

Provide CSV/PDF exports.

## 24. Generic Integration Architecture

- Design integrations behind a common abstraction rather than hard-coding provider-specific logic throughout the application.
- Possible interface methods:
  - `connect`
  - `disconnect`
  - `refreshToken`
  - `handleWebhook`
  - `sendEvent`
- Implement GitHub first, then optionally Slack, Google, and Microsoft.

## 25. GitHub Integration

- Connect a project to a GitHub repository.
- Consume GitHub webhooks.
- Map pull requests/commits to ForgeHub tasks where appropriate.
- Example behavior: when a linked PR opens, move a task to `CODE_REVIEW`.
- Validate webhook signatures.

## 26. Webhooks & Idempotency

- Expose webhook endpoints for external providers.
- Validate signatures.
- Handle duplicate events using event IDs or idempotency keys.
- Implement retries and safe processing so a repeated webhook does not create duplicate actions.

## 27. Observability

Implement:

- Structured logging
- Request IDs
- Centralized error handling
- Metrics
- Health checks
- Liveness/readiness endpoints
- Database/Redis health checks
- Queue failure visibility
- Latency/error measurements

Advanced version:

- OpenTelemetry distributed tracing

## 28. Docker

Provide a Docker Compose environment containing:

- Frontend
- API
- Worker
- PostgreSQL
- MongoDB
- Redis

Optional services:

- Nginx
- Observability components

The project should be reproducible with:

```bash
docker compose up
```

## 29. CI/CD

GitHub Actions pipeline:

```text
lint → typecheck → unit tests → integration tests → build → Docker image → deploy
```

Requirements:

- Use environment-specific configuration and secrets.
- Include deployment rollback considerations.

## 30. Testing

### Backend

- Unit tests
- Integration tests
- API tests

### Frontend

- Component tests

### End-to-End

- Playwright

### Critical E2E Flow

```text
login
→ create organization
→ invite member
→ create project
→ create task
→ assign task
→ change status
→ verify notification
```

## 31. Security Requirements

Deliberately test:

- SQL injection
- XSS
- CSRF where applicable
- Broken authorization
- IDOR
- JWT/session attacks
- Rate-limit bypass
- Malicious file uploads
- Webhook spoofing
- Tenant-isolation failures

Never trust client-provided:

- Organization IDs
- Roles
- Permissions
- Resource ownership

## 32. Scale Simulation

Generate synthetic data such as:

- 1,000 organizations
- 100,000 users
- 10 million tasks

Benchmark common operations including:

- Task listing
- Project loading
- Search
- Dashboards
- Notifications

Measure:

- P50 latency
- P95 latency
- P99 latency

Identify bottlenecks and document optimizations.

## 33. Database Performance Challenge

- Use `EXPLAIN ANALYZE` to inspect expensive queries.
- Understand sequential scans, index scans, nested loops, hash joins, and other relevant plans.
- Add indexes based on real query patterns and benchmark before/after performance.

## 34. Load Testing

- Use a load-testing tool such as k6.
- Simulate thousands of concurrent users with realistic mixes of browsing, searching, task creation, task updates, and chat.
- Document the first bottleneck and the architectural change used to address it.

## 35. Documentation & ADRs

Repository documentation should include:

- Architecture
- Database design
- Authentication
- Multi-tenancy
- Caching
- Queues
- Real-time architecture
- Scaling
- Security
- Deployment

### Architecture Decision Records

- ADR-001 — PostgreSQL as primary database
- ADR-002 — Redis caching strategy
- ADR-003 — Socket.IO architecture
- ADR-004 — BullMQ for async jobs
- ADR-005 — Multi-tenant isolation strategy

## 36. Suggested Repository Structure

```text
forgehub/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── types/
│   ├── validation/
│   ├── config/
│   └── ui/
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── deployment/
├── docs/
├── tests/
├── docker-compose.yml
└── package.json
```

## 37. Development Levels

### Level 1 — Foundation

- Auth
- Organizations
- Users
- RBAC
- Projects
- Tasks
- PostgreSQL
- React

### Level 2 — Production

- Redis
- Caching
- Rate limiting
- Files
- Notifications
- Audit logs
- BullMQ
- Email

### Level 3 — Real-time

- Socket.IO
- Presence
- Chat
- Typing
- Live task updates

### Level 4 — Distributed Systems

- Multiple API instances
- Redis adapter
- Distributed locks
- Idempotency
- Retries
- Dead-letter queues

### Level 5 — Advanced

- Collaborative editor
- Offline sync
- GitHub integration
- Webhooks
- OpenTelemetry
- Load testing
- Large datasets

### Level 6 — Production

- Docker
- CI/CD
- Monitoring
- Backups
- Security testing
- Performance optimization
- Disaster recovery

## 38. Final Boss Challenge

Run multiple API instances and workers simultaneously.

Then deliberately ask:

> “What happens if any one component dies right now?”

Design for failure of:

- API instances
- Workers
- Redis
- Database connections
- Queues
- External integrations

Document:

- Expected failure behavior
- Recovery behavior
- Retries
- Consistency trade-offs
- Operational procedures

## 39. Resume Outcome

After completing the project properly, the project should demonstrate:

- Full-stack TypeScript/React/Node engineering
- Multi-tenant SaaS architecture
- RBAC and secure authorization
- PostgreSQL data modeling and query optimization
- MongoDB event/activity storage
- Redis caching, locks, and rate limiting
- BullMQ asynchronous processing
- Socket.IO real-time systems
- Webhooks and third-party integrations
- Distributed-system concepts
- Docker and CI/CD
- Production deployment
- Testing and observability
- Performance/load testing
- Security engineering
- Architecture documentation and technical decision-making

> **The objective is not to build the maximum number of features. The objective is to build a coherent system where every technology has a real architectural reason to exist.**
