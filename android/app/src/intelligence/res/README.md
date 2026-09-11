# Ressources propres à l'application MKA.P-MS Intelligence

Ce dossier est le point d'entrée du mécanisme qui permet à chaque application
mobile (`mobile/variants.json`) d'avoir un jour sa propre icône, son propre
écran de lancement et ses propres ressources visuelles, sans dupliquer le
projet Android : c'est un « product flavor » Gradle (voir
`android/app/build.gradle`), et Gradle fusionne automatiquement
`src/<flavor>/res/` par-dessus `src/main/res/` — tout fichier posé ici
remplace son équivalent commun, pour cette application seulement.

Rien n'est déposé ici pour l'instant : l'application Intelligence utilise
donc l'icône et le splash screen communs (`src/main/res/`), comme les trois
autres applications.

Pour donner une identité visuelle propre à MKA.P-MS Intelligence plus tard,
déposer ici les mêmes chemins que dans `src/main/res/` (à adapter avec les
vraies tailles d'icône adaptative Android) :

```
mipmap-mdpi/ic_launcher.png, ic_launcher_round.png
mipmap-hdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xhdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xxhdpi/ic_launcher.png, ic_launcher_round.png
mipmap-xxxhdpi/ic_launcher.png, ic_launcher_round.png
drawable/splash.png (ou l'équivalent utilisé par le plugin SplashScreen)
```

Même mécanisme disponible pour `grandpublic`, `pro` et `command` s'ils
doivent un jour se différencier visuellement (`src/grandpublic/res/`,
`src/pro/res/`, `src/command/res/`) — aucun changement de code nécessaire,
juste déposer les fichiers.
