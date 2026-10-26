import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Globe2, Search, Mail, MapPin, Building2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * Direction/Admin — Prospection partenaires (Partner Outreach Engine, mission
 * Direction 26/10).
 *
 * Registre des contacts approchés par MKA.P-MS (fournisseurs véhicules,
 * pièces, garages, transporteurs, logisticiens, boutique) AVANT qu'ils ne
 * deviennent une candidature (/superadmin/partenaires) ou une fiche
 * fournisseur exploitable (/superadmin/fournisseurs) — jamais un doublon de
 * ces deux écrans, l'étape qui précède.
 *
 * La plupart des contacts importés n'ont ni catégorie ni pays confirmés :
 * c'est volontaire (rien n'est deviné à l'import, voir la migration de
 * seed) — cet écran sert justement à les vérifier et qualifier un par un.
 */

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  identifie: { label: "Identifié", color: "bg-slate-500" },
  contacte: { label: "Contacté", color: "bg-blue-500" },
  reponse_recue: { label: "Réponse reçue", color: "bg-amber-500" },
  a_verifier: { label: "À vérifier", color: "bg-orange-500" },
  qualifie: { label: "Qualifié", color: "bg-indigo-500" },
  pilote: { label: "Pilote", color: "bg-purple-500" },
  actif: { label: "Actif", color: "bg-green-600" },
  suspendu: { label: "Suspendu", color: "bg-orange-700" },
  refuse: { label: "Refusé", color: "bg-red-700" },
  non_livre: { label: "Non livré", color: "bg-red-900" },
  dossier_incomplet: { label: "Dossier incomplet", color: "bg-yellow-700" },
};
const STATUS_ORDER = Object.keys(STATUS_LABEL);

const CATEGORY_LABEL: Record<string, string> = {
  fournisseur_vehicules: "Fournisseur véhicules",
  fournisseur_pieces: "Fournisseur pièces",
  garage: "Garage",
  transporteur_terrestre: "Transporteur terrestre",
  transporteur_maritime: "Transporteur maritime",
  transporteur_aerien: "Transporteur aérien",
  logisticien_fulfillment: "Logisticien / fulfillment",
  boutique_partenaire: "Boutique partenaire",
  autre: "Autre",
};

