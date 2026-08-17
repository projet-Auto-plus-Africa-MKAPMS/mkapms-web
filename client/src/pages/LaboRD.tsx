/**
 * Points 79-80-81-82 — Laboratoire R&D automobile (écran PDG / Direction).
 *
 * L'écran est volontairement séparé des univers commerciaux : rien de ce qui
 * est affiché ici n'est publié, et il refuse trois illusions courantes —
 *  • une chaîne industrielle qui paraîtrait complète alors que des maillons
 *    n'ont jamais été renseignés : les manquants sont nommés ;
 *  • une connaissance sous licence ou fournisseur présentée comme partageable :
 *    le motif du refus est écrit ;
 *  • une navigation embarquée qui semblerait prête : les briques absentes
 *    (cartographie, trafic, itinéraires) sont listées telles quelles.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ChevronLeft,
  FlaskConical,
  Layers,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet = "projets" | "chaine" | "actifs" | "embarque";

/** Unions alignées sur les référentiels du serveur : aucune valeur libre envoyée. */
type ChainLink =
  | "besoin_client"
  | "marche"
  | "reglementation"
  | "architecture_vehicule"
  | "composants"
  | "fournisseurs"
  | "couts"
  | "performances"
  | "securite"
  | "fabrication"
  | "tests";
type DataClass = "publique" | "licence" | "mkapms" | "fournisseur" | "confidentielle";
type License = "publique" | "licence" | "propriete_mkapms" | "fournisseur" | "inconnue";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "projets", label: "Projets R&D" },
  { key: "chaine", label: "Chaîne industrielle" },
  { key: "actifs", label: "Connaissances & droits" },
  { key: "embarque", label: "Navigation & embarqué" },
];

const STATUTS: Record<string, { label: string; ton: string }> = {
  etude: { label: "Étude", ton: "bg-black/5 text-black/60" },
  en_cours: { label: "En cours", ton: "bg-emerald-50 text-emerald-700" },
  pause: { label: "En pause", ton: "bg-amber-50 text-amber-700" },
  archive: { label: "Archivé", ton: "bg-black/5 text-black/50" },
};

const CONFIDENTIALITES: Record<string, string> = {
  interne: "Interne",
  confidentiel: "Confidentiel",
  secret: "Secret",
};

const CLASSES: Record<string, string> = {
  publique: "bg-emerald-50 text-emerald-700",
  licence: "bg-blue-50 text-blue-700",
  mkapms: "bg-[#D4AF37]/15 text-[#8a6d1b]",
  fournisseur: "bg-amber-50 text-amber-700",
  confidentielle: "bg-red-50 text-red-700",
};

const MAILLON_TON: Record<string, string> = {
  renseigne: "bg-emerald-50 text-emerald-700",
  a_confirmer: "bg-amber-50 text-amber-700",
  manquant: "bg-black/5 text-black/50",
};

const MAILLON_LABEL: Record<string, string> = {
  renseigne: "Renseigné",
  a_confirmer: "À confirmer",
  manquant: "Manquant",
};

