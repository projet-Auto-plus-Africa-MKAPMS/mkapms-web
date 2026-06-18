import { Link } from "react-router-dom";
import { ChevronLeft, Building2, Star, Users, BarChart3, Package, Shield, ChevronRight, Check, Eye } from "lucide-react";

const AVANTAGES = [
  { label: "Visibilité premium", desc: "Vos annonces mises en avant auprès de milliers d'acheteurs", icon: Eye },
  { label: "Gestion de stock", desc: "Gérez tout votre parc depuis votre tableau de bord", icon: Package },
  { label: "Multi-employés", desc: "Ajoutez vos commerciaux et gestionnaires", icon: Users },
  { label: "Statistiques avancées", desc: "Vues, clics, messages, taux de conversion", icon: BarChart3 },
  { label: "Badge vérifié", desc: "Renforcez la confiance des acheteurs", icon: Shield },
  { label: "Facturation auto", desc: "Factures et TVA générées automatiquement", icon: Star },
];

const ABONNEMENTS = [
  { nom: "Pro Start", prix: 29, annonces: 10, photos: 5, options: ["Badge pro", "Messagerie"] },
  { nom: "Pro Premium", prix: 79, annonces: 50, photos: 15, options: ["Badge pro", "Messagerie", "Stats", "Boost x2"] },
  { nom: "Pro Elite", prix: 149, annonces: 200, photos: 30, options: ["Badge pro", "Messagerie", "Stats", "Boost x5", "Multi-employés", "API"] },
  { nom: "Pro Business", prix: 299, annonces: -1, photos: 50, options: ["Tout inclus", "Illimité", "Conseiller dédié", "API", "Multi-sites"] },
];

export default function EspaceProVente() {
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
            <div key={a.nom} className={`rounded-xl bg-white border-2 overflow-hidden ${i === 1 ? "border-blue-600" : "border-[#E5E7EB]"}`}>
              {i === 1 && <div className="bg-blue-600 px-3 py-1 text-center text-[10px] font-bold text-white">Le plus populaire</div>}
              <div className="p-4">
                <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-[#111]">{a.nom}</h3><span className="text-lg font-black text-blue-800">{a.prix} €<span className="text-xs font-normal text-[#6B7280]">/mois</span></span></div>
                <div className="mt-2 flex gap-3 text-[10px] text-[#6B7280]"><span>{a.annonces === -1 ? "Illimité" : a.annonces} annonces</span><span>{a.photos} photos/annonce</span></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.options.map((o) => (<span key={o} className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-semibold text-blue-700"><Check size={8} /> {o}</span>))}
                </div>
                <button className={`mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white active:scale-[0.98] transition ${i === 1 ? "bg-blue-600" : "bg-blue-800"}`}>Choisir {a.nom}</button>
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
