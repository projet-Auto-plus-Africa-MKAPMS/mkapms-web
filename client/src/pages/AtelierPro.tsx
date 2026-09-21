import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Wrench, Calendar, Package, FileText, Users, Car, Search, Eye,
  ChevronLeft, ClipboardList, ShoppingBag, AlertTriangle, ArrowDown, ArrowUp,
  Phone, Mail, ExternalLink, Loader2,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { BoutonMoteur } from "../lib/boutonMoteur";

/**
 * Atelier Pro — hub de l'atelier d'un garage.
 *
 * Tout ce qui est affiché vient du moteur (`garages.atelierSynthese`,
 * `atelierEngine.stock`) : interventions réelles, clients et véhicules
 * déduits des rendez-vous, stock réel. Les compteurs d'onglets sont
 * calculés, jamais écrits en dur. Chaque bouton passe par le Moteur de
 * boutons : ce qui n'existe pas encore côté serveur est affiché comme tel,
 * pas simulé.
 */

type AtelierTab =
  | "suivi" | "planning" | "ordres" | "employes" | "stock" | "devis"
  | "factures" | "clients" | "vehicules" | "catalogue" | "pieces";

const TABS_ATELIER: { id: AtelierTab; label: string; icon: typeof Wrench }[] = [
  { id: "suivi", label: "Suivi", icon: Eye },
  { id: "planning", label: "Planning", icon: Calendar },
  { id: "ordres", label: "Ordres", icon: ClipboardList },
  { id: "employes", label: "Employes", icon: Users },
  { id: "stock", label: "Stock", icon: Package },
  { id: "devis", label: "Devis", icon: FileText },
  { id: "factures", label: "Factures", icon: FileText },
  { id: "clients", label: "Clients", icon: Users },
  { id: "vehicules", label: "Vehicules", icon: Car },
  { id: "catalogue", label: "Catalogue", icon: Search },
  { id: "pieces", label: "Pieces", icon: ShoppingBag },
];

const COULEUR_ETAPE: Record<string, string> = {
  en_attente: "bg-slate-400",
  confirme: "bg-blue-400",
  planifiee: "bg-blue-500",
  accueil: "bg-cyan-500",
  diagnostic: "bg-orange-500",
  devis_envoye: "bg-purple-500",
  en_reparation: "bg-amber-500",
  controle_qualite: "bg-indigo-500",
  pret: "bg-green-500",
  termine: "bg-slate-600",
  honore: "bg-slate-600",
  annulee: "bg-red-500",
  annule_client: "bg-red-400",
  annule_garage: "bg-red-400",
  no_show: "bg-red-300",
};

const ETAPES_EN_COURS = ["accueil", "diagnostic", "devis_envoye", "en_reparation", "controle_qualite"];
const ETAPES_ACTIVES = ["en_attente", "confirme", "planifiee", ...ETAPES_EN_COURS, "pret"];

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const fmtJour = (d: Date | string) =>
  new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

const btnPrimaire = "flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[10px] font-bold text-white text-center";
const btnSecond = "flex-1 rounded-lg bg-[#F5F3EF] py-1.5 text-[10px] font-bold text-slate-600 text-center";
const btnBleu = "flex-1 rounded-lg bg-blue-500 py-1.5 text-[10px] font-bold text-white text-center";

function Vide({ texte }: { texte: string }) {
  return <div className="rounded-xl bg-white p-6 text-center text-xs text-[#6B7280] border border-[#E5E7EB]">{texte}</div>;
}