function dateCourte(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function LaboRD() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("projets");
  const [message, setMessage] = useState<string | null>(null);
  const [projetChoisi, setProjetChoisi] = useState<number | null>(null);
  const [pays, setPays] = useState("");

  const [nouveau, setNouveau] = useState({
    code: "",
    titre: "",
    branche: "",
    domaine: "",
    objectif: "",
  });
  const [actif, setActif] = useState<{
    titre: string;
    branche: string;
    domaine: string;
    classe: DataClass;
    licence: License;
    referenceLicence: string;
    source: string;
    fournisseur: string;
  }>({
    titre: "",
    branche: "",
    domaine: "",
    classe: "publique",
    licence: "publique",
    referenceLicence: "",
    source: "",
    fournisseur: "",
  });
  const [maillon, setMaillon] = useState<{ maillon: ChainLink | ""; contenu: string; appui: string }>({
    maillon: "",
    contenu: "",
    appui: "",
  });

  const referentiels = trpc.rdLab.referentiels.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const stats = trpc.rdLab.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const projets = trpc.rdLab.projets.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const actifs = trpc.rdLab.actifs.useQuery(undefined, {
    enabled: !!isDirection && onglet === "actifs",
    refetchOnWindowFocus: false,
  });
  const chaine = trpc.rdLab.chaine.useQuery(
    { projetId: projetChoisi ?? 0 },
    { enabled: !!isDirection && onglet === "chaine" && projetChoisi !== null, refetchOnWindowFocus: false },
  );
  const ecosysteme = trpc.rdLab.ecosysteme.useQuery(
    { pays: pays.toUpperCase() },
    { enabled: !!isDirection && onglet === "embarque" && pays.length === 2, refetchOnWindowFocus: false },
  );

  const creerProjet = trpc.rdLab.creerProjet.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      if (r.ok) setNouveau({ code: "", titre: "", branche: "", domaine: "", objectif: "" });
      projets.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const declarerActif = trpc.rdLab.declarerActif.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      actifs.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const verser = trpc.rdLab.verserAuGraphe.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      actifs.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const renseignerMaillon = trpc.rdLab.renseignerMaillon.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      setMaillon({ maillon: "", contenu: "", appui: "" });
      chaine.refetch();
      stats.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const relever = trpc.rdLab.releverEcosysteme.useMutation({
    onSuccess: (r) => {
      setMessage(r.detail);
      ecosysteme.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;
  const domainesDeLaBranche = (branche: string) =>
    (referentiels.data?.domaines ?? []).filter((d) => d.branch === branche);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <FlaskConical size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Laboratoire R&amp;D automobile</h1>
            <p className="text-xs text-white/50">
              Séparé des services vendus : la mémoire technique des futurs projets, jamais publiée.
            </p>
          </div>
          <button
            type="button"
            onClick={() => stats.refetch()}
            className="rounded-lg bg-white/10 p-2 text-white/70"
            aria-label="Recharger"
          >
            <RefreshCw size={16} className={stats.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setOnglet(o.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
              onglet === o.key ? "bg-[#111] text-white" : "bg-white text-black/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {message ? (
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3 text-xs text-black/70">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Carte
            titre="Projets"
            valeur={String(s?.projets.total ?? 0)}
            detail={`${s?.projets.enCours ?? 0} en cours`}
          />
          <Carte
            titre="Domaines couverts"
            valeur={String(s?.referentiels.domaines ?? 0)}
            detail={`${s?.referentiels.branches ?? 0} branches du laboratoire`}
          />
          <Carte
            titre="Maillons renseignés"
            valeur={`${s?.chaines.maillonsRenseignes ?? 0}/${s?.chaines.maillonsAttendus ?? 0}`}
            detail={`${s?.chaines.maillonsManquants ?? 0} jamais renseigné(s)`}
          />
          <Carte
            titre="Connaissances"
            valeur={String(s?.actifs.total ?? 0)}
            detail={`${s?.actifs.confidentiels ?? 0} non partageable(s), ${s?.actifs.verses ?? 0} versée(s) au graphe`}
          />
        </div>

        {/* ── Point 79 ─────────────────────────────────────────────── */}
        {onglet === "projets" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Le laboratoire n'écrit dans aucun service commercial et ne publie rien. Il
                  accumule ce qui servira aux futurs projets, même quand le service correspondant
                  n'existe pas encore.
                </span>
              </p>
            </div>

            {isPdg ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">Ouvrir un projet</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={nouveau.code}
                    onChange={(e) => setNouveau((v) => ({ ...v, code: e.target.value }))}
                    placeholder="Code (ex. VE-001)"
                    className="rounded-lg border border-black/10 p-2 text-xs"
                  />
                  <input
                    value={nouveau.titre}
                    onChange={(e) => setNouveau((v) => ({ ...v, titre: e.target.value }))}
                    placeholder="Titre"
                    className="rounded-lg border border-black/10 p-2 text-xs"
                  />
                  <select
                    value={nouveau.branche}
                    onChange={(e) =>
                      setNouveau((v) => ({ ...v, branche: e.target.value, domaine: "" }))
                    }
                    className="rounded-lg border border-black/10 p-2 text-xs"
                  >
                    <option value="">Branche…</option>
                    {(referentiels.data?.branches ?? []).map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={nouveau.domaine}
                    onChange={(e) => setNouveau((v) => ({ ...v, domaine: e.target.value }))}
                    disabled={!nouveau.branche}
                    className="rounded-lg border border-black/10 p-2 text-xs disabled:opacity-40"
                  >
                    <option value="">Domaine…</option>
                    {domainesDeLaBranche(nouveau.branche).map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={nouveau.objectif}
                  onChange={(e) => setNouveau((v) => ({ ...v, objectif: e.target.value }))}
                  rows={2}
                  placeholder="Objectif du projet"
                  className="mt-2 w-full rounded-lg border border-black/10 p-2 text-xs"
                />
                <button
                  type="button"
                  disabled={
                    nouveau.code.trim().length < 2 ||
                    nouveau.titre.trim().length < 3 ||
                    !nouveau.branche ||
                    !nouveau.domaine ||
                    nouveau.objectif.trim().length < 10 ||
                    creerProjet.isPending
                  }
                  onClick={() =>
                    creerProjet.mutate({
                      code: nouveau.code.trim(),
                      titre: nouveau.titre.trim(),
                      branche: nouveau.branche,
                      domaine: nouveau.domaine,
                      objectif: nouveau.objectif.trim(),
                    })
                  }
                  className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Ouvrir le projet
                </button>
              </div>
            ) : null}

            {(projets.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucun projet ouvert dans le laboratoire.</p>
            ) : (
              <div className="space-y-2">
                {(projets.data ?? []).map((p) => (
                  <div key={p.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm font-bold text-[#111]">
                        {p.code} — {p.title}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          STATUTS[p.status]?.ton ?? "bg-black/5 text-black/60"
                        }`}
                      >
                        {STATUTS[p.status]?.label ?? p.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-black/60">{p.objective}</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-black/40">
                      <Lock size={10} />
                      {CONFIDENTIALITES[p.confidentiality] ?? p.confidentiality} ·{" "}
                      {p.countryCode ?? "aucun pays rattaché"} · ouvert le {dateCourte(p.createdAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setProjetChoisi(p.id);
                        setOnglet("chaine");
                      }}
                      className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] underline underline-offset-2"
                    >
                      <Layers size={12} /> Voir sa chaîne industrielle
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Point 80 ─────────────────────────────────────────────── */}
        {onglet === "chaine" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Besoin client → marché → réglementation → architecture → composants →
                  fournisseurs → coûts → performances → sécurité → fabrication → tests. Un maillon
                  jamais renseigné est affiché <strong>manquant</strong> : le laboratoire n'annonce
                  pas un véhicule étudié de bout en bout tant qu'il ne l'est pas. Un maillon sans
                  élément d'appui reste « à confirmer ».
                </span>
              </p>
            </div>

            <select
              value={projetChoisi ?? ""}
              onChange={(e) => setProjetChoisi(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-black/10 bg-white p-2 text-sm"
            >
              <option value="">Choisir un projet…</option>
              {(projets.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>

            {projetChoisi === null ? (
              <p className="text-sm text-black/50">Sélectionnez un projet pour voir sa chaîne.</p>
            ) : (
              <>
                <div className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-xs font-bold text-[#111]">
                    {chaine.data?.renseignes ?? 0} maillon(s) réellement renseigné(s) sur{" "}
                    {(referentiels.data?.maillons ?? []).length}
                  </p>
                  {chaine.data && chaine.data.manquants.length > 0 ? (
                    <p className="mt-0.5 text-[11px] text-black/50">
                      Manquants : {chaine.data.manquants.join(", ").replace(/_/g, " ")}.
                    </p>
                  ) : chaine.data?.complete ? (
                    <p className="mt-0.5 text-[11px] text-emerald-700">
                      Chaîne complète : chaque maillon porte son élément d'appui.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {(chaine.data?.links ?? []).map((l) => (
                    <div key={l.link} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-xs font-bold text-[#111]">{l.label}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            MAILLON_TON[l.status] ?? "bg-black/5 text-black/60"
                          }`}
                        >
                          {MAILLON_LABEL[l.status] ?? l.status}
                        </span>
                      </div>
                      {l.content ? (
                        <p className="mt-1 text-[11px] text-black/60">{l.content}</p>
                      ) : (
                        <p className="mt-1 text-[11px] text-black/40">
                          Jamais renseigné — rien n'est supposé à sa place.
                        </p>
                      )}
                      {l.evidence ? (
                        <p className="mt-1 text-[10px] text-black/40">Appui : {l.evidence}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-xs font-bold text-[#111]">Renseigner un maillon</p>
                  <select
                    value={maillon.maillon}
                    onChange={(e) =>
                      setMaillon((v) => ({ ...v, maillon: e.target.value as ChainLink | "" }))
                    }
                    className="mt-2 w-full rounded-lg border border-black/10 p-2 text-xs"
                  >
                    <option value="">Maillon…</option>
                    {(referentiels.data?.maillons ?? []).map((m) => (
                      <option key={m.code} value={m.code}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={maillon.contenu}
                    onChange={(e) => setMaillon((v) => ({ ...v, contenu: e.target.value }))}
                    rows={2}
                    placeholder="Ce qui est établi pour ce maillon"
                    className="mt-2 w-full rounded-lg border border-black/10 p-2 text-xs"
                  />
                  <input
                    value={maillon.appui}
                    onChange={(e) => setMaillon((v) => ({ ...v, appui: e.target.value }))}
                    placeholder="Élément d'appui : norme, mesure, devis, source"
                    className="mt-2 w-full rounded-lg border border-black/10 p-2 text-xs"
                  />
                  <button
                    type="button"
                    disabled={
                      !maillon.maillon ||
                      maillon.contenu.trim().length < 5 ||
                      renseignerMaillon.isPending
                    }
                    onClick={() => {
                      if (!maillon.maillon) return;
                      renseignerMaillon.mutate({
                        projetId: projetChoisi,
                        maillon: maillon.maillon,
                        contenu: maillon.contenu.trim(),
                        appui: maillon.appui.trim() || undefined,
                      });
                    }}
                    className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Enregistrer le maillon
                  </button>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ── Point 82 ─────────────────────────────────────────────── */}
        {onglet === "actifs" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Ce que chaque classe autorise</p>
              <div className="mt-2 space-y-1">
                {(referentiels.data?.classesDonnees ?? []).map((c) => (
                  <div key={c.code} className="rounded-lg bg-black/[0.02] p-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        CLASSES[c.code] ?? "bg-black/5 text-black/60"
                      }`}
                    >
                      {c.label}
                    </span>
                    <p className="mt-1 text-[11px] text-black/60">{c.regime}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="text-xs font-bold text-[#111]">Déclarer une connaissance</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  value={actif.titre}
                  onChange={(e) => setActif((v) => ({ ...v, titre: e.target.value }))}
                  placeholder="Titre"
                  className="col-span-2 rounded-lg border border-black/10 p-2 text-xs"
                />
                <select
                  value={actif.branche}
                  onChange={(e) => setActif((v) => ({ ...v, branche: e.target.value, domaine: "" }))}
                  className="rounded-lg border border-black/10 p-2 text-xs"
                >
                  <option value="">Branche…</option>
                  {(referentiels.data?.branches ?? []).map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <select
                  value={actif.domaine}
                  onChange={(e) => setActif((v) => ({ ...v, domaine: e.target.value }))}
                  disabled={!actif.branche}
                  className="rounded-lg border border-black/10 p-2 text-xs disabled:opacity-40"
                >
                  <option value="">Domaine…</option>
                  {domainesDeLaBranche(actif.branche).map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <select
                  value={actif.classe}
                  onChange={(e) =>
                    setActif((v) => ({ ...v, classe: e.target.value as DataClass }))
                  }
                  className="rounded-lg border border-black/10 p-2 text-xs"
                >
                  {(referentiels.data?.classesDonnees ?? []).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <select
                  value={actif.licence}
                  onChange={(e) =>
                    setActif((v) => ({ ...v, licence: e.target.value as License }))
                  }
                  className="rounded-lg border border-black/10 p-2 text-xs"
                >
                  <option value="publique">Licence : publique</option>
                  <option value="licence">Licence : sous contrat</option>
                  <option value="propriete_mkapms">Licence : propriété MKA.P-MS</option>
                  <option value="fournisseur">Licence : fournisseur</option>
                  <option value="inconnue">Licence : inconnue</option>
                </select>
                <input
                  value={actif.referenceLicence}
                  onChange={(e) => setActif((v) => ({ ...v, referenceLicence: e.target.value }))}
                  placeholder="Référence du contrat / licence"
                  className="rounded-lg border border-black/10 p-2 text-xs"
                />
                <input
                  value={actif.source}
                  onChange={(e) => setActif((v) => ({ ...v, source: e.target.value }))}
                  placeholder="Source"
                  className="rounded-lg border border-black/10 p-2 text-xs"
                />
                <input
                  value={actif.fournisseur}
                  onChange={(e) => setActif((v) => ({ ...v, fournisseur: e.target.value }))}
                  placeholder="Fournisseur (si donnée fournisseur)"
                  className="col-span-2 rounded-lg border border-black/10 p-2 text-xs"
                />
              </div>
              <button
                type="button"
                disabled={
                  actif.titre.trim().length < 3 ||
                  !actif.branche ||
                  !actif.domaine ||
                  declarerActif.isPending
                }
                onClick={() =>
                  declarerActif.mutate({
                    titre: actif.titre.trim(),
                    branche: actif.branche,
                    domaine: actif.domaine,
                    classe: actif.classe,
                    licence: actif.licence,
                    referenceLicence: actif.referenceLicence.trim() || undefined,
                    source: actif.source.trim() || undefined,
                    fournisseur: actif.fournisseur.trim() || undefined,
                  })
                }
                className="mt-2 w-full rounded-lg bg-[#111] py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                Déclarer
              </button>
            </div>

            {(actifs.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">Aucune connaissance déclarée au laboratoire.</p>
            ) : (
              <div className="space-y-2">
                {(actifs.data ?? []).map((a) => (
                  <div key={a.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm font-bold text-[#111]">{a.title}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          CLASSES[a.dataClass] ?? "bg-black/5 text-black/60"
                        }`}
                      >
                        {a.dataClass}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-black/40">
                      {a.domain.replace(/_/g, " ")} · licence {a.license.replace(/_/g, " ")}
                      {a.licenseRef ? ` (${a.licenseRef})` : ""}
                      {a.supplier ? ` · fournisseur ${a.supplier}` : ""}
                    </p>
                    {a.blockedReason ? (
                      <p className="mt-1 text-[11px] font-bold text-red-700">{a.blockedReason}</p>
                    ) : null}
                    {a.nodeId ? (
                      <p className="mt-1 text-[11px] text-emerald-700">
                        Versée au graphe partagé (nœud #{a.nodeId}) — lisible par les autres
                        moteurs, non publiée.
                      </p>
                    ) : isPdg && a.shareable ? (
                      <button
                        type="button"
                        disabled={verser.isPending}
                        onClick={() => verser.mutate({ id: a.id })}
                        className="mt-2 w-full rounded-lg bg-black/5 py-1.5 text-xs font-bold text-black/70 disabled:opacity-40"
                      >
                        Verser au graphe partagé
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* ── Point 81 ─────────────────────────────────────────────── */}
        {onglet === "embarque" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <MapPin size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Si MKA.P-MS construit un jour son propre système embarqué, la plateforme peut déjà
                  fournir une partie de son écosystème de services. Les chiffres ci-dessous sont des
                  comptages réels ; les briques absentes sont nommées, pas masquées.
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={pays}
                onChange={(e) => setPays(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="Code pays (2 lettres)"
                className="flex-1 rounded-lg border border-black/10 bg-white p-2 text-sm"
              />
              {isPdg ? (
                <button
                  type="button"
                  disabled={pays.length !== 2 || relever.isPending}
                  onClick={() => relever.mutate({ pays })}
                  className="rounded-lg bg-[#111] px-3 text-xs font-bold text-white disabled:opacity-40"
                >
                  Archiver le relevé
                </button>
              ) : null}
            </div>

            {pays.length !== 2 ? (
              <p className="text-sm text-black/50">
                Indiquez un pays activé. Aucun pays n'est choisi par défaut.
              </p>
            ) : ecosysteme.data ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-xs font-bold text-[#111]">
                  Écosystème disponible — {ecosysteme.data.countryCode}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {Object.entries(ecosysteme.data.counts).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-black/[0.02] p-2">
                      <p className="text-[10px] uppercase tracking-wide text-black/40">
                        {k.replace(/_/g, " ")}
                      </p>
                      <p className="text-base font-black text-[#111]">{v}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-black/60">{ecosysteme.data.detail}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {ecosysteme.data.missing.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700"
                    >
                      {m.replace(/_/g, " ")} — absent
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="text-[11px] text-black/40">
              Une carte, un trafic ou un calcul d'itinéraire exigent une licence cartographique.
              Aucune n'est enregistrée : rien n'est présenté comme disponible.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
