# LanfiaSave — Portail web (dashboard)

Portail des professionnels de la plateforme LanfiaSave 2.1 et site public institutionnel.
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4.

Dépôts associés : `backend-lanfiasave` (API Django) et `app-mobile-lanfiasave` (applications Expo).

## API

Le portail est branché par défaut sur l'API de production :
**https://backend-lanfiasave-uwy5.vercel.app/api/v1** (constante `PRODUCTION_API_URL`, `src/lib/server/backend.ts`).

Le navigateur ne voit jamais l'API ni les jetons JWT : toutes les requêtes passent par le relais serveur
`src/app/api/backend/[...path]`, et les jetons sont conservés dans des cookies `httpOnly`. Aucune configuration
CORS n'est donc nécessaire côté API.

Pour viser une autre API (développement local, préproduction), définir `API_INTERNAL_URL`
(voir `.env.example`).

## Démarrage

```bash
npm install
npm run dev        # http://localhost:5173
```

## Déploiement sur Vercel

Importer le dépôt dans Vercel (framework détecté : Next.js). Aucune variable n'est obligatoire ; définir
`API_INTERNAL_URL` uniquement pour pointer vers une autre API.

## Écrans

| Route | Contenu |
|---|---|
| `/` | Site public institutionnel |
| `/connexion` | Connexion des professionnels |
| `/tableau-de-bord` | Indicateurs calculés en direct |
| `/beneficiaires` | Dossiers, création sans pièce d'identité, fiche avec score expliqué, doublons, accès bénéficiaire |
| `/programmes` | Programmes, cycle de vie, règles d'éligibilité versionnées |
| `/instruction` | Instruction, avis social, décision motivée du comité |
| `/recours` | Traitement des recours |
| `/audit` | Journal d'audit |

Le menu s'adapte aux permissions du rôle de l'utilisateur.

## Qualité

```bash
npx tsc --noEmit && npx eslint src && npm run build
```
