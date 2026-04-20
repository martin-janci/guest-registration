# Guest Registration v2

Node.js + React rewrite of `airbnb.rlt.sk`. See design spec in `docs/superpowers/specs/`.

## Local dev

```bash
cp .env.example .env
docker compose -f docker/docker-compose.yml up -d postgres minio
npm install
npm run db:migrate
npm run create-admin
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` – Next.js dev server
- `npm test` – Vitest unit + integration
- `npm run typecheck` – TypeScript check
- `npm run db:migrate` – apply Prisma migrations to the local DB
- `npm run db:studio` – Prisma Studio DB browser
- `npm run create-admin` – bootstrap a SUPERADMIN user

## Project layout

See `docs/superpowers/specs/2026-04-20-gws-rewrite-design.md` §3.
