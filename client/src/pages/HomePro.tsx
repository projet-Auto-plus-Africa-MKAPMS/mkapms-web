/**
 * MKA.P-MS — Landing page mkapms.pro
 * Plateforme B2B Professionnelle
 * Même DB · Même Core Engine · Orientation professionnelle
 */
import { Link, useNavigate } from "react-router-dom";
import { getAnnonceUrl } from "../lib/annonceUrl";
import {
  Building2, Briefcase, Truck, Wrench, CreditCard, Settings,
  BarChart3, Users, Globe, Shield, Award, ChevronRight,
  Zap, Package, FileText, Phone, Star, CheckCircle,
  Car, Factory, Network, Handshake, TrendingUp, Lock
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";
import { useCurrency } from "../lib/currency";

/* ── SERVICES B2B ── */
const PRO_SERVICES = [
  {
    icon: Building2,
    label: "Garage+",
    sub: "Gestion complète atelier",
    to: "/garage-plus",
    color: "bg-[#D4AF37]",
  },
  {
    icon: Wrench,
    label: "Atelier Pro",
    sub: "Ordres de réparation",
    to: "/atelier-pro",
    color: "bg-[#111]",
  },
  {
    icon: BarChart3,
    label: "Comptabilité",
    sub: "Facturation & TVA",
    to: "/comptabilite",
    color: "bg-emerald-700",
  },
  {
    icon: CreditCard,
    label: "Finance+",
    sub: "LOA, crédit, paiement pro",
    to: "/finance",
    color: "bg-blue-700",
  },
  {
    icon: Truck,
    label: "Gestion Flotte",
    sub: "Parc & conducteurs",
    to: "/entreprises/gestion-parc",
    color: "bg-orange-600",
  },
  {
    icon: Network,
    label: "Marketplace B2B",
    sub: "Import · Export · Gros",
    to: "/labs/place-marche-b2-b",
    color: "bg-purple-700",
  },
  {
    icon: Globe,
    label: "Import Afrique",
    sub: "Véhicules & pièces",
    to: "/import-africa",
    color: "bg-green-700",
  },
  {
    icon: Settings,
    label: "API MKA.P-MS",
    sub: "Intégration & webhooks",
    to: "/labs/data-cloud-auto",
    color: "bg-slate-700",
  },
];

/* ── ABONNEMENTS PRO ── */
const PRO_PLANS = [
  {
    name: "Starter Pro",
    price: "49 €/mois",
    features: ["5 annonces actives", "Tableau de bord vendeur", "Messagerie pro", "Badge PRO"],
    color: "border-[#D4AF37]",
    cta: "/abonnements",
  },
  {
    name: "Business",
    price: "149 €/mois",
    features: ["50 annonces actives", "Garage+", "Comptabilité", "Gestion flotte 10 véhicules", "API accès"],
    color: "border-blue-500",
    cta: "/abonnements",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    features: ["Annonces illimitées", "Multi-sites", "Atelier Pro complet", "Finance+", "Support dédié", "API complète"],
    color: "border-purple-500",
    cta: "/devis",
  },
];

/* ── CHIFFRES CLÉS ── */
const PRO_STATS = [
  { value: "+12 000", label: "Professionnels inscrits" },
  { value: "+85 000", label: "Véhicules en stock" },
  { value: "47 pays", label: "Réseau international" },
  { value: "4,9/5", label: "Satisfaction clients" },
];

export default function HomePro() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { country } = useCurrency();
  const { data: proAnnonces } = trpc.annonces.list.useQuery({ categorieAnnonce: "professionnelle", pays: country ?? undefined, limit: 8 });

  return (
    <div className="bg-[#0A0A0A] min-h-screen text-white">

      {/* ═══════════════════════════════════════════════════════════════
          HERO B2B — FOND SOMBRE PREMIUM
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A0A] via-[#111] to-[#1A1A1A] border-b border-[#D4AF37]/20">
        {/* Grille décorative */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge domaine */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 mb-6">
              <Building2 size={14} className="text-[#D4AF37]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">MKA.P-MS PRO — PLATEFORME B2B</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase leading-tight">
              LA PLATEFORME<br />
              <span className="text-[#D4AF37]">AUTOMOBILE B2B</span><br />
              DE RÉFÉRENCE
            </h1>

            <p className="mt-4 text-base md:text-lg text-white/70 max-w-xl">
              Flottes, concessionnaires, importateurs, exportateurs, franchises et partenaires.
              Un seul outil pour gérer l'ensemble de votre activité automobile.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/pro/demarrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#111] hover:bg-[#C9A227] transition"
              >
                <Briefcase size={16} />
                Composer mon offre professionnelle
              </Link>
              <Link
                to="/abonnements"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-6 py-3 text-sm font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition"
              >
                <Star size={16} />
                Découvrir les abonnements Pro
              </Link>
              <Link
                to="/devis"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                <FileText size={16} />
                Demander un devis
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {PRO_STATS.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xl md:text-2xl font-black text-[#D4AF37]">{s.value}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES B2B
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">OUTILS PROFESSIONNELS</p>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white mt-0.5">Vos services B2B</h2>
          </div>
          <Link to="/espace-pro" className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
            Tout voir <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRO_SERVICES.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[#D4AF37]/50 hover:bg-white/10 transition"
            >
              <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon size={18} className="text-white" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-[#D4AF37] transition">{s.label}</p>
              <p className="text-[10px] text-white/50 mt-0.5">{s.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ABONNEMENTS PRO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#111] border-y border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">ABONNEMENTS</p>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white mt-0.5">Choisissez votre formule</h2>
            <p className="text-sm text-white/50 mt-1">Sans engagement · Résiliable à tout moment</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRO_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 ${plan.color} ${plan.highlight ? "bg-[#D4AF37]/5" : "bg-white/5"} p-6 relative`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-4 py-0.5 text-[10px] font-black text-[#111] uppercase">
                    LE PLUS POPULAIRE
                  </span>
                )}
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                <p className="text-2xl font-black text-[#D4AF37] mt-2">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/70">
                      <CheckCircle size={12} className="text-[#D4AF37] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.cta}
                  className="mt-6 block text-center rounded-xl bg-[#D4AF37] py-2.5 text-sm font-bold text-[#111] hover:bg-[#C9A227] transition"
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ANNONCES PROFESSIONNELLES
          ═══════════════════════════════════════════════════════════════ */}
      {proAnnonces && proAnnonces.items.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">STOCK PROFESSIONNEL</p>
              <h2 className="text-xl md:text-2xl font-black uppercase text-white mt-0.5">Annonces Pro</h2>
            </div>
            <Link to="/acheter?categorie=professionnelle" className="flex items-center gap-1 text-xs text-[#D4AF37] hover:underline">
              Voir tout <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {proAnnonces.items.map((a: any) => (
              <Link
                key={a.id}
                to={getAnnonceUrl(a.id, a.categorieAnnonce, a.vendeurType)}
                className="shrink-0 w-[220px] rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-[#D4AF37]/50 transition group"
              >
                <div className="h-[130px] relative overflow-hidden">
                  <img
                    src={a.photoPrincipale || "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=280&fit=crop"}
                    alt={a.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 rounded-sm bg-[#D4AF37] px-2 py-0.5 text-[8px] font-extrabold text-[#111] uppercase">PRO</span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold text-white truncate">{a.titre}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{a.marque} · {a.annee}</p>
                  <p className="text-base font-black text-[#D4AF37] mt-1">
                    {a.prix ? `${Number(a.prix).toLocaleString("fr-FR")} €` : "Prix sur demande"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ACCÈS RAPIDE PRO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#111] border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Car, label: "Déposer une annonce", to: "/depot-annonce", color: "text-[#D4AF37]" },
              { icon: Users, label: "Espace Pro", to: "/espace-pro", color: "text-blue-400" },
              { icon: TrendingUp, label: "Tableau de bord", to: "/vente/tableau-bord-vendeur", color: "text-green-400" },
              { icon: Handshake, label: "Devenir partenaire", to: "/partenaires/inscription-partenaire", color: "text-purple-400" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[#D4AF37]/30 hover:bg-white/10 transition"
              >
                <item.icon size={20} className={item.color} />
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER PRO — CONFIANCE
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-xs text-white/40">
            {[
              { icon: Shield, label: "Données sécurisées" },
              { icon: Lock, label: "RGPD conforme" },
              { icon: Award, label: "Certifié ISO 27001" },
              { icon: Phone, label: "Support dédié B2B" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <item.icon size={12} className="text-[#D4AF37]" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-white/20 mt-4">
            mkapms.pro — Plateforme B2B professionnelle · Même base de données · Même Core Engine que mkapms.fr et mkapms.site
          </p>
        </div>
      </section>
    </div>
  );
}
