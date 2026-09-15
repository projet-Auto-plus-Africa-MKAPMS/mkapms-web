# Parts Engine

**Statut** : LOT 3 (Pièces automobiles) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucune pièce fournisseur réelle n'a été publiée de bout en bout.

**Périmètre strict** : pièces automobiles uniquement. Ce LOT ne touche
jamais au transport/livraison réel (LOT 4) ni au Payment Engine complet
(LOT 5) — seuls les points d'intégration futurs sont préparés
(`parts_territories` : hazardousMaterial/fragile/oversized/
transportRestrictions/preparationDelay ; `parts_stock_reservations` : hook
de libération automatique, jamais un vrai paiement).

## Ce que ce moteur ajoute (et ne duplique pas)

Réutilisé sans duplication :

- **Supplier Engine** (LOT 1) — fournisseur actif, type `pieces`/`multi`,
  Connector Engine et Universal Mapping Engine (`CANONICAL_PART_FIELDS`,
  étendu pour ce lot avec les champs manquants identifiés par l'audit :
  génération, codes moteur/boîte, années, dimensions détaillées, documents,
  grade qualité, entrepôt, stock détaillé, prix public, TVA, dates de
  synchronisation).
- **Country OS** / **Country Policy Engine** — mêmes fonctions que le
  Vehicle Engine (LOT 2), export refusé par défaut sans règle pays
  confirmée.
- **La marketplace pièces déjà existante** (`parts_shops`, `parts_catalog`,
  `parts_compatibility`, `parts_stock`, `server/schema.ts`, exploitée par
  `server/routers/pieces.ts`) — la publication crée une vraie ligne
  `parts_catalog` (+ `parts_stock` + `parts_compatibility`), jamais un
  système parallèle.
- **Event Bus** — domaine `produit` déjà utilisé par `piece.modifiee`, 14
  nouveaux types d'événements `part.*`.
- **Search OS** — `searchPieces()` ajouté (nouveau type `"piece"`), la
  marketplace pièces n'était indexée nulle part avant ce lot.

**Correctif préalable (avant tout code de ce lot)** : `server/schema.ts` et
`server/modules/pieces.ts` déclaraient les mêmes tables physiques
(`parts_shops`, `parts_catalog`, `parts_stock`, `parts_orders`,
`parts_order_items`) avec des colonnes différentes — masquage silencieux
par les règles d'export ESM, seule la version `schema.ts` était migrée.
`estimation-hub/service.ts` et `reputation-engine/{ownership,responses}.ts`
importaient par erreur la version jamais migrée. Corrigé (voir commit
séparé) avant de construire ce lot dessus.

