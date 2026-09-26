# Audit ciblé avant ajout — IA plateforme principale, 27 septembre 2026

Base auditée : 9993b23d3cb7827cb8c2324064108c0b195f93df. La consigne utilisateur concerne désormais les deux plateformes ; aucune donnée ni mémoire SHOP ne doit être fusionnée avec MAIN. Ce document complète l'existant, sans remplacement du plan maître.

## Existant réutilisé

- `server/intelligences/autonomie.ts` : sept niveaux, plafond global, règles par domaine, contrôle avant action et journal. Aucun nouveau moteur d'autonomie.
- `server/intelligences/permissions.ts` : rôle ∩ moteur, attribution PDG et historique ; les permissions restent distinctes du niveau d'autonomie.
- `server/intelligences/fonctions.ts` : catalogue des fonctionnalités, décisions persistées et dépendances fournisseur. L'état déclaré n'est pas une preuve de test réel de toutes les capacités.
- `server/intelligences/orchestrateur.ts` : missions exécutées par étapes et rapport des blocages. Ce moteur est appelé à la demande ; aucun ordonnanceur permanent n'est ajouté implicitement.
- `memoire.ts`, `memoire-utilisateur.ts`, `memoire-projet.ts`, `fichiers.ts`, `rag.ts` : mémoires et documents existants à préserver. Leur présence ne prouve pas une couverture de toutes les connaissances.
- `plan-autonomie.ts`, `shadow.ts`, `provider.ts` : trajectoire de détachement fournisseur, comparaison et routage déjà présents. Aucun fournisseur désactivé pendant ce lot.
- Routeur `index.ts` : toutes les commandes utilisées ici restent `pdgProcedure`. La façade publique n'obtient pas ces droits.

## Lacune corrigée

L'onglet Automatisations utilisait uniquement ModulePlaceholder. Il affiche désormais les niveaux réels, permet leur modification via le routeur existant, comporte un arrêt de l'exécution par domaine, un lancement de mission autorisée et le rapport réel. Les réglages ne sont jamais mutés à l'ouverture de la page.

L'onglet Paramètres conserve les règles maîtres et commandes déclarées et ajoute le catalogue des capacités avec interrupteurs, conditions et motifs. Aucun onglet ni fonction existante supprimé.

## Limites et suite

Ce lot rend accessibles des commandes existantes ; il ne prétend pas avoir construit tous les moteurs métiers, multimodaux ou toute la liste maître. Aucun réglage de production ne vaut « activé » sans lecture de son état après mutation authentifiée. L'activation générale des niveaux 6/7 n'est pas appliquée aveuglément. Les actions financières, messages à des tiers et l'infrastructure restent soumises à leurs règles.

L'absorption de 100 % des poids ou connaissances d'un modèle fermé via son API est impossible. Conserver des connaissances autorisées et évaluer un moteur propre/local est une trajectoire distincte ; ne pas éteindre un fournisseur avant preuve de remplacement.

Validation : build identique Railway réussi. Vérification TypeScript relancée avec davantage de mémoire après dépassement du tas par défaut. Tests existants fondations/permissions/indépendance fournisseur tentés mais bloqués localement par absence de PostgreSQL (ECONNREFUSED), aucun succès revendiqué. Inventaires de boutons/cliquables/moteurs régénérés conformément aux scripts ; aucune règle de détection réduite.
