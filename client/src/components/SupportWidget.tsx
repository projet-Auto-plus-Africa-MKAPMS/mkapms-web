import { useState } from "react";
import { Mail, X, Send } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const STATUS_LABELS: Record<string, string> = {
  ouvert: "Ouvert",
  en_cours: "En cours",
  resolu: "Résolu",
  ferme: "Fermé",
};

export default function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const utils = trpc.useUtils();
  const myTickets = trpc.support.myTickets.useQuery(undefined, { enabled: open && !!user });
  const submit = trpc.support.submit.useMutation({
    onSuccess: () => {
      setSujet("");
      setMessage("");
      setSent(true);
      if (user) utils.support.myTickets.invalidate();
      setTimeout(() => setSent(false), 4000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit.mutate({
      contactNom: user?.name || nom,
      contactEmail: user?.email || email,
      sujet,
      message,
    });
  }

  return (
    <>
      <button
        aria-label="Contacter la plateforme"
        onClick={() => setOpen(true)}
        className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand"
      >
        <Mail size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Mail size={16} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800">Contacter MKA.P-MS</p>
                  <p className="text-[11px] text-slate-400">Notre équipe vous répond rapidement</p>
                </div>
              </div>
              <button
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-3">
              {user && myTickets.data && myTickets.data.length > 0 && (
                <div className="mb-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Mes échanges
                  </p>
                  {myTickets.data.map((t) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{t.sujet}</p>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {STATUS_LABELS[t.status] ?? t.status}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{t.message}</p>
                      {t.response && (
                        <div className="mt-2 rounded-lg border-l-2 border-brand bg-white p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-brand">
                            Réponse MKA.P-MS
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-700">{t.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Nouveau message
                </p>
                {!user && (
                  <>
                    <input
                      className="input"
                      placeholder="Votre nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                    <input
                      className="input"
                      type="email"
                      placeholder="Votre email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </>
                )}
                <input
                  className="input"
                  placeholder="Sujet (ex : question sur une annonce)"
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  required
                />
                <textarea
                  className="input min-h-[90px]"
                  placeholder="Votre message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                {sent && (
                  <p className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    Message envoyé ! Notre équipe vous répondra rapidement.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submit.isPending}
                  className="btn-primary inline-flex w-full items-center justify-center gap-2"
                >
                  <Send size={16} />
                  {submit.isPending ? "Envoi…" : "Envoyer"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
