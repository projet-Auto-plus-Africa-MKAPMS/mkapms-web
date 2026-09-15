# PLAN MAÎTRE — FOURNISSEURS MKA.P-MS

> Document de référence officielle, transmis par le PDG. Couvre fournisseurs
> véhicules + fournisseurs pièces + transporteurs + API + IA + paiements +
> documents + suivi.
>
> **Règle absolue** : ce document ne doit jamais être simplifié ni voir une
> capacité supprimée sous prétexte qu'elle ne sert pas immédiatement. Toute
> capacité listée ici doit être prévue dans l'architecture, puis activée ou
> bloquée par permissions, abonnement, pays, contrat, fournisseur, risque ou
> validation — jamais retirée du plan.
>
> **Règle de construction** : aucun fournisseur ne doit nécessiter de
> reconstruire la marketplace ; aucun transporteur ne doit nécessiter de
> reconstruire le moteur logistique. Tout passe par :
> CONNECTEUR → MAPPING → MOTEUR CENTRAL MKA.P-MS.
>
> Chaque LOT commencé doit être terminé, testé et validé à 100 % avant de
> passer au suivant.

## 1. SUPPLIER CORE

- Supplier Registry central
- Supplier ID unique
- Société / pays / établissements
- Type fournisseur
- Véhicules
- Pièces
- Transport/logistique
- Multi-activité possible
- Contacts commerciaux
- Contacts techniques
- Contacts comptabilité
- Statut fournisseur
- Vérification/KYB
- Contrats
- Territoires autorisés
- Pays interdits
- Devises
- TVA/fiscalité
- Conditions commerciales
- Conditions de paiement
- Historique
- Audit

## 2. SUPPLIER ONBOARDING ENGINE

- Création fournisseur
- Vérification entreprise
- Validation Direction
- Signature contrat
- Sélection des territoires
- Sélection des catégories
- Sélection méthode de connexion
- Test connexion
- Mapping données
- Import test
- Contrôle qualité
- Validation production
- Activation fournisseur
- Suspension
- Désactivation

## 3. MÉTHODES DE CONNEXION FOURNISSEURS

- Saisie manuelle
- Formulaire Pro
- CSV
- XLS/XLSX
- Google Sheets
- XML
- JSON
- JSONL
- URL catalogue
- FTP
- SFTP
- API REST
- GraphQL
- SOAP si nécessaire
- Webhooks
- DMS
- ERP
- PIM
- Marketplace feed
- Connecteur propriétaire
- Import programmé
- Import manuel de secours

## 4. CONNECTOR ENGINE

- Un adaptateur par fournisseur
- Connecteur indépendant
- Authentification
- API Key
- OAuth2
- HMAC
- Basic Auth si nécessaire
- IP allowlist
- Rate limits
- Retry
- Timeout
- Circuit breaker
- Logs
- Monitoring
- Health check
- Version API
- Sandbox
- Production
- Rotation secrets
- Désactivation rapide

## 5. UNIVERSAL MAPPING ENGINE

- Schéma canonique MKA.P-MS
- Mapping fournisseur → MKA.P-MS
- Mapping automatique
- Mapping manuel
- Transformation unités
- Transformation devises
- Transformation catégories
- Normalisation marques
- Normalisation modèles
- Normalisation références
- Normalisation pays
- Normalisation adresses
- Historique des mappings
- Versioning mappings

---

## VÉHICULES

### 6. VEHICLE SUPPLIER ENGINE

- SupplierVehicleID
- VIN
- Immatriculation
- Marque
- Modèle
- Version
- Génération
- Année
- Mise en circulation
- Kilométrage
- Carburant
- Transmission
- Puissance
- Carrosserie
- Portes
- Places
- Couleur
- CO2
- Norme Euro
- Crit'Air
- Équipements
- Options
- État
- Historique
- Entretien
- Garantie
- Contrôle technique
- Accidents déclarés
- Nombre de clés
- Prix fournisseur
- Prix public
- TVA
- Devise
- Localisation
- Photos
- Vidéos
- Documents
- Disponibilité

### 7. VEHICLE TERRITORY ENGINE

