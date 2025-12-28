# GraphQL Playground

A monorepo demonstrating AI generation scheduling with durable execution, real-time status updates, and full-stack GraphQL.

## Tech Stack

| Layer    | Technology                  |
| -------- | --------------------------- |
| Frontend | Next.js 16, React 19        |
| Backend  | NestJS, GraphQL (Apollo)    |
| Database | PostgreSQL 16, Prisma ORM   |
| Queue    | Inngest (durable execution) |
| Cache    | Redis 7                     |
| Monorepo | Turborepo, Bun              |

## Quick Start

```bash
# Prerequisites: Docker, Bun 1.3.5+, Node 24+

# Start infrastructure
docker compose up -d

# Install dependencies
bun install

# Setup database
bun run db:generate
bun run db:push

# Setup environment
cp .env.example .env

# Start development
bun run dev
```

See `.env.example` for all configuration options.

**Services:**

- Web: <http://localhost:3000>
- API: <http://localhost:3001/graphql>
- Inngest: <http://localhost:8288>

## Project Structure

```text
apps/
├── api/          # NestJS GraphQL API
└── web/          # Next.js frontend
packages/
├── database/     # Prisma schema & client
├── redis/        # Redis client
└── shared/       # Shared types & utilities
```

## Scripts

| Command             | Description           |
| ------------------- | --------------------- |
| `bun run dev`       | Start all services    |
| `bun run build`     | Build all packages    |
| `bun run db:studio` | Open Prisma Studio    |
| `bun run docker:up` | Start Docker services |
