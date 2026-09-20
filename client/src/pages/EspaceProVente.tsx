import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Building2, Star, Users, BarChart3, Package, Shield, Eye, Check } from "lucide-react";
import { useCurrency } from "../lib/currency";
import { getPlansByCategory } from "@shared/plans";

const AVANTAGES = [
  { label: "Visibilité premium", desc: "Vos annonces mises en avant auprès de milliers d'acheteurs", icon: Eye },
  { label: "Gestion de stock", desc: "Gérez tout votre parc depuis votre tableau de bord", icon: Package },
  { label: "Multi-employés", desc: "Ajoutez vos commerciaux et gestionnaires", icon: Users },
  { label: "Statistiques avancées", desc: "Vues, clics, messages, taux de conversion", icon: BarChart3 },
  { label: "Badge vérifié", desc: "Renforcez la confiance des acheteurs", icon: Shield },
  { label: "Facturation auto", desc: "Factures et TVA générées automatiquement", icon: Star },
];

/**
 * Les tarifs affichés ici doivent être ceux réellement facturés (Stripe lit
 * @shared/plans, pas cette page) : un catalogue local aurait pu diverger en
 * silence, comme c'était le cas avant (29/79/149/299 € affichés ici alors que
 * les offres réelles sont à 49/89/149/249 €).
 */
const ABONNEMENTS = getPlansByCategory("pro_vente");

export default function EspaceProVente() {
  const navigate = useNavigate();
  const { format: formatPrice } = useCurrency();
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5">
        <Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Vente</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} /> Espace Professionnels</h1>
        <p className="mt-1 text-sm text-white/80">Garages, marchands, concessionnaires : vendez sur MKA.P-MS</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {AVANTAGES.map((a) => { const Icon = a.icon; return (
          <div key={a.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50"><Icon size={16} className="text-blue-700" /></div>
            <div><h3 className="text-sm font-bold text-[#111]">{a.label}</h3><p className="text-[10px] text-[#6B7280]">{a.desc}</p></div>
          </div>
        ); })}
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-[#111]">Abonnements Vente</h2>
        <div className="mt-3 space-y-3">
          {ABONNEMENTS.map((a, i) => (
            <div key={a.code} className={`rounded-xl bg-white border-2 overflow-hidden ${a.highlight ? "border-blue-600" : "border-[#E5E7EB]"}`}>
              {a.highlight && <div className="bg-blue-600 px-3 py-1 text-center text-[10px] font-bold text-white">Le plus populaire</div>}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#111]">{a.label}</h3>
                  <span className="text-lg font-black text-blue-800">
                    {a.priceEur == null ? "Sur devis" : <>{formatPrice(a.priceEur)}<span className="text-xs font-normal text-[#6B7280]">/mois</span></>}
                  </span>
                </div>
                <div className="mt-2 flex gap-3 text-[10px] text-[#6B7280]">
                  <span>{a.quotas.maxAnnonces == null ? "Illimité" : a.quotas.maxAnnonces} annonces</span>
                  {a.quotas.maxPhotos != null && <span>{a.quotas.maxPhotos} photos/annonce</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.features.slice(0, 4).map((o) => (<span key={o} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-blue-700"><Check size={8} /> {o}</span>))}
                </div>
                <button
                  onClick={() => navigate(`/abonnements?categorie=pro_vente`)}
                  className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white active:scale-[0.98] transition ${i === 1 ? "bg-blue-600" : "bg-blue-800"}`}
                >
                  Choisir {a.label}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <Link to="/acheter/inscription-pro" className="block w-full rounded-xl bg-[#111] py-4 text-center text-base font-extrabold text-[#D4AF37] active:scale-[0.98] transition">
          Devenir professionnel MKA.P-MS
        </Link>
      </div>
    </div>
  );
}