- France
- Europe
- International
- Afrique
- Pays autorisés
- Pays exclus
- ExportAllowed
- EUExportAllowed
- WorldwideExportAllowed
- Restrictions fournisseur
- Restrictions juridiques
- Restrictions transport
- Restrictions documents

### 8. VEHICLE STOCK SYNC

- Nouveau véhicule
- Modification
- Prix modifié
- Kilométrage modifié
- Photos modifiées
- Documents modifiés
- Disponible
- Réservé
- Vendu
- Retiré
- Réintégré
- Synchronisation temps réel
- Synchronisation programmée
- Contrôle dernière mise à jour

### 9. VEHICLE DUPLICATE ENGINE

- VIN
- SupplierVehicleID
- Immatriculation
- Marque/modèle
- Kilométrage
- Année
- Photos
- Détection multi-fournisseurs
- Fusion contrôlée
- Blocage doublons

---

## PIÈCES AUTOMOBILES

### 10. PARTS SUPPLIER ENGINE

- SupplierPartID
- Référence fournisseur
- Référence OEM
- Référence aftermarket
- EAN/GTIN
- Marque pièce
- Fabricant
- Catégorie
- Sous-catégorie
- Description
- Compatibilités
- Prix fournisseur
- Prix public
- TVA
- Devise
- Stock
- Stock par entrepôt
- Délai
- Poids
- Dimensions
- Photos
- Garantie
- État neuf/reconditionné
- Pays d'origine
- Disponibilité

### 11. VEHICLE-PART COMPATIBILITY ENGINE

- VIN
- Marque
- Modèle
- Génération
- Motorisation
- Code moteur
- Boîte
- Année
- PR/ORGA si nécessaire
- OEM
- TecDoc ou équivalent
- Cross-reference
- Compatibilité vérifiée
- Compatibilité probable
- Incompatible
- Validation manuelle

### 12. PARTS STOCK ENGINE

- Stock temps réel
- Stock réservé
- Stock disponible
- Stock faible
- Rupture
- Réapprovisionnement
- Plusieurs entrepôts
- Plusieurs pays
- Plusieurs fournisseurs pour même référence
- Priorisation fournisseur
- Substitution pièce
- Équivalence OEM/aftermarket

---

## IA FOURNISSEURS

### 13. SUPPLIER AI ENGINE

- Analyse nouveau fournisseur
- Analyse documentation API
- Détection format
- Proposition mapping
- Détection anomalies
- Classification fournisseur
- Analyse qualité données
- Analyse qualité catalogue
- Détection incohérences
- Alertes
- Recommandations

### 14. VEHICLE AI ENGINE

- Correction titre
- Correction description
- Normalisation
- Traduction
- Classification
- Détection incohérences
- Analyse photos
- Analyse documents
- Détection doublons
- Score qualité
- Score risque
- Estimation prix
- Estimation marge
- Enrichissement technique
- Publication multilingue

### 15. PARTS AI ENGINE

- Correction description
- Traduction
- Classification
- Détection OEM
- Détection référence
- Compatibilité véhicule
- Cross-reference
- Détection doublons
- Alternatives
- Prix comparatif
- Disponibilité
- Livraison optimale

### 16. DATA ORIGIN ENGINE

Toujours distinguer :

- Donnée fournisseur
- Donnée constructeur
- Donnée base externe
- Donnée MKA.P-MS
- Donnée calculée
- Donnée IA
- Donnée validée humainement

---

## MARKETPLACE

### 17. PUBLICATION ENGINE

- Brouillon
- Analyse
- Validation
- Prêt publication
- Publié
- Réservé
- Vendu
- Indisponible
- Retiré
- Erreur
- Sync error

### 18. PRICING ENGINE

- Prix fournisseur
- Prix MKA.P-MS
- Commission
- Marge
- TVA
- Taxes
- Transport estimé
- Douane estimée
- Prix final
- Prix par pays
- Prix par devise
- Promotions autorisées
- Prix minimum contractuel

### 19. SEARCH ENGINE

- Véhicules
- Pièces
- Fournisseurs
- Localisation
- Pays
- Prix
- Livraison
- Disponibilité
- Compatibilité
- Recherche texte
- Recherche vocale
- Recherche IA

