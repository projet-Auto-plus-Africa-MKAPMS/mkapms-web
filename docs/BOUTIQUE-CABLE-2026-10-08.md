# Câble Boutique — moteur intermédiaire côté plateforme principale (8 octobre 2026)

Règle du PDG : la plateforme principale et la Boutique ne se connectent **jamais directement** entre leurs moteurs. Chaque côté a son moteur intermédiaire ; entre les deux il n'y a qu'un câble que le PDG coupe ou rebranche, canal par canal ou en entier. Ce document décrit le côté **plateforme** (`server/shop-link/`). Le côté Boutique (son propre moteur intermédiaire) se construit dans le dépôt de la Boutique et doit respecter le contrat ci-dessous. Rien dans la Boutique n'a été touché pour ce lot.

## Ce qui est en place (plateforme)

| Élément | Où | Rôle |
| --- | --- | --- |
| Contrats des canaux | `server/shop-link/contrats.ts` | Sens, données autorisées/interdites, routes permises, limites. Tout ce qui n'y est pas déclaré est refusé. |
| Câble | `server/shop-link/service.ts` | Commutateur général + un interrupteur par canal, lus en base à chaque passage. **Défaut : tous les canaux coupés.** Chaque changement exige un motif et est tracé. |
| Passerelle sortante | `server/shop-link/sortant.ts` | `viaCable(...)` donne son `fetch` au client existant (`server/intelligences/boutique.ts`, inchangé) : câble coupé → ni lecture du Coffre ni appel réseau ; routes en liste blanche ; corps scanné contre les secrets ; journal. |
| Passerelle entrante | `server/shop-link/entrant.ts` | Seul point d'entrée des messages de la Boutique : `/api/shop-link/v1/*`. |
| Boîte d'échange des IA | `server/shop-link/boite.ts` | Les deux IA ne se parlent pas : chaque élément attend la décision du PDG. |
| Écran PDG | `/admin/boutique-cable` (carte dans l'accueil Admin, PDG seulement) | Couper/rebrancher, clés, boîte d'échange, journal, dernier état reçu. |
| Moteur au registre | `shop_link` (catalogue, pont OS, périmètre) | Santé et charge remontées au centre de contrôle. |
| Base | `drizzle/0156_shop_link.sql` | 7 tables `shop_link_*` (aucun secret). |

## Canaux

| Canal | Sens | Contrat Boutique | État |
| --- | --- | --- | --- |
| `catalogue` | plateforme → Boutique | accès de service (`/api/service/*`, jeton du Coffre) | disponible |
| `etat` | Boutique → plateforme | `shop-intelligence-isolated` | disponible |
| `documents` | Boutique → plateforme | `shop-documents-only` | disponible |
| `ia-memoire` | les deux | (nouveau) | disponible |
| `paiement` | les deux | `shared-stripe-account` | **attente externe** (clé Stripe et webhook de la Boutique) — non branchable |
| `google` | les deux | `shared-google-owner` | **attente externe** (propriétés Google de la Boutique) — non branchable |

Couper un canal n'efface rien. Le commutateur général coupe tout, y compris la lecture de l'état du câble.

## Contrat pour le moteur intermédiaire de la Boutique (messages entrants)

Chaque message est signé en **Ed25519** avec une clé propre à la Boutique (gardée dans son coffre). La plateforme n'enregistre que la clé **publique** (DER SPKI en base64url, le même format que `/api/public/ai-identity` côté Boutique), saisie par le PDG dans l'écran « Câble Boutique ». Cinq clés actives au maximum ; une clé révoquée est refusée tout de suite et ne se réactive pas.

En-têtes : `x-shop-link-time` (ms, 13 chiffres, ±90 s), `x-shop-link-nonce` (32 hex, à usage unique), `x-shop-link-signature` (base64url), `x-shop-link-key` (facultatif : début de l'empreinte SHA-256 de la clé).

Message signé (séparé par des sauts de ligne) :

```
SHOP-LINK-1
<MÉTHODE>
<chemin demandé, sans requête>      ex. /api/shop-link/v1/etat
<horodatage ms>
<nonce>
<SHA-256 hex de JSON.stringify(corps)>   (chaîne vide pour GET)
```

Ordre de traitement : taille → signature → câble (général puis canal) → anti-rejeu et plafond par minute → schéma strict → filtre de contenu → traitement → journal.

| Route | Canal | Corps (strict, `version: 1`) | Limites |
| --- | --- | --- | --- |
| `GET /api/shop-link/v1/cable` | général | — | lecture des canaux branchés (booléens seulement) |
| `POST /api/shop-link/v1/etat` | `etat` | `observeLe`, `moteurs[{id, etat: ok/degrade/arret/inconnu, completude 0–100/null}]` (200 max), `alertes`, `compteurs{nom: entier}` (100 max) | 32 Kio, 12/min |
| `POST /api/shop-link/v1/documents` | `documents` | `documents[{reference, statut, totalMinor, devise, referenceCommande, emisLe}]` (50 max) — références seulement | 64 Kio, 30/min |
| `POST /api/shop-link/v1/ia/boite` | `ia-memoire` | `elements[{type: procedure/connaissance/erreur_solution, titre, contenu ≤ 4000, source}]` (10 max) | 32 Kio, 20/min |
| `GET /api/shop-link/v1/ia/sortants` | `ia-memoire` | — | éléments approuvés par le PDG, 20 max |
| `POST /api/shop-link/v1/ia/accuse` | `ia-memoire` | `ids[]` (50 max) | accusé de réception |

Réponses : `200 {ok:true,…}` · `400 INVALID_INPUT` · `401 UNAUTHORIZED` · `409 REJEU` · `413 TROP_VOLUMINEUX` · `422 DONNEE_INTERDITE` (secret, clé, e-mail, téléphone, IBAN) · `429 QUOTA` · `503 CABLE_COUPE` (avec `raison`: `MAITRE_COUPE` ou `CANAL_COUPE`) · `503 UNAVAILABLE`. Un `503 CABLE_COUPE` n'est pas une panne : la Boutique attend et ne réessaie pas en boucle. Si la plateforme est fermée au public (résilience), les écritures reçoivent d'abord le `503 SERVICE_UNAVAILABLE` habituel de la plateforme.

Le journal des refus d'un appelant non identifié est limité à 30 lignes par minute (un inconnu ne peut pas le remplir).

Un élément déposé dans la boîte reste « en attente » ; approuvé, il est seulement **proposé** dans la base de connaissances (statut « proposé », jamais confirmé automatiquement). La plateforme n'appelle jamais la Boutique pour l'échange : la Boutique vient chercher ses éléments (`ia/sortants`) et accuse réception.

## Ce qui ne passe jamais

Prix, TVA, stock, livraison, approbation, publication (aucune de ces routes n'est dans la liste blanche) ; clients et commandes ; coffre et secrets ; contenu des conversations ; données personnelles ; prix d'achat fournisseurs.

## Pas encore branché (décision du PDG requise)

- Les outils de l'IA (`server/intelligences/outils/familles/boutique.ts`) appellent encore le client existant **directement**. Les passer par `viaCable` est un changement d'une ligne par outil, mais il rend le câble `catalogue` effectif pour eux : câble coupé par défaut, donc outils Boutique hors service tant que le PDG ne l'a pas branché.
- Deux chemins existants restent hors câble : `/api/v1/shop/analyse` (inférence signée, désactivée par `SHOP_AI_ENABLED`) et `/api/v1/intelligences/shop/knowledge` (réception historique de la CI de la Boutique, arrêtée côté Boutique). Les mettre sous le câble modifierait leur code.
- Le bouton « Boutique » de l'accueil lit toujours `SHOP_PUBLIC_URL`.
- Changement de nom de domaine : seule l'adresse du Coffre (« Boutique — adresse ») change ; rien n'est figé dans le code.

## Vérifications faites

Tests `server/shop-link/__tests__/` (contrats, signatures, transport gardé, câble, clés, passerelles sortante et entrante en HTTP réel, boîte d'échange, routeur PDG, flux du centre de contrôle, hygiène du journal), contrôles du build, migrations sur base neuve, démarrage du serveur construit. Aucun appel réel vers la Boutique n'a été fait : tout est testé en local avec transport simulé.
