import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Mail, Send, Users } from "lucide-react";
import { trpc } from "../../lib/trpc";

/**
 * PDG — Campagnes e-mail (lettre d'information).
 *
 * La base d'abonnés consentants (newsletterSubscribers) et l'envoi
 * transactionnel (server/services/email.ts) existaient déjà séparément ;
 * rien ne les reliait avant server/services/campaign-engine.ts. Jamais
 * d'envoi en un seul geste : la création ne fait qu'enregistrer un brouillon
 * et compter l'audience réelle ; l'envoi est une deuxième action explicite,
 * confirmée ici par un window.confirm nommant le nombre réel de destinataires.
 */
export default function AdminCampagnesEmail() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const [form, setForm] = useState({ subject: "", message: "", pays: "" });
  const audienceQuery = trpc.marketing.campaignAudience.useQuery({ pays: form.pays || undefined });
  const listQuery = trpc.marketing.campaignList.useQuery();

  const createM = trpc.marketing.campaignCreate.useMutation({
    onSuccess: () => { showToast("Brouillon enregistré."); setForm({ subject: "", message: "", pays: "" }); listQuery.refetch(); },
    onError: (e) => showToast(e.message),
  });
  const sendM = trpc.marketing.campaignConfirmSend.useMutation({
    onSuccess: (r) => { showToast(r.started ? `Envoi lancé vers ${r.recipients} destinataire(s).` : "Cette campagne a déjà été envoyée."); listQuery.refetch(); },
    onError: (e) => showToast(e.message),
  });

  const statusLabel: Record<string, string> = { draft: "Brouillon", sending: "Envoi en cours…", sent: "Envoyée" };
  const statusTone: Record<string, string> = { draft: "text-slate-600 bg-slate-100", sending: "text-amber-600 bg-amber-50", sent: "text-green-600 bg-green-50" };

  return (
    <div className="min-h-screen bg-[#0a0a14] pb-24">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl">{toast}</div>}
      <div className="bg-gradient-to-r from-[#1a0f3c] to-[#0d0820] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Mail size={20} className="text-purple-400" /> Campagnes e-mail</h1>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">Nouvelle campagne</h2>
          <div className="space-y-2">
            <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Objet de l'e-mail" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30 min-h-[120px]" placeholder="Message (un saut de ligne = un paragraphe)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <input className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/30" placeholder="Pays (optionnel, ex. FR — vide = tous pays)" maxLength={2} value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value.toUpperCase() })} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/50">
            <Users size={12} />
            {audienceQuery.isLoading ? "Comptage de l'audience…" : `${audienceQuery.data?.recipients ?? 0} abonné(s) consentant(s) recevront cet e-mail.`}
          </div>
          <button
            className="mt-3 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            disabled={createM.isPending || !form.subject.trim() || !form.message.trim()}
            onClick={() => createM.mutate({ subject: form.subject.trim(), message: form.message.trim(), pays: form.pays || undefined })}
          >
            {createM.isPending ? "Enregistrement…" : "Enregistrer le brouillon"}
          </button>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider mb-3">Campagnes ({listQuery.data?.length ?? 0})</h2>
          {listQuery.data?.length === 0 && <p className="text-xs text-white/40">Aucune campagne pour l'instant.</p>}
          <div className="space-y-2">
            {listQuery.data?.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">{c.subject}</p>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${statusTone[c.status] ?? "text-slate-600 bg-slate-100"}`}>{statusLabel[c.status] ?? c.status}</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">{c.pays ?? "Tous pays"} — {c.totalRecipients} destinataire(s) prévu(s){c.status === "sent" ? ` · ${c.totalSent} envoyé(s), ${c.totalFailed} échoué(s)` : ""}</p>
                {c.status === "draft" && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Envoyer cette campagne à ${c.totalRecipients} destinataire(s) réel(s) maintenant ? Cette action ne peut pas être annulée.`)) {
                        sendM.mutate({ campaignId: c.id });
                      }
                    }}
                    disabled={sendM.isPending}
                    className="mt-2 rounded-lg bg-purple-600 px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send size={10} /> Envoyer maintenant
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