---

## TRANSPORT / LIVRAISON

### 20. LOGISTICS SUPPLIER ENGINE

- Transporteurs France
- Transporteurs Europe
- Transporteurs internationaux
- Afrique
- Route
- Convoyage
- Porte-voitures
- Colis
- Express
- Palette
- Fret
- Aérien
- Maritime
- RoRo
- Conteneur
- Rail
- Dernier kilomètre

### 21. CARRIER CONNECTORS

- DHL
- DPD/Geopost
- Chronopost
- UPS
- FedEx
- GLS
- Sendcloud
- Cainiao
- CEVA
- Hiflow
- AGL
- Grimaldi
- MOSOLF
- Autres partenaires

### 22. LOGISTICS QUOTE ENGINE

- Origine
- Destination
- Poids
- Dimensions
- Type marchandise
- Type véhicule
- Valeur
- Assurance
- Douane
- Disponibilité transporteur
- Prix
- Délai
- Fiabilité
- Historique
- Score transporteur

### 23. DELIVERY OPTIONS

- Économique
- Recommandé
- Express
- Retrait personnel
- France
- Europe
- International
- Afrique

### 24. MULTI-CARRIER ENGINE

- Plusieurs transporteurs sur une commande
- Transport Leg 1
- Transport Leg 2
- Transport Leg 3
- Handover
- Preuve de remise
- Responsabilité par étape
- Paiement par étape

### 25. TRANSPORT WORKFLOW

- Transport demandé
- Devis
- Transport choisi
- Mission créée
- Véhicule/colis prêt
- Transporteur notifié
- Enlèvement
- Contrôle
- Chargement
- Transit
- Hub
- Port
- Douane
- Maritime
- Arrivée
- Dernier kilomètre
- Livraison
- Validation
- Clôture

---

## CONTRÔLE VÉHICULE

### 26. VEHICLE CONDITION ENGINE

- Rapport fournisseur
- Rapport transporteur départ
- Rapport port
- Rapport intermédiaire
- Rapport transporteur arrivée
- Rapport client
- Photos
- Vidéos
- Kilométrage
- Carburant
- Pneus
- Jantes
- Carrosserie
- Vitrage
- Intérieur
- Voyants
- Clés
- Documents

### 27. DAMAGE COMPARISON AI

- Comparaison rapports
- Comparaison photos
- Chronologie dommage
- Détection écarts
- Score confiance
- Alerte
- Ouverture litige
- Validation humaine

---

## PAIEMENTS

### 28. PAYMENT ORCHESTRATOR

- Carte bancaire
- Virement
- Virement instantané
- PSP
- Paiements internationaux
- Multi-devise
- Paiement fournisseur
- Paiement transporteur
- Paiement MKA.P-MS
- Remboursement
- Litige

### 29. INTERNAL LEDGER

- Solde MKA.P-MS
- Solde fournisseur
- Solde transporteur
- Paiement client
- Montant affecté
- Montant libérable
- Montant bloqué
- Commission
- Taxes
- Remboursement
- Litige
- Historique complet

### 30. PAYMENT REFERENCE ENGINE

- Référence unique commande
- Référence unique virement
- Réconciliation bancaire
- Vérification montant
- Vérification devise
- Vérification compte
- Confirmation paiement
- Anti-double paiement

### 31. ABANDONED PAYMENT ENGINE

- Paiement commencé
- Paiement non terminé
- Notification 24 h
- Notification 48 h
- Notification 72 h
- Relances configurables
- Arrêt dès paiement
- Expiration réservation

### 32. PAYOUT ENGINE

- SupplierPayoutPolicy
- TransporterPayoutPolicy
- Paiement immédiat
- Paiement enlèvement
- Paiement livraison
- Paiement documents
- Paiement par étape
- 50/50 possible
- 30/70 possible
- 100 % possible
- Politique par contrat
- Validation humaine possible

---

## DOCUMENTS

### 33. SUPPLIER DOCUMENT ENGINE

- Convention cadre
- Annexe commerciale
- Annexe technique
- Annexe API
- Annexe territoires
- Annexe données
- Autorisation diffusion
- RGPD
- Confidentialité
- Factures
- Relevés
- Historique

