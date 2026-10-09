# Inventaire réel des moteurs — Centre Cyber-Électrique MKA.P-MS / Frontier OS

Fichier **généré** par `scripts/gen-frontier-inventaire.ts` le 2026-10-09. Lecture seule : la Boutique n'a été ni modifiée ni appelée. Les données complètes (fonction, références fichier avec ligne, tests, manques, doublons) sont dans `server/frontier-os/inventaire/*.generated.ts`, affichées dans le centre, salle « Moteurs ».

## Sources relevées

| Dépôt | Commit | Date du commit |
| --- | --- | --- |
| Boutique (`mkapms-shop`) | `c82fc74a30fa95d89c27115fc788c1fa09dbab6c` | 2026-10-09T07:56:10+02:00 |
| Plateforme principale (`mkapms-web`) | `80c0df6b1ff8349d02e29ca2f5844742a859897f` | 2026-10-09T06:49:06+02:00 |

## Noms exacts et identités

Noms trouvés dans le code : « MKA.P-MS SHOP » / « MKA.P-MS Shop » (dépôt `mkapms-shop`), « MKAPMS Shop » (une fois, `docs/SHOP-LIVING-PANELS-2026-10-08.md` de la Boutique), « plateforme principale » (nom employé par le registre de la Boutique et les contrats). **« MKH Shop », « MKPMS Shop » et « boutique principale » n'existent dans aucun des deux dépôts.** Un seul dépôt de boutique est accessible. Rien n'est fusionné ni inventé : ces trois noms ne désignent pas une boutique à part : **précision du PDG (9 oct. 2026)** — le système est installé dans la plateforme principale, MKAPMS Web (le mot « Israël » de la précision vocale n'est pas compris et n'est pas repris). Les dépôts `mkapms-carte` (Map) et `mkapms-deployment` existent dans l'organisation mais ne sont pas inventoriés dans ce lot (la consigne : la Boutique d'abord, puis la plateforme principale) : **à vérifier**.

## Définition des états (prouvés par le code, jamais déclarés)

- **Incomplet** : déclaré, sans liaison d'exécution relevée, ou bloqué par un accès externe.
- **Préparé** : contrat ou structure prêts pour la connexion, sans exécution raccordée.
- **Installé** : une liaison d'exécution (route, procédure) existe dans le code.
- **Testé** : installé et un fichier de test existe dans le dépôt (les tests ne sont **pas** exécutés par cet inventaire).
- **Connecté** : liaison avec une autre plateforme observée et vérifiée par le centre. **Aucun moteur ne l'est aujourd'hui.**

« Déclaré seulement » = rien dans le code ne prouve que le moteur fonctionne : une table ou une fiche de registre n'est pas un moteur (formule de l'audit de la Boutique lui-même).

## Boutique — 83 moteurs déclarés

