import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck, CheckCircle, Car, AlertTriangle,
  Search, FileText, Clock, Globe, History, ChevronLeft, X, ArrowRight,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

/**
 * Historique véhicule (page publique /historique).
 *
 * Avant ce correctif, cet écran simulait un parcours d'achat complet et
 * mentait sur trois points graves : un paiement "Stripe" confirmé sans
 * aucun appel de paiement réel, un véhicule détecté figé en dur ("Renault
 * Clio IV 2019") quelle que soit la plaque/le VIN saisi, et un score de
 * fiabilité tiré au hasard (Math.random()). Des statistiques sociales
 * inventées ("+ 537 842 rapports générés", "4,8/5 sur 12 684 avis",
 * "garantie satisfait ou remboursé") étaient aussi affichées en dur.
 *
 * Ce qui existe réellement et que cet écran utilise désormais :
 *  - identification technique réelle via trpc.annonces.lookupPlate (API
 *    externe + repli base locale), déjà en production ailleurs
 *    (client/src/pages/HistoriqueVehiculeVente.tsx) ;
 *  - demande de rapport réelle et tracée (server/routers/historique.ts,
 *    table vehicle_reports) : statut en_attente / pret / echec.
 * Ce qui reste réellement absent, et n'est jamais simulé ici : aucun
 * paiement n'est prélevé (server/schema vehicle_report_payments existe
 * mais n'est câblé nulle part), et aucun moteur ne remplit encore
 * automatiquement vol/gage/sinistres — une demande reste "en attente"
 * jusqu'à traitement humain, jamais présentée comme un rapport déjà établi.
 */

type SearchMode = "plate" | "vin" | "foreign";
type VehicleType = "voiture" | "moto" | "scooter" | "utilitaire" | "camion";

const CAR_IMAGES = ["/hero/car_hero_1.jpg", "/hero/car_hero_2.jpg", "/hero/car_hero_3.jpg"];

const STATUT_RAPPORT: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente de traitement", color: "text-amber-600 bg-amber-50" },
  pret: { label: "Rapport prêt", color: "text-green-600 bg-green-50" },
  echec: { label: "Rapport indisponible", color: "text-red-600 bg-red-50" },
};

/** Exemple fictif à titre illustratif — étiqueté comme tel, jamais confondu avec un vrai rapport. */
function ModalExempleComplet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111]">Exemple de rapport (illustration)</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition"><X size={14} /></button>
        </div>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="rounded-xl bg-[#F8F9FA] p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Identité véhicule</p>
            <p className="text-sm font-extrabold text-[#111]">RENAULT CLIO IV — 1.5 dCi 90 cv</p>
            <p className="text-xs text-slate-500">2019 · Voiture · AA-123-BB</p>
          </div>
          {[
            { label: "Kilométrage", value: "128 450 km" },
            { label: "Contrôles techniques", value: "Valide jusqu'au 12/2025" },
            { label: "Sinistres", value: "Aucun sinistre déclaré" },
            { label: "Propriétaires", value: "2 propriétaires" },
            { label: "Entretien", value: "12 entretiens trouvés" },
            { label: "Rappels constructeur", value: "Aucun rappel en cours" },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-xl bg-[#F8F9FA] px-3 py-2.5">
              <span className="text-xs text-slate-500">{r.label}</span>
              <span className="text-xs font-bold text-[#111]">{r.value}</span>
            </div>
          ))}
          <p className="text-[9px] text-slate-400 italic text-center">Exemple fictif à titre illustratif. Chaque demande réelle est traitée individuellement ; une donnée non vérifiée est écrite "non disponible", jamais estimée.</p>
        </div>
        <button onClick={onClose} className="mt-4 w-full rounded-2xl bg-[#D4AF37] py-3 text-sm font-bold text-white hover:bg-[#C5A028] transition">Fermer</button>
      </div>
    </div>
  );
}

