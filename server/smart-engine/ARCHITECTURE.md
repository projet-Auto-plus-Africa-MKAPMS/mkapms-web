# Architecture & Orchestration des moteurs MKA.P-MS (Partie 14)

Ce document décrit **comment les moteurs de MKA.P-MS sont architecturés, isolés et
orchestrés** autour du projet principal. Il sert de référence pour tout agent ou
développeur qui souhaite comprendre le système **avant** d'y toucher.

> Règle d'or : **on ajoute, on n'enlève pas.** Chaque moteur est un module
> **isolé et additif**, connecté au projet principal via un **sous-router tRPC**
> et des **tables préfixées**. Aucun moteur ne modifie les tables métier
> existantes, et **aucune décision importante n'est appliquée sans validation
> humaine** (PDG / Directeur / admin autorisé).

---

## 1. Vue d'ensemble

```
                         ┌─────────────────────────────┐
                         │        Projet principal      │
                         │   (client React + server     │
                         │    Express + tRPC + Drizzle) │
                         └──────────────┬──────────────┘
                                        │  router.ts (assemble les sous-routers)
        ┌───────────────┬──────────────┼──────────────┬────────────────┐
        │               │              │              │                │
   ┌────▼─────┐   ┌─────▼──────┐  ┌────▼─────┐  ┌─────▼──────┐   ┌─────▼──────┐
   │  Smart   │   │ Permission │  │ Redirect │  │    Core    │   │  (futurs)  │
   │  Engine  │   │   Engine   │  │  Engine  │  │   Engine   │   │  moteurs   │
   └────┬─────┘   └─────┬──────┘  └────┬─────┘  └─────┬──────┘   └────────────┘
        │ smart_*        │ permission_* │ redir_*     │ (staging ~2 mois)
        └────────────────┴──────────────┴─────────────┘
                 Tables ISOLÉES, préfixées, additives
```

Chaque moteur :

- possède ses **propres tables** (préfixe dédié) ;
- expose ses fonctions via un **sous-router tRPC** monté dans `server/router.ts` ;
- respecte les **permissions** (rôles + propriété) ;
- **journalise** les actions importantes ;
- laisse le **contrôle final à l'humain**.

---

## 2. Les moteurs connectés

### 2.1 Smart Engine (`server/smart-engine/`)
Le cerveau observationnel et analytique. **Il analyse, propose, prépare et
signale — il n'exécute jamais seul.**

- Tables : préfixe `smart_` (recherches, mémoire, recommandations, doublons,
  empreintes photo, comptes suspects, alertes, journal d'activité, santé,
  enseignements, connaissances, optimisations, registre des développements,
  **audits qualité** (P12), **préproduction/staging** (P13)…).
- Sous-router : `smartEngine` (accès **PDG** pour le centre de contrôle).
- Centre de contrôle : `client/src/pages/SmartEngine/ControlCenter.tsx`
  (onglets : Vue d'ensemble, État plateforme, **Qualité**, **Préproduction**,
  Alertes, Apprentissage, Connaissances, Auto-optimisation, Moteurs connectés,
  Développements, Doublons, Comptes suspects, Annonces, Santé, Journal, Avis…).

### 2.2 Permission Engine (`server/permission-engine/`)
Contrôle **qui peut voir/faire quoi** : pages, boutons, APIs, données.

- Menus dynamiques, contrôle rôle + propriété, journal des accès,
  accès temporaires accordés par le PDG.
- Tables : préfixe `permission_`. Sous-router : `permissionEngine`.

### 2.3 Redirection Engine (`server/redirection-engine/`)
Résout une **clé de redirection** vers une destination, pour éviter les liens
en dur (ex : boutons Acheter / Réserver / Contacter le vendeur des pages
produit).

- Journalise les résolutions ; règles activables/désactivables par le PDG.
- Tables : préfixe `redir_`. Sous-router : `redirectionEngine`.

### 2.4 Core Engine (`server/modules/coreEngine.ts`)
Le **« nouveau projet »** construit à côté, destiné à être intégré plus tard
(phase de staging d'environ deux mois). Indépendant, additif, sans modification
des tables existantes.

15 centres prévus : Services, Recommandation, Fournisseurs, Distribution,
Formation, B2B, Statistiques intelligentes, Documents, Partenaires, Open API,
Automatisation, Workflow, Recherche mondiale, Expansion, Écosystème.

- Sous-router : `coreEngine`.

---

## 3. Orchestration : comment ça travaille ensemble

1. **Observation** — le Smart Engine observe l'usage réel (recherches, boutons,
   annonces, santé…) de façon **anonyme et en lecture seule**.
2. **Analyse & scoring** — moteur qualité (P12), santé (P9), risque, doublons.
3. **Détection & signalement** — alertes à 4 niveaux (🟢🟡🟠🔴).
4. **Proposition & préparation** — le système prépare une évolution.
5. **Préproduction (P13)** — l'évolution passe en staging :
   `brouillon → en_test → attente_validation`.
6. **Validation humaine** — le PDG/Directeur/admin **approuve ou rejette**.
7. **Intégration** — seulement **après accord**, l'évolution est marquée
   `intégré`. Le système **ne déploie jamais directement en production**.

Le Permission Engine s'assure à chaque étape que seul un rôle autorisé peut
consulter/valider ; le Redirection Engine garde les liens cohérents ; le Core
Engine héberge les nouvelles briques jusqu'à leur intégration.

---

## 4. Conventions à respecter pour ajouter un moteur

1. Créer un dossier isolé `server/<nom>-engine/` (`index.ts`, `schema.ts`,
   `router.ts`, `services/`).
2. Préfixer **toutes** les tables (`<nom>_...`) — ne jamais modifier une table
   métier existante.
3. Écrire une **migration SQL manuelle** dans `drizzle/NNNN_*.sql` et ajouter
   l'entrée correspondante dans `drizzle/meta/_journal.json`
   (le repo n'utilise pas `drizzle-kit generate` au-delà de la migration 0015).
4. Monter le sous-router dans `server/router.ts`.
5. Exporter le schéma isolé depuis `server/schema.ts`
   (`export * from "./<nom>-engine/schema"`).
6. Protéger les procédures avec le bon niveau (`protectedProcedure`,
   `adminProcedure`, `pdgProcedure`).
7. **Journaliser** les actions importantes (`logActivity`).
8. **Aucune action métier automatique** : analyser / proposer / préparer /
   signaler, puis laisser l'humain valider.

---

## 5. Garde-fous (rappel — voir aussi Partie 15)

Le système intelligent **ne doit jamais, seul** :
supprimer un compte, supprimer une annonce sensible, modifier un prix, modifier
un abonnement, modifier un contrat, prendre une décision financière importante,
ou déployer directement en production.

Il peut **analyser, proposer, préparer et signaler**. **L'humain valide.**
