# Ressources propres à l'application MKA.P-MS Investisseur

Même mécanisme que pour `intelligence` (voir `android/app/src/intelligence/res/README.md`) :
Gradle fusionne automatiquement `src/investor/res/` par-dessus `src/main/res/`
— tout fichier posé ici remplace son équivalent commun, pour cette
application seulement. Aucun changement de code nécessaire.

Rien n'est déposé ici pour l'instant : l'application Investisseur utilise
donc l'icône et l'écran de lancement communs (`src/main/res/`), comme les
quatre autres applications.

Pour donner une identité visuelle propre à MKA.P-MS Investisseur plus tard,
déposer ici les mêmes chemins que dans `src/main/res/` :

```
mipmap-mdpi/ic_launcher.png, ic_launcher_round.png
mipmap-hdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xhdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xxhdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xxxhdpi/ic_launcher.png, ic_launcher_round.png
drawable/splash.png (ou l'équivalent utilisé par le plugin SplashScreen)
```

## Permissions Android

L'application Investisseur hérite aujourd'hui des permissions déclarées dans
`android/app/src/main/AndroidManifest.xml`, partagées par les 5 applications
(`INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_COARSE_LOCATION`,
`ACCESS_FINE_LOCATION`, `POST_NOTIFICATIONS`). Aucune de ces permissions
n'est aujourd'hui utilisée par l'espace Investisseur lui-même (aucune
fonction de localisation) — mais aucun mécanisme de retrait de permission
par variante n'existe encore dans ce projet (aucune des 5 applications n'a
son propre `AndroidManifest.xml` de flavor). Ce serait un changement natif
plus large (fusion de manifestes par flavor), volontairement hors de ce lot
pour ne pas modifier le comportement des 4 autres applications au passage —
à traiter dans un lot dédié « permissions par variante » si la direction le
demande.

## Deep links

`appLinksHost`/`appLinksHostAlt` sont réglés sur `interne.invalid` dans
`mobile/variants.json` — comme `pro`, `command` et `intelligence`, aucun
lien public n'est capté par cette application (seule `grandpublic` ouvre
`https://www.mkapms.fr`). Ce choix est correct pour cette application :
elle n'a pas vocation à ouvrir des liens partagés publiquement pour
l'instant.

## Notifications push

Le plugin `@capacitor/push-notifications` est partagé par toutes les
variantes (voir `android/app/build.gradle` — pas de configuration Firebase
par flavor dans ce dépôt). `google-services.json` n'est présent nulle part
dans ce projet : le plugin est installé mais Firebase n'est configuré pour
aucune des 5 applications, Investisseur inclus — voir HANDOFF DEVAN
correspondant si la direction veut activer les notifications push réelles.
