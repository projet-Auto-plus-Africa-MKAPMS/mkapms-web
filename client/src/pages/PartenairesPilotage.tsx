/**
 * Pilotage du réseau partenaires (points 36-37) — Direction / PDG.
 *
 * Trois volets : candidatures à décider, réseau avec performance réelle, et
 * opportunités détectées là où la demande dépasse l'offre.
 *
 * Aucune action d'acquisition n'est déclenchée sans clic humain, et l'écran
 * affiche l'état exact de chaque action préparée — y compris « impossible »
 * avec sa raison (par exemple : aucune base email consentie sur ce pays).
 */
import { useState } from "react";
import { Handshake, Loader2, MapPin, TrendingUp, Users } from "lucide-react";
import { trpc } from "../lib/trpc";

type Tab = "candidatures" | "reseau" | "opportunites";

const PRIORITY_STYLE: Record<string, string> = {
  critique: "bg-red-100 text-red-700",
  important: "bg-orange-100 text-orange-700",
  a_surveiller: "bg-amber-100 text-amber-700",
};

export default function PartenairesPilotage() {
  const [tab, setTab] = useState<Tab>("opportunites");
  const utils = trpc.useUtils();

  const health = trpc.partnerEngine.health.useQuery();
  const applications = trpc.partnerEngine.applications.useQuery(undefined, {
    enabled: tab === "candidatures",
  });
  const network = trpc.partnerEngine.network.useQuery(undefined, { enabled: tab === "reseau" });
  const opportunities = trpc.partnerEngine.opportunities.useQuery(undefined, {
    enabled: tab === "opportunites",
  });

  const review = trpc.partnerEngine.review.useMutation({
    onSuccess: () => {
      void utils.partnerEngine.applications.invalidate();
      void utils.partnerEngine.health.invalidate();
    },
  });
  const detect = trpc.partnerEngine.detect.useMutation({
    onSuccess: () => void utils.partnerEngine.opportunities.invalidate(),
  });
  const prepare = trpc.partnerEngine.prepareActions.useMutation({
    onSuccess: () => void utils.partnerEngine.opportunities.invalidate(),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Handshake className="w-7 h-7 text-[#D4AF37]" />
        <h1 className="text-2xl font-bold">Réseau partenaires</h1>
      </div>

      {health.data && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="font-semibold">
            {health.data.partenairesActifs}/{health.data.partenaires} partenaire(s) actif(s) —{" "}
            {health.data.zonesCouvertes} zone(s) couverte(s) — {health.data.contratsActifs} contrat(s) actif(s)
          </div>
          {health.data.details.length > 0 && (
            <ul className="mt-1 text-sm text-gray-600 list-disc pl-5">
              {health.data.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {([
          ["opportunites", "Opportunités", TrendingUp],
          ["candidatures", "Candidatures", Users],
          ["reseau", "Réseau", MapPin],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === key ? "bg-[#0B1B33] text-white" : "bg-white border border-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Opportunités (point 37) ── */}
      {tab === "opportunites" && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => detect.mutate({ periodDays: 30 })}
              disabled={detect.isPending}
              className="rounded-lg bg-[#0B1B33] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {detect.isPending ? "Analyse…" : "Analyser la demande (30 jours)"}
            </button>
            {detect.data && (
              <span className="text-sm text-gray-600">
                {detect.data.limite
                  ? detect.data.limite
                  : `${detect.data.searchesAnalysed} recherche(s) analysée(s) — ${detect.data.created} nouvelle(s), ${detect.data.updated} mise(s) à jour.`}
              </span>
            )}
          </div>

          {opportunities.isLoading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}
          {opportunities.data?.length === 0 && (
            <p className="text-gray-600">
              Aucune opportunité ouverte : soit l'offre couvre la demande mesurée, soit aucune recherche n'a encore été
              enregistrée sur la période.
            </p>
          )}

          <div className="grid gap-3">
            {(opportunities.data ?? []).map((o) => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">
                    {o.serviceLabel} — {o.city ?? o.countryCode}
                  </h3>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      PRIORITY_STYLE[o.priority] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{o.constat}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => prepare.mutate({ opportunityId: o.id })}
                    disabled={prepare.isPending}
                    className="rounded-lg border border-[#0B1B33] px-3 py-1.5 text-sm font-semibold text-[#0B1B33] disabled:opacity-50"
                  >
                    Préparer les actions d'acquisition
                  </button>
                  <span className="text-xs text-gray-500">
                    Page SEO non indexée + contenus en attente de validation. Aucune publication automatique.
                  </span>
                </div>

                {o.actions.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm">
                    {o.actions.map((a, i) => {
                      const kind = typeof a.kind === "string" ? a.kind : "action";
                      const state = typeof a.state === "string" ? a.state : "";
                      const detail = typeof a.detail === "string" ? a.detail : "";
                      return (
                        <li key={`${kind}-${i}`} className="flex gap-2">
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                              state === "prepare" ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {kind}
                          </span>
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Candidatures (point 36) ── */}
      {tab === "candidatures" && (
        <div className="grid gap-3">
          {applications.isLoading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}
          {applications.data?.length === 0 && <p className="text-gray-600">Aucune candidature reçue.</p>}
          {(applications.data ?? []).map((a) => (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{a.companyName}</h3>
                <span className="text-xs font-semibold text-gray-600">{a.status}</span>
              </div>
              <p className="text-sm text-gray-700">
                {a.profession} — {a.city ? `${a.city} (${a.countryCode})` : a.countryCode}
                {a.zoneRadiusKm ? ` — rayon ${a.zoneRadiusKm} km` : ""}
              </p>
              <p className="text-sm text-gray-600">
                Services : {a.services.length > 0 ? a.services.join(", ") : "non précisés"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {a.reference} — {a.contactEmail ?? "email non fourni"} — {a.contactPhone ?? "téléphone non fourni"}
              </p>
              {a.status !== "acceptee" && a.status !== "refusee" && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => review.mutate({ id: a.id, decision: "acceptee" })}
                    disabled={review.isPending}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => review.mutate({ id: a.id, decision: "refusee" })}
                    disabled={review.isPending}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => review.mutate({ id: a.id, decision: "en_examen" })}
                    disabled={review.isPending}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Mettre en examen
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Réseau et performance réelle (point 36) ── */}
      {tab === "reseau" && (
        <div className="grid gap-3">
          {network.isLoading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
            </div>
          )}
          {network.data?.length === 0 && <p className="text-gray-600">Aucun partenaire enregistré.</p>}
          {(network.data ?? []).map((p) => (
            <div key={p.partnerId} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{p.name}</h3>
                <span className={`text-xs font-semibold ${p.active ? "text-green-700" : "text-gray-500"}`}>
                  {p.active ? "actif" : "inactif"}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {p.type} — {p.country ?? "pays non renseigné"}
                {p.cities.length > 0 ? ` — ${p.cities.join(", ")}` : ""}
              </p>
              <p className="text-sm text-gray-600">
                Services couverts : {p.services.length > 0 ? p.services.join(", ") : "aucune zone déclarée"}
              </p>
              <p className="text-sm text-gray-600">
                Contrat :{" "}
                {p.contract
                  ? `${p.contract.reference} (${p.contract.kind}, ${p.contract.status})${
                      p.contract.commissionRate !== null ? ` — commission ${p.contract.commissionRate} %` : ""
                    }`
                  : "aucun contrat enregistré"}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {p.performance.leads} lead(s) — {p.performance.concluded} conclu(s) — {p.performance.lost} perdu(s) —{" "}
                {p.performance.knownRevenue !== null
                  ? `${p.performance.knownRevenue} de chiffre connu`
                  : "aucun montant conclu renseigné"}
                {p.performance.commissionDue !== null ? ` — commission due ${p.performance.commissionDue}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
