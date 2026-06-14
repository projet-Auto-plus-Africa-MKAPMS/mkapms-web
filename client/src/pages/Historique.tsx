import { useState } from "react";
import {
  ShieldCheck, CheckCircle, Star, ArrowRight, ChevronDown,
  Car, AlertTriangle, Search, FileText, Award,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const RAPPORTS = [
  {
    id: "express",
    label: "RAPPORT EXPRESS",
    desc: "Les informations essentielles pour un premier contrôle.",
    prix: 4.99,
    features: ["Accidents", "Vol", "Kilométrage", "Gage", "Importation", "Et plus encore…"],
  },
  {
    id: "complet",
    label: "RAPPORT COMPLET",
    desc: "L'historique détaillé pour acheter en toute sérénité.",
    prix: 7.99,
    popular: true,
    features: ["Tout le rapport Express", "Entretien et réparations", "Nombre de propriétaires", "Contrôles techniques", "Détails sur l'importation", "Et plus encore…"],
  },
  {
    id: "premium",
    label: "RAPPORT PREMIUM",
    desc: "Le rapport ultra-détaillé avec analyse avancée IA.",
    prix: 12.99,
    features: ["Tout le rapport Complet", "Analyse IA des risques", "Estimation valeur marché", "Historique photos (si disponible)", "Documents administratifs", "Et plus encore…"],
  },
];

const CONTENU_RAPPORT = [
  { icon: AlertTriangle, label: "Accidents" },
  { icon: ShieldCheck, label: "Vol" },
  { icon: Car, label: "Kilométrage" },
  { icon: FileText, label: "Gage" },
  { icon: Search, label: "Entretien" },
  { icon: Car, label: "Importation" },
  { icon: Star, label: "Propriétaires" },
  { icon: Award, label: "Et plus encore" },
];

const BADGES_BOTTOM = [
  { label: "Sources officielles", desc: "Données provenant d'organismes officiels et partenaires agréés" },
  { label: "100% sécurisé", desc: "Vos données sont protégées et confidentielles" },
  { label: "Rapport instantané", desc: "Disponible immédiatement après paiement" },
  { label: "Disponible 24h/24", desc: "Service accessible à tout moment, où que vous soyez" },
  { label: "Support expert", desc: "Une équipe à votre écoute 7j/7" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-4 text-left">
        <h3 className="text-sm font-bold text-[#111]">{title}</h3>
        <ChevronDown size={16} className={`text-[#D4AF37] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function Historique() {
  const [searchType, setSearchType] = useState<"plate" | "vin" | "foreign">("plate");
  const [value, setValue] = useState("");
  const [done, setDone] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<string | null>(null);
  const req = trpc.historique.requestReport.useMutation({ onSuccess: () => setDone(true) });

  return (
    <div>
      {/* ═══ HERO — fond sombre adapté ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2D2D3A] to-[#1A1A2E] py-10">
        <div className="container-page relative">
          {/* Top badges */}
          <div className="flex flex-wrap justify-center gap-4 text-[9px] text-white/60">
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Données officielles</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Paiement 100% sécurisé</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} className="text-green-400" /> Rapport instantané</span>
          </div>

          {/* Title + Score */}
          <div className="mt-5 flex flex-col items-center text-center lg:flex-row lg:justify-between lg:text-left">
            <div>
              <h1 className="text-2xl font-extrabold uppercase text-white sm:text-3xl">
                Vérifiez l'historique<br /><span className="text-[#D4AF37]">d'un véhicule</span>
              </h1>
              <p className="mt-2 text-sm text-white/60">Évitez les mauvaises surprises et achetez en toute confiance.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-[10px] text-white/50 lg:justify-start">
                <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> + 537 842 rapports ce mois-ci</span>
                <span className="flex items-center gap-1"><Star size={10} className="text-[#D4AF37]" fill="#D4AF37" /> 4,8/5 basé sur 12 684 avis</span>
                <span>Garantie satisfait ou remboursé sous 14 jours</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center lg:mt-0">
              <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center">
                <p className="text-[9px] text-white/40">Score de confiance</p>
                <div className="mt-1 flex h-14 w-14 mx-auto items-center justify-center rounded-full border-2 border-green-400">
                  <span className="text-lg font-extrabold text-white">92</span>
                </div>
                <p className="mt-1 text-[9px] text-white/40">/100</p>
                <p className="text-xs font-bold text-green-400">Excellent</p>
                <p className="text-[8px] text-white/30">Ce véhicule présente un faible risque</p>
              </div>
            </div>
          </div>

          {/* Search tabs */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="flex gap-1">
              {([
                { id: "plate", label: "Par plaque" },
                { id: "vin", label: "Par VIN" },
                { id: "foreign", label: "Immatriculation étrangère" },
              ] as const).map((t) => (
                <button key={t.id} onClick={() => setSearchType(t.id as any)}
                  className={`rounded-t-lg px-4 py-1.5 text-[10px] font-bold transition ${searchType === t.id ? "bg-[#D4AF37] text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-b-xl rounded-tr-xl border border-white/10 bg-white/5 p-2">
              <div className="flex flex-1 items-center gap-2">
                {searchType === "plate" && <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-xs font-bold text-white">F</span>}
                <input
                  className="flex-1 bg-transparent py-2 text-sm text-white placeholder-white/30 outline-none"
                  placeholder={searchType === "plate" ? "AA - 123 - BB" : searchType === "vin" ? "Entrez le numéro VIN" : "Numéro d'immatriculation"}
                  value={value}
                  onChange={(e) => setValue(e.target.value.toUpperCase())}
                />
              </div>
              <button onClick={() => { if (value) req.mutate({ searchType, searchValue: value }); }}
                disabled={!value || req.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-white hover:bg-[#C5A028] disabled:opacity-40">
                Vérifier l'historique <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-[9px] text-white/40">
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Rapport instantané en quelques secondes</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Paiement 100% sécurisé</span>
              <span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-400" /> Données officielles et vérifiées</span>
            </div>
          </div>

          {done && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg bg-green-500/20 border border-green-500/30 p-3 text-center">
              <p className="text-sm text-green-300 font-semibold">Demande enregistrée ! Le rapport sera disponible dans votre compte.</p>
            </div>
          )}

          {/* Car illustration */}
          <div className="mt-6 flex justify-center opacity-10">
            <Car size={100} className="text-white" />
          </div>
        </div>
      </section>

      {/* ═══ RAPPORTS — en ligne cliquable ═══ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#111]">Choisissez votre rapport</h2>
              <p className="mt-0.5 text-xs text-slate-500">Des informations claires pour une décision en toute confiance.</p>
            </div>
            <span className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-[9px] font-semibold text-green-700">
              <CheckCircle size={10} /> Garantie satisfait ou remboursé 14 jours
            </span>
          </div>

          {/* 3 rapports côte à côte — cliquables */}
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {RAPPORTS.map((r) => {
              const isOpen = selectedRapport === r.id;
              return (
                <div key={r.id} className={`rounded-xl border-2 transition ${r.popular ? "border-[#D4AF37] shadow-md" : "border-slate-200"} ${isOpen ? "bg-[#FEFCE8]" : "bg-white"}`}>
                  <button type="button" onClick={() => setSelectedRapport(isOpen ? null : r.id)} className="w-full p-4 text-left">
                    {r.popular && (
                      <span className="mb-2 inline-block rounded-full bg-[#D4AF37] px-3 py-0.5 text-[9px] font-bold uppercase text-white">Le plus populaire</span>
                    )}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-[#111]">{r.label}</h3>
                      <ChevronDown size={14} className={`text-[#D4AF37] transition ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{r.desc}</p>
                    <p className="mt-2 text-lg font-extrabold text-[#111]">{r.prix.toFixed(2)} €<span className="text-[10px] font-normal text-slate-400"> par rapport</span></p>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-200 px-4 pb-4 pt-3">
                      <div className="space-y-1.5">
                        {r.features.map((f) => (
                          <div key={f} className="flex items-center gap-1.5 text-xs text-[#111]">
                            <CheckCircle size={10} className="shrink-0 text-green-500" /> {f}
                          </div>
                        ))}
                      </div>
                      <button className={`mt-3 w-full rounded-lg py-2 text-xs font-bold text-white ${r.popular ? "bg-[#D4AF37] hover:bg-[#C5A028]" : "bg-[#111] hover:bg-[#333]"}`}>
                        Choisir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ ALERTES RISQUES ═══ */}
      <section className="bg-[#FFF3CD] py-4">
        <div className="container-page">
          <p className="text-center text-[10px] font-bold uppercase tracking-wide text-[#8B6914]">
            Économisez des milliers d'euros et évitez les pièges
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4 text-[10px] text-[#8B6914]">
            {["Véhicule volé", "Compteur trafiqué", "Véhicule accidenté", "Véhicule gagé", "Importation à risque"].map((r) => (
              <span key={r} className="flex items-center gap-1"><AlertTriangle size={10} className="text-orange-600" /> {r}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CE QUE CONTIENT VOTRE RAPPORT ═══ */}
      <section className="bg-white py-8">
        <div className="container-page">
          <Section title="CE QUE CONTIENT VOTRE RAPPORT">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {CONTENU_RAPPORT.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200">
                      <Icon size={16} className="text-slate-600" />
                    </div>
                    <span className="text-[9px] font-semibold text-[#111]">{c.label}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Exemple de rapport */}
          <Section title="EXEMPLE DE RAPPORT">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#111]">RENAULT CLIO IV</h4>
                    <p className="text-[10px] text-slate-500">1.5 dCi 90 cv</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      <span className="flex h-3 w-3 items-center justify-center rounded-sm bg-blue-600 text-[7px] text-white">F</span> AA-123-BB
                    </span>
                  </div>
                  <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700">RAPPORT COMPLET</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-green-400">
                      <span className="text-sm font-extrabold text-[#111]">92</span>
                    </div>
                    <p className="text-[8px] text-slate-400">/100</p>
                    <p className="text-[9px] font-bold text-green-600">Excellent</p>
                  </div>
                  <div className="flex-1 space-y-1 text-[10px] text-slate-600">
                    <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Accidents</span><span className="font-semibold">Aucun accident déclaré</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Kilométrage</span><span className="font-semibold">128 450 km — Cohérent</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Vol</span><span className="font-semibold">Aucun vol déclaré</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Entretien</span><span className="font-semibold">12 entretiens trouvés</span></div>
                    <div className="flex justify-between"><span className="flex items-center gap-1"><CheckCircle size={8} className="text-green-500" /> Propriétaires</span><span className="font-semibold">2 propriétaires</span></div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <h4 className="text-xs font-bold text-red-800">Pourquoi vérifier l'historique ?</h4>
                  <div className="mt-2 space-y-2 text-[10px] text-red-700">
                    <p><strong>Achetez en toute confiance</strong> — Évitez les mauvaises surprises et les vices cachés.</p>
                    <p><strong>Protégez votre investissement</strong> — Un historique clair = une meilleure valeur.</p>
                    <p><strong>Gagnez du temps</strong> — Rapport instantané disponible 24H/24 et 7J/7.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4">
                  <h4 className="text-xs font-bold text-[#111]">Analyse Intelligente MKA.P-MS</h4>
                  <p className="mt-1 text-[10px] text-slate-600">Notre IA analyse des millions de données pour vous fournir un rapport fiable et objectif.</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </section>

      {/* ═══ BADGES BAS ═══ */}
      <section className="border-t border-slate-200 bg-[#F8F9FA] py-6">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {BADGES_BOTTOM.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck size={16} className="text-[#111]" />
                <h4 className="text-[10px] font-bold text-[#111]">{b.label}</h4>
                <p className="text-[8px] text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