export default function ProspectionPartenaires() {
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [responseInput, setResponseInput] = useState("");

  const stats = trpc.partnerOutreachEngine.statistiques.useQuery();
  const liste = trpc.partnerOutreachEngine.liste.useQuery({
    status: (statusFilter || undefined) as any,
    search: search.trim() || undefined,
  });
  const detail = trpc.partnerOutreachEngine.detail.useQuery({ id: selectedId! }, { enabled: !!selectedId });
  const historique = trpc.partnerOutreachEngine.historique.useQuery({ id: selectedId! }, { enabled: !!selectedId });

  const changerStatut = trpc.partnerOutreachEngine.changerStatut.useMutation({
    onSuccess: () => {
      utils.partnerOutreachEngine.liste.invalidate();
      utils.partnerOutreachEngine.statistiques.invalidate();
      utils.partnerOutreachEngine.detail.invalidate({ id: selectedId! });
      utils.partnerOutreachEngine.historique.invalidate({ id: selectedId! });
    },
  });
  const enregistrerReponse = trpc.partnerOutreachEngine.enregistrerReponse.useMutation({
    onSuccess: () => {
      setResponseInput("");
      utils.partnerOutreachEngine.liste.invalidate();
      utils.partnerOutreachEngine.statistiques.invalidate();
      utils.partnerOutreachEngine.detail.invalidate({ id: selectedId! });
      utils.partnerOutreachEngine.historique.invalidate({ id: selectedId! });
    },
  });

  const contact = detail.data as any;

  const compteurs = useMemo(() => {
    const parStatut = stats.data?.parStatut ?? {};
    return STATUS_ORDER.map((s) => ({ status: s, n: parStatut[s] ?? 0 }));
  }, [stats.data]);

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Globe2 size={20} className="text-purple-400" /> Prospection partenaires</h1>
        <p className="mt-1 text-xs text-white/40">
          Contacts approchés (fournisseurs, transporteurs, logisticiens, boutique) — avant candidature ou fiche fournisseur. {stats.data?.total ?? "…"} contact(s).
        </p>
      </div>

      {/* Compteurs par statut */}
      <div className="px-4 mt-4 flex flex-wrap gap-2">
        <button onClick={() => setStatusFilter("")} className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${!statusFilter ? "bg-[#D4AF37] text-[#111]" : "bg-white/10 text-white/60"}`}>
          Tous ({stats.data?.total ?? 0})
        </button>
        {compteurs.filter((c) => c.n > 0).map((c) => (
          <button
            key={c.status}
            onClick={() => setStatusFilter(c.status === statusFilter ? "" : c.status)}
            className={`rounded-full px-3 py-1.5 text-[10px] font-bold text-white ${STATUS_LABEL[c.status].color} ${statusFilter === c.status ? "ring-2 ring-white" : "opacity-70"}`}
          >
            {STATUS_LABEL[c.status].label} ({c.n})
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="px-4 mt-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
          <Search size={14} className="text-white/40" />
          <input
            type="text"
            placeholder="Rechercher par société, e-mail, domaine, pays…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 mt-3 space-y-2">
        {liste.isLoading ? (
          <p className="text-center text-xs text-white/40 py-8">Chargement…</p>
        ) : (liste.data ?? []).length === 0 ? (
          <p className="text-center text-xs text-white/40 py-8">Aucun contact pour ce filtre.</p>
        ) : (
          (liste.data ?? []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => { setSelectedId(c.id); setNoteInput(c.qualificationNote ?? ""); }}
              className={`w-full text-left rounded-xl border p-3 transition ${selectedId === c.id ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    <Building2 size={12} className="text-white/40 shrink-0" /> {c.companyName || c.domain || c.email}
                  </p>
                  <p className="text-[11px] text-white/40 truncate flex items-center gap-1.5 mt-0.5">
                    <Mail size={11} className="shrink-0" /> {c.email}
                    {c.country && <><MapPin size={11} className="shrink-0 ml-1" /> {c.country}</>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold text-white ${STATUS_LABEL[c.status]?.color ?? "bg-slate-500"}`}>
                  {STATUS_LABEL[c.status]?.label ?? c.status}
                </span>
              </div>
              {c.category && (
                <span className="mt-1.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[9px] text-white/60">{CATEGORY_LABEL[c.category] ?? c.category}</span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Détail / qualification */}
      {selectedId && contact && (
        <div className="mx-4 mt-4 rounded-2xl bg-white/5 border border-[#D4AF37]/30 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">{contact.companyName || contact.email}</h2>
            <button onClick={() => setSelectedId(null)} className="text-xs text-white/40">Fermer</button>
          </div>
          <p className="text-[11px] text-white/40">{contact.reference} · {contact.email} · {contact.domain}</p>

          {contact.responseSummary && (
            <div className="rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1">Réponse reçue</p>
              <p className="text-xs text-white/80 whitespace-pre-wrap">{contact.responseSummary}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Changer le statut</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  disabled={changerStatut.isPending}
                  onClick={() => changerStatut.mutate({ id: selectedId, status: s as any, note: noteInput.trim() || undefined })}
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold text-white transition ${STATUS_LABEL[s].color} ${contact.status === s ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
                >
                  {STATUS_LABEL[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Note de qualification</p>
            <textarea
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/30"
              rows={2}
              placeholder="Pays confirmé, catégorie réelle, prix/délais vérifiés…"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Enregistrer une réponse reçue</p>
            <textarea
              className="w-full rounded-lg bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-white/30"
              rows={2}
              placeholder="Résumé de la réponse du contact…"
              value={responseInput}
              onChange={(e) => setResponseInput(e.target.value)}
            />
            <button
              disabled={!responseInput.trim() || enregistrerReponse.isPending}
              onClick={() => enregistrerReponse.mutate({ id: selectedId, resume: responseInput.trim() })}
              className="mt-2 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-[10px] font-bold text-[#111] disabled:opacity-40"
            >
              Enregistrer la réponse
            </button>
          </div>

          {(historique.data ?? []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Historique</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {(historique.data ?? []).map((h: any) => (
                  <p key={h.id} className="text-[10px] text-white/50">
                    {new Date(h.createdAt).toLocaleString("fr-FR")} — {h.action}
                    {h.fromStatus && h.toStatus && ` (${h.fromStatus} → ${h.toStatus})`}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
