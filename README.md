# LanfiaSave — Portail web

Next.js (App Router) · TypeScript · Tailwind CSS.

Le navigateur ne voit jamais les jetons JWT : ils sont conservés dans des cookies `httpOnly`
et toutes les requêtes passent par le relais `src/app/api/backend/[...path]`.

```bash
npm install
npm run dev        # http://localhost:5173 (l'API Django doit tourner sur :8000)
```

Variables : `API_INTERNAL_URL` (URL de l'API vue du serveur Next.js, par défaut `http://localhost:8000/api/v1`).
