# Activation Google Merchant Center — MKA.P-MS

Guide court pour connecter un vrai compte Google Merchant Center au Google Product Engine.

## 🎯 Vue d'ensemble

Le connecteur est **déjà entièrement codé** dans le repo :

| Module | Fichier |
|---|---|
| Connecteur Content API v2.1 | `server/product-engine/merchant-center.ts` |
| Google Product Engine | `server/product-engine/service.ts` |
| Écran PDG | `client/src/pages/CentreProduitsGoogle.tsx` |
| Tests réels (fetch injecté, aucun réseau) | `server/product-engine/__tests__/merchant-center.test.ts` |

**Il ne manque que le compte Merchant Center réel et ses identifiants.** Une fois les deux variables d'environnement injectées, chaque fiche produit éligible (pièces, hors véhicules — voir doctrine, les véhicules restent exclus des fiches gratuites Merchant Center) est réellement soumise à Google à chaque dépôt, modification ou vente, et son vrai statut (approuvé / rejeté / en attente) est relevé, jamais supposé.

## 🔧 Variables d'environnement requises

| Variable | Description | Où l'obtenir |
|---|---|---|
| `GOOGLE_MERCHANT_ACCOUNT_ID` | Identifiant numérique du compte Merchant Center (ex. `123456789`) | https://merchants.google.com/ → Paramètres → Informations sur l'entreprise |
| `GOOGLE_MERCHANT_CREDENTIALS` | JSON complet d'un compte de service Google Cloud, sur une seule ligne | Google Cloud Console → IAM & Admin → Comptes de service |

**Ne JAMAIS coller ces valeurs dans une conversation ou un fichier committé.** À injecter uniquement comme variables d'environnement Railway du service `mkapms-app`.

## 🚦 Étapes d'activation (actions humaines uniquement)

### 1. Créer ou identifier le compte Merchant Center
- Un compte Google Merchant Center existant pour Auto Plus Africa, ou en créer un sur https://merchants.google.com/.
- **Le domaine `mkapms.co` (ou le domaine réellement utilisé) doit être vérifié et revendiqué** dans Merchant Center (Search Console) — Google refuse toute soumission tant que ce n'est pas fait.

### 2. Créer un compte de service Google Cloud
1. Google Cloud Console → sélectionner (ou créer) le projet associé.
2. Activer l'API **Content API for Shopping**.
3. IAM & Admin → Comptes de service → Créer un compte de service.
4. Créer une clé JSON pour ce compte de service — c'est le contenu exact à mettre dans `GOOGLE_MERCHANT_CREDENTIALS`.
5. Dans Merchant Center → Paramètres → Accès aux comptes → ajouter l'adresse e-mail du compte de service (`...@...iam.gserviceaccount.com`) comme utilisateur **Admin** ou **Standard**.

### 3. Injecter les variables dans Railway
Service `mkapms-app`, environnement `production` → Variables → ajouter `GOOGLE_MERCHANT_ACCOUNT_ID` et `GOOGLE_MERCHANT_CREDENTIALS` (le JSON entier, sur une ligne).

### 4. Vérifier la connexion
Ouvrir l'écran **Produits Google & Merchant** (Direction/PDG) et cliquer sur « Relire ». L'encadré « Merchant Center non connecté » disparaît dès que les deux variables sont valides ; chaque fiche éligible relue affiche ensuite son vrai statut (approuvé / en attente / rejeté avec le motif exact de Google), plus jamais un état supposé.

## 🔒 Sécurité

⚠️ **Le JSON du compte de service ne doit JAMAIS transiter par :**
- Cette conversation ou toute conversation avec un agent
- Un email
- Un fichier committé dans le dépôt
- Une capture d'écran partagée

Si la clé est exposée par mégarde, **révoquez-la immédiatement** dans Google Cloud Console → IAM & Admin → Comptes de service → supprimer la clé compromise et en générer une nouvelle.

## ℹ️ Ce que le connecteur fait réellement (et ce qu'il ne fait jamais)

- Soumet chaque fiche éligible (`server/product-engine/eligibility.ts`) au Content API v2.1, avec le pays et la langue réels de la fiche (jamais `FR`/`fr` en dur).
- Relève le vrai statut Google (`productstatuses`) après soumission — jamais une approbation supposée.
- Un rejet Google, une panne réseau ou une authentification refusée sont distingués honnêtement (`rejete` / `echec_technique` / `en_attente`) — jamais confondus, jamais masqués.
- Les véhicules ne sont jamais soumis : Google les exclut des fiches gratuites Merchant Center, le moteur les redirige vers le tuyau annonces (SEO, données structurées de véhicule).
