/**
 * Point 66 — MKA.P-MS COUNTRY POLICY ENGINE (écran PDG / Direction).
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il ne présente jamais une case vide de la matrice comme « autorisé » : une
 *    absence de règle est un arrêt de l'automatisation, pas un feu vert ;
 *  - il n'applique aucune règle d'un pays à un autre, même voisin ;
 *  - il distingue une règle déclarée d'une règle confirmée : seule la seconde
 *    est opposable, et sa réécriture annule la confirmation précédente ;
 *  - il montre les blocages réellement prononcés, avec leur motif exact.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ChevronLeft,
  Gavel,
  Globe,
  RefreshCw,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet = "couverture" | "regles" | "evaluer" | "journal";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "couverture", label: "Couverture" },
  { key: "regles", label: "Règles" },
  { key: "evaluer", label: "Tester une action" },
  { key: "journal", label: "Journal" },
];

const VERDICTS: Record<string, { label: string; ton: string }> = {
  autorise: { label: "Autorisé", ton: "bg-emerald-50 text-emerald-700" },
  bloque: { label: "Bloqué", ton: "bg-red-50 text-red-700" },
  validation_requise: { label: "Validation requise", ton: "bg-orange-50 text-orange-700" },
  hors_perimetre: { label: "Hors périmètre réglementaire", ton: "bg-black/5 text-black/60" },
};

const EFFETS: Record<string, { label: string; ton: string }> = {
  autorise: { label: "Autorisé", ton: "bg-emerald-50 text-emerald-700" },
  interdit: { label: "Interdit", ton: "bg-red-50 text-red-700" },
  conditionne: { label: "Sous conditions", ton: "bg-amber-50 text-amber-700" },
};

function dateCourte(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function CentreReglesPays() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const isPdg = user?.role === "super_admin";
  const [onglet, setOnglet] = useState<Onglet>("couverture");
  const [paysFiltre, setPaysFiltre] = useState("");
  const [domaineFiltre, setDomaineFiltre] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [testAction, setTestAction] = useState("");
  const [testPays, setTestPays] = useState("");

  const [formPays, setFormPays] = useState("");
  const [formDomaine, setFormDomaine] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formRegle, setFormRegle] = useState("");
  const [formEffet, setFormEffet] = useState<"autorise" | "interdit" | "conditionne">("autorise");
  const [formAutorite, setFormAutorite] = useState("");
  const [formSourceRef, setFormSourceRef] = useState("");

  const referentiels = trpc.countryPolicy.referentiels.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const stats = trpc.countryPolicy.stats.useQuery(undefined, {
    enabled: !!isDirection,
    refetchOnWindowFocus: false,
  });
  const couverture = trpc.countryPolicy.couverture.useQuery(undefined, {
    enabled: !!isDirection && onglet === "couverture",
    refetchOnWindowFocus: false,
  });
  const regles = trpc.countryPolicy.regles.useQuery(
    { countryCode: paysFiltre || undefined, domain: domaineFiltre || undefined, limit: 300 },
    { enabled: !!isDirection && onglet === "regles", refetchOnWindowFocus: false },
  );
  const evaluations = trpc.countryPolicy.evaluations.useQuery(
    { limit: 120 },
    { enabled: !!isDirection && onglet === "journal", refetchOnWindowFocus: false },
  );

  const evaluer = trpc.countryPolicy.evaluer.useMutation({
    onSuccess: (r) => setMessage(r.reason),
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const declarer = trpc.countryPolicy.declarerRegle.useMutation({
    onSuccess: () => {
      setMessage(
        "Règle enregistrée en projet. Elle n'autorise rien tant qu'elle n'est pas confirmée.",
      );
      setFormRegle("");
      setFormTopic("");
      regles.refetch();
      stats.refetch();
      couverture.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const confirmer = trpc.countryPolicy.confirmerRegle.useMutation({
    onSuccess: () => {
      setMessage("Règle confirmée : elle devient opposable pour ce pays uniquement.");
      regles.refetch();
      stats.refetch();
      couverture.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });
  const retirer = trpc.countryPolicy.retirerRegle.useMutation({
    onSuccess: () => {
      setMessage("Règle retirée : elle n'est plus opposable.");
      regles.refetch();
      stats.refetch();
      couverture.refetch();
    },
    onError: (e) => setMessage(`Échec : ${e.message}`),
  });

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const s = stats.data;
  const evalResult = evaluer.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Gavel size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Règles par pays</h1>
            <p className="text-xs text-white/50">
              Ce que la plateforme s'autorise dans chaque juridiction — une règle non confirmée
              arrête l'action.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stats.refetch();
              couverture.refetch();
            }}
            className="rounded-lg bg-white/10 p-2 text-white/70"
            aria-label="Recharger"
          >
            <RefreshCw size={16} className={stats.isFetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setOnglet(o.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${
              onglet === o.key ? "bg-[#111] text-white" : "bg-white text-black/60"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="space-y-4 px-4">
        {message ? (
          <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3 text-xs text-black/70">
            {message}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Carte
            titre="Règles confirmées"
            valeur={String(s?.regles.confirmees ?? 0)}
            detail={`sur ${s?.regles.pays ?? 0} pays`}
          />
          <Carte
            titre="Déclarées, non confirmées"
            valeur={String(s?.regles.projets ?? 0)}
            detail="n'autorisent rien"
          />
          <Carte
            titre="Actions bloquées"
            valeur={String(s?.evaluations.bloques ?? 0)}
            detail="interdiction constatée"
          />
          <Carte
            titre="Renvoyées en validation"
            valeur={String(s?.evaluations.validations ?? 0)}
            detail="règle pays non confirmée"
          />
        </div>

        {onglet === "couverture" ? (
          couverture.isLoading ? (
            <p className="text-sm text-black/50">Chargement de la couverture…</p>
          ) : (couverture.data?.pays ?? []).length === 0 ? (
            <p className="text-sm text-black/50">
              Aucun pays activé : aucune action réglementée ne peut être exécutée.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="flex items-start gap-1 text-[11px] text-black/50">
                <ShieldAlert size={12} className="mt-0.5 shrink-0 text-orange-600" />
                <span>
                  Une case sans règle confirmée n'est pas une autorisation : c'est l'endroit où
                  l'automatisation s'arrête et où un humain décide.
                </span>
              </p>
              {(couverture.data?.pays ?? []).map((p) => {
                const manquants = p.couverture.filter((c) => c.confirmees === 0);
                const couverts = p.couverture.filter((c) => c.confirmees > 0);
                return (
                  <div key={p.code} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-black/30" />
                      <p className="flex-1 text-sm font-bold text-[#111]">
                        {p.nameFr} <span className="text-black/40">({p.code})</span>
                      </p>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/60">
                        {couverts.length}/{p.couverture.length} domaines couverts
                      </span>
                    </div>

                    {couverts.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {couverts.map((c) => (
                          <span
                            key={c.domain}
                            className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                          >
                            <ShieldCheck size={10} />
                            {couverture.data?.domaines.find((d) => d.code === c.domain)?.label ??
                              c.domain}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {manquants.length > 0 ? (
                      <p className="mt-2 text-[11px] text-black/50">
                        Sans règle confirmée :{" "}
                        {manquants
                          .map(
                            (c) =>
                              couverture.data?.domaines.find((d) => d.code === c.domain)?.label ??
                              c.domain,
                          )
                          .join(", ")}
                        .
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )
        ) : null}

        {onglet === "regles" ? (
          <div className="space-y-3">
            {isPdg ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <p className="text-sm font-bold text-[#111]">Déclarer une règle</p>
                <p className="mt-0.5 text-[11px] text-black/50">
                  La règle entre en projet. Elle ne devient opposable qu'après confirmation, et
                  seulement pour le pays indiqué.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    value={formPays}
                    onChange={(e) => setFormPays(e.target.value.toUpperCase())}
                    placeholder="Pays (ex. SN)"
                    maxLength={4}
                    className="rounded-lg border border-black/10 px-2 py-2 text-xs"
                  />
                  <select
                    value={formDomaine}
                    onChange={(e) => setFormDomaine(e.target.value)}
                    className="rounded-lg border border-black/10 px-2 py-2 text-xs"
                  >
                    <option value="">Domaine réglementé…</option>
                    {(referentiels.data?.domaines ?? []).map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Sujet précis (facultatif)"
                    className="col-span-2 rounded-lg border border-black/10 px-2 py-2 text-xs"
                  />
                  <textarea
                    value={formRegle}
                    onChange={(e) => setFormRegle(e.target.value)}
                    placeholder="Texte de la règle, tel qu'il s'applique dans ce pays"
                    rows={3}
                    className="col-span-2 rounded-lg border border-black/10 px-2 py-2 text-xs"
                  />
                  <select
                    value={formEffet}
                    onChange={(e) =>
                      setFormEffet(e.target.value as "autorise" | "interdit" | "conditionne")
                    }
                    className="rounded-lg border border-black/10 px-2 py-2 text-xs"
                  >
                    {(referentiels.data?.effets ?? []).map((f) => (
                      <option key={f.code} value={f.code}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={formAutorite}
                    onChange={(e) => setFormAutorite(e.target.value)}
                    placeholder="Autorité / texte"
                    className="rounded-lg border border-black/10 px-2 py-2 text-xs"
                  />
                  <input
                    value={formSourceRef}
                    onChange={(e) => setFormSourceRef(e.target.value)}
                    placeholder="Référence de la source"
                    className="col-span-2 rounded-lg border border-black/10 px-2 py-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  disabled={
                    declarer.isPending ||
                    formPays.trim().length < 2 ||
                    !formDomaine ||
                    formRegle.trim().length < 3
                  }
                  onClick={() =>
                    declarer.mutate({
                      countryCode: formPays.trim(),
                      domain: formDomaine,
                      topic: formTopic.trim() || undefined,
                      rule: formRegle.trim(),
                      effect: formEffet,
                      authority: formAutorite.trim() || undefined,
                      sourceRef: formSourceRef.trim() || undefined,
                    })
                  }
                  className="mt-3 w-full rounded-xl bg-[#111] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {declarer.isPending ? "Enregistrement…" : "Enregistrer en projet"}
                </button>
              </div>
            ) : null}

            <div className="flex gap-2">
              <input
                value={paysFiltre}
                onChange={(e) => setPaysFiltre(e.target.value.toUpperCase())}
                placeholder="Filtrer par pays"
                maxLength={4}
                className="w-32 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs"
              />
              <select
                value={domaineFiltre}
                onChange={(e) => setDomaineFiltre(e.target.value)}
                className="flex-1 rounded-xl border border-black/10 bg-white px-2 text-xs"
              >
                <option value="">Tous domaines</option>
                {(referentiels.data?.domaines ?? []).map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {regles.isLoading ? (
              <p className="text-sm text-black/50">Chargement des règles…</p>
            ) : (regles.data ?? []).length === 0 ? (
              <p className="text-sm text-black/50">
                Aucune règle enregistrée pour ce filtre. Sans règle confirmée, toute action
                réglementée est renvoyée en validation humaine.
              </p>
            ) : (
              <div className="space-y-2">
                {(regles.data ?? []).map((r) => {
                  const ef = EFFETS[r.effect] ?? { label: r.effect, ton: "bg-black/5 text-black/60" };
                  return (
                    <div key={r.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <ScrollText size={14} className="mt-0.5 shrink-0 text-black/30" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#111]">
                            {r.domainLabel} — {r.countryCode}
                          </p>
                          {r.topic ? (
                            <p className="text-[11px] text-black/50">{r.topic}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ef.ton}`}>
                          {ef.label}
                        </span>
                      </div>

                      <p className="mt-2 text-[12px] text-black/70">{r.rule}</p>

                      <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-black/40">
                        {r.authority ? <span>{r.authority}</span> : <span>autorité non précisée</span>}
                        <span>
                          validité{" "}
                          {r.validFrom ? `du ${dateCourte(r.validFrom)}` : "sans date de début"}{" "}
                          {r.validUntil ? `au ${dateCourte(r.validUntil)}` : "sans échéance"}
                        </span>
                        <span>
                          fiabilité :{" "}
                          {r.confidence === null ? "non évaluée" : `${r.confidence}/100`}
                        </span>
                      </p>

                      <p
                        className={`mt-2 rounded-lg px-2 py-1.5 text-[11px] font-bold ${
                          r.opposable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {r.opposable
                          ? `Confirmée le ${dateCourte(r.verifiedAt)} — opposable en ${r.countryCode}`
                          : "Déclarée mais non confirmée — n'autorise rien"}
                      </p>

                      {isPdg ? (
                        <div className="mt-2 flex gap-2">
                          {!r.opposable ? (
                            <button
                              type="button"
                              onClick={() => confirmer.mutate({ id: r.id })}
                              disabled={confirmer.isPending}
                              className="flex-1 rounded-lg bg-[#111] px-3 py-2 text-[11px] font-bold text-white disabled:opacity-50"
                            >
                              Confirmer
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => retirer.mutate({ id: r.id })}
                              disabled={retirer.isPending}
                              className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-[11px] font-bold text-black/60 disabled:opacity-50"
                            >
                              Retirer
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {onglet === "evaluer" ? (
          <div className="space-y-3">
            <p className="text-[11px] text-black/50">
              Vérifie ce que la plateforme s'autorise pour une action donnée dans un pays donné.
              L'évaluation est journalisée comme toutes les autres.
            </p>
            <div className="rounded-xl border border-black/5 bg-white p-3">
              <input
                value={testAction}
                onChange={(e) => setTestAction(e.target.value)}
                placeholder="Type d'action (ex. facturation_auto, campagne_email)"
                className="w-full rounded-lg border border-black/10 px-2 py-2 text-xs"
              />
              <input
                value={testPays}
                onChange={(e) => setTestPays(e.target.value.toUpperCase())}
                placeholder="Pays (facultatif — vide = pays non précisé)"
                maxLength={4}
                className="mt-2 w-full rounded-lg border border-black/10 px-2 py-2 text-xs"
              />
              <button
                type="button"
                disabled={evaluer.isPending || testAction.trim().length === 0}
                onClick={() =>
                  evaluer.mutate({
                    actionType: testAction.trim(),
                    countryCode: testPays.trim() || undefined,
                  })
                }
                className="mt-3 w-full rounded-xl bg-[#111] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {evaluer.isPending ? "Évaluation…" : "Évaluer"}
              </button>
            </div>

            {evalResult ? (
              <div className="rounded-xl border border-black/5 bg-white p-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    (VERDICTS[evalResult.verdict] ?? VERDICTS.hors_perimetre).ton
                  }`}
                >
                  {(VERDICTS[evalResult.verdict] ?? VERDICTS.hors_perimetre).label}
                </span>
                <p className="mt-2 text-[12px] text-black/70">{evalResult.reason}</p>
                <p className="mt-2 text-[11px] text-black/40">
                  {evalResult.domain ? `Domaine : ${evalResult.domain}` : "Aucun domaine réglementé"}{" "}
                  · {evalResult.countryCode ? `pays ${evalResult.countryCode}` : "pays non précisé"}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {onglet === "journal" ? (
          evaluations.isLoading ? (
            <p className="text-sm text-black/50">Chargement du journal…</p>
          ) : (evaluations.data ?? []).length === 0 ? (
            <p className="text-sm text-black/50">
              Aucune action réglementée n'a encore été évaluée.
            </p>
          ) : (
            <div className="space-y-2">
              {(evaluations.data ?? []).map((e) => {
                const v = VERDICTS[e.verdict] ?? { label: e.verdict, ton: "bg-black/5 text-black/60" };
                return (
                  <div key={e.id} className="rounded-xl border border-black/5 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#111]">{e.actionType}</p>
                        <p className="mt-0.5 text-[11px] text-black/50">
                          {e.countryCode ? `pays ${e.countryCode}` : "pays non précisé"} ·{" "}
                          {e.domain ?? "hors domaine réglementé"} · {dateCourte(e.createdAt)}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${v.ton}`}>
                        {v.label}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-black/60">{e.reason}</p>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
