import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, AlertCircle, Send, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const LIBELLE_STATUT: Record<string, { texte: string; classe: string }> = {
  ouvert: { texte: "Ouvert", classe: "bg-red-50 text-red-600" },
  en_cours: { texte: "En cours", classe: "bg-amber-50 text-amber-600" },
  resolu: { texte: "Résolu", classe: "bg-green-50 text-green-600" },
  ferme: { texte: "Fermé", classe: "bg-[#F5F3EF] text-[#6B7280]" },
};

const PREFIXE_OBJET = "Réclamation garage — ";

export default function CentreReclamations() {
  const { user } = useAuth();
  const [objet, setObjet] = useState("");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState("");
  const [erreur, setErreur] = useState("");

  const utils = trpc.useUtils();
  const mesTickets = trpc.support.myTickets.useQuery(undefined, { enabled: !!user });
  const envoyer = trpc.support.submit.useMutation({
    onSuccess: (r) => {
      setObjet("");
      setMessage("");
      setErreur("");
      setEnvoye(`Réclamation enregistrée sous le numéro ${r.id}. Le service client la traite.`);
      utils.support.myTickets.invalidate();
    },
    onError: (e) => {
      setEnvoye("");
      setErreur(e.message);
    },
  });

  const reclamations = (mesTickets.data ?? []).filter((t) =>
    t.sujet.startsWith(PREFIXE_OBJET),
  );

  function soumettre() {
    if (!user) {
      setErreur("Connecte-toi pour déposer une réclamation suivie.");
      return;
    }
    if (!objet.trim() || !message.trim()) {
      setErreur("L'objet et la description sont obligatoires.");
      return;
    }
    envoyer.mutate({
      contactNom: user.name,
      contactEmail: user.email,
      sujet: `${PREFIXE_OBJET}${objet.trim()}`,
      message: message.trim(),
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><AlertCircle size={20} className="text-[#D4AF37]" /> Réclamations</h1></div>

      <div className="px-4 mt-4 space-y-2">
        {mesTickets.isLoading && (
          <p className="text-xs text-[#6B7280]">Chargement de tes réclamations…</p>
        )}
        {!user && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
            Connecte-toi pour voir tes réclamations et en déposer une nouvelle.
          </p>
        )}
        {user && !mesTickets.isLoading && reclamations.length === 0 && (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
            Aucune réclamation déposée.
          </p>
        )}
        {reclamations.map((r) => {
          const statut = LIBELLE_STATUT[r.status] ?? LIBELLE_STATUT.ouvert;
          return (
            <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex justify-between gap-2">
                <h3 className="text-sm font-bold text-[#111]">
                  {r.sujet.slice(PREFIXE_OBJET.length)}
                </h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${statut.classe}`}>
                  {statut.texte}
                </span>
              </div>
              <p className="text-[9px] text-[#6B7280] mt-0.5">
                REC-{String(r.id).padStart(3, "0")} ·{" "}
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : ""}
              </p>
              <p className="mt-1 text-[11px] text-[#374151] whitespace-pre-line">{r.message}</p>
              {r.response && (
                <p className="mt-2 rounded-lg bg-[#F5F3EF] p-2 text-[11px] text-[#111]">
                  <span className="font-bold">Réponse : </span>{r.response}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[#111]">Nouvelle réclamation</h3>
        {erreur && <p className="text-xs font-semibold text-red-600">{erreur}</p>}
        {envoye && <p className="text-xs font-semibold text-green-700">{envoye}</p>}
        <input
          type="text"
          value={objet}
          onChange={(e) => setObjet(e.target.value)}
          placeholder="Objet…"
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez le problème…"
          className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm h-20"
        />
        <button
          onClick={soumettre}
          disabled={envoyer.isPending}
          className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {envoyer.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {envoyer.isPending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
