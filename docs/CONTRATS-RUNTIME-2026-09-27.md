# Alignement des contrats runtime

Le contrôle TypeScript relevait 38 erreurs préexistantes, indépendantes des ajouts IA. Elles provenaient de huit fichiers. Les corrections utilisent les contrats serveur existants :

- Caractéristiques annonces : `boite`, `kilometrage`, `puissanceCv` ; restitution de `segmentLocation` lors d'une édition.
- Livraison : tarif absent affiché comme indisponible, sans navigation vers une validation avec un montant nul.
- Administration portefeuilles : lecture de `data.wallets`, identifiant `payoutId`, identifiant utilisateur numérique vérifié avant mutation. Les champs de crédit restent présents si la demande échoue ; les boutons de statut sont bloqués pendant leur mutation.
- Photos : le type accepte le tableau déjà utilisé par le correctif iOS, sans modifier ce correctif.
- Smart Engine : compteurs en lecture seule via les requêtes Drizzle typées ; aucune modification de la purge. Le test de nettoyage du texte affirme explicitement la présence du résultat avant de lire sa longueur.

Le contrôle TypeScript complet devient une étape CI avant le build. Aucun endpoint, droit d'accès, schéma de base ni politique métier n'est supprimé ou remplacé. Cette correction ne constitue pas une validation complète des moteurs commerciaux ni des anciens écrans de démonstration.
