/**
 * MKA.P-MS Investisseur — application dédiée (5e variante mobile,
 * com.mkapms.investor, chemin /investissement).
 *
 * Distinct du « Mode Investisseurs » interne masqué (routes /investisseurs/*,
 * tableau de bord de croissance pour investisseurs en capital) — sans
 * rapport, jamais touché ici. Cette page consomme le vrai moteur
 * server/investment/ (trpc.investment.*), jamais une donnée simulée : un
 * compte sans investissement voit un dashboard vide et honnête, jamais un
 * chiffre inventé.
 */
import { useState } from "react";
import { LayoutDashboard, Wallet, FileText, Banknote, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Dashboard } from "./modules/Dashboard";
import { MesInvestissements } from "./modules/MesInvestissements";
import { Ledger } from "./modules/Ledger";
import { Versements } from "./modules/Versements";
import { Assistant } from "./modules/Assistant";
import { Kyc } from "./modules/Kyc";

type Onglet = "dashboard" | "investissements" | "ledger" | "versements" | "assistant" | "kyc";

const ONGLETS: { cle: Onglet; label: string; icon: typeof LayoutDashboard }[] = [
  { cle: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { cle: "investissements", label: "Mes investissements", icon: FileText },
  { cle: "ledger", label: "Revenus", icon: Wallet },
  { cle: "versements", label: "Versements", icon: Banknote },
  { cle: "assistant", label: "Assistant", icon: Sparkles },
  { cle: "kyc", label: "Vérification", icon: ShieldCheck },
];

export default function EspaceInvestissement() {
  const { user } = useAuth();
  const [onglet, setOnglet] = useState<Onglet>("dashboard");

  if (!user) {
    return (
      <div className="container-page py-16 text-center text-slate-500">
        Connectez-vous pour accéder à votre espace Investisseur MKA.P-MS.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-20">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white">MKA.P-MS Investisseur</h1>
        <p className="mt-1 text-sm text-white/60">Droit économique temporaire — univers, pays, durée, contrat.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#E5E7EB] bg-white px-2 py-2">
        {ONGLETS.map((o) => {
          const Icon = o.icon;
          const actif = onglet === o.cle;
          return (
            <button
              key={o.cle}
              onClick={() => setOnglet(o.cle)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                actif ? "bg-[#111] text-white" : "text-[#6B7280] hover:bg-[#F5F3EF]"
              }`}
            >
              <Icon size={14} /> {o.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-4">
        {onglet === "dashboard" && <Dashboard />}
        {onglet === "investissements" && <MesInvestissements />}
        {onglet === "ledger" && <Ledger />}
        {onglet === "versements" && <Versements />}
        {onglet === "assistant" && <Assistant />}
        {onglet === "kyc" && <Kyc />}
      </div>
    </div>
  );
}
