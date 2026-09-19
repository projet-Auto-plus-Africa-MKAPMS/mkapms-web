import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Users, Plus, X, Shield } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   ÉQUIPE VENTE (/vente/employes)
   Données réelles : trpc.pro.venteEmployesListe / venteEmployeAjouter /
   venteEmployeModifier (server/routers/pro.ts, table vente_employes —
   nouvelle, propre à chaque compte pro). Distincte de
   rbacRouter.staffProfiles (organigramme interne MKA.P-MS). Les données
   EMPLOYES_PAR_ROLE codées en dur (Jean Dupont, Marie Curie) ont été
   retirées.
   ══════════════════════════════════════════════════════════════════════════ */

const POSTES = ["Directeur", "Responsable VO", "Commercial", "Comptable", "Préparateur", "Mécanicien"];

export default function GestionEmployes() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.pro.venteEmployesListe.useQuery();
  const [selectedPoste, setSelectedPoste] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState(POSTES[2]);
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const ajouter = trpc.pro.venteEmployeAjouter.useMutation({
    onSuccess: () => {
      utils.pro.venteEmployesListe.invalidate();
      setShowForm(false);
      setNom(""); setEmail(""); setTelephone("");
    },
  });
  const modifier = trpc.pro.venteEmployeModifier.useMutation({
    onSuccess: () => {
      utils.pro.venteEmployesListe.invalidate();
      setEditId(null);
    },
  });

  const employes = data ?? [];
  const parPoste = new Map<string, typeof employes>();
  for (const e of employes) {
    const key = e.poste || "Autre";
    parPoste.set(key, [...(parPoste.get(key) ?? []), e]);
  }
  const editing = employes.find((e) => e.id === editId) ?? null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Dashboard
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Users size={20} className="text-[#D4AF37]" /> Équipe Vente
        </h1>
        <p className="mt-1 text-[10px] text-white/50 uppercase font-bold tracking-wider">Gestion des collaborateurs</p>
      </div>

      {isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {[...parPoste.entries()].map(([grp, liste]) => (
          <div key={grp} className="overflow-hidden rounded-xl bg-white border border-[#E5E7EB]">
            <button
              onClick={() => setSelectedPoste(selectedPoste === grp ? null : grp)}
              className="w-full p-4 flex items-center gap-3 active:bg-slate-50 transition-all"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                <Users size={16} className="text-[#D4AF37]" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-sm font-bold text-[#111]">{grp}</h3>
              </div>
              <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[10px] font-black text-[#111]">{liste.length}</span>
            </button>

            {selectedPoste === grp && (
              <div className="px-4 pb-4 space-y-2 border-t border-[#E5E7EB] pt-3 bg-slate-50/50">
                {liste.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setEditId(emp.id)}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-white p-3 flex items-center justify-between active:scale-[0.98] transition-all"
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#111]">{emp.nom}{!emp.actif && <span className="ml-1 text-[9px] text-red-500">(désactivé)</span>}</p>
                      <p className="text-[9px] text-[#6B7280]">{emp.email || "—"}</p>
                    </div>
                    <ChevronLeft size={12} className="rotate-180 text-[#9CA3AF]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {!isLoading && employes.length === 0 && (
          <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-center text-sm text-[#6B7280]">Aucun collaborateur pour l'instant.</p>
        )}
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl bg-[#111] py-3.5 text-xs font-black uppercase text-[#D4AF37] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/10"
        >
          <Plus size={16} /> Recruter un collaborateur
        </button>
      </div>

      {/* Modal Ajout */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 space-y-3" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#111]">Nouveau collaborateur</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-[#9CA3AF]" /></button>
            </div>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom complet *" className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm" />
            <select value={poste} onChange={(e) => setPoste(e.target.value)} className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm bg-white">
              {POSTES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email professionnel" className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm" />
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-[#E5E7EB] p-3 text-sm" />
            {ajouter.error && <p className="text-xs text-red-600">{ajouter.error.message}</p>}
            <button
              onClick={() => ajouter.mutate({ nom, poste, email: email || undefined, telephone: telephone || undefined })}
              disabled={!nom.trim() || ajouter.isPending}
              className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {ajouter.isPending ? "Ajout…" : "Recruter"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Modification */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditId(null)}>
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <div className="bg-[#111] p-6 relative">
              <button onClick={() => setEditId(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16} className="text-white" /></button>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <Users size={32} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{editing.nom}</h2>
                  <p className="text-xs text-[#D4AF37] font-bold uppercase tracking-widest">{editing.poste}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <button
                onClick={() => navigate(`/vente/droits/${editing.id}`)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#111] py-3 text-xs font-black uppercase text-[#111]"
              >
                <Shield size={14} /> Gérer les droits d'accès
              </button>
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => modifier.mutate({ id: editing.id, actif: !editing.actif })}
                  disabled={modifier.isPending}
                  className="flex-1 rounded-xl border border-[#E5E7EB] py-3.5 text-xs font-black uppercase text-[#6B7280] disabled:opacity-50"
                >
                  {editing.actif ? "Désactiver" : "Réactiver"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
