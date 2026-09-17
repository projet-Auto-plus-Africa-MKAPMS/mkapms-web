import { Link } from "react-router-dom";
import { ChevronLeft, Euro, ChevronRight, Check, Clock, Circle } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

export default function ObjectifFinance() {
  const { user } = useAuth();
  const mesReservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const contratsLoa = trpc.financeplus.mesContrats.useQuery(undefined, { enabled: !!user });
  const demandesFractionne = trpc.installments.mine.useQuery(undefined, { enabled: !!user });

  const isLoading = mesReservations.isLoading || contratsLoa.isLoading || demandesFractionne.isLoading;

  const acomptePaye = (mesReservations.data ?? []).some((b) => b.type === "purchase_visit" && b.cautionStatus === "paid");
  const fractionneValide = (demandesFractionne.data ?? []).some((d) => d.status === "valide_admin" || d.status === "actif");
  const fractionneDemande = (demandesFractionne.data ?? []).length > 0;
  const loaActif = (contratsLoa.data ?? []).some((c) => c.status === "actif" || c.status === "signe");
  const loaSimulation = (contratsLoa.data ?? []).length > 0;

  const ETAPES = [
    {
      label: "Réserver un véhicule avec acompte",
      fait: acomptePaye,
      to: "/finance/acompte-finance",
    },
    {
      label: "Demander un paiement en plusieurs fois",
      fait: fractionneValide,
      enCours: fractionneDemande && !fractionneValide,
      to: "/finance/paiement-fractionne",
    },
    {
      label: "Souscrire une LOA",
      fait: loaActif,
      enCours: loaSimulation && !loaActif,
      to: "/finance/l-o-a-finance",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Parcours Finance</h1>
        <p className="mt-1 text-sm text-white/60">Où en es-tu sur chaque option de financement.</p>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir ton parcours finance.</p>
        ) : isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : (
          ETAPES.map((e) => {
            const Icon = e.fait ? Check : e.enCours ? Clock : Circle;
            return (
              <Link key={e.label} to={e.to} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <Icon size={14} className={e.fait ? "text-green-600" : e.enCours ? "text-amber-500" : "text-[#9CA3AF]"} />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">{e.label}</h3>
                  <p className="text-[9px] text-[#6B7280]">{e.fait ? "Terminé" : e.enCours ? "En cours" : "Pas encore commencé"}</p>
                </div>
                <ChevronRight size={14} className="text-[#9CA3AF]" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