### 34. VEHICLE DOCUMENT ENGINE

- Carte grise
- Contrôle technique
- Certificat de cession
- Situation administrative
- COC
- Factures
- Entretien
- Garantie
- Export
- Douane
- Documents pays

### 35. DOCUMENT CUSTODY ENGINE

- Original
- Copie
- Détenteur actuel
- Date réception
- Date remise
- Destinataire
- Preuve remise
- Document requis par étape
- Blocage si document manquant

---

## COMMANDES

### 36. ORDER ENGINE

- Panier
- Commande
- Réservation
- Paiement
- Confirmation
- Préparation
- Transport
- Livraison
- Documents
- Clôture
- Annulation
- Retour
- Litige
- Remboursement

### 37. SUPPLIER ORDER ENGINE

- Nouvelle vente
- Confirmation fournisseur
- Préparation
- Date véhicule prêt
- Documents
- Remise transporteur
- Paiement
- Historique

---

## COMPTES

### 38. SUPPLIER PORTAL

- Dashboard
- Stock
- Import
- API
- Commandes
- Préparation
- Transport
- Documents
- Paiements
- Factures
- Litiges
- Statistiques
- Support

### 39. TRANSPORTER PORTAL

- Missions
- Planning
- Devis
- Acceptation
- Enlèvement
- Formulaires
- Photos
- GPS
- Livraison
- Documents
- Paiements
- Historique

### 40. DIRECTION / PDG

- Tous fournisseurs
- Tous transporteurs
- Stocks
- Ventes
- CA
- Marges
- Paiements
- Commissions
- Litiges
- API health
- Sync
- Erreurs
- Documents
- Contrats
- Audit
- Permissions

### 41. COMPTABILITÉ

- Encaissements
- Paiements fournisseurs
- Paiements transporteurs
- Commissions
- TVA
- Taxes
- Rapprochement
- Factures
- Avoirs
- Remboursements
- Multi-devise
- Exports comptables

---

## INTERNATIONAL

### 42. COUNTRY ENGINE

Pour chaque pays :

- Vente autorisée
- Export autorisé
- Import autorisé
- TVA
- Taxes
- Douane
- Documents
- Immatriculation
- Protection consommateur
- Paiement
- Devise
- Transport
- Restrictions produits
- Restrictions véhicules
- Données personnelles

### 43. CURRENCY ENGINE

- EUR
- USD
- GBP
- CHF
- GNF
- XOF
- Autres
- FX rate
- Timestamp
- Conversion
- Frais
- Montant source
- Montant final

---

## NOTIFICATIONS

### 44. NOTIFICATION ENGINE

- Client
- Fournisseur
- Transporteur
- Direction
- Comptabilité
- Email
- Push
- SMS si nécessaire
- In-app
- Événements critiques
- Paiement
- Préparation
- Transport
- Livraison
- Documents
- Litiges

---

## ÉVÉNEMENTS

### 45. EVENT BUS

- supplier.created
- supplier.verified
- supplier.connected
- supplier.suspended
- vehicle.imported
- vehicle.updated
- vehicle.published
- vehicle.reserved
- vehicle.sold
- part.imported
- part.updated
- stock.changed
- payment.created
- payment.received
- payment.confirmed
- vehicle.ready
- transport.assigned
- pickup.completed
- vehicle.loaded
- shipment.in_transit
- port.received
- delivery.completed
- document.generated
- payout.eligible
- payout.released
- dispute.opened
- dispute.closed
- refund.completed

---

## SÉCURITÉ

### 46. SECURITY ENGINE

- RBAC
- Permissions
- API scopes
- Secret manager
- Encryption
- MFA
- Audit logs
- Rate limiting
- Webhook signature
- IP controls
- Anti-fraud
- KYB
- KYC si nécessaire
- Device monitoring
- Session security
- Backup
- Disaster recovery

---

## OBSERVABILITÉ

### 47. MONITORING ENGINE

