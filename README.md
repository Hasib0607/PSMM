# PSMM — Personal Social Media Manager

Personal AI assistant for planning, creating, and publishing content across personal social accounts.

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes (+ Playwright worker in Phase 3)
- **Database:** PostgreSQL + Prisma ORM
- **Queue:** Redis + BullMQ (Phase 3)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start database services

```bash
docker compose up -d
```

### 3. Environment

```bash
cp .env.example .env
# Edit .env — set AUTH_SECRET at minimum
```

### 4. Database setup

```bash
npm run db:push
npm run db:seed
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main app pages
│   └── page.tsx            # Redirects to /dashboard
├── components/
│   ├── dashboard/          # Sidebar, widgets
│   └── ui/                 # Reusable UI primitives
├── lib/
│   ├── automation/         # PublisherInterface (Playwright later)
│   ├── db.ts               # Prisma client
│   └── special-days.ts     # Occasion calendar helpers
└── types/                  # Shared TypeScript types

prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Special days seed data

worker/                     # Phase 3 — Playwright automation worker
```

## Development Phases

See [PROJECT_FLOW.md](./PROJECT_FLOW.md) for the full product plan.

| Phase | Status |
|-------|--------|
| Phase 0 — Planning | ✅ Done |
| Phase 1 — Foundation | 🚧 In progress |
| Phase 2 — AI Content Studio | Pending |
| Phase 3 — Facebook MVP | Pending |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed special days |
| `npm run db:studio` | Open Prisma Studio |
