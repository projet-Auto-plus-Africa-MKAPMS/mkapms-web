# MKA PMS IA — lot Moteur de boutons / diagnostic

## Source de vérité

Le catalogue `ENGINE_CATALOG` contient actuellement **94 moteurs**, et non 88. Le nombre 88 est donc un objectif historique, pas la valeur à figer dans le code. L'audit continu s'appuie sur `server/engine-registry/catalog.ts`, ses contrats, périmètres, sondes et le rapport généré `server/data/moteurs.ts`; ce dernier ne doit pas être modifié manuellement.

## État avant

Le Moteur de boutons résolvait les actions, interrogeait le Moteur de Redirection, journalisait les clics et publiait `bouton.sans_action`. Le Module d'auto-branchement inventoriait les cliquables, publiait les anomalies et écrivait une synthèse dans la mémoire technique existante.

Deux ruptures empêchaient toutefois MKA PMS IA d'exploiter réellement le diagnostic :

1. la charge `bouton.sans_action` ne portait que `code`, `ecran` et `manque`, sans moteur/composant/type, route, permission, dépendance, gravité ni action possible ;
2. le handler d'apprentissage classait `bouton.casse` comme échec de code, mais pas l'événement réellement émis par le moteur, `bouton.sans_action`. Celui-ci entrait en mémoire technique mais ne devenait jamais une expérience récurrente.

## Correction

- Un contrat `DiagnosticBouton` traduit chaque échec constaté en diagnostic structuré sans appeler de modèle et sans inventer de cause.
- `signalerClic` joint ce diagnostic à l'événement existant; aucun bus parallèle n'est créé.
- Le catalogue Event Bus exige désormais tous les champs du diagnostic avant distribution.
- Le handler MKA PMS IA classe `bouton.sans_action` dans la mémoire d'expériences existante. Une récidive incrémente donc son occurrence au lieu de recommencer le diagnostic à zéro.
- Aucune correction automatique de production n'est autorisée : `actionPossible` décrit seulement le parcours à vérifier. Toute correction reste branche → tests → commit → Pull Request.

## Limites honnêtes

Le test pur du contrat ne nécessite aucune infrastructure. Les tests historiques du Button Engine et de l'Event Bus qui écrivent leurs preuves restent dépendants d'un PostgreSQL de test migré. Aucun secret ni accès de production n'est nécessaire pour ce lot.
