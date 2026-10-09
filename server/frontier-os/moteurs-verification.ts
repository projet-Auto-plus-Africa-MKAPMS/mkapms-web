/**
 * Moteurs de VÉRIFICATION : ils contrôlent les conditions AVANT, puis le résultat APRÈS. Ils ne lisent ni la réponse ni le plan du moteur de
 * commande : la sonde interroge le service de transport (continuité réelle du contact) et recompte les coupures dans la base ; le résultat
 * observé n'est écrit que d'après leur verdict. Un autre code, un autre identifiant que les moteurs de commande.
 */
import { eq } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { cuts, groups, lines } from "./base/schema.js";
import type { CoteCoupure } from "./base/schema.js";
import { enregistrer, RefusMoteur } from "./bus.js";
import { chargerCoupures, chargerLigne, coupuresLite, ligneLite } from "./chaine.js";
import { adaptateurDe } from "./liaisons-reelles.js";
import { reelAutorise } from "./reel-etat.js";
import { decisionPassage, etatContactGroupe, etatLigne, ligneAdmissible } from "./regles.js";
import { continuite, envoyer as envoyerEchange, livreurIsole } from "./transport.js";

const COTES: readonly CoteCoupure[] = ["remote", "center", "main"];

function brancherSonde(cote: CoteCoupure): void {
  const code = `center:ver.cut.${cote}`;
  enregistrer(code, "verification.conditions", async (m, ctx) => {
    const { coupureId, voulu } = m.contenu as { coupureId: number; voulu: "activate" | "deactivate" };
    const [cut] = await dbFrontier().select().from(cuts).where(eq(cuts.id, coupureId)).limit(1);
    if (!cut) throw new RefusMoteur("COUPURE_INCONNUE", `Coupure ${coupureId} inconnue.`);
    if (cut.side !== cote) throw new RefusMoteur("MAUVAIS_COTE", `Cette sonde dessert le côté « ${cote} », pas « ${cut.side} ».`);
    if (ctx.mode !== "simulation") throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé : seule la simulation peut être demandée par une commande.");
    const c = await chargerLigne(cut.lineId);
    if (!c || c.ligne.kind !== "real") throw new RefusMoteur("VIDE", "Ligne vide ou inconnue.");
    if (cut.mode === "real" && voulu === "activate") {
      // Une coupure réelle ne s'active que si le mode réel est permis ET si une liaison réelle existe ; une COUPURE, elle, est toujours permise.
      if (!(await reelAutorise())) throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas permis (variable d'environnement et armement du PDG requis).");
      const a = adaptateurDe(cut, c.ligne);
      if (!a.disponible) throw new RefusMoteur("LIAISON_ABSENTE", a.raison ?? "Aucune liaison réelle pour cette coupure.");
    }
    // Une coupure (demande de désactivation) est toujours permise. Une activation exige une ligne activée, déverrouillée et validée.
    if (voulu === "activate") {
      if (!c.ligne.enabled) throw new RefusMoteur("DESACTIVEE", "Ligne désactivée.");
      if (c.ligne.locked) throw new RefusMoteur("VERROUILLEE", "Ligne verrouillée : déverrouillez-la d'abord.");
      if (c.ligne.validity !== "valid") throw new RefusMoteur("NON_VALIDEE", `Ligne non validée : ${c.ligne.invalidReasons[0] ?? "chaîne incomplète"}`);
    }
    return { ok: true, ligne: c.ligne.id, validite: c.ligne.validity };
  });
  enregistrer(code, "verification.sonder", async (m, ctx) => {
    const { coupureId, voulu } = m.contenu as { coupureId: number; voulu?: "activate" | "deactivate" };
    const t0 = performance.now();
    const passe = await continuite(coupureId);
    if (passe === null) throw new RefusMoteur("PORTE_INCONNUE", `Aucune porte de transport pour la coupure ${coupureId}.`);
    const [cut] = await dbFrontier().select().from(cuts).where(eq(cuts.id, coupureId)).limit(1);
    if (cut?.mode === "real") {
      // Coupure RÉELLE : la sonde relit la liaison réelle, indépendamment de ce que le moteur de commande annonce. « Connecté » exige la porte ET la liaison ;
      // « déconnecté » exige la porte fermée ET la liaison qui ne passe plus. Un état mixte n'est jamais une coupure confirmée. Pas de preuve fraîche : INCONNU.
      const c = await chargerLigne(cut.lineId);
      const a = adaptateurDe(cut, c!.ligne);
      if (!a.liaison) return { passe, source: "porte du service de transport (contact central réel : lu par le portier)", reel: true, mesureMs: Math.round((performance.now() - t0) * 100) / 100 };
      const constat = await a.liaison.lire();
      if (constat.passe === null) throw new RefusMoteur("ETAT_REEL_INCONNU", `État réel inconnu : ${constat.preuve}.`);
      const verdictReel = voulu === "deactivate" ? passe || constat.passe : passe && constat.passe;
      return { passe: verdictReel, source: `${a.libelle} — ${constat.preuve} ; porte du transport ${passe ? "ouverte" : "fermée"}`, reel: true, porte: passe, liaison: constat.passe, mesureMs: Math.round((performance.now() - t0) * 100) / 100 };
    }
    // Désaccord simulé : la sonde rend l'inverse de ce qu'elle a mesuré (essai du recoupement des deux moteurs).
    const verdict = ctx.defaut === "desaccord" ? !passe : passe;
    return { passe: verdict, source: "porte du service de transport", mesureMs: Math.round((performance.now() - t0) * 100) / 100 };
  });
  enregistrer(code, "sante.verifier", async () => {
    await dbFrontier().select({ id: cuts.id }).from(cuts).limit(1);
    return { ok: true };
  });
}

function brancherControleLigne(): void {
  const code = "center:ver.line";
  enregistrer(code, "verification.conditions", async (m, ctx) => {
    const { ligneId, voulu } = m.contenu as { ligneId: number; voulu: "activate" | "deactivate" };
    if (ctx.mode !== "simulation") throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.");
    const c = await chargerLigne(ligneId);
    if (!c || c.ligne.kind !== "real") throw new RefusMoteur("VIDE", "Ligne vide ou inconnue.");
    if (voulu === "activate") {
      const a = ligneAdmissible(ligneLite(c.ligne), coupuresLite(c.coupures));
      if (!a.ok) throw new RefusMoteur(a.raison ?? "NON_ADMISSIBLE", a.detail ?? "Ligne non admissible.");
    }
    return { ok: true };
  });
  enregistrer(code, "verification.agreger", async (m) => {
    const { ligneId, voulu } = m.contenu as { ligneId: number; voulu: "activate" | "deactivate" };
    const c = await chargerLigne(ligneId);
    if (!c) throw new RefusMoteur("LIGNE_INCONNUE", "Ligne inconnue.");
    const etat = etatLigne(coupuresLite(c.coupures));
    const attendu = decisionPassage(ligneLite(c.ligne), coupuresLite(c.coupures), { reelAutorise: await reelAutorise() });
    // Sonde de bout en bout : un échange de contrôle doit traverser SI ET SEULEMENT SI le passage est autorisé.
    const sonde = await envoyerEchange({ ligneId, direction: "remote_to_main", kind: "probe", payloadRef: "sonde:bout-en-bout" }, livreurIsole);
    const coherent = sonde.livre === attendu.autorise && (voulu === "activate" ? etat === "connected" : etat === "disconnected");
    return { etat, passageAutorise: attendu.autorise, sondeLivree: sonde.livre, coherent };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

function brancherControleGroupe(): void {
  const code = "center:ver.group";
  enregistrer(code, "verification.conditions", async (m, ctx) => {
    const { groupe } = m.contenu as { groupe: string };
    if (ctx.mode !== "simulation") throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.");
    const [g] = await dbFrontier().select().from(groups).where(eq(groups.code, groupe)).limit(1);
    if (!g) throw new RefusMoteur("GROUPE_INCONNU", `Groupe « ${groupe} » inconnu.`);
    return { ok: true };
  });
  enregistrer(code, "verification.agreger", async (m) => {
    const { groupe, ligneIds } = m.contenu as { groupe: string; ligneIds: number[] };
    const coup = await chargerCoupures(ligneIds);
    const centres = ligneIds.flatMap((id) => (coup.get(id) ?? []).filter((c) => c.side === "center")).map((c) => coupuresLite([c])[0]!);
    return { groupe, contact: etatContactGroupe(centres), centres: centres.length, connectes: centres.filter((c) => c.observed === "connected" && c.progress === "confirmed").length, deconnectes: centres.filter((c) => c.observed === "disconnected").length };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

function brancherControleGeneral(): void {
  const code = "center:ver.general";
  enregistrer(code, "verification.conditions", async (_m, ctx) => {
    if (ctx.mode !== "simulation") throw new RefusMoteur("MODE_REEL_NON_ACTIVE", "Le mode réel n'est pas activé.");
    return { ok: true };
  });
  enregistrer(code, "verification.agreger", async (m) => {
    const { ligneIds } = m.contenu as { ligneIds: number[] };
    const reelles = ligneIds.length ? ligneIds : (await dbFrontier().select({ id: lines.id }).from(lines).where(eq(lines.kind, "real"))).map((l) => l.id);
    const coup = await chargerCoupures(reelles);
    const parLigne = reelles.map((id) => ({ ligneId: id, etat: etatLigne(coupuresLite(coup.get(id) ?? [])) }));
    return { lignes: parLigne, connectees: parLigne.filter((l) => l.etat === "connected").length, deconnectees: parLigne.filter((l) => l.etat === "disconnected").length, total: parLigne.length };
  });
  enregistrer(code, "sante.verifier", async () => ({ ok: true }));
}

let branche = false;
export function brancherMoteursDeVerification(): void {
  if (branche) return;
  for (const c of COTES) brancherSonde(c);
  brancherControleLigne();
  brancherControleGroupe();
  brancherControleGeneral();
  branche = true;
}
