# Document Engine

**Statut** : LOT 6 (Documents) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`, §33-35. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucune exigence documentaire réelle n'a été validée en production
par la Direction.

**Périmètre strict** : trois sous-moteurs nommés par le plan, un seul module
technique (même décomposition que le Supplier Engine, §65) :
- **§33 Supplier Document Engine** — documents contractuels fournisseur.
- **§34 Vehicle Document Engine** — documents véhicule (hors démarche SIV,
  déjà couverte par le Carte Grise Engine).
- **§35 Document Custody Engine** — chaîne de possession générique,
  réutilisable par n'importe quelle entité.

## Audit préalable (obligatoire avant tout LOT)

L'audit a établi que le LOT 6 **n'était pas à créer ex nihilo** :

- **Document OS** (`server/document-os/`, moteur `"document"`, actif) existe
  déjà : registre unifié `doc_documents`/`doc_types`/`doc_templates` avec
  signature, historique versionné, vérification publique par QR code.
  Réutilisé tel quel comme socle transversal — jamais un second registre de
  documents créé. Chaque document fournisseur/véhicule de ce LOT **est** une
  ligne `doc_documents`, rattachée via `linkedEntityType`/`linkedEntityId`
  (mécanisme déjà prévu par Document OS, jamais détourné).
- **Carte Grise Engine** (`server/modules/cartegrise.ts` + `routers/cartegrise.ts`,
  moteur `"cartegrise"`, actif) couvre déjà une bonne partie du §34 (démarche
  SIV : carte grise, situation administrative, certificat de cession) —
  jamais dupliqué. Le Vehicle Document Engine de ce LOT couvre les documents
  que la démarche SIV ne couvre pas (contrôle technique, COC, entretien,
  garantie, export, douane, documents pays) et les véhicules qui ne passent
  pas par cette démarche (véhicules importés).
- Un ancien registre parallèle (`generated_documents`/`document_signatures`,
  `server/modules/contracts.ts`) coexiste déjà avec Document OS pour les
  contrats — connu, non touché, non dupliqué une 3ᵉ fois.
- Aucun événement `document.*` n'existait dans le vrai catalogue Event Bus
  (`server/event-bus/catalog.ts`) malgré la mention `document.generated`
  dans le texte statique du plan (§45) : nouveau domaine `"document"` créé,
  écart comblé plutôt que dupliqué.
- Points d'intégration déjà réservés par LOT1-5, tous branchés dans ce LOT :
  `vehicle_territories.documentsReadyForExport` (LOT 2, flag manuel — reste
  manuel, mais peut désormais s'appuyer sur un calcul réel via
  `checkVehicleExportReadiness`) ; `logistics_legs.documents`/`preuves`
  (LOT 4, jsonb libre par leg — laissé tel quel, ce LOT n'est pas un
  remplacement mais un système générique séparé, réutilisable au-delà des
  legs) ; `PAYOUT_TRIGGERS` incluait déjà `"documents"` et le préréglage
  `100_documents` (LOT 5) — **purement déclaratif jusqu'à ce LOT**, réellement
  branché ici pour la première fois (voir plus bas).

## Ce que ce moteur ajoute (rien n'existait avant, voir audit)

1. **Supplier Document Engine** (`supplier_documents`) — enregistre un
   document fournisseur (convention cadre, annexes commerciale/technique/
   API/territoires/données, autorisation de diffusion, RGPD,
   confidentialité, facture/relevé fournisseur) en créant la ligne Document
   OS réelle et en la rattachant au fournisseur. `supplierDocumentGaps()`
   compare l'existant à une base minimale honnête (`SUPPLIER_DOCUMENT_BASELINE`)
   — jamais une case cochée par déclaration.
2. **Vehicle Document Engine** (`vehicle_documents`) — même principe côté
   véhicule (contrôle technique, COC, entretien, garantie, export, douane,
   documents pays). `computeVehicleExportReadiness()` répond à la question
   posée par `vehicle_territories.documentsReadyForExport` avec un calcul
   vérifiable (Document Custody Engine), sans jamais modifier ce champ à la
   place de la Direction — la décision d'export reste humaine.
3. **Document Custody Engine** (`custody_records`, `custody_requirements`) —
   original vs copie, détenteur actuel, date de réception, date de remise,
   destinataire, **preuve de remise obligatoire** (`handOverCustody` échoue
   sans elle), et le mécanisme central : **"document requis par étape" /
   "blocage si document manquant"**, générique par type d'entité
   (`supplier_profile`, `vehicle_item`, `logistics_shipment`,
   `payout_schedule`). Sans exigence explicitement déclarée pour une
   entité/étape, `checkStepBlocking()` ne bloque jamais rien — le silence
   n'invente pas de contrainte, mais une exigence déclarée non satisfaite
   bloque réellement.
4. **Branchement réel avec le Payout Engine (LOT 5)** — le déclencheur
   `"documents"` du Payout Engine, jusqu'ici une simple valeur de `PayoutTrigger`
   sans aucune vérification, est maintenant relié à une réception réelle :
   quand une possession `payout_schedule` reçoit le document exigé pour
   l'étape `"versement"`, l'Event Bus déclenche automatiquement l'étape
   `"documents"` du versement concerné (`payout_document_trigger`) — jamais
   pour un versement non concerné (idempotent, sans effet sur les
   réceptions hors versement).
5. **Alerte direction** — une étape bloquée par un document manquant ouvre
   une alerte dédupliquée par entité/étape (`smart_document_requirement_blocked`),
   même patron que les autres blocages du plan (rupture stock, litige
   logistique, etc.).

## Sécurité (règle absolue du plan)

Aucun fichier binaire n'est stocké par ce moteur : `docDocumentId` référence
la ligne Document OS existante (qui porte `storageKey`), ce moteur ne gère
que le registre des exigences et l'état de possession. Aucune clé, aucun
secret.

## Limite connue et assumée (Sprint 2)

`vehicle_territories.documentsReadyForExport` reste un champ **saisi
manuellement** par la Direction (Vehicle Engine, LOT 2) : ce LOT fournit le
calcul réel (`checkVehicleExportReadiness`) mais ne le connecte pas encore
automatiquement à ce flag — décision produit (faut-il bloquer
automatiquement l'export, ou seulement informer ?) à trancher avant de
brancher, pas seulement technique, exactement comme documenté pour d'autres
points d'intégration différés dans les LOT précédents.

## Cycle de vie d'une possession

```
attendu → en_possession → remis
                        → perdu / detruit  (à tout moment, jamais un simple retour à "attendu")
