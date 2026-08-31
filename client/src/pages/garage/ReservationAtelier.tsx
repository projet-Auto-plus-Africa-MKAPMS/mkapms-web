import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const INTERVENTIONS = ["Révision", "Vidange", "Freinage", "Distribution", "Embrayage", "Climatisation", "Diagnostic", "Pneus"];
const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

export default function ReservationAtelier() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const prestation = params.get("prestation") ?? "";
  const [intervention, setIntervention] = useState<string | null>(prestation || null);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState("");

  const choix = prestation ? [prestation, ...INTERVENTIONS] : INTERVENTIONS;

  const demander = trpc.devis.create.useMutation({
    onSuccess: (d) => {
      setErreur("");
      setReference(`DEV-${d.id}`);
    },
    onError: (e) => {
      setReference("");
      setErreur(e.message);
    },
  });

  function envoyer() {
    if (!user) {
      setErreur("Connecte-toi pour réserver un passage à l'atelier.");
      return;
    }
    if (!intervention) {
      setErreur("Choisis l'intervention.");
      return;
    }
    if (!date || !creneau) {
      setErreur("Choisis la date et le créneau.");
      return;
    }
    demander.mutate({
      contactNom: user.name,
      contactEmail: user.email,
      contactTelephone: user.phone ?? undefined,
      typeIntervention: intervention,
      description: `Passage souhaité le ${date} à ${creneau}.`,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Réservation atelier</h1></div>

      {reference ? (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <p className="text-sm text-[#111]">Demande enregistrée sous la référence <span className="font-bold">{reference}</span> pour <span className="font-bold">{intervention}</span> le {date} à {creneau}.</p>
          <p className="mt-1 text-xs text-[#6B7280]">L'atelier confirme le créneau ; le règlement se fait sur place ou sur le devis une fois chiffré.</p>
          <Link to="/compte" className="mt-3 block rounded-xl bg-[#D4AF37] py-2.5 text-center text-sm font-bold text-white">Suivre ma demande</Link>
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Intervention</h3>
          <div className="flex flex-wrap gap-1.5">{choix.map(i => (<button key={i} onClick={() => setIntervention(i)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${intervention === i ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{i}</button>))}</div>
          <h3 className="text-sm font-bold text-[#111]">Date</h3>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
          <h3 className="text-sm font-bold text-[#111]">Créneau</h3>
          <div className="flex flex-wrap gap-1.5">{CRENEAUX.map(c => (<button key={c} onClick={() => setCreneau(c)} className={`rounded-lg px-3 py-2 text-xs font-bold ${creneau === c ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{c}</button>))}</div>
          {erreur && <p className="text-xs text-red-600">{erreur}</p>}
          <button
            onClick={envoyer}
            disabled={demander.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
          >
            {demander.isPending && <Loader2 size={14} className="animate-spin" />}
            {demander.isPending ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      )}
    </div>
  );
}
