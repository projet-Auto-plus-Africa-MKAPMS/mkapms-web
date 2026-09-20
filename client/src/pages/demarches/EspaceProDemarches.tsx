import { Link } from "react-router-dom";
import { ChevronLeft, Building2, ChevronRight, Plus } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { BoutonMoteur } from "../../lib/boutonMoteur";

/** Dossiers réellement déposés par le professionnel connecté (moteur Démarches). */
export default function EspaceProDemarches() {
  const { user } = useAuth();
  const liste = trpc.carteGrise.mesDossiers.useQuery(undefined, { enabled: !!user });
  const catalogue = trpc.carteGrise.catalogue.useQuery(undefined, { staleTime: 300_000 });
  const statuts = catalogue.data?.statuts ?? {};
  const dossiers = liste.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Espace pro démarches</h1>
        {user && <p className="mt-1 text-sm text-white/80">{dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}</p>}
      </div>

      {!user ? (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <p className="text-sm text-[#6B7280]">Connectez-vous pour retrouver vos dossiers.</p>
          <BoutonMoteur code="demarches_connexion" className="block w-full rounded-xl bg-blue-800 py-3 text-center text-sm font-bold text-white">Se connecter</BoutonMoteur>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-2">
          {liste.isLoading && <p className="text-sm text-[#6B7280]">Chargement…</p>}
          {liste.data?.length === 0 && <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">Aucun dossier déposé pour le moment.</p>}
          {dossiers.map((d) => (
            <BoutonMoteur key={d.id} code="demarches_suivre_dossier" query={{ id: String(d.id) }} className="flex w-full items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 text-left">
              <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{[d.marque, d.modele].filter(Boolean).join(" ") || d.type}</h3><p className="text-[9px] text-[#6B7280]">{d.reference}</p></div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${d.status === "termine" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{statuts[d.status] ?? d.status}</span>
              <ChevronRight size={14} className="text-[#9CA3AF]" />
            </BoutonMoteur>
          ))}
        </div>
      )}
      <div className="px-4 mt-3">
        <BoutonMoteur code="demarches_nouveau_dossier" className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-400 py-3 text-sm font-bold text-blue-700"><Plus size={16} /> Nouveau dossier</BoutonMoteur>
      </div>
    </div>
  );
}