```

## Endpoints tRPC (`documentEngine.*`, usage interne Direction/admin)

```
meta / healthStatus / controlCenterFeed / dashboard          (public/admin)
registerSupplierDocument / listSupplierDocuments / supplierDocumentGaps      (admin)
registerVehicleDocument / listVehicleDocuments / vehicleDocumentGaps         (admin)
checkVehicleExportReadiness                                   (admin)
receiveCustody / handOverCustody / listCustodyRecords          (admin)
defineCustodyRequirement                                       (direction)
listCustodyRequirements / checkStepBlocking / auditLog          (admin)
```

## Migration

`drizzle/0127_document_engine.sql` — 100 % additive, tables préfixées
`supplier_documents`/`vehicle_documents`/`custody_*`/`document_engine_*`.
Aucune table existante modifiée. Les types de documents sont ensemencés
dans `doc_types` (Document OS) au démarrage, de façon idempotente
(`seedDocumentTypes`, même patron que `payment-orchestrator/seedProviders`).

## Tests

`server/document-engine/__tests__/document-engine.test.ts` — réels, base de
données réelle : seed idempotent des types de documents, écart réel entre
baseline et documents enregistrés (fournisseur et véhicule), réception de
possession, blocage réel avec exigences déclarées (jamais inventé sans
exigence), remise tracée avec preuve obligatoire (refus d'une double
remise), branchement réel avec le Payout Engine (réception hors versement
sans effet, réception de la pièce exacte déclenchant l'étape "documents"),
exposition du router, non-régression Supplier/Vehicle/Parts/Logistics/Payout
Engine.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — Supplier/Vehicle Document Engine, Document
  Custody Engine générique, branchement réel Payout Engine, `npm run build`
  vérifié vert de bout en bout.
- **Sprint 2** — connexion automatique de `documentsReadyForExport` au
  calcul réel (décision produit à trancher), extension du Custody Engine
  aux legs logistiques (`logistics_legs.documents`/`preuves`) pour
  remplacer le jsonb libre par une vraie chaîne de possession si la
  Direction le juge utile.
