# Identity Operating System (Identity OS)

**Statut** : Sprint 0 — Fondations · **Version** : 0.1
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

## 🔌 API contractuelle (à implémenter Sprint 1)

Namespace tRPC : `identity.*`

```
identity.me()                             → identité courante + rôles + contexte
identity.login({ email, password })       → session
identity.loginOAuth({ provider, token })  → session
identity.logout()
identity.register({ type, ...fields })    → nouvelle identité
identity.updateProfile({ ...fields })     → mise à jour
identity.sessions.list()                  → sessions actives (multi-device)
identity.sessions.revoke({ sessionId })   → révocation ciblée
identity.devices.list()                   → devices connus
identity.audit.recent({ limit })          → événements de sécurité récents
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

**Partiellement présent** dans `server/routers/auth.ts` : login/register/OAuth Google/JWT. À consolider dans un moteur autonome sous `server/identity-os/`.

## 📅 Sprints

- **Sprint 0** ✅ (cette PR) — Squelette, contrat API, doctrine
- **Sprint 1** — Implémentation des endpoints, migration table `identities` avec type + rôles + audit
- **Sprint 2** — MFA, gestion appareils, révocation session ciblée
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
