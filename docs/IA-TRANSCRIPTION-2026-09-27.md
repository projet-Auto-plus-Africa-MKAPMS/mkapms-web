# Transcription privée MAIN

Ajout dans Intelligence → Voix : dépôt MP3/WAV/WebM/M4A/MP4 (8 Mo), microphone volontaire limité à 60 secondes, écoute locale, confirmation des droits puis transcription. Le texte est téléchargeable, privé par propriétaire, sans indexation mémoire. L'audio reste transitoire et n'est pas stocké en base.

L'appel natif utilise le gateway provider existant, l'identité MAIN, le modèle whisper-1, les contrôles de rôle/moteur/capacité, aucun shadow ni transfert SHOP. Quota persistant partagé : 20 productions/24 h. Le hash inclut les octets audio ; réessayer la même demande ne réexécute pas un appel déjà reçu. Une erreur garde le fichier dans la page. Fermeture de page : arrêt des pistes microphone.

Migration additive 0148 : valeurs transcription/text/plain autorisées. Aucun retrait de fonction existante. Tests injectés : multipart, signature/format, taille, erreurs fournisseur filtrées, résultat texte, idempotence et isolation PostgreSQL. Build identique Railway. L'essai réel nécessite une session PDG et un fournisseur autorisé ; la conversation continue Realtime reste distincte et non implémentée.

Référence : https://developers.openai.com/api/docs/guides/speech-to-text
