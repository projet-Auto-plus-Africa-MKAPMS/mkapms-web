# MKA.P-MS — Master Operating System (MOS)

**Document officiel d'architecture**
**Version** : 1.0 · **Date** : Janvier 2026
**Auteur** : MKA.P-MS · **Statut** : Référence obligatoire pour tous les agents (Cursor, Devin, Emergent, futurs développeurs)

---

## 1. Philosophie fondatrice

**MKA.P-MS n'est pas seulement une plateforme automobile.**

C'est un **Master Operating System (MOS)** — un système d'exploitation d'entreprise mondiale — dont l'automobile est le premier univers métier. D'autres univers viendront ensuite : immobilier, finance, formation, usine, mobilité électrique, batteries, recyclage, etc. Le MOS reste identique ; seuls les moteurs métiers changent.

### Doctrine officielle

> *"La plateforme doit être conçue pour augmenter progressivement son niveau d'automatisation grâce à des moteurs spécialisés, tout en laissant à MKA.P-MS le contrôle des décisions stratégiques et des opérations sensibles."*

### Les 7 principes intangibles

1. **Architecture mondiale** — Conçue dès aujourd'hui pour supporter des millions d'utilisateurs, plusieurs pays, langues, devises et partenaires, sans reconstruction.
2. **Deux moteurs centraux conversationnels** — Le PDG doit pouvoir dialoguer avec eux comme avec un directeur technique.
3. **Automation progressive** — Autonomie sur les tâches répétitives, contrôle humain sur les décisions stratégiques et sensibles. Objectif : autonomie totale immédiate là où c'est possible, sans jamais perdre le contrôle des décisions clés.
4. **Moteurs indépendants** — Chaque univers a son propre moteur. Chaque moteur évolue, se met à jour et se déploie indépendamment.
5. **Language Operating System** — Moteur fondateur obligatoire (traduction interface + annonces + conversations + notifications + formats locaux).
6. **SEO & Visibility Operating System** — Moteur fondateur obligatoire (visibilité Google et moteurs de recherche).
7. **Modèle économique multi-format** — L'architecture doit permettre : abonnement, commission, licence d'exploitation, modèle hybride, contrats d'exploitation temporaires (3/5/10 ans) par univers, sans perdre la propriété globale de la plateforme.

---

## 2. Les deux moteurs centraux

### 2.1 Intelligence & Decision Engine — Le cerveau stratégique

**Rôle** : dialoguer, réfléchir, proposer, préparer les décisions.

**Fonctions obligatoires** :
- Comprendre les conversations naturellement
- Réfléchir avant de répondre (chaîne de raisonnement visible)
- Conserver le contexte multi-session
- Proposer plusieurs solutions et expliquer leurs choix
- Préparer un plan d'action à valider
- Recevoir des ordres du PDG et exécuter les tâches autorisées
- Vérifier le résultat, corriger les erreurs simples
- Apprendre progressivement, dialoguer naturellement avec le PDG et les équipes

**État actuel dans le repo** : `server/smart-engine/` (18 tables, 65 endpoints tRPC, 21 services). Base solide déjà là. À faire évoluer vers la conversation naturelle multi-tours + reasoning + planning.

### 2.2 Autonomous Operations Engine — Le cerveau opérationnel

**Rôle** : exécuter les décisions validées, coordonner les moteurs.

**Fonctions obligatoires** :
- Transformer une décision en plan d'action détaillé
- Exécuter les tâches autorisées
- Coordonner les autres moteurs transversaux et métiers
- Suivre l'avancement en temps réel
- Vérifier les résultats
- Corriger les erreurs simples de manière autonome
- Piloter les workflows métier

**État actuel dans le repo** : partiellement présent via `server/modules/` et `server/smart-engine/services/auto-optimization.ts`. À consolider en moteur dédié.

---

## 3. Moteurs transversaux (Operating Systems)

Chaque moteur est **indépendant**, avec sa propre base, ses propres endpoints, son propre cycle de déploiement.

### 3.1 Country Operating System *(fondateur)*
Réglementation, TVA, taxes, devises, moyens de paiement, formats d'adresse, documents obligatoires, langues disponibles, services activés.

### 3.2 Language Operating System *(fondateur)*
Choix de la langue à l'inscription, langue préférée par utilisateur, traduction automatique de l'interface, des annonces, des conversations, des notifications, formats locaux (date, heure, devise, unités).

### 3.3 Identity Operating System *(fondateur)*
Comptes, authentification, rôles, sessions, sécurité, appareils.

