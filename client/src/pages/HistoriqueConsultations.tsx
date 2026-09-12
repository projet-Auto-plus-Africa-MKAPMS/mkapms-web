import { Link } from "react-router-dom";
import { Clock, ChevronLeft, Car, Eye, MapPin } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   DERNIÈRES CONSULTATIONS (/historique-consultations)
   Données réelles : trpc.smartEngine.myMemory({type:"view"}) — server/
   smart-engine/services/user-memory.ts::recordView, déjà appelé depuis
   trpc.annonces.get à chaque consultation réelle d'une fiche véhicule.
   Aucun autre univers (garage, location, enchère, carrosserie) n'a de
   suivi de consultation réel : l'ancien écran l'inventait entièrement
   (fausses entreprises, photos de stock). Aucune mutation de suppression
   n'existe côté serveur — pas de bouton "Effacer" qui ne ferait rien.
   ══════════════════════════════════════════════════════════════════════════ */

interface ViewEntry {
  id: number;
  annonceId: number;
  viewedAt: string;
}

function ConsultationCard({ entry }: { entry: ViewEntry }) {
  const annonce = trpc.annonces.get.useQuery({ id: entry.annonceId });
  if (annonce.isLoading) {
    return <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 h-[68px] animate-pulse" />;
  }
  if (!annonce.data) return null; // annonce supprimée depuis : on ne montre pas une consultation morte

  const a = annonce.data;
  return (
    <Link to={`/vehicule/${a.id}`} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 hover:border-[#D4AF37] transition">
      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
        <Car size={20} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#111] truncate">{[a.marque, a.modele].filter(Boolean).join(" ") || "Véhicule"}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9CA3AF]">
          <span className="flex items-center gap-0.5"><Eye size={9} /> {new Date(entry.viewedAt).toLocaleString("fr-FR")}</span>
          {a.ville && <span className="flex items-center gap-0.5"><MapPin size={9} /> {a.ville}</span>}
        </div>
      </div>
      {a.prix && <p className="text-sm font-bold text-[#D4AF37] shrink-0">{Number(a.prix).toLocaleString("fr-FR")} €</p>}
    </Link>
  );
}

export default function HistoriqueConsultations() {
  const memoire = trpc.smartEngine.myMemory.useQuery({ type: "view", limit: 50 });

  // Une entrée par annonce, la plus récente en premier.
  const vues = new Map<number, ViewEntry>();
  for (const m of memoire.data ?? []) {
    const data = m.data as { annonceId?: number; viewedAt?: string };
    if (typeof data.annonceId !== "number") continue;
    if (!vues.has(data.annonceId)) {
      vues.set(data.annonceId, { id: m.id, annonceId: data.annonceId, viewedAt: data.viewedAt ?? String(m.createdAt) });
    }
  }
  const liste = Array.from(vues.values());

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/compte" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Dernières consultations</h1>
        <p className="mt-1 text-sm text-white/60">Véhicules consultés récemment</p>
      </div>

      {memoire.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((v) => <ConsultationCard key={v.annonceId} entry={v} />)}
      </div>

      {!memoire.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Clock size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune consultation récente</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Vos dernières fiches véhicules consultées apparaîtront ici</p>
          <Link to="/acheter" className="mt-4 inline-flex rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-white">Explorer</Link>
        </div>
      )}
    </div>
  );
}
