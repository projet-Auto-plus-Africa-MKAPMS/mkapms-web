# Audit des 94 moteurs — 24 septembre 2026

Périmètre : plateforme principale. Source : inventaire du dépôt, même arbre que main 8b5b28c avant corrections de ce lot. Les états ci-dessous sont les valeurs initiales du catalogue, pas une lecture de la production. Le chiffre utilisateur 87 actifs / 94 ne permet pas de nommer les sept autres sans le registre vivant.

## Défauts communs confirmés et corrigés

1. Le registre persistait catalogue + contrat, mais oubliait les dépendances détectées par le générateur : 48 relations supplémentaires repérées dans le code. La résolution réunit désormais catalogue, inventaire et contrat, y compris lors du premier enregistrement et des vérifications de démarrage. Les états administratifs restent conservés.
2. La disponibilité ne repérait que les dépendances down/disabled. Elle signale maintenant aussi état partiel, santé inconnue/dégradée, absence ou expiration du signal. Cela ne coupe pas les fonctions métier : le diagnostic devient explicite.
3. L’audit pouvait qualifier opérationnel un moteur partiel, avec signal périmé, table absente ou un seul service tRPC présent. Le verdict exige désormais les services propres et partagés déclarés, des tables présentes et une santé vérifiée.
4. Le contrôle périodique pouvait effacer la panne Core après un échec des migrations. La panne reste signalée dans ce processus.

Ces corrections ne construisent pas à elles seules les workflows manquants. Aucun statut actif n’a été forcé en production.

## Inventaire complet

Les manques sont des signaux statiques à diagnostiquer ; ils ne sont pas tous des pannes confirmées. Une sous-section peut réutiliser un moteur métier sans dossier propre.

