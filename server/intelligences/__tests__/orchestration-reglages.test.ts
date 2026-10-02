/**
 * Réglages de l'agent développeur (2 octobre 2026) : reconnaissance de la mission, périmètre « inconnu », statuts et compteur
 * fidèles, autorisations par opération réelle, reprise. Aucune base, aucun fournisseur : toutes les dépendances sont injectées.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { orchestrer, resoudrePerimetre, cheminsCites, type DepsOrchestrateur, type Impact, type OrchestrerInput } from "../orchestrateur.js";
import { NIVEAU_PAR_PERMISSION } from "../autonomie.js";
import { QUESTION_MISSION, demandeCourte, categorie, compter } from "../mission-etat.js";
import type { LigneEtape, LigneMission, StoreMissions } from "../mission-store.js";
import type { Permission } from "../capacites.js";

const TOUTES: Permission[] = ["READ", "ANALYZE", "PROPOSE", "WRITE", "TEST", "DEPLOY", "FINANCIAL", "ADMINISTRATION", "INFRASTRUCTURE"];

function impactDe(fichiers: string[]): Impact {
  return { trouve: true, fichiers, api: [], tables: [], tests: ["t"], dependants: [], avertissements: [] };
}

interface Monde {
  niveau: number;
  permissions: Permission[];
  /** clé → fichiers (composants présents au relevé) */
  composants: Record<string, string[]>;
  /** mot → clé de composant trouvée par recherche */
  recherches: Record<string, string>;
  scope: Record<string, string[]>;
  texteCorrectif: string;
  routerEnPanne: boolean;
  verrouOuvert: boolean;
  testsTotal: number;
}

