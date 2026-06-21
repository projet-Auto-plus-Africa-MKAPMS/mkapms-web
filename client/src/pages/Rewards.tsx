import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Star, Award, Gift, Shield, TrendingUp,
  ChevronRight, CheckCircle, AlertTriangle, Lock, Users,
  ShoppingBag, Car, Home as HomeIcon, Wrench, Camera,
  MessageSquare, UserPlus, Zap, Crown, Diamond, Medal,
  BarChart3, History, Info,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   MKA.P-MS REWARDS — SYSTEME DE FIDELITE OFFICIEL V1
   ═══════════════════════════════════════════════════════════ */

type RewardsTab = "accueil" | "gagner" | "depenser" | "niveaux" | "historique" | "regles";

const NIVEAUX = [
  { id: "bronze", label: "Bronze", min: 0, max: 999, color: "from-amber-700 to-amber-900", textColor: "text-amber-700", bgColor: "bg-amber-700", icon: Medal, desc: "Nouveau membre" },
  { id: "argent", label: "Argent", min: 1000, max: 4999, color: "from-slate-400 to-slate-600", textColor: "text-slate-500", bgColor: "bg-slate-500", icon: Shield, desc: "Membre actif" },
  { id: "or", label: "Or", min: 5000, max: 14999, color: "from-[#D4AF37] to-[#B8960C]", textColor: "text-[#D4AF37]", bgColor: "bg-[#D4AF37]", icon: Star, desc: "Membre fidele" },
  { id: "platine", label: "Platine", min: 15000, max: 49999, color: "from-purple-500 to-purple-800", textColor: "text-purple-500", bgColor: "bg-purple-600", icon: Crown, desc: "Membre premium" },
  { id: "diamant", label: "Diamant", min: 50000, max: Infinity, color: "from-cyan-400 to-blue-600", textColor: "text-cyan-500", bgColor: "bg-cyan-500", icon: Diamond, desc: "Membre elite" },
];

interface PointAction {
  action: string;
  points: number;
  categorie: string;
  icon: typeof Star;
  condition?: string;
}

const ACTIONS_GAGNER: PointAction[] = [
  { action: "Annonce publiee", points: 0, categorie: "Depot annonce", icon: ShoppingBag, condition: "Points attribues apres 30 jours actifs" },
  { action: "Annonce active 30 jours", points: 50, categorie: "Depot annonce", icon: ShoppingBag },
  { action: "Annonce active 60 jours", points: 100, categorie: "Depot annonce", icon: ShoppingBag },
  { action: "Annonce vendue", points: 250, categorie: "Depot annonce", icon: ShoppingBag },
  { action: "Annonce vendue via MKA.P-MS", points: 500, categorie: "Depot annonce", icon: ShoppingBag },

  { action: "Achat confirme", points: 300, categorie: "Achat vehicule", icon: Car },
  { action: "Achat avec acompte plateforme", points: 500, categorie: "Achat vehicule", icon: Car },
  { action: "Achat vehicule MKA.P-MS", points: 750, categorie: "Achat vehicule", icon: Car },

  { action: "Location realisee", points: 100, categorie: "Location", icon: Car },
  { action: "Location superieure a 7 jours", points: 200, categorie: "Location", icon: Car },
  { action: "Location superieure a 30 jours", points: 500, categorie: "Location", icon: Car },

  { action: "Devis accepte", points: 50, categorie: "Garage", icon: Wrench },
  { action: "Facture reglee", points: 100, categorie: "Garage", icon: Wrench },
  { action: "Entretien enregistre dans le Dossier", points: 150, categorie: "Garage", icon: Wrench },

  { action: "Ajout d'une facture", points: 20, categorie: "Historique vehicule", icon: History },
  { action: "Ajout d'un controle technique", points: 20, categorie: "Historique vehicule", icon: History },
  { action: "Ajout d'un entretien", points: 30, categorie: "Historique vehicule", icon: History },

  { action: "Avis valide", points: 30, categorie: "Avis clients", icon: MessageSquare },
  { action: "Photo ajoutee", points: 20, categorie: "Avis clients", icon: Camera },
  { action: "Video ajoutee", points: 50, categorie: "Avis clients", icon: Camera },

  { action: "Inscription validee (filleul)", points: 200, categorie: "Parrainage", icon: UserPlus },
  { action: "Premier achat du filleul", points: 500, categorie: "Parrainage", icon: UserPlus },
  { action: "Premier abonnement du filleul", points: 1000, categorie: "Parrainage", icon: UserPlus },
];

