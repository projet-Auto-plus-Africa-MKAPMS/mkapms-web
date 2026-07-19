# MKA.P-MS — Environnements Développement / Staging / Production

> Phase 1 — Fondations, sujet 3 du cahier des charges « Architecture Multi-Moteurs ».
> Objectif : documenter les trois environnements et le cycle d'intégration d'un
> moteur, afin qu'un moteur ne soit **jamais** testé directement en production.

## Principe

> **La plateforme publique ne doit jamais devenir une zone de test.**

Chaque moteur (voir le **Registre des Moteurs**, `server/engine-registry/`) traverse
trois environnements avant son intégration définitive :

| Environnement | Rôle | Base de données | Public |
|---------------|------|-----------------|--------|
| **Développement** | Écriture du code, tests locaux | base locale/jetable | non |
| **Staging (préproduction)** | Surveillance plusieurs semaines/mois, validation humaine | base de staging séparée | non (accès équipe) |
| **Production** | Plateforme réelle (.fr/.com/.pro/.site) | base de production | oui |

## Variables d'environnement

Les variables sont décrites dans `.env.example` (jamais de secret réel dans le dépôt).
Différences clés par environnement :

- `NODE_ENV` : `development` | `production`
- `DATABASE_URL` : une base **distincte** par environnement (dev ≠ staging ≠ prod)
- `PUBLIC_URL` / `APP_URL` : domaine de l'environnement
- Clés prestataires (Stripe, OAuth) : jeux **de test** en dev/staging, jeux **réels** en production

> Les secrets réels ne sont jamais stockés dans GitHub, le README ni un fichier
> Markdown. Ils sont fournis par l'infrastructure d'hébergement.

## État d'un moteur (piloté depuis le Registre)

Chaque moteur porte un `state` dans `engine_registry` :

- `active` — en service en production ;
- `staging` — en préproduction, sous surveillance ;
- `read_only` — lecture seule (aucune écriture) ;
- `maintenance` — indisponible temporairement ;
- `disabled` — inactif (pas encore intégré ou désactivé).

Le PDG modifie l'état via `engineRegistry.setState` (action **journalisée** dans
`engine_admin_log`). Un moteur `disabled` ne reçoit aucun événement.

## Cycle d'intégration d'un moteur

Repris du cahier des charges (§2) et appliqué via le Registre :

1. Analyse du projet existant.
2. Création du moteur isolé (`server/<nom>-engine/`).
3. Création de ses tables préfixées (`<nom>_*`).
4. Connexion contrôlée au projet principal (sous-router tRPC).
5. Connexion au Core Engine (enregistrement dans le registre).
6. Connexion au Smart Engine (remontée des signaux).
7. Connexion au Permission Engine (matrice de permissions obligatoire).
8. Connexion au Redirection Engine (clés centralisées).
9. Tests automatiques.
10. Tests de non-régression.
11. Tests de charge progressifs (100 → 1 000 → 5 000 → 10 000 → 50 000).
12. Mise en **staging** (`state = staging`).
13. Surveillance pendant plusieurs semaines/mois.
14. Validation humaine (PDG / Direction).
15. Intégration définitive (`state = active`) après stabilité confirmée.
16. Conservation d'une possibilité de **retour arrière** (`state = disabled`, migrations réversibles).

## Migrations

- Migrations Drizzle **additives** et numérotées (`drizzle/NNNN_*.sql`), une par moteur.
- Jamais de `DROP` / `ALTER` destructif sur les tables existantes.
- Idempotentes (`CREATE TABLE IF NOT EXISTS`) — appliquées au démarrage.
- Appliquées d'abord en dev, puis staging, puis production.

## Retour arrière

- Désactivation d'un moteur : `engineRegistry.setState(name, "disabled")` — sans supprimer ses tables.
- Toute migration doit être réversible ; conserver un snapshot avant intégration définitive.

## Centre de contrôle PDG (à venir — Phase 2)

Un portail réservé à la Direction affichera, pour chaque moteur : état, version,
santé, dépendances, événements et alertes, avec les commandes activer /
désactiver / lecture seule / maintenance / retour arrière. Il s'appuiera sur le
Registre des Moteurs livré en Phase 1.
