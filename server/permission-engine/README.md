# Permission Operating System (Permission OS)

**Statut** : Sprint 3 — Complétude fonctionnelle ✅ · **Version** : 0.3.0
**Maturité** : `sprint_3_automation` (règle MOS #14)
**Rôle** : Moteur central de gestion des permissions MKA.P-MS
**Principe** : Autonome ET collaboratif (règles MOS #11/#12/#13/#14/#15)

Ce moteur **prolonge** `server/permission-engine/` existant. Il conserve à 100 % les 8 endpoints legacy (matrice de rôle + accès temporaires PDG + journal de sécurité) et **ajoute** un second niveau contextuel intelligent conformément à la volonté PDG.

---

## 🎯 Deux niveaux (contrat PDG)

**Niveau 1 — Permissions classiques** (existant, source de vérité `shared/permissions.ts`)
Matrice `role → modules[]`. Chaque module absent d'un rôle est refusé pour ce rôle.

**Niveau 2 — Permissions contextuelles intelligentes** (ajouté Sprint 3)
Règles dynamiques évaluées à chaque appel :
- Rôle · Type d'identité · Pays · Univers · Abonnement · Contrat
- Ancienneté (jours) · Device trusted · Score de risque (0-100)
- MFA · Email/phone vérifié · Fenêtre horaire (jours + heures)

Un partenaire Comptabilité n'accèdera JAMAIS aux paramètres Paiement, même s'il est administrateur de son univers → règle de politique explicite avec `effect=deny`.

## 🔀 Ordre de résolution

```
1. Délégation active (identity → identity, module compatible)  → allow
2. Grant temporaire (permTemporaryGrants, non expiré)          → allow
3. Politique DENY (tri par priorité)                            → deny
4. Matrice de rôle (shared/permissions.ts)                      → allow
5. Politique ALLOW (tri par priorité)                           → allow
6. Défaut                                                       → deny
```

Chaque décision est journalisée dans `perm_resolution_log` + retournée avec **explication FR lisible** (règle PDG : « expliquer les refus »).

## 🔌 API contractuelle (24 procédures)

Namespace tRPC : `permissionEngine.*`

**Endpoints EXISTANTS conservés (8)**
```
myAccess · check · logDenied · journal · stats
grants · grant · revokeGrant
```

**AJOUTÉS Sprint 3 — Standards MOS**
```
meta                    → nom, version, maturité (règle #14)
healthStatus            → état standard (règle #11)
controlCenterFeed       → feed MOS Control Center (règle #13)
dashboard               → tableau de bord dédié (règle #13)
```

**AJOUTÉS Sprint 3 — Résolution intelligente**
```
resolve   ({ module, action, context? })   → décision + explication FR
explain   ({ module, action, context? })   → alias UI
simulate  ({ role, module, action, ...  }) → dry-run admin (aucune écriture)
```

**AJOUTÉS Sprint 3 — Politiques (CRUD)**
```
policies.list   ({ activeOnly? })
policies.create ({ name, module, action, effect, priority, conditions, ... })
policies.update ({ id, patch })
policies.disable({ id })    (jamais de suppression — doctrine MOS #8)
```

**AJOUTÉS Sprint 3 — Délégations (identité → identité)**
```
delegations.create ({ fromIdentityId, toIdentityId, module, action, expiresAt? })
delegations.list   ({ identityId, direction: 'from'|'to'|'both' })
delegations.revoke ({ id, reason })
```

**AJOUTÉS Sprint 3 — Trace de résolution**
```
resolutions.recent  ({ limit, onlyDenied }) → 100 dernières décisions
resolutions.counters({ sinceMin })          → allowed/denied/total
```

## 🗄️ Tables ajoutées (migration `drizzle/0036_permission_engine_complete.sql`)

100 % additives — les tables existantes `perm_security_log` et `perm_temporary_grants` restent intactes.

- `perm_policies` — règles contextuelles (JSONB conditions)
- `perm_delegations` — délégations identité → identité
- `perm_resolution_log` — journal de chaque décision
- `perm_health_log` — historique santé

## 📅 Sprints (règle MOS #14)

- **Sprint 1** (legacy) ✅ — Matrice de rôle, grants temporaires, journal de sécurité
- **Sprint 3** (Sprint 2 & 3 fusionnés — règle #15) ✅ — Contract, Intelligence contextuelle, Dashboard, Health Status, Feed, Politiques CRUD, Délégations, Simulate/Explain
- **Sprint 4** — Intelligence : suggestion de règles à partir des logs, scoring risque dynamique branché sur Smart Engine
- **Sprint 5** — Optimisation continue : cache LRU des décisions, index composites, pré-calcul menus dynamiques

## 🧪 Tests

Tous en `server/permission-engine/__tests__/` — logique pure, aucun besoin de DB :
- `contract.test.ts` : métadonnées, maturité, version semver
- `router.test.ts` : surface complète (24 procédures), legacy conservé