### 3.4 Permission Operating System *(fondateur)*
Droits : visiteurs, particuliers, professionnels, employés, administrateurs, super-administrateurs, partenaires, franchisés.

### 3.5 Payment Operating System
Paiements, abonnements, commissions, remboursements, contrats d'exploitation, partenaires, franchises, licences.

### 3.6 SEO & Visibility Operating System
Métadonnées SEO, sitemaps, robots.txt, données structurées (Schema.org), titres, descriptions, URLs propres, maillage interne, demande d'indexation, surveillance de la visibilité.

### 3.7 Search & Discovery Operating System
Recherche intelligente, filtres, recommandations, recherche vocale (long terme), recherche par image (long terme).

### 3.8 Notification Operating System
Email, SMS, push, WhatsApp, notifications internes, rappels.

### 3.9 Workflow Operating System
Réservation, validation, devis, ventes, paiements, livraison, contrats.

### 3.10 Communication Operating System
Messagerie interne, conversations, appels audio/vidéo (long terme), partage de fichiers.

### 3.11 Knowledge Operating System
Mémoire de l'entreprise : décisions, règles, procédures, guides, apprentissages.

### 3.12 Analytics Operating System
Ventes, réservations, revenus, performances, utilisateurs, pays, moteurs.

### 3.13 Monitoring Operating System
Surveillance : serveurs, bases de données, APIs, moteurs, performances, erreurs.

### 3.14 Deployment Operating System
Versions, préproduction, production, retour arrière, historique des déploiements.

### 3.15 Document Operating System
Devis, factures, contrats, garanties, certificats, rapports.

### 3.16 Integration Operating System
Connexions : Stripe, banques, assurances, ERP, CRM, partenaires, transporteurs, constructeurs.

### 3.17 AI Agent Operating System
Gestion des agents intelligents spécialisés : Agent Garage, Vente, Comptabilité, Marketing, Support, SEO, Paiement, Développement, etc.

### 3.18 Automation Operating System
Observe les habitudes de travail et propose progressivement des automatisations : publier une annonce depuis un dossier véhicule, envoyer les rappels, générer les devis, préparer les contrats, relancer un client, détecter une anomalie, proposer une optimisation. **Ne prend jamais de décision seul** : observe, apprend, automatise uniquement ce qui est explicitement autorisé.

---

## 4. Moteurs métiers (univers exploitables)

Chaque univers métier a son propre moteur, indépendant. Un univers peut être exploité par un partenaire via un contrat d'exploitation temporaire (3, 5 ou 10 ans) selon un modèle (abonnement / commission / licence / hybride).

**Univers automobile** (premiers déployés) :
- Vente · Achat · Dépôt · Location · Garage · Atelier · Carrosserie · Pièces · Pneus · Expertise · Contrôle technique · Dépannage · Livraison · Transport · Assurance · Financement · Publicité · Formation · Comptabilité · Flottes · Constructeurs · Usine · Mobilité électrique · Batteries · Recyclage

**Univers futurs** : Immobilier, Finance, Formation professionnelle, Santé, Agriculture, etc.

---

## 5. Règles d'architecture

1. **Aucun moteur ne prend seul de décision stratégique.** Toujours proposer, jamais imposer.
2. **Chaque moteur est déployable indépendamment.** Un bug dans le moteur SEO ne doit jamais bloquer le moteur Paiement.
3. **Chaque moteur expose une API contractuelle** documentée (tRPC / GraphQL / REST selon les besoins).
4. **Le PDG a droit de veto** sur toute action à conséquence irréversible (paiement, suppression de données, envoi massif).
5. **Best-effort par défaut** : les moteurs auxiliaires (analytics, SEO, notifications) ne doivent jamais bloquer une action utilisateur en cas d'échec.
6. **Idempotence obligatoire** sur les opérations sensibles (paiements, écritures comptables, envoi notifications).
7. **Traçabilité totale** : toute décision d'un moteur est loggée avec son raisonnement et la personne l'ayant validée (si validation humaine).
8. **Zéro suppression sans confirmation** : les moteurs peuvent ajouter, modifier, marquer comme archivé — mais pas supprimer sans validation humaine explicite.
9. **Multi-pays / multi-langue / multi-devise dès l'origine** : aucun code écrit "en dur" pour un pays ou une langue.
10. **Propriété MKA.P-MS** : la logique métier propriétaire n'est jamais externalisée sans contrat clair (LLM tiers autorisé uniquement si les données sensibles restent locales).
11. **Chaque moteur = produit autonome ET collaboratif** : chaque nouveau moteur doit être conçu comme un produit qui fonctionne seul, activable/désactivable/testable/déployable individuellement, mais capable de collaborer avec tous les autres via le MOS (API, événements, contrats clairs). Aucune dépendance forte. Cette règle permet de remplacer, améliorer ou faire évoluer un moteur sans reconstruire le système.
12. **Structure standardisée obligatoire (règle PDG v1.2)** — tout moteur MOS DOIT contenir la même arborescence :
    - `README.md` (contrat public + roadmap)
    - `contract.ts` (types stables — surface publique)
    - `schema.ts` (tables Drizzle isolées, préfixe unique)
    - `service.ts` (logique métier, isolée du transport)
    - `router.ts` (sous-router tRPC branché sur `server/router.ts`)
    - `__tests__/` (au minimum : `contract.test.ts`, `router.test.ts`, `app-router.test.ts`)
    - Endpoint `healthStatus()` normalisé
    - Table `<engine>_audit_log`
    - Bus d'événements typés (`Event` union dans `contract.ts`)
    - Constante `VERSION` semver dans `service.ts`
    Aucun moteur ne peut être mergé sans ces 10 éléments.
