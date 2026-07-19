# Identity Operating System (Identity OS)

**Statut** : Sprint 1 — Fondations DB + tRPC ✅ · **Version** : 0.2.0
**Rôle** : Moteur central de gestion des identités MKA.P-MS
**Principe** : Autonome ET collaboratif (règle MOS #11)

---

## 🎯 Mission

L'Identity OS est le **socle de tous les autres moteurs**. Il gère toutes les identités qui interagissent avec MKA.P-MS, humains comme machines.

## 👥 Les 9 types d'identité

| # | Type | Description | Exemple |
|---|---|---|---|
| 1 | **Visitor** | Non authentifié — parcourt le site public | Utilisateur non connecté |
| 2 | **User** | Compte particulier de base | Client qui achète/loue |
| 3 | **Pro** | Compte professionnel vérifié | Garagiste, concessionnaire, loueur pro |
| 4 | **Partner** | Partenaire commercial contractualisé | Assureur, banque, constructeur |
| 5 | **Franchisee** | Exploitant local d'un univers ou d'une zone | Franchise MKA.P-MS à Abidjan |
| 6 | **Universe Operator** | Exploite un univers métier sous contrat 3/5/10 ans | Loueur exploitant "Location Africa" |
| 7 | **Employee** | Salarié MKA.P-MS interne | Support, développeur, opérations |
| 8 | **Admin / Super Admin / PDG** | Décisionnaires MKA.P-MS | Fondateur, directeurs |
| 9 | **AI Agent** | Agent IA futur (Agent Garage, Agent SEO, etc.) | Agent Comptabilité |

## 🔑 Fonctions clés

- **Authentification** : email/password, OAuth Google, futurs (Apple, phone OTP)
- **Rôles** : chaque identité peut porter 1 ou plusieurs rôles
- **Sessions** : gestion multi-device, révocation individuelle
- **Sécurité** : brute force protection, MFA (à venir), audit trail
- **Appareils** : liste des devices actifs par identité
- **Contexte** : chaque identité connaît son pays, sa langue, ses permissions actives

## 🔌 API contractuelle (Sprint 1 — livrée ✅)

Namespace tRPC : `identity.*`

```
identity.meta                             → métadonnées moteur (nom, version, contrat)
identity.healthStatus                     → statut normalisé (règle MOS #11)
identity.me                               → identité courante + rôles + contexte
identity.types                            → catalogue des 9 types + rôles par défaut
identity.sessions.list()                  → sessions actives (multi-device)
identity.sessions.revoke({ sessionId })   → révocation ciblée
identity.audit.recent({ limit })          → événements audit de l'identité courante
identity.audit.all({ limit })             → audit global (Direction)
identity.reportEvent(...)                 → publication d'événement inter-moteurs (admin/serveur)
```

**À venir Sprint 2** :
```
identity.login({ email, password })       → session (bascule depuis auth.login)
identity.register({ type, ...fields })    → nouvelle identité
identity.loginOAuth({ provider, token })  → session OAuth
identity.upgradeType({ from, to })        → validation admin
identity.mfa.enable / disable / verify    → multi-facteur
identity.devices.list                     → devices connus
```

## 📡 Événements émis (pour les autres moteurs)

- `identity.created` — nouvelle identité créée
- `identity.upgraded` — passage d'un type à un autre (ex: User → Pro)
- `identity.suspended` / `identity.reactivated`
- `identity.session.started` / `identity.session.ended`
- `identity.security.alert` — tentative suspecte détectée

## 🤝 Collaboration avec les autres moteurs

- **Permission OS** ← consomme les rôles pour calculer les droits
- **Country OS** ← utilise le pays de l'identité pour les règles locales
- **Language OS** ← utilise la langue préférée
- **Notification OS** ← utilise les canaux de contact de l'identité
- **Audit / Monitoring** ← consomme les événements de sécurité

## 🏗️ État actuel

**Sprint 1 livré** — tables `identity_identities`, `identity_sessions`, `identity_audit_log`, `identity_health_log` (migration `drizzle/0034_identity_os.sql`). Router tRPC `identity.*` branché sur l'appRouter avec 9 procédures. **Zéro modification** de la table legacy `users` — l'Identity OS s'y branche via `legacy_user_id` (référence molle) pour une migration progressive sans casse.

## 📅 Sprints

- **Sprint 0** ✅ — Squelette, contrat API, doctrine
- **Sprint 1** ✅ (livré) — Tables `identity_*`, service, router tRPC, endpoint Health Status
- **Sprint 2** — Bascule login/register/logout de `auth.ts` vers `identity.*`, MFA, gestion appareils
- **Sprint 3** — Support AI Agent identity (compte machine pour agents IA)

## 🔒 Règles de sécurité obligatoires

1. Mots de passe : bcrypt cost ≥ 12
2. Session tokens : rotation à chaque login, expiration configurable par type
3. Rate limiting sur login (5 tentatives / 15 min / IP)
4. Audit trail complet des changements de rôles
5. Zéro suppression réelle : les identités sont soft-deleted (statut `archived`)
6. Passage entre types (User→Pro) nécessite validation Admin

## ⚙️ Configuration

Chaque type d'identité peut être activé/désactivé par pays (via Country OS). Exemple : les identités "Franchisee" ne sont activées qu'en France, Côte d'Ivoire et Sénégal en 2026.

---

*Ce document est le contrat public de l'Identity OS. Toute évolution majeure nécessite une PR dédiée + validation PDG.*
