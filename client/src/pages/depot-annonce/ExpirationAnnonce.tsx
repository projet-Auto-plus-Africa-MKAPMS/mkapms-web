import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Clock, Bell, RefreshCw } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   EXPIRATION (/depot-annonce/expiration-annonce/:id)
   Données réelles : trpc.annonces.prolong (server/routers/annonces.ts, déjà
   utilisé par MesAnnonces.tsx) — jamais un second moteur. Les seuils de
   notification (J-30/J-15/J-7/J-1) restent des repères informatifs fixes :
   aucun système de notification programmée par seuil n'existe encore côté
   serveur (à construire séparément, pas fabriqué ici comme s'il existait).
   ══════════════════════════════════════════════════════════════════════════ */

const ALERTES = [
  { delai: "30", desc: "Première notification d'expiration prochaine", color: "#10B981" },
  { delai: "15", desc: "Rappel d'expiration", color: "#F59E0B" },
  { delai: "7", desc: "Alerte expiration imminente", color: "#F97316" },
  { delai: "1", desc: "Dernière chance de renouveler", color: "#EF4444" },
];

export default function ExpirationAnnonce() {
  const { id } = useParams();
  const annonceId = Number(id);
  const navigate = useNavigate();
  const { data: annonce, isLoading } = trpc.annonces.get.useQuery({ id: annonceId }, { enabled: Number.isFinite(annonceId) });
  const prolong = trpc.annonces.prolong.useMutation({
    onSuccess: () => navigate(`/depot-annonce/modification-annonce/${annonceId}`),
  });

  if (!Number.isFinite(annonceId) || (!isLoading && !annonce)) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] p-4">
        <p className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">Annonce introuvable — revenez depuis « Mes annonces ».</p>
      </div>
    );
  }

  const expire = annonce?.expiresAt ? new Date(annonce.expiresAt) : null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/acheter/mes-annonces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mes annonces</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Expiration</h1>
        {expire && (
          <p className="mt-1 text-sm text-white/60">
            {expire > new Date() ? `Expire le ${expire.toLocaleDateString("fr-FR")}` : "Déjà expirée"}
          </p>
        )}
      </div>

      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase">Repères de notification</h2>
        {ALERTES.map((a) => (
          <div key={a.delai} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: a.color + "15" }}><Bell size={14} style={{ color: a.color }} /></div>
            <div className="flex-1"><p className="text-sm font-bold" style={{ color: a.color }}>J-{a.delai}</p><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div>
          </div>
        ))}

        {prolong.error && <p className="text-xs text-red-600">{prolong.error.message}</p>}

        <button
          onClick={() => prolong.mutate({ id: annonceId })}
          disabled={prolong.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#D4AF37] text-white rounded-xl text-xs font-bold disabled:opacity-50"
        >
          <RefreshCw size={14} /> {prolong.isPending ? "Prolongation…" : "Prolonger de 30 jours"}
        </button>
      </div>
    </div>
  );
}
