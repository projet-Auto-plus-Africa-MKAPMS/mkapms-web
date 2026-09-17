import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Check, Clock, AlertTriangle } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

function statutEcheance(paid: boolean, dueDate: string): "paid" | "en_retard" | "a_venir" {
  if (paid) return "paid";
  return new Date(dueDate).getTime() < Date.now() ? "en_retard" : "a_venir";
}

export default function CentreEcheancier() {
  const { user } = useAuth();
  const echeances = trpc.installments.mesEcheances.useQuery(undefined, { enabled: !!user });
  const contratsLoa = trpc.financeplus.mesContrats.useQuery(undefined, { enabled: !!user });

  const loa = (contratsLoa.data ?? []).filter((c) => c.type === "loa" && c.mensualite != null);
  const isLoading = echeances.isLoading || contratsLoa.isLoading;
  const vide = (echeances.data ?? []).length === 0 && loa.length === 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Échéancier</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir ton échéancier.</p>
        ) : isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : vide ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucune échéance enregistrée pour le moment.</p>
        ) : (
          <>
            {(echeances.data ?? []).map((e) => {
              const statut = statutEcheance(e.paid, e.dueDate);
              const Icon = statut === "paid" ? Check : statut === "en_retard" ? AlertTriangle : Clock;
              return (
                <div key={`fr-${e.id}`} className={`rounded-xl bg-white border-2 p-3 flex items-center gap-3 ${statut === "en_retard" ? "border-red-300" : "border-[#E5E7EB]"}`}>
                  <Icon size={14} className={statut === "paid" ? "text-green-600" : statut === "en_retard" ? "text-red-500" : "text-amber-500"} />
                  <div className="flex-1">
                    <h3 className="text-sm text-[#111]">Fractionné #{e.numero}</h3>
                    <p className="text-[9px] text-[#6B7280]">{new Date(e.dueDate).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className="text-sm font-bold">{Number(e.montant).toLocaleString("fr-FR")} €</span>
                </div>
              );
            })}
            {loa.map((c) => (
              <div key={`loa-${c.id}`} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <Calendar size={14} className="text-purple-600" />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">LOA {c.vehiculeMarque ?? ""} {c.vehiculeModele ?? ""}</h3>
                  <p className="text-[9px] text-[#6B7280]">Statut : {c.status}</p>
                </div>
                <span className="text-sm font-bold">{Number(c.mensualite).toLocaleString("fr-FR")} €/mois</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
