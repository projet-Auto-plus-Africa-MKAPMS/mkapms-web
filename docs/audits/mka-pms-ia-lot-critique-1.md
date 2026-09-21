# Audit MKA PMS IA — lot critique 1

Date de l'audit : 21 septembre 2026. Périmètre exécuté : architecture centrale, chaîne de conversation et fondation mémoire/connaissance directement utilisée par cette chaîne. Cet audit ne renomme aucun composant de la plateforme.

## Parcours réel vérifié

1. Les boutons `BoutonIntelligences` émettent l'événement `mkapms:intelligences`; `AssistantFlottant`, monté par le `Layout`, l'écoute. La page plein écran `/intelligences` appelle le même endpoint public.
2. Les formulaires public et flottant appellent `intelligences.assistant`. L'application dédiée `/intelligence`, réservée au PDG, appelle `intelligences.demander`.
3. Le routeur tRPC applique `publicProcedure` au côté public et `pdgProcedure` au côté direction. La direction vérifie aussi la propriété des sessions avant lecture, écriture, renommage ou suppression.
4. `service.ts::demander` crée/reprend la session, persiste la question, applique domaine/plafond, assemble contexte et historique, puis appelle le moteur propriétaire : `provider.ts::appeler` en public, ou la boucle d'outils existante en direction.
5. `provider.ts` demande une capacité à la Fabrique Intelligence. `chooseProvider` ne retient que les fournisseurs configurés et `CONNECTED_AND_TESTED`, selon confidentialité. OpenAI, Mistral et l'endpoint local compatible OpenAI sont les adaptateurs texte réellement implémentés; Anthropic est enregistré mais volontairement non routable faute d'adaptateur.
6. La réponse ou l'échec est persisté dans `in_messages`, mesuré dans `in_usage`, publié sur l'event bus puis renvoyé à tRPC. Les interfaces affichent le texte, ou le motif public générique sans fuite de fournisseur.

## Causes réelles du blocage de conversation

### Cause de disponibilité

La génération non triviale dépend aujourd'hui d'au moins un accès `OPENAI_API_KEY`, `MISTRAL_API_KEY` ou `LOCAL_LLM_URL`. Ces variables étaient consommées par le code mais absentes de `.env.example`; sans l'une d'elles, le routeur refuse honnêtement de fabriquer une réponse. Cette action d'infrastructure reste externe au dépôt.

La table persistante `af_providers` était seulement complétée pour les nouveaux codes. Une ligne plus ancienne n'était jamais resynchronisée avec le catalogue propriétaire : ses `env_keys`, sa capacité ou son plafond de confidentialité pouvaient diverger du contrat réellement utilisé par `provider.ts`. Le routeur évaluait alors un état périmé et l'appel échouait plus loin, même après correction de la configuration. Le catalogue est désormais resynchronisé sans toucher à la suspension décidée par la direction, au dernier usage ni à l'historique.

### Cause de continuité et de sécurité de session

Une session publique existante était reprise sur le seul couple `sessionId`/`cote`. Comme les identifiants sont numériques, un autre visiteur pouvait injecter un message dans une conversation publique devinée; `filPublic` pouvait également lire tout fil public sans vérifier l'empreinte. La chaîne n'avait donc pas de propriété cohérente de bout en bout. La reprise, la lecture et l'écriture exigent maintenant l'empreinte déjà calculée par le moteur; une tentative étrangère crée une nouvelle session au lieu d'altérer l'ancienne, et la lecture est refusée.

## Mémoire et connaissances

### Existant constaté

- `in_messages` et `in_sessions` portent l'historique; une fenêtre des huit derniers messages est déjà injectée.
- `in_conversation_resume` fournit un résumé additif et non bloquant pour les longues conversations direction.
- `in_memoire_utilisateur` et `in_memoire_projet` sont isolées par propriétaire et déjà exposées par le Context Engine.
- `in_fichiers`/`in_fichier_morceaux` alimentent le retrieval lexical des documents réellement indexés.
- `in_connaissance` porte la base globale validée, versionnée, sourcée et filtrée par visibilité.
- `memoire.ts` fédère les catégories dont les propriétaires réels sont le graphe de code, Knowledge Engine, Resilience, Country Policy, Engine Registry, Smart Engine et Support OS, au lieu de les recopier.
- Le RAG existant utilise PostgreSQL full-text, trace chaque retrieval et déclare honnêtement les embeddings indisponibles.

