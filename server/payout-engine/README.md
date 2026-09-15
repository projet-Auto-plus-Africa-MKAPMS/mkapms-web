# Payout Engine

**Statut** : LOT 5 (Paiements) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`, §32 PAYOUT ENGINE. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucun versement réel n'a été validé par la Direction et qu'aucun
transfert Stripe Connect réel n'a été exécuté.

**Périmètre strict** : décider QUAND et COMMENT l'argent déjà bloqué au
Ledger devient disponible pour un fournisseur ou un transporteur. Ce moteur
ne décide jamais QUI encaisse le client (Payment Orchestrator, §28) et ne
duplique jamais le Payment Engine (encaissement/statuts/rapprochement).

## Audit préalable (obligatoire avant tout LOT)

Avant d'écrire une ligne de code, l'audit du dépôt a établi que le LOT 5
n'était **pas à créer ex nihilo** :

- **Payment Engine** (`server/payment-engine/`), **Payment Orchestrator**
  (`server/payment-orchestrator/`), **Financial Intelligence Engine**
  (`server/financial-intelligence/`) et **Internal Accounting Engine**
  (`server/accounting-internal/`) existent déjà, routés et actifs/staging.
- Le **Ledger** (§29 INTERNAL LEDGER) existe déjà sous
  `server/modules/wallet.ts` (`wallets`/`wallet_transactions`/`payouts`/
  `bank_accounts`) + `server/routers/wallet.ts` — mais réservé aux
  utilisateurs plateforme (`userId`), jamais branché aux fournisseurs/
  transporteurs. `server/supplier-engine/README.md` le disait déjà
  explicitement : *« Le Ledger et le Payment Engine ne sont pas encore
  branchés : c'est le LOT 5 du plan. »*
- Le **Payout Engine** (§32) lui-même — politiques de versement,
  déclencheurs, répartition par étape — n'existait nulle part : c'est le
  vrai travail neuf de ce LOT.

**Dérive schéma/DB corrigée au passage** (même famille de bug que
`drizzle/0124_parts_stock_columns_fix.sql`, LOT 3) : `wallets.next_payout_date/
total_encaisse/total_vire`, `payouts.bank_account_id/frais/note/processed_at`,
`bank_accounts.wallet_id` et `wallet_transactions.source_type/source_id`
étaient déclarés dans `schema.ts` et déjà utilisés par du code existant
(`routers/wallet.ts`) sans jamais avoir été migrés — `bank_accounts` portait
même la colonne sous un autre nom (`stripe_bank_account_id` au lieu de
`stripe_external_account_id`). Les quatre tables étaient vides (0 ligne) :
correction directe dans `drizzle/0126_payout_engine.sql`, sans perte de
donnée réelle.

## Ce que ce moteur ajoute (et ne duplique pas)

Réutilisé sans duplication :

- **Ledger** (`wallets`/`payouts`, LOT 1 promis) — étendu, jamais recréé :
  `wallets.ownerType` (`user`/`supplier`/`carrier`/`platform`) +
  `supplierProfileId`/`carrierCode` en lecture seule vers le Supplier Engine
  (LOT 1) et le catalogue transporteur du Logistics Engine (LOT 4), sans FK
  dure — même principe que partout ailleurs dans le plan. `userId` devient
  nullable : un wallet fournisseur/transporteur/plateforme n'a pas
  nécessairement d'utilisateur associé.
- **Event Bus** — deux nouveaux abonnements (`payout_engine` sur
  `vehicule.vendu`, `pickup.completed`, `delivery.completed`), et 5 nouveaux
  types d'événements dans le domaine `paiement` déjà existant :
  `payout.eligible`, `payout.released`, `dispute.opened`, `dispute.closed`,
  `refund.completed` (noms exacts du plan, §45). Coexistent volontairement
  avec `paiement.reussi`/`paiement.echoue` : aucune capacité existante n'est
  renommée.
- **Vehicle Engine** (LOT 2) / **Logistics Engine** (LOT 4) — consommés en
  lecture seule (`vehicle_items`/`vehicle_pricing`, `logistics_legs`) pour
  connaître le montant dû et le bénéficiaire, jamais un second moteur de
  prix ou de suivi recréé.

Ce que ce moteur ajoute (rien n'existait avant, voir audit) :

1. **Politiques de versement** (`payout_policies`) — `SupplierPayoutPolicy`/
   `TransporterPayoutPolicy` du plan : préréglages nommés
   (`100_immediate`, `100_enlevement`, `100_livraison`, `100_documents`,
   `50_50_enlevement_livraison`, `30_70_enlevement_livraison`), "politique
   par contrat" (`contractRef`), "validation humaine possible"
   (`requiresHumanValidation`, **`true` par défaut** — jamais un versement
   automatique sans configuration explicite).
2. **Calendriers de versement** (`payout_schedules`) — une vente/expédition
   ouvre un versement : le montant net (hors commission) est **bloqué**
   immédiatement sur le wallet du bénéficiaire (`soldeBloque`, §29 "Montant
   bloqué"), la commission MKA.P-MS est créditée au wallet plateforme. La
   répartition par étape est figée à l'ouverture — un changement de
   politique ultérieur ne modifie jamais un versement déjà planifié.
3. **Déclenchement et validation** (`triggerStage`/`validateStage`) — un
   déclencheur métier réel (enlèvement, livraison…) fait avancer une étape :
   sans validation humaine requise, libération immédiate
   (`soldeBloque → soldeDisponible`) ; sinon l'étape reste `eligible` jusqu'à
   une décision humaine explicite. Idempotent : rejouer le même déclencheur
   n'a aucun effet une fois l'étape traitée.
4. **Branchement Event Bus réel** — `vehicule.vendu` (Vehicle Engine) ouvre
   le versement fournisseur ; `pickup.completed`/`delivery.completed`
   (Logistics Engine) font avancer le versement transporteur du leg
   concerné. Un leg au transporteur `"interne"` (convoyage MKA.P-MS) ne
   déclenche jamais de versement externe.
5. **Audit obligatoire** (`payout_audit_log`) — chaque ouverture,
   déclenchement, validation et libération est journalisée.

## Compléments Payment Engine livrés dans le même LOT

L'audit de `server/payment-engine/audit.ts` listait des manques précis
(§35 du plan) — comblés ici sans toucher au cœur du Payment Engine :

- **Webhooks Stripe manquants** (`server/stripeWebhook.ts`) : litiges
  (`charge.dispute.created`/`closed`, jamais un statut `payments.status`
  fabriqué — la table historique reste 100 % additive, le litige est
  journalisé à côté), reversements Stripe Connect (`transfer.created`, et
  `transfer.reversed` — **Stripe n'émet pas de `transfer.failed`**, vérifié
  contre les types officiels du SDK ; le plan employait ce nom par erreur),
  mise à jour de compte connecté (`account.updated`, journalisée), création
  d'abonnement (`customer.subscription.created`, synchronisation
  défensive). `HANDLED_WEBHOOK_EVENTS` couvre désormais 100 % de
  `REQUIRED_WEBHOOK_EVENTS`.
- **Abandoned Payment Engine** (§31, `server/payment-engine/abandoned.ts`) —
  relances 24 h/48 h/72 h sur les transactions internes jamais confirmées,
  puis expiration réelle (`setStatus(..., "expire")`) au lieu de relancer
  indéfiniment. Chaque relance est journalisée dans `payment_events` pour ne
  jamais être renvoyée deux fois. Câblé dans `server/index.ts` (cycle
  horaire, même patron que les autres tickers du serveur).

## Sécurité des clés (règle absolue du plan)

Aucun secret transporteur/fournisseur/Stripe Connect n'est exposé côté
client. Les décisions de versement ne s'appuient que sur des données déjà
en base (prix calculé, tarif de leg) — jamais un montant saisi côté
navigateur.

## Limite connue et assumée (Sprint 2)

Le transfert bancaire réel vers le fournisseur/transporteur (Stripe Connect
`transfers.create`, ou tout autre rail) **n'est pas implémenté** : ce LOT
place l'argent en `soldeDisponible` du wallet du bénéficiaire (retirable via
`wallet.requestPayout`, déjà existant), mais aucun connecteur n'exécute
encore le virement lui-même. Les cas `transfer.created`/`transfer.reversed`
du webhook Stripe sont donc honnêtement des no-op tant qu'aucun transfert
n'a été initié depuis un `payout` — jamais un succès fabriqué. Le versement
des pièces automobiles (LOT 3) n'est pas branché à l'Event Bus dans ce
sprint : le flux d'achat pièces (`partsOrders`) ne porte pas encore, ligne
par ligne, le fournisseur et le montant qui lui revient — décision produit à
trancher avant de le connecter, pas seulement technique.

## Cycle de vie d'un versement

```
pending → (déclencheur métier réel) → eligible (si validation requise)
                                    → validated → released
        → (sans validation requise) → validated → released  [immédiat]
