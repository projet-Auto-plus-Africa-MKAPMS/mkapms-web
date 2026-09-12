# Préparation Google Play — 5 applications MKA.P-MS

Document préparé automatiquement depuis le code du dépôt. Tout ce qui exige
un accès à Google Play Console, un keystore de production, ou une décision
juridique/marketing est marqué **« à fournir »** — jamais rempli avec une
donnée inventée.

Contenu du `.aab` remis à Devan : ces cinq applications chargent leur
interface à distance (`server.url` de Capacitor, voir `capacitor.config.ts`)
— le `.aab` embarque uniquement la coque native (icône, splash, permissions,
plugins), pas le contenu web. C'est pour cela que les cinq `.aab` n'ont pas
changé quand l'interface `/investissement` a été construite (même
empreinte SHA-256 avant/après).

## Tableau de contrôle — état au 2026-09-12

| Champ | grandpublic | pro | command | intelligence | investor |
|---|---|---|---|---|---|
| Nom de l'application | MKA.P-MS | MKA.P-MS PRO | MKA.P-MS COMMAND | MKA.P-MS Intelligence | MKA.P-MS Investisseur |
| `applicationId` | com.mkapms.app | com.mkapms.pro | com.mkapms.command | com.mkapms.intelligence | com.mkapms.investor |
| `versionName` | 1.7.5 | 1.7.5 | 1.7.5 | 1.7.5 | 1.7.5 |
| `versionCode` | 10705 | 10705 | 10705 | 10705 | 10705 |
| `compileSdkVersion` | 36 | 36 | 36 | 36 | 36 |
| `targetSdkVersion` | 36 | 36 | 36 | 36 | 36 |
| `minSdkVersion` | 22 | 22 | 22 | 22 | 22 |
| Build debug | ✅ vérifié | ✅ vérifié | ✅ vérifié | ✅ vérifié | ✅ vérifié |
| Build release (.aab) | ✅ vérifié | ✅ vérifié | ✅ vérifié | ✅ vérifié | ✅ vérifié |
| Signature | ❌ non signé (pas de keystore ici) | ❌ non signé | ❌ non signé | ❌ non signé | ❌ non signé |
| Fiche Google Play Console | **Inconnue — accès non disponible ici** | **Inconnue** | **Inconnue** | **Inconnue** | **N'existe pas encore (nouvelle app)** |
| Distribution prévue | publique | publique | interne (jamais publique) | publique | restreinte (investisseurs) |
| SHA-256 du dernier `.aab` non signé | `f56766c4...78d173b` | `dd5fb307...761cb7c5` | `2a271592...4dcbc8f4c` | `d3cc6ad6...41be17b8` | `f5b13c7b...5a5195b82f0a6d2` |
| Chemin du `.aab` | `mobile/dist/com.mkapms.app.aab` | `mobile/dist/com.mkapms.pro.aab` | `mobile/dist/com.mkapms.command.aab` | `mobile/dist/com.mkapms.intelligence.aab` | `mobile/dist/com.mkapms.investor.aab` |

(SHA-256 tronquées pour l'affichage — valeurs complètes : `sha256sum mobile/dist/*.aab` après un nouveau build, elles changeront dès que le `.aab` sera signé.)

## Ce qui est prêt (extrait automatiquement du code)

- **Package exact** : voir tableau ci-dessus. Aucune collision entre les 5 (vérifié par lecture directe de `mobile/variants.json`).
- **versionCode / versionName** : calculés depuis `package.json` (`major*10000+minor*100+patch`), jamais saisis à la main.
- **Target API** : `android/variables.gradle`, source unique pour les 5 flavors.
- **Déclaration des permissions réellement utilisées** : `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS` — partagées par les 5 applications (`android/app/src/main/AndroidManifest.xml`), aucun mécanisme de retrait par variante construit encore (voir `android/app/src/investor/res/README.md`).
- **Deep links** : seule `grandpublic` capte `https://www.mkapms.fr` ; les 4 autres (dont `investor`) utilisent `interne.invalid`, donc n'ouvrent aucun lien public — choix déjà correct pour Investisseur.
- **Nom court des applications** : voir tableau (`appName` de `mobile/variants.json`).

## Ce qui manque et doit être fourni (juridique/marketing — jamais inventé ici)

- Description courte et description longue de chaque fiche Play (particulièrement Investisseur, nouvelle fiche).
- Catégorie Play Store retenue pour chaque application.
- Notes de version / release notes.
- URL de politique de confidentialité (si déjà rédigée par la direction/le service juridique).
- Toute URL de support ou de contact exigée par Play Console.
- Captures d'écran et visuels graphiques (icône/splash propres à Investisseur : voir `android/app/src/investor/res/README.md`, rien n'est déposé encore).

## Éléments Google Play Console restant à fournir/vérifier par Devan

1. Pour `grandpublic`, `pro`, `command`, `intelligence` : confirmer si une fiche existe déjà sur Play Console, sous quel compte développeur, avec quel dernier `versionCode` publié et quel track (interne/fermé/production).
2. Pour `investor` : créer une nouvelle fiche (aucune ne peut exister, l'application n'a jamais été buildée avant ce lot) — jamais l'envoyer dans la fiche `intelligence`, `command`, `pro` ou `grandpublic`.
3. Vérifier si Play App Signing est déjà activé sur les fiches existantes (change la procédure de signature — voir HANDOFF DEVAN dédié).

Voir les fichiers `docs/handoff/signature-production.md` et
`docs/handoff/publication-play-console.md` pour les étapes exactes.
