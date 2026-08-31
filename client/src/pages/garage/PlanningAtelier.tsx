/**
 * Planning atelier — rendez-vous réellement enregistrés des garages du compte.
 *
 * L'écran affichait cinq rendez-vous inventés (mécaniciens, durées, clients) :
 * un atelier ne peut pas travailler sur un planning qui ne vient pas de sa
 * base. Les trois actions passent par le Moteur de boutons et écrivent
 * réellement côté serveur (étape d'intervention, report de date).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, ChevronDown, Clock, User } from "lucide-react";
import { BoutonMoteur } from "../../lib/boutonMoteur";
import { trpc } from "../../lib/trpc";

const LIBELLES_STATUT: Record<string, string> = {
  en_attente: "En attente",
  planifiee: "Planifié",
  accueil: "Réceptionné",
  diagnostic: "Diagnostic",
  devis_envoye: "Devis envoyé",
  en_reparation: "En réparation",
  controle_qualite: "Contrôle qualité",
  pret: "Prêt",
  termine: "Terminé",
  annulee: "Annulé",
  confirme: "Confirmé",
};

function heure(d: string | Date): string {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function jour(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function PlanningAtelier() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [nouvelleDate, setNouvelleDate] = useState("");
  const [motif, setMotif] = useState("");
  const [message, setMessage] = useState("");

  const planning = trpc.garages.planningAtelier.useQuery(undefined, { retry: false });

  const etape = trpc.garages.updateIntervention.useMutation({
    onSuccess: () => {
      setMessage("Étape enregistrée : le client est prévenu et voit l'avancement.");
      planning.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  const reporter = trpc.garages.reporterRdv.useMutation({
    onSuccess: (r) => {
      setMessage(
        `Rendez-vous déplacé au ${new Date(r.dateHeure).toLocaleString("fr-FR")} : le client a été prévenu du report et du motif.`,
      );
      setNouvelleDate("");
      setMotif("");
      planning.refetch();
    },
    onError: (e) => setMessage(e.message),
  });

  const rdvs = planning.data?.rdvs ?? [];
  const garages = planning.data?.garages ?? [];

  const stats = useMemo(() => {
    const debut = new Date();
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 1);
    const aujourdhui = rdvs.filter((r) => {
      const d = new Date(r.dateHeure).getTime();
      return d >= debut.getTime() && d < fin.getTime();
    }).length;
    const enCours = rdvs.filter((r) =>
      ["accueil", "diagnostic", "en_reparation", "controle_qualite"].includes(String(r.status)),
    ).length;
    return { aujourdhui, enCours };
  }, [rdvs]);

  function envoyerEtape(rdvId: number, status: "en_reparation" | "pret") {
    etape.mutate({
      rdvId,
      status,
      detail:
        status === "en_reparation"
          ? "Intervention commencée à l'atelier."
          : "Véhicule prêt : vous pouvez venir le récupérer.",
    });
  }

  function envoyerReport(rdvId: number) {
    if (!nouvelleDate) {
      setMessage("Choisissez la nouvelle date et heure : un report sans créneau ne prévient de rien.");
      return;
    }
    if (motif.trim().length < 3) {
      setMessage("Indiquez le motif du report : le client le reçoit avec la nouvelle date.");
      return;
    }
    reporter.mutate({ rdvId, nouvelleDate: new Date(nouvelleDate).toISOString(), motif: motif.trim() });
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Garage
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Calendar size={20} className="text-[#D4AF37]" /> Planning atelier
        </h1>
        <p className="mt-1 text-sm text-white/60">
          {garages.length > 0
            ? `${garages.map((g) => g.name).join(", ")} — rendez-vous enregistrés`
            : "Rendez-vous enregistrés de vos garages"}
        </p>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-[#D4AF37]">{stats.aujourdhui}</p>
          <p className="text-[9px] text-[#6B7280]">RDV aujourd'hui</p>
        </div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
          <p className="text-lg font-black text-green-600">{stats.enCours}</p>
          <p className="text-[9px] text-[#6B7280]">En cours</p>
        </div>
      </div>

      {message && (
        <p className="mx-4 mb-3 rounded-lg bg-white border border-[#E5E7EB] p-2 text-[11px] text-[#374151]">
          {message}
        </p>
      )}

      {planning.isLoading && (
        <p className="px-4 text-xs text-[#6B7280]">Chargement du planning…</p>
      )}

      {planning.isError && (
        <p className="mx-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800">
          Planning indisponible : {planning.error.message}
        </p>
      )}

      {!planning.isLoading && !planning.isError && garages.length === 0 && (
        <p className="mx-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
          Aucun garage n'est rattaché à votre compte : créez d'abord votre fiche garage, le planning est tenu par
          garage.
        </p>
      )}

      {!planning.isLoading && garages.length > 0 && rdvs.length === 0 && (
        <p className="mx-4 rounded-xl bg-white border border-[#E5E7EB] p-4 text-xs text-[#6B7280]">
          Aucun rendez-vous enregistré pour l'instant. Rien n'est affiché ici qui ne vienne de vos rendez-vous
          réels.
        </p>
      )}

      <div className="px-4 space-y-2">
        {rdvs.map((r) => {
          const isExp = expanded === r.id;
          const enCours = ["accueil", "diagnostic", "en_reparation", "controle_qualite"].includes(
            String(r.status),
          );
          return (
            <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isExp ? null : r.id)}
                className="w-full text-left p-3 flex items-center gap-3"
              >
                <span className="text-sm font-black text-[#D4AF37] w-12">{heure(r.dateHeure)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111] truncate">
                    {r.motif || `Rendez-vous ${r.type}`}
                  </h3>
                  <p className="text-[9px] text-[#6B7280]">
                    {jour(r.dateHeure)} · RDV-{r.id}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${enCours ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}
                >
                  {LIBELLES_STATUT[String(r.status)] ?? String(r.status)}
                </span>
                <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
              </button>

              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1">
                      <User size={10} className="text-[#D4AF37]" />
                      <div>
                        <span className="text-[#6B7280]">Client</span>
                        <p className="font-bold text-[#111]">#{r.clientId}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1">
                      <Clock size={10} className="text-[#D4AF37]" />
                      <div>
                        <span className="text-[#6B7280]">Type</span>
                        <p className="font-bold text-[#111]">{r.type}</p>
                      </div>
                    </div>
                  </div>
                  {r.notes && <p className="mt-2 text-[10px] text-[#6B7280]">{r.notes}</p>}

                  <div className="flex gap-2 mt-2">
                    <BoutonMoteur
                      code="garage_planning_commencer"
                      className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white text-center"
                      onExecuter={() => envoyerEtape(r.id, "en_reparation")}
                    >
                      {etape.isPending ? "Enregistrement…" : "Commencer"}
                    </BoutonMoteur>
                    <BoutonMoteur
                      code="garage_planning_pret"
                      className="flex-1 rounded-lg bg-green-600 py-1.5 text-[9px] font-bold text-white text-center"
                      onExecuter={() => envoyerEtape(r.id, "pret")}
                    >
                      Véhicule prêt
                    </BoutonMoteur>
                  </div>

                  <div className="mt-3 rounded-lg bg-[#F5F3EF] p-2 space-y-2">
                    <label className="text-[10px] font-bold text-[#111]">Reporter ce rendez-vous</label>
                    <input
                      type="datetime-local"
                      value={nouvelleDate}
                      onChange={(e) => setNouvelleDate(e.target.value)}
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-[11px]"
                    />
                    <input
                      type="text"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder="Motif du report (reçu par le client)"
                      className="w-full rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-[11px]"
                    />
                    <BoutonMoteur
                      code="garage_planning_reporter"
                      className="block w-full rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] text-center"
                      onExecuter={() => envoyerReport(r.id)}
                    >
                      {reporter.isPending ? "Report en cours…" : "Reporter"}
                    </BoutonMoteur>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