interface RecompenseOption {
  points: number;
  recompense: string;
  desc: string;
  icon: typeof Star;
}

const RECOMPENSES: RecompenseOption[] = [
  { points: 500, recompense: "1 photo supplementaire gratuite", desc: "Ajoutez une photo en plus sur votre annonce", icon: Camera },
  { points: 1000, recompense: "Pack photos gratuit", desc: "Pack de 5 photos supplementaires", icon: Camera },
  { points: 2000, recompense: "Boost 7 jours gratuit", desc: "Votre annonce en tete pendant 7 jours", icon: Zap },
  { points: 5000, recompense: "Boost 30 jours gratuit", desc: "Votre annonce en tete pendant 30 jours", icon: Zap },
  { points: 10000, recompense: "Premium Particulier gratuit", desc: "Abonnement Premium Particulier pendant 1 mois", icon: Crown },
  { points: 15000, recompense: "Reduction publicite", desc: "50% de reduction sur votre prochaine publicite", icon: Star },
  { points: 20000, recompense: "Reduction abonnement professionnel", desc: "25% de reduction sur un abonnement pro", icon: Award },
];

const REGLES_ANTI_ABUS = [
  { regle: "Suppression annonce avant 30 jours", consequence: "Aucun point attribue", icon: AlertTriangle },
  { regle: "Annonce supprimee puis recreee", consequence: "Aucun point attribue", icon: AlertTriangle },
  { regle: "Avis frauduleux detecte", consequence: "Points retires + avertissement", icon: Shield },
  { regle: "Comptes multiples detectes", consequence: "Blocage complet des recompenses", icon: Lock },
  { regle: "Manipulation du systeme de parrainage", consequence: "Suspension du compte", icon: AlertTriangle },
];

const HISTORIQUE_DEMO = [
  { date: "09/06/2026", action: "Annonce vendue via MKA.P-MS", points: 500, type: "gain" as const },
  { date: "08/06/2026", action: "Avis valide", points: 30, type: "gain" as const },
  { date: "07/06/2026", action: "Boost 7 jours utilise", points: -2000, type: "depense" as const },
  { date: "05/06/2026", action: "Facture reglee (garage)", points: 100, type: "gain" as const },
  { date: "03/06/2026", action: "Annonce active 30 jours", points: 50, type: "gain" as const },
  { date: "01/06/2026", action: "Achat confirme", points: 300, type: "gain" as const },
  { date: "28/05/2026", action: "Photo ajoutee (avis)", points: 20, type: "gain" as const },
  { date: "25/05/2026", action: "1 photo supplementaire utilisee", points: -500, type: "depense" as const },
  { date: "20/05/2026", action: "Inscription filleul validee", points: 200, type: "gain" as const },
  { date: "15/05/2026", action: "Location realisee", points: 100, type: "gain" as const },
];