Répartition : incomplets 33 · préparés 1 · installés 34 · testés 15 · connectés 0. Déclarés seulement (aucune liaison d'exécution) : 34.

Audit propre de la Boutique (`server/gap-inventory.json`, commit audité `449e4f7`) : 105 exigences du plan d'ensemble, 285 critères partiels, 870 critères manquants, 0 complets ; plan complet dans le dépôt : **non**. 49 exigences n'ont aucun moteur dans le registre ; 27 moteurs du registre n'ont pas d'exigence rattachée (correspondance non établie, donc aucun test relevé pour eux — le relevé est prudent par construction).

| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `shop.engine` | Shop Engine | incomplet | declare | 0 | 3 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — schema, events |
| `commerce.kernel` | Commerce Kernel | incomplet | declare | 0 | 2 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `product` | Product Engine | teste | tests | 26 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `catalogue` | Catalogue Engine | teste | tests | 1 | 1 | service-access | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `offer` | Offer Engine | teste | tests | 1 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `attribute` | Attribute Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `variant` | Variant Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `manufacturer` | Manufacturer Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `search.index` | Search Index Engine | teste | tests | 2 | 2 | — | audit de la Boutique : critères manquants — contract, schema, permissions, audit, events |
| `keyword` | Keyword Demand Engine | installe | liaison | 2 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `filter` | Filter Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `recommendation` | Recommendation Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `publisher` | Publisher Engine | installe | liaison | 6 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `seller.publication` | Seller Publication Engine | installe | liaison | 6 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `feed` | Feed Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `seo` | SEO Engine | installe | liaison | 3 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `seo.indexing` | Google Indexing Readiness Engine | installe | liaison | 3 | 0 | — | accès externe requis : Domain, sitemap submission and Google Search Console/API access required before live indexing can be verified. ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `ai.discovery` | AI Discovery Readiness Engine | installe | liaison | 3 | 0 | — | accès externe requis : AI crawler discovery cannot be forced; SHOP prepares structured public content, feeds, keywords and crawler policy only. ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `campaign` | Campaign Engine | incomplet | declare | 0 | 0 | — | liaison déclarée mais aucune route correspondante retrouvée dans le code ; aucun fichier de test existant relevé pour ce moteur |
| `booster` | Boost Engine | installe | liaison | 3 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `audience` | Audience Engine | installe | liaison | 3 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `event.marketing` | Event Marketing Engine | installe | liaison | 1 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `promotion` | Promotion Engine | installe | liaison | 2 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `coupon` | Coupon Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `pricing` | Pricing Engine | teste | tests | 5 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `cart` | Cart Engine | teste | tests | 2 | 1 | — | audit de la Boutique : critères manquants — audit, events, health, dashboard, integration |
| `checkout` | Checkout Engine | teste | tests | 1 | 2 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `order` | Order Engine | teste | tests | 6 | 2 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `order.communication` | Order Communication Engine | installe | liaison | 7 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment.gateway` | Payment Gateway Engine | installe | liaison | 5 | 0 | — | accès externe requis : One Stripe/PSP connector required; routes stay separated by SHOP engine. ; aucun fichier de test existant relevé pour ce moteur |
| `payment.individual` | Individual Payment Engine | installe | liaison | 4 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment.pro` | Professional Payment Engine | installe | liaison | 4 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment.subscription` | Pro Subscription Payment Engine | installe | liaison | 8 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment.country` | Country Payment Routing Engine | installe | liaison | 5 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment.internal` | Internal Treasury Payment Engine | installe | liaison | 1 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `payment` | Legacy Payment View | installe | liaison | 1 | 0 | shared-stripe-account | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `ledger` | Internal Ledger Engine | teste | tests | 1 | 2 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `payout` | Payout Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; accès externe requis : Stripe payout access required. |
| `documents` | Document Engine | installe | liaison | 59 | 0 | shop-documents-only | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `invoice` | Invoice Engine | incomplet | declare | 0 | 2 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `inventory` | Inventory Engine | teste | tests | 1 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `warehouse` | Warehouse Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `supplier` | Supplier Engine | teste | tests | 5 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `supplier.connector` | Supplier Connector Engine | installe | liaison | 123 | 0 | — | accès externe requis : Credentials per supplier required; local vault only. ; aucun fichier de test existant relevé pour ce moteur |
| `supplier.adapter.template` | Supplier Adapter Template | installe | liaison | 2 | 0 | — | accès externe requis : Supplier contract/API/feed required. ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `shipping` | Shipping Engine | teste | tests | 1 | 1 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `quote` | Quote Engine | installe | liaison | 2 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `customs` | Customs Engine | installe | liaison | 2 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `carrier` | Carrier Adapter Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; accès externe requis : Carrier contract/API required. |
| `routing` | Routing Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `return` | Return Engine | incomplet | declare | 0 | 2 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `refund` | Refund Engine | incomplet | declare | 0 | 2 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `after_sales` | After-sales Engine | teste | tests | 1 | 2 | — | audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `customer` | Customer Engine | teste | tests | 3 | 2 | — | — |
| `seller` | Seller/Pro Engine | installe | liaison | 4 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `subscription` | Subscription Engine | installe | liaison | 6 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `review` | Review Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `rating` | Rating Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `qa` | Question/Answer Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `trust` | Trust Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `fraud` | Fraud Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `moderation` | Moderation Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `product.policy` | Forbidden Product Control Engine | teste | tests | 12 | 1 | — | audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, integration |
| `media` | Media Engine | installe | liaison | 240 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, service, permissions, audit, events, health, dashboard, tests, integration |
| `image.processing` | Image Processing Engine | installe | liaison | 65 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `video.publisher` | YouTube/Video Publisher Adapter | installe | liaison | 62 | 0 | — | accès externe requis : YouTube account/API required; no direct plugin installed. ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `analytics` | Analytics Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `business_intelligence` | Business Intelligence Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `smart.system` | Système intelligent boutique | prepare | declare | 0 | 0 | shop-intelligence-isolated | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `developer.agent` | Developer Agent Engine | incomplet | declare | 0 | 1 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, integration |
| `vault` | Integration Vault Engine | installe | liaison | 121 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `audit` | Audit Engine | incomplet | declare | 0 | 2 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; audit de la Boutique : critères manquants — events, health, dashboard, integration |
| `privacy` | Privacy/Consent Engine | installe | liaison | 2 | 0 | — | aucun fichier de test existant relevé pour ce moteur ; audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration |
| `legal.content` | Legal Content Engine | installe | liaison | 2 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `faq` | FAQ Engine | installe | liaison | 2 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `contact` | Contact Engine | installe | liaison | 5 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `communication` | Communication Engine | installe | liaison | 5 | 0 | — | aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé) |
| `notification` | Notification Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; accès externe requis : Email/SMS provider required. |
| `webhook` | Webhook Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `queue` | Queue/Job Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `scheduler` | Scheduler Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `cache` | Cache Engine | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; aucun fichier de test existant relevé pour ce moteur |
| `shopify.adapter` | Shopify Adapter | incomplet | declare | 0 | 0 | — | aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique) ; accès externe requis : Shopify plugin/account/API required before live sync. |

### Exigences sans moteur dans le registre de la Boutique

- Category Engine
- Brand Engine
- Stock Reservation Engine
- Mapping Engine
- Cars4Kids Adapter
- Order Routing Engine
- Dropshipping Engine
- Warranty Engine
- Spare-Part Engine
- Homepage Engine
- Navigation Engine
- Button Engine
- Search Engine
- Discovery Video Engine
- Flash Sale Engine
- Favorites Engine
- Logistics Gateway
- Tracking Engine
- Delivery Promise Engine
- Multi-Package Engine
- Multi-Leg Engine
- Proof-of-Delivery Engine
- Card Adapter
- Bank Transfer Adapter
- Instant Transfer Adapter
- Country Engine SHOP
- Currency Engine
- Tax Engine
- Translation Engine
- Internationalization Engine
- Halal Policy Engine
- Legal Product Policy Engine
- Product Compliance Engine
- Safety/Recall Engine
- Product Rights Engine
- Product Document Engine
- AI Gateway
- Engineering Knowledge
- Product AI Engine
- Omnichannel Commerce Engine
- API Gateway
- Event Bus
- Security Engine
- Data Quality Engine
- Duplicate Engine
- Import Engine
- Export Engine
- Loyalty Engine
- Dispute Engine

## Moteurs intermédiaires préparés par la Boutique pour la plateforme (6)

| Intermédiaire | Moteur Boutique | Dans le registre | Déclaré | Sens | Face à (plateforme) | Canal shop_link |
| --- | --- | --- | --- | --- | --- | --- |
| main-to-shop-entry | `access.entry` | **non** | READY | plateforme_vers_boutique | `redirection` | — (à créer) |
| shared-stripe-account | `payment` | oui | BLOCKED_EXTERNAL | mixte | `payment` | paiement |
| shared-google-owner | `seo.campaign` | **non** | BLOCKED_EXTERNAL | mixte | `seo` | google |
| shop-documents-only | `documents` | oui | READY | boutique_vers_plateforme | `document` | documents |
| shop-intelligence-isolated | `smart.system` | oui | READY | boutique_vers_plateforme | `smart` | etat |
| service-access | `catalogue` | oui | BUILT | plateforme_vers_boutique | `intelligences` | catalogue |

Cinq sont des **contrats déclarés** (lignes de `shop_strategy.connection_contracts`, migration 0057 : main-to-shop-entry=READY, shared-stripe-account=BLOCKED_EXTERNAL, shared-google-owner=BLOCKED_EXTERNAL, shop-documents-only=READY, shop-intelligence-isolated=READY) ; un seul est du **code exécutable** : l'accès de service (`server/service-access.mjs`, présent). Le registre de la Boutique affirme lui-même `mainPlatformConnection: 'FORBIDDEN'` pour chaque moteur et sa règle AGENTS.md interdit à la Boutique d'appeler la plateforme : les trois contrats « Boutique → plateforme » n'ont donc **aucun émetteur** côté Boutique. C'est un écart à lever par les agents de la Boutique, pas par la plateforme.

### État de chaque intermédiaire de la Boutique (relevé)

| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `main-to-shop-entry` | Accès Boutique depuis la plateforme (entrée) | prepare | declare | 0 | 0 | main-to-shop-entry | contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte ; le moteur « access.entry » nommé par le contrat n'existe pas dans le registre des moteurs de la Boutique |
| `shared-stripe-account` | Compte de paiement commun (Stripe) | incomplet | declare | 0 | 0 | shared-stripe-account | contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte ; accès externe requis avant toute activation (statut BLOCKED_EXTERNAL) |
| `shared-google-owner` | Propriétaire Google commun | incomplet | declare | 0 | 0 | shared-google-owner | contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte ; accès externe requis avant toute activation (statut BLOCKED_EXTERNAL) |
| `shop-documents-only` | Références de documents de la Boutique | prepare | declare | 0 | 0 | shop-documents-only | contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte ; aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme) |
| `shop-intelligence-isolated` | État technique agrégé du système intelligent de la Boutique | prepare | declare | 0 | 0 | shop-intelligence-isolated | contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte ; aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme) |
| `service-access` | Accès de service (jeton, portées, routes /api/service) | teste | tests | 60 | 1 | service-access | — |

## Boutique — moteur de stock propre (famille séparée du registre)

Lot de la Boutique « moteurs de stock indépendants » (`migrations/0077_stock_engine_preparation.sql:2`, document `docs/SHOP-STOCK-ENGINES-2026-10-09.md`). Ce n'est **pas** un des 83 moteurs du registre : il est compté ici seulement, une fois. Il est **préparé et désactivé** (contrainte `enabled = false` dans la migration : présente sur les trois tables) ; aucune quantité ni source externe n'est connectée.

| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `stock.mka_own.inventory` | Moteur de stock propre MKA.P-MS SHOP | teste | tests | 4 | 3 | stock.mka_own.intermediary | désactivé par la base elle-même : `enabled = false` imposé par contrainte CHECK dans la migration 0077 ; aucune quantité réelle ni source externe connectée (quantités inconnues = null, « non connectées ») ; aucune observation n'est appliquée au stock réel dans ce lot (applied:false) ; le raccordement aux comptes existants est une étape ultérieure annoncée par la Boutique |
| `stock.mka_own.intermediary` | Moteur intermédiaire de stock MKA.P-MS SHOP | prepare | declare | 0 | 3 | — | désactivé par la base elle-même : `enabled = false` imposé par contrainte CHECK dans la migration 0077 ; aucune quantité réelle ni source externe connectée (quantités inconnues = null, « non connectées ») ; aucune observation n'est appliquée au stock réel dans ce lot (applied:false) ; le raccordement aux comptes existants est une étape ultérieure annoncée par la Boutique |

- Compte posé par la migration : « Stock propre MKA.P-MS SHOP » (`mkapms-shop-own`, type MKA_OWN, canal INTERNAL). Aucun autre compte n'existe tant que le Fondateur n'en crée pas.
- 10 modèles de comptes préparés (désactivés, pas des commerces réels) : Stock propre MKA.P-MS · Professionnels · Fabricants · Particuliers · Grossistes · Distributeurs · Fournisseurs · Fournisseurs dropshipping · Entrepôts et opérateurs logistiques · Autres types de comptes.
- 7 canaux préparés (tous désactivés, sans identifiant d'accès) : MKA.P-MS · Amazon · stock vendeur · Amazon · stock logistique FBA · Alibaba · fournisseur B2B — API non validée · Shopify · article et emplacement · Flux fournisseur existant · Autre canal à préciser.
- Contrôles de non-duplication : tables : 7 tables shop_inventory.*, aucune n'est portée par le registre des 83 moteurs ; identifiants : « stock.* » absent du registre (aucun doublon) ; 10 modèles de comptes = 10 types déclarés dans le code (concordance vérifiée), un seul compte réel : « mkapms-shop-own » ; intermédiaire de stock ≠ intermédiaires de la migration 0057 : aucun identifiant commun.

## Plateforme principale — canaux du moteur intermédiaire shop_link (6)

| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `shop_link:catalogue` | Catalogue — l'IA de la plateforme travaille dans la Boutique | teste | tests | 1 | 2 | service-access | — |
| `shop_link:etat` | État technique de la Boutique (agrégé) | teste | tests | 1 | 2 | shop-intelligence-isolated | — |
| `shop_link:documents` | Références de documents de la Boutique | teste | tests | 1 | 2 | shop-documents-only | — |
| `shop_link:ia-memoire` | Échange de mémoire entre les deux IA (boîte de validation) | teste | tests | 3 | 2 | — | aucun intermédiaire correspondant préparé côté Boutique (ia-mémoire) : à convenir avec les agents de la Boutique |
| `shop_link:paiement` | Compte de paiement commun (Stripe) | incomplet | declare | 0 | 0 | shared-stripe-account | attente externe : En attente de la clé Stripe et du webhook de la Boutique (activation externe, côté Boutique). Aucune connexion n'est possible avant. |
| `shop_link:google` | Propriétaire Google commun | incomplet | declare | 0 | 0 | shared-google-owner | attente externe : En attente des propriétés Google de la Boutique et de son propre compte Google (activation externe, côté Boutique). Aucune connexion n'est possible avant. |

## Plateforme principale — 96 moteurs

Répartition : incomplets 10 · préparés 0 · installés 58 · testés 28 · connectés 0.

| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |
| --- | --- | --- | --- | ---: | ---: | --- | --- |
| `account_routing` | Account Routing Engine | installe | liaison | 4 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `accounting_internal` | Internal Accounting Engine | installe | liaison | 4 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `accounting_marketplace` | Accounting Marketplace Engine | installe | liaison | 7 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `achat` | Univers Achat Engine | installe | liaison | 27 | 0 | — | dependance_non_declaree ×1 ; aucun fichier de test dans les dossiers du moteur |
| `achat_officiel` | Achat Officiel Engine | incomplet | declare | 0 | 0 | — | dependance_non_declaree ×1 ; sans_logique_serveur ×1 |
| `achat_particulier` | Achat Particulier Engine | incomplet | declare | 0 | 0 | — | dependance_non_declaree ×1 ; sans_logique_serveur ×1 |
| `achat_pro` | Achat Professionnel Engine | incomplet | declare | 0 | 0 | — | dependance_non_declaree ×1 ; sans_logique_serveur ×1 |
| `activation_audit` | Audit d'activation | teste | tests | 7 | 3 | — | — |
| `ai_fabric` | Fabrique Intelligence | installe | liaison | 15 | 0 | — | ecran_sans_contenu ×6 ; aucun fichier de test dans les dossiers du moteur |
| `ai_learning` | Apprentissage Intelligence | installe | liaison | 6 | 0 | — | sans_ecran ×1 ; aucun fichier de test dans les dossiers du moteur |
| `analytics` | Analytics Engine | installe | liaison | 8 | 0 | — | dependance_sans_preuve ×3 ; aucun fichier de test dans les dossiers du moteur |
| `assurance` | Assurance Engine | installe | liaison | 9 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `atelier` | Moteur d'Atelier | installe | liaison | 20 | 0 | — | bouton_sans_action ×5 ; ecran_sans_contenu ×2 |
| `auction_engine` | Auction Engine | teste | tests | 15 | 1 | — | dependance_sans_preuve ×1 |
| `audit` | Audit OS | installe | liaison | 6 | 0 | — | ecran_sans_contenu ×1 ; aucun fichier de test dans les dossiers du moteur |
| `auto_branchement` | Module d'auto-branchement | installe | liaison | 7 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `avis_reputation` | Reviews & Reputation Engine | installe | liaison | 60 | 0 | — | dependance_non_declaree ×1 ; dependance_sans_preuve ×1 |
| `backup` | Backup & Recovery OS | installe | liaison | 10 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `boutons` | Moteur de boutons | teste | tests | 3 | 2 | — | — |
| `cartegrise` | Carte Grise Engine | installe | liaison | 22 | 0 | — | ecran_sans_contenu ×14 ; bouton_declare_absent_ecran ×1 |
| `code_graph` | Mémoire technique du code (Code Knowledge Graph) | installe | liaison | 9 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `command_center` | Command & Development Center | installe | liaison | 14 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `completion_center` | Completion Center (ce qui reste à faire) | installe | liaison | 7 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `comptabilite` | Comptabilité Engine | installe | liaison | 16 | 0 | — | bouton_sans_action ×2 ; dependance_non_declaree ×1 |
| `connaissance_auto` | Automotive Knowledge Engine | teste | tests | 20 | 1 | — | — |
| `connecteur_google_business` | Connecteur Google Business Profile | teste | tests | 6 | 1 | — | — |
| `continuous_test` | Contrôle continu de la plateforme | installe | liaison | 9 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `contract` | Contrat OS | installe | liaison | 16 | 0 | — | ecran_sans_contenu ×2 ; dependance_sans_preuve ×1 |
| `controle_technique` | Contrôle Technique Engine | incomplet | declare | 0 | 0 | — | dependance_sans_preuve ×4 ; sans_logique_serveur ×1 |
| `core` | Core Engine | teste | tests | 109 | 4 | — | bouton_declare_absent_ecran ×2 ; dependance_non_declaree ×5 |
| `country` | Country OS | teste | tests | 11 | 3 | — | ecran_sans_contenu ×21 ; dependance_non_declaree ×1 |
| `depannage` | Dépannage Engine | installe | liaison | 9 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `document` | Document OS | teste | tests | 16 | 3 | shop-documents-only | ecran_sans_contenu ×1 ; dependance_non_declaree ×1 |
| `document_engine` | Document Engine | teste | tests | 18 | 1 | — | dependance_non_declaree ×3 ; dependance_sans_preuve ×2 |
| `energie_recharge` | Energy Engine — Recharge | installe | liaison | 6 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `estimation` | Estimation Hub | installe | liaison | 2 | 0 | — | dependance_sans_preuve ×1 ; aucun fichier de test dans les dossiers du moteur |
| `event_bus` | Bus d'événements central | installe | liaison | 7 | 0 | — | emission_dynamique ×1 ; dependance_non_declaree ×4 |
| `finance` | Financement Engine | installe | liaison | 5 | 0 | — | ecran_sans_contenu ×1 ; bouton_sans_action ×1 |
| `financial_intelligence` | Financial Intelligence Engine | installe | liaison | 5 | 0 | — | dependance_sans_preuve ×2 ; sans_ecran ×1 |
| `frontier_os` | Centre Cyber-Électrique MKA.P-MS / Frontier OS | teste | tests | 53 | 13 | — | dependance_non_declaree ×4 |
| `garage` | Garage Engine | installe | liaison | 12 | 0 | — | bouton_sans_action ×8 ; ecran_sans_contenu ×4 |
| `identity` | Identity OS | teste | tests | 42 | 4 | — | ecran_sans_contenu ×6 ; bouton_sans_action ×1 |
| `importafrica` | Import Afrique Engine | installe | liaison | 6 | 0 | — | dependance_sans_preuve ×3 ; aucun fichier de test dans les dossiers du moteur |
| `indexation` | Moniteur d'indexation | installe | liaison | 10 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `intelligences` | MKA.P-MS AI | teste | tests | 123 | 46 | service-access | bouton_sans_action ×1 ; dependance_non_declaree ×10 |
| `investment` | Investment Engine | teste | tests | 22 | 2 | — | — |
| `journey` | Customer Journey OS | installe | liaison | 6 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `knowledge` | Knowledge Engine | incomplet | declare | 0 | 0 | — | ecran_sans_contenu ×12 ; dependance_sans_preuve ×3 |
| `language` | Language OS | installe | liaison | 12 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `livraison` | Livraison Engine | installe | liaison | 8 | 0 | — | dependance_non_declaree ×1 ; aucun fichier de test dans les dossiers du moteur |
| `livraison_vehicule` | Vehicle Delivery Engine | teste | tests | 9 | 1 | — | — |
| `location` | Univers Location Engine | installe | liaison | 13 | 0 | — | bouton_sans_action ×12 ; bouton_declare_absent_ecran ×1 |
| `location_particulier` | Location Particulier Engine | incomplet | declare | 0 | 0 | — | dependance_sans_preuve ×1 ; sans_logique_serveur ×1 |
| `location_pro` | Location Professionnelle Engine | incomplet | declare | 0 | 0 | — | bouton_sans_action ×5 ; ecran_sans_contenu ×10 |
| `logistics_engine` | Logistics Engine | teste | tests | 18 | 1 | — | emission_dynamique ×1 ; dependance_non_declaree ×2 |
| `marketing` | Publicité Engine | installe | liaison | 8 | 0 | — | ecran_sans_contenu ×7 ; dependance_non_declaree ×1 |
| `media` | Media OS | installe | liaison | 6 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `media_authenticity` | Media Authenticity Engine | installe | liaison | 7 | 0 | — | sans_ecran ×1 ; aucun fichier de test dans les dossiers du moteur |
| `messaging` | Messagerie OS | installe | liaison | 17 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `monitoring` | Monitoring Engine | installe | liaison | 9 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `notification` | Notification OS | installe | liaison | 19 | 0 | — | ecran_sans_contenu ×19 ; aucun fichier de test dans les dossiers du moteur |
| `partner_engine` | Partner Engine | teste | tests | 14 | 1 | — | ecran_sans_contenu ×8 |
| `parts_engine` | Parts Engine | teste | tests | 31 | 1 | — | dependance_non_declaree ×2 ; dependance_sans_preuve ×1 |
| `payment` | Payment Engine | teste | tests | 56 | 1 | shared-stripe-account | destination_inconnue ×1 ; ecran_sans_contenu ×1 |
| `payment_orchestrator` | Payment Orchestrator | installe | liaison | 6 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `payout_engine` | Payout Engine | teste | tests | 13 | 1 | — | dependance_non_declaree ×2 ; dependance_sans_preuve ×2 |
| `permission` | Permission OS | teste | tests | 29 | 2 | — | ecran_sans_contenu ×1 |
| `pieces` | Pièces Auto Engine | installe | liaison | 34 | 0 | — | bouton_sans_action ×5 ; ecran_sans_contenu ×12 |
| `politique_pays` | Country Policy Engine | installe | liaison | 10 | 0 | — | ecran_sans_contenu ×16 ; aucun fichier de test dans les dossiers du moteur |
| `pro_account` | Pro Account Engine | installe | liaison | 11 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `pro_portal` | Pro Portal Engine | installe | liaison | 43 | 0 | — | ecran_sans_contenu ×5 ; aucun fichier de test dans les dossiers du moteur |
| `product_engine` | Google Product Engine | teste | tests | 6 | 3 | — | dependance_non_declaree ×1 |
| `proximity_engine` | Proximity Engine | installe | liaison | 4 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `rd_lab` | Automotive R&D Lab | installe | liaison | 14 | 0 | — | ecran_sans_contenu ×131 ; aucun fichier de test dans les dossiers du moteur |
| `redirection` | Redirection Engine | teste | tests | 12 | 1 | main-to-shop-entry | — |
| `resilience` | Resilience & Safety Engine | installe | liaison | 18 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `risque_import` | Import Risk Engine | installe | liaison | 2 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `scheduler` | Scheduler OS | installe | liaison | 8 | 0 | — | ecran_sans_contenu ×16 ; aucun fichier de test dans les dossiers du moteur |
| `search` | Search Engine | installe | liaison | 6 | 0 | — | dependance_non_declaree ×2 ; aucun fichier de test dans les dossiers du moteur |
| `seo` | SEO Engine | installe | liaison | 28 | 0 | shared-google-owner | aucun fichier de test dans les dossiers du moteur |
| `shop_link` | Moteur intermédiaire Boutique | teste | tests | 16 | 2 | shop_link | — |
| `smart` | Smart Engine | teste | tests | 95 | 6 | shop-intelligence-isolated | — |
| `smart_audit` | Audit & activation du Système Intelligent | teste | tests | 7 | 1 | — | — |
| `supplier_engine` | Supplier Engine | teste | tests | 25 | 3 | — | dependance_non_declaree ×1 ; dependance_sans_preuve ×1 |
| `support` | Support OS | installe | liaison | 16 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `transport` | VTC & Taxi Engine | installe | liaison | 7 | 0 | — | ecran_sans_contenu ×4 ; dependance_sans_preuve ×1 |
| `vehicle_engine` | Vehicle Engine | teste | tests | 27 | 1 | — | dependance_non_declaree ×4 ; sans_ecran ×1 |
| `vente` | Univers Vente Engine | incomplet | declare | 0 | 0 | — | destination_inconnue ×1 ; ecran_sans_contenu ×10 |
| `vente_officiel` | Vente Officielle Engine | installe | liaison | 3 | 0 | — | dependance_sans_preuve ×1 ; aucun fichier de test dans les dossiers du moteur |
| `vente_particulier` | Vente Particulier Engine | incomplet | declare | 0 | 0 | — | dependance_sans_preuve ×1 ; sans_logique_serveur ×1 |
| `vente_pro` | Vente Professionnelle Engine | incomplet | declare | 0 | 0 | — | dependance_non_declaree ×5 ; dependance_sans_preuve ×1 |
| `visibility` | Global Visibility Engine | installe | liaison | 21 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `vo` | VO Engine | installe | liaison | 13 | 0 | — | dependance_non_declaree ×1 ; aucun fichier de test dans les dossiers du moteur |
| `vo_engine` | VO Engine — estimation & reprise | installe | liaison | 13 | 0 | — | aucun fichier de test dans les dossiers du moteur |
| `vo_espaces` | VO Espaces — cloisonnement officiel / pro / particulier | teste | tests | 8 | 1 | — | — |
| `workflow` | Workflow Engine | installe | liaison | 76 | 0 | — | ecran_sans_contenu ×30 ; dependance_non_declaree ×1 |

## Doublons et recouvrements relevés

Boutique : `offer` (mêmes tables que promotion (Promotion Engine) ; mêmes tables que pricing (Pricing Engine)) · `search.index` (mêmes tables que keyword (Keyword Demand Engine)) · `keyword` (mêmes tables que search.index (Search Index Engine)) · `seo.indexing` (mêmes tables que ai.discovery (AI Discovery Readiness Engine)) · `ai.discovery` (mêmes tables que seo.indexing (Google Indexing Readiness Engine)) · `campaign` (mêmes tables que booster (Boost Engine)) · `booster` (mêmes tables que campaign (Campaign Engine)) · `promotion` (mêmes tables que offer (Offer Engine) ; mêmes tables que pricing (Pricing Engine)) · `pricing` (mêmes tables que offer (Offer Engine) ; mêmes tables que promotion (Promotion Engine)) · `payment.gateway` (mêmes tables que payment (Legacy Payment View)) · `payment.individual` (mêmes tables que payment.pro (Professional Payment Engine)) · `payment.pro` (mêmes tables que payment.individual (Individual Payment Engine)) · `payment` (vue héritée : recouvre les moteurs payment.* (à retirer quand ils sont complets) ; mêmes tables que payment.gateway (Payment Gateway Engine)) · `supplier.connector` (mêmes tables que vault (Integration Vault Engine) ; mêmes tables que shopify.adapter (Shopify Adapter)) · `analytics` (mêmes tables que developer.agent (Developer Agent Engine) ; mêmes tables que queue (Queue/Job Engine)) · `developer.agent` (mêmes tables que analytics (Analytics Engine) ; mêmes tables que queue (Queue/Job Engine)) · `vault` (mêmes tables que supplier.connector (Supplier Connector Engine) ; mêmes tables que shopify.adapter (Shopify Adapter)) · `queue` (mêmes tables que analytics (Analytics Engine) ; mêmes tables que developer.agent (Developer Agent Engine)) · `shopify.adapter` (mêmes tables que supplier.connector (Supplier Connector Engine) ; mêmes tables que vault (Integration Vault Engine)).

Plateforme : `document` (même racine de nom que document_engine (à vérifier : deux moteurs pour une fonction ?)) · `document_engine` (même racine de nom que document (à vérifier : deux moteurs pour une fonction ?)) · `vo` (même racine de nom que vo_engine (à vérifier : deux moteurs pour une fonction ?)) · `vo_engine` (même racine de nom que vo (à vérifier : deux moteurs pour une fonction ?)).

Aucun doublon n'est fusionné ni supprimé ici : le centre les signale.

## Limites de la méthode

- Les routes de la Boutique sont lues dans le code (analyse statique des déclarations `app.use/get/post…` et des montages) : une route construite dynamiquement ne serait pas vue. Un moteur sans route trouvée est marqué incomplet, sans prétendre qu'il ne fonctionne pas.
- La correspondance entre un moteur du registre et une exigence du plan d'ensemble est posée à la main sur des noms identiques ou quasi (table `EXIGENCE_DE` du générateur). Les tests ne sont relevés que par ce biais.
- Aucun test n'est exécuté, aucune mesure n'est prise en direct : l'état de chaque moteur dans l'application réellement déployée reste **non observé** tant que le centre n'a pas de liaison contrôlée.
- Les statuts des contrats sont ceux de la migration 0057 ; la base réelle de la Boutique peut les avoir modifiés depuis.