- API uptime
- API latency
- Sync failures
- Import failures
- Webhook failures
- Stock anomalies
- Payment failures
- Transport incidents
- Supplier score
- Carrier score
- Alerts
- Logs
- Metrics
- Tracing

---

## QUALITÉ / RISQUE

### 48. SUPPLIER SCORE

- Fiabilité stock
- Exactitude données
- Annulations
- Délais
- Litiges
- Qualité véhicules/pièces
- Documents
- Réactivité
- Note interne

### 49. TRANSPORTER SCORE

- Prix
- Délai
- Ponctualité
- Incidents
- Dégâts
- Livraison réussie
- Réclamations
- Assurance
- Réactivité

---

## API PUBLIQUE MKA.P-MS

### 50. SUPPLIER API

- Authentication
- Suppliers
- Vehicles
- Parts
- Inventory
- Prices
- Images
- Documents
- Orders
- Reservations
- Availability
- Webhooks
- Payout status

### 51. LOGISTICS API

- Quotes
- Availability
- Booking
- Pickup
- Tracking
- Handover
- Delivery
- Proof of delivery
- Claims
- Cancellation

---

## TESTS

### 52. TEST ENVIRONMENT

- Sandbox fournisseur
- Sandbox transporteur
- Faux paiements
- Faux véhicules
- Fausses pièces
- Webhooks test
- Simulation stock
- Simulation vente
- Simulation transport
- Simulation livraison
- Simulation litige

### 53. TESTS OBLIGATOIRES

- Import
- Update
- Doublon
- Réservation
- Vente
- Retrait
- Stock rupture
- API indisponible
- Paiement réussi
- Paiement échoué
- Virement
- Remboursement
- Transport
- Livraison
- Dommage
- Litige
- Documents
- Permissions
- Multi-pays
- Multi-devise

---

## PRIORITÉ DE CONSTRUCTION

### 54. LOT 1 — SOCLE

- Supplier Registry
- Supplier Onboarding
- Connector Engine
- Universal Mapping
- Audit

### 55. LOT 2 — VÉHICULES

- Vehicle Supplier Engine
- Stock Sync
- AI Vehicle
- Publication
- Territories

### 56. LOT 3 — PIÈCES

- Parts Supplier Engine
- Compatibility Engine
- Stock
- Pricing
- AI Parts

### 57. LOT 4 — TRANSPORT

- Carrier Registry
- Quote Engine
- Logistics Engine
- Tracking
- Multi-leg

### 58. LOT 5 — PAIEMENTS

- Payment Orchestrator
- Ledger
- Reconciliation
- Payout Engine

### 59. LOT 6 — DOCUMENTS

- Supplier Documents
- Vehicle Documents
- Document Custody

### 60. LOT 7 — PORTAILS

- Supplier Portal
- Transporter Portal
- Direction
- Comptabilité

### 61. LOT 8 — INTERNATIONAL

- Country Engine
- Currency Engine
- Taxes
- Customs
- International logistics

### 62. LOT 9 — IA / AUTOMATISATION

- Supplier AI
- Vehicle AI
- Parts AI
- Logistics AI
- Fraud/Risk
- Automatic Mapping

### 63. LOT 10 — FINALISATION

- Notifications
- Monitoring
- Security
- Tests complets
- Load tests
- Failover
- Documentation
- Production readiness

---

## RÈGLE DE CONSTRUCTION

Aucun fournisseur ne doit nécessiter de reconstruire la marketplace.

Aucun transporteur ne doit nécessiter de reconstruire le moteur logistique.

Tout passe par :
CONNECTEUR → MAPPING → MOTEUR CENTRAL MKA.P-MS.

Les capacités ne doivent pas être supprimées parce qu'elles ne sont pas
utilisées immédiatement.

Elles doivent être prévues dans l'architecture puis activées ou bloquées par :

- Permissions
- Abonnement
- Pays
- Contrat
- Fournisseur
- Risque
- Validation

Chaque LOT commencé doit être terminé, testé et validé à 100 % avant de
passer au suivant.

---

## ADDENDUM (PDG) — RENFORCEMENT DE LA DOCTRINE

