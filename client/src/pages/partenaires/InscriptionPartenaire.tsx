/**
 * « Devenir partenaire MKA.P-MS » (point 36) — vraie entrée commerciale.
 *
 * La page était un module vide alors qu'elle est liée depuis l'accueil et le
 * portail Pro. Elle enregistre maintenant une candidature réelle : métier,
 * pays, ville, zone d'intervention, services couverts et contact.
 *
 * Rien n'est accordé automatiquement : la candidature part en examen, et
 * l'écran le dit clairement plutôt que d'afficher un « bienvenue partenaire ».
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Handshake, Check, Loader2 } from "lucide-react";
import { trpc } from "../../lib/trpc";

export default function InscriptionPartenaire() {
  const professions = trpc.proPortal.professions.useQuery(undefined);
  const countries = trpc.proPortal.countries.useQuery();
  const services = trpc.partnerEngine.services.useQuery();
  const apply = trpc.partnerEngine.candidater.useMutation();

  const [companyName, setCompanyName] = useState("");
  const [profession, setProfession] = useState("");
  const [countryCode, setCountryCode] = useState("FR");
  const [city, setCity] = useState("");
  const [zoneRadiusKm, setZoneRadiusKm] = useState(30);
  const [selected, setSelected] = useState<string[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");

  /** Services proposés en priorité : ceux que le métier choisi sait couvrir. */
  const serviceList = (services.data ?? []).filter(
    (s) => profession === "" || s.professions.includes(profession),
  );

  const canSubmit =
    companyName.trim().length >= 2 && profession !== "" && countryCode !== "" && !apply.isPending;

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  if (apply.data) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-[#111] px-4 pt-6 pb-5">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Handshake size={20} className="text-[#D4AF37]" /> Candidature enregistrée
          </h1>
        </div>
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-5">
          <div className="flex items-center gap-2 text-[#111] font-bold">
            <Check size={18} className="text-green-600" /> Référence {apply.data.reference}
          </div>
          <p className="mt-2 text-sm text-[#4B5563]">{apply.data.suite}</p>
          <Link
            to="/partenaires"
            className="mt-4 inline-block rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-[#D4AF37]"
          >
            Retour aux partenaires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/partenaires" className="flex items-center gap-1 text-sm text-white/60 mb-2">
          <ChevronLeft size={14} /> Partenaires
        </Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Handshake size={20} className="text-[#D4AF37]" /> Devenir partenaire MKA.P-MS
        </h1>
        <p className="mt-1 text-[12px] text-white/70">
          Recevez les demandes des clients de votre zone. Chaque candidature est examinée par notre équipe.
        </p>
      </div>

      <div className="mx-4 mt-4 space-y-4">
        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black text-[#111] mb-3">Votre entreprise</h2>
          <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Raison sociale</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            placeholder="Ex. Garage Diallo SARL"
          />

          <label className="block text-[11px] font-semibold text-[#6B7280] mt-3 mb-1">Métier</label>
          <select
            value={profession}
            onChange={(e) => {
              setProfession(e.target.value);
              setSelected([]);
            }}
            className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
          >
            <option value="">Choisir un métier…</option>
            {(professions.data ?? []).map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Pays</label>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm bg-white"
              >
                {(countries.data ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Ville</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                placeholder="Ex. Lyon"
              />
            </div>
          </div>

          <label className="block text-[11px] font-semibold text-[#6B7280] mt-3 mb-1">
            Zone d'intervention : {zoneRadiusKm} km autour de votre ville
          </label>
          <input
            type="range"
            min={5}
            max={200}
            step={5}
            value={zoneRadiusKm}
            onChange={(e) => setZoneRadiusKm(Number(e.target.value))}
            className="w-full"
          />
        </section>

        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black text-[#111]">Services que vous couvrez</h2>
          <p className="text-[11px] text-[#6B7280] mb-3">
            Ce sont ces services, et votre zone, qui déterminent les demandes qui vous seront transmises.
          </p>
          {services.isLoading && (
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {serviceList.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => toggle(s.code)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected.includes(s.code)
                    ? "border-[#D4AF37] bg-[#FFFDF5] ring-2 ring-[#D4AF37]/30 font-bold"
                    : "border-[#E5E7EB] bg-white"
                }`}
              >
                {s.label}
                {selected.includes(s.code) && <Check size={14} className="text-[#D4AF37]" />}
              </button>
            ))}
          </div>
          {profession !== "" && serviceList.length === 0 && (
            <p className="text-[12px] text-[#6B7280]">
              Aucun service partenaire n'est encore rattaché à ce métier : votre candidature sera examinée manuellement.
            </p>
          )}
        </section>

        <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h2 className="text-sm font-black text-[#111] mb-3">Votre contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
              placeholder="Nom du responsable"
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
              className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
              placeholder="Téléphone"
            />
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-3 w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            rows={3}
            placeholder="Présentez votre activité (optionnel)"
          />
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
              profession,
              countryCode,
              city: city.trim() || undefined,
              zoneRadiusKm,
              services: selected,
              contactName: contactName.trim() || undefined,
              contactEmail: contactEmail.trim() || undefined,
              contactPhone: contactPhone.trim() || undefined,
              message: message.trim() || undefined,
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
