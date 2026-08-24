# Google Play Console — Valider la propriété du site pour l'app Android

Guide pas-à-pas pour valider que le site MKA.P-MS et l'application Android `com.mkapms.app` appartiennent à la même entité. Sans cette validation, Google Play refuse d'afficher le lien de l'application sur le site (Deep Link, App Install Banner).

## Ce qui est déjà branché côté site

- **`/.well-known/assetlinks.json`** — sert le fichier Digital Asset Links standard Google, avec les empreintes SHA-256 de la clé de signature Android
- **`<meta name="google-play-app" content="app-id=com.mkapms.app">`** — Chrome mobile propose automatiquement l'installation via la Smart App Banner
- **`<link rel="alternate" href="android-app://com.mkapms.app/https/mkapms.site...">`** — signale l'app à Google Search (indexation croisée)

Ces 3 éléments sont injectés automatiquement sur toutes les pages, sur tous les domaines (`.fr`, `.pro`, `.ci`, `.site`).

## Ce qu'il te reste à faire (5 minutes)

### 1. Récupérer l'empreinte SHA-256 de la clé de signature

Va sur **Google Play Console** :
- App **MKA.P-MS** (`com.mkapms.app`) → **Configuration** → **Intégrité de l'app** → **Certificat de signature de l'application**
- Copie l'empreinte **SHA-256** (format `XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX`)

### 2. Coller sur Railway

Onglet **Variables** du service backend :

```
ANDROID_APP_FINGERPRINTS=XX:XX:XX:...:XX
```

Si tu as plusieurs empreintes (debug + release, ou anciennes rotations), sépare-les par une virgule :

```
ANDROID_APP_FINGERPRINTS=XX:XX:XX:...:XX,YY:YY:YY:...:YY
```

### 3. (Optionnel) Personnaliser l'identifiant de paquet

Par défaut : `com.mkapms.app`. Si ton package est différent :

```
ANDROID_APP_ID=com.mkapms.autoplus
```

### 4. Vérifier le déploiement

- Railway redéploie automatiquement (~2 min)
- Ouvre `https://mkapms.site/.well-known/assetlinks.json` dans un navigateur
- Tu dois voir un JSON comme :
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.mkapms.app",
      "sha256_cert_fingerprints": ["XX:XX:XX:..."]
    }
  }]
  ```

Si tu vois `"error": "assetlinks_non_configure"`, c'est que la variable `ANDROID_APP_FINGERPRINTS` n'est pas encore prise en compte.

### 5. Valider dans Play Console

- Retour dans Play Console → **Grow** → **Deep links** → **Ajouter un domaine**
- Colle `https://mkapms.site` (ou `https://mkapms.fr`, etc.)
- Google valide automatiquement via l'assetlinks.json
- Statut passe à **Vérifié** ✅

## Vérification côté visiteur

Une fois configuré :

1. Ouvre `https://mkapms.site` sur un Chrome Android
2. Une **bannière Smart App** apparaît en haut de la page proposant d'installer l'app depuis Play Store
3. Après installation, quand on clique sur un lien `mkapms.site` depuis un email, WhatsApp, etc., **l'app s'ouvre directement** (deep link) au lieu de Chrome

## Où sont branchées les balises

- **Meta `google-play-app`** : dans `<head>` de toutes les pages
- **Link alternate `android-app://`** : dans `<head>` de toutes les pages, avec l'URL courante préservée
- **Fichier assetlinks.json** : `/.well-known/assetlinks.json` (norme Google Digital Asset Links)

## FAQ

**Q. Play Console dit toujours « Non vérifié ».**
- Vérifie que l'URL `https://mkapms.site/.well-known/assetlinks.json` répond bien (pas de 404, pas d'erreur, JSON valide)
- Vérifie que l'empreinte SHA-256 copiée depuis Play Console correspond **exactement** à ce qui est dans la variable Railway
- Attends 24 h — Play Console met parfois du temps à re-crawler

**Q. La Smart App Banner ne s'affiche pas sur Chrome mobile.**
- Vérifie avec Ctrl+U (ou l'inspecteur mobile) que la balise `<meta name="google-play-app">` est présente
- La bannière n'apparaît qu'à partir de la 2e visite au domaine (comportement Chrome)
- L'app doit être publiée sur Play Store (pas seulement en test interne)