### Défaut corrigé

Le Context Engine chargeait mémoire utilisateur/projet et résumé, mais la conversation direction n'interrogeait ni les fichiers indexés ni `in_connaissance`. Ces connaissances existaient donc sans alimenter le message principal. `demander` utilise maintenant `recherche-globale.ts`, avec ses filtres propriétaires, pour ajouter les résultats réellement pertinents. Une absence de résultat reste vide; une panne de retrieval est signalée au contexte mais ne bloque pas la conversation.

La surface publique n'a pas reçu les connaissances `interne` : aucune visibilité `public` validée n'existe dans le schéma actuel. Les exposer aurait constitué une fuite, pas une connexion.

## Fournisseurs, modèles et fallbacks

| Dépendance | Fonction actuelle | Déjà possédé par MKA PMS IA | Manque constaté | Maintien |
|---|---|---|---|---|
| OpenAI | Texte et vision via Chat Completions, découverte `/models` | Adapter central, routage, audit, coûts, erreurs et repli | Secret hébergeur; validation réelle du modèle autorisé | Oui |
| Mistral | Repli texte, résidence UE déclarée | Même contrat compatible, routage et mesures | Secret hébergeur; test réseau réel | Oui |
| Modèle local | Endpoint compatible OpenAI | Adapter et priorité selon confidentialité | Service de modèle, URL, capacité et évaluation qualité | Oui, sans prétendre qu'il existe |
| Anthropic | Catalogue seulement | Registre et gouvernance | Adapter d'appel et tests; statut `REGISTERED` exact | Non routé, non supprimé |

Le modèle par défaut OpenAI est `gpt-4o-mini` et Mistral `mistral-large-latest`; la découverte du compte prévaut lorsque disponible. Aucun secret ni réponse de test n'a été ajouté.

## Outils, événements, audit et monitoring

- Le registre central d'outils, la politique, l'exécuteur et la boucle existent. La conversation direction utilise cette boucle; le public appelle volontairement sans outils internes.
- Les appels d'outils portent le même `traceId` que l'échange et sont exposés à la direction.
- `intelligences.echange` et `intelligences.domaine` passent par l'event bus existant.
- Les tentatives fournisseur, jetons, durée, coûts non mesurés, usage journalier et erreurs sont conservés. Les surfaces publiques ne reçoivent ni clé, ni modèle, ni fournisseur.
- Le streaming, l'annulation serveur, les embeddings, l'adapter Anthropic, la parole synthétique et la conversation temps réel restent explicitement non implémentés. Aucun faux statut prêt n'a été créé.

## Trajectoire d'autonomie (6–7 mois, sans retrait d'API)

1. **Mois 1–2 :** mesurer les requêtes et échecs existants, enrichir uniquement la connaissance sourcée/validée, renseigner les coûts et établir un jeu d'évaluation interne non sensible.
2. **Mois 2–3 :** brancher un service d'embeddings derrière `embeddingGateway`, conserver le repli lexical et comparer rappel, citations, latence et coût.
3. **Mois 3–4 :** déployer un modèle local compatible avec l'adapter existant sur des tâches bornées (classement, extraction, résumé), en mode shadow sans remplacer OpenAI/Mistral.
4. **Mois 4–5 :** entraîner ou affiner seulement sur des données dont provenance, licence, consentement et rétention sont établis; promouvoir les résultats via les validations humaines existantes.
5. **Mois 5–6 :** étendre par capacité après seuils qualité/sécurité, avec repli externe conservé et arrêt automatique du candidat local en cas de régression.
6. **Mois 6–7 :** décider capacité par capacité de l'internalisation sur preuves mesurées. Hébergement, modèle, embeddings et surveillance doivent chacun garder un plan de retour fournisseur.

## Limites de vérification de ce lot

L'environnement ne fournit ni PostgreSQL local ni secrets de fournisseur. Les tests statiques, le typecheck et le build peuvent être exécutés; les scénarios d'intégration base existants sont préparés mais leur exécution nécessite un PostgreSQL de test migré. La validation de production nécessite ensuite la configuration externe d'au moins un fournisseur et un test de santé depuis l'hébergement, sans divulguer la clé.
