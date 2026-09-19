import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Plus, Phone, Mail, Trash2, X } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   FOURNISSEURS VENTE (/vente/fournisseurs)
   Données réelles : trpc.pro.venteFournisseursListe / venteFournisseurAjouter
   / venteFournisseurSupprimer (server/routers/pro.ts, table
   vente_fournisseurs — nouvelle, propre à chaque compte pro). La liste
   FOURNISSEURS codée en dur affichait un nombre de commandes et un total
   inventés : aucun système de bons de commande n'existe sur la plateforme
   pour les calculer honnêtement — retirés plutôt que maintenus fictifs.
   ══════════════════════════════════════════════════════════════════════════ */

export default function CentreFournisseurs() {
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [type, setType] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.pro.venteFournisseursListe.useQuery();
  const ajouter = trpc.pro.venteFournisseurAjouter.useMutation({
    onSuccess: () => {
      utils.pro.venteFournisseursListe.invalidate();
      setShowForm(false);
      setNom(""); setType(""); setTelephone(""); setEmail("");
    },
  });
  const supprimer = trpc.pro.venteFournisseurSupprimer.useMutation({
    onSuccess: () => utils.pro.venteFournisseursListe.invalidate(),
  });

  const fournisseurs = data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/vente/resume-vendeur" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Fournisseurs</h1>
      </div>

      {isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}
      {!isLoading && fournisseurs.length === 0 && !showForm && (
        <p className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280] text-center">
          Aucun fournisseur enregistré pour l'instant.
        </p>
      )}

      <div className="px-4 mt-4 space-y-2">
        {fournisseurs.map((f) => (
          <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#111]">{f.nom}</h3>
              <p className="text-[10px] text-[#6B7280]">{f.type || "Fournisseur"}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-[#6B7280]">
                {f.telephone && <span className="flex items-center gap-1"><Phone size={10} /> {f.telephone}</span>}
                {f.email && <span className="flex items-center gap-1"><Mail size={10} /> {f.email}</span>}
              </div>
            </div>
            <button
              onClick={() => supprimer.mutate({ id: f.id })}
              disabled={supprimer.isPending}
              className="text-[#9CA3AF] hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 mt-3">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Ajouter fournisseur
          </button>
        ) : (
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">Nouveau fournisseur</h3>
              <button onClick={() => setShowForm(false)}><X size={16} className="text-[#9CA3AF]" /></button>
            </div>
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom *" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Type (pièces, pneus, transporteur…)" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm" />
            {ajouter.error && <p className="text-xs text-red-600">{ajouter.error.message}</p>}
            <button
              onClick={() => ajouter.mutate({ nom, type: type || undefined, telephone: telephone || undefined, email: email || undefined })}
              disabled={!nom.trim() || ajouter.isPending}
              className="w-full rounded-lg bg-blue-700 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {ajouter.isPending ? "Ajout…" : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
