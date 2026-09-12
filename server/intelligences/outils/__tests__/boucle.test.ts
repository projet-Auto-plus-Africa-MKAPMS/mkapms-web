/**
 * Tests du Tool Registry + boucle d'exécution (server/intelligences/outils/).
 *
 * Aucun accès réseau ni base de données réels dans cet environnement de
 * travail (pas de clé de fournisseur, PostgreSQL injoignable) : le modèle
 * (routerImpl) et la vérification de permission (verifierPermission) sont
 * injectés avec de faux comportements scriptés pour ces tests — la boucle,
 * le registre, la politique (hors vérification de permission) et
 * l'exécuteur sont le vrai code de production, rien n'est simulé côté
 * MKA.P-MS. audit.ts.journaliser() échoue silencieusement sans base (comme en
 * production quand la mesure échoue) : les tests ne vérifient pas la
 * persistance, seulement le comportement de la boucle.
 *
 * Lancement : `npx tsx server/intelligences/outils/__tests__/boucle.test.ts`
 */
import assert from "node:assert/strict";
import type { AppelOutil, MessageConversation } from "../../provider.js";
import type { JournaliserFn, RouterFn } from "../boucle.js";
import { executerAvecOutils } from "../boucle.js";
import { evaluer, type GetCountryFn, type VerifierPermission } from "../politique.js";
import { executer } from "../executeur.js";
import { trouver, listerActifs, listerParCategorie, resume, OUTILS } from "../registre.js";
import { validerArguments } from "../validation.js";
import { decoderVin } from "../familles/outils-vehicules.js";

/** Base de données injoignable dans cet environnement de travail : le journal est un no-op pour les tests. */
const JOURNAL_MUET: JournaliserFn = async () => {};

/**
 * Aucun PostgreSQL joignable dans cet environnement de travail : le Country
 * Engine réel (server/country-os) est injecté avec de faux pays scriptés
 * pour ces tests — politique.ts (hors ce point d'accès) reste le vrai code
 * de production.
 */
// getCountry() renvoie réellement `Row | null` (voir server/country-os/index.ts,
// `row ?? null`) mais TS infère son type sans le contrôle d'index désactivé
// comme `Row` seul — politique.ts se protège quand même de `null` en
// exécution réelle, ces faux pays doivent donc être forcés au même titre.
function paysFictif(actif: boolean) {
  return { active: actif } as unknown as Awaited<ReturnType<GetCountryFn>>;
}
const PAYS_FR_OUVERT: GetCountryFn = (async () => paysFictif(true)) as GetCountryFn;
const PAYS_INCONNU: GetCountryFn = (async () => null) as unknown as GetCountryFn;
const PAYS_FERME: GetCountryFn = (async () => paysFictif(false)) as GetCountryFn;

const AUTORISE_TOUT: VerifierPermission = async () => ({
  autorise: true,
  motif: "",
  parRole: ["READ", "ANALYZE", "WRITE"],
  parMoteur: ["READ", "ANALYZE", "WRITE"],
});

const REFUSE_TOUT: VerifierPermission = async (input) => ({
  autorise: false,
  motif: `Permission ${input.permission} refusée (test).`,
  parRole: [],
  parMoteur: [],
});