| Moteur | État initial | Services propres | Dépendances déclarées / détectées / réunies | Signal | Manques statiques |
|---|---|---|---|---|---|
| account_routing | active | accountRouting | 3 / 3 / 3 | sonde | 1 |
| accounting_internal | active | accountingInternal | 4 / 4 / 4 | sonde | 0 |
| accounting_marketplace | active | accountingMarketplace, cabinets | 3 / 3 / 3 | sonde | 0 |
| achat | active | annonces, favoris, reservations, devis | 20 / 21 / 21 | sonde | 1 |
| achat_officiel | staging | Partagés à vérifier | 7 / 8 / 8 | sonde | 2 |
| achat_particulier | staging | Partagés à vérifier | 7 / 8 / 8 | sonde | 2 |
| achat_pro | staging | Partagés à vérifier | 7 / 8 / 8 | sonde | 2 |
| activation_audit | active | activationAudit | 3 / 3 / 3 | sonde | 0 |
| ai_fabric | active | aiFabric | 7 / 7 / 7 | sonde | 6 |
| ai_learning | active | aiLearningOs | 3 / 3 / 3 | pont_os | 1 |
| analytics | active | historique | 6 / 3 / 6 | sonde | 3 |
| assurance | active | insuranceEngine, insurance | 3 / 3 / 3 | sonde | 0 |
| atelier | active | atelierEngine | 8 / 8 / 8 | code | 7 |
| auction_engine | active | auctionEngine | 5 / 4 / 5 | sonde | 1 |
| audit | active | auditOs | 2 / 2 / 2 | pont_os | 1 |
| auto_branchement | active | autoBranchement | 6 / 6 / 6 | code | 0 |
| avis_reputation | active | reputationEngine, reviews, appFeedback | 9 / 8 / 9 | sonde | 1 |
| backup | active | backupOs | 2 / 2 / 2 | pont_os | 0 |
| boutons | active | buttonEngine | 4 / 4 / 4 | code | 0 |
| cartegrise | active | carteGrise | 6 / 5 / 6 | sonde | 6 |
| code_graph | active | codeGraph | 3 / 3 / 3 | sonde | 0 |
| command_center | active | commandCenter | 8 / 8 / 8 | sonde | 0 |
| completion_center | active | completion | 5 / 5 / 5 | sonde | 0 |
| comptabilite | active | comptabilite | 5 / 6 / 6 | sonde | 3 |
| connaissance_auto | active | knowledgeEngine | 3 / 3 / 3 | sonde | 0 |
| connecteur_google_business | staging | googleBusiness | 2 / 2 / 2 | sonde | 0 |
| continuous_test | active | continuousTest | 14 / 14 / 14 | sonde | 0 |
| contract | active | contractOs, contracts | 4 / 3 / 4 | pont_os | 3 |
| controle_technique | staging | Partagés à vérifier | 6 / 1 / 6 | sonde | 5 |
| core | active | coreEngine, engineRegistry, centralEngines, modules, admin, meta | 5 / 6 / 6 | contrat | 3 |
| country | active | country, countries, currency, platformMap | 2 / 2 / 2 | pont_os | 21 |
| depannage | active | depannage | 5 / 5 / 5 | sonde | 0 |
| document | active | documentOs, documents, dossiers | 4 / 5 / 5 | pont_os | 2 |
| document_engine | staging | documentEngine | 7 / 8 / 10 | sonde | 6 |
| energie_recharge | active | chargingEngine | 3 / 3 / 3 | sonde | 0 |
| estimation | active | estimation | 7 / 6 / 7 | pont_os | 1 |
| event_bus | active | eventBus | 6 / 10 / 10 | sonde | 5 |
| finance | staging | financeplus | 6 / 5 / 7 | sonde | 5 |
| financial_intelligence | active | financialIntelligence | 4 / 2 / 4 | sonde | 3 |
| garage | active | garages | 12 / 12 / 12 | sonde | 13 |
| identity | active | auth, identity, kyc, suppressionCompte, preferencesUtilisateur | 17 / 17 / 17 | pont_os | 8 |
| importafrica | active | importAfrica | 5 / 2 / 5 | sonde | 3 |
| indexation | active | indexation, siteVerification | 3 / 3 / 3 | sonde | 0 |
| intelligences | active | intelligences | 14 / 22 / 22 | sonde | 8 |
| investment | staging | investment | 8 / 8 / 8 | pont_os | 0 |
| journey | active | customerJourneyOs | 3 / 3 / 3 | pont_os | 0 |
| knowledge | active | Partagés à vérifier | 4 / 0 / 4 | sonde | 16 |
| language | active | language | 3 / 3 / 3 | pont_os | 0 |
| livraison | active | livraison | 6 / 6 / 6 | sonde | 0 |
| livraison_vehicule | active | livraisonVehicule | 6 / 6 / 6 | pont_os | 0 |
| location | active | lavage, karting, rentalApplications, rentalContracts | 6 / 7 / 7 | sonde | 14 |
| location_particulier | staging | Partagés à vérifier | 4 / 2 / 4 | sonde | 2 |
| location_pro | staging | Partagés à vérifier | 4 / 4 / 5 | sonde | 17 |
| logistics_engine | staging | logisticsEngine | 5 / 6 / 7 | sonde | 5 |
| marketing | active | marketing, loyalty | 5 / 3 / 6 | sonde | 11 |
| media | active | mediaOs, media | 3 / 3 / 3 | pont_os | 0 |
| media_authenticity | staging | mediaAuthenticity | 4 / 4 / 4 | sonde | 1 |
| messaging | active | messagingOs, messages | 4 / 4 / 4 | pont_os | 0 |
| monitoring | active | monitoringOs | 7 / 7 / 7 | pont_os | 1 |
| notification | active | notifications, notificationOs | 4 / 4 / 4 | pont_os | 19 |
| partner_engine | active | partnerEngine, partners, partnerApi | 6 / 6 / 6 | sonde | 8 |
| parts_engine | staging | partsEngine | 5 / 6 / 7 | sonde | 4 |
| payment | staging | paymentEngine, wallet, installments, abonnements | 9 / 10 / 10 | sonde | 7 |
| payment_orchestrator | active | paymentOrchestrator | 3 / 3 / 3 | sonde | 0 |
| payout_engine | staging | payoutEngine | 8 / 8 / 10 | sonde | 5 |
| permission | active | permissionEngine, rbac | 2 / 2 / 2 | contrat | 1 |
| pieces | active | pieces, warehouses | 8 / 8 / 8 | sonde | 17 |
| politique_pays | active | countryPolicy | 2 / 2 / 2 | sonde | 16 |
| pro_account | active | proAccount | 4 / 4 / 4 | sonde | 0 |
| pro_portal | active | proPortal, pro, api, formation | 5 / 5 / 5 | sonde | 5 |
| product_engine | active | productEngine | 3 / 3 / 3 | sonde | 0 |
| proximity_engine | active | proximity | 5 / 5 / 5 | sonde | 0 |
| rd_lab | active | rdLab, lab | 5 / 5 / 5 | sonde | 131 |
| redirection | active | redirectionEngine | 4 / 4 / 4 | contrat | 0 |
| resilience | active | resilience | 5 / 5 / 5 | sonde | 0 |
| risque_import | active | risqueImport | 6 / 6 / 6 | pont_os | 0 |
| scheduler | active | schedulerOs | 3 / 3 / 3 | pont_os | 16 |
| search | active | searchOs, searches | 4 / 4 / 4 | pont_os | 0 |
| seo | active | seo | 9 / 9 / 9 | sonde | 0 |
| smart | active | smartEngine | 13 / 13 / 13 | contrat | 0 |
| smart_audit | active | smartAudit | 3 / 3 / 3 | sonde | 0 |
| supplier_engine | staging | supplierEngine, supplierPortal | 4 / 4 / 5 | sonde | 2 |
| support | active | supportOs, support, disputes | 6 / 6 / 6 | pont_os | 0 |
| transport | active | transport | 5 / 4 / 5 | sonde | 5 |
| vehicle_engine | staging | vehicleEngine | 4 / 8 / 8 | sonde | 5 |
| vente | active | Partagés à vérifier | 12 / 14 / 15 | sonde | 27 |
| vente_officiel | staging | depotVente | 3 / 2 / 3 | sonde | 1 |
| vente_particulier | staging | Partagés à vérifier | 4 / 2 / 4 | sonde | 2 |
| vente_pro | staging | Partagés à vérifier | 2 / 5 / 7 | sonde | 7 |
| visibility | active | visibilityOs | 3 / 3 / 3 | pont_os | 0 |
| vo | active | vo | 3 / 4 / 4 | sonde | 1 |
| vo_engine | active | voEngine | 4 / 4 / 4 | sonde | 0 |
| vo_espaces | staging | voEspaces | 6 / 6 / 6 | sonde | 0 |
| workflow | disabled | governance, platform, quality, hr, procurement, investor | 6 / 6 / 7 | sonde | 34 |

