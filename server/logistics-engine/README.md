# Logistics Engine

**Statut** : LOT 4 (Transport/Livraison) du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`. **Version** : 0.1.0.
**Maturité** : `sprint_1_minimal` (règle MOS #14). **Registre** : `staging`
tant qu'aucun transporteur réel n'est connecté.

**Périmètre strict** : transport/livraison uniquement. Ce LOT ne touche pas
au Payment Engine complet (LOT 5) — les événements `carrier.payout.eligible`
et `carrier.payout.completed` cités par le plan sont délibérément différés
au LOT 5, jamais implémentés ici.

## Contrainte de nommage (rappel critique)

`npm run build` échoue si le mot isolé « IA »/« AI » apparaît dans le code
(`scripts/check-naming.mjs`) — c'est ce qui a bloqué tout déploiement Railway
des LOT 2/3 (voir PR #335). Le nom officiel est **MKA.P-MS AI**.
Ce moteur ne mentionne aucun concept d'intelligence artificielle, donc rien
à respecter ici en pratique — mais toute évolution future (score
transporteur, détection d'anomalie tracking) devra s'y conformer dès la
première ligne. `npm run build` a été exécuté et vérifié vert avant de
livrer ce lot (contrairement aux LOT 2/3 initiaux).

## Ce que ce moteur ajoute (et ne duplique pas)

Réutilisé sans duplication :

- **Supplier Engine** (LOT 1) — `SUPPLIER_TYPES` a déjà `"transport"`,
  `partnerTypeEnum` a déjà `"transporteur"` : un transporteur peut
  s'enregistrer comme fournisseur tel quel. `MAPPING_ENTITY_TYPES` étendu
  avec `"expedition"` et `CANONICAL_SHIPMENT_FIELDS` ajouté à
  `server/supplier-engine/contract.ts` pour que l'Universal Mapping Engine
  sache aussi mapper une expédition, sans dupliquer ce moteur.
- **Vehicle Delivery Engine** (`server/vehicle-delivery/`) — seule source
  réelle de prix, pour la catégorie "vehicules" uniquement. Le Delivery
  Quote Engine délègue à `devis()` telle quelle : aucune logique de barème
  dupliquée. Ce moteur mûr et discipliné (qualité de prix honnête
  `confirme|estime|confirmation_requise|non_mesure|indisponible`, Country
  OS/Country Policy Engine déjà branchés) devient un cas particulier du
  Delivery Quote Engine générique, pas son cœur.
- **Country OS / Country Policy Engine** — même mécanisme que les LOT 2/3
  (export refusé par défaut sans règle pays confirmée).
- **Connector Engine** (LOT 1, `CONNECTION_METHODS`) — réutilisé tel quel
  comme catalogue des méthodes techniques de connexion transporteur
  (`CARRIER_CONNECTION_METHODS`), jamais un second catalogue recréé.
- **Event Bus** — nouveau domaine `logistique`, 15 nouveaux types
  d'événements (`delivery.*`, `pickup.*`, `shipment.*`), en plus des
  événements `livraison_vehicule.*` déjà existants (Vehicle Delivery
  Engine), non remplacés.
- **`server/intelligences/api-v1.ts`** — patron de sécurité réutilisé pour
  l'API transporteurs (clé dédiée par en-tête, jamais la session
  plateforme) sans copier son code (domaines fonctionnels distincts).

Ce que ce moteur ajoute (rien n'existait avant, voir audit pré-LOT 4) :

1. **Carrier Connector Engine** (`logistics_carrier_connections`) — un
   connecteur par transporteur (catalogue `CARRIER_CATALOG`, 19
   transporteurs nommés par le plan) et par méthode technique. Sans secret
   réel, reste honnêtement `not_connected` — même principe que le Connector
   Engine du LOT 1, jamais un succès fabriqué.
2. **Delivery Quote Engine** — toujours 3 tiers (ÉCONOMIQUE/RECOMMANDÉ/
   EXPRESS). "vehicules" → prix réel du Vehicle Delivery Engine. "colis"/
   "fret" → chaque tier honnêtement `disponible: false` avec le nom de la
   variable d'environnement manquante, puisqu'aucun transporteur n'est
   connecté aujourd'hui.
3. **Delivery Routing Engine** — sélection multi-facteurs (prix puis délai)
   **parmi les options réellement disponibles seulement** ; refuse de
   réserver un transporteur non connecté (`choisirOptionDevis`).
4. **Multi-Leg Engine** (`logistics_shipments` + `logistics_legs`) — MASTER
   SHIPMENT + jusqu'à 4 LEG, chacun avec son transporteur, son mode
   (`TRANSPORT_MODES` du Vehicle Engine, réutilisé), sa responsabilité
   juridique et sa condition de paiement propres — jamais fusionnées entre
   legs. Réservation progressive (`reserverExpedition` ne réserve que le
   premier leg, jamais tous d'un coup sans confirmation réelle).
5. **Tracking Engine** (`logistics_tracking_events`) — 18 statuts normalisés
   (`CREATED`…`DISPUTED`). Le statut agrégé de l'expédition reflète toujours
   le leg le **moins avancé** (sauf `FAILED`/`DISPUTED`/`RETURNED`, qui
   remontent immédiatement, quel que soit l'état des autres legs). Chaque
   mise à jour publie l'événement Event Bus correspondant quand il existe.
6. **Webhook transporteur** (`logistics_webhook_log`) — réception générique
   par transporteur, signature vérifiée contre le secret réel configuré
   (Carrier Connector Engine). Sans secret réel, sans en-tête, ou avec une
   signature invalide : jamais traité comme un succès, toujours journalisé
   comme tel (statut `recu`/`signature_invalide`/`traite`/`erreur`).
7. **API MKA.P-MS pour transporteurs** (`server/logistics-engine/api.ts`,
   montée sous `/api/logistics`, `logistics_api_keys`) — surface REST dédiée
   (jamais tRPC) : `POST /quotes`, `POST /shipments`, `GET /shipments/:id`,
   `POST /shipments/:id/{accept,pickup,handover,status,delivery,incident,
   proof,reserve}`, `POST /webhooks/:carrierCode`. Authentification par
   en-tête `x-mka-carrier-key` (clé hashée SHA-256, jamais stockée en
   clair, jamais journalée) — un transporteur ne peut mettre à jour que ses
   propres legs (`obtenirLegDuTransporteur`).

## Sécurité des clés (règle absolue du plan)

Aucune clé n'est exposée frontend/mobile/logs/dépôt : `secretRef` ne stocke
qu'un **nom** de variable d'environnement (`CARRIER_DHL_API_KEY`, etc.),
jamais la valeur ; les clés API transporteurs ne sont montrées qu'une seule
fois à la création (`creerCleApiTransporteur`) et seul leur hash SHA-256
est conservé (même patron que `partner_api_keys`,
`server/routers/operations.ts`).

## Limite connue et assumée : signature webhook générique

`traiterWebhookTransporteur` vérifie une signature HMAC générique
(`sha256(secret + JSON.stringify(payload))`) — un schéma de test/sandbox
honnête, pas le schéma réel de chaque transporteur (chacun a le sien : DHL,
UPS, etc. ne signent pas de la même façon). Une intégration réelle
implémentera la vérification propre à son transporteur avant d'activer sa
connexion — documenté ici pour ne jamais faire croire que la sécurité
webhook est déjà éprouvée pour un vrai transporteur.

## Points d'intégration déjà consommés par les LOT 2/3

`vehicle_territories` (LOT 2) et `parts_territories` (LOT 3) portent déjà
`transportEligible`/`transportModesAllowed`/`hazardousMaterial`/`fragile`/
`oversized`/`preparationDelay` — préparés pour ce LOT 4, jamais encore
reliés automatiquement à `creerExpedition` (à faire en Sprint 2, une fois
qu'un vrai transporteur est connecté : quel véhicule/pièce publié déclenche
quelle expédition reste une décision produit, pas seulement technique).

## Cycle de vie d'un leg / d'une expédition

```
CREATED → BOOKED → PICKUP_SCHEDULED → PICKED_UP → IN_TRANSIT → AT_HUB
  → CUSTOMS_EXPORT → HANDED_OVER → AT_PORT → ON_VESSEL → ARRIVED_PORT
  → CUSTOMS_IMPORT → LAST_MILE → OUT_FOR_DELIVERY → DELIVERED
  (ou FAILED / RETURNED / DISPUTED à tout moment, remonté immédiatement)