> Ce qui suit complète le document ci-dessus. Rien n'est retiré, rien n'est
> simplifié : c'est un ajout. Rappel du PDG à l'origine de cet addendum :
> « Ce qui sont déjà en place, tu les complètes ; ce qui ne sont pas, tu les
> rajoutes. » Avant tout développement, chaque agent doit auditer l'existant
> (fournisseurs déjà en base, tables/modèles, routes/API, permissions,
> moteurs réutilisables, stocks, paiements/ledger, documents, audit/logs, IA,
> transport/livraison, intégrations externes, parties incomplètes ou non
> connectées) et ne **jamais recréer** un moteur, un registre, une table, une
> permission ou un système qui existe déjà : on conserve, on fusionne, on
> renforce, on complète.

### 64. RÈGLE MAJEURE — UN MOTEUR POUR CHAQUE DOMAINE

Aucun domaine important de MKA.P-MS ne doit être piloté par de simples
services dispersés. Chaque grand domaine — fournisseurs, véhicules, pièces,
IA, logistique, paiements, documents, pays, notifications, audit,
permissions — doit être piloté par son **propre moteur MKA.P-MS dédié**,
relié au hub central. Les sections 1 à 63 de ce document constituent déjà ce
catalogue de moteurs dédiés (un moteur = une section) ; cette règle en fait
une exigence formelle et permanente, pas seulement une convention de
rédaction :

- Aucune nouvelle fonctionnalité de ces domaines ne doit être ajoutée comme
  simple fonction utilitaire ou route isolée « au cas par cas » : elle doit
  rejoindre le moteur de son domaine, ou un nouveau moteur dédié si aucun
  moteur existant ne la couvre.
- Si un moteur listé dans ce plan existe déjà dans le code (même partiellement,
  même sous un autre nom technique), il ne doit **pas** être recréé : il doit
  être audité, complété puis relié au hub central.
- Un domaine peut être implémenté par un seul module technique tant que ses
  sous-fonctions restent des **sous-moteurs fonctionnellement distincts**,
  chacun testable et pilotable séparément (voir §65 pour l'exemple du
  Supplier Engine déjà livré en LOT 1).

### 65. SUPPLIER ENGINE — DÉCOMPOSITION FONCTIONNELLE (LOT 1, déjà livré)

Le LOT 1 (`server/supplier-engine/`) applique la règle du §64 : il est
implémenté comme un seul module MOS-conforme, mais regroupe des sous-moteurs
fonctionnellement séparés, chacun avec son propre état, ses propres
événements d'audit et ses propres tests — au lieu d'un service générique
« fournisseurs » :

- **Supplier Registry / Supplier Engine** — identité légale, statuts,
  cycle de vie (`supplier_profiles`).
- **Supplier Onboarding Engine** — les 15 étapes d'intégration, historisées
  (`supplier_onboarding_steps`).
- **Supplier Verification / KYB Engine** — vérification entreprise
  (`verifierEntreprise`, statuts `KYB_STATUSES`).
- **Supplier Contract Engine** — contrat signé, réutilise le **Contract OS**
  existant (`enregistrerContratSigne`, `CONTRACT_PARTIES` étendu avec
  `fournisseur`/`transporteur`), sans dupliquer la gestion de contrat.
- **Supplier Territory Engine** — territoires autorisés/exclus, validés
  contre le **Country OS** existant (`definirTerritoires`).
- **Connector Engine** — 22 méthodes de connexion cataloguées, statut
  honnête `not_connected` sans secret réel (`supplier_connections`).
- **Universal Mapping Engine** — correspondance champ fournisseur → champ
  canonique, versionnée sans écrasement (`supplier_mappings`).
- **Audit Engine** (`supplier_audit_log`) — chaque décision journalisée avec
  son auteur.

Ces sous-moteurs communiquent uniquement par les fonctions publiques de
`server/supplier-engine/service.ts` et par les types partagés de
`contract.ts` — jamais par accès direct aux tables d'un autre sous-moteur.
Cette séparation est ce qui permettra de brancher proprement, sans
réécriture, les moteurs futurs listés au §64 : **Vehicle Engine**, **Parts
Engine**, **Logistics Engine**, **Payment Engine**, **Document Engine**,
**Country Engine** (déjà réutilisé, pas dupliqué) et les **AI Engines** —
chacun consommera le Supplier Registry via `partnerId`/`supplierProfileId`
sans jamais avoir à modifier le Supplier Engine lui-même.

