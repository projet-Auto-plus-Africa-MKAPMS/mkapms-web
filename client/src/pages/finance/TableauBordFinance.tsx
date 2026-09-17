import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, Euro, FileText, Clock, CreditCard } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

export default function TableauBordFinance() {
  const { user } = useAuth();
  const mesPaiements = trpc.reservations.mesPaiements.useQuery(undefined, { enabled: !!user });
  const contratsLoa = trpc.financeplus.mesContrats.useQuery(undefined, { enabled: !!user });
  const demandesFractionne = trpc.installments.mine.useQuery(undefined, { enabled: !!user });
  const mesAbonnements = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user });

  const isLoading = mesPaiements.isLoading || contratsLoa.isLoading || demandesFractionne.isLoading || mesAbonnements.isLoading;

  const paiements = mesPaiements.data ?? [];
  const totalPaye = paiements.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const enAttente = paiements.filter((p) => p.status === "pending").length;
  const contratsActifs = (contratsLoa.data ?? []).filter((c) => c.status === "actif" || c.status === "signe").length;
  const fractionneEnCours = (demandesFractionne.data ?? []).filter((d) => d.status !== "rejete" && d.status !== "termine").length;
  const abonnementsActifs = (mesAbonnements.data ?? []).filter((a) => a.status === "active" && a.category !== "particulier_boost").length;

  const CARTES = [
    { label: "Total payé", valeur: `${totalPaye.toLocaleString("fr-FR")} €`, icon: Euro, color: "text-[#D4AF37]" },
    { label: "Paiements en attente", valeur: String(enAttente), icon: Clock, color: "text-amber-500" },
    { label: "Contrats LOA actifs", valeur: String(contratsActifs), icon: FileText, color: "text-purple-600" },
    { label: "Fractionné en cours", valeur: String(fractionneEnCours), icon: CreditCard, color: "text-blue-600" },
    { label: "Abonnements pro actifs", valeur: String(abonnementsActifs), icon: BarChart3, color: "text-green-600" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Tableau de bord</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir ton tableau de bord financier.</p>
        ) : isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : (
          CARTES.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <Icon size={16} className={c.color} />
                <div className="flex-1"><h3 className="text-sm text-[#111]">{c.label}</h3></div>
                <span className="text-sm font-bold text-[#111]">{c.valeur}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
