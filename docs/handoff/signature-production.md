# HANDOFF DEVAN — Signature de production des 5 applications Android

## Objectif

Obtenir un `.aab` signé avec le vrai certificat de production pour chacune
des 5 applications (`grandpublic`, `pro`, `command`, `intelligence`,
`investor`), prêt à être importé dans Google Play Console.

## Pourquoi je ne peux pas l'exécuter

Aucun keystore de production, ni ses mots de passe, ne sont présents dans ce
dépôt ni dans l'environnement de travail où ce code a été construit — par
conception (règle du projet : le trousseau ne doit jamais être commité).
`android/app/build.gradle` cherche le trousseau à l'emplacement
`android/keystore.properties` (fichier ignoré par git) ou dans les variables
d'environnement `MKAPMS_KEYSTORE_FILE` / `MKAPMS_KEYSTORE_PASSWORD` /
`MKAPMS_KEY_ALIAS` / `MKAPMS_KEY_PASSWORD` — aucun des deux n'est disponible
ici, donc `hasSigning` reste `false` et chaque `.aab` produit est
volontairement non signé.

## Ce qui est déjà terminé

- Les 5 variantes (`grandpublic`, `pro`, `command`, `intelligence`,
  `investor`) compilent en debug et en release avec l'Android Gradle Plugin
  déjà en place (8.2.1) — aucune mise à jour d'outillage nécessaire.
- `compileSdkVersion` / `targetSdkVersion` = 36, `versionCode` = 10705,
  vérifiés par `aapt dump badging` sur chaque APK.
- Le mécanisme de signature (`android/app/build.gradle`, lignes 1-14) lit
  déjà `android/keystore.properties` ou les 4 variables d'environnement
  `MKAPMS_KEYSTORE_*` — il n'y a aucun code à écrire, seulement les vraies
  valeurs à fournir.
- Les 5 `.aab` non signés sont disponibles dans `mobile/dist/` (voir
  `docs/handoff/google-play-preparation.md` pour les empreintes SHA-256).

## Ce que Devan doit faire

1. Récupérer le keystore de production existant (ou, si aucun keystore de
   production n'existe encore pour une application donnée — vérifier
   d'abord dans Google Play Console si **Play App Signing** est déjà activé
   avant d'en créer un, voir la section « Ce qu'il ne doit surtout pas
   faire »).
2. Placer le fichier `.jks`/`.keystore` dans un emplacement sécurisé
   accessible à la machine de build (jamais dans le dépôt git).
3. Créer `android/keystore.properties` (à la racine du dossier `android/`,
   déjà dans `.gitignore`) avec :
   ```properties
   storeFile=/chemin/absolu/vers/le/trousseau.jks
   storePassword=********
   keyAlias=********
   keyPassword=********
   ```
   — ou, pour une signature automatisée (CI), exporter les 4 variables
   d'environnement `MKAPMS_KEYSTORE_FILE`, `MKAPMS_KEYSTORE_PASSWORD`,
   `MKAPMS_KEY_ALIAS`, `MKAPMS_KEY_PASSWORD` avant le build.
4. Lancer `node mobile/build-apps.mjs` depuis la racine du dépôt (build les
   5 applications) — ou `node mobile/build-apps.mjs investor` pour une
   seule application.
5. Vérifier dans la sortie de la commande qu'aucun avertissement « Aucun
   trousseau de signature » n'apparaît (ce message s'affiche encore si le
   trousseau n'est pas trouvé).
6. Récupérer les `.aab` signés dans `mobile/dist/`.

## Application concernée

Les 5 : `com.mkapms.app`, `com.mkapms.pro`, `com.mkapms.command`,
`com.mkapms.intelligence`, `com.mkapms.investor`.

## Fichier à utiliser

- Config Gradle : `android/app/build.gradle` (lignes 1-14, signingConfigs).
- Script de build : `mobile/build-apps.mjs`.
- Sortie attendue : `mobile/dist/com.mkapms.<app|pro|command|intelligence|investor>.aab`.

## Valeurs attendues après signature

| Application | applicationId | versionCode | versionName | compileSdk/targetSdk |
|---|---|---|---|---|
| grandpublic | com.mkapms.app | 10705 | 1.7.5 | 36 / 36 |
| pro | com.mkapms.pro | 10705 | 1.7.5 | 36 / 36 |
| command | com.mkapms.command | 10705 | 1.7.5 | 36 / 36 |
| intelligence | com.mkapms.intelligence | 10705 | 1.7.5 | 36 / 36 |
| investor | com.mkapms.investor | 10705 | 1.7.5 | 36 / 36 |

## Contrôles après action

```bash
# Chaque .aab doit maintenant afficher un certificat réel, pas "unsigned"
jarsigner -verify -verbose -certs mobile/dist/com.mkapms.investor.aab
# doit se terminer par "jar verified."

# Confirme les métadonnées embarquées (nécessite bundletool, ou extraire un
# APK universel puis aapt dump badging comme lors de la vérification initiale)
```

## Ce qu'il ne doit surtout pas faire

- **Ne jamais générer un nouveau certificat/keystore** pour remplacer celui
  de production s'il existe déjà — cela invalide toutes les mises à jour
  futures de l'application sur les comptes utilisateurs existants.
- **Vérifier d'abord si Play App Signing est actif** sur chaque fiche
  existante (`grandpublic`, `pro`, `command`, `intelligence`) : si oui,
  Google gère la clé finale de signature et attend une clé d'upload
  spécifique, pas nécessairement le même keystore que celui utilisé
  jusqu'ici — se référer à la fiche Play Console existante avant de signer.
- **Ne jamais committer** `android/keystore.properties`, le fichier
  `.jks`/`.keystore`, ni aucun mot de passe dans git — ni dans une PR, ni
  dans un commentaire, ni dans les logs de build partagés.
- **Ne jamais changer un `applicationId`** pour contourner un problème de
  signature.
