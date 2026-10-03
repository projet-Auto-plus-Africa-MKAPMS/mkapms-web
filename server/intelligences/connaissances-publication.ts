/**
 * MKA.P-MS AI — connaissances : publication des applications (Android, Apple, Google Play, GitHub, Railway).
 *
 * Demande du PDG : que le moteur connaisse le parcours complet des
 * applications (construire, signer, récupérer les fichiers, les déposer sur
 * Google Play Console et l'App Store), les identifiants nécessaires, l'emplacement
 * des jetons et la connexion à GitHub / Railway. Chaque entrée reprend UNIQUEMENT ce que le dépôt
 * établit déjà ; les entrées Apple sont une procédure GÉNÉRALE, signalée comme telle, car le dépôt n'a aucun projet iOS (mobile/variants.json, mobile/build-apps.mjs,
 * android/app/build.gradle, .github/workflows/android-aab.yml,
 * docs/handoff/*, docs/GOOGLE_PLAY_CONSOLE.md) — jamais un fait supposé sur
 * l'état réel de Google Play, que le dépôt dit lui-même ne pas pouvoir lire.
 *
 * Posées dans la base de connaissances de la plateforme (in_connaissance,
 * catégorie « procedures »), celle que le moteur consulte en conversation
 * (connaissance.ts) : les premiers caractères de chaque entrée sont ce qu'il
 * voit d'abord, les faits essentiels sont donc placés en tête. Même principe
 * que livraisons.ts et fondations.ts : posées une fois au démarrage, jamais
 * réécrites ensuite — une correction est une nouvelle entrée.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { ecrire } from "./connaissance.js";
import { inConnaissance } from "./schema.js";

interface ConnaissancePublication {
  titre: string;
  contenu: string;
  source: string;
}

export const CONNAISSANCES_PUBLICATION: ConnaissancePublication[] = [
  {
    titre: "Connexion Google : site et applications Android",
    contenu:
      "Sur le site, la connexion et la création de compte Google passent par le bouton Google Identity Services (auth.googleConfig puis auth.googleLogin). Google refuse ce bouton dans la WebView d'une application : les cinq applications ouvrent donc le navigateur du téléphone sur /api/auth/google/app/demarrer?app=<applicationId>, Google renvoie sur /api/auth/google/app/retour, puis le serveur rend la main à l'application par son schéma (<applicationId>://auth/google) avec un ticket valable une seule fois pendant deux minutes, échangé par auth.googleTicket. Prérequis posés par le PDG sur Railway (service mkapms-app) : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET d'un identifiant OAuth « Application Web » de Google Cloud, avec comme origines JavaScript autorisées https://www.mkapms.fr (et chaque domaine utilisé) et comme URI de redirection autorisée https://www.mkapms.fr/api/auth/google/app/retour. Sans ces deux variables, la page de connexion le dit au lieu d'afficher un bouton mort. Le schéma de retour exige une version Android contenant le filtre d'intention « auth » (à partir de 1.7.7). Sur les domaines dont cette adresse de retour est déclarée (GOOGLE_RETOUR_HOTES, par défaut www.mkapms.fr), le site passe lui aussi par la redirection serveur (/api/auth/google/app/site) et reçoit le ticket sur /connexion?google_ticket=… : aucune origine JavaScript n'y est requise ; les autres domaines gardent le bouton Google Identity Services.",
    source: "server/auth-google.ts ; server/routers/auth.ts ; client/src/pages/Connexion.tsx ; android/app/src/main/AndroidManifest.xml",
  },
  {
    titre: "Applications Android MKA.P-MS : les cinq applications et leurs identifiants",
    contenu:
      "Cinq applications, un seul cœur (enveloppe Capacitor qui charge la plateforme déployée) : grandpublic = com.mkapms.app (publique), pro = com.mkapms.pro (publique), command = com.mkapms.command (interne PDG/Direction, jamais publique), intelligence = com.mkapms.intelligence (AL-HUDHUD·M, publique), investor = com.mkapms.investor (restreinte, nouvelle fiche Google Play à créer). Seule l'application grand public capte les liens https://www.mkapms.fr. Version unique pour les cinq : celle de package.json (versionName = cette version ; versionCode = majeur×10000 + mineur×100 + correctif, ex. 1.7.7 → 10707) ; compileSdk et targetSdk = 36 (android/variables.gradle).",
    source: "mobile/variants.json ; android/app/build.gradle ; android/variables.gradle",
  },
  {
    titre: "Construire les paquets Android (.aab) : commande, sortie et où ça tourne",
    contenu:
      "Commande : node mobile/build-apps.mjs [variante] (sans argument = les cinq). Chaque variante est un « product flavor » Gradle (bundle<Variante>Release). Sortie : mobile/dist/<applicationId>.aab (et .apk). Exige JDK 17 et le SDK Android (platforms;android-36, build-tools;36.0.0) : le serveur de l'application (Railway) n'a pas cette chaîne d'outils — la construction se fait dans le workflow GitHub « Android — App Bundles (5 applications) » (.github/workflows/android-aab.yml), lancé à la main (entrée facultative : variante), qui produit les .aab en artefacts téléchargeables et ne publie rien.",
    source: "mobile/build-apps.mjs ; .github/workflows/android-aab.yml",
  },
  {
    titre: "Signer un paquet Android : où le trousseau est lu et comment vérifier",
    contenu:
      "La signature est faite par Gradle (android/app/build.gradle) avec un trousseau fourni HORS du dépôt : soit android/keystore.properties (storeFile, storePassword, keyAlias, keyPassword), soit les variables MKAPMS_KEYSTORE_FILE / MKAPMS_KEYSTORE_PASSWORD / MKAPMS_KEY_ALIAS / MKAPMS_KEY_PASSWORD. Dans le workflow GitHub : secrets MKAPMS_KEYSTORE_BASE64 (trousseau restauré le temps du run puis supprimé), MKAPMS_KEYSTORE_PASSWORD, MKAPMS_KEY_ALIAS, MKAPMS_KEY_PASSWORD. Sans trousseau, le .aab est NON signé et jamais présenté comme publiable. Vérification : jarsigner -verify -verbose -certs mobile/dist/<applicationId>.aab doit finir par « jar verified. ».",
    source: "android/app/build.gradle ; android/keystore.properties.example ; docs/handoff/signature-production.md",
  },
  {
    titre: "Signature Android : ce qu'il ne faut jamais faire",
    contenu:
      "Ne jamais générer un nouveau trousseau pour remplacer celui de production s'il existe : cela invalide les mises à jour futures chez les utilisateurs. Vérifier d'abord, dans Google Play Console, si Play App Signing est actif sur la fiche : alors Google garde la clé finale et attend une clé d'UPLOAD précise, pas forcément l'ancien trousseau. Ne jamais commiter le trousseau (.jks/.keystore), keystore.properties ni un mot de passe — ni dans git, ni dans une PR, ni dans un commentaire, ni dans des journaux de build partagés. Ne jamais changer un applicationId pour contourner un problème de signature. Créer la toute première clé d'upload d'une application jamais signée est une décision humaine (Direction / propriétaire du compte Play Console).",
    source: "docs/handoff/signature-production.md ; .github/workflows/android-aab.yml",
  },
  {
    titre: "Publier sur Google Play Console : procédure et interdits",
    contenu:
      "Pour grandpublic, pro, command et intelligence : retrouver la fiche par applicationId et relever son état réel (existe ? dernier versionCode publié ? quel track ? alertes actives ?) avant toute action. investor est une NOUVELLE application à créer dans Play Console, jamais dans la fiche d'une autre. Importer le .aab signé sur le track choisi (interne ou test fermé d'abord pour investor, jamais la production directement), puis soumettre et suivre la validation. Ne jamais supprimer une fiche ni son historique, ne jamais changer un applicationId, ne jamais inventer de description, de catégorie ou de politique de confidentialité — attendre la validation de la Direction.",
    source: "docs/handoff/publication-play-console.md ; docs/handoff/google-play-preparation.md",
  },
  {
    titre: "Google Play : ce que le moteur peut et ne peut pas faire seul (état honnête)",
    contenu:
      "Ne jamais affirmer avoir signé ou publié quelque chose sans l'avoir vérifié. Constat des documents de passation : dans l'environnement où le code a été construit, aucun trousseau de production ni aucun accès Play Console (session ou clé de l'API Play Developer) n'était disponible. Pour agir, il faut des identifiants déposés dans le Coffre secret : le trousseau et ses mots de passe, et le fichier JSON d'un compte de service Google (mode « Fichier ») — un compte Google protégé par la double authentification ne s'ouvre pas automatiquement avec un mot de passe. À la pose de cette entrée, les outils de signature et de dépôt Play ne sont pas encore écrits : vérifier le registre d'outils avant de promettre quoi que ce soit.",
    source: "docs/handoff/publication-play-console.md ; docs/handoff/signature-production.md ; server/intelligences/coffre.ts",
  },
  {
    titre: "Google Play : validation du site, assetlinks et liens profonds",
    contenu:
      "Pour que le site et l'application com.mkapms.app soient reconnus comme un seul propriétaire : copier l'empreinte SHA-256 du certificat de signature (Play Console → Configuration → Intégrité de l'app), la coller dans la variable Railway ANDROID_APP_FINGERPRINTS (plusieurs empreintes séparées par une virgule), attendre le redéploiement, vérifier que /.well-known/assetlinks.json répond avec cette empreinte, puis ajouter le domaine dans Play Console → Grow → Deep links. Si la réponse est « assetlinks_non_configure », la variable n'est pas prise en compte. Play Console peut mettre jusqu'à 24 h à re-crawler.",
    source: "docs/GOOGLE_PLAY_CONSOLE.md",
  },
  {
    titre: "Identifiants et secrets : toujours passer par le Coffre secret, jamais par le chat",
    contenu:
      "Ne jamais demander ni accepter un mot de passe, une clé ou un fichier secret dans une conversation : le PDG les dépose dans le Coffre secret d'AL-HUDHUD·M (« Ajouter une clé secrète » : e-mail + mot de passe, clé ou jeton, fichier). Les valeurs y sont chiffrées et en écriture seule : le moteur ne les voit jamais, il ne voit que le nom, le service visé et un aperçu masqué (outil securite.listerSecrets) ; seul le code serveur d'un outil précis peut s'en servir, avec un motif, et chaque usage est journalisé. La Boutique garde son propre coffre : rien n'est partagé automatiquement entre les deux plateformes (décision du Fondateur du 27 septembre 2026).",
    source: "server/intelligences/coffre.ts ; server/intelligences/fondations.ts",
  },
  {
    titre: "Apple (iPhone, App Store) : état du dépôt et ce qu'il faudrait — procédure générale",
    contenu:
      "État réel : le dépôt n'a AUCUN projet iOS (pas de dossier ios/, seul @capacitor/android est installé) — aucune application Apple n'est prête à signer ni à publier. Ce qui suit est la procédure générale Apple, non vérifiée dans le dépôt : (1) compte Apple Developer Program payant au nom de l'entreprise, (2) fiche App Store Connect et identifiant de bundle par application, (3) ajouter @capacitor/ios et générer le projet ios/ — décision et travail de développement à planifier, (4) construire et signer exige macOS avec Xcode (Mac ou exécuteur macOS GitHub Actions), jamais le serveur Railway, (5) certificat de distribution (.p12 + son mot de passe) et profil de provisionnement, (6) envoi vers TestFlight puis revue Apple. Pour automatiser l'envoi : clé API App Store Connect = fichier .p8 + identifiant de clé (Key ID) + identifiant d'émetteur (Issuer ID) + Team ID. Un identifiant Apple protégé par la double authentification ne s'ouvre pas avec un simple mot de passe, il faut donc privilégier la clé API.",
    source: "absence de ios/ dans le dépôt ; package.json ; procédure générale Apple (non vérifiée ici)",
  },
  {
    titre: "Identifiants nécessaires par plateforme et où les mettre dans le Coffre secret",
    contenu:
      "Tout se dépose dans le Coffre secret (Centre Intelligence → Coffre secret → Ajouter), jamais dans le chat : GOOGLE PLAY CONSOLE = fichier JSON d'un compte de service avec accès à l'API Play Developer (type Fichier) + trousseau d'upload (.jks, type Fichier) + son mot de passe, l'alias de clé et le mot de passe de clé (type Identifiants ou Clé). APPLE = clé API App Store Connect (.p8, Fichier) + Key ID + Issuer ID + Team ID ; certificat de distribution (.p12, Fichier) + mot de passe ; profil de provisionnement (Fichier). GITHUB = jeton à portée fine limité au dépôt mkapms-web (type Clé). RAILWAY = jeton de projet (type Clé) + identifiants du projet, du service et de l'environnement. BOÎTE MAIL / compte Google : adresse + mot de passe (type Identifiants), en sachant que la double authentification bloque la connexion automatique. Nommer chaque secret clairement (ex. « Google Play — compte de service »). Le Coffre exige que la clé maître COFFRE_CLE_MAITRE soit posée sur Railway par le PDG ; sans elle, rien n'est enregistré.",
    source: "server/intelligences/coffre.ts ; android/keystore.properties.example ; server/env.ts",
  },
  {
    titre: "GitHub : ce qui existe, comment le moteur y travaille, et pourquoi il ne déploie pas",
    contenu:
      "Dépôt de la plateforme : projet-Auto-plus-Africa-MKAPMS/mkapms-web (la Boutique a le sien : mkapms-shop). Flux de travail décidé par le PDG le 1er octobre 2026 : le moteur pousse le code sur une branche et ouvre une pull request ; les contrôles (workflow « Build (comme Railway) », qui rejoue npm run build) doivent être verts ; le PDG déploie lui-même à la main. Le déploiement automatique ne viendra que lorsque le PDG jugera le travail irréprochable. Workflows existants : build-check.yml (sur push et PR vers main) et android-aab.yml (lancement manuel, construit les .aab, ne publie rien). Connexion : un jeton GitHub à portée fine déposé dans le Coffre secret (nom conseillé « GitHub — jeton mkapms-web ») ; droits utiles : Contents et Pull requests en lecture/écriture, Actions en lecture et, seulement si le PDG le veut, en écriture pour lancer le workflow Android. Deux outils de lecture seule utilisent ce jeton (voir l'entrée « GitHub : outils de lecture disponibles ») ; aucun outil ne pousse, ne lance de workflow ni ne fusionne : vérifier le registre d'outils avant de promettre davantage.",
    source: ".github/workflows/build-check.yml ; .github/workflows/android-aab.yml ; décision du PDG du 1er octobre 2026",
  },
  {
    titre: "Railway : déploiement, variables et ce que le moteur peut lire",
    contenu:
      "Railway construit avec npm run build, démarre avec npm run start et surveille /api/health (railway.json). Le moteur ne déclenche ni ne rétablit jamais un déploiement : seul l'outil railway_deploiement.getDeploymentStatus est actif, en lecture seule (les 5 derniers déploiements du service), et il rapporte « indisponible » tant que RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID et RAILWAY_ENVIRONMENT_ID ne sont pas posés — jamais un statut supposé. triggerDeployment et rollbackDeployment sont volontairement non implémentés. Aujourd'hui le PDG déploie à la main après chaque pull request fusionnée. Le déploiement contrôlé correspond au niveau 5 du Plan d'autonomie (Centre Intelligence) : seul le PDG le monte, avec un motif tracé, et il ne le fera qu'une fois le travail du moteur jugé irréprochable. Les variables du serveur se posent dans Railway → Variables (ex. COFFRE_CLE_MAITRE, ANDROID_APP_FINGERPRINTS).",
    source: "railway.json ; server/intelligences/deploiement/railway.ts ; server/intelligences/autonomie.ts",
  },
  {
    titre: "GitHub : outils de lecture disponibles (vérifier la connexion, exécutions du workflow Android)",
    contenu:
      "Deux outils réels, en lecture seule, utilisent le jeton déposé dans le Coffre secret sous le nom exact « GitHub — jeton mkapms-web » (type Clé ou jeton) : developpement.githubVerifierConnexion (dit si le jeton donne accès au dépôt projet-Auto-plus-Africa-MKAPMS/mkapms-web, en lecture seule ou en lecture/écriture) et developpement.githubExecutionsAndroid (les 5 dernières exécutions du workflow « Android — App Bundles » avec statut, branche et commit, et les fichiers .aab produits par la dernière exécution réussie). Réservés au PDG ; chaque usage du jeton est journalisé avec son motif ; le jeton n'est jamais renvoyé. Sans jeton déposé, l'outil répond où le déposer. Ce que ces outils NE font PAS : pousser du code, ouvrir ou fusionner une pull request, lancer le workflow Android, déployer. Lancer le workflow Android demandera un outil distinct avec approbation humaine, qui n'existe pas encore. Cette entrée remplace, sur ce point, la mention « aucun outil n'utilise encore ce jeton » des entrées plus anciennes.",
    source: "server/intelligences/github.ts ; server/intelligences/outils/familles/github.ts",
  },
];

/**
 * Pose les connaissances absentes (catégorie « procedures », statut
 * « confirme », visibilité « interne »). Idempotent : un titre déjà présent
 * n'est jamais réécrit.
 */
export async function seedConnaissancesPublication(): Promise<{ nouvelles: number }> {
  let nouvelles = 0;
  for (const c of CONNAISSANCES_PUBLICATION) {
    const [existante] = await db
      .select({ id: inConnaissance.id })
      .from(inConnaissance)
      .where(and(eq(inConnaissance.categorie, "procedures"), eq(inConnaissance.titre, c.titre)))
      .limit(1);
    if (existante) continue;
    await ecrire({
      categorie: "procedures",
      titre: c.titre,
      contenu: c.contenu,
      source: c.source,
      version: "1",
      auteur: "MKA.P-MS AI — fondations",
      statut: "confirme",
    });
    nouvelles += 1;
  }
  return { nouvelles };
}
