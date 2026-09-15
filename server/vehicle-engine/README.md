# Vehicle Engine

**Statut** : LOT 2 (Véhicules) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucun véhicule fournisseur réel n'a été publié de bout en bout.

**Périmètre strict** : véhicules uniquement. Ce LOT ne touche jamais aux
pièces (LOT 3) ni au transport/livraison réel (LOT 4) — seuls les points
d'intégration logistique (`PickupLocation`, `TransportEligible`,
`TransportModesAllowed`, `VehicleReadyDelay`) sont préparés dans
`vehicle_territories`, sans aucun connecteur transporteur.

## Ce que ce moteur ajoute (et ne duplique pas)

Réutilisé sans duplication :

- **Supplier Engine** (LOT 1, `server/supplier-engine/`) — le fournisseur,
  son statut `actif`, son Connector Engine et son Universal Mapping Engine
  (`CANONICAL_VEHICLE_FIELDS`). Un véhicule ne peut être ingéré que pour un
  fournisseur déjà actif, de type `vehicules`/`multi`.
- **Country OS** (`server/country-os/`) — codes pays valides, devises et
  taux de change (`country_currencies.rateFromEur`) pour le Vehicle Pricing
  Engine. Aucun moteur de devise séparé.
- **Country Policy Engine** (`server/country-policy/`) — toute demande
  d'export (`exportAllowed`/`euExportAllowed`/`worldwideExportAllowed`)
  passe par `evaluateAction("vehicule_export", …)` : sans règle pays
  confirmée, l'export reste refusé par défaut (« l'absence d'information
  n'est pas une autorisation »).
- **`annonces`** (marketplace déjà existante) — la publication crée une
  ligne `annonces` réelle, ce moteur ne republie pas un système de petites
  annonces parallèle. Deux colonnes `vin`/`plaque` ont été ajoutées à
  `annonces` (migration `0122_annonces_identity_columns.sql`) : elles
  étaient déjà lues par la détection de doublons du Smart Engine
  (`server/smart-engine/services/duplicate-detection.ts`) mais n'existaient
  pas encore — 2 de ses 3 règles de doublon étaient inertes avant ce LOT.
- **Smart Engine** — `checkDuplicates()` est appelé (fire-and-forget) après
  chaque publication, comme le fait déjà `server/routers/annonces.ts`.
- **Event Bus** (`server/event-bus/`) — chaque étape publie un événement du
  domaine `vehicule` (catalogue étendu dans `event-bus/catalog.ts`). Sans
  abonné pour l'instant : les événements reviennent honnêtement
  « orphelins » à l'observabilité plutôt que de disparaître.