```

## Endpoints tRPC (`logisticsEngine.*`, usage interne Direction/admin)

```
meta / healthStatus / controlCenterFeed / dashboard   (public/admin)
carrierCatalog                                          (public)
enregistrerConnexion / testerConnexion / listerConnexions (admin)
genererDevis                                            (admin)
choisirOption                                           (admin)
creerExpedition / reserverExpedition / liste / detail / auditLog (admin)
mettreAJourStatut                                       (admin)
creerCleApi                                             (direction)
listerClesApi                                           (admin)
```

## Migration

`drizzle/0125_logistics_engine.sql` — 100 % additive, tables préfixées
`logistics_*`. Aucune table existante modifiée.

## Tests

`server/logistics-engine/__tests__/logistics-engine.test.ts` — réels, base
de données : transporteur hors catalogue refusé, connecteur à secret
manquant honnêtement `not_connected`, devis véhicules réel (Vehicle
Delivery Engine) vs devis colis honnêtement non connecté, routage
multi-facteurs qui ignore les options indisponibles, refus de réserver un
transporteur non connecté, Multi-Leg Engine (max 4 legs, prix total réel,
responsabilité distincte par leg), réservation progressive, Tracking Engine
(agrégation au leg le moins avancé, statut urgent remonté immédiatement),
preuves jamais écrasées, webhook avec signature réelle valide/invalide/
absente, statut transporteur non reconnu jamais appliqué, clés API
(génération, vérification, hash jamais renvoyé), audit complet,
non-régression Supplier/Vehicle/Parts Engine.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — architecture complète Gateway/Connectors/Quote/
  Routing/Multi-Leg/Tracking/API transporteurs, `npm run build` vérifié
  vert de bout en bout (contrairement aux LOT 2/3 initiaux).
- **Sprint 2** — premier transporteur réel connecté (clé réelle fournie),
  vérification de signature webhook propre à ce transporteur, liaison
  automatique des points d'intégration LOT 2/3 (`transportEligible`, etc.)
  à `creerExpedition`.
- **Sprint 3** — Delivery Routing Engine enrichi (score historique/
  fiabilité réel, pas seulement prix/délai déclarés).