## Dépendances supplémentaires : preuves du générateur

### achat

- boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### achat_officiel

- boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### achat_particulier

- boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### achat_pro

- boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### comptabilite

- auction_engine — client/src/pages/comptabilite/CentrePilotage.tsx appelle trpc.auctionEngine

### core

- notification — routers/admin.ts importe modules/search-alerts.ts

### document

- boutons — client/src/pages/CatalogueTechnique.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### document_engine

- audit — document-engine/index.ts écrit au journal d'audit
- identity — document-engine/service.ts importe identity-os/contract.ts
- smart — publie document.requirement.blocked, consommé par smart

### event_bus

- document_engine — event-bus/handlers.ts importe document-engine/service.ts
- logistics_engine — event-bus/handlers.ts importe logistics-engine/schema.ts
- payout_engine — event-bus/handlers.ts importe payout-engine/service.ts
- vehicle_engine — event-bus/handlers.ts importe vehicle-engine/schema.ts

### finance

- achat — client/src/pages/finance/AcompteFinance.tsx appelle trpc.reservations

### intelligences

- achat — estimate-gateway/gateway.ts importe routers/devis.ts
- country — estimate-gateway/gateway.ts importe routers/currency.ts
- estimation — estimate-gateway/gateway.ts importe estimation-hub/service.ts
- livraison — estimate-gateway/gateway.ts importe routers/livraison.ts
- livraison_vehicule — estimate-gateway/gateway.ts importe vehicle-delivery/service.ts
- payment — intelligences/livraisons.ts déclenche un paiement
- risque_import — estimate-gateway/gateway.ts importe import-risk/service.ts
- vo_engine — estimate-gateway/gateway.ts importe vo-engine/service.ts

### location

- payment — routers/rentalApplications.ts importe payment-engine/checkout.ts

### location_pro

- boutons — client/src/pages/LocationPro.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### logistics_engine