13. **Tableau de bord dédié par moteur (règle PDG v1.2)** — chaque moteur DOIT exposer un endpoint `dashboard()` qui remonte : état du moteur, version, santé, erreurs récentes, statistiques métier, historique, événements récents, performances (P50/P95), temps de réponse. Même minimal au début. Ces tableaux se regroupent automatiquement dans le **MOS Control Center**.
14. **Niveau de maturité obligatoire (règle PDG v1.2)** — chaque moteur porte un `maturityLevel` ∈ {`sprint_0_architecture`, `sprint_1_minimal`, `sprint_2_complete`, `sprint_3_automation`, `sprint_4_intelligence`, `sprint_5_optimization`}. Retourné par `meta()` et `dashboard()`. Permet au PDG et aux moteurs centraux de savoir où en est chaque moteur du MOS à tout instant.
15. **Complétude immédiate & évolution de l'existant (règle PDG v1.3)** — tout moteur doit être conçu et livré dans sa forme fonctionnelle complète (audit de l'existant → liste des fonctions manquantes → développement complet → connexion → tests → dashboard → livraison) **avant** de passer au moteur suivant. Lorsqu'une fonctionnalité existe déjà (auth.ts, permission-engine, users, sessions, audit, i18n, currency, kyc, notifications, paiement, annonces, réservations, etc.), elle doit être **conservée, consolidée, intégrée** au moteur final. Interdictions : créer un système parallèle qui fait la même chose, abandonner l'ancien, supprimer des fonctions, dupliquer des dossiers. **Principe** : on conserve, on fusionne, on renforce, on complète. Aucun bouton simulé, aucune fonction TODO, aucun module désactivé sans raison. La seule validation humaine restant obligatoire est **avant l'exécution d'une action réelle sur la plateforme** — jamais pour freiner le développement.

---

## 6. Niveaux d'autonomie

Chaque tâche d'un moteur est classée à l'un des 4 niveaux :

| Niveau | Nom | Description | Exemples |
|---|---|---|---|
| **N0** | Observation | Le moteur observe et rapporte, sans agir | Analytics, Monitoring |
| **N1** | Suggestion | Le moteur propose au PDG, qui valide | Auto-optimization, Recommandations |
| **N2** | Exécution encadrée | Le moteur exécute automatiquement dans un cadre pré-autorisé | Envoi notifications, traductions, purge logs anciens |
| **N3** | Autonomie totale | Le moteur agit seul (réservé aux tâches non stratégiques et réversibles) | Cache warming, indexation SEO, apprentissage KB |

**Aucune tâche N3 sur** : finances, sécurité, données utilisateurs, changements majeurs de la plateforme.

---

## 7. Build Order (plan de construction)

### 🌊 Vague 0 — Finition automobile (en cours)
Terminer les univers automobile actuels : Particulier vente ✅ · Pro vente · Officiel vente · Location (6 sous-univers) · autres univers (Garage, Atelier, etc.).

### Vague 1 — Fondations MOS (à démarrer en parallèle)
Les moteurs fondateurs, dans **cet ordre exact** validé par le PDG (v1.1) :
1. **Identity Operating System** ← *démarré*
2. **Permission Operating System**
3. **Country Operating System**
4. **Language Operating System**

