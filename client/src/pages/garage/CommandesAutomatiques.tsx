/**
 * Réapprovisionnement de l'atelier — piloté par le Moteur d'Atelier
 * (`atelierEngine.reappro*`, `propositions`, `commandesFournisseur`).
 *
 * Chaîne réelle : seuil de stock → proposition persistante ouverte par le
 * moteur → décision humaine (validation ou refus motivé) → commande
 * fournisseur sous plafond mensuel → réception qui entre les pièces en stock.
 * Rien ici n'est déclaré : chaque état vient du serveur, chaque bouton passe
 * par le Moteur de boutons.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Bell, AlertTriangle, Settings, PackageCheck, Truck } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

function euros(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
}

const LIBELLE_PROPOSITION: Record<string, string> = {
  proposee: "À décider",
  validee: "Validée — à commander",
  refusee: "Refusée",
  commandee: "Commandée",
  receptionnee: "Réceptionnée",
};

const LIBELLE_COMMANDE: Record<string, string> = {
  a_transmettre: "À transmettre au fournisseur",
  envoyee: "Envoyée par email",
  receptionnee: "Réceptionnée",
  annulee: "Annulée",
};

export default function CommandesAutomatiques() {
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [reglagesOuverts, setReglagesOuverts] = useState(false);
  const [plafond, setPlafond] = useState("");
  const [propositionAuto, setPropositionAuto] = useState(true);
  const [fournisseurNom, setFournisseurNom] = useState("");
  const [fournisseurEmail, setFournisseurEmail] = useState("");
  const [fournisseurTelephone, setFournisseurTelephone] = useState("");
  const [prixSaisis, setPrixSaisis] = useState<Record<number, string>>({});
  const [motifs, setMotifs] = useState<Record<number, string>>({});
  const [selection, setSelection] = useState<Set<number>>(new Set());

  const reglages = trpc.atelierEngine.reapproReglages.useQuery(undefined, { retry: false });
  const reglagesServeur = reglages.data?.reglages;
  useEffect(() => {
    if (!reglagesServeur) return;
    setPlafond(String(reglagesServeur.plafondMensuelCents / 100));
    setPropositionAuto(reglagesServeur.propositionAuto);
    setFournisseurNom(reglagesServeur.fournisseurNom ?? "");
    setFournisseurEmail(reglagesServeur.fournisseurEmail ?? "");
    setFournisseurTelephone(reglagesServeur.fournisseurTelephone ?? "");
  }, [reglagesServeur]);
  const propositions = trpc.atelierEngine.propositions.useQuery(undefined, { retry: false });
  const commandes = trpc.atelierEngine.commandesFournisseur.useQuery(undefined, { retry: false });

  const rafraichir = () => {
    reglages.refetch();
    propositions.refetch();
    commandes.refetch();
  };
  const ok = (m: string) => {
    setErreur("");
    setMessage(m);
    rafraichir();
  };
  const ko = (e: { message: string }) => {
    setMessage("");
    setErreur(e.message);
  };

  const enregistrerReglages = trpc.atelierEngine.enregistrerReapproReglages.useMutation({
    onSuccess: () => {
      setReglagesOuverts(false);
      ok("Réglages enregistrés : plafond, fournisseur et proposition automatique sont ceux du serveur.");
    },
    onError: ko,
  });
  const proposerToutes = trpc.atelierEngine.proposerToutesRuptures.useMutation({
    onSuccess: (r) => ok(`${r.ouvertes} nouvelle(s) proposition(s) ouverte(s), ${r.dejaOuvertes} déjà en attente.`),
    onError: ko,
  });
  const decider = trpc.atelierEngine.deciderProposition.useMutation({
    onSuccess: (p) => ok(`Proposition #${p.id} ${p.statut === "validee" ? "validée" : "refusée"} — décision tracée à votre nom.`),
    onError: ko,
  });
  const commander = trpc.atelierEngine.commanderFournisseur.useMutation({
    onSuccess: (c) => {
      setSelection(new Set());
      ok(
        c.statut === "envoyee"
          ? `Commande ${c.numero} envoyée au fournisseur par email (${euros(c.totalCents)}).`
          : `Commande ${c.numero} enregistrée (${euros(c.totalCents)}) mais NON transmise : le fournisseur n'a pas d'email ou l'envoi n'est pas configuré. À transmettre par vos moyens.`,
      );
    },
    onError: ko,
  });
  const receptionner = trpc.atelierEngine.receptionnerCommande.useMutation({
    onSuccess: (r) => ok(`Commande ${r.numero} réceptionnée : ${r.piecesEntrees} pièce(s) entrée(s) en stock.`),
    onError: ko,
  });
  const annuler = trpc.atelierEngine.annulerCommande.useMutation({
    onSuccess: (c) => ok(`Commande ${c.numero} annulée ; ses propositions redeviennent à commander.`),
    onError: ko,
  });

  const aDecider = useMemo(() => (propositions.data ?? []).filter((p) => p.statut === "proposee"), [propositions.data]);
  const aCommander = useMemo(() => (propositions.data ?? []).filter((p) => p.statut === "validee"), [propositions.data]);
  const totalSelection = useMemo(
    () => aCommander.filter((p) => selection.has(p.id)).reduce((s, p) => s + (p.prixUnitaireCents ?? 0) * p.quantiteProposee, 0),
    [aCommander, selection],
  );
  const commandesOuvertes = (commandes.data ?? []).filter((c) => c.statut === "a_transmettre" || c.statut === "envoyee");
  const commandesCloses = (commandes.data ?? []).filter((c) => c.statut === "receptionnee" || c.statut === "annulee");

  const r = reglages.data;
  const plafondCents = r?.reglages?.plafondMensuelCents ?? 0;
  const engageCents = r?.engageCents ?? 0;

  const toggle = (id: number) => {
    const s = new Set(selection);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelection(s);
  };

  const soumettreReglages = () => {
    const eur = Number(plafond.replace(",", "."));
    if (!Number.isFinite(eur) || eur < 0) {
      ko({ message: "Le plafond mensuel doit être un montant en euros (0 pour bloquer toute commande)." });
      return;
    }
    enregistrerReglages.mutate({
      plafondMensuelCents: Math.round(eur * 100),
      propositionAuto,
      fournisseurNom: fournisseurNom.trim() || undefined,
      fournisseurEmail: fournisseurEmail.trim() || undefined,
      fournisseurTelephone: fournisseurTelephone.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Bell size={20} className="text-[#D4AF37]" /> Réapprovisionnement
        </h1>
        <p className="text-[11px] text-white/60 mt-1">
          Le moteur propose dès qu'une référence passe sous son seuil ; vous décidez, vous commandez sous votre plafond, le stock entre à la réception.
        </p>
      </div>

      {(reglages.isError || propositions.isError || commandes.isError) && (
        <p className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
          Moteur d'Atelier indisponible : {reglages.error?.message ?? propositions.error?.message ?? commandes.error?.message}
        </p>
      )}

      {r && r.garageId == null && !reglages.isError && (
        <p className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3 text-[11px] text-[#6B7280]">
          Aucun garage n'est rattaché à votre compte professionnel : le réapprovisionnement ne peut s'appliquer à rien.
        </p>
      )}

      {/* Plafond & réglages */}
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#111] flex items-center gap-2">
            <Settings size={14} className="text-[#D4AF37]" /> Plafond & fournisseur
          </p>
          <BoutonMoteur
            code="garage_reappro_auto"
            className="text-[11px] font-bold text-[#D4AF37]"
            onExecuter={() => setReglagesOuverts((v) => !v)}
          >
            {reglagesOuverts ? "Fermer" : "Régler"}
          </BoutonMoteur>
        </div>
        {r?.reglages ? (
          <p className="mt-1 text-[11px] text-[#6B7280]">
            Engagé ce mois : <b className="text-[#111]">{euros(engageCents)}</b> / plafond {euros(plafondCents)} —{" "}
            proposition automatique {r.reglages.propositionAuto ? "active" : "désactivée"} — fournisseur{" "}
            {r.reglages.fournisseurNom ?? "non renseigné"}
            {r.reglages.fournisseurEmail ? ` (${r.reglages.fournisseurEmail})` : " (sans email : les bons ne partiront pas seuls)"}
          </p>
        ) : (
          <p className="mt-1 text-[11px] text-amber-700 flex items-center gap-1">
            <AlertTriangle size={12} /> Aucun plafond fixé : aucune commande fournisseur ne peut partir tant que la direction du garage n'a pas fixé son engagement mensuel.
          </p>
        )}
        {reglagesOuverts && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              inputMode="decimal"
              value={plafond}
              onChange={(e) => setPlafond(e.target.value)}
              placeholder="Plafond mensuel (€)"
              className="w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <input
              type="text"
              value={fournisseurNom}
              onChange={(e) => setFournisseurNom(e.target.value)}
              placeholder="Fournisseur habituel"
              className="w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                value={fournisseurEmail}
                onChange={(e) => setFournisseurEmail(e.target.value)}
                placeholder="Email fournisseur"
                className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
              />
              <input
                type="tel"
                value={fournisseurTelephone}
                onChange={(e) => setFournisseurTelephone(e.target.value)}
                placeholder="Téléphone fournisseur"
                className="rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
              />
            </div>
            <label className="flex items-center gap-2 text-[11px] text-[#374151]">
              <input type="checkbox" checked={propositionAuto} onChange={(e) => setPropositionAuto(e.target.checked)} />
              Ouvrir automatiquement une proposition quand une référence passe sous son seuil
            </label>
            <BoutonMoteur
              code="garage_reappro_auto"
              className="block w-full rounded-lg bg-[#D4AF37] py-2 text-[11px] font-bold text-white text-center"
              onExecuter={soumettreReglages}
            >
              {enregistrerReglages.isPending ? "Enregistrement…" : "Enregistrer les réglages"}
            </BoutonMoteur>
          </div>
        )}
      </div>

      {message && (
        <p className="mx-4 mt-2 rounded-lg bg-white border border-[#E5E7EB] p-2 text-[11px] text-[#374151]">{message}</p>
      )}
      {erreur && (
        <p className="mx-4 mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-[11px] text-red-700">{erreur}</p>
      )}

      {/* Propositions à décider */}
      <div className="mx-4 mt-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#111]">Propositions à décider ({aDecider.length})</h2>
        <div className="flex gap-3">
          <BoutonMoteur
            code="garage_reappro_proposer_ruptures"
            className="text-[11px] font-bold text-[#D4AF37]"
            onExecuter={() => proposerToutes.mutate()}
          >
            {proposerToutes.isPending ? "Analyse…" : "Proposer toutes les ruptures"}
          </BoutonMoteur>
          <BoutonMoteur code="garage_reappro_voir_stock" className="text-[11px] font-bold text-[#6B7280]">
            Voir le stock
          </BoutonMoteur>
        </div>
      </div>
      <div className="px-4 mt-2 space-y-2">
        {propositions.isLoading && <p className="text-[11px] text-[#6B7280]">Chargement…</p>}
        {!propositions.isLoading && aDecider.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-[11px] text-[#6B7280]">
            Aucune proposition en attente : aucune référence n'est sous son seuil, ou tout est déjà décidé.
          </p>
        )}
        {aDecider.map((p) => (
          <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111]">{p.designation}</h3>
                <p className="text-[10px] text-[#6B7280]">
                  Réf. {p.reference} — {p.quantiteConstatee} en stock pour un seuil de {p.seuil} — origine {p.origine === "seuil_auto" ? "moteur (seuil)" : "manuelle"}
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#D4AF37]">{LIBELLE_PROPOSITION[p.statut] ?? p.statut}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#374151]">
              Proposé : <b>{p.quantiteProposee}</b> × {p.prixUnitaireCents != null ? euros(p.prixUnitaireCents) : <span className="text-amber-700">prix d'achat inconnu</span>}
            </p>
            {p.prixUnitaireCents == null && (
              <input
                type="text"
                inputMode="decimal"
                value={prixSaisis[p.id] ?? ""}
                onChange={(e) => setPrixSaisis({ ...prixSaisis, [p.id]: e.target.value })}
                placeholder="Prix d'achat unitaire (€) — obligatoire pour valider"
                className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
              />
            )}
            <input
              type="text"
              value={motifs[p.id] ?? ""}
              onChange={(e) => setMotifs({ ...motifs, [p.id]: e.target.value })}
              placeholder="Motif (obligatoire pour refuser)"
              className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <div className="mt-2 flex gap-2">
              <BoutonMoteur
                code="garage_reappro_valider"
                className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-xs font-bold text-white text-center"
                onExecuter={() => {
                  const saisi = prixSaisis[p.id];
                  const prix = saisi ? Math.round(Number(saisi.replace(",", ".")) * 100) : undefined;
                  if (p.prixUnitaireCents == null && (!prix || !Number.isFinite(prix) || prix <= 0)) {
                    ko({ message: "Renseignez le prix d'achat unitaire : sans prix, la commande sera refusée par le moteur." });
                    return;
                  }
                  decider.mutate({ propositionId: p.id, decision: "valider", prixUnitaireCents: prix, motif: motifs[p.id] || undefined });
                }}
              >
                Valider
              </BoutonMoteur>
              <BoutonMoteur
                code="garage_reappro_refuser"
                className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111] text-center"
                onExecuter={() => decider.mutate({ propositionId: p.id, decision: "refuser", motif: motifs[p.id] || undefined })}
              >
                Refuser
              </BoutonMoteur>
            </div>
          </div>
        ))}
      </div>

      {/* Validées → commande */}
      <h2 className="mx-4 mt-5 text-sm font-bold text-[#111]">Validées, à commander ({aCommander.length})</h2>
      <div className="px-4 mt-2 space-y-2">
        {aCommander.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-[11px] text-[#6B7280]">Aucune proposition validée en attente de commande.</p>
        )}
        {aCommander.map((p) => (
          <label key={p.id} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
            <input type="checkbox" checked={selection.has(p.id)} onChange={() => toggle(p.id)} />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#111]">{p.designation}</p>
              <p className="text-[10px] text-[#6B7280]">
                Réf. {p.reference} — {p.quantiteProposee} × {euros(p.prixUnitaireCents)} = {euros((p.prixUnitaireCents ?? 0) * p.quantiteProposee)}
              </p>
            </div>
          </label>
        ))}
        {aCommander.length > 0 && (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
            <p className="text-[11px] text-[#374151]">
              Sélection : <b>{euros(totalSelection)}</b> — après commande : {euros(engageCents + totalSelection)} / {euros(plafondCents)}
              {plafondCents > 0 && engageCents + totalSelection > plafondCents && (
                <span className="text-red-700"> — dépasse le plafond, le moteur refusera.</span>
              )}
            </p>
            <BoutonMoteur
              code="garage_reappro_commander"
              className="mt-2 block w-full rounded-lg bg-[#111] py-2 text-[11px] font-bold text-white text-center"
              onExecuter={() => {
                if (selection.size === 0) {
                  ko({ message: "Cochez au moins une proposition validée." });
                  return;
                }
                commander.mutate({ propositionIds: [...selection] });
              }}
            >
              <span className="inline-flex items-center gap-1">
                <Truck size={12} /> {commander.isPending ? "Commande…" : "Passer la commande fournisseur"}
              </span>
            </BoutonMoteur>
          </div>
        )}
      </div>

      {/* Commandes en cours */}
      <h2 className="mx-4 mt-5 text-sm font-bold text-[#111]">Commandes en cours ({commandesOuvertes.length})</h2>
      <div className="px-4 mt-2 space-y-2">
        {commandesOuvertes.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-[11px] text-[#6B7280]">Aucune commande fournisseur en cours.</p>
        )}
        {commandesOuvertes.map((c) => (
          <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#111]">{c.numero}</h3>
                <p className="text-[10px] text-[#6B7280]">
                  {c.fournisseurNom} — {c.lignes.length} ligne(s) — {euros(c.totalCents)} — {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <span className={`text-[10px] font-bold ${c.statut === "a_transmettre" ? "text-amber-700" : "text-emerald-700"}`}>
                {LIBELLE_COMMANDE[c.statut] ?? c.statut}
              </span>
            </div>
            <ul className="mt-2 space-y-0.5">
              {c.lignes.map((l) => (
                <li key={l.propositionId} className="text-[10px] text-[#374151]">
                  {l.quantite} × {l.reference} — {l.designation} ({euros(l.prixUnitaireCents)})
                </li>
              ))}
            </ul>
            <input
              type="text"
              value={motifs[-c.id] ?? ""}
              onChange={(e) => setMotifs({ ...motifs, [-c.id]: e.target.value })}
              placeholder="Motif d'annulation (obligatoire pour annuler)"
              className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-2 py-2 text-[11px]"
            />
            <div className="mt-2 flex gap-2">
              <BoutonMoteur
                code="garage_reappro_receptionner"
                className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-xs font-bold text-white text-center"
                onExecuter={() => receptionner.mutate({ commandeId: c.id })}
              >
                <span className="inline-flex items-center gap-1">
                  <PackageCheck size={12} /> Réceptionner (tout entre en stock)
                </span>
              </BoutonMoteur>
              <BoutonMoteur
                code="garage_reappro_annuler"
                className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111] text-center"
                onExecuter={() => {
                  const motif = (motifs[-c.id] ?? "").trim();
                  if (motif.length < 3) {
                    ko({ message: "Un motif d'au moins 3 caractères est exigé pour annuler une commande." });
                    return;
                  }
                  annuler.mutate({ commandeId: c.id, motif });
                }}
              >
                Annuler
              </BoutonMoteur>
            </div>
          </div>
        ))}
      </div>

      {commandesCloses.length > 0 && (
        <>
          <h2 className="mx-4 mt-5 text-sm font-bold text-[#111]">Historique ({commandesCloses.length})</h2>
          <div className="px-4 mt-2 space-y-1">
            {commandesCloses.map((c) => (
              <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center justify-between">
                <p className="text-[11px] text-[#374151]">
                  <b>{c.numero}</b> — {c.fournisseurNom} — {euros(c.totalCents)}
                  {c.motifAnnulation ? ` — ${c.motifAnnulation}` : ""}
                </p>
                <span className="text-[10px] font-bold text-[#6B7280]">{LIBELLE_COMMANDE[c.statut] ?? c.statut}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