export default function Rewards() {
  const [activeTab, setActiveTab] = useState<RewardsTab>("accueil");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const userPoints = 3250;
  const currentLevel = NIVEAUX.find((n) => userPoints >= n.min && userPoints <= n.max) || NIVEAUX[0];
  const nextLevel = NIVEAUX[NIVEAUX.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel ? Math.round(((userPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100) : 100;

  const categories = [...new Set(ACTIONS_GAGNER.map((a) => a.categorie))];

  const TABS: { id: RewardsTab; label: string; icon: typeof Star }[] = [
    { id: "accueil", label: "Accueil", icon: HomeIcon },
    { id: "gagner", label: "Gagner", icon: TrendingUp },
    { id: "depenser", label: "Depenser", icon: Gift },
    { id: "niveaux", label: "Niveaux", icon: Award },
    { id: "historique", label: "Historique", icon: History },
    { id: "regles", label: "Regles", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Accueil</Link>
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${currentLevel.color}`}>
            <currentLevel.icon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">MKA.P-MS REWARDS</h1>
            <p className="text-xs text-white/50">Systeme de fidelite officiel</p>
          </div>
        </div>

        {/* Points summary */}
        <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-3xl font-black text-[#D4AF37]">{userPoints.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-white/40">Points MKA disponibles</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${currentLevel.bgColor} text-white`}>
                <currentLevel.icon size={12} /> {currentLevel.label}
              </span>
              {nextLevel && (
                <p className="text-[10px] text-white/30 mt-1">{nextLevel.min - userPoints} pts pour {nextLevel.label}</p>
              )}
            </div>
          </div>
          {nextLevel && (
            <div className="w-full rounded-full bg-white/10 h-2">
              <div className={`h-2 rounded-full bg-gradient-to-r ${currentLevel.color}`} style={{ width: `${progressToNext}%` }} />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold transition flex items-center gap-1.5 ${activeTab === t.id ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-slate-600"}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* ═══ ACCUEIL ═══ */}
        {activeTab === "accueil" && (<>
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <p className="text-lg font-black text-[#D4AF37]">{HISTORIQUE_DEMO.filter((h) => h.type === "gain").reduce((s, h) => s + h.points, 0).toLocaleString("fr-FR")}</p>
              <p className="text-[9px] text-slate-400">Points gagnes</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <p className="text-lg font-black text-red-500">{Math.abs(HISTORIQUE_DEMO.filter((h) => h.type === "depense").reduce((s, h) => s + h.points, 0)).toLocaleString("fr-FR")}</p>
              <p className="text-[9px] text-slate-400">Points utilises</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center">
              <p className="text-lg font-black text-[#111]">{currentLevel.label}</p>
              <p className="text-[9px] text-slate-400">Niveau actuel</p>
            </div>
          </div>

          {/* Comment gagner */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[#D4AF37]" /> Comment gagner des points</h3>
            <div className="space-y-2">
              {[
                { label: "Vendez un vehicule via MKA.P-MS", pts: "+500 pts", icon: Car },
                { label: "Achetez un vehicule", pts: "+300 pts", icon: ShoppingBag },
                { label: "Parrainez un ami", pts: "+200 pts", icon: UserPlus },
                { label: "Laissez un avis", pts: "+30 pts", icon: MessageSquare },
              ].map((a) => (
                <button key={a.label} onClick={() => setActiveTab("gagner")} className="w-full flex items-center gap-3 rounded-lg bg-[#F5F3EF] p-3 text-left hover:bg-[#D4AF37]/10 transition">
                  <a.icon size={16} className="text-[#D4AF37] shrink-0" />
                  <span className="flex-1 text-xs text-[#111]">{a.label}</span>
                  <span className="text-xs font-bold text-[#D4AF37]">{a.pts}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Recompenses disponibles */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><Gift size={16} className="text-[#D4AF37]" /> Recompenses disponibles</h3>
            <div className="space-y-2">
              {RECOMPENSES.filter((r) => r.points <= userPoints).map((r) => (
                <button key={r.recompense} onClick={() => { setActiveTab("depenser"); }} className="w-full flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3 text-left hover:bg-green-100 transition">
                  <r.icon size={16} className="text-green-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#111]">{r.recompense}</p>
                    <p className="text-[10px] text-slate-400">{r.points} pts</p>
                  </div>
                  <CheckCircle size={14} className="text-green-500" />
                </button>
              ))}
              {RECOMPENSES.filter((r) => r.points <= userPoints).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-3">Continuez a accumuler des points !</p>
              )}
            </div>
          </div>

          {/* Activite recente */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><History size={16} className="text-[#D4AF37]" /> Activite recente</h3>
            {HISTORIQUE_DEMO.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-[#F5F3EF] last:border-0">
                <span className="text-[10px] text-slate-400 w-20 shrink-0">{h.date}</span>
                <span className="flex-1 text-xs text-[#111]">{h.action}</span>
                <span className={`text-xs font-bold ${h.type === "gain" ? "text-green-600" : "text-red-500"}`}>{h.type === "gain" ? "+" : ""}{h.points}</span>
              </div>
            ))}
            <button onClick={() => setActiveTab("historique")} className="mt-2 w-full rounded-lg bg-[#F5F3EF] py-2 text-xs font-bold text-[#D4AF37] text-center">Voir tout l'historique</button>
          </div>
        </>)}

        {/* ═══ GAGNER DES POINTS ═══ */}
        {activeTab === "gagner" && (<>
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-center">
            <TrendingUp size={28} className="text-[#D4AF37] mx-auto mb-2" />
            <h2 className="text-lg font-black text-white">Gagnez des Points MKA</h2>
            <p className="text-xs text-white/50 mt-1">Chaque action validee rapporte des points</p>
          </div>

          {categories.map((cat) => {
            const actions = ACTIONS_GAGNER.filter((a) => a.categorie === cat);
            const isOpen = openCategory === cat;
            const CatIcon = actions[0].icon;
            return (
              <div key={cat} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setOpenCategory(isOpen ? null : cat)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                    <CatIcon size={18} className="text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111]">{cat}</p>
                    <p className="text-[10px] text-slate-400">{actions.length} actions · Jusqu'a +{Math.max(...actions.map((a) => a.points))} pts</p>
                  </div>
                  <ChevronRight size={14} className={`text-slate-400 transition ${isOpen ? "rotate-90" : ""}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-[#E5E7EB] px-4 pb-3 space-y-1">
                    {actions.map((a) => (
                      <div key={a.action} className="flex items-center gap-3 py-2 border-b border-[#F5F3EF] last:border-0">
                        <span className="flex-1 text-xs text-[#111]">{a.action}</span>
                        <span className={`text-xs font-bold ${a.points > 0 ? "text-[#D4AF37]" : "text-slate-400"}`}>{a.points > 0 ? `+${a.points}` : "0"} pts</span>
                      </div>
                    ))}
                    {actions.some((a) => a.condition) && (
                      <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                        <p className="text-[10px] text-amber-700 flex items-start gap-1"><Info size={10} className="mt-0.5 shrink-0" /> {actions.find((a) => a.condition)?.condition}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>)}

        {/* ═══ DEPENSER DES POINTS ═══ */}
        {activeTab === "depenser" && (<>
          <div className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] p-4 text-center">
            <Gift size={28} className="text-white mx-auto mb-2" />
            <h2 className="text-lg font-black text-white">Utilisez vos Points MKA</h2>
            <p className="text-xs text-white/70 mt-1">Solde actuel : {userPoints.toLocaleString("fr-FR")} points</p>
          </div>

          {RECOMPENSES.map((r) => {
            const canAfford = userPoints >= r.points;
            return (
              <div key={r.recompense} className={`rounded-xl bg-white border p-4 ${canAfford ? "border-green-300" : "border-[#E5E7EB]"}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${canAfford ? "bg-green-100" : "bg-slate-100"}`}>
                    <r.icon size={18} className={canAfford ? "text-green-600" : "text-slate-400"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111]">{r.recompense}</p>
                    <p className="text-[10px] text-slate-400">{r.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${canAfford ? "text-[#D4AF37]" : "text-slate-400"}`}>{r.points.toLocaleString("fr-FR")} pts</p>
                  </div>
                </div>
                <button
                  disabled={!canAfford}
                  onClick={() => showToast(`Recompense "${r.recompense}" utilisee ! ${r.points} points deduits.`)}
                  className={`mt-3 w-full rounded-lg py-2.5 text-xs font-bold transition ${canAfford ? "bg-[#D4AF37] text-white hover:bg-[#c9a430]" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                >
                  {canAfford ? "Utiliser cette recompense" : `${(r.points - userPoints).toLocaleString("fr-FR")} pts manquants`}
                </button>
              </div>
            );
          })}
        </>)}

        {/* ═══ NIVEAUX ═══ */}
        {activeTab === "niveaux" && (<>
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4 text-center">
            <Award size={28} className="text-[#D4AF37] mx-auto mb-2" />
            <h2 className="text-lg font-black text-white">Niveaux Utilisateurs</h2>
            <p className="text-xs text-white/50 mt-1">Badge special visible sur votre profil</p>
          </div>

          {NIVEAUX.map((n) => {
            const isCurrentLevel = n.id === currentLevel.id;
            const isReached = userPoints >= n.min;
            return (
              <div key={n.id} className={`rounded-xl border p-4 ${isCurrentLevel ? "bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border-[#D4AF37]" : isReached ? "bg-white border-green-200" : "bg-white border-[#E5E7EB]"}`}>
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${n.color}`}>
                    <n.icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#111]">{n.label}</p>
                      {isCurrentLevel && <span className="rounded-full bg-[#D4AF37] px-2 py-0.5 text-[8px] font-bold text-white">ACTUEL</span>}
                      {isReached && !isCurrentLevel && <CheckCircle size={14} className="text-green-500" />}
                      {!isReached && <Lock size={14} className="text-slate-300" />}
                    </div>
                    <p className="text-[10px] text-slate-400">{n.desc}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.min.toLocaleString("fr-FR")} — {n.max === Infinity ? "+" : n.max.toLocaleString("fr-FR")} points</p>
                  </div>
                </div>
              </div>
            );
          })}
        </>)}

        {/* ═══ HISTORIQUE ═══ */}
        {activeTab === "historique" && (<>
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h3 className="text-sm font-bold text-[#111] mb-3 flex items-center gap-2"><History size={16} className="text-[#D4AF37]" /> Historique complet</h3>
            <div className="space-y-1">
              {HISTORIQUE_DEMO.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 py-2.5 px-2 rounded-lg ${h.type === "gain" ? "bg-green-50/50" : "bg-red-50/50"} border-b border-[#F5F3EF] last:border-0`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${h.type === "gain" ? "bg-green-100" : "bg-red-100"}`}>
                    {h.type === "gain" ? <TrendingUp size={14} className="text-green-600" /> : <Gift size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[#111]">{h.action}</p>
                    <p className="text-[10px] text-slate-400">{h.date}</p>
                  </div>
                  <span className={`text-sm font-black ${h.type === "gain" ? "text-green-600" : "text-red-500"}`}>{h.type === "gain" ? "+" : ""}{h.points.toLocaleString("fr-FR")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totaux */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
              <p className="text-lg font-black text-green-600">+{HISTORIQUE_DEMO.filter((h) => h.type === "gain").reduce((s, h) => s + h.points, 0).toLocaleString("fr-FR")}</p>
              <p className="text-[10px] text-green-700">Total gagne</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
              <p className="text-lg font-black text-red-500">{HISTORIQUE_DEMO.filter((h) => h.type === "depense").reduce((s, h) => s + h.points, 0).toLocaleString("fr-FR")}</p>
              <p className="text-[10px] text-red-700">Total utilise</p>
            </div>
          </div>
        </>)}

        {/* ═══ REGLES ANTI-ABUS ═══ */}
        {activeTab === "regles" && (<>
          <div className="rounded-xl bg-gradient-to-r from-red-600 to-red-800 p-4 text-center">
            <Shield size={28} className="text-white mx-auto mb-2" />
            <h2 className="text-lg font-black text-white">Regles Anti-Abus</h2>
            <p className="text-xs text-white/70 mt-1">Toutes les recompenses sont verifiees automatiquement</p>
          </div>

          {REGLES_ANTI_ABUS.map((r) => (
            <div key={r.regle} className="rounded-xl bg-white border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 shrink-0">
                  <r.icon size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111]">{r.regle}</p>
                  <p className="text-xs text-red-600 mt-1 font-semibold">{r.consequence}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2"><Info size={14} /> Important</h4>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li className="flex items-start gap-2"><CheckCircle size={10} className="mt-0.5 shrink-0 text-amber-500" /> Le systeme recompense les utilisateurs fideles et actifs.</li>
              <li className="flex items-start gap-2"><CheckCircle size={10} className="mt-0.5 shrink-0 text-amber-500" /> Les particuliers peuvent financer leurs services grace a leur activite.</li>
              <li className="flex items-start gap-2"><CheckCircle size={10} className="mt-0.5 shrink-0 text-amber-500" /> Les professionnels reduisent leurs couts grace a leur engagement.</li>
              <li className="flex items-start gap-2"><CheckCircle size={10} className="mt-0.5 shrink-0 text-amber-500" /> Le systeme reste rentable pour MKA.P-MS.</li>
              <li className="flex items-start gap-2"><CheckCircle size={10} className="mt-0.5 shrink-0 text-amber-500" /> Toute tentative de fraude entraine une suspension immediate.</li>
            </ul>
          </div>
        </>)}

      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]">
          <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-400 shrink-0" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white">&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
