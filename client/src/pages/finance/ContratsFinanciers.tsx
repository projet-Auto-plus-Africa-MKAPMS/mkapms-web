import { Link } from "react-router-dom";
import { ChevronLeft, FileText, Clock, CreditCard } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

export default function ContratsFinanciers() {
  const { user } = useAuth();
  const contratsLoa = trpc.financeplus.mesContrats.useQuery(undefined, { enabled: !!user });
  const demandesFractionne = trpc.installments.mine.useQuery(undefined, { enabled: !!user });

  const isLoading = contratsLoa.isLoading || demandesFractionne.isLoading;
  const vide = (contratsLoa.data ?? []).length === 0 && (demandesFractionne.data ?? []).length === 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Contrats financiers</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes contrats financiers.</p>
        ) : isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : vide ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucun contrat financier pour le moment.</p>
        ) : (
          <>
            {(contratsLoa.data ?? []).map((c) => (
              <Link key={`loa-${c.id}`} to={`/finance/l-o-a-finance`} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <Clock size={14} className="text-purple-600" />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">LOA {c.vehiculeMarque ?? ""} {c.vehiculeModele ?? ""}</h3>
                  <p className="text-[9px] text-[#6B7280]">Statut : {c.status} · {new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </Link>
            ))}
            {(demandesFractionne.data ?? []).map((d) => (
              <div key={`fr-${d.id}`} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <CreditCard size={14} className="text-blue-600" />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">Fractionné {d.nbEcheances}x — {Number(d.montantTotal).toLocaleString("fr-FR")} €</h3>
                  <p className="text-[9px] text-[#6B7280]">Statut : {d.status} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
