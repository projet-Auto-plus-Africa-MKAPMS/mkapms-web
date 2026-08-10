/**
 * MKA.P-MS Assurance (point 45).
 *
 * Cette page était un module vide. Elle met maintenant en relation avec les
 * assureurs réellement référencés dans le pays actif. Deux règles tenues :
 * aucun tarif n'est affiché tant qu'un humain n'a pas enregistré une offre, et
 * si aucun assureur ne couvre le pays, c'est écrit — la demande est enregistrée
 * mais annoncée comme non transmise.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Search, Check, AlertTriangle, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const PAYS = ["FR", "BE", "ES", "MA", "TN", "SN", "CI", "ML", "GN"];

const STATUS_LABEL: Record<string, string> = {
  transmise: "Transmise aux assureurs",
  sans_assureur: "Enregistrée — aucun assureur partenaire",
  offre_recue: "Offre reçue",
  souscrite: "Souscrite",
  abandonnee: "Abandonnée",
};

export default function MKAPMSAssurance() {
  const { user } = useAuth();
  const [countryCode, setCountryCode] = useState("FR");

  const catalog = trpc.insuranceEngine.catalog.useQuery();
  const partners = trpc.insuranceEngine.partners.useQuery({ countryCode });
  const mesDemandes = trpc.insuranceEngine.mesDemandes.useQuery(undefined, {
    enabled: Boolean(user),
  });

  const [formula, setFormula] = useState("tous_risques");
  const [usage, setUsage] = useState("personnel");
  const [city, setCity] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [licenseYear, setLicenseYear] = useState("");
  const [claims, setClaims] = useState("0");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{
    reference: string;
    status: string;
    contacted: string[];
    raison?: string;
  } | null>(null);

  const eligible = useMemo(
    () =>
      (partners.data ?? []).filter(
        (p) =>
          (p.formulas.length === 0 || p.formulas.includes(formula)) &&
          (p.usages.length === 0 || p.usages.includes(usage)),
      ),
    [partners.data, formula, usage],
  );

  const demander = trpc.insuranceEngine.demanderDevis.useMutation({
    onSuccess: (r) => {
      setResult({
        reference: r.reference,
        status: r.status,
        contacted: r.contactedPartners.map((p) => p.name),
        raison: r.raison,
      });
      mesDemandes.refetch();
    },
  });

  const submit = () => {
    demander.mutate({
      countryCode,
      city: city.trim() || undefined,
      formula: formula as "tiers" | "tiers_plus" | "tous_risques",
      usage: usage as
        | "personnel"
        | "trajet_travail"
        | "professionnel"
        | "vtc_taxi"
        | "flotte",
      vehicleBrand: brand.trim() || undefined,
      vehicleModel: model.trim() || undefined,
      vehicleYear: year ? Number(year) : undefined,
      plate: plate.trim() || undefined,
      driverLicenseYear: licenseYear ? Number(licenseYear) : undefined,
      claimsLast3Years: claims ? Number(claims) : undefined,
      contactName: name.trim() || undefined,
      contactEmail: email.trim() || undefined,
      contactPhone: phone.trim() || undefined,
      message: message.trim() || undefined,
    });
  };

  const input =
    "w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#D4AF37]";
  const label = "mb-1 block text-xs font-semibold text-[#6B7280]";

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/operations" className="mb-2 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Opérations
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Shield size={20} className="text-[#D4AF37]" /> MKA.P-MS Assurance
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Mise en relation avec les assureurs référencés en {countryCode}. Aucun tarif n'est
          annoncé avant l'offre d'un assureur.
        </p>
      </div>

      {/* Assureurs réellement référencés — jamais une liste d'exemple. */}
      <div className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="mb-2 text-sm font-black text-[#111]">Assureurs partenaires ({countryCode})</h2>
        {partners.isLoading ? (
          <p className="text-xs text-[#6B7280]">Chargement…</p>
        ) : (partners.data ?? []).length === 0 ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Aucun assureur partenaire n'est encore référencé pour ce pays. Votre demande sera
            enregistrée et traitée dès qu'un partenaire est disponible — elle ne sera pas
            transmise dans l'immédiat.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {(partners.data ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs text-[#374151]"
              >
                <span className="font-bold text-[#111]">{p.name}</span>
                {p.formulas.length > 0 && (
                  <span className="text-[#6B7280]">
                    {" "}
                    — {p.formulas
                      .map(
                        (f) =>
                          catalog.data?.formulas.find((c) => c.code === f)?.label ?? f,
                      )
                      .join(", ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Demande de couverture */}
      <div className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <h2 className="mb-3 text-sm font-black text-[#111]">Demander une assurance</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={label}>Pays</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={input}
            >
              {PAYS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Formule</label>
            <select value={formula} onChange={(e) => setFormula(e.target.value)} className={input}>
              {(catalog.data?.formulas ?? []).map((f) => (
                <option key={f.code} value={f.code}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Usage du véhicule</label>
            <select value={usage} onChange={(e) => setUsage(e.target.value)} className={input}>
              {(catalog.data?.usages ?? []).map((u) => (
                <option key={u.code} value={u.code}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Ville</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Marque</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Modèle</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Année</label>
            <input
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Immatriculation (saisie manuelle, facultative)</label>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="AB-123-CD"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Année du permis</label>
            <input
              inputMode="numeric"
              value={licenseYear}
              onChange={(e) => setLicenseYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Sinistres sur 3 ans</label>
            <input
              inputMode="numeric"
              value={claims}
              onChange={(e) => setClaims(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Votre nom</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Téléphone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
          </div>
        </div>

        <div className="mt-3">
          <label className={label}>Précisions (facultatif)</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={input}
          />
        </div>

        <p className="mt-2 text-[11px] text-[#6B7280]">
          {eligible.length > 0
            ? `${eligible.length} assureur(s) partenaire(s) couvrent cette formule et cet usage en ${countryCode}.`
            : "Aucun assureur partenaire ne couvre encore cette combinaison : la demande sera enregistrée en attente."}
        </p>

        <button
          type="button"
          onClick={submit}
          disabled={demander.isPending}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-[#D4AF37] disabled:opacity-50"
        >
          <Search size={15} /> {demander.isPending ? "Envoi…" : "Demander une assurance"}
        </button>

        {result && (
          <div
            className={`mt-3 rounded-xl border p-3 text-xs ${
              result.status === "transmise"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            <p className="flex items-center gap-1 font-bold">
              {result.status === "transmise" ? <Check size={13} /> : <AlertTriangle size={13} />}
              Référence {result.reference}
            </p>
            <p className="mt-1">
              {result.status === "transmise"
                ? `Transmise à : ${result.contacted.join(", ")}.`
                : result.raison}
            </p>
            <p className="mt-1 text-[11px] opacity-80">
              Aucun prix n'est fixé par la plateforme : l'offre viendra de l'assureur.
            </p>
          </div>
        )}
      </div>

      {/* Suivi des demandes du compte */}
      {user && (
        <div className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#111]">
            <FileText size={15} className="text-[#D4AF37]" /> Mes demandes
          </h2>
          {mesDemandes.isLoading ? (
            <p className="text-xs text-[#6B7280]">Chargement…</p>
          ) : (mesDemandes.data ?? []).length === 0 ? (
            <p className="text-xs text-[#6B7280]">Aucune demande enregistrée.</p>
          ) : (
            <ul className="space-y-1.5">
              {(mesDemandes.data ?? []).map((d) => (
                <li
                  key={d.id}
                  className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs text-[#374151]"
                >
                  <span className="font-mono font-bold text-[#111]">{d.reference}</span> —{" "}
                  {STATUS_LABEL[d.status] ?? d.status}
                  {d.offerAmount ? (
                    <span className="font-bold text-emerald-700">
                      {" "}
                      · offre {d.offerAmount} {d.offerCurrency ?? ""}
                    </span>
                  ) : (
                    <span className="text-[#6B7280]"> · aucune offre enregistrée</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
