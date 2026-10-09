# Interrupteur local de la Boutique — contrat pour les agents de la Boutique (9 octobre 2026)

**À qui s'adresse ce document** : aux agents qui travaillent dans le dépôt de la Boutique (`mkapms-shop`). Ce dépôt n'a pas été modifié par la plateforme : la plateforme fournit **son** côté du contrat et un émetteur de référence (`scripts/boutique-emetteur-reference.mjs`, dans le dépôt de la plateforme) que la Boutique porte chez elle. Tant que la Boutique n'exécute pas cet émetteur, son interrupteur local reste **simulé par le centre** et la vitrine l'affiche « simulé ».

## Principe

Le Centre Cyber-Électrique veut qu'une ligne soit coupée par **trois coupures indépendantes** : l'interrupteur local de la Boutique, le contact central du centre, l'interrupteur local de la plateforme. Pour que le premier soit réel :

1. La plateforme n'appelle **jamais** la Boutique (sa règle). La Boutique **vient chercher** les ordres.
2. La Boutique **applique** l'ordre à **son** interrupteur local (au minimum : ouverte, elle n'émet plus rien vers la plateforme sur cette ligne ; fermée, elle peut émettre).
3. La Boutique renvoie un **accusé signé** contenant l'état qu'elle **observe elle-même**. Jamais l'état « demandé » : l'état observé. La Boutique peut **refuser** un ordre (elle reste maîtresse chez elle) : elle accuse alors son état réel, inchangé, et la plateforme n'affichera pas « connecté ».
4. Sans accusé signé et frais (moins de deux minutes), l'état de l'interrupteur distant est **inconnu** : jamais « connecté », jamais « coupé confirmé ».

## Authentification

Les mêmes clés et la même signature que tous les messages de la Boutique vers la plateforme (clé publique Ed25519 enregistrée dans « Câble Boutique », format DER SPKI en base64url). En-têtes : `x-shop-link-time` (millisecondes, 13 chiffres, écart d'horloge toléré 90 s), `x-shop-link-nonce` (32 caractères hexadécimaux, usage unique), `x-shop-link-signature` (Ed25519, base64url). Message signé :

```
SHOP-LINK-1
<MÉTHODE>
<chemin sans requête>
<horodatage>
<nonce>
<SHA-256 hexadécimal du corps — chaîne vide pour GET, JSON.stringify(corps) pour POST>
```

Les routes ci-dessous sont soumises **au seul commutateur général** du câble (c'est le plan de commande du centre, pas une voie de données) et ont leur propre plafond (120 messages par minute). Sans clé enregistrée, aucune ne répond.

## Prendre les ordres

`GET /api/shop-link/v1/commutation/ordres` → `{ ok, version: 1, disponible, ordres: [{ id, ligne, voulu, expireLe }] }`

- `ligne` : l'identifiant de la ligne côté Boutique (la clé de l'intermédiaire du contrat : `shop-documents-only`, `shop-intelligence-isolated`, `service-access`…).
- `voulu` : `activate` (fermer l'interrupteur) ou `deactivate` (l'ouvrir).
- `expireLe` : au-delà, **ignorer l'ordre**. Un seul ordre est vivant par ligne ; un nouveau remplace l'ancien.
- Cadence recommandée : toutes les 5 à 10 secondes. La plateforme attend l'accusé 20 secondes au plus avant de déclarer l'interrupteur distant « non confirmé ».

## Accuser

`POST /api/shop-link/v1/commutation/accuse`

```json
{ "version": 1, "accuses": [
  { "ordre": 42, "ligne": "shop-documents-only", "etat": "connected", "observeLe": "2026-10-09T08:00:00.000Z" },
  { "ordre": null, "ligne": "shop-intelligence-isolated", "etat": "disconnected", "observeLe": "2026-10-09T08:00:01.000Z" }
] }
```

- `ordre` : le numéro de l'ordre accusé, ou `null` pour un **rapport spontané** (à envoyer aussi périodiquement : un état plus ancien que deux minutes redevient inconnu).
- `etat` : `connected` (interrupteur fermé) ou `disconnected` (ouvert), **tel que la Boutique l'observe**.
- `observeLe` : l'horloge de la Boutique ; refusé s'il est antérieur de plus de 5 minutes ou postérieur de plus de 90 secondes.
- Réponse : `{ ok, status: "RECU", acceptes, refuses: [{ ligne, raison }] }`. Un accusé plus ancien n'écrase jamais un plus récent. Corps hors contrat (champ en trop) : 400.

## Ce que la Boutique doit garantir

- Interrupteur **ouvert** ⇒ **aucun** message n'est émis vers la plateforme sur cette ligne, y compris les reprises et les files d'attente.
- Un redémarrage de la Boutique **ne referme jamais** un interrupteur ouvert tout seul : l'état doit survivre au redémarrage.
- Le secret (clé privée) vit dans le coffre de la Boutique, jamais dans le dépôt ni dans un journal.

## Essai

`node scripts/boutique-emetteur-reference.mjs --generer-cle cle.pem` (écrit la clé privée, affiche la clé publique à enregistrer), puis `--plateforme <url> --cle cle.pem --etat etat.json --intervalle 5`. Les tests de la plateforme (`server/frontier-os/__tests__/reel.integration.test.ts`) jouent la Boutique avec cet émetteur contre le vrai serveur de `shop_link`.

## Ce que cela ne fait pas

Aucune donnée de la Boutique ne passe par ces deux routes : seulement un ordre et un état d'interrupteur. Elles ne remplacent aucun contrat de données (`shop-documents-only`, etc.). Rien n'est actif tant que le PDG n'a pas, dans le centre, (1) posé `FRONTIER_MODE_REEL=oui` sur le service, (2) armé le mode réel avec sa phrase de confirmation, (3) passé la ligne en réel.