function NonBranchee({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 border border-[#E5E7EB] space-y-3">
      <p className="text-sm font-bold text-[#111]">{titre}</p>
      {children}
    </div>
  );
}

export default function AtelierPro() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AtelierTab>("suivi");
  const [suiviFilter, setSuiviFilter] = useState<string>("actives");
  const [selection, setSelection] = useState<number | null>(null);
  const [clientQ, setClientQ] = useState("");
  const [vehQ, setVehQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const utils = trpc.useUtils();
  const synthese = trpc.garages.atelierSynthese.useQuery(undefined, { enabled: !!user, staleTime: 30_000 });
  const stock = trpc.atelierEngine.stock.useQuery(undefined, { enabled: !!user, staleTime: 30_000 });

  const changerEtape = trpc.garages.updateIntervention.useMutation({
    onSuccess: (_r, v) => {
      void utils.garages.atelierSynthese.invalidate();
      const lib = synthese.data?.etapes.find((e) => e.code === v.status)?.libelle ?? v.status;
      showToast(`Intervention #${v.rdvId} → ${lib}. Client notifié.`);
    },
    onError: (e) => showToast(e.message),
  });
  const mouvement = trpc.atelierEngine.enregistrerStock.useMutation({
    onSuccess: (_r, v) => {
      void utils.atelierEngine.stock.invalidate();
      void utils.garages.atelierSynthese.invalidate();
      showToast(`${v.designation} — stock : ${v.quantite}`);
    },
    onError: (e) => showToast(e.message),
  });

  const interventions = synthese.data?.interventions ?? [];
  const compteurs = synthese.data?.compteurs ?? {};
  const etapes = synthese.data?.etapes ?? [];
  const alertes = stock.data?.alertes ?? synthese.data?.alertesStock ?? [];

  const nb = (codes: string[]) => codes.reduce((s, c) => s + (compteurs[c] ?? 0), 0);
  const compteursOnglets: Partial<Record<AtelierTab, number>> = {
    suivi: nb(ETAPES_ACTIVES),
    planning: interventions.filter((i) => ["en_attente", "confirme", "planifiee"].includes(i.status) && new Date(i.dateHeure) >= new Date()).length,
    stock: stock.data?.lignes.length,
    clients: synthese.data?.clients.length,
    vehicules: synthese.data?.vehicules.length,
  };

  const interventionsFiltrees = useMemo(() => {
    if (suiviFilter === "tous") return interventions;
    if (suiviFilter === "actives") return interventions.filter((i) => ETAPES_ACTIVES.includes(i.status));
    if (suiviFilter === "en_cours") return interventions.filter((i) => ETAPES_EN_COURS.includes(i.status));
    return interventions.filter((i) => i.status === suiviFilter);
  }, [interventions, suiviFilter]);

  const planningParJour = useMemo(() => {
    const aVenir = interventions
      .filter((i) => ["en_attente", "confirme", "planifiee"].includes(i.status))
      .sort((a, b) => new Date(a.dateHeure).getTime() - new Date(b.dateHeure).getTime());
    const map = new Map<string, typeof aVenir>();
    for (const i of aVenir) {
      const k = new Date(i.dateHeure).toDateString();
      map.set(k, [...(map.get(k) ?? []), i]);
    }
    return [...map.entries()];
  }, [interventions]);

  const clientsFiltres = (synthese.data?.clients ?? []).filter((c) => {
    if (!clientQ) return true;
    const s = clientQ.toLowerCase();
    return c.nom.toLowerCase().includes(s) || (c.email ?? "").toLowerCase().includes(s) || (c.phone ?? "").includes(s);
  });
  const vehiculesFiltres = (synthese.data?.vehicules ?? []).filter((v) => {
    if (!vehQ) return true;
    const s = vehQ.toLowerCase();
    return `${v.marque} ${v.modele} ${v.titre}`.toLowerCase().includes(s);
  });

  const libelleEtape = (code: string) => etapes.find((e) => e.code === code)?.libelle ?? code;
  const chargement = synthese.isLoading || stock.isLoading;
  const sansGarage = !!synthese.data && synthese.data.garages.length === 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-6 text-center">
        <p className="text-sm text-[#6B7280]">Connectez-vous avec un compte professionnel pour ouvrir l'atelier.</p>
        <Link to="/connexion" className="mt-3 inline-block rounded-lg bg-[#111] px-4 py-2 text-xs font-bold text-[#D4AF37]">Connexion</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage-plus" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Atelier Pro</h1>
        <p className="mt-0.5 text-sm text-white/60">
          {synthese.data?.garages.map((g) => g.name).join(" · ") || "Suivi temps réel, planning, stock, catalogue"}
        </p>

        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {[
            { label: "A venir", val: nb(["en_attente", "confirme", "planifiee"]), color: "text-blue-400", filter: "planifies" },
            { label: "En cours", val: nb(ETAPES_EN_COURS), color: "text-orange-400", filter: "en_cours" },
            { label: "Prets", val: nb(["pret"]), color: "text-green-400", filter: "pret" },
            { label: "Termines", val: nb(["termine", "honore"]), color: "text-slate-400", filter: "termine" },
            { label: "Alertes", val: alertes.length, color: "text-red-400", filter: "stock_alert" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => {
                if (s.filter === "stock_alert") setTab("stock");
                else { setTab("suivi"); setSuiviFilter(s.filter === "planifies" ? "actives" : s.filter); }
              }}
              className="rounded-lg bg-white/5 p-2 text-center hover:bg-white/10 transition cursor-pointer"
            >
              <p className={`text-lg font-black ${s.color}`}>{chargement ? "…" : s.val}</p>
              <p className="text-[8px] text-white/50">{s.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TABS_ATELIER.map((t) => {
          const Icon = t.icon;
          const c = compteursOnglets[t.id];
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSelection(null); }} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold transition ${tab === t.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
              <Icon size={11} /> {t.label}
              {typeof c === "number" && c > 0 && <span className="ml-0.5 text-[9px] opacity-70">({c})</span>}
              {t.id === "stock" && alertes.length > 0 && <span className="ml-0.5 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[8px] font-bold text-white grid place-items-center">{alertes.length}</span>}
            </button>
          );
        })}
      </div>

      <div className="px-4 mt-4">
        {chargement && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3"><Loader2 size={14} className="animate-spin" /> Lecture du moteur d'atelier…</div>
        )}
        {synthese.error && <Vide texte={synthese.error.message} />}
        {sansGarage && !synthese.error && (
          <div className="rounded-xl bg-white p-4 border border-[#E5E7EB] mb-3 text-xs text-[#6B7280]">
            Aucun garage n'est rattaché à ce compte. Créez votre fiche garage pour activer l'atelier.
            <Link to="/garage-plus" className="ml-1 font-bold text-[#111] underline">Garage Pro</Link>
          </div>
        )}

        {tab === "suivi" && (
          <div className="space-y-3">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { id: "actives", label: `Actives (${nb(ETAPES_ACTIVES)})` },
                { id: "tous", label: `Toutes (${interventions.length})` },
                ...etapes.filter((e) => (compteurs[e.code] ?? 0) > 0).map((e) => ({ id: e.code, label: `${e.libelle} (${compteurs[e.code]})` })),
              ].map((f) => (
                <button key={f.id} onClick={() => setSuiviFilter(f.id)} className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${suiviFilter === f.id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                  {f.id !== "actives" && f.id !== "tous" && <span className={`h-2 w-2 rounded-full ${COULEUR_ETAPE[f.id] ?? "bg-slate-400"}`} />}
                  {f.label}
                </button>
              ))}
            </div>

            {!chargement && interventionsFiltrees.length === 0 && <Vide texte="Aucune intervention pour ce filtre. Les rendez-vous pris par vos clients apparaissent ici automatiquement." />}

            {interventionsFiltrees.map((i) => {
              const ouverte = selection === i.id;
              return (
                <div key={i.id} onClick={() => setSelection(ouverte ? null : i.id)} className={`rounded-xl bg-white p-3 border cursor-pointer transition ${ouverte ? "border-[#D4AF37] shadow-md" : "border-[#E5E7EB]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#111] truncate">
                        {i.vehiculeMarque ? `${i.vehiculeMarque} ${i.vehiculeModele}` : i.type}
                      </p>
                      <p className="text-[10px] text-[#6B7280] truncate">{i.clientNom ?? `Client #${i.clientId}`} · {fmtDate(i.dateHeure)} · #{i.id}</p>
                      {i.motif && <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">{i.motif}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold text-white ${COULEUR_ETAPE[i.status] ?? "bg-slate-400"}`}>{libelleEtape(i.status)}</span>
                  </div>

                  {ouverte && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-[10px] font-bold text-[#6B7280] uppercase">Étape suivante (le client est notifié)</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {etapes.filter((e) => e.code !== i.status).map((e) => (
                          <BoutonMoteur
                            key={e.code}
                            code="atelier_intervention_etape"
                            className={`rounded-lg py-1.5 text-[9px] font-bold text-white ${COULEUR_ETAPE[e.code] ?? "bg-slate-400"} disabled:opacity-50`}
                            desactive={changerEtape.isPending ? "Enregistrement en cours" : undefined}
                            onExecuter={() => changerEtape.mutate({ rdvId: i.id, status: e.code })}
                          >
                            {e.libelle}
                          </BoutonMoteur>
                        ))}
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        {i.clientPhone && (
                          <BoutonMoteur code="atelier_client_appeler" telephone={i.clientPhone} className={btnBleu}>
                            <span className="inline-flex items-center gap-1"><Phone size={10} /> Appeler</span>
                          </BoutonMoteur>
                        )}
                        {i.clientEmail && (
                          <BoutonMoteur code="atelier_client_ecrire" email={i.clientEmail} className={btnSecond}>
                            <span className="inline-flex items-center gap-1"><Mail size={10} /> Écrire</span>
                          </BoutonMoteur>
                        )}
                        <BoutonMoteur code="atelier_ouvrir_planning" className={btnPrimaire}>Reporter</BoutonMoteur>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "planning" && (
          <div className="space-y-3">
            <div className="flex gap-1.5">
              <BoutonMoteur code="atelier_ouvrir_planning" className={btnPrimaire}>Planning complet & reports</BoutonMoteur>
            </div>
            {!chargement && planningParJour.length === 0 && <Vide texte="Aucun rendez-vous à venir." />}
            {planningParJour.map(([jour, liste]) => (
              <div key={jour} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <p className="px-3 py-2 text-[10px] font-bold uppercase text-[#6B7280] bg-[#FAF9F6] capitalize">{fmtJour(liste[0].dateHeure)}</p>
                {liste.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[#F0EEE9]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111] truncate">
                        {new Date(i.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {i.vehiculeMarque ? `${i.vehiculeMarque} ${i.vehiculeModele}` : i.type}
                      </p>
                      <p className="text-[10px] text-[#6B7280] truncate">{i.clientNom ?? `Client #${i.clientId}`}{i.motif ? ` · ${i.motif}` : ""}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <BoutonMoteur
                        code="atelier_intervention_etape"
                        className="rounded-lg bg-blue-500 px-2 py-1 text-[9px] font-bold text-white disabled:opacity-50"
                        desactive={changerEtape.isPending ? "Enregistrement en cours" : undefined}
                        onExecuter={() => changerEtape.mutate({ rdvId: i.id, status: "accueil" })}
                      >
                        Réceptionner
                      </BoutonMoteur>
                      <BoutonMoteur
                        code="atelier_intervention_etape"
                        className="rounded-lg bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600 disabled:opacity-50"
                        desactive={changerEtape.isPending ? "Enregistrement en cours" : undefined}
                        onExecuter={() => changerEtape.mutate({ rdvId: i.id, status: "annulee" })}
                      >
                        Annuler
                      </BoutonMoteur>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab === "ordres" && <NonBranchee titre="Ordres de réparation"><BoutonMoteur code="atelier_ordres_reparation" className={btnSecond} onExecuter={() => undefined}>Ordres de réparation</BoutonMoteur></NonBranchee>}
        {tab === "employes" && <NonBranchee titre="Équipe de l'atelier"><BoutonMoteur code="atelier_employes" className={btnSecond} onExecuter={() => undefined}>Équipe de l'atelier</BoutonMoteur></NonBranchee>}
        {tab === "devis" && <NonBranchee titre="Devis émis par l'atelier"><BoutonMoteur code="atelier_devis_garage" className={btnSecond} onExecuter={() => undefined}>Devis émis par l'atelier</BoutonMoteur></NonBranchee>}
        {tab === "factures" && <NonBranchee titre="Factures de l'atelier"><BoutonMoteur code="atelier_factures" className={btnSecond} onExecuter={() => undefined}>Factures de l'atelier</BoutonMoteur></NonBranchee>}

        {tab === "stock" && (
          <div className="space-y-3">
            {alertes.length > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1"><AlertTriangle size={12} /> {alertes.length} référence(s) sous le seuil</p>
                <p className="text-[10px] text-red-600 mt-0.5">{alertes.map((a) => a.designation).join(", ")}</p>
              </div>
            )}
            <div className="flex gap-1.5">
              <BoutonMoteur code="atelier_ouvrir_stock" className={btnPrimaire}>Gérer le stock</BoutonMoteur>
              <BoutonMoteur code="atelier_ouvrir_reappro" className={btnSecond}>Réapprovisionnement</BoutonMoteur>
            </div>
            {!chargement && (stock.data?.lignes.length ?? 0) === 0 && <Vide texte="Aucune référence en stock. Enregistrez vos pièces depuis « Gérer le stock »." />}
            {stock.data?.lignes.map((l) => {
              const alerte = l.seuil > 0 && l.quantite <= l.seuil;
              const ouverte = selection === l.id;
              const bouger = (delta: number) => mouvement.mutate({
                garageId: l.garageId,
                reference: l.reference,
                designation: l.designation,
                quantite: Math.max(0, l.quantite + delta),
                seuil: l.seuil,
                prixAchatCents: l.prixAchatCents ?? undefined,
                prixVenteCents: l.prixVenteCents ?? undefined,
                emplacement: l.emplacement ?? undefined,
                motif: delta > 0 ? "Entrée depuis Atelier Pro" : "Sortie depuis Atelier Pro",
              });
              return (
                <div key={l.id} onClick={() => setSelection(ouverte ? null : l.id)} className={`rounded-xl bg-white p-3 border cursor-pointer ${alerte ? "border-red-200" : "border-[#E5E7EB]"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#111] truncate">{l.designation}</p>
                      <p className="text-[10px] text-[#6B7280]">{l.reference}{l.emplacement ? ` · ${l.emplacement}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${alerte ? "text-red-600" : "text-[#111]"}`}>{l.quantite}</p>
                      <p className="text-[9px] text-[#6B7280]">seuil {l.seuil}</p>
                    </div>
                  </div>
                  {ouverte && (
                    <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <BoutonMoteur code="atelier_stock_mouvement" className="flex-1 rounded-lg bg-green-500 py-1.5 text-[10px] font-bold text-white disabled:opacity-50" desactive={mouvement.isPending ? "Enregistrement en cours" : undefined} onExecuter={() => bouger(1)}>
                        <span className="inline-flex items-center gap-1"><ArrowDown size={10} /> Entrée</span>
                      </BoutonMoteur>
                      <BoutonMoteur code="atelier_stock_mouvement" className="flex-1 rounded-lg bg-red-500 py-1.5 text-[10px] font-bold text-white disabled:opacity-50" desactive={mouvement.isPending ? "Enregistrement en cours" : l.quantite === 0 ? "Stock à zéro" : undefined} onExecuter={() => bouger(-1)}>
                        <span className="inline-flex items-center gap-1"><ArrowUp size={10} /> Sortie</span>
                      </BoutonMoteur>
                      <BoutonMoteur code="atelier_ouvrir_reappro" className={btnPrimaire}>Commander</BoutonMoteur>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "clients" && (
          <div className="space-y-3">
            <input value={clientQ} onChange={(e) => setClientQ(e.target.value)} placeholder="Rechercher un client (nom, e-mail, téléphone)" className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs" />
            {!chargement && clientsFiltres.length === 0 && <Vide texte="Aucun client : les clients apparaissent dès leur premier rendez-vous dans votre garage." />}
            {clientsFiltres.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-3 border border-[#E5E7EB]">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111] truncate">{c.nom}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">{[c.email, c.phone].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#111]">{c.interventions}</p>
                    <p className="text-[9px] text-[#6B7280]">visite(s) · {fmtDate(c.derniere)}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  {c.phone && <BoutonMoteur code="atelier_client_appeler" telephone={c.phone} className={btnBleu}><span className="inline-flex items-center gap-1"><Phone size={10} /> Appeler</span></BoutonMoteur>}
                  {c.email && <BoutonMoteur code="atelier_client_ecrire" email={c.email} className={btnSecond}><span className="inline-flex items-center gap-1"><Mail size={10} /> Écrire</span></BoutonMoteur>}
                  <button onClick={() => { setTab("suivi"); setSuiviFilter("tous"); setClientQ(""); }} className={btnPrimaire}>Historique</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "vehicules" && (
          <div className="space-y-3">
            <input value={vehQ} onChange={(e) => setVehQ(e.target.value)} placeholder="Rechercher un véhicule (marque, modèle)" className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs" />
            {!chargement && vehiculesFiltres.length === 0 && <Vide texte="Aucun véhicule : seuls les véhicules rattachés à un rendez-vous (annonce) apparaissent ici." />}
            {vehiculesFiltres.map((v) => (
              <div key={v.annonceId} className="rounded-xl bg-white p-3 border border-[#E5E7EB]">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111] truncate">{v.marque} {v.modele}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">{v.titre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#111]">{v.interventions}</p>
                    <p className="text-[9px] text-[#6B7280]">passage(s) · {fmtDate(v.derniere)}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Link to={v.url} className={btnPrimaire}><span className="inline-flex items-center gap-1"><ExternalLink size={10} /> Fiche véhicule</span></Link>
                  <button onClick={() => { setTab("suivi"); setSuiviFilter("tous"); }} className={btnSecond}>Interventions</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "catalogue" && (
          <div className="rounded-xl bg-white p-4 border border-[#E5E7EB] space-y-3">
            <p className="text-sm font-bold text-[#111]">Catalogue technique</p>
            <p className="text-xs text-[#6B7280]">Données constructeur, couples de serrage, schémas et temps barémés.</p>
            <BoutonMoteur code="atelier_ouvrir_catalogue" className={btnPrimaire}>Ouvrir le catalogue technique</BoutonMoteur>
          </div>
        )}

        {tab === "pieces" && (
          <div className="rounded-xl bg-white p-4 border border-[#E5E7EB] space-y-3">
            <p className="text-sm font-bold text-[#111]">Pièces détachées</p>
            <p className="text-xs text-[#6B7280]">Recherche par référence ou véhicule, puis panier et commande fournisseur.</p>
            <div className="flex gap-1.5">
              <BoutonMoteur code="atelier_ouvrir_pieces" className={btnPrimaire}>Rechercher une pièce</BoutonMoteur>
              <BoutonMoteur code="atelier_ouvrir_reappro" className={btnSecond}>Commandes fournisseur</BoutonMoteur>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl bg-[#111] px-4 py-2 text-xs font-bold text-[#D4AF37] shadow-lg z-50">{toast}</div>
      )}
    </div>
  );
}
