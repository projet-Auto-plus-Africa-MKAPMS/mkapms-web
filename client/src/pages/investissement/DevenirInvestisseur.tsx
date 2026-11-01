/**
 * « Devenir investisseur MKA.P-MS » — entrée publique, sans compte requis.
 *
 * Distincte du tableau de bord privé (index.tsx, /investissement, réservé aux
 * investisseurs déjà sous contrat) et du « Mode Investisseurs » interne
 * (/investisseurs/*, tableau de bord direction pour investisseurs en
 * capital) — sans rapport, jamais touché ici.
 *
 * Réutilise le Partner Engine déjà réel et public (« Devenir partenaire »,
 * server/partner-engine/) plutôt que de créer un second moteur de
 * candidature : une candidature investisseur est enregistrée exactement
 * comme une candidature partenaire, avec profession="investisseur".
 *
 * Contenu volontairement minimal et honnête : décrit uniquement le
 * mécanisme réel déjà construit (server/investment/ — droit économique
 * temporaire sur un univers, un pays et une durée), sans aucun chiffre de
 * rendement, taux ou promesse inventés. La décision revient à l'équipe
 * MKA.P-MS après examen, jamais une adhésion automatique.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, TrendingUp, Check, ShieldCheck, Clock, Globe2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

const PRINCIPES = [
  { icon: Globe2, texte: "Droit économique temporaire sur un univers d'activité, dans un pays et pour une durée définis au contrat." },
  { icon: ShieldCheck, texte: "Jamais une propriété de MKA.P-MS : un droit contractuel borné, pas une part de l'entreprise." },
  { icon: Clock, texte: "Dossier vérifié (KYC) avant toute signature — aucun versement n'est demandé avant l'examen de votre candidature." },
];

/** Libellés FR des univers investissables (server/investment/schema.ts::INVESTABLE_UNIVERSES) — un univers sans libellé connu affiche son code brut plutôt que de disparaître. */
const UNIVERS_LABELS: Record<string, string> = {
  vente_particulier: "Vente — particuliers",
  vente_pro: "Vente — professionnels",
  vente_officiel: "Vente — concessionnaires officiels",
  location_particulier: "Location — particuliers",
  location_pro: "Location — professionnels",
  garage: "Garage / entretien",
  atelier: "Atelier mécanique",
  depannage: "Dépannage",
  auction_engine: "Enchères",
  controle_technique: "Contrôle technique",
  livraison: "Livraison",
  livraison_vehicule: "Livraison de véhicules",
  pieces: "Pièces détachées",
  transport: "Transport",
  assurance: "Assurance",
  comptabilite: "Comptabilité",
};

const PROFILS_INVESTISSEUR = [
  { valeur: "PASSIVE_INVESTOR", libelle: "Investisseur passif — financement uniquement" },
  { valeur: "OPERATOR_INVESTOR", libelle: "Investisseur opérateur — implication dans l'activité" },
  { valeur: "STRATEGIC_PARTNER", libelle: "Partenaire stratégique" },
];

const HORIZONS_MOIS = [12, 24, 36, 60];

