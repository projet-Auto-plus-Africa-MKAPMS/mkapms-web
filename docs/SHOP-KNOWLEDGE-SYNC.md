# IA : connaissance technique du dépôt SHOP

Autorisation propriétaire : l’IA est la seule connexion active entre SHOP et la plateforme principale. Aucun moteur métier central ni schéma métier n’est modifié.

`POST /api/v1/intelligences/shop/knowledge` reçoit des lots de références de fichiers, capacités, historique de commits et extraits de documentation technique. Aucun outil d’exécution, clé fournisseur, donnée de commande ou compte client n’est exposé.

Authentification : JWT GitHub Actions RS256, clés publiques GitHub via HTTPS fixe, issuer/audience exacts, repository_id et repository_owner_id immuables, dépôt SHOP, branche main, événement push, workflow shop-step1.yml, runner github-hosted, commit/run identiques au manifeste, durée maximale 15 minutes. Pas de secret permanent à copier. Le filtre de maintenance existant reste appliqué.

Le job SHOP ne demande cette identité qu’après les validations. Les lots sont strictement validés, bornés, hachés et idempotents. Un snapshot incomplet reste proposé ; le hash global et tous les numéros de lots doivent correspondre avant confirmation. Une réémission contradictoire échoue sans écrasement.

Stockage réutilisé : in_connaissance, visibilité pdg_uniquement, provenance Git et commit dans la source, audit in_actions sans JWT. Aucune migration. Les snapshots précédents sont conservés et leurs commits restent distincts. Le retrieval existant peut retrouver les entrées confirmées avec les permissions PDG ; les citations doivent être rapportées au commit indiqué, pas assimilées automatiquement au déploiement courant.

La réponse INDEXED_METADATA prouve une persistance complète de références et d’extraits autorisés. Elle ne prouve ni indexation de tout le code source, ni entraînement d’un modèle, ni agent développeur autonome, ni connexion interactive SHOP vers l’API de raisonnement. Cette dernière continue d’exiger sa délégation propre.

Tests : identité falsifiée/expirée/mauvais dépôt/branche/workflow/commit, chemins interdits, limites ; PostgreSQL jetable core_ai_test pour isolation PDG, idempotence concurrente, hash incomplet/invalide, rollback et audit. Ne jamais exécuter le test DB contre la production.
