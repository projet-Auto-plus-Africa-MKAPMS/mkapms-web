/** Câble Boutique : le moteur intermédiaire entre la plateforme principale et la Boutique — couper, rebrancher, voir ce qui passe. */
import { useState } from "react";
import { trpc } from "../../../lib/trpc";

const SENS: Record<string, string> = { sortant: "Plateforme → Boutique", entrant: "Boutique → plateforme", mixte: "Dans les deux sens" };
const BLOCAGE: Record<string, string> = {
  MAITRE_COUPE: "Coupé par le commutateur général",
  CANAL_COUPE: "Canal coupé",
  ATTENTE_EXTERNE: "En attente d'une activation externe côté Boutique",
};
const ETAT_BOITE: Record<string, string> = { en_attente: "En attente de votre décision", approuve: "Approuvé", rejete: "Refusé", transmis: "Récupéré par la Boutique", integre: "Proposé dans la connaissance" };
const TYPES: Record<string, string> = { procedure: "Procédure", connaissance: "Connaissance", erreur_solution: "Erreur et solution" };

const date = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR") : "jamais");

export function CableBoutique() {
  const utils = trpc.useUtils();
  const etat = trpc.shopLink.etat.useQuery(undefined, { refetchInterval: 15000 });
  const cles = trpc.shopLink.cles.useQuery();
  const journal = trpc.shopLink.journal.useQuery({ limite: 50 });
  const boite = trpc.shopLink.boite.useQuery(undefined, { refetchInterval: 15000 });
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");
  const [libelleCle, setLibelleCle] = useState("");
  const [clePublique, setClePublique] = useState("");
  const [nouveau, setNouveau] = useState({ type: "procedure" as keyof typeof TYPES, titre: "", contenu: "" });

  const apres = async (detail: string) => {
    setMessage(detail);
    await Promise.all([utils.shopLink.etat.invalidate(), utils.shopLink.cles.invalidate(), utils.shopLink.journal.invalidate(), utils.shopLink.boite.invalidate()]);
  };
  const erreur = (e: { message: string }) => setMessage(e.message);
  const regler = trpc.shopLink.regler.useMutation({ onSuccess: (r) => apres(r.detail), onError: erreur });
  const toutCouper = trpc.shopLink.toutCouper.useMutation({ onSuccess: (r) => apres(r.detail), onError: erreur });
  const enregistrer = trpc.shopLink.enregistrerCle.useMutation({
    onSuccess: async (r) => {
      if (r.ok) {
        setLibelleCle("");
        setClePublique("");
      }
      await apres(r.detail);
    },
    onError: erreur,
  });
  const revoquer = trpc.shopLink.revoquerCle.useMutation({ onSuccess: (r) => apres(r.detail), onError: erreur });
  const decider = trpc.shopLink.decider.useMutation({ onSuccess: (r) => apres(r.detail), onError: erreur });
  const creer = trpc.shopLink.creerSortant.useMutation({
    onSuccess: async (r) => {
      if (r.ok) setNouveau({ type: "procedure", titre: "", contenu: "" });
      await apres(r.detail);
    },
    onError: erreur,
  });
  const tester = trpc.shopLink.tester.useMutation({ onSuccess: (r) => apres(r.detail), onError: erreur });

  const motifOk = motif.trim().length >= 3;
  const maitreCoupe = etat.data?.maitre.etat !== "connecte";
  const entrants = (boite.data ?? []).filter((e) => e.sens === "entrant");
  const sortants = (boite.data ?? []).filter((e) => e.sens === "sortant");
  const contenuEtat = etat.data?.etatBoutique?.contenu as { moteurs?: { id: string; etat: string }[]; alertes?: number } | undefined;

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-black/10 p-4 space-y-2">
        <h2 className="text-base font-black">Câble Boutique — moteur intermédiaire</h2>
        <p className="text-sm">
          La plateforme principale et la Boutique ne se connectent jamais directement : tout passe par ce câble, que vous coupez ou rebranchez ici, canal par canal ou en entier.
          Par défaut tout est coupé. Chaque changement est tracé avec son motif ; rien n'est effacé quand on coupe.
        </p>
        <label className="block text-sm">
          Motif du prochain changement (obligatoire)
          <input value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={240} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Ex. essai avant la mise en service" />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">{etat.isLoading ? "Chargement…" : maitreCoupe ? "■ Commutateur général : COUPÉ" : "● Commutateur général : branché"}</span>
          <button type="button" disabled={!motifOk || toutCouper.isPending} onClick={() => toutCouper.mutate({ motif })} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">
            Tout couper
          </button>
          <button
            type="button"
            disabled={!motifOk || regler.isPending || !maitreCoupe}
            onClick={() => regler.mutate({ cible: "maitre", etat: "connecte", motif })}
            className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
          >
            Rebrancher le général
          </button>
          <button type="button" disabled={tester.isPending} onClick={() => tester.mutate()} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">
            {tester.isPending ? "Essai…" : "Essayer le canal catalogue (lecture seule)"}
          </button>
        </div>
        <p role="status" className="text-sm">{message}</p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {(etat.data?.canaux ?? []).map((c) => (
          <article key={c.id} className="rounded-xl border border-black/10 p-4 space-y-2 text-sm">
            <h3 className="font-bold">{c.libelle}</h3>
            <p className="text-xs">{SENS[c.sens]} · contrat {c.contratBoutique ?? "plateforme"}</p>
            <p>
              {c.activation === "attente_externe" ? "○ En attente d'activation externe" : c.passe ? "● Branché — les messages passent" : `■ Coupé — ${BLOCAGE[c.raisonBlocage ?? "CANAL_COUPE"]}`}
            </p>
            <p className="text-xs">{c.description}</p>
            <details>
              <summary className="text-xs">Ce qui peut passer / ne passe jamais</summary>
              <p className="text-xs"><b>Peut passer :</b> {c.donneesAutorisees.join(", ")}.</p>
              <p className="text-xs"><b>Ne passe jamais :</b> {c.donneesInterdites.join(", ")}.</p>
              <p className="text-xs"><b>Si on coupe :</b> {c.planCoupure}</p>
            </details>
            {c.raisonAttente && <p className="text-xs">{c.raisonAttente}</p>}
            {c.activation === "disponible" && c.etat === "coupe" && c.prerequisManquants.length > 0 && (
              <ul className="text-xs list-disc pl-4">
                {c.prerequisManquants.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}
            <p className="text-xs">Dernier passage : {date(c.dernierPassage)} · 24 h : {c.ok24h} réussi(s), {c.refus24h} refusé(s), {c.erreurs24h} erreur(s)</p>
            {c.motif && <p className="text-[11px] opacity-70">Dernier motif : {c.motif} ({date(c.modifieLe)})</p>}
            {c.activation === "disponible" && (
              <button
                type="button"
                disabled={!motifOk || regler.isPending}
                onClick={() => regler.mutate({ cible: c.id, etat: c.etat === "connecte" ? "coupe" : "connecte", motif })}
                className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40"
              >
                {c.etat === "connecte" ? "Couper ce canal" : "Brancher ce canal"}
              </button>
            )}
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Clés publiques de la Boutique</h3>
        <p className="text-xs">La Boutique signe chacun de ses messages ; la plateforme ne garde que la clé PUBLIQUE (aucun secret). Une clé révoquée est refusée tout de suite.</p>
        <ul className="text-sm space-y-1">
          {(cles.data ?? []).map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-2">
              <span>{k.etat === "active" ? "●" : "■"} {k.libelle} · {k.empreinte.slice(0, 16)}… · {date(k.creeLe)}{k.revoqueeLe ? ` · révoquée ${date(k.revoqueeLe)}` : ""}</span>
              {k.etat === "active" && (
                <button type="button" onClick={() => revoquer.mutate({ id: k.id })} className="rounded border px-2 py-1 text-xs font-bold">Révoquer</button>
              )}
            </li>
          ))}
          {(cles.data ?? []).length === 0 && <li className="text-xs">Aucune clé enregistrée : les canaux entrants ne peuvent pas être branchés.</li>}
        </ul>
        <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
          <input value={libelleCle} onChange={(e) => setLibelleCle(e.target.value)} maxLength={80} placeholder="Nom de la clé" className="rounded-lg border px-3 py-2 text-sm" />
          <input value={clePublique} onChange={(e) => setClePublique(e.target.value)} maxLength={200} placeholder="Clé publique Ed25519 (base64url)" className="rounded-lg border px-3 py-2 text-sm font-mono" />
          <button type="button" disabled={enregistrer.isPending || libelleCle.trim().length < 2 || clePublique.trim().length < 40} onClick={() => enregistrer.mutate({ libelle: libelleCle, clePublique })} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">
            Enregistrer
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 p-4 space-y-3">
        <h3 className="text-sm font-black">Échange de mémoire entre les deux IA</h3>
        <p className="text-xs">Rien n'entre ni ne sort sans votre décision. Un élément reçu approuvé est seulement PROPOSÉ dans la base de connaissances (vous le confirmez ensuite comme d'habitude).</p>
        <h4 className="text-sm font-bold">Reçu de la Boutique</h4>
        {entrants.length === 0 && <p className="text-xs">Rien reçu.</p>}
        {entrants.map((e) => (
          <article key={e.id} className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-bold">{TYPES[e.type] ?? e.type} — {e.titre}</p>
            <p className="whitespace-pre-wrap text-xs">{e.contenu}</p>
            <p className="text-[11px] opacity-70">{ETAT_BOITE[e.etat] ?? e.etat} · {date(e.creeLe)}</p>
            {e.etat === "en_attente" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => decider.mutate({ id: e.id, approuver: true })} className="rounded border px-2 py-1 text-xs font-bold">Approuver</button>
                <button type="button" onClick={() => decider.mutate({ id: e.id, approuver: false })} className="rounded border px-2 py-1 text-xs font-bold">Refuser</button>
              </div>
            )}
          </article>
        ))}
        <h4 className="text-sm font-bold">À destination de la Boutique</h4>
        {sortants.map((e) => (
          <article key={e.id} className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-bold">{TYPES[e.type] ?? e.type} — {e.titre}</p>
            <p className="whitespace-pre-wrap text-xs">{e.contenu}</p>
            <p className="text-[11px] opacity-70">{ETAT_BOITE[e.etat] ?? e.etat} · {date(e.creeLe)}</p>
            {e.etat === "en_attente" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => decider.mutate({ id: e.id, approuver: true })} className="rounded border px-2 py-1 text-xs font-bold">Approuver l'envoi</button>
                <button type="button" onClick={() => decider.mutate({ id: e.id, approuver: false })} className="rounded border px-2 py-1 text-xs font-bold">Refuser</button>
              </div>
            )}
          </article>
        ))}
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-bold">Préparer un élément pour la Boutique</p>
          <select value={nouveau.type} onChange={(e) => setNouveau({ ...nouveau, type: e.target.value as keyof typeof TYPES })} className="rounded-lg border px-3 py-2 text-sm">
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={nouveau.titre} onChange={(e) => setNouveau({ ...nouveau, titre: e.target.value })} maxLength={160} placeholder="Titre" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <textarea value={nouveau.contenu} onChange={(e) => setNouveau({ ...nouveau, contenu: e.target.value })} maxLength={4000} rows={4} placeholder="Contenu (sans clé, sans e-mail, sans téléphone)" className="w-full rounded-lg border px-3 py-2 text-sm" />
          <button type="button" disabled={creer.isPending || nouveau.titre.trim().length < 3 || nouveau.contenu.trim().length < 10} onClick={() => creer.mutate({ type: nouveau.type as "procedure" | "connaissance" | "erreur_solution", titre: nouveau.titre, contenu: nouveau.contenu, source: "" })} className="rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-40">
            Mettre en attente d'approbation
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Dernier état reçu de la Boutique</h3>
        {etat.data?.etatBoutique && contenuEtat ? (
          <p className="text-sm">
            Reçu le {date(etat.data.etatBoutique.recuLe)} (observé le {date(etat.data.etatBoutique.observeLe)}) : {contenuEtat.moteurs?.length ?? 0} moteur(s), {contenuEtat.alertes ?? 0} alerte(s).
          </p>
        ) : (
          <p className="text-xs">Aucun état reçu pour l'instant.</p>
        )}
      </section>

      <section className="rounded-xl border border-black/10 p-4 space-y-2">
        <h3 className="text-sm font-black">Journal (50 derniers passages — jamais de contenu)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left"><th>Date</th><th>Canal</th><th>Sens</th><th>Événement</th><th>Résultat</th><th>HTTP</th><th>Détail</th></tr>
            </thead>
            <tbody>
              {(journal.data ?? []).map((l) => (
                <tr key={l.id} className="border-t">
                  <td>{date(l.creeLe)}</td><td>{l.canal}</td><td>{l.sens}</td><td>{l.evenement}</td><td>{l.resultat}</td><td>{l.statutHttp ?? ""}</td><td>{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default CableBoutique;
