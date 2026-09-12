import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, LifeBuoy, Check } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

/* Données réelles : trpc.support (server/routers/support.ts, table
   supportTickets) — jamais un second centre de support inventé. */

const STATUT_LABEL: Record<string, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours de traitement",
  resolu: "Résolu",
  ferme: "Fermé",
};

export default function CentreSupportUtilisateur() {
  const { user } = useAuth();
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const mesTickets = trpc.support.myTickets.useQuery(undefined, { enabled: !!user });
  const faq = trpc.support.faq.useQuery();
  const submit = trpc.support.submit.useMutation({
    onSuccess: () => { setSujet(""); setMessage(""); mesTickets.refetch(); },
  });

  const envoyer = () => {
    if (!user || !sujet.trim() || !message.trim()) return;
    submit.mutate({ contactNom: user.name, contactEmail: user.email, sujet: sujet.trim(), message: message.trim() });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><LifeBuoy size={20} className="text-[#D4AF37]" /> Support</h1>
        <p className="mt-1 text-sm text-white/60">Contactez l'équipe MKA.P-MS</p>
      </div>

      {!user && (
        <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <Link to="/connexion" className="font-bold underline">Connectez-vous</Link> pour envoyer un message suivi dans votre compte.
        </div>
      )}

      {user && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Nouveau message</h3>
          <input
            type="text"
            placeholder="Sujet"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm"
          />
          <textarea
            placeholder="Votre message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm resize-none h-24"
          />
          <button
            onClick={envoyer}
            disabled={submit.isPending || !sujet.trim() || !message.trim()}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {submit.isPending ? "Envoi…" : "Envoyer"}
          </button>
          {submit.error && <p className="text-xs text-red-600 text-center">{submit.error.message}</p>}
        </div>
      )}

      {user && (mesTickets.data ?? []).length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-bold text-[#111]">Mes messages</h2>
          <div className="mt-2 space-y-2">
            {(mesTickets.data ?? []).map((t) => (
              <div key={t.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{t.sujet}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.status === "resolu" ? "text-green-600 bg-green-50" : "text-slate-600 bg-slate-100"}`}>
                    {t.status === "resolu" && <Check size={10} className="inline mr-0.5" />}
                    {STATUT_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">{t.message}</p>
                {t.response && (
                  <div className="mt-2 rounded-lg bg-[#F5F3EF] p-2">
                    <p className="text-[10px] font-bold text-[#111]">Réponse MKA.P-MS</p>
                    <p className="text-xs text-[#374151]">{t.response}</p>
                  </div>
                )}
                <p className="text-[10px] text-[#9CA3AF] mt-1">{new Date(t.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <h2 className="text-sm font-bold text-[#111]">Questions fréquentes</h2>
        <div className="mt-2 space-y-2">
          {(faq.data ?? []).map((f, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <h3 className="text-sm font-bold text-[#111]">{f.q}</h3>
              <p className="text-xs text-[#6B7280] mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
