# Fiche Google Play — MKA.P-MS

Ce dossier contient les visuels obligatoires de la fiche Play Store et l'état
réel de ce qui manque encore pour publier. Rien ici n'est décoratif : Google
refuse la mise en ligne tant qu'un élément obligatoire est absent.

Les visuels sont **fabriqués depuis la charte du dépôt**, jamais dessinés à la
main :

```bash
node scripts/build-store-assets.mjs
```

## Visuels présents

| Fichier | Taille | Usage Play Console |
| --- | --- | --- |
| `icon-512x512.png` | 512 × 512 | Icône de la fiche (obligatoire) |
| `feature-graphic-1024x500.png` | 1024 × 500 | Bannière en tête de fiche (obligatoire) |

## Les trois applications

Un seul projet Android produit trois applications (`mobile/variants.json`) :

| Variante | Identifiant | Nom affiché | Diffusion |
| --- | --- | --- | --- |
| grand public | `com.mkapms.app` | MKA.P-MS | publique |
| pro | `com.mkapms.pro` | MKA.P-MS PRO | publique |
| command | `com.mkapms.command` | MKA.P-MS COMMAND | **interne uniquement** |

`COMMAND` est l'application de direction : elle se publie en diffusion interne
(testeurs internes / diffusion privée), jamais en accès public.

La version est unique : `package.json` fixe `versionName`, et `versionCode` en
découle (`major*10000 + minor*100 + patch`). Un bump se fait avec
`npm run version:bump patch|minor|major`.

## Ce qui manque encore pour publier (à fournir, pas à inventer)

- **Captures d'écran** (2 minimum par format, téléphone obligatoire). Elles
  doivent être prises sur les écrans réels de l'application : une capture
  fabriquée serait un motif de refus et une tromperie sur le produit.
- **URL de politique de confidentialité** : la page existe (`/confidentialite`),
  il faut coller son adresse publique définitive dans la Play Console.
- **Suppression de compte** : Google exige une adresse web où l'utilisateur
  demande la suppression de son compte et de ses données. Cette page n'existe
  pas encore dans la plateforme — c'est un point bloquant à construire avant
  la publication publique.
- **Formulaire « Sécurité des données »** et **questionnaire de classification
  du contenu** : à remplir dans la Play Console, ils dépendent de déclarations
  qui n'appartiennent qu'à l'éditeur.
- **Trousseau de signature** : `android/keystore.properties` (hors dépôt) ou les
  variables `MKAPMS_KEYSTORE_FILE`, `MKAPMS_KEYSTORE_PASSWORD`,
  `MKAPMS_KEY_ALIAS`, `MKAPMS_KEY_PASSWORD`.
- **Compte développeur Google Play** actif pour l'éditeur.

## Textes de fiche

Titre, description courte et description longue de chaque variante :
`store/google-play/textes-fiche.md`.
