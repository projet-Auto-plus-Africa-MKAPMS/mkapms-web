# Activation Stripe — MKA.P-MS

Guide court pour connecter votre compte Stripe à MKA.P-MS via la plateforme Emergent.

## 🎯 Vue d'ensemble

L'infrastructure Stripe est **déjà entièrement codée** dans le repo :

| Module | Fichier |
|---|---|
| Client Stripe | `server/lib/stripe.ts` |
| Payment Engine | `server/payment-engine/` |
| Webhook | `server/stripeWebhook.ts` (route `/api/stripe/webhook`) |
| Endpoint santé | `GET /api/stripe/health` |
| Abonnements | `server/routers/abonnements.ts` |
| Portefeuille | `server/modules/wallet.ts` |
| Finance+ | `server/modules/financeplus.ts` |
| Réservations payées | `server/routers/reservations.ts` |
| Page Abonnements | `client/src/pages/Abonnements.tsx` |
| Page Paiements | `client/src/pages/comptabilite/Paiements.tsx` |
| Catalogue de plans | `shared/plans.ts` |

**Il ne manque que la clé Stripe active.** Une fois les variables d'environnement injectées, tout fonctionne.

## 🔧 Variables d'environnement Stripe

| Variable | Description | Où la trouver |
|---|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète serveur (`sk_test_…` ou `sk_live_…`) | Onglet Payments d'Emergent |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique (`pk_test_…` ou `pk_live_…`) | Onglet Payments d'Emergent |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature du webhook | Onglet Payments d'Emergent |
| `STRIPE_ACCOUNT_ID` | ID du compte Stripe (`acct_…`) | Onglet Payments d'Emergent |
| `STRIPE_MODE` | `test` ou `live` (informational) | Auto-défini |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique exposée au frontend | Copie de `STRIPE_PUBLISHABLE_KEY` |

**Ne JAMAIS coller ces variables dans le chat.** Elles doivent être ajoutées uniquement dans l'onglet Payments du dashboard Emergent (accès sécurisé et chiffré).

## 🚦 Étapes d'activation

### 1. Test mode (par défaut)
Emergent pré-injecte automatiquement une sandbox Stripe de test. Aucune action requise. Testez avec la carte :
```
Numéro : 4242 4242 4242 4242
Date   : n'importe quelle date future
CVC    : 3 chiffres au choix
```

### 2. Réclamer votre vrai compte Stripe (1 clic)
Emergent génère pour vous un compte Stripe déjà connecté à votre app. Cliquez sur l'onboarding URL fourni par l'agent Emergent, complétez le KYC (nom, IBAN, docs légaux). Une fois validé par Stripe :
- Votre compte est activé
- Emergent bascule automatiquement l'app en mode live
- Vos vrais paiements clients commencent à arriver

### 3. Vérifier la config à tout moment
```bash
curl https://mkapms.fr/api/stripe/health
```
Réponse attendue :
```json
{
  "configured": true,
  "mode": "live",
  "secret_key": "sk_live_…AbC1",
  "publishable_key": "pk_live_…XyZ2",
  "webhook_secret_present": true,
  "account": {
    "id": "acct_1XXXXXX",
    "charges_enabled": true,
    "details_submitted": true
  },
  "ready_for_live_transactions": true
}
```

## 🔒 Sécurité

⚠️ **Une clé secrète Stripe (`sk_live_…`) ne doit JAMAIS transiter par :**
- Le chat Emergent
- Un email
- Un fichier committé
- Une capture d'écran partagée

Si une clé est exposée par mégarde, **révoquez-la immédiatement** sur https://dashboard.stripe.com/apikeys → bouton "Roll key".

## 📊 Options fiscales (à choisir avant le lancement)

Trois modes sont possibles pour la gestion de la TVA :

1. **Stripe gère tout (Managed Payments)** — recommandé pour une marketplace mondiale
   - Stripe calcule, collecte, déclare et reverse les taxes automatiquement
   - Inclut protection anti-fraude, gestion des litiges, support client Stripe
   - Frais additionnels : **+3.5 %** par transaction

2. **Stripe calcule seulement (Stripe Tax)**
   - Stripe applique la bonne TVA au checkout selon le pays/produit
   - Vous déclarez et reversez les taxes vous-même
   - Frais additionnels : **+0.5 %** par transaction

3. **DIY** — Stripe traite juste le paiement, aucune aide fiscale
   - Le moins cher, mais 100 % de la conformité fiscale à votre charge

**Recommandation MKA.P-MS** : option 1 (Managed Payments) car la France est éligible et la marketplace a une composante mondiale.

## 📞 Support

- Questions Stripe (KYC, virements) : https://docs.stripe.com/sandboxes/claimable-sandboxes
- Questions Emergent (Payments, déploiement) : onglet "Payments" du dashboard Emergent