/** Fabrique un faux routeur qui rejoue une suite de réponses scriptées, un appel par tour. */
function routeurScripte(reponses: { texte?: string; appelsOutils?: AppelOutil[] }[]): RouterFn {
  let tour = 0;
  return (async (demande: unknown) => {
    const d = demande as { capacite: string; historique?: MessageConversation[] };
    const script = reponses[Math.min(tour, reponses.length - 1)];
    tour++;
    return {
      capacite: d.capacite,
      ok: true,
      texte: script.texte ?? "",
      fournisseur: "openai",
      modele: "test-modele",
      motif: "",
      jetonsEntree: 10,
      jetonsSortie: 10,
      dureeMs: 1,
      tentatives: [],
      appelsOutils: script.appelsOutils ?? [],
      repli: "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }) as RouterFn;
}

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) {
    ok++;
  } else {
    console.error(`ÉCHEC : ${nom}`);
  }
  assert.ok(condition, nom);
}

async function main() {
  // ── Registre ────────────────────────────────────────────────────────
  verif("registre : 5 outils de test déclarés", listerParCategorie("test").length === 5);
  verif("registre : outil inconnu introuvable", trouver("test.nexiste_pas") === null);
  verif("registre : au moins 30 familles couvertes (demande de la direction)", resume().parCategorie.length >= 30 - 1 && resume().parCategorie.length === 31);
  verif("registre : aucun outil absent faute d'implémentation (statut assumé)", OUTILS.every((o) => o.implementationStatus !== undefined));
  verif("registre : famille véhicules complète (17 outils demandés)", listerParCategorie("vehicules").length === 17);
  verif(
    "registre : REGISTERED_NOT_IMPLEMENTED toujours désactivé (jamais exécutable sans code)",
    OUTILS.filter((o) => o.implementationStatus === "REGISTERED_NOT_IMPLEMENTED").every((o) => !o.enabled),
  );
  verif(
    "registre : famille paiements présente mais non câblée (interdiction de coder les paiements dans ce lot)",
    listerParCategorie("paiements").length > 0 && listerParCategorie("paiements").every((o) => o.implementationStatus === "REGISTERED_NOT_IMPLEMENTED"),
  );
  verif(
    "registre : outils actifs = IMPLEMENTED + IMPLEMENTED_NOT_CONNECTED, jamais un REGISTERED_NOT_IMPLEMENTED",
    listerActifs().length === resume().parStatut.IMPLEMENTED + resume().parStatut.IMPLEMENTED_NOT_CONNECTED,
  );

  // ── 1. Outil autorisé ───────────────────────────────────────────────
  {
    const outil = trouver("test.calcul_simple")!;
    const politique = await evaluer(outil, { role: "user", moteur: "test" }, AUTORISE_TOUT);
    verif("1. outil autorisé : verdict autorise", politique.verdict === "autorise");
    const exec = await executer(outil, JSON.stringify({ a: 4, b: 3, operation: "addition" }));
    verif("1. outil autorisé : exécution réussie", exec.statut === "execute");
    verif("1. outil autorisé : résultat correct", (exec.resultat as { resultat: number }).resultat === 7);
  }

  // ── 2. Outil interdit (désactivé au registre) ──────────────────────
  {
    const outilDesactive = { ...trouver("test.calcul_simple")!, enabled: false };
    const politique = await evaluer(outilDesactive, { role: "super_admin", moteur: "test" }, AUTORISE_TOUT);
    verif("2. outil interdit : verdict refuse", politique.verdict === "refuse");
    verif("2. outil interdit : motif nomme la désactivation", politique.motif.includes("désactivé"));
  }

  // ── 3. Mauvais rôle ─────────────────────────────────────────────────
  {
    const outil = trouver("test.recuperer_statut")!; // allowedRoles: admin, super_admin
    const politique = await evaluer(outil, { role: "user", moteur: "test" }, AUTORISE_TOUT);
    verif("3. mauvais rôle : verdict refuse", politique.verdict === "refuse");
    verif("3. mauvais rôle : motif nomme le rôle", politique.motif.includes("Rôle"));
  }

  // ── Permission refusée (distinct du mauvais rôle) ──────────────────
  {
    const outil = trouver("test.calcul_simple")!; // allowedRoles inclut "user"
    const politique = await evaluer(outil, { role: "user", moteur: "test" }, REFUSE_TOUT);
    verif("permission refusée : verdict refuse", politique.verdict === "refuse");
    verif("permission refusée : motif nomme la permission", politique.motif.includes("Permission"));
  }

  // ── 4. Arguments invalides ──────────────────────────────────────────
  {
    const outil = trouver("test.calcul_simple")!;
    const exec = await executer(outil, JSON.stringify({ a: "pas un nombre", b: 2, operation: "addition" }));
    verif("4. arguments invalides : statut arguments_invalides", exec.statut === "arguments_invalides");

    const v = validerArguments(outil.schemaInput, { a: 1 }); // b et operation manquants
    verif("4. validation : champs requis détectés", v.erreurs.length === 2);
  }

  // ── 5. Outil inconnu (dans la boucle complète) ─────────────────────
  {
    const routeur = routeurScripte([
      { appelsOutils: [{ id: "call_1", nom: "test.nexiste_vraiment_pas", arguments: "{}" }] },
      { texte: "Je ne connais pas cet outil, je réponds sans lui." },
    ]);
    const res = await executerAvecOutils(
      { moteur: "test", role: "super_admin", systeme: "test", message: "bonjour", outilsProposes: ["test.calcul_simple"] },
      routeur,
      AUTORISE_TOUT,
      JOURNAL_MUET,
    );
    verif("5. outil inconnu : boucle poursuit (pas un crash)", res.appelsOutils.length === 1);
    verif("5. outil inconnu : trace refuse", res.appelsOutils[0].verdictPolitique === "refuse");
    verif("5. outil inconnu : motif nomme l'inconnu", res.appelsOutils[0].motif.includes("inconnu"));
  }

  // ── 6. Outil en erreur ──────────────────────────────────────────────
  {
    const outil = trouver("test.calcul_simple")!;
    const exec = await executer(outil, JSON.stringify({ a: 10, b: 0, operation: "division" }));
    verif("6. outil en erreur : statut erreur", exec.statut === "erreur");
    verif("6. outil en erreur : motif propage l'erreur réelle", exec.motif.includes("Division par zéro"));
  }

  // ── Timeout ─────────────────────────────────────────────────────────
  {
    const outilLent = { ...trouver("test.calcul_simple")!, toolId: "test.calcul_simple", timeoutMs: 5 };
    // calcul_simple est instantané : on vérifie ici seulement que le
    // mécanisme de délai ne casse pas un outil rapide (pas de faux timeout).
    const exec = await executer(outilLent, JSON.stringify({ a: 1, b: 1, operation: "addition" }));
    verif("timeout : un outil rapide n'est jamais faussement chronométré", exec.statut === "execute");
  }

  // ── 7. Appel multiple (deux outils dans le même tour) ──────────────
  {
    const routeur = routeurScripte([
      {
        appelsOutils: [
          { id: "call_1", nom: "test.calcul_simple", arguments: JSON.stringify({ a: 2, b: 2, operation: "addition" }) },
          { id: "call_2", nom: "test.recherche_simulee", arguments: JSON.stringify({ requete: "moteur" }) },
        ],
      },
      { texte: "Réponse finale après les deux outils." },
    ]);
    const res = await executerAvecOutils(
      { moteur: "test", role: "super_admin", systeme: "test", message: "calcule et cherche", outilsProposes: ["test.calcul_simple", "test.recherche_simulee"] },
      routeur,
      AUTORISE_TOUT,
      JOURNAL_MUET,
    );
    verif("7. appel multiple : deux outils tracés", res.appelsOutils.length === 2);
    verif("7. appel multiple : les deux exécutés", res.appelsOutils.every((a) => a.statutExecution === "execute"));
    verif("7. appel multiple : réponse finale obtenue", res.ok && res.texteFinal === "Réponse finale après les deux outils.");
    verif("7. appel multiple : deux itérations", res.iterations === 2);
  }

  // ── 8. Boucle bloquée par limite ────────────────────────────────────
  {
    const routeur = routeurScripte([
      { appelsOutils: [{ id: "call_boucle", nom: "test.calcul_simple", arguments: JSON.stringify({ a: 1, b: 1, operation: "addition" }) }] },
    ]); // renvoie toujours un appel d'outil, jamais de texte final
    const res = await executerAvecOutils(
      { moteur: "test", role: "super_admin", systeme: "test", message: "boucle", outilsProposes: ["test.calcul_simple"], maxIterations: 3 },
      routeur,
      AUTORISE_TOUT,
      JOURNAL_MUET,
    );
    verif("8. limite : arrêt à la limite déclarée", res.iterations === 3);
    verif("8. limite : limiteAtteinte vraie", res.limiteAtteinte === true);
    verif("8. limite : échec propre, pas un texte inventé", res.ok === false && res.texteFinal === "");
  }

  // ── 9. Sortie structurée après appel d'outil ───────────────────────
  {
    const routeur = routeurScripte([
      { appelsOutils: [{ id: "call_1", nom: "test.calcul_simple", arguments: JSON.stringify({ a: 3, b: 4, operation: "multiplication" }) }] },
      { texte: JSON.stringify({ resultat_final: 12 }) },
    ]);
    const res = await executerAvecOutils(
      {
        moteur: "test",
        role: "super_admin",
        systeme: "test",
        message: "calcule 3x4 et structure la réponse",
        outilsProposes: ["test.calcul_simple"],
        sortieStructuree: { nom: "resultat", schema: { type: "object", properties: { resultat_final: { type: "number" } } } },
      },
      routeur,
      AUTORISE_TOUT,
      JOURNAL_MUET,
    );
    verif("9. sortie structurée : réponse finale obtenue après l'outil", res.ok);
    const parse = JSON.parse(res.texteFinal) as { resultat_final: number };
    verif("9. sortie structurée : JSON conforme", parse.resultat_final === 12);
  }

  // ── Validation humaine requise ──────────────────────────────────────
  {
    const outil = trouver("test.action_sensible_simulee")!;
    const politique = await evaluer(outil, { role: "super_admin", moteur: "test" }, AUTORISE_TOUT);
    verif("validation humaine : verdict en attente", politique.verdict === "attente_approbation_humaine");
    verif("validation humaine : jamais exécuté par ce lot", politique.motif.includes("jamais exécuté"));
  }

  // ── Règle non négociable : risque HIGH/CRITICAL toujours refusé ────
  {
    const outilCritique = { ...trouver("test.calcul_simple")!, riskLevel: "CRITICAL" as const, requiresHumanApproval: false };
    const politique = await evaluer(outilCritique, { role: "super_admin", moteur: "test" }, AUTORISE_TOUT);
    verif("risque CRITICAL : toujours refusé, même rôle+permission autorisés", politique.verdict === "refuse");
  }

  // ── Country Engine : mondial par conception, jamais un pays par défaut ──
  {
    const outilMondial = trouver("vehicules.decodeVIN")!; // allowedCountries: null
    const autoriseFr = await evaluer(outilMondial, { role: "user", moteur: "test", countryCode: "FR" }, AUTORISE_TOUT, PAYS_FR_OUVERT);
    verif("pays : outil mondial autorisé pour un pays ouvert au Country Engine", autoriseFr.verdict === "autorise");

    const sansCode = await evaluer(outilMondial, { role: "user", moteur: "test" }, AUTORISE_TOUT, PAYS_INCONNU);
    verif("pays : aucun countryCode fourni → aucune vérification pays bloquante", sansCode.verdict === "autorise");

    const paysFerme = await evaluer(outilMondial, { role: "user", moteur: "test", countryCode: "ZZ" }, AUTORISE_TOUT, PAYS_FERME);
    verif("pays : pays existant mais fermé (active=false) → refusé", paysFerme.verdict === "refuse");
    verif("pays : motif nomme le Country Engine", paysFerme.motif.includes("Country Engine"));

    const paysInconnu = await evaluer(outilMondial, { role: "user", moteur: "test", countryCode: "XX" }, AUTORISE_TOUT, PAYS_INCONNU);
    verif("pays : pays absent du Country Engine → refusé par prudence, jamais un pays par défaut", paysInconnu.verdict === "refuse");

    const outilRestreint = { ...trouver("vehicules.identifyVehicleByPlate")!, allowedCountries: ["FR"] };
    const horsListe = await evaluer(outilRestreint, { role: "pro", moteur: "test", countryCode: "DE" }, AUTORISE_TOUT, PAYS_FR_OUVERT);
    verif("pays : allowedCountries explicite → refusé hors liste", horsListe.verdict === "refuse");
    const dansListe = await evaluer(outilRestreint, { role: "pro", moteur: "test", countryCode: "FR" }, AUTORISE_TOUT, PAYS_FR_OUVERT);
    verif("pays : allowedCountries explicite → autorisé dans la liste", dansListe.verdict === "autorise");

    const outilBloque = { ...trouver("vehicules.decodeVIN")!, blockedCountries: ["FR"] };
    const bloque = await evaluer(outilBloque, { role: "user", moteur: "test", countryCode: "FR" }, AUTORISE_TOUT, PAYS_FR_OUVERT);
    verif("pays : blockedCountries prioritaire même si le pays est ouvert", bloque.verdict === "refuse");
  }

  // ── Famille véhicules : decodeVIN (décodage structurel réel, sans base de données) ──
  {
    const vinRenault = "VF1RFB00X12345678"; // WMI VF1 = Renault (table interne)
    const decode = decoderVin(vinRenault);
    verif("decodeVIN : VIN 17 caractères reconnu valide", decode.valide === true);
    verif("decodeVIN : constructeur retrouvé via WMI connu", decode.constructeur === "Renault");
    verif("decodeVIN : confiance moyenne pour un WMI connu", decode.confiance === "moyenne");

    const vinInconnu = "9BWZZZ377VT004251".replace("9BW", "ZZZ"); // WMI hors table
    const decodeInconnu = decoderVin(vinInconnu);
    verif("decodeVIN : WMI absent de la table → confiance faible, jamais un constructeur inventé", decodeInconnu.confiance === "faible" && decodeInconnu.constructeur === "");

    const decodeInvalide = decoderVin("TROP_COURT");
    verif("decodeVIN : format invalide détecté (ni inventé, ni planté)", decodeInvalide.valide === false);

    const outil = trouver("vehicules.decodeVIN")!;
    const exec = await executer(outil, JSON.stringify({ vin: vinRenault }));
    verif("decodeVIN : passe par l'exécuteur réel (schéma + implémentation)", exec.statut === "execute");
  }

  // ── Famille véhicules : checkVehicleConsistency / normalizeVehicleData (aucun accès réseau ni base) ──
  {
    const outilCoherence = trouver("vehicules.checkVehicleConsistency")!;
    const vinRenault = "VF1RFB00X12345678";
    const coherent = await executer(outilCoherence, JSON.stringify({ vin: vinRenault, marqueDeclaree: "Renault" }));
    verif("checkVehicleConsistency : marque déclarée conforme au VIN → cohérent", (coherent.resultat as { coherent: boolean }).coherent === true);

    const incoherent = await executer(outilCoherence, JSON.stringify({ vin: vinRenault, marqueDeclaree: "Peugeot" }));
    const resIncoherent = incoherent.resultat as { coherent: boolean; ecarts: string[] };
    verif("checkVehicleConsistency : marque déclarée différente du VIN → incohérence détectée", resIncoherent.coherent === false && resIncoherent.ecarts.length > 0);

    const outilNormalise = trouver("vehicules.normalizeVehicleData")!;
    const normalise = await executer(outilNormalise, JSON.stringify({ marque: "renault", carburant: "GAZOLE", boite: "auto" }));
    const resNormalise = normalise.resultat as { marque: string; carburant: string; boite: string };
    verif("normalizeVehicleData : casse normalisée", resNormalise.marque === "Renault");
    verif("normalizeVehicleData : synonyme carburant reconnu (gazole → diesel)", resNormalise.carburant === "diesel");
    verif("normalizeVehicleData : synonyme boîte reconnu (auto → automatique)", resNormalise.boite === "automatique");
  }

  // ── Famille véhicules : dégradation honnête sans fournisseur externe (aucun accès réseau requis) ──
  {
    const outilHistorique = trouver("vehicules.checkVehicleHistory")!;
    const histo = await executer(outilHistorique, JSON.stringify({ vin: "VF1RFB00X12345678", countryCode: "FR" }));
    const resHisto = histo.resultat as { disponible: boolean; verifie: boolean };
    verif("checkVehicleHistory : jamais déclaré sain sans preuve (disponible=false, verifie=false)", resHisto.disponible === false && resHisto.verifie === false);

    const outilRappel = trouver("vehicules.checkRecall")!;
    const rappel = await executer(outilRappel, JSON.stringify({ vin: "VF1RFB00X12345678" }));
    verif("checkRecall : jamais déclaré « aucun rappel » sans base connectée", (rappel.resultat as { disponible: boolean }).disponible === false);
  }

  // ── REGISTERED_NOT_IMPLEMENTED : refusé par la politique avant même l'exécuteur ──
  {
    const outilGros = trouver("vehicules.getWholesaleValue")!;
    verif("getWholesaleValue : enregistré mais désactivé (aucune règle inventée)", outilGros.enabled === false);
    const politique = await evaluer(outilGros, { role: "pro", moteur: "test" }, AUTORISE_TOUT, PAYS_INCONNU);
    verif("getWholesaleValue : refusé par la politique (registre non implémenté)", politique.verdict === "refuse");
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
