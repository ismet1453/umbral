# UMBRAL

Web-only idle auto-battle RPG. Play in the browser — keep the tab open to earn Essence.

## Quick start (local)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Deploy (Vercel)

Set **Root Directory** to `frontend`, then:

```bash
cd frontend
npx vercel --prod
```

Optional env: `NEXT_PUBLIC_FIREBASE_*` (see `frontend/.env.example`).

## Monorepo layout

| Folder | Purpose |
|--------|---------|
| `frontend/` | **UMBRAL** game (Next.js) — ship this |
| `backend/` | Legacy PvP server (not used by idle v1) |
| `anchor/` | Legacy Solana escrow (not used by idle v1) |