export default function DevenirInvestisseur() {
  const countries = trpc.proPortal.countries.useQuery();
  const universes = trpc.partnerEngine.investorUniverses.useQuery();
  const apply = trpc.partnerEngine.candidater.useMutation();

  const [companyName, setCompanyName] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [investorType, setInvestorType] = useState("PASSIVE_INVESTOR");
  const [universesInteret, setUniversesInteret] = useState<string[]>([]);
  const [montantEnvisage, setMontantEnvisage] = useState("");
  const [horizonMois, setHorizonMois] = useState<number | "">("");

  const toggleUnivers = (u: string) =>
    setUniversesInteret((cur) => (cur.includes(u) ? cur.filter((x) => x !== u) : [...cur, u]));

  const canSubmit = companyName.trim().length >= 2 && countryCode !== "" && !apply.isPending;

  if (apply.data) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-[#D4AF37]" /> Candidature enregistrée
          </h1>
        </div>
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-5">
          <div className="flex items-center gap-2 text-[#111] font-bold">
            <Check size={18} className="text-green-600" /> Référence {apply.data.reference}
          </div>
          <p className="mt-2 text-sm text-[#4B5563]">{apply.data.suite}</p>
          <Link to="/investissement" className="mt-4 inline-block rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-[#D4AF37]">
            Espace investisseur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/investissement" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Investisseur
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-[#D4AF37]" /> Devenir investisseur MKA.P-MS
        </h1>
        <p className="mt-1 text-[12px] text-white/70">
          Un droit économique temporaire sur un univers d'activité MKA.P-MS, dans un pays et pour une durée déterminés au contrat.
        </p>
      </div>

      <div className="mx-4 mt-4 space-y-4">
        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          {PRINCIPES.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.texte} className="flex items-start gap-3">
                <Icon size={16} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                <p className="text-sm text-[#374151]">{p.texte}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black text-[#111] mb-3">Votre candidature</h2>
          <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Nom ou raison sociale</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            placeholder="Ex. Jean Dupont, ou Dupont Invest SARL"
          />

          <label className="block text-[11px] font-semibold text-[#6B7280] mt-3 mb-1">Pays</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
          >
            {(countries.data ?? []).map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
              placeholder="Nom du contact"
            />
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
            />
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm sm:col-span-2"
              placeholder="Téléphone"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            rows={3}
            placeholder="Questions, contexte, précisions utiles… (optionnel)"
          />
        </section>

        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black text-[#111] mb-1">Votre projet d'investissement</h2>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Plus ces éléments sont précis, plus vite votre dossier peut être examiné — ils ne vous engagent à rien à ce stade.
          </p>

          <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Profil d'investisseur</label>
          <select
            value={investorType}
            onChange={(e) => setInvestorType(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
          >
            {PROFILS_INVESTISSEUR.map((p) => (
              <option key={p.valeur} value={p.valeur}>{p.libelle}</option>
            ))}
          </select>

          <label className="block text-[11px] font-semibold text-[#6B7280] mt-3 mb-1">
            Univers d'activité qui vous intéressent (plusieurs choix possibles)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(universes.data ?? []).map((u) => (
              <label key={u} className="flex items-center gap-1.5 text-[12px] text-[#374151]">
                <input
                  type="checkbox"
                  checked={universesInteret.includes(u)}
                  onChange={() => toggleUnivers(u)}
                  className="accent-[#D4AF37]"
                />
                {UNIVERS_LABELS[u] ?? u}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Montant envisagé (€)</label>
              <input
                value={montantEnvisage}
                onChange={(e) => setMontantEnvisage(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                placeholder="Ex. 20000"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Durée envisagée</label>
              <select
                value={horizonMois}
                onChange={(e) => setHorizonMois(e.target.value ? Number(e.target.value) : "")}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
              >
                <option value="">Non précisé</option>
                {HORIZONS_MOIS.map((m) => (
                  <option key={m} value={m}>{m} mois</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-[#9CA3AF]">
            Ces chiffres sont des ordres de grandeur pour orienter l'examen de votre dossier — ils seront fixés précisément au contrat, pas ici.
          </p>
        </section>

        {apply.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {apply.error.message}
          </div>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() =>
            apply.mutate({
              companyName: companyName.trim(),
              profession: "investisseur",
              countryCode,
              contactName: contactName.trim() || undefined,
              contactEmail: contactEmail.trim() || undefined,
              contactPhone: contactPhone.trim() || undefined,
              message: message.trim() || undefined,
              details: {
                investorType,
                universesInteret,
                ...(montantEnvisage ? { montantEnvisageEur: Number(montantEnvisage) } : {}),
                ...(horizonMois ? { horizonMois } : {}),
              },
            })
          }
          className="w-full rounded-xl bg-[#111] px-4 py-3 text-sm font-black text-[#D4AF37] disabled:opacity-40"
        >
          {apply.isPending ? "Envoi…" : "Envoyer ma candidature"}
        </button>
        <p className="text-[11px] text-[#6B7280] text-center">
          Aucun paiement n'est demandé à cette étape. Votre dossier est examiné avant toute activation.
        </p>
      </div>
    </div>
  );
}
