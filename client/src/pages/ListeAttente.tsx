import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellRing, ChevronLeft, Clock, X, AlertCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   LISTE D'ATTENTE
   Données réelles : trpc.waitlist.list/cancel (server/routers/waitlist.ts).
   La position affichée est toujours recalculée en direct (rang réel parmi
   les inscriptions "en_attente" antérieures sur la même annonce).

   Le statut "disponible" de l'ancienne maquette n'a pas d'équivalent réel :
   aucune annonce de location n'est aujourd'hui marquée indisponible/louée
   par le code existant (aucun moteur de verrou de disponibilité/calendrier
   n'existe encore — tâches #44/#56). Retiré plutôt qu'imité : cette page
   n'affiche donc que ce qui est vérifiable — une vraie inscription, une
   vraie position, une vraie annulation.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_CONFIG = {
  en_attente: { label: "En attente", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  annule: { label: "Annulé", color: "text-[#6B7280]", bg: "bg-[#F3F4F6]", icon: X },
};

export default function ListeAttente() {
  const [tab, setTab] = useState<"tous" | "en_attente" | "annule">("tous");
  const utils = trpc.useUtils();
  const listQ = trpc.waitlist.list.useQuery();
  const cancel = trpc.waitlist.cancel.useMutation({ onSuccess: () => utils.waitlist.list.invalidate() });

  const entries = listQ.data ?? [];
  const filtered = tab === "tous" ? entries : entries.filter((a) => a.status === tab);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><BellRing size={20} className="text-[#D4AF37]" /> Liste d'attente</h1>
        <p className="mt-1 text-sm text-white/60">Vos inscriptions sur des véhicules de location</p>
      </div>

      {/* Info */}
      <div className="mx-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={14} className="text-[#D4AF37] mt-0.5 shrink-0" />
          <p className="text-xs text-[#111]"><span className="font-bold">Comment ça marche :</span> Depuis la fiche d'un véhicule de location, rejoignez la liste d'attente. Votre position est calculée en temps réel selon l'ordre d'inscription.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2">
        {([["tous", "Toutes"], ["en_attente", "En attente"], ["annule", "Annulées"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${tab === id ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>{label}</button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {listQ.isLoading && <p className="text-center text-xs text-[#9CA3AF] py-8">Chargement…</p>}
        {filtered.map((a) => {
          const s = STATUT_CONFIG[a.status];
          const SIcon = s.icon;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <div className="flex gap-3 p-4">
                {a.photo && <img src={a.photo} alt={a.annonce?.titre ?? ""} className="w-24 h-16 rounded-lg object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">{a.annonce?.titre ?? `Annonce #${a.annonceId}`}</h3>
                  <p className="text-[10px] text-[#6B7280]">{a.annonce?.marque} {a.annonce?.modele}{a.annonce?.prixJour ? ` · ${a.annonce.prixJour} €/jour` : ""}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color} ${s.bg}`}>
                    <SIcon size={10} /> {s.label}
                  </span>
                </div>
              </div>
              {a.status === "en_attente" && (
                <div className="px-4 pb-3 flex gap-2">
                  <div className="flex-1 rounded-lg bg-[#F5F3EF] px-3 py-2">
                    <p className="text-[9px] text-[#6B7280]">Position</p>
                    <p className="text-sm font-bold text-[#111]">#{a.position}</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-[#F5F3EF] px-3 py-2">
                    <p className="text-[9px] text-[#6B7280]">Inscrit le</p>
                    <p className="text-sm font-bold text-[#111]">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate({ id: a.id })}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!listQ.isLoading && filtered.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Bell size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune alerte</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Parcourez les véhicules de location et rejoignez une liste d'attente depuis leur fiche</p>
        </div>
      )}
    </div>
  );
}