export default function Historique() {
  const { user } = useAuth();
  const [carIndex, setCarIndex] = useState(0);
  const [showExemple, setShowExemple] = useState(false);

  const [searchMode, setSearchMode] = useState<SearchMode>("plate");
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("voiture");
  const [country, setCountry] = useState("France");
  const [recherche, setRecherche] = useState(false);

  const searchVal = searchMode === "vin" ? vin : plaque;

  const lookup = trpc.annonces.lookupPlate.useQuery(
    { type: searchMode === "vin" ? "vin" : "plaque", query: searchVal.trim() },
    { enabled: recherche && searchMode !== "foreign" && searchVal.trim().length >= 4 },
  );
  const mesRapports = trpc.historique.myReports.useQuery(undefined, { enabled: !!user });
  const demanderRapport = trpc.historique.requestReport.useMutation({ onSuccess: () => mesRapports.refetch() });

  useEffect(() => {
    const t = setInterval(() => setCarIndex((i) => (i + 1) % CAR_IMAGES.length), 4000);
    return () => clearInterval(t);
  }, []);

  const rechercher = () => {
    if (searchVal.trim().length < 4) return;
    setRecherche(true);
    if (searchMode !== "foreign") lookup.refetch();
  };

  const demander = () => {
    if (searchVal.trim().length < 4) return;
    demanderRapport.mutate({ searchType: searchMode === "vin" ? "vin" : "plate", searchValue: searchVal.trim() });
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {showExemple && <ModalExempleComplet onClose={() => setShowExemple(false)} />}

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0D0D] via-[#111111] to-[#1A1A1A] min-h-[420px]">
        <div className="absolute inset-0">
          {CAR_IMAGES.map((src, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === carIndex ? "opacity-30" : "opacity-0"}`}>
              <img src={src} alt="" className="h-full w-full object-cover object-center" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-transparent" />
        </div>
        <div className="container-page relative py-10 lg:py-14">
          <Link to="/" className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/50 hover:text-white transition">
            <ChevronLeft size={10} /> Accueil
          </Link>
          <div className="mb-5 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5">
              <History size={12} className="text-[#D4AF37]" />
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Historique véhicule</span>
            </div>
          </div>
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Vérifiez l'historique<br />de votre futur<br /><span className="italic text-[#D4AF37]">véhicule</span>
            </h1>
            <p className="mt-4 text-sm text-white/60 leading-relaxed max-w-md mx-auto">
              Identification technique immédiate. Le rapport détaillé (sinistres, contrôles techniques, entretien) est une demande réelle traitée par notre équipe — pas un fichier généré instantanément.
            </p>
          </div>
        </div>
      </section>

      {/* ── RECHERCHE ── */}
      <section className="bg-white py-6 border-b border-[#F5F5F5]">
        <div className="container-page">
          <div className="rounded-2xl border-2 border-[#E5E7EB] bg-white p-5 shadow-sm max-w-2xl mx-auto">
            <div className="flex gap-2 mb-4">
              {([
                { id: "plate" as const, label: "Par plaque" },
                { id: "vin" as const, label: "Par VIN" },
                { id: "foreign" as const, label: "Immatriculation étrangère" },
              ]).map((t) => (
                <button key={t.id} onClick={() => { setSearchMode(t.id); setRecherche(false); }}
                  className={`rounded-xl px-4 py-2 text-[10px] font-bold transition ${searchMode === t.id ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/20" : "border border-[#E5E7EB] text-[#111] hover:border-[#D4AF37]/30"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {searchMode !== "vin" ? (
              <div className="flex items-center gap-2 rounded-xl border-2 border-[#D4AF37] bg-white px-3 py-2.5">
                <span className="flex h-8 w-6 shrink-0 items-center justify-center rounded-sm bg-blue-700 text-[9px] font-bold text-white">F</span>
                <input
                  className="w-full bg-transparent text-center text-base font-extrabold text-[#111] outline-none placeholder-slate-300 tracking-widest"
                  placeholder="AA - 123 - BB"
                  value={plaque}
                  onChange={(e) => { setPlaque(e.target.value.toUpperCase()); setRecherche(false); }}
                />
              </div>
            ) : (
              <input
                className="w-full rounded-xl border-2 border-[#E5E7EB] focus:border-[#D4AF37] px-4 py-3 text-sm text-[#111] outline-none transition font-mono tracking-wider"
                placeholder="Numéro VIN (17 caractères)"
                value={vin}
                onChange={(e) => { setVin(e.target.value.toUpperCase()); setRecherche(false); }}
              />
            )}

            {searchMode === "foreign" && (
              <select className="mt-3 w-full rounded-xl border-2 border-[#E5E7EB] focus:border-[#D4AF37] px-4 py-3 text-sm outline-none transition" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option>France</option><option>Belgique</option><option>Allemagne</option><option>Espagne</option><option>Italie</option><option>Autre</option>
              </select>
            )}

            <div className="mt-3">
              <label className="text-[10px] font-bold text-[#111] uppercase tracking-wide">Type de véhicule</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["voiture", "moto", "scooter", "utilitaire", "camion"] as const).map((t) => (
                  <button key={t} onClick={() => setVehicleType(t)}
                    className={`rounded-xl px-3 py-2 text-[10px] font-bold capitalize transition ${vehicleType === t ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-slate-600 hover:bg-[#E5E7EB]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={rechercher}
              disabled={searchVal.trim().length < 4 || lookup.isFetching}
              className="mt-4 mx-auto flex items-center gap-2 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white hover:bg-[#C5A028] disabled:opacity-40 transition shadow-lg shadow-[#D4AF37]/20 whitespace-nowrap"
            >
              <Search size={16} /> {lookup.isFetching ? "Recherche…" : "IDENTIFIER LE VÉHICULE"}
            </button>

            <div className="mt-4 flex flex-wrap justify-center gap-4 text-[9px] text-slate-400">
              <span className="flex items-center gap-1"><Globe size={9} className="text-[#D4AF37]" /> Identification technique en direct</span>
              <span className="flex items-center gap-1"><Clock size={9} className="text-[#D4AF37]" /> Rapport détaillé traité par notre équipe</span>
              <button onClick={() => setShowExemple(true)} className="underline hover:text-[#D4AF37]">Voir un exemple</button>
            </div>
          </div>

          {/* ── RÉSULTAT DE L'IDENTIFICATION ── */}
          {recherche && searchMode !== "foreign" && !lookup.isFetching && !lookup.data && (
            <div className="mx-auto mt-4 max-w-2xl rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
              Aucune information technique trouvée pour cette recherche. Vous pouvez tout de même demander un rapport détaillé ci-dessous.
            </div>
          )}

          {recherche && (searchMode === "foreign" || !lookup.isFetching) && (
            <div className="mx-auto mt-4 max-w-2xl space-y-3">
              {searchMode !== "foreign" && lookup.data && (
                <div className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
                  <Car size={20} className="text-[#D4AF37]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#111]">{[lookup.data.marque, lookup.data.modele].filter(Boolean).join(" ") || "Véhicule identifié"}{lookup.data.annee ? ` — ${lookup.data.annee}` : ""}</h3>
                    <p className="text-[10px] text-[#6B7280]">{[lookup.data.carburant, lookup.data.boite, lookup.data.puissance ? `${lookup.data.puissance} ch` : null].filter(Boolean).join(" · ") || "Détails techniques non disponibles"}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <div className="bg-[#111] px-4 py-2">
                  <h3 className="text-xs font-bold text-[#D4AF37] flex items-center gap-2"><FileText size={12} /> Rapport détaillé</h3>
                </div>
                <div className="px-4 py-3 text-xs text-[#6B7280] space-y-2">
                  <p>Sinistres, contrôles techniques, propriétaires, entretien, rappels constructeur. Chaque demande est enregistrée puis traitée : ce n'est pas un fichier généré instantanément. Le vol et le gage ne font partie d'aucun champ vérifié aujourd'hui.</p>
                  {user ? (
                    <button
                      onClick={demander}
                      disabled={demanderRapport.isPending}
                      className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <FileText size={14} /> {demanderRapport.isPending ? "Envoi…" : "Demander le rapport détaillé"} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <p><Link to="/connexion" className="font-bold text-[#D4AF37] underline">Connectez-vous</Link> pour demander un rapport et suivre son traitement.</p>
                  )}
                  {demanderRapport.isSuccess && (
                    <p className="flex items-center gap-1.5 text-green-700 font-semibold"><CheckCircle size={12} /> Demande enregistrée — statut « en attente de traitement » dans « Mes demandes » ci-dessous.</p>
                  )}
                  {demanderRapport.error && <p className="text-red-600">{demanderRapport.error.message}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── MES DEMANDES ── */}
      {user && (mesRapports.data ?? []).length > 0 && (
        <section className="bg-[#F9F9F9] py-8">
          <div className="container-page max-w-2xl mx-auto">
            <h2 className="text-sm font-bold text-[#111] flex items-center gap-2"><ShieldCheck size={14} className="text-[#D4AF37]" /> Mes demandes de rapport</h2>
            <div className="mt-3 space-y-2">
              {(mesRapports.data ?? []).map((r) => {
                const s = STATUT_RAPPORT[r.status] ?? STATUT_RAPPORT.en_attente;
                return (
                  <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#111]">{r.searchType === "plate" ? "Plaque" : "VIN"} : {r.searchValue}</h3>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                    </div>
                    {r.status === "pret" && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-[#374151]">
                        <p><span className="text-[#9CA3AF]">Kilométrage :</span> {r.kilometrage != null ? `${r.kilometrage.toLocaleString("fr-FR")} km` : "Non disponible"}</p>
                        <p><span className="text-[#9CA3AF]">Contrôles techniques :</span> {r.controlesTechniques || "Non disponible"}</p>
                        <p><span className="text-[#9CA3AF]">Sinistres :</span> {r.sinistres || "Non disponible"}</p>
                        <p><span className="text-[#9CA3AF]">Propriétaires :</span> {r.proprietaires || "Non disponible"}</p>
                        <p><span className="text-[#9CA3AF]">Entretien :</span> {r.entretien || "Non disponible"}</p>
                        <p><span className="text-[#9CA3AF]">Rappels :</span> {r.rappelsConstructeur || "Non disponible"}</p>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-[#9CA3AF]">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SIGNALEMENT ── */}
      <section className="bg-white py-8 border-t border-[#F5F5F5]">
        <div className="container-page max-w-2xl mx-auto text-center">
          <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <AlertTriangle size={14} className="text-orange-400" /> Un problème avec un rapport ou une annonce ? <Link to="/aide" className="font-bold text-[#D4AF37] underline">Contactez-nous</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