```

Statut global de l'ensemble (`payout_schedules.status`) : `pending` tant
qu'aucune étape n'a bougé, `partial` dès qu'une étape est engagée,
`completed` quand toutes les étapes sont `released`.

## Endpoints tRPC (`payoutEngine.*`, usage interne Direction/admin)

```
meta / healthStatus / controlCenterFeed / dashboard   (public/admin)
splitPresets                                            (public)
createPolicy / setPolicyActive                          (direction)
listPolicies / listSchedules / detail / auditLog        (admin)
triggerStage                                            (admin)
validateStage                                           (direction)
```

## Migration

`drizzle/0126_payout_engine.sql` — additive pour les tables neuves
(`payout_policies`, `payout_schedules`, `payout_audit_log`,
`payout_health_log`), corrective pour les quatre tables du Ledger existant
(colonnes déclarées jamais migrées, voir Audit préalable ci-dessus). Aucune
ligne existante perdue (tables vides au moment de la correction).

## Tests

`server/payout-engine/__tests__/payout-engine.test.ts` — réels, base de
données réelle : politique par défaut honnête (100 % livraison, validation
humaine), création de politiques (50/50, rejet d'un préréglage inconnu),
ouverture de versement (calcul net/commission, blocage Ledger, crédit
plateforme), déclenchement sans validation (libération immédiate,
idempotence), déclenchement avec validation humaine (blocage jusqu'à
décision, rejet d'une étape absente de la politique), journal d'audit
complet, branchement Event Bus réel (vente véhicule → versement fournisseur,
idempotence de la remise, leg logistique livré → versement transporteur,
leg interne → aucun versement), exposition du router.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — Ledger étendu multi-porteurs, politiques et
  calendriers de versement, branchement Event Bus (vente véhicule, leg
  logistique), webhooks Stripe manquants comblés, Abandoned Payment Engine,
  `npm run build` vérifié vert de bout en bout.
- **Sprint 2** — connecteur de virement réel (Stripe Connect `transfers` ou
  équivalent), branchement du versement pièces automobiles (LOT 3),
  passage `payment`/`payout_engine` de `staging` à `active` une fois un
  versement réel validé par la Direction.
- **Sprint 3** — Payment Reference Engine renforcé (anti-double-paiement
  multi-prestataire), Reconciliation étendue aux versements partenaires.
