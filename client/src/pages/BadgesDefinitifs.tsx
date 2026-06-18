import { Link } from "react-router-dom";
import { ChevronLeft, Award, Shield, Star, Crown, Zap, Trophy, Users } from "lucide-react";

const BADGES = [
  { nom: "PRO", couleur: "#3B82F6", bg: "bg-blue-500", icon: Shield, desc: "Professionnel vérifié avec documents validés", conditions: ["KBIS/SIRET validé", "Identité vérifiée", "Abonnement Pro actif"] },
  { nom: "PRO PREMIUM", couleur: "#D4AF37", bg: "bg-[#D4AF37]", icon: Crown, desc: "Professionnel avec visibilité supérieure", conditions: ["Abonnement Premium actif", "Min. 10 ventes/locations", "Note ≥ 4.5/5", "Aucune réclamation majeure"] },
  { nom: "PRO ELITE", couleur: "#111", bg: "bg-[#111]", icon: Star, desc: "Meilleur statut professionnel MKA.P-MS", conditions: ["Abonnement Elite actif", "Min. 50 ventes/locations", "Note ≥ 4.8/5", "Partenaire depuis 6+ mois", "Zéro fraude"] },
  { nom: "VÉRIFIÉ", couleur: "#10B981", bg: "bg-green-500", icon: Shield, desc: "Identité et documents vérifiés par MKA.P-MS", conditions: ["Identité vérifiée par IA + humain", "Tous documents validés"] },
  { nom: "ANNONCE URGENTE", couleur: "#EF4444", bg: "bg-red-500", icon: Zap, desc: "Annonce mise en avant avec priorité maximale", conditions: ["Option payante activée", "Annonce validée", "Supplément 15 €/semaine"] },
  { nom: "TOP VENDEUR", couleur: "#8B5CF6", bg: "bg-purple-500", icon: Trophy, desc: "Vendeur avec les meilleures performances", conditions: ["Min. 20 ventes/mois", "Note ≥ 4.7/5", "Taux réponse ≥ 95%", "Délai livraison respecté"] },
  { nom: "PARTENAIRE OFFICIEL", couleur: "#14B8A6", bg: "bg-teal-500", icon: Users, desc: "Partenaire stratégique du réseau MKA.P-MS", conditions: ["Partenariat signé", "Respect normes MKA.P-MS", "Audit qualité validé"] },
];

export default function BadgesDefinitifs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Award size={22} className="text-[#D4AF37]" /> Badges MKA.P-MS</h1>
        <p className="mt-1 text-xs text-white/50">Système de badges définitif · Attribution auto ou manuelle</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        {BADGES.map(b => { const Icon = b.icon; return (
          <div key={b.nom} className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F3F4F6]">
              <div className={`h-10 w-10 rounded-xl ${b.bg} flex items-center justify-center`}><Icon size={18} className="text-white" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-[#111]">{b.nom}</p>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: b.couleur }}>{b.nom}</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{b.desc}</p>
              </div>
            </div>
            <div className="px-4 py-2.5 space-y-1">
              <p className="text-[9px] font-bold text-[#6B7280] uppercase">Conditions d'obtention</p>
              {b.conditions.map(c => (
                <div key={c} className="flex items-center gap-1.5"><div className="h-1 w-1 rounded-full" style={{ backgroundColor: b.couleur }} /><span className="text-[10px] text-[#374151]">{c}</span></div>
              ))}
            </div>
          </div>); })}
      </div>
    </div>
  );
}