function monde(partiel: Partial<Monde> = {}) {
  const m: Monde = {
    niveau: 7,
    permissions: TOUTES,
    composants: { "moteur:paiement": ["server/payment-engine/checkout.ts", "server/payment-engine/index.ts"] },
    recherches: {},
    scope: {},
    texteCorrectif: "Modifier server/payment-engine/checkout.ts : corriger le calcul. Risque faible, retour arrière : git revert.",
    routerEnPanne: false,
    verrouOuvert: true,
    testsTotal: 3,
    ...partiel,
  };
  const appels = { router: 0, retenir: [] as { resultat: string; domaine: string; probleme: string }[], recherche: [] as string[], impact: [] as string[], ouvrirDossier: 0, tests: 0, deploiement: 0, creer: 0, normaliser: 0 };
  const dossiers: { id: number; need: string; status: string }[] = [];
  const lignes: (LigneMission & { etapes: LigneEtape[] })[] = [];
  let seq = 100;
  const store: StoreMissions = {
    async creer(v) {
      appels.creer++;
      const id = ++seq;
      lignes.push({ id, objectif: v.objectif, domaine: v.domaine, statut: "en_cours", arretSur: "", motif: "", actorId: v.actorId, devRequestId: null, createdAt: new Date(), etapes: [], reprise: v.repriseDe ?? null } as never);
      return id;
    },
    async maj(id, patch) {
      Object.assign(lignes.find((l) => l.id === id)!, patch);
    },
    async ajouterEtapes(id, etapes) {
      lignes.find((l) => l.id === id)!.etapes = etapes;
    },
    async inachevees(actorId) {
      const reprises = new Set(lignes.map((l) => (l as never as { reprise: number | null }).reprise));
      return lignes.filter((l) => l.actorId === actorId && ["arretee", "echouee"].includes(l.statut) && !reprises.has(l.id)).reverse();
    },
    async parId(id) {
      return lignes.find((l) => l.id === id) ?? null;
    },
    async etapesDe(id) {
      return lignes.find((l) => l.id === id)?.etapes ?? [];
    },
  };
  const deps: DepsOrchestrateur = {
    autorise: async (_d, p) => {
      const requis = NIVEAU_PAR_PERMISSION[p];
      return { autorise: m.niveau >= requis, niveauRequis: requis, niveauAccorde: m.niveau as never, motif: "" };
    },
    permissionsDuRole: async () => m.permissions,
    router: (async () => {
      appels.router++;
      if (m.routerEnPanne) return { ok: false, texte: "", motif: "Fournisseur indisponible.", repli: "Réessayer plus tard.", fournisseur: null, modele: null };
      return { ok: true, texte: m.texteCorrectif, motif: "", repli: "", fournisseur: "x", modele: "y" };
    }) as never,
    normaliser: (async (texte: string) => {
      appels.normaliser++;
      return { texte, images: [], capaciteConseillee: "raisonnement", pieces: [], nonLues: [] };
    }) as never,
    graphe: {
      relevePresent: async () => true,
      impact: async (cle) => {
        appels.impact.push(cle);
        const k = cle.includes(":") ? cle : `moteur:${cle}`;
        return m.composants[k] ? impactDe(m.composants[k]!) : { trouve: false, fichiers: [], api: [], tables: [], tests: [], dependants: [], avertissements: [] };
      },
      recherche: async (q) => {
        appels.recherche.push(q);
        const cle = m.recherches[q];
        return cle ? [{ type: "moteur", key: cle, label: q }] : [];
      },
      reconnaitre: async () => ({ verdict: "Anomalie non classée : aucune correction acquise à rappeler." }),
      fichiersConnus: async (chemins) => new Set(chemins.filter((c) => Object.values(m.composants).some((f) => f.includes(c)))),
    },
    memoire: {
      dejaVu: (async () => ({ connu: false, verdict: "Aucune expérience comparable.", experiences: 0, corrigeVerifie: false })) as never,
      retenir: (async (i: { resultat: string; domaine: string; probleme: string }) => {
        appels.retenir.push({ resultat: i.resultat, domaine: i.domaine, probleme: i.probleme });
        return { id: 1, recurrent: false, nouvelEpisode: true };
      }) as never,
    },
    centre: {
      analyserPerimetre: async (b) => Object.entries(m.scope).filter(([mot]) => b.toLowerCase().includes(mot)).flatMap(([, v]) => v),
      trouverDossierOuvert: async ({ need }) => dossiers.find((d) => d.need === need) ?? null,
      ouvrirDossier: async ({ need }) => {
        appels.ouvrirDossier++;
        const d = { id: dossiers.length + 1, need, status: "ouvert" };
        dossiers.push(d);
        return { id: d.id, status: d.status, blockedReason: null };
      },
    },
    tests: {
      lancer: async () => {
        appels.tests++;
        return { runId: 9, total: m.testsTotal, reussis: m.testsTotal, echecs: 0, ignores: 0, regressions: 0 };
      },
      verrou: async () => ({ autorise: m.verrouOuvert, motif: m.verrouOuvert ? "Contrôles au vert." : "Verrou fermé.", bloquants: [] }),
    },
    deploiement: {
      demander: async () => {
        appels.deploiement++;
        return { id: 5, approbateurs: ["PDG"] };
      },
    },
    store,
  };
  return { m, deps, appels, lignes, dossiers };
}

const entree = (objectif: string, plus: Partial<OrchestrerInput> = {}): OrchestrerInput => ({ objectif, role: "super_admin", actorId: 1, ...plus });
const statuts = (r: { etapes: { etape: string; statut: string }[] }) => Object.fromEntries(r.etapes.map((e) => [e.etape, e.statut]));

/* ------------------------------------------------------------------ */

