/**
 * Mémoire de l'IA — Centre Cyber-Électrique MKA.P-MS / Frontier OS et règles permanentes de l'engagement.
 *
 * Demande du PDG (9 octobre 2026) : intégrer dans la mémoire de connaissances ce qu'il a donné « du début
 * jusqu'à la fin ». Ce fichier couvre ce qui est réellement établi à cette date : les règles permanentes
 * reconduites tout au long de l'engagement, le périmètre décliné et pourquoi, et l'état du Centre Cyber-
 * Électrique / Frontier OS. Même principe que fondations-travaux.ts : posé une fois au démarrage, une clé
 * déjà active n'est jamais réécrite ; une mise à jour future est un nouveau souvenir sous la même clé (l'ancien
 * devient l'historique). Les jours plus anciens (1er et 2 octobre) sont déjà couverts par fondations-travaux.ts :
 * ce fichier ne les répète pas.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inMemoire } from "./schema.js";
import { ecrire } from "./memoire.js";

interface SouvenirCentre {
  categorie: "projets" | "decisions" | "apprentissage";
  cle: string;
  titre: string;
  contenu: string;
  liens: Record<string, string>;
}

export const SOUVENIRS_CENTRE: SouvenirCentre[] = [
  {
    categorie: "decisions",
    cle: "decision-regles-permanentes-engagement-09-10-2026",
    titre: "Règles permanentes reconduites tout au long de l'engagement avec le PDG",
    contenu:
      "Règles qui s'appliquent à tout travail sur mkapms-web et mkapms-shop, rappelées et reconduites plusieurs fois : (1) jamais de changement des prix, du stock ou de la publication décidés par le PDG ; aucune publication automatique. (2) Jamais de modification automatique des photos ou vidéos fournisseur, jamais de suppression de photo fournisseur, jamais de vidéo fabriquée. (3) Aucun secret jamais exposé (conversation, journal, code). (4) Honnêteté explicite sur l'absence d'accès à la production/Railway/OpenAI : tout est testé en local. (5) Convention de nommage : sans nom donné, une boutique reste « la boutique » ; la plateforme principale est toujours nommée explicitement (MKA.P-MS Web) ; en cas de doute sur un nom, demander plutôt que deviner — clarifié notamment le 9 octobre : « MKH Shop »/« MKPMS Shop »/« boutique principale » ne sont pas des boutiques séparées, le système est installé dans la plateforme principale. (6) Qualité : tester au moins trois fois avant de pousser, toujours avant que quoi que ce soit n'atteigne Railway ; d'autres agents relisent ; économiser le budget ; ouvrir des PR et laisser le PDG les fusionner — ne jamais fusionner soi-même. (7) Le dépôt de la Boutique (mkapms-shop) n'est jamais touché sans demande explicite — lecture/audit par défaut ; symétriquement, mkapms-shop/AGENTS.md interdit par défaut tout appel sortant vers la plateforme principale et toute modification de mkapms-web depuis ce dépôt. (8) Branche de travail sur mkapms-web tenue en vie en la redémarrant depuis origin/main chaque fois que sa PR est fusionnée, jamais en empilant sur de l'historique déjà fusionné.",
    liens: { source: "Instructions reconduites, engagement PDG ; AGENTS.md de mkapms-shop" },
  },
  {
    categorie: "decisions",
    cle: "decision-perimetre-cyberdefense-decline-09-10-2026",
    titre: "9 octobre 2026 — périmètre élargi (badge de cybersécurité/cyberattaque) décliné, raisons dites au PDG",
    contenu:
      "Le PDG a demandé oralement (message vocal transcrit) un système beaucoup plus large : badge de cyberdéfense/cyberattaque capable d'intervenir sur « tout » (moteurs de voiture, calculateurs de véhicules, fabrication 3D/métal), 100 à 200+ moteurs internes avec chaîne de démarreurs à deux étages et grappes de moteurs redondants, cinq salles de contrôle dont une nommée « Cyberattaques » avec essais offensifs, connexion future à des plateformes tierces (Alibaba, Google, Amazon) « si on m'en donne l'accès », système qui écrit et déploie son propre code sans revue humaine. J'ai décliné, de mon propre jugement, trois choses précises : (a) tout outillage de cyberattaque offensive sans engagement défini, borné et autorisé ; (b) toute capacité d'intervention sur des moteurs ou calculateurs de véhicules (sécurité physique réelle) ; (c) un système conçu pour résister à la supervision externe tout en écrivant et déployant seul son propre code, et visant des plateformes tierces non possédées par le PDG. Le PDG a ensuite clarifié (message suivant, lui-même, pas un agent) : les exemples Alibaba/Google/Amazon n'étaient pas donnés pour construire quelque chose « contre » quelqu'un, mais pour faire comprendre le GENRE d'outils recherché ; il n'est pas contre les gens, il veut se passer de dépendre des services d'autrui et protéger ce qui lui appartient, avec la permission des personnes concernées, pas en les agressant. J'ai proposé à la place, et construit, un Centre Cyber-Électrique borné : plus de salles, un diagnostic plus profond des moteurs existants de la plateforme, un mécanisme de développement où le centre PROPOSE des correctifs mais où un humain les implémente et où le PDG approuve avant tout déploiement — jamais de génération+déploiement de code autonome.",
    liens: { source: "Message vocal transcrit du PDG, 9 octobre 2026, et sa clarification suivante" },
  },
  {
    categorie: "decisions",
    cle: "decision-cable-commutation-exception-shop-09-10-2026",
    titre: "9 octobre 2026 — exception bornée à « SHOP n'appelle jamais la plateforme »",
    contenu:
      "Pour finir la connexion de l'interrupteur local de la Boutique au câble de commutation du Centre Cyber-Électrique, le PDG a explicitement demandé d'écrire le code côté mkapms-shop, après que je lui ai signalé le conflit avec la règle écrite de ce dépôt (AGENTS.md : « SHOP n'appelle jamais la plateforme principale », réaffirmée le 2 octobre). Décision : exception volontaire et strictement bornée à deux routes de câble (ordre d'interrupteur / accusé d'état observé), zéro donnée métier, identité de signature Ed25519 propre à SHOP (jamais la clé MAIN), désactivée par défaut sans FRONTIER_PLATFORM_URL. Documentée comme décision datée dans mkapms-shop/AGENTS.md et dans la capacité shop.platform.commutation (src/capabilities.ts, isolation.permittedInitialConnection). PR ouverte (mkapms-shop #288, jamais fusionnée par moi).",
    liens: { depot: "mkapms-shop", pr: "288", doc: "docs/CENTRE-COMMUTATION-BOUTIQUE-2026-10-09.md (mkapms-web)" },
  },
  {
    categorie: "projets",
    cle: "projet-centre-cyber-electrique-frontier-os-09-10-2026",
    titre: "Centre Cyber-Électrique MKA.P-MS / Frontier OS — état au 9 octobre 2026",
    contenu:
      "Simulation/centre de contrôle réservé au PDG (super_admin) qui modélise les propres moteurs logiciels de la plateforme sous forme de métaphore électrique (salles, interrupteurs, contacts, fils) — jamais les prix, le stock ou la publication réels de la Boutique, toujours en simulation par défaut. Construit par étapes (PR #594, #595, #596, toutes fusionnées par le PDG) : inventaire réel des moteurs de stock de la Boutique sans doublon, vitrine animée à dix salles avec plan/zoom, séparation physique de la base mesurée (jamais déduite), sauvegarde/restauration, liaisons réelles à deux clés indépendantes (variable d'environnement + phrase d'armement du PDG) avec câble shop_link réellement coupable et protocole de commutation signé (Ed25519) où la Boutique vient chercher ses ordres, gouvernance étendue à deux API de données jusque-là hors contrôle, mécanisme de « lacunes de développement » où le centre déclare honnêtement ce qu'il ne sait pas encore faire au lieu d'échouer en silence, garantie testée qu'aucune IA ni API de fournisseur externe n'est nécessaire au fonctionnement du centre. Côté Boutique (mkapms-shop), le câble de commutation local est posé (PR #288, en attente de fusion par le PDG) : interrupteur persistant par ligne, identité Ed25519 propre à SHOP scellée dans son coffre, toujours désactivé par défaut. Reste : fusion de la PR shop #288, gating réel des canaux métier sur l'état de l'interrupteur, fichier de schémas de moteurs que le PDG cherche encore (prévu à l'origine pour un moteur distinct « Al-Houdoud M. ») pour inspirer d'éventuels moteurs supplémentaires — jamais reçu à ce jour.",
    liens: { depot: "mkapms-web, mkapms-shop", pr: "web 594-596, shop 288", doc: "docs/CENTRE-CYBER-ELECTRIQUE-2026-10-09.md ; docs/CENTRE-PREUVES-2026-10-09.md" },
  },
  {
    categorie: "projets",
    cle: "projet-centre-cyber-electrique-independant-09-10-2026",
    titre: "Centre Cyber-Électrique — expansion vers l'indépendance architecturale, état au 9 octobre 2026 (suite)",
    contenu:
      "Le PDG a demandé de poursuivre la construction du Centre jusqu'à une base complète, préparée et testée, sans connexion réelle non demandée, et de ne PAS mélanger ce travail avec autre chose. Travail fait sur une branche dédiée (claude/centre-cyber-electrique-independant, redémarrée depuis origin/main après la fusion de la PR #597) : registre étendu de moteurs déclarés dans la même table engines (jamais une seconde vérité : migration 0005, nouvelle valeur de kind « declared », nouvelles valeurs d'état, trois colonnes room_code/connector_set/manual_switch) — 210 moteurs posés, tous arrêtés par défaut (100 internes répartis sur sept nouvelles salles, 40 pour le Connecteur A, 40 pour le Connecteur B, 30 pour les cinq connecteurs MKAPMS Shop). Sept nouvelles salles construites avec vitrine réelle (Travail/Dialogue/Contrôle avec Cyberdéfense et Cyberattaques strictement inertes — ni surveillance ni essai réel, aucun mécanisme d'interrupteur ; Contrôle centrale ; Surveillance externe honnêtement à zéro tant qu'aucune détection réelle n'existe ; Salle complète des moteurs ; Outils de travail ; Salle de réunion future ; Connecteur A avec barre de progression et manques visibles). Connecteur B ajouté à la salle des connexions déjà existante, les cinq connecteurs MKAPMS Shop ajoutés à la salle des boutiques déjà existante — jamais une salle en double. Alarme standard (vert/bleu/rouge/gris) calculée sur l'état réellement observé, jamais inventée. Mécanisme d'identité interne (le PDG seul peut faire enregistrer un nom au Centre, localisation déclarative Guinée/Kankan qui ne prétend aucun hébergement réel). Nom officiel de la Boutique fixé à « MKAPMS Shop » dans le registre du Centre, confirmé par le PDG le même jour. Séparation architecturale vérifiée par audit des imports : server/frontier-os ne dépend du reste du dépôt que pour l'authentification PDG (../trpc.js, type seulement pour ../identity-os/contract.js) et pour le connecteur déjà autorisé vers la Boutique (../shop-link/*) — aucun couplage à la logique métier de la plateforme. Testé : suite d'intégration frontier-os (16 fichiers) exécutée trois fois verte, build complet (checks, client, serveur) vert, essai navigateur réel (connexion PDG, 17 salles cliquées, aucune erreur JS propre au Centre, 210 moteurs déclarés confirmés à 0 en marche via l'API tRPC réelle).",
    liens: { depot: "mkapms-web", branche: "claude/centre-cyber-electrique-independant", doc: "server/frontier-os/declares.ts ; server/frontier-os/moteurs-declares.ts" },
  },
  {
    categorie: "apprentissage",
    cle: "lecon-artefacts-dist-perimes-masquent-les-pannes-09-10-2026",
    titre: "Un artefact de build déjà commité peut être périmé ou corrompu avant même qu'on y touche",
    contenu:
      "Problème : en travaillant sur mkapms-shop, une suite d'intégration échouait avec un 503 générique (« service momentanément indisponible »), laissant croire à une régression introduite par le changement en cours. Diagnostic : l'échec se reproduisait identiquement sur une copie strictement propre du dépôt (vérifié par git stash avant toute hypothèse) — dist/knowledge-manifest.json était désynchronisé de src/, et dist/gap-audit.json était carrément corrompu (contenu binaire illisible) dans l'état commité, tous deux des artefacts de build normalement régénérés par npm run build / scripts/export-manifest.mjs mais jamais recommités à jour. Solution : régénérer ces artefacts selon le flux documenté a résolu l'échec sans toucher au code métier. Résultat : vérifié par comparaison directe avant/après sur le même commit de base. Leçon : avant de soupçonner son propre changement, comparer le même test contre une copie non modifiée (git stash) ; un échec générique (503, erreur réseau) peut venir d'un artefact commité périmé ou corrompu plutôt que d'une vraie régression logique — et la chaîne de tests d'intégration enchaînés sans base entièrement neuve entre fichiers peut elle-même accumuler un état incohérent (« relation already exists ») indépendamment de tout changement de code, ce qui s'est aussi confirmé identique sur la copie propre.",
    liens: { depot: "mkapms-shop", source: "scripts/export-manifest.mjs ; npm run build" },
  },
  {
    categorie: "apprentissage",
    cle: "lecon-blocage-git-signalement-honnete-09-10-2026",
    titre: "Un blocage d'infrastructure se signale honnêtement, jamais en contournant la protection",
    contenu:
      "Problème : un test écrit dans cette session a accidentellement supprimé tout le répertoire /tmp, y compris le lien symbolique requis pour la signature des commits git (/tmp/code-sign). Je ne pouvais pas le recréer moi-même (le système a refusé la tentative) et j'ai refusé de contourner ou désactiver la signature des commits de mon propre chef. Solution : signaler honnêtement le blocage à chaque occasion pertinente, garder tout le travail en sécurité sur disque, ne jamais annoncer un commit/push/PR avant qu'il n'ait réellement eu lieu, continuer à développer et tester pendant que le blocage était réparé par l'environnement. Résultat : /tmp/code-sign restauré par l'environnement ; une fois restauré, l'état du dépôt a été vérifié avant tout commit (git status correspondant exactement au travail déjà testé). Leçon : face à un outil de sécurité cassé par accident, la bonne réponse est l'honnêteté et la patience, jamais un contournement (--no-verify, désactivation) décidé seul — même quand cela bloque la livraison pendant un moment.",
    liens: { source: "Incident de cette session, avant la PR web #595" },
  },
];

export async function seedSouvenirsCentreCyberElectrique(): Promise<{ nouveaux: number; total: number }> {
  let nouveaux = 0;
  for (const s of SOUVENIRS_CENTRE) {
    const [existant] = await db
      .select({ id: inMemoire.id })
      .from(inMemoire)
      .where(and(eq(inMemoire.categorie, s.categorie), eq(inMemoire.cle, s.cle), eq(inMemoire.cycle, "actif")))
      .limit(1);
    if (existant) continue;
    await ecrire({ categorie: s.categorie, cle: s.cle, titre: s.titre, contenu: s.contenu, liens: s.liens, source: "souvenirs-centre-cyber-electrique" });
    nouveaux += 1;
  }
  return { nouveaux, total: SOUVENIRS_CENTRE.length };
}
