# Order Engine

**Statut** : §36-37 (section "COMMANDES") du Plan Maître Fournisseurs — voir
`docs/PLAN_MAITRE_FOURNISSEURS.md`. **Version** : 0.1.0. **Maturité** :
`sprint_1_minimal` (règle MOS #14). **Registre** : `staging` tant qu'aucune
commande réelle n'a été menée de bout en bout en production.

**Origine** : portail « Véhicule sur commande » demandé explicitement par la
Direction — un véhicule sourcé chez un fournisseur, commandable par un client
avant que MKA.P-MS ne le possède physiquement. **Le système VO existant
(`server/modules/vo.ts`, véhicules déjà achetés par MKA.P-MS) reste
totalement séparé : aucune table, aucune donnée, aucun statut partagé.**

## Audit préalable (obligatoire avant tout LOT, règle MOS #15)

L'audit a établi que ce moteur **ne part pas de zéro** et ne duplique rien
d'existant :

- **Vehicle Engine** (LOT 2, `server/vehicle-engine/`, moteur `vehicle_engine`,
  staging) couvre déjà tout ce qui précède une commande : ingestion
  fournisseur, normalisation, tarification, disponibilité, publication vers
  `annonces`. Ce moteur **prend le relais après publication** — il ne relit
  jamais les tables du Vehicle Engine, seulement des entiers libres
  (`vehicleItemId`, `annonceId`, `supplierProfileId`) fournis par l'appelant.
- **Supplier Engine** (LOT 1) et son `supplierProfileId` confidentiel ne sont
  jamais recopiés en clair ici — aucun nom, prix d'achat ni marge fournisseur
  dans ce moteur (section 6, demande PDG : jamais exposé côté client).
- **Document OS** (`server/document-os/`) reste le registre unique de
  documents : `orderDocuments` ne fait que savoir quel `doc_documents.id`
  appartient à quelle commande, jamais un second stockage de fichiers.
- **`bookings`** (table core existante, paiement/réservation Stripe) n'est
  pas étendue : ce moteur stocke seulement `depositPaymentRef`/
  `balancePaymentRef` comme entiers libres vers le mécanisme de paiement déjà
  en place, jamais un second système de paiement parallèle.
- **`annonces`** (table core existante) n'est pas dupliquée : la fiche
  publique déjà utilisée par le Vehicle Engine reste la même page produit
  pour tous les véhicules (section 6, demande PDG) ; seuls les deux statuts
  publics et l'existence d'une commande active sont dérivés ici.
- Aucun événement `commande.*` n'existait dans le catalogue Event Bus
  (`server/event-bus/catalog.ts`) : nouveau domaine `"commande"` créé, écart
  comblé plutôt que dupliqué.

## Ce que ce moteur ajoute

1. **Cycle de vie interne en 10 étapes** (`INTERNAL_ORDER_STATUSES`,
   `INTERNAL_STATUS_TRANSITIONS`) — jamais un saut d'étape silencieux :
   `vehicule_selectionne → disponibilite_confirmee → documents_controles →
   prix_marge_valides → commande_fournisseur_creee → vehicule_en_preparation
   → transport_organise → inspection_realisee → pret_visite_livraison →
   decision_finale`, plus les branches `annulee`/`litige`/`remboursee`.
   Visible uniquement côté employé (`avancerStatut`).
2. **Statut client en 7 étapes** (`CUSTOMER_ORDER_STATUSES`), toujours
   **dérivé** du statut interne par `deriveCustomerStatus()` — jamais un
   second champ stocké qui pourrait diverger de l'historique réel
   (`orderStatusHistory`). Le vocabulaire fournisseur/employé n'est jamais
   exposé au client.
3. **Attribution employé** (section 7, demande PDG) — un véhicule/une
   commande attribué à un employé précis, qui ne voit que ses commandes
   (`mesVehiculesAttribues`, `detailCommandeEmploye`).
4. **Décision finale après visite/inspection** (section 10, demande PDG) :
   `accepte` / `retourne` / `garde`, toujours posée par un humain
   (`poserDecision`), jamais calculée automatiquement. Re-poser une décision
   remplace explicitement l'ancienne (`onConflictDoUpdate`), jamais une
   seconde ligne silencieuse. Impossible une fois la commande dans un statut
   terminal.
5. **Documents de commande** (section 11, demande PDG) — pointeurs vers des
   lignes Document OS déjà créées (`enregistrerDocument`), avec séparation
   stricte des documents internes réservés
   (`EMPLOYEE_ONLY_DOCUMENT_TYPES` : bon de commande, ordre de mission
   transporteur, dossier de retour, document comptable) — jamais visibles
   côté client (`listerDocuments({ employeeView: false })`).
6. **Journal d'audit** (règle MOS #12) — chaque action réelle journalisée
   (`order_engine_audit_log`), jamais une opération silencieuse.

## Ce que ce moteur n'ajoute PAS (Sprint 2+, hors périmètre de ce LOT)

- La génération réelle des documents (devis, contrat, facture, PV…) — ce
  moteur sait seulement qu'un document a été généré et le rattache ; la
  génération elle-même reste à brancher sur `server/document-os/templates.ts`
  / `DocumentPDF.tsx` (composant existant, à étendre).
- L'assistant de création d'annonce (dépôt rapide 1 minute, lecture
  automatique des documents/photos) — couvert par le Vehicle AI Engine
  existant (§14 du plan), pas recréé ici.
- L'automatisation des actions en aval d'une décision (facture, PV, mission
  transporteur générés automatiquement) — la décision est posée ici, mais le
  déclenchement réel de chaque document reste un câblage ultérieur, explicite
  et validé, jamais un automatisme caché.
- Le portail client/employé (UI) — ce moteur n'est que le backend ; aucune
  page n'a encore été construite.

## Sécurité (règle absolue du plan)

Aucune donnée fournisseur confidentielle (nom, prix d'achat, marge) n'est
stockée ici — seuls des entiers libres (`vehicleItemId`, `supplierProfileId`)
référencent le Vehicle Engine / Supplier Engine. Aucun fichier binaire
stocké : `docDocumentId` référence toujours une ligne Document OS existante.

## Endpoints tRPC (`orderEngine.*`)

```
meta / healthStatus / controlCenterFeed                        (public)
dashboard                                                        (admin)
creerCommande / attribuerEmploye / avancerStatut / poserDecision (admin)
enregistrerDocument                                              (admin)
mesVehiculesAttribues / detailCommandeEmploye / journalAudit      (admin — vue employé)
mesCommandes / detailCommandeClient                               (client — jamais les étapes internes)
```

## Migration

`drizzle/0158_order_engine.sql` — 100 % additive, tables préfixées
`order_items`/`order_status_history`/`order_decisions`/`order_documents`/
`order_engine_audit_log`. Aucune table existante modifiée, aucune contrainte
FK dure inter-moteur (références en entiers libres, convention du contrat
public).

## Tests

`server/order-engine/__tests__/order-engine.test.ts` — réels, base de données
réelle : création de commande, attribution employé, transitions de statut
interne (séquence complète + rejet d'un saut d'étape), dérivation du statut
client (jamais le vocabulaire interne exposé), décision finale (acceptée,
remplacée, refusée hors statut valide), visibilité des documents
(employé vs client), étanchéité entre clients, journal d'audit, exposition
MOS (health/feed/dashboard) et branchement réel dans l'`appRouter`.

## Sprints (règle MOS #14)

- **Sprint 1** ✅ (ce lot) — cycle de vie interne/client, attribution
  employé, décision finale, documents de commande, event bus, tests réels,
  `npm run typecheck` et `check:*` vérifiés verts.
- **Sprint 2** — branchement réel de la génération de documents
  (Document OS/`DocumentPDF.tsx`), automatisation explicite des actions en
  aval d'une décision (facture/PV/mission transporteur), portail client et
  portail employé (UI), intégration du dépôt rapide avec le Vehicle AI
  Engine existant (§14).