test("1. demande courte avec mission active identifiable : reprise de cette mission, aucune question", async () => {
  const w = monde({ niveau: 2 });
  const premiere = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(premiere.statut, "arretee");
  w.m.niveau = 4;
  const routerAvant = w.appels.router;
  const suite = await orchestrer(entree("Tu peux travailler", { contexte: ["Répare le paiement de la page abonnement"] }), w.deps);
  assert.notEqual(suite.statut, "a_clarifier");
  assert.equal(suite.clarification, null);
  assert.equal(suite.repriseDe, premiere.id);
  assert.equal(suite.objectif, "Répare le paiement de la page abonnement");
  // Le travail déjà fait n'est pas refait : analyse et correctif repris tels quels (aucun appel de modèle de plus).
  assert.equal(w.appels.router, routerAvant);
  assert.equal(statuts(suite).analyse, "fait");
  assert.match(suite.etapes.find((e) => e.etape === "analyse")!.preuve, /mission #\d+/);
  // Et la reprise désigne la mission inachevée sans contexte, par l'historique, quand elle est la seule.
  const w2 = monde({ niveau: 2 });
  const a = await orchestrer(entree("Répare le paiement de la page abonnement"), w2.deps);
  const b = await orchestrer(entree("continue"), w2.deps);
  assert.equal(b.repriseDe, a.id);
});

test("2. demande courte sans mission : une seule question, rien n'est lancé ni écrit", async () => {
  for (const courte of ["Tu peux travailler", "continue", "vas-y", "go", "Tu peux travailler ?"]) {
    assert.equal(demandeCourte(courte), true, courte);
    const w = monde();
    const r = await orchestrer(entree(courte), w.deps);
    assert.equal(r.statut, "a_clarifier");
    assert.equal(r.clarification, QUESTION_MISSION);
    assert.equal(r.id, 0);
    assert.equal(r.etapes.length, 0);
    assert.equal(w.appels.creer, 0, "aucune mission créée");
    assert.equal(w.appels.router + w.appels.tests + w.appels.ouvrirDossier + w.appels.recherche.length + w.appels.impact.length, 0, "aucun parcours de développement");
    assert.equal(w.appels.retenir.length, 0, "rien à mémoriser : pas de fausse leçon");
    assert.ok(!r.resume.includes("inconnu"));
    assert.match(r.resume, /Quelle tâche souhaites-tu que je réalise \?/);
  }
  // Une phrase qui nomme un objet n'est jamais « courte ».
  assert.equal(demandeCourte("Continue le paiement"), false);
  assert.equal(demandeCourte("Répare la page d'accueil"), false);
});

test("2b. plusieurs missions inachevées sans indice : une question, les candidats sont nommés", async () => {
  const w = monde({ niveau: 2 });
  await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  await orchestrer(entree("Corrige le moteur de redirection des annonces"), w.deps);
  const r = await orchestrer(entree("continue"), w.deps);
  assert.equal(r.statut, "a_clarifier");
  assert.equal(r.candidats.length, 2);
  assert.equal(r.clarification, QUESTION_MISSION);
});

test("3. « inconnu » n'est pas un composant : non identifié ≠ absent, puis résolu", async () => {
  // a) rien ne désigne un composant : on ne cherche RIEN dans le code et on ne dit pas « absent ».
  const w = monde();
  const r = await orchestrer(entree("Améliore tout ça"), w.deps);
  assert.equal(statuts(r).architecture, "non_execute");
  assert.match(r.etapes.find((e) => e.etape === "architecture")!.observe, /Périmètre non identifié.*Rien n'a été cherché dans le code.*pas un composant absent/);
  assert.ok(!w.appels.impact.includes("inconnu") && !w.appels.recherche.includes("inconnu"));
  assert.equal(w.appels.router, 0, "aucun modèle appelé sans périmètre");
  assert.equal(statuts(r).correctif, "non_execute");
  assert.equal(statuts(r).dossier, "non_execute");
  assert.equal(r.statut, "arretee");
  assert.equal(r.arretSur, "architecture");
  assert.match(r.clarification!, /Quelle page, quel moteur ou quelle fonctionnalité/);
  assert.equal(w.appels.retenir[0]!.resultat, "mission_insuffisante");

  // b) un composant est nommé mais le relevé ne le contient pas : réellement absent après inspection.
  const w2 = monde();
  const r2 = await orchestrer(entree("Corrige le moteur zorglub"), w2.deps);
  assert.equal(statuts(r2).architecture, "partielle");
  assert.match(r2.etapes.find((e) => e.etape === "architecture")!.observe, /inspecté.*n'y figure pas.*réellement absent/);
  assert.ok(w2.appels.recherche.includes("zorglub"), "le relevé a bien été interrogé");
  assert.equal(r2.clarification, null);

  // c) classification initiale « inconnu », périmètre résolu par la recherche au relevé : la chaîne continue.
  const w3 = monde({ composants: { "moteur:commission": ["server/commission/service.ts"] }, recherches: { commissions: "moteur:commission" }, texteCorrectif: "Modifier server/commission/service.ts." });
  const r3 = await orchestrer(entree("Améliore le calcul des commissions"), w3.deps);
  assert.equal(statuts(r3).architecture, "fait");
  assert.equal(r3.domaine, "commissions");
  assert.equal(statuts(r3).correctif, "fait");
  assert.equal(statuts(r3).dossier, "fait");
});

test("3b. périmètre non identifié, puis précisé par l'utilisateur : reprise avec le contexte", async () => {
  const w = monde({ composants: { "moteur:commission": ["server/commission/service.ts"] }, recherches: { commissions: "moteur:commission" }, texteCorrectif: "Modifier server/commission/service.ts." });
  const a = await orchestrer(entree("Améliore tout ça"), w.deps);
  assert.equal(a.arretSur, "architecture");
  const b = await orchestrer(entree("Le calcul des commissions", { missionActiveId: a.id }), w.deps);
  assert.equal(b.repriseDe, a.id);
  assert.match(b.objectif, /Améliore tout ça.*précision : Le calcul des commissions/);
  assert.equal(statuts(b).architecture, "fait");
  assert.equal(statuts(b).correctif, "fait");
  assert.equal(b.clarification, null);
});

test("3c. resoudrePerimetre : domaine générique « code » ne suffit pas à désigner un composant", async () => {
  const w = monde();
  const p = await resoudrePerimetre("Corrige le bug du bouton", "code", w.deps);
  assert.equal(p.etat, "non_identifie");
  assert.deepEqual(w.appels.impact, [], "rien n'est cherché sous le nom « code »");
});

test("4. proposition au niveau 2, modification au niveau 3 : chaque contrôle suit l'opération réelle", async () => {
  const w2 = monde({ niveau: 2 });
  const r2 = await orchestrer(entree("Répare le paiement de la page abonnement"), w2.deps);
  assert.equal(statuts(r2).correctif, "fait", "proposer = niveau 2");
  assert.equal(statuts(r2).dossier, "en_attente_autorisation", "écrire un dossier = niveau 3");
  const dossier = r2.etapes.find((e) => e.etape === "dossier")!;
  assert.match(dossier.observe, /Action bloquée : création d'un dossier de développement/);
  assert.match(dossier.observe, /niveau 3 requis.*niveau 2/);
  assert.equal(w2.appels.ouvrirDossier, 0, "rien n'a été écrit");
  assert.equal(r2.etapes.find((e) => e.etape === "correctif")!.niveauRequis, 2);
  assert.equal(dossier.niveauRequis, 3);

  const w3 = monde({ niveau: 3 });
  const r3 = await orchestrer(entree("Répare le paiement de la page abonnement"), w3.deps);
  assert.equal(statuts(r3).dossier, "fait");
  assert.equal(w3.appels.ouvrirDossier, 1);
  assert.equal(r3.etapes.find((e) => e.etape === "dossier")!.permission, "WRITE");
  assert.match(r3.etapes.find((e) => e.etape === "tests")!.observe, /niveau 4 requis.*niveau 3/);
  // Le curseur n'est jamais monté automatiquement.
  assert.equal(w3.m.niveau, 3);
});

test("4b. dossier déjà ouvert : simple consultation (lecture), aucun doublon, aucune écriture requise", async () => {
  const w = monde({ niveau: 3 });
  await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(w.appels.ouvrirDossier, 1);
  // Même demande répétée dans une NOUVELLE mission (la précédente est terminée), même au niveau 1 (lecture seule) :
  // le dossier est retrouvé, pas recréé.
  for (const l of w.lignes) l.statut = "accomplie";
  w.m.niveau = 1;
  const r = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  const d = r.etapes.find((e) => e.etape === "dossier")!;
  assert.equal(w.appels.ouvrirDossier, 1, "aucun second dossier");
  assert.equal(w.dossiers.length, 1);
  assert.equal(d.statut, "fait");
  assert.equal(d.permission, "READ");
  assert.match(d.observe, /déjà ouvert.*aucun doublon/);
});

test("5. une opération autorisée continue quand une autre est bloquée", async () => {
  // Rôle sans WRITE : le dossier est bloqué, mais les contrôles (TEST) et la demande de déploiement continuent.
  const w = monde({ niveau: 7, permissions: TOUTES.filter((p) => p !== "WRITE") });
  const r = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(statuts(r).dossier, "refuse");
  assert.match(r.etapes.find((e) => e.etape === "dossier")!.observe, /Autorisation manquante : la permission WRITE n'est pas accordée au rôle « super_admin »/);
  assert.equal(statuts(r).tests, "fait");
  assert.equal(statuts(r).deploiement, "fait");
  assert.equal(w.appels.tests, 1);
  assert.equal(r.statut, "arretee");
  assert.equal(r.arretSur, "dossier");
  assert.match(r.prochaineAction, /permission WRITE/);
  assert.equal(w.appels.retenir[0]!.resultat, "blocage_autorisation");
  // Les étapes qui dépendent d'une étape non résolue, elles, ne sont pas exécutées.
  const w2 = monde({ niveau: 1 });
  const r2 = await orchestrer(entree("Répare le paiement de la page abonnement"), w2.deps);
  assert.equal(statuts(r2).correctif, "en_attente_autorisation");
  assert.equal(statuts(r2).deploiement, "non_execute");
});

test("6. reprise après changement de curseur autorisé : on repart de l'étape utile, résultats conservés", async () => {
  const w = monde({ niveau: 2 });
  const a = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(a.arretSur, "dossier");
  const routeurApres1 = w.appels.router;
  w.m.niveau = 5; // décision du propriétaire, hors orchestrateur
  const b = await orchestrer(entree("continue", { missionActiveId: a.id }), w.deps);
  assert.equal(b.repriseDe, a.id);
  assert.equal(w.appels.router, routeurApres1, "analyse et correctif non refaits");
  assert.equal(statuts(b).architecture, "fait");
  assert.equal(statuts(b).dossier, "fait");
  assert.equal(statuts(b).tests, "fait");
  assert.equal(statuts(b).deploiement, "fait");
  assert.equal(b.statut, "accomplie");
  assert.equal(b.deploiementDemandeId, 5);
  // La mission reprise n'est plus « inachevée » : un nouveau « continue » ne la reprend pas.
  const c = await orchestrer(entree("continue"), w.deps);
  assert.equal(c.statut, "a_clarifier");
});

test("7. statuts et compteur exacts : un texte explicatif ne valide pas une étape technique", async () => {
  // Correctif : un texte sans aucun fichier n'est PAS « fait ».
  const w = monde({ texteCorrectif: "Il faudrait revoir la logique de paiement et vérifier les cas limites." });
  const r = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(statuts(r).correctif, "partielle");
  assert.match(r.etapes.find((e) => e.etape === "correctif")!.observe, /Texte sans aucun fichier nommé.*pas encore un correctif exploitable/);
  assert.equal(r.etapes.find((e) => e.etape === "correctif")!.preuve, "");

  // Correctif qui cite un fichier inventé : partielle aussi.
  const w2 = monde({ texteCorrectif: "Modifier server/inexistant/fantome.ts pour corriger." });
  const r2 = await orchestrer(entree("Répare le paiement de la page abonnement"), w2.deps);
  assert.equal(statuts(r2).correctif, "partielle");
  assert.match(r2.etapes.find((e) => e.etape === "correctif")!.observe, /introuvables au relevé/);

  // Correctif ancré sur des fichiers réels : fait, avec preuve.
  const w3 = monde();
  const r3 = await orchestrer(entree("Répare le paiement de la page abonnement"), w3.deps);
  assert.equal(statuts(r3).correctif, "fait");
  assert.match(r3.etapes.find((e) => e.etape === "correctif")!.preuve, /1 fichier\(s\) cité\(s\) confirmé\(s\) au relevé/);
  assert.equal(statuts(r3).architecture, "fait");
  assert.match(r3.etapes.find((e) => e.etape === "architecture")!.preuve, /2\/2 fichier\(s\) confirmé\(s\) au relevé/);

  // Compteur : n'additionne que le fait. 8 étapes, 6 faites, 1 partielle (correctif), 1 non exécutée… ici : correctif partielle.
  assert.equal(r.compteur.total, 8);
  assert.equal(r.compteur.executees, r.etapes.filter((e) => e.statut === "fait").length);
  assert.equal(r.compteur.partielles, 1);
  assert.equal(compter(r.etapes).executees + compter(r.etapes).partielles + compter(r.etapes).bloquees + compter(r.etapes).echouees + compter(r.etapes).nonExecutees + compter(r.etapes).nonApplicables, 8);
  assert.match(r.resume, new RegExp(`${r.compteur.executees}/8 étape\\(s\\) exécutée\\(s\\) avec résultat obtenu`));
  assert.ok(r.compteur.executees < 8);

  // Catégories distinctes.
  assert.equal(categorie("fait"), "executee");
  assert.equal(categorie("partielle"), "partielle");
  assert.equal(categorie("refuse"), "bloquee");
  assert.equal(categorie("en_attente_autorisation"), "bloquee");
  assert.equal(categorie("non_execute"), "non_executee");
  assert.equal(categorie("non_applicable"), "non_applicable");
  assert.equal(categorie("n'importe quoi"), "non_executee", "un statut inconnu n'est jamais compté comme fait");

  // Panne du modèle : échec technique, pas une étape faite.
  const w4 = monde({ routerEnPanne: true });
  const r4 = await orchestrer(entree("Répare le paiement de la page abonnement"), w4.deps);
  assert.equal(statuts(r4).analyse, "echec");
  assert.equal(r4.statut, "echouee");
  assert.equal(w4.appels.retenir[0]!.resultat, "echec_technique");

  // Contrôles sans couverture : partielle, et la demande de déploiement n'est pas posée.
  const w5 = monde({ testsTotal: 0 });
  const r5 = await orchestrer(entree("Répare le paiement de la page abonnement"), w5.deps);
  assert.equal(statuts(r5).tests, "partielle");
  assert.equal(statuts(r5).deploiement, "non_execute");
  assert.equal(w5.appels.deploiement, 0);
});

test("8. mémoire : la nature de l'issue est distinguée, jamais une « correction vérifiée » fabriquée", async () => {
  const w = monde();
  const ok = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  assert.equal(ok.statut, "accomplie");
  assert.equal(w.appels.retenir[0]!.resultat, "accomplie_non_verifiee");
  assert.ok(w.appels.retenir.every((x) => x.resultat !== "correction_verifiee"));
  // Une demande courte sans mission n'écrit rien en mémoire, aussi souvent qu'elle est répétée.
  const w2 = monde();
  for (let i = 0; i < 5; i++) await orchestrer(entree("Tu peux travailler"), w2.deps);
  assert.equal(w2.appels.retenir.length, 0);
  assert.equal(w2.appels.creer, 0);
});

test("9. état court : mission, travail réalisé, blocage précis, prochaine action — sans répétition", async () => {
  const w = monde({ niveau: 2 });
  const r = await orchestrer(entree("Répare le paiement de la page abonnement"), w.deps);
  const lignes = r.resume.split("\n");
  assert.equal(lignes.length, 4);
  assert.match(lignes[0]!, /^Mission #\d+ : « Répare le paiement/);
  assert.match(lignes[1]!, /^Travail réalisé : .*Lire l'architecture réellement en jeu/);
  assert.match(lignes[2]!, /^Arrêt : « Ouvrir le dossier de développement hors production » — Action bloquée/);
  assert.match(lignes[3]!, /^Prochaine action : Si le propriétaire l'autorise : monter le curseur « paiement » au niveau 3, puis relancer « continue »/);
  assert.ok(r.resume.length < 1400, `résumé court (${r.resume.length})`);
});

test("cheminsCites : n'extrait que de vrais chemins de fichiers", () => {
  const t = "Modifier `server/a/b.ts` et client/src/x.tsx, voir aussi la section 3.2 et l'url example.com/page.";
  assert.deepEqual(cheminsCites(t), ["server/a/b.ts", "client/src/x.tsx"]);
});
