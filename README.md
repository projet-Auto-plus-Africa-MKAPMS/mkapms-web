# MKA.P-MS — Auto Plus Africa

Marketplace automobile complète : **achat, vente, location, devis garage et Garage+ Pro**.
Code 100 % propriété de MKA.P-MS — aucune dépendance propriétaire, déployable sur n'importe
quelle plateforme (Railway, Render, Fly, VPS…).

Construit à partir du **cahier des charges officiel** (15 sections) et du **modèle de données de
production** (base PostgreSQL unique, 51 tables métier + 57 énumérations).

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS (PWA installable) |
| API | Express + tRPC v11 (typage bout-en-bout) |
| ORM | Drizzle ORM |
| Base de données | PostgreSQL (une seule base) |
| Auth | JWT + Google Identity (OAuth) |
| Paiement | Stripe (multi-devises, abonnements, acomptes, webhooks) |

## Architecture

```
mkapms-web/
├── client/            # Frontend React (Vite)
│   └── src/
│       ├── pages/     # Accueil, Acheter, Louer, Vehicule, Vendre, Devis,
│       │              # Garages, Garage+, Abonnements, Aide, Compte, Admin
│       ├── components/ # Layout, VehicleCard…
│       └── lib/        # client tRPC, contexte d'auth, utils
├── server/            # Backend Express + tRPC
│   ├── routers/       # auth, annonces, garages, devis, favoris,
│   │                  # abonnements, reservations, meta, admin, support
│   ├── schema.ts      # Schéma Drizzle (modèle de données complet)
│   ├── trpc.ts        # Contexte + middlewares RBAC (6 rôles)
│   ├── stripeWebhook.ts
│   └── index.ts       # Serveur (API + sert le frontend en prod)
├── shared/            # Code partagé front/back : plans, devises, rôles
├── drizzle/           # Migrations SQL générées
└── public/            # Manifest PWA, favicon
```

## Démarrage local

```bash
cp .env.example .env      # renseigner DATABASE_URL, JWT_SECRET, STRIPE_*, GOOGLE_*
npm install
npm run db:push           # crée les tables dans la base
npm run seed              # données de démonstration (optionnel)
npm run dev               # client (5173) + serveur (8080)
```

## Build & production

```bash
npm run build             # build client (dist/public) + serveur (dist/server.js)
npm run start             # node dist/server.js (applique les migrations puis démarre)
```

## Déploiement Railway

1. Créer un service à partir de ce dépôt + une base PostgreSQL.
2. Variables d'environnement requises : voir `.env.example`
   (`DATABASE_URL` est fournie automatiquement par le plugin Postgres de Railway).
3. Le `railway.json` configure le build (`npm run build`) et le démarrage
   (`npm run start`). Les migrations Drizzle sont appliquées automatiquement au boot.
4. Healthcheck : `/api/health`.

## Rôles (RBAC)

`user` (particulier) · `pro` · `garage` · `employee` · `society` · `admin` · `super_admin` (direction/PDG).
Les middlewares `protectedProcedure`, `proProcedure`, `adminProcedure`, `directionProcedure`
appliquent les permissions côté serveur.

## Propriété

L'intégralité du code et du modèle de données appartient à MKA.P-MS — Auto Plus Africa (SASU,
SIREN 932 217 896). Aucune licence tierce restrictive.
