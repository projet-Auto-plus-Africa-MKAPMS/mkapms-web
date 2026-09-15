# Supplier Engine

**Statut** : LOT 1 (Socle) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucun fournisseur réel n'a été activé de bout en bout.

## Ce que ce moteur ajoute (et ne duplique pas)

Un fournisseur (véhicules, pièces ou transport) est d'abord un **partenaire**
au sens déjà existant de la plateforme : `server/partner-engine/` gère déjà
la candidature (« Devenir partenaire »), la validation humaine, le contrat,
la zone de couverture et la performance, et `partnerTypeEnum`
(`server/modules/operations.ts`) reconnaît déjà les types
`fournisseur_vehicules`, `fournisseur_pieces` et `transporteur`.

Ce moteur **ne recrée rien de tout ça**. Il ajoute ce qui manquait pour
qu'un fournisseur soit réellement exploitable au-dessus d'un `partners.id`
déjà existant :

1. **Supplier Registry** (`supplier_profiles`) — identité légale (SIREN/SIRET,
   TVA), territoires multiples (autorisés/exclus, validés contre le
   **Country OS**), devise, conditions de paiement, statut KYB et statut
   d'activation détaillé.
2. **Supplier Onboarding** (`supplier_onboarding_steps`) — les 15 étapes du
   point 2 du plan, en historique append-only (jamais écrasé).
3. **Connector Engine** (`supplier_connections`) — une ligne par méthode de
   connexion (22 méthodes cataloguées dans `contract.ts`). Sans secret réel
   configuré, le statut reste honnêtement `not_connected` — jamais simulé
   comme actif (même principe que la Passerelle d'Embeddings du LOT IA02F).
   La saisie manuelle et les connecteurs fichier sont testables sans aucune
   clé externe.
4. **Universal Mapping Engine** (`supplier_mappings`) — correspondance champ
   fournisseur → champ canonique MKA.P-MS, versionnée (une nouvelle version
   s'ajoute, l'historique reste consultable).
5. **Audit** (`supplier_audit_log`) — chaque décision, avec qui l'a prise.

Réutilisé sans duplication : **Country OS** (validation des territoires),
**Contract OS** (cycle de vie du contrat signé — `fournisseur`/`transporteur`
ajoutés à `CONTRACT_PARTIES`), **Document OS** (le contrat lui-même n'est
jamais stocké ici). Le **Ledger** (`wallets`/`payouts`) et le **Payment
Engine** ne sont pas encore branchés : c'est le LOT 5 du plan.

## Cycle de vie

```
brouillon → en_verification → valide_direction → contrat_signe
  → (test_connexion) → actif ⇄ suspendu → desactive
```

`actif` exige : KYB `verifie`, contrat signé, et au moins une méthode de
connexion enregistrée (la saisie manuelle suffit). `valide_direction`,
`contrat_signe`, `activer`, `suspendre`, `reactiver` et `desactiver` sont
réservés à `directionProcedure` — jamais une décision automatique.

## Endpoints tRPC (`supplierEngine.*`)

```
meta / healthStatus / controlCenterFeed / dashboard   (public/admin)
connectionMethods                                      (public, catalogue)
creer / liste / detail / ajouterContact / auditLog     (admin)
verifierEntreprise / definirTerritoires / avancerEtape (admin)
validerParDirection / enregistrerContratSigne          (direction)
enregistrerConnexion / testerConnexion                 (admin)
definirMapping                                         (admin)
activer / suspendre / reactiver / desactiver           (direction)
```

## Migration

`drizzle/0120_supplier_engine.sql` — 100 % additive, tables préfixées
`supplier_*`. Aucune table existante modifiée.

## Tests

`server/supplier-engine/__tests__/supplier-engine.test.ts` — réels,
base de données : création au-dessus d'un partenaire incompatible refusée,
activation refusée sans KYB/connexion, territoires invalides rejetés sans
bloquer les valides, mapping versionné sans écrasement, connecteur à secret
manquant honnêtement `not_connected`, connecteur fichier/manuel testable
sans clé, audit log peuplé à chaque étape.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — Registre, onboarding, Connector Engine
  (catalogue + test réel sans clé), Universal Mapping Engine, audit,
  Health/Feed/Dashboard.
- **Sprint 2** — Import réel CSV/XLSX (LOT 2/3 : Vehicle/Parts Supplier
  Engine), premier fournisseur activé de bout en bout en production.
- **Sprint 3** — Connecteurs API réels (clé fournie), rate limiting et
  circuit breaker effectifs.
