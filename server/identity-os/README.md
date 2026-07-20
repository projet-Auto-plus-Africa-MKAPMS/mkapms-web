# Identity Operating System (Identity OS)

**Statut** : Sprint 3 — Complétude fonctionnelle ✅ · **Version** : 0.4.0
**Maturité** : `sprint_3_automation` (règle MOS #14)
**Rôle** : Moteur central de gestion des identités MKA.P-MS
**Principe** : Autonome ET collaboratif (règles MOS #11/#12/#13/#14/#15)

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

## 🔌 API contractuelle (Sprint 3 — 34 procédures livrées ✅)

Namespace tRPC : `identity.*` — surface complète conforme à la règle MOS #15.

**Métadonnées & santé** (5)
```
identity.meta                             → nom, version, maturité, contrat
identity.healthStatus                     → statut normalisé (règle MOS #11)
identity.types                            → 9 types + rôles par défaut
identity.dashboard                        → tableau de bord dédié (règle #13)
identity.controlCenterFeed                → feed standard MOS
```

**Comptes & authentification** (7)
```
identity.register({ email, password, name, phone?, accountType })
identity.login({ email, password, mfaCode? })    → gère MFA + lockout auto
identity.logout()
identity.oauthGoogle({ idToken })                → bridge auth.googleLogin
identity.refreshToken()                          → réémet un JWT frais
identity.changePassword({ currentPassword, newPassword })
identity.me                                      → identité courante + contexte
```

**Vérifications** (4)
```
identity.email.sendVerification()                → envoie lien email
identity.email.verify({ token })                 → confirme + sync users.emailVerified
identity.phone.sendVerification({ phone })       → envoie OTP 6 chiffres
identity.phone.verify({ code })                  → confirme + sync users.phoneVerified
```

**Récupération de compte** (2)
```
identity.password.forgot({ email })              → public, anti-énumération
identity.password.reset({ token, newPassword })  → public, TTL 30 min
```

**MFA TOTP + backup codes** (4)
```
identity.mfa.status                              → activated: bool
identity.mfa.setup                               → secret + QR (otpauth://) + 10 backup codes
identity.mfa.enable({ code })                    → active après vérification 1er code
identity.mfa.disable({ currentPassword })        → désactive après confirmation mdp
```

**Sessions, appareils, anomalies** (5)
```
identity.sessions.list                           → sessions actives
identity.sessions.revoke({ sessionId })          → révocation ciblée
identity.session.touch({ sessionId })            → refresh lastActiveAt
identity.devices.list                            → sessions groupées par appareil
identity.anomalies.recent({ limit })             → tentatives échec (admin)
```

**Compte** (1)
```
identity.account.archive({ reason })             → soft delete + révocation sessions
```

**Agents IA** (3)
```
identity.aiAgents.create({ label, purpose, scopes })  → clé API (affichée 1 fois)
identity.aiAgents.list                                 → agents actifs
identity.aiAgents.revoke({ agentId })                  → révoque
```

**Audit + événements** (3)
```
identity.audit.recent({ limit })                 → événements de l'identité
identity.audit.all({ limit })                    → audit global (admin)
identity.reportEvent({ ... })                    → publication inter-moteurs (admin)
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

**Sprint 3 livré (v0.4.0, maturité `sprint_3_automation`)** — complétude fonctionnelle (règle MOS #15) :
- **34 procédures** tRPC actives dans `identity.*` — de la simple lecture métadonnées à la MFA TOTP + gestion agents IA.
- **6 nouvelles tables `identity_*`** (email verifications, phone verifications, password resets, MFA secrets, login attempts, AI agents) — migration idempotente `drizzle/0035_identity_os_complete.sql`.
- **Crypto pure Node** : TOTP RFC 6238 (HMAC-SHA1, ±1 window), tokens opaques SHA-256, OTP numériques, backup codes, clés d'agents IA. Aucune dépendance externe (`speakeasy`, `otplib` non requis).
- **Bridge auth → identity non destructif** : login/register/logout/OAuth Google fonctionnent en parallèle de `auth.*` legacy (6 procédures conservées).
- **Sécurité renforcée** : lockout automatique après 5 échecs / 15 min (par email + par IP), audit exhaustif de chaque tentative, détection anomalies exposée aux admins.
- **Synchronisation legacy** : chaque activation MFA / vérification email / vérification phone / changement mdp est répercutée dans la table `users` legacy — zéro fuite de cohérence.
- **Dashboard dédié** (`identity.dashboard`) + feed standard MOS (`identity.controlCenterFeed`) pour le futur Control Center.
- **637 procédures totales** dans l'appRouter, tests unitaires 100 % verts (crypto + contract + router + app-router).

Méthode PDG appliquée (règle MOS #15) : audit → gap analysis → développement complet → connexion → tests → livraison.

## 📅 Sprints (règle MOS #14)

- **Sprint 0** ✅ — Squelette, contrat API, doctrine
- **Sprint 1** ✅ — Tables `identity_*`, service, router tRPC, endpoint Health Status
- **Sprint 2** ✅ — Bridge login/register/logout, Dashboard, Control Center Feed, MaturityLevel
- **Sprint 3** ✅ (livré) — Complétude fonctionnelle : OAuth Google, MFA TOTP, backup codes, vérifications email/phone, password reset, changePassword, sessions/devices, anomalies, agents IA, archivage compte
- **Sprint 4** — Intelligence : détection intelligente de fraude (patterns), suggestion d'upgrade type, session risk score
- **Sprint 5** — Optimisation continue : cache identités, sessions distribuées, WebAuthn/passkeys

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
