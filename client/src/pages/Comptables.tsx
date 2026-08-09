/**
 * MKA.P-MS — Marketplace Comptabilité (point 26 B).
 *
 * « Je cherche un comptable » : recherche par pays, ville, spécialité, langue
 * et disponibilité. Cette page n'affiche aucune donnée interne de la
 * plateforme : elle ne parle qu'à l'annuaire des comptables indépendants.
 */
import { useState } from "react";
import { Calculator, MapPin, Languages, Star, Send, Loader2, Info } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const SPECIALITES = [
  { code: "tva", label: "TVA" },
  { code: "bilan", label: "Bilan / clôture" },
  { code: "paie", label: "Paie" },
  { code: "creation_entreprise", label: "Création d'entreprise" },
  { code: "fiscalite_auto", label: "Fiscalité automobile" },
  { code: "audit", label: "Audit" },
];

const LANGUES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "Anglais" },
  { code: "ar", label: "Arabe" },
  { code: "es", label: "Espagnol" },
];

const PAYS = ["FR", "BE", "ES", "MA", "TN", "SN", "CI", "ML", "GN"];

export default function Comptables() {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState("FR");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [language, setLanguage] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const results = trpc.accountingMarketplace.search.useQuery({
    countryCode,
    city: city.trim() || undefined,
    specialty: specialty || undefined,
    language: language || undefined,
    availableOnly: availableOnly || undefined,
  });

  const request = trpc.accountingMarketplace.requestAccountant.useMutation({
    onSuccess: (_r, vars) => setSent(vars.accountantId ?? 0),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Calculator className="w-7 h-7 text-[#D4AF37]" />
        <h1 className="text-2xl font-bold">Je cherche un comptable</h1>
      </div>
      <p className="text-gray-600 mb-6">
        Comptables indépendants et cabinets référencés par pays, ville, spécialité et langue.
      </p>

      <div className="bg-white border rounded-xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Pays</span>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {PAYS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Ville</span>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Toutes les villes"
          />
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Spécialité</span>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">Toutes</option>
            {SPECIALITES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 text-gray-600">Langue</span>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">Toutes</option>
            {LANGUES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          <span>Disponibles seulement</span>
        </label>
      </div>

      {results.isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Recherche…
        </div>
      )}

      {results.data && results.data.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Aucun comptable référencé pour cette recherche.</p>
            <p className="text-sm text-gray-600">
              L'annuaire ne montre que des fiches vérifiées : nous préférons ne rien afficher plutôt
              qu'un résultat non contrôlé. Vous pouvez élargir la ville ou la spécialité.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {results.data?.map((a) => (
          <div key={a.id} className="border rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{a.displayName}</h2>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[a.city, a.countryCode].filter(Boolean).join(", ")}
                </p>
              </div>
              {a.noteAffichable !== null ? (
                <span className="flex items-center gap-1 text-sm font-medium">
                  <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                  {a.noteAffichable} <span className="text-gray-400">({a.ratingCount})</span>
                </span>
              ) : (
                <span className="text-xs text-gray-400">Pas encore d'avis</span>
              )}
            </div>

            {a.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {a.specialties.map((s) => (
                  <span key={s} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                    {SPECIALITES.find((x) => x.code === s)?.label ?? s}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" /> {a.languages.join(", ")}
              </span>
              <span>{a.tarif ?? "Tarif sur devis"}</span>
              <span
                className={
                  a.availability === "disponible" ? "text-green-600" : "text-gray-500"
                }
              >
                {a.availability === "disponible"
                  ? "Disponible"
                  : a.availability === "complet"
                    ? "Complet"
                    : "Sur rendez-vous"}
              </span>
            </div>

            {a.bio && <p className="text-sm text-gray-600 mt-3">{a.bio}</p>}

            <button
              type="button"
              disabled={!user || request.isPending}
              onClick={() =>
                request.mutate({
                  accountantId: a.id,
                  countryCode,
                  city: city.trim() || undefined,
                  specialty: specialty || undefined,
                })
              }
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B1B34] text-white py-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sent === a.id ? "Demande envoyée" : user ? "Contacter" : "Connectez-vous pour contacter"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