---

## ADDENDUM (PDG) — ARCHITECTURE LIVRAISON / TRANSPORT (OBLIGATOIRE)

> La partie livraison doit être pensée comme une vraie plateforme API
> multi-transporteurs, pas comme quelques intégrations isolées. Ce qui suit
> détaille et complète les sections 20 à 25 ci-dessus (Transport /
> Livraison) — il ne les remplace pas.

### 66. DELIVERY / LOGISTICS API GATEWAY

Aucun transporteur ne doit être codé en dur dans la plateforme (interdiction
explicite de coder autour de DHL, DPD ou tout autre fournisseur en
particulier). Chaque transporteur possède son propre adaptateur. Flux
obligatoire :

```
Transporteur → Adapter API → Logistics API Gateway → Logistics Engine
             → Delivery Quote Engine / Delivery Routing Engine
             → Tracking Engine → Payment Engine
```

Le Logistics API Gateway est la seule porte d'entrée/sortie vers les
transporteurs : le reste de MKA.P-MS (moteurs métier, portails, IA) ne parle
jamais directement à un transporteur. Ajouter un nouveau transporteur = un
nouvel adaptateur, jamais une modification du Gateway ou des moteurs en aval.

Catégories de transporteurs à supporter (agnostique, extensible) :

- **Colis / pièces** — DHL, DHL Express, DPD, Geopost, Chronopost, UPS,
  FedEx, GLS, Colissimo, Mondial Relay, Sendcloud, Cainiao…
- **Fret / palettes** — DHL Freight, CEVA, DB Schenker, transporteurs
  régionaux, fret aérien, fret maritime.
- **Véhicules** — Hiflow, CEVA, MOSOLF, AGL, Grimaldi, convoyeurs,
  partenaires RoRo.

### 67. CARRIER CONNECTOR — CAPACITÉS ATTENDUES

Chaque adaptateur transporteur doit, à terme, exposer :

- Services disponibles, tarif, délai, disponibilité.
- Création d'expédition / mission.
- Réservation, modification, annulation d'enlèvement.
- Étiquette, bordereau, documents douaniers.
- Tracking, géolocalisation, événements.
- Preuves d'enlèvement, de handover, de livraison, signature, photos.
- Anomalies, réclamations, assurance, retour, remboursement.
- Facturation.

Une capacité non disponible chez un transporteur donné doit être déclarée
absente proprement (jamais simulée) — même principe d'honnêteté que le
Connector Engine du Supplier Engine (§65) : pas de succès fabriqué sans
connexion réelle.

### 68. MÉTHODES TECHNIQUES DE CONNEXION TRANSPORTEUR

- REST
- GraphQL
- SOAP (legacy)
- Webhooks
- SFTP / FTP
- CSV / XML / JSON (échange fichier)
- EDI
- Import manuel de secours (aucune capacité ne doit être bloquée par
  l'absence d'intégration technique)

### 69. DELIVERY QUOTE ENGINE

Entrées : origine, destination, poids, dimensions, type de marchandise, type
de véhicule, valeur, assurance, contraintes douanières, disponibilité
transporteur, historique, score transporteur (reprend les critères déjà
listés en §22).

Sorties : toujours au moins trois propositions structurées —
**ÉCONOMIQUE**, **RECOMMANDÉ**, **EXPRESS** — chacune avec transporteur,
prix, délai, fiabilité.

### 70. DELIVERY ROUTING ENGINE

Sélection du transporteur multi-facteurs — jamais uniquement au prix le plus
bas. Facteurs : prix, délai, fiabilité/score historique, disponibilité
réelle, capacité de la méthode de connexion, contraintes pays/douane,
préférence contractuelle du fournisseur/client, risque.

### 71. MULTI-LEG ENGINE — DÉTAIL

Une expédition complexe est modélisée comme :

