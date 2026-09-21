# LOT 4 — Engine Gateway / Engine Registry

## Dépendances Git constatées

- `DEPENDS_ON_COMMIT`: `9b380d6` (diagnostic Button Engine et séparation des fixtures Tool Registry).
- `DEPENDS_ON_BRANCH`: `work`, base locale au démarrage de ce lot.
- `DEPENDS_ON_PR`: non vérifiable depuis le shell GitHub non authentifié au début du lot.

## Cause réelle

Le dépôt possédait déjà les briques canoniques : registre généré des moteurs,
contrats Engine Registry, univers, Tool/Capability Registries, Event Bus, probes
et audit Intelligence. Elles n'étaient toutefois pas agrégées dans une matrice
unique exploitable par MKA PMS IA. Les diagnostics spécialisés n'avaient pas non
plus de contrat commun.

## Correction additive

- Extension de l'audit Intelligence existant, sans second registre ni logique
  métier dupliquée, avec une matrice calculée depuis les sources de vérité.
- Ajout des contrats communs d'appel/résultat Engine Gateway et de diagnostic.
- `DiagnosticBouton` étend désormais le diagnostic commun.
- Ajout d'une route PDG de lecture de la matrice et d'un gate structurel pur.
- Le générateur recense maintenant séparément les tests de chaque moteur.

## Limites honnêtes

Le champ historique `provider` des outils ne désigne pas systématiquement un
`engineId` canonique. Aucun rattachement artificiel n'est créé : une action est
déclarée connectée uniquement quand cette propriété peut être prouvée. Les états
runtime nécessitent PostgreSQL ; sans connexion, la matrice indique
`NOT_VERIFIED` et non `OK`.