- **VO Engine**, **Document OS**, **Language OS**, **Search OS** : non
  branchés dans ce LOT (pas demandés par l'objectif LOT 2), mais aucun de
  ces moteurs n'a été dupliqué — voir le rapport d'audit pré-LOT 2 pour le
  détail de ce qui existe déjà pour chacun.

Ce que ce moteur ajoute (rien n'existait avant, voir audit) :

1. **Vehicle Supplier Engine** (`vehicle_items`) — fiche canonique d'un
   véhicule fourni, avec séparation stricte : `rawData` (jamais modifiée),
   `normalizedData` (mapping appliqué), `enrichedData` (VIN, contrôles
   déterministes), `aiData` (suggestions IA seules, jamais une valeur
   contractuelle), `validatedData` (corrections humaines, toujours
   prioritaires). Cycle de statut complet : `IMPORTED → ANALYSIS_PENDING →
   VALIDATION_PENDING → READY_TO_PUBLISH → PUBLISHED → RESERVED → SOLD` (ou
   `UNAVAILABLE`/`REMOVED`/`ERROR`/`SYNC_ERROR`).
2. **Vehicle Stock Engine** — implicite dans `vehicle_items.status` : un
   véhicule fournisseur existe indépendamment de toute annonce, contrairement
   à `annonces` seule où « publiée » et « en stock » étaient confondues.
3. **Vehicle Availability Engine** (`vehicle_availability`) — disponible /
   réservé / vendu / indisponible, distinct du statut de l'annonce.
4. **Vehicle Territory Engine** (`vehicle_territories`) — territoires
   autorisés/exclus, export (UE/mondial), lieu et délai d'enlèvement,
   documents prêts, éligibilité et modes de transport (préparé pour le
   LOT 4, jamais un connecteur réel).
5. **Vehicle Pricing Engine** (`vehicle_pricing`) — prix fournisseur →
   commission → prix public, conversion réelle via les taux du Country OS.
6. **Vehicle Duplicate Engine** (`vehicle_duplicates`) — VIN, identifiant
   fournisseur, plaque ; chaque correspondance est une décision humaine
   (`a_verifier` → `confirme`/`ecarte`), jamais une fusion automatique.
7. **Vehicle Condition Engine** (`vehicle_condition_reports`) — rapport
   d'état multi-étapes (fournisseur → transporteur départ → port →
   intermédiaire → transporteur arrivée → client).
8. **Vehicle Data Quality Engine** (`vehicle_quality_checks`) — contrôles
   déterministes (champs requis, VIN, prix, valeurs d'énumération de la
   marketplace) journalisés un par un, jamais un simple booléen final.
9. **Vehicle AI Engine** — `analyserIA()` répond honnêtement
   `NOT_CONNECTED` : aucun moteur IA véhicule (description automatique,
   score qualité photo) n'est branché aujourd'hui (voir audit). Ne bloque
   jamais le pipeline, n'invente jamais une donnée.
10. **Vehicle Publication Engine** (`vehicle_publication_log`) — historique
    complet des transitions de statut, décision de publication réservée à
    `directionProcedure` (même principe que `activerFournisseur` du LOT 1).

## Décodage VIN — duplication délibérée et minimale

`decoderVinStructurel()` revalide localement le format ISO 3779 (longueur,
alphabet). C'est volontairement distinct de `vehicules.decodeVIN` du Tool
Registry IA (`server/intelligences/outils/familles/vehicules.ts`), qui sert
l'agent conversationnel via le système d'exécution d'outils IA — un
consommateur différent. Duplication limitée à un algorithme d'une quinzaine
de lignes, sans état, documentée ici plutôt que masquée.

## Points d'intégration LOT 4 (Logistics Engine) — préparés, non connectés

`vehicle_territories` porte déjà `pickupCity`/`pickupCountryCode`,
`transportEligible`, `transportModesAllowed`, `vehicleReadyDelay`,
`documentsReadyForExport`. Aucun connecteur transporteur réel, aucun devis,
aucun suivi : ça reste le LOT 4 du plan.

## Endpoints tRPC (`vehicleEngine.*`)

```
meta / healthStatus / controlCenterFeed / dashboard        (public/admin)
ingerer / liste / detail / auditLog                         (admin)
mapperEtNormaliser                                           (admin)
detecterDoublons / deciderDoublon                            (admin)
analyserDonnees / controlerQualite / analyserIA              (admin)
calculerPrix                                                 (admin)
definirTerritoires / assurerDisponibilite                    (admin)
preparerPourPublication                                      (admin)
validerEtPublier                                              (direction)
synchroniser / signalerIndisponibilite / signalerErreurSync   (admin)
reserver / libererReservation / marquerVendu                 (admin)
retirer / ajouterRapportEtat                                 (admin)
```

## Migrations

- `drizzle/0121_vehicle_engine.sql` — 100 % additive, tables préfixées
  `vehicle_*`.
- `drizzle/0122_annonces_identity_columns.sql` — ajoute `vin`/`plaque`
  (nullable) à `annonces`, déjà lues par le Smart Engine mais absentes du
  schéma. Aucune table existante autrement modifiée.

## Tests

`server/vehicle-engine/__tests__/vehicle-engine.test.ts` — réels, base de
données : ingestion refusée pour un fournisseur non actif ou de mauvais
type ; mapping refusé sans mapping actif ; doublon détecté et jamais fusionné
automatiquement ; contrôle qualité qui bloque un prix invalide ; prix converti
réellement via le Country OS ; export refusé sans règle pays confirmée ;
préparation qui refuse de publier tant qu'un manque subsiste ; publication
réelle qui crée une ligne `annonces` ; réservation/vente/retrait ; audit log
peuplé à chaque étape.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — pipeline complet ingestion → publication,
  Health/Feed/Dashboard.
- **Sprint 2** — premier véhicule fournisseur réel publié de bout en bout,
  connecteurs API réels (LOT 1) branchés à une ingestion automatique.
- **Sprint 3** — Vehicle AI Engine réellement connecté (description,
  score qualité photo).