Ce que ce moteur ajoute (rien n'existait avant, voir audit pré-LOT 3) :

1. **Parts Supplier Engine** (`parts_supplier_items`) — même séparation
   stricte des origines de données que le Vehicle Engine : `rawData`
   (jamais modifiée), `normalizedData`, `enrichedData`, `aiData` (jamais
   contractuel), `validatedData` (priorité humaine).
2. **Pièce canonique multi-fournisseurs** (`parts_canonical`) — une identité
   produit par référence OEM, potentiellement plusieurs offres
   (`parts_catalog`) de fournisseurs différents. Une correspondance avec une
   pièce canonique existante reste **à vérifier** (décision humaine,
   `deciderCorrespondanceCanonique`) ; l'absence de correspondance crée une
   nouvelle pièce canonique (jamais une fusion, donc jamais un risque).
3. **OEM / Cross-Reference Engine** (`parts_oem_cross_references`) —
   équivalences OEM ↔ aftermarket/équipementier, chacune avec sa source et
   sa confiance, jamais appliquée sans décision humaine
   (`declarerEquivalence`/`deciderEquivalence`).
4. **Parts Compatibility Engine** (`parts_compatibility_checks`) — 5 niveaux
   (`VERIFIED_COMPATIBLE`/`LIKELY_COMPATIBLE`/`MANUAL_VALIDATION_REQUIRED`/
   `INCOMPATIBLE`/`UNKNOWN`). Une déclaration fournisseur complète reste
   `LIKELY_COMPATIBLE` (probable, non vérifiée) — jamais `VERIFIED` par
   simple ressemblance de mots ; seule `validerCompatibilite` (décision
   humaine) fait passer à `VERIFIED_COMPATIBLE`/`INCOMPATIBLE`.
5. **Parts Pricing Engine** (`parts_pricing`) — prix fournisseur →
   commission → TVA → prix public, conversion réelle via les taux du
   Country OS. Mécanisme dupliqué du Vehicle Pricing Engine (LOT 2), jamais
   sa table.
6. **Parts Stock Engine** (`parts_stock_ledger` + `parts_stock_reservations`)
   — stock par entrepôt/pays (`warehouses` réutilisé, jamais recréé),
   statuts `IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`/`BACKORDER`/
   `DISCONTINUED`/`UNKNOWN`, réservation temporaire avec expiration et
   libération automatique (`libererReservationsExpirees`) — le Payment
   Engine complet reste LOT 5, ceci ne prépare que le hook.
7. **Parts Territory Engine** (`parts_territories`) — mêmes garanties que le
   Vehicle Territory Engine, plus les points d'intégration LOT 4
   (hazardous/fragile/oversized/transportRestrictions/preparationDelay).
8. **Parts Data Quality Engine** (`parts_quality_checks`) — champs requis,
   format EAN/GTIN, état de la pièce contre l'énumération réelle de la
   marketplace.
9. **Parts Intelligence Engine** — `analyserIA()` répond honnêtement `NOT_CONNECTED` :
   aucune brique MKA.P-MS Intelligences dédiée aux pièces n'est branchée aujourd'hui.
10. **Publication/Search Engine** (`parts_publication_log` + `searchPieces`
    dans Search OS) — historique complet des transitions, recherche pièces
    réellement indexée.

## Boutique fournisseur auto-provisionnée

`parts_catalog.shop_id` est `NOT NULL` : une pièce fournisseur B2B n'a pas de
"boutique" au sens marketplace classique. `parts_supplier_shop_links`
associe une boutique technique (`parts_shops`, `type: "grossiste"`,
`ownerId` = l'acteur qui publie) à chaque fournisseur — même principe que
`annonces.ownerId = actorId` au LOT 2. Jamais affichée comme une vraie
boutique gérée par un utilisateur.

## Cycle de vie

```
IMPORTED → ANALYSIS_PENDING → COMPATIBILITY_PENDING → VALIDATION_PENDING
  → READY_TO_PUBLISH → PUBLISHED ⇄ LOW_STOCK ⇄ OUT_OF_STOCK
  → DISCONTINUED / REMOVED / ERROR / SYNC_ERROR
```

`MAPPING_PENDING` existe dans l'énumération (demande du plan) mais n'est pas
un état observable dans ce pipeline synchrone : `mapperEtNormaliser` va
directement de `IMPORTED` à `ANALYSIS_PENDING` (même choix que le Vehicle
Engine, LOT 2) — réservé à un futur traitement par lots asynchrone.

## Endpoints tRPC (`partsEngine.*`)

```
meta / healthStatus / controlCenterFeed / dashboard          (public/admin)
ingerer / liste / detail / auditLog                           (admin)
mapperEtNormaliser                                             (admin)
identifierPieceEtCanonique / deciderCorrespondanceCanonique    (admin)
declarerEquivalence / deciderEquivalence / rechercherEquivalences (admin/public)
analyserCompatibilite / validerCompatibilite                   (admin)
controlerQualite / analyserIA                                  (admin)
calculerPrix                                                   (admin)
definirStock / reserverStock / libererReservationStock /
  consommerReservationStock / libererReservationsExpirees       (admin)
definirTerritoires                                              (admin)
preparerPourPublication                                        (admin)
validerEtPublier                                                (direction)
synchroniser / signalerErreurSync / marquerDiscontinued / retirer (admin)
```

## Migration

`drizzle/0123_parts_engine.sql` — 100 % additive, tables préfixées `parts_*`
nouvelles. Aucune table existante modifiée par ce lot (le correctif
schéma/`annonces` fait l'objet de commits séparés antérieurs).

## Tests

`server/parts-engine/__tests__/parts-engine.test.ts` — réels, base de
données : refus fournisseur incompatible/méthode non configurée, mapping
refusé sans mapping actif, identification OEM et création de pièce
canonique, décision humaine sur une correspondance canonique, équivalence
OEM/aftermarket jamais appliquée sans confirmation, compatibilité correcte/
inconnue/incompatible, contrôle qualité qui bloque un prix invalide, prix
converti réellement, stock avec réservation/libération/consommation et
passage automatique en rupture, export refusé sans règle pays confirmée,
préparation qui bloque tant qu'un manque subsiste, publication réelle créant
une ligne `parts_catalog`/`parts_stock`/`parts_compatibility`, retrait,
audit log complet, non-régression Supplier Engine et Vehicle Engine.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — pipeline complet ingestion → publication,
  Health/Feed/Dashboard.
- **Sprint 2** — première pièce fournisseur réelle publiée de bout en bout,
  intégration TecDoc ou source équivalente pour élever des compatibilités
  `LIKELY_COMPATIBLE` vers `VERIFIED_COMPATIBLE` sans validation humaine
  systématique.
- **Sprint 3** — Parts Intelligence Engine réellement connecté (nettoyage titre,
  traduction, détection OEM automatique).
