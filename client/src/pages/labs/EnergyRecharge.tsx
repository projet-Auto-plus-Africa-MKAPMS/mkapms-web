/**
 * MKA.P-MS Energy — Recharge (point 45).
 *
 * Cette page était un module vide. C'est maintenant un annuaire de bornes avec
 * ses filtres adaptés (pays, ville, type de prise, puissance minimale, accès) et
 * un bouton Rechercher qui agit réellement.
 *
 * Aucune borne n'est inventée : l'annuaire n'affiche que des bornes validées, il
 * distingue « aucune borne référencée dans ce pays » de « aucune borne ne
 * correspond à vos filtres », et toute déclaration attend une vérification
 * humaine avant d'apparaître.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Battery,
  Search,
  MapPin,
  Zap,
  Plus,
  Info,
  Check,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const PAYS = ["FR", "BE", "ES", "MA", "TN", "SN", "CI", "ML", "GN"];
const PUISSANCES = [0, 7, 22, 50, 100, 150];

type Connector = "type2" | "ccs" | "chademo" | "type1" | "domestique";
type Access = "public" | "reserve_clients" | "prive" | "abonnement";

export default function EnergyRecharge() {
  const { user } = useAuth();
  const catalog = trpc.chargingEngine.catalog.useQuery();

  const [countryCode, setCountryCode] = useState("FR");
  const [city, setCity] = useState("");
  const [connector, setConnector] = useState("");
  const [minPowerKw, setMinPowerKw] = useState(0);
  const [access, setAccess] = useState("");
  const [query, setQuery] = useState<{
    countryCode: string;
    city?: string;
    connector?: Connector;
    minPowerKw?: number;
    access?: Access;
  }>({ countryCode: "FR" });

  const results = trpc.chargingEngine.rechercher.useQuery(query);

  const lancerRecherche = () =>
    setQuery({
      countryCode,
      city: city.trim() || undefined,
      connector: (connector || undefined) as Connector | undefined,
      minPowerKw: minPowerKw || undefined,
      access: (access || undefined) as Access | undefined,
    });

  const [showDeclare, setShowDeclare] = useState(false);
  const [dName, setDName] = useState("");
  const [dOperator, setDOperator] = useState("");
  const [dCity, setDCity] = useState("");
  const [dAddress, setDAddress] = useState("");
  const [dConnectors, setDConnectors] = useState<Connector[]>([]);
  const [dPower, setDPower] = useState("");
  const [dOutlets, setDOutlets] = useState("");
  const [dAccess, setDAccess] = useState<Access>("public");
  const [dPricing, setDPricing] = useState("");
  const [dHours, setDHours] = useState("");
  const [declareMsg, setDeclareMsg] = useState<string | null>(null);

  const declarer = trpc.chargingEngine.declarer.useMutation({
    onSuccess: (r) => {
      setDeclareMsg(r.message);
      setShowDeclare(false);
    },
    onError: (e) => setDeclareMsg(e.message),
  });

  const input =
    "w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111] outline-none focus:border-[#D4AF37]";
  const label = "mb-1 block text-xs font-semibold text-[#6B7280]";

  const connectorLabel = (code: string) =>
    catalog.data?.connectors.find((c) => c.code === code)?.label ?? code;
  const accessLabel = (code: string) =>
    catalog.data?.access.find((a) => a.code === code)?.label ?? code;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/labs" className="mb-2 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> MKA.P-MS Labs
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-black text-white">
          <Battery size={20} className="text-[#D4AF37]" /> MKA.P-MS Energy — Recharge
        </h1>
        <p className="mt-1 text-xs text-white/60">
          Bornes de recharge vérifiées. Une borne déclarée n'apparaît qu'après validation.
        </p>
      </div>

      {/* Filtres adaptés + bouton Rechercher */}
      <div className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
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
            <label className={label}>Ville</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lancerRecherche()}
              placeholder="Toutes les villes"
              className={input}
            />
          </div>
          <div>
            <label className={label}>Type de prise</label>
            <select
              value={connector}
              onChange={(e) => setConnector(e.target.value)}
              className={input}
            >
              <option value="">Toutes les prises</option>
              {(catalog.data?.connectors ?? []).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Puissance minimale</label>
            <select
              value={minPowerKw}
              onChange={(e) => setMinPowerKw(Number(e.target.value))}
              className={input}
            >
              {PUISSANCES.map((p) => (
                <option key={p} value={p}>
                  {p === 0 ? "Toutes puissances" : `${p} kW et plus`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Accès</label>
            <select value={access} onChange={(e) => setAccess(e.target.value)} className={input}>
              <option value="">Tous les accès</option>
              {(catalog.data?.access ?? []).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={lancerRecherche}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-[#D4AF37]"
        >
          <Search size={15} /> Rechercher
        </button>
      </div>

      {/* Résultats */}
      <div className="mx-4 mt-4">
        {results.isLoading ? (
          <p className="text-xs text-[#6B7280]">Recherche…</p>
        ) : results.data && results.data.points.length > 0 ? (
          <>
            <p className="mb-2 text-xs text-[#6B7280]">
              {results.data.points.length} borne(s) affichée(s) sur {results.data.totalInCountry}{" "}
              référencée(s) en {query.countryCode}.
            </p>
            <ul className="space-y-2">
              {results.data.points.map((p) => (
                <li key={p.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-[#111]">{p.name}</p>
                      <p className="flex items-center gap-1 text-xs text-[#6B7280]">
                        <MapPin size={11} />
                        {p.address ? `${p.address}, ` : ""}
                        {p.postalCode ? `${p.postalCode} ` : ""}
                        {p.city}
                      </p>
                      {p.operator && (
                        <p className="text-[11px] text-[#6B7280]">Exploitant : {p.operator}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-lg bg-[#F5F3EF] px-2 py-1 text-[11px] font-bold text-[#111]">
                      {p.powerKw ? `${p.powerKw} kW` : "Puissance non précisée"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.connectors.length > 0 ? (
                      p.connectors.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#374151]"
                        >
                          <Zap size={10} className="text-[#D4AF37]" /> {connectorLabel(c)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#6B7280]">Prise non précisée</span>
                    )}
                    <span className="rounded-lg bg-[#111] px-2 py-0.5 text-[11px] font-bold text-[#D4AF37]">
                      {accessLabel(p.access)}
                    </span>
                    {p.outlets ? (
                      <span className="text-[11px] text-[#6B7280]">{p.outlets} point(s)</span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#6B7280]">
                    {p.pricingNote ? `Tarif annoncé : ${p.pricingNote}` : "Tarif non communiqué"}
                    {p.openingHours ? ` · ${p.openingHours}` : ""}
                    {p.hasCoordinates ? "" : " · position GPS non renseignée"}
                  </p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="flex items-start gap-2 text-xs text-[#6B7280]">
              <Info size={13} className="mt-0.5 shrink-0 text-[#D4AF37]" />
              {results.data?.raison ?? "Aucune borne trouvée."}
            </p>
          </div>
        )}
      </div>

      {/* Déclaration d'une borne — validation humaine obligatoire */}
      <div className="mx-4 mt-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-[#111]">Signaler une borne</h2>
          {user ? (
            <button
              type="button"
              onClick={() => setShowDeclare((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-bold text-[#111]"
            >
              <Plus size={12} /> {showDeclare ? "Fermer" : "Ajouter"}
            </button>
          ) : (
            <Link to="/connexion" className="text-xs font-bold text-[#D4AF37]">
              Se connecter pour signaler
            </Link>
          )}
        </div>

        {declareMsg && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <Check size={13} className="mt-0.5 shrink-0" /> {declareMsg}
          </p>
        )}

        {showDeclare && user && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Nom du site</label>
              <input value={dName} onChange={(e) => setDName(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Exploitant</label>
              <input
                value={dOperator}
                onChange={(e) => setDOperator(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Ville</label>
              <input value={dCity} onChange={(e) => setDCity(e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Adresse</label>
              <input
                value={dAddress}
                onChange={(e) => setDAddress(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Puissance (kW)</label>
              <input
                inputMode="numeric"
                value={dPower}
                onChange={(e) => setDPower(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Nombre de points de charge</label>
              <input
                inputMode="numeric"
                value={dOutlets}
                onChange={(e) => setDOutlets(e.target.value.replace(/\D/g, "").slice(0, 3))}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Accès</label>
              <select
                value={dAccess}
                onChange={(e) => setDAccess(e.target.value as Access)}
                className={input}
              >
                {(catalog.data?.access ?? []).map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Horaires</label>
              <input value={dHours} onChange={(e) => setDHours(e.target.value)} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Tarif annoncé sur place (texte)</label>
              <input
                value={dPricing}
                onChange={(e) => setDPricing(e.target.value)}
                placeholder="ex. 0,45 €/kWh"
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Prises disponibles</label>
              <div className="flex flex-wrap gap-1.5">
                {(catalog.data?.connectors ?? []).map((c) => {
                  const on = dConnectors.includes(c.code as Connector);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() =>
                        setDConnectors((prev) =>
                          on
                            ? prev.filter((x) => x !== c.code)
                            : [...prev, c.code as Connector],
                        )
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        on
                          ? "border-[#111] bg-[#111] text-[#D4AF37]"
                          : "border-[#E5E7EB] bg-white text-[#374151]"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={
                  declarer.isPending ||
                  !dName.trim() ||
                  !dCity.trim() ||
                  dConnectors.length === 0
                }
                onClick={() =>
                  declarer.mutate({
                    name: dName.trim(),
                    operator: dOperator.trim() || undefined,
                    countryCode,
                    city: dCity.trim(),
                    address: dAddress.trim() || undefined,
                    connectors: dConnectors,
                    powerKw: dPower ? Number(dPower) : undefined,
                    outlets: dOutlets ? Number(dOutlets) : undefined,
                    access: dAccess,
                    pricingNote: dPricing.trim() || undefined,
                    openingHours: dHours.trim() || undefined,
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#111] px-4 py-2.5 text-sm font-bold text-[#D4AF37] disabled:opacity-50"
              >
                {declarer.isPending ? "Envoi…" : "Envoyer pour vérification"}
              </button>
              <p className="mt-1 text-[11px] text-[#6B7280]">
                Nom, ville et au moins une prise sont nécessaires. La borne reste invisible dans
                l'annuaire jusqu'à sa validation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