- identity — logistics-engine/service.ts importe identity-os/contract.ts
- vehicle_engine — logistics-engine/contract.ts importe vehicle-engine/contract.ts

### marketing

- country — client/src/pages/DemandePublicite.tsx embarque lib/currency.tsx (trpc.currency)

### parts_engine

- identity — parts-engine/service.ts importe identity-os/contract.ts
- politique_pays — parts-engine/service.ts importe country-policy/service.ts

### payment

- cartegrise — stripeWebhook.ts importe modules/cartegrise.ts

### payout_engine

- audit — payout-engine/index.ts écrit au journal d'audit
- identity — payout-engine/service.ts importe identity-os/contract.ts

### supplier_engine

- workflow — routers/supplier-portal.ts importe modules/operations.ts

### vehicle_engine

- identity — vehicle-engine/service.ts importe identity-os/contract.ts
- payout_engine — publie vehicule.vendu, consommé par payout_engine
- politique_pays — vehicle-engine/service.ts importe country-policy/service.ts
- smart — vehicle-engine/service.ts importe smart-engine/services/duplicate-detection.ts

### vente

- identity — client/src/pages/vente/CentreEssaiRoutier.tsx appelle trpc.kyc
- pro_portal — client/src/pages/vente/CentreFournisseurs.tsx appelle trpc.pro
- search — client/src/pages/vente/CentreAlertesRecherche.tsx appelle trpc.searches

### vente_pro

- boutons — client/src/pages/vente/TableauBordVendeur.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)
- country — client/src/pages/EspaceProVente.tsx embarque lib/currency.tsx (trpc.currency)
- identity — client/src/pages/InscriptionProVente.tsx appelle trpc.kyc
- pro_portal — client/src/pages/InscriptionProVente.tsx appelle trpc.pro
- vo_espaces — client/src/pages/vente/TableauBordVendeur.tsx appelle trpc.voEspaces

### vo

- boutons — client/src/pages/VOInterne.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

### workflow

- boutons — client/src/pages/superadmin/GestionEmployesMKAPMS.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)

## Validation et limites

- Tests purs : couverture des dépendances des 94 moteurs ; dépendances partielles, staging prouvé, tables/services manquants.
- Base PostgreSQL compatible isolée : enregistrement des 94 moteurs, persistance des connexions détectées, conservation d’un état disabled, rejeu idempotent.
- 10 tests des services partagés existants réussis. Build local réussi.
- Typecheck : 39 erreurs préexistantes dans des fichiers non modifiés ; aucun diagnostic nouveau dans les fichiers de ce lot.
- L’activation réelle, les secrets fournisseur, les permissions et l’exécution de chaque parcours métier en production restent à vérifier. Le navigateur 502 est laissé de côté à la demande du propriétaire.

## Connexion de l’IA au diagnostic — lot distinct

`observabilite.getSystemHealth` existait uniquement comme fiche désactivée
REGISTERED_NOT_IMPLEMENTED. Aucun exécuteur n’était branché pour cet outil.
Il lit maintenant `registryOverview` et l’inventaire généré : vue globale,
puis détail par identifiant moteur. Les données du catalogue sont explicitement
séparées de l’état vivant ; absence du registre et moteur inconnu sont signalés.

Accès identique au registre de Direction (admin/super_admin), acteur authentifié
obligatoire. La politique et l’exécuteur existants restent utilisés. Test sur
base isolée : 94 moteurs lus, panne/disabled conservés, filtre détaillé, refus
public/pro/employé/sans acteur. Aucune activation ni écriture métier.
La correction autonome des workflows, l’accès effectif à un modèle IA en
production et l’intégration de chacun des domaines restent à vérifier séparément.

## Cycle intelligent — faux diagnostic systématique

L’étape `observer` comparait HealthCategory.level à `ok`, alors que les seules
valeurs sont `green`, `yellow`, `red`. Le cycle annonçait donc TOUS les domaines
hors état normal, même ceux affichés verts. Correction du contrat consommé,
test d’une plateforme entièrement verte (0 anomalie) et d’un mélange
vert/jaune/rouge (seuls jaune/rouge comptés). Aucune alerte réelle masquée.
Ce défaut figurait également parmi les diagnostics TypeScript préexistants.
