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