### 🌊 Vague 2 — Visibilité & Communication
4. **Notification Operating System** (unification email/SMS/push/WhatsApp)
5. **Document Operating System** (devis / factures / contrats / garanties)
6. **SEO & Visibility Operating System**
7. **Search & Discovery Operating System**

### 🌊 Vague 3 — Finance & Workflow
8. **Payment Operating System** (consolidation complète)
9. **Workflow Operating System**
10. **Integration Operating System** (Stripe, banques, assurances, ERP, CRM)

### 🌊 Vague 4 — Autonomie
11. **Automation Operating System** (observe & propose)
12. **AI Agent Operating System** (chapeaute les agents spécialisés)

### 🌊 Vague 5 — Observabilité globale
13. **Analytics Operating System** (consolidé)
14. **Monitoring Operating System**
15. **Deployment Operating System**

### 🌊 En continu — Cerveaux centraux
- **Intelligence & Decision Engine** : renforcement continu du `smart-engine` existant, avec évolution vers conversation naturelle multi-tours et planning.
- **Autonomous Operations Engine** : extraction en moteur dédié, coordination des autres moteurs.

---

## 8. État actuel — Moteurs déjà existants (en germe)

| Moteur MOS | Emplacement actuel | Maturité |
|---|---|---|
| Intelligence & Decision | `server/smart-engine/` (65 endpoints, 21 services) | 🟢 Solide, à étendre |
| Permission | `server/permission-engine/` | 🟡 Basique, à consolider |
| Redirection / Routing | `server/redirection-engine/` | 🟡 Fonctionnel |
| Identity | `server/routers/auth.ts` (JWT + Google OAuth) | 🟢 Fonctionnel |
| Payment (embryon) | `server/routers/wallet.ts`, Stripe partiel | 🟠 Fragmentaire |
| Communication | `server/routers/messagerie.ts` | 🟡 Basique |
| Analytics (embryon) | Tab "Comportement" du Control Center | 🟠 Embryon |
| Knowledge | `server/smart-engine/services/knowledge-base.ts` | 🟢 Solide |
| Workflow (embryons) | `server/modules/` (VO, dépôt-vente, KYC, dépannage…) | 🟠 Fragmentaire |

## 9. Moteurs à créer

**Absents totalement** :
- Country Operating System
- Language Operating System *(urgent)*
- Notification Operating System
- Document Operating System
- SEO & Visibility Operating System *(urgent — bug d'indexation Google)*
- Search & Discovery Operating System
- Automation Operating System
- AI Agent Operating System
- Monitoring Operating System
- Deployment Operating System
- Integration Operating System

---

## 10. Règles pour les agents (Cursor, Devin, Emergent, futurs devs)

1. **Tout développement se réfère à ce document.**
2. **Aucune fonctionnalité n'est ajoutée hors moteur.** Si une fonctionnalité n'appartient à aucun moteur existant, poser la question : "à quel Operating System appartient-elle ?" avant de coder.
3. **Zéro suppression** — uniquement des ajouts. Les changements se font par extension ou versioning, pas par remplacement destructif.
4. **Chaque PR mentionne le(s) moteur(s) touché(s).**
5. **Cohabitation avec les autres agents obligatoire** : aucun agent ne "monopolise" un moteur. Les fichiers touchés par une PR doivent être minimaux pour éviter les conflits.
6. **Propriété MKA.P-MS** : toute intégration externe (LLM, API tierce) doit être documentée et justifiée.
7. **Best-effort** : les moteurs auxiliaires ne bloquent jamais l'utilisateur.

---

## 11. Modèle économique — Rappel

L'architecture doit permettre à MKA.P-MS de :
- Exploiter en propre certains univers
- Louer temporairement d'autres univers à des partenaires (contrats 3/5/10 ans)
- Combiner abonnement + commission + licence + modèles hybrides
- Rester propriétaire globale de la plateforme, quelle que soit la répartition d'exploitation

Chaque moteur métier doit donc exposer :
- Sa propre configuration de partenariat (contrat actif, période, mode économique)
- Ses propres métriques financières
- Une API d'exploitation qui permet à un partenaire de piloter uniquement son univers sans accéder au reste

---

## 12. Versioning de ce document

- **v1.0 (Janvier 2026)** — Document fondateur MOS · Doctrine validée par le PDG.

Toute modification majeure nécessite une nouvelle version + une PR dédiée + validation PDG.

---

**Fin du document.**

*"MKA.P-MS n'est pas un site web. C'est un système d'exploitation d'entreprise mondiale."*
