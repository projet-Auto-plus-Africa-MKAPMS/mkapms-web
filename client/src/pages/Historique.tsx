import { useState } from "react";
import {
  ShieldCheck, CheckCircle, Star, ArrowRight, ChevronDown,
  Car, AlertTriangle, Search, FileText, Award, Lock, Clock, Headphones,
  Globe, Zap, Eye, Users, Wrench, BarChart3,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const RAPPORTS = [
  {
    id: "express",
    icon: Zap,
    iconColor: "text-orange-500",
    label: "RAPPORT EXPRESS",
    desc: "Les informations essentielles pour un premier contrôle.",
    prix: "4,99",
    features: ["Accidents", "Vol", "Kilométrage", "Gage", "Importation", "Et plus encore…"],
    btnClass: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white",
  },
  {
    id: "complet",
    icon: ShieldCheck,
    iconColor: "text-green-500",
    label: "RAPPORT COMPLET",
    desc: "L'historique détaillé pour acheter en toute sérénité.",
    prix: "7,99",
    popular: true,
    features: ["Tout le rapport Express", "Entretien et réparations", "Nombre de propriétaires", "Contrôles techniques", "Détails sur l'importation", "Et plus encore…"],
    btnClass: "bg-green-600 text-white hover:bg-green-700",
  },
  {
    id: "premium",
    icon: Award,
    iconColor: "text-purple-500",
    label: "RAPPORT PREMIUM",
    desc: "Le rapport ultra-détaillé avec analyse avancée IA.",
    prix: "12,99",
    features: ["Tout le rapport Complet", "Analyse IA des risques", "Estimation valeur marché", "Historique photos (si disponible)", "Documents administratifs", "Et plus encore…"],
    btnClass: "border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white",
  },
];

const CONTENU_RAPPORT = [
  { icon: AlertTriangle, label: "Accidents" },
  { icon: Lock, label: "Vol" },
  { icon: BarChart3, label: "Kilométrage" },
  { icon: FileText, label: "Gage" },
  { icon: Wrench, label: "Entretien" },
  { icon: Globe, label: "Importation" },
  { icon: Users, label: "Propriétaires" },
  { icon: Eye, label: "Et plus encore" },
];

const PIEGES = [
  { icon: AlertTriangle, label: "Véhicule volé", color: "text-red-600" },
  { icon: AlertTriangle, label: "Compteur trafiqué", color: "text-orange-600" },
  { icon: AlertTriangle, label: "Véhicule accidenté", color: "text-red-600" },
  { icon: AlertTriangle, label: "Véhicule gagé", color: "text-orange-600" },
  { icon: AlertTriangle, label: "Importation à risque", color: "text-red-600" },
];

export default function Historique() {
  const [plaque, setPlaque] = useState("");
  const [vin, setVin] = useState("");
  const [done, setDone] = useState(false);
  const req = trpc.historique.requestReport.useMutation({ onSuccess: () => setDone(true) });

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO — Fond sombre + voiture arrière-plan
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]">
        {/* Top bar */}
        <div className="border-b border-white/10">
          <div className="container-page flex items-center justify-between py-2">
            <div className="flex flex-wrap items-center gap-4 text-[9px] text-white/60">
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Données officielles — Sources sécurisées</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Paiement 100% sécurisé — Stripe & protocole SSL</span>
              <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Rapport instantané — Disponible en quelques secondes</span>
            </div>
          </div>
        </div>

        {/* Main hero */}
        <div className="container-page py-8 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Left content */}
            <div className="max-w-lg">
              <h1 className="text-2xl font-extrabold uppercase leading-tight text-white sm:text-3xl lg:text-4xl">
                Vérifiez l'historique<br /><span className="italic text-[#D4AF37]">d'un véhicule</span>
              </h1>
              <p className="mt-3 text-sm text-white/60">Évitez les mauvaises surprises et achetez en toute confiance.</p>
              {/* Stats pills */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Star size={12} className="text-[#D4AF37]" fill="#D4AF37" />
                    <span className="text-sm font-bold text-white">+ 537 842</span>
                  </div>
                  <p className="text-[8px] text-white/40">rapports générés ce mois-ci</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">4,8/5</span>
                  </div>
                  <p className="text-[8px] text-white/40">basé sur 12 684 avis ★★★★★</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2">
                  <p className="text-[10px] font-semibold text-white/70">Garantie satisfait</p>
                  <p className="text-[8px] text-white/40">ou remboursé sous 14 jours</p>
                </div>
              </div>
            </div>

            {/* Right — Score de confiance */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center backdrop-blur">
              <p className="text-[9px] font-semibold text-white/50">Score de confiance</p>
              <div className="mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-green-400">
                <div className="text-center">
                  <span className="text-2xl font-extrabold text-white">92</span>
                  <p className="text-[8px] text-white/40">/100</p>
                </div>
              </div>
              <p className="mt-2 text-sm font-bold text-green-400">Excellent</p>
              <p className="mt-0.5 text-[9px] text-white/40">Ce véhicule présente<br />un faible risque</p>
            </div>
          </div>
        </div>

        {/* Search bar section */}
        <div className="border-t border-white/10 bg-white/5">
          <div className="container-page py-4">
            {/* Tabs */}
            <div className="flex gap-1">
              <span className="rounded-full bg-[#D4AF37] px-4 py-1.5 text-[10px] font-bold text-white">Par plaque</span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold text-white/60">Par VIN</span>
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold text-white/60">Immatriculation étrangère</span>
            </div>

            {/* Input row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Plaque input */}
              <div className="flex items-center gap-1 rounded-lg border-2 border-blue-500 bg-white px-2 py-2">
                <span className="flex h-8 w-6 items-center justify-center rounded-sm bg-blue-700 text-[9px] font-bold text-white">F</span>
                <input
                  className="w-28 bg-transparent text-center text-lg font-extrabold text-[#111] outline-none placeholder-slate-300"
                  placeholder="AA - 123 - BB"
                  value={plaque}
                  onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                />
                <div className="flex flex-col items-center">
                  <span className="text-[7px]">🇪🇺</span>
                  <span className="rounded bg-blue-700 px-1 text-[7px] font-bold text-white">75</span>
                </div>
              </div>

              <span className="text-xs font-bold text-white/40">ou</span>

              {/* VIN input */}
              <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <span className="text-[10px] text-white/30">||||||||</span>
                <input
                  className="w-36 bg-transparent text-sm text-white outline-none placeholder-white/30"
                  placeholder="Entrez le numéro VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                />
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  const val = plaque || vin;
                  if (val) req.mutate({ searchType: plaque ? "plate" : "vin", searchValue: val });
                }}
                disabled={(!plaque && !vin) || req.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#C5A028] disabled:opacity-40"
              >
                VÉRIFIER L'HISTORIQUE <ArrowRight size={14} />
              </button>
            </div>

            {/* Sub badges */}
            <div className="mt-2 flex flex-wrap gap-4 text-[9px] text-white/40">
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Rapport instantané en quelques secondes</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Données officielles et vérifiées</span>
            </div>

            {done && (
              <div className="mt-3 rounded-lg bg-green-500/20 border border-green-400/30 p-3">
                <p className="text-sm text-green-300 font-semibold">Demande enregistrée ! Le rapport sera disponible dans votre compte.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. CHOISISSEZ VOTRE RAPPORT — 3 cartes toujours visibles
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FA] py-8">
        <div className="container-page">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold uppercase text-[#111]">Choisissez votre rapport</h2>
              <p className="text-xs text-slate-500">Des informations claires pour une décision en toute confiance.</p>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[9px] font-semibold text-green-700">
              <CheckCircle size={10} /> Garantie satisfait ou remboursé 14 jours
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {RAPPORTS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.id} className={`relative rounded-2xl bg-white p-5 shadow-sm ${r.popular ? "border-2 border-[#D4AF37] shadow-lg ring-1 ring-[#D4AF37]/20" : "border border-slate-200"}`}>
                  {r.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-orange-500 px-4 py-1 text-[9px] font-bold uppercase text-white shadow">Le plus populaire</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${r.iconColor}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#111]">{r.label}</h3>
                      <p className="mt-0.5 text-[10px] text-slate-500">{r.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-2xl font-extrabold text-[#111]">{r.prix} €</span>
                    <span className="ml-1 text-[10px] text-slate-400">par rapport</span>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {r.features.map((f) => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-[#111]">
                        <CheckCircle size={12} className="shrink-0 text-green-500" /> {f}
                      </div>
                    ))}
                  </div>
                  <button className={`mt-5 w-full rounded-full py-2.5 text-xs font-bold transition ${r.btnClass}`}>
                    CHOISIR
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. BANDEAU JAUNE — ÉVITEZ LES PIÈGES
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#FFF3CD] py-4">
        <div className="container-page text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
            Économisez des milliers d'euros et évitez les pièges
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4">
            {PIEGES.map((p) => (
              <span key={p.label} className={`flex items-center gap-1 text-[10px] font-semibold ${p.color}`}>
                <p.icon size={12} /> {p.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. CE QUE CONTIENT VOTRE RAPPORT — 8 icônes
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <h2 className="text-center text-sm font-extrabold uppercase tracking-wide text-[#111]">Ce que contient votre rapport</h2>
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-4 gap-4 sm:grid-cols-8">
            {CONTENU_RAPPORT.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <Icon size={18} className="text-slate-600" />
                    <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                      <CheckCircle size={8} className="text-white" />
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-[#111]">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. EXEMPLE DE RAPPORT + POURQUOI VÉRIFIER + ANALYSE IA
         ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F8F9FA] py-8">
        <div className="container-page">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Left — Exemple de rapport */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-[#D4AF37]" fill="#D4AF37" />
                <h3 className="text-sm font-extrabold text-[#111]">EXEMPLE DE RAPPORT</h3>
              </div>
              <div className="mt-3 flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#111]">RENAULT CLIO IV</h4>
                  <p className="text-[10px] text-slate-500">1.5 dCi 90 cv</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                    <span className="flex h-3 w-3 items-center justify-center rounded-sm bg-blue-600 text-[6px] text-white">F</span> AA-123-BB
                  </span>
                  <p className="mt-1 text-[8px] text-slate-400">Rapport généré le 28/05/2024 à 21:10</p>
                </div>
                <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[8px] font-bold text-green-700">RAPPORT COMPLET</span>
              </div>

              {/* Score + Details */}
              <div className="mt-4 flex gap-4">
                <div className="flex flex-col items-center">
                  <p className="text-[8px] text-slate-400">Score de confiance</p>
                  <div className="mt-1 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-green-400">
                    <div className="text-center">
                      <span className="text-xl font-extrabold text-[#111]">92</span>
                      <p className="text-[7px] text-slate-400">/100</p>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-green-600">Excellent</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Accidents</span><span className="font-semibold text-[#111]">Aucun accident déclaré</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Kilométrage</span><span className="font-semibold text-[#111]">128 450 km <span className="text-green-600">Cohérent</span></span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Vol</span><span className="font-semibold text-[#111]">Aucun vol déclaré</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Gage</span><span className="font-semibold text-[#111]">Aucun gage enregistré</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Entretien</span><span className="font-semibold text-[#111]">12 entretiens trouvés</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Propriétaires</span><span className="font-semibold text-[#111]">2 propriétaires</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Importation</span><span className="font-semibold text-[#111]">Non importé</span></div>
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-1 text-slate-600"><CheckCircle size={10} className="text-green-500" /> Contrôle technique</span><span className="font-semibold text-[#111]">Valide jusqu'au 12/2025</span></div>
                </div>
              </div>

              <button className="mt-4 flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-[10px] font-bold text-slate-700 hover:bg-slate-50">
                VOIR UN EXEMPLE COMPLET <ArrowRight size={10} />
              </button>
            </div>

            {/* Right — Pourquoi + Analyse IA */}
            <div className="flex flex-col gap-4">
              {/* Pourquoi vérifier */}
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-sm font-extrabold text-red-800">POURQUOI VÉRIFIER L'HISTORIQUE ?</h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-bold text-red-800">Achetez en toute confiance</p>
                      <p className="text-[10px] text-red-700">Évitez les mauvaises surprises et les vices cachés.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-bold text-red-800">Protégez votre investissement</p>
                      <p className="text-[10px] text-red-700">Un historique clair = une meilleure valeur.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-bold text-red-800">Gagnez du temps</p>
                      <p className="text-[10px] text-red-700">Rapport instantané disponible 24H/24 et 7J/7.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analyse Intelligente MKA.P-MS */}
              <div className="rounded-2xl bg-gradient-to-br from-[#1A1A2E] to-[#2D2D3A] p-5">
                <h3 className="text-sm font-extrabold text-[#D4AF37]">ANALYSE INTELLIGENTE MKA.P-MS</h3>
                <p className="mt-2 text-xs text-white/60">Notre IA analyse des millions de données pour vous fournir un rapport fiable et objectif.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. BADGES BAS — 5 colonnes
         ═══════════════════════════════════════════════════════════ */}
      <section className="border-t border-slate-200 bg-white py-6">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { icon: Globe, label: "Sources officielles", desc: "Données provenant d'organismes officiels et partenaires agréés" },
              { icon: Lock, label: "100% sécurisé", desc: "Vos données sont protégées et confidentielles" },
              { icon: Zap, label: "Rapport instantané", desc: "Disponible immédiatement après paiement" },
              { icon: Clock, label: "Disponible 24h/24", desc: "Service accessible à tout moment, où que vous soyez" },
              { icon: Headphones, label: "Support expert", desc: "Une équipe à votre écoute 7j/7" },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon size={18} className="text-[#111]" />
                  <h4 className="text-[10px] font-bold text-[#111]">{b.label}</h4>
                  <p className="text-[8px] text-slate-500 leading-tight">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