```
MASTER SHIPMENT
 ├─ LEG 1 (transporteur, origine, destination, tarif, délai, statut,
 │          documents, preuves, responsabilité, condition de paiement)
 ├─ LEG 2 (idem)
 ├─ LEG 3 (idem)
 └─ LEG 4 (idem)
```

Chaque leg a son propre transporteur, son propre statut, ses propres
documents/preuves, sa propre responsabilité juridique et sa propre condition
de paiement — le Master Shipment agrège l'état global sans jamais fusionner
la responsabilité des legs entre eux.

### 72. TRACKING ENGINE — STATUTS NORMALISÉS

Tous les transporteurs, quelle que soit leur méthode technique (§68), sont
ramenés à un statut normalisé unique côté MKA.P-MS :

```
CREATED, BOOKED, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, AT_HUB, AT_PORT,
CUSTOMS_EXPORT, HANDED_OVER, ON_VESSEL, ARRIVED_PORT, CUSTOMS_IMPORT,
LAST_MILE, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED, DISPUTED
```

### 73. ÉVÉNEMENTS WEBHOOK TRANSPORT (bus interne)

```
delivery.quote.created, delivery.booked, pickup.scheduled,
pickup.completed, shipment.in_transit, shipment.handover.completed,
shipment.at_port, shipment.customs.started, shipment.customs.completed,
shipment.on_vessel, shipment.arrived, delivery.out_for_delivery,
delivery.completed, delivery.failed, delivery.disputed,
carrier.payout.eligible, carrier.payout.completed
```

Ces événements passent par l'**Event Bus** déjà existant (section 45) —
aucun bus d'événements séparé pour la logistique.

### 74. API MKA.P-MS POUR TRANSPORTEURS

MKA.P-MS expose aussi sa propre API pour qu'un transporteur puisse se
connecter directement (sans que MKA.P-MS ait à consommer son API) :

```
POST /logistics/quotes
POST /logistics/shipments
GET  /logistics/shipments/{id}
POST /logistics/shipments/{id}/accept
POST /logistics/shipments/{id}/pickup
POST /logistics/shipments/{id}/handover
POST /logistics/shipments/{id}/status
POST /logistics/shipments/{id}/delivery
POST /logistics/shipments/{id}/incident
POST /logistics/shipments/{id}/proof
POST /logistics/webhooks
```

### 75. RÈGLE DE SÉCURITÉ — CLÉS API (absolue)

**Aucune clé ne doit être exposée : frontend ; mobile ; logs publics ;
dépôt GitHub.**

Toute clé/secret transporteur ou fournisseur vit uniquement côté serveur
(variables d'environnement / gestionnaire de secrets), n'est jamais renvoyée
dans une réponse API consommée par le frontend ou le mobile, n'est jamais
écrite dans un log accessible publiquement, et n'est jamais committée dans
le dépôt. Une clé manquante ne bloque jamais le développement : l'adaptateur
complet (interface, schéma, variables d'environnement, gestion « clé
manquante », sandbox/mock, tests, documentation, erreurs propres) est livré
sans clé réelle ; la connexion réelle s'active seulement quand une clé
réelle est fournie.

---

## ADDENDUM (PDG) — ACTIVATION DES CAPACITÉS (mise à jour, ne remplace rien)

La liste de dimensions d'activation/blocage donnée plus haut dans ce
document (permissions, abonnement, pays, contrat, fournisseur, risque,
validation) est complétée, non remplacée, par deux dimensions explicitement
ajoutées par le PDG :

- **Rôle** — l'activation peut dépendre du rôle de l'utilisateur (PDG,
  direction, admin, fournisseur, transporteur, comptable…), pas seulement de
  la permission technique.
- **Juridiction** — l'activation peut dépendre de la juridiction légale
  applicable (au-delà du simple pays), notamment pour les documents
  douaniers, la fiscalité et les contrats transporteurs internationaux.
- **Validation humaine** — précision explicite : la validation mentionnée
  plus haut est une validation humaine, jamais une décision automatique,
  pour toute activation de fournisseur, transporteur, ou capacité sensible.

Liste complète des dimensions d'activation/blocage après cet addendum :
permissions, rôle, abonnement, fournisseur, contrat, pays, juridiction,
risque, validation humaine.
