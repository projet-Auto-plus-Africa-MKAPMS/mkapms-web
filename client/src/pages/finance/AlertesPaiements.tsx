import { Link } from "react-router-dom";
import { ChevronLeft, Bell, AlertTriangle } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const NIVEAU_LABEL: Record<string, string> = {
  j1: "Rappel — échéance dans 1 jour",
  j3: "Rappel — échéance dans 3 jours",
  j7: "Rappel — échéance dans 7 jours",
  impaye: "Impayé",
};

export default function AlertesPaiements() {
  const { user } = useAuth();
  const alertesFractionne = trpc.installments.mesAlertes.useQuery(undefined, { enabled: !!user });
  const notificationsFinancePlus = trpc.financeplus.mesNotifications.useQuery(undefined, { enabled: !!user });

  const isLoading = alertesFractionne.isLoading || notificationsFinancePlus.isLoading;
  const vide = (alertesFractionne.data ?? []).length === 0 && (notificationsFinancePlus.data ?? []).length === 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Alertes paiements</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes alertes.</p>
        ) : isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : vide ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucune alerte de paiement pour le moment.</p>
        ) : (
          <>
            {(alertesFractionne.data ?? []).map((a) => (
              <div key={`fr-${a.id}`} className={`rounded-xl bg-white border-2 p-3 flex items-center gap-3 ${a.level === "impaye" ? "border-red-300" : "border-amber-200"}`}>
                <AlertTriangle size={14} className={a.level === "impaye" ? "text-red-500" : "text-amber-500"} />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">{NIVEAU_LABEL[a.level] ?? a.level}</h3>
                  <p className="text-[9px] text-[#6B7280]">{new Date(a.createdAt).toLocaleDateString("fr-FR")}{a.note ? ` · ${a.note}` : ""}</p>
                </div>
              </div>
            ))}
            {(notificationsFinancePlus.data ?? []).map((n) => (
              <div key={`fp-${n.id}`} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <Bell size={14} className="text-[#D4AF37]" />
                <div className="flex-1">
                  <h3 className="text-sm text-[#111]">{n.titre ?? "Notification Finance+"}</h3>
                  <p className="text-[9px] text-[#6B7280]">{n.message} · {new Date(n.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
