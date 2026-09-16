import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, Calendar, MapPin, Loader2, Star } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import { useCurrency } from "../../lib/currency";

// Créneaux proposés à titre indicatif : la demande reste soumise à
// confirmation humaine du garage (voir le message de succès plus bas),
// jamais présentée comme une disponibilité en temps réel.
const CRENEAUX = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function PriseRendezVous() {
  const { user } = useAuth();
  const { country } = useCurrency();
  const [searchParams] = useSearchParams();
  const typeIntervention = searchParams.get("type")?.trim() || "Rendez-vous atelier";
  const [garageId, setGarageId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [creneau, setCreneau] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState("");

  // Garages réels et validés (server/routers/garages.ts::list) — jamais une liste inventée.
  const garages = trpc.garages.list.useQuery({ country: country || undefined, limit: 20 });
  const garageChoisi = garages.data?.items.find(g => g.id === garageId);

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

  function confirmer() {
    if (!user) {
      setErreur("Connecte-toi pour prendre un rendez-vous suivi.");
      return;
    }
    if (!garageChoisi) {
      setErreur("Choisis un garage.");
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
      typeIntervention,
      description: `Rendez-vous demandé chez ${garageChoisi.name} le ${date} à ${creneau}.`,
      ville: garageChoisi.city ?? undefined,
      codePostal: garageChoisi.postalCode ?? undefined,
      pays: garageChoisi.country ?? undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Rendez-vous</h1></div>

      {reference ? (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
          <p className="text-sm text-[#111]">Rendez-vous demandé sous la référence <span className="font-bold">{reference}</span> chez <span className="font-bold">{garageChoisi?.name}</span> le {date} à {creneau}.</p>
          <p className="mt-1 text-xs text-[#6B7280]">Le garage confirme le créneau — tu reçois une notification dès sa réponse.</p>
          <Link to="/compte" className="mt-3 block rounded-xl bg-[#D4AF37] py-2.5 text-center text-sm font-bold text-white">Suivre mon rendez-vous</Link>
        </div>
      ) : (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Choisir un garage</h3>
          {garages.isLoading ? (
            <p className="text-sm text-[#6B7280]">Chargement des garages…</p>
          ) : (garages.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-[#6B7280]">Aucun garage validé disponible pour l'instant.</p>
          ) : (
            garages.data!.items.map(g => (
              <button key={g.id} onClick={() => setGarageId(g.id)} className={`w-full rounded-lg p-3 flex items-center gap-2 border-2 ${garageId === g.id ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                <MapPin size={14} className={garageId === g.id ? "text-[#D4AF37]" : "text-[#9CA3AF]"} />
                <span className="flex-1 text-left text-sm text-[#111]">{g.name}{g.city ? ` — ${g.city}` : ""}</span>
                {Number(g.rating) > 0 && <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF]"><Star size={11} className="fill-[#D4AF37] text-[#D4AF37]" /> {Number(g.rating).toFixed(1)}</span>}
              </button>
            ))
          )}
          <h3 className="text-sm font-bold text-[#111] pt-2">Date</h3>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm" />
          <h3 className="text-sm font-bold text-[#111]">Créneau souhaité</h3>
          <div className="flex flex-wrap gap-1.5">{CRENEAUX.map(c => (<button key={c} onClick={() => setCreneau(c)} className={`rounded-lg px-3 py-2 text-xs font-bold ${creneau === c ? "bg-[#D4AF37] text-white" : "bg-[#F5F3EF] text-[#111]"}`}>{c}</button>))}</div>
          {erreur && <p className="text-xs text-red-600">{erreur}</p>}
          <button
            onClick={confirmer}
            disabled={demander.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
          >
            {demander.isPending && <Loader2 size={14} className="animate-spin" />}
            {demander.isPending ? "Envoi…" : "Confirmer le rendez-vous"}
          </button>
        </div>
      )}
    </div>
  );
}
