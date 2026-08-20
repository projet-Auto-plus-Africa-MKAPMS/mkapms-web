/**
 * Point 55 — Centre Réputation & Avis (PDG / Direction).
 *
 * Réservé au PDG (super_admin) et au Directeur / Administration (admin).
 *
 * Ce que l'écran refuse de faire, volontairement :
 *  - il n'affiche jamais « 0/5 » quand il n'y a aucun avis : il dit qu'il n'y a
 *    pas d'avis ;
 *  - il ne mélange pas les avis MKA.P-MS et les avis Google dans une moyenne
 *    commune : les deux sources ont leur propre onglet ;
 *  - il marque « volume insuffisant » une note qui repose sur moins de 5 avis,
 *    pour qu'une décision ne soit pas prise sur deux clients.
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  Flag,
  Globe,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type Onglet =
  | "global"
  | "pays"
  | "services"
  | "professionnels"
  | "google"
  | "verifies"
  | "signalements"
  | "reponses"
  | "tendances"
  | "alertes"
  | "audience";

const ONGLETS: { key: Onglet; label: string }[] = [
  { key: "global", label: "Global" },
  { key: "pays", label: "Pays" },
  { key: "services", label: "Services" },
  { key: "professionnels", label: "Professionnels" },
  { key: "verifies", label: "Avis vérifiés" },
  { key: "google", label: "Avis Google" },
  { key: "signalements", label: "Signalements" },
  { key: "reponses", label: "Réponses" },
  { key: "tendances", label: "Tendances" },
  { key: "alertes", label: "Alertes Intelligence" },
  { key: "audience", label: "Audience" },
];

function note(valeur: number | null): string {
  return valeur === null ? "—" : `${valeur.toFixed(2)}/5`;
}

function Carte({
  titre,
  valeur,
  detail,
}: {
  titre: string;
  valeur: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-black/40">{titre}</p>
      <p className="mt-1 text-lg font-black text-[#111]">{valeur}</p>
      {detail ? <p className="mt-0.5 text-[11px] text-black/50">{detail}</p> : null}
    </div>
  );
}

export default function CentreReputation() {
  const { user } = useAuth();
  const isDirection = user?.role === "super_admin" || user?.role === "admin";
  const [onglet, setOnglet] = useState<Onglet>("global");

  const centre = trpc.reputationEngine.centre.useQuery(
    { limitProfessionnels: 100 },
    { enabled: !!isDirection, refetchOnWindowFocus: false },
  );
  const conseils = trpc.reputationEngine.conseilsAudience.useQuery(
    { limit: 100 },
    { enabled: !!isDirection && onglet === "audience", refetchOnWindowFocus: false },
  );

  if (!user || !isDirection) return <Navigate to="/" replace />;

  const d = centre.data;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="mb-3 flex items-center gap-1 text-sm text-white/60">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <Star size={20} className="text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Réputation &amp; Avis</h1>
            <p className="text-xs text-white/50">
              Réputation globale MKA.P-MS, sans mélanger les professionnels ni les sources.
            </p>
          </div>
          <button
            type="button"
            onClick={() => centre.refetch()}
            className="rounded-lg bg-white/10 p-2 text-white/70"
            aria-label="Recharger"
          >
            <RefreshCw size={16} className={centre.isFetching ? "animate-spin" : ""} />
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
        {centre.isLoading ? (
          <p className="text-sm text-black/50">Chargement de la réputation…</p>
        ) : centre.error ? (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Réputation indisponible : {centre.error.message}
          </p>
        ) : !d ? null : (
          <>
            {onglet === "global" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Carte
                    titre="Note plateforme"
                    valeur={note(d.global.noteMoyenne)}
                    detail={
                      d.global.raison ?? `sur ${d.global.avisPublies} avis MKA.P-MS publiés`
                    }
                  />
                  <Carte
                    titre="Expériences vérifiées"
                    valeur={String(d.global.avisVerifies)}
                    detail={`sur ${d.global.avisPublies} avis publiés`}
                  />
                  <Carte
                    titre="Avis 30 derniers jours"
                    valeur={String(d.global.avis30Jours)}
                  />
                  <Carte
                    titre="Taux de réponse"
                    valeur={`${d.global.tauxReponsePct} %`}
                    detail={`${d.reponses.avisSansReponse} avis sans réponse`}
                  />
                  <Carte
                    titre="En vérification"
                    valeur={String(d.global.avisEnModeration)}
                  />
                  <Carte
                    titre="Masqués / signalés"
                    valeur={String(d.global.avisMasques)}
                    detail="chaque retrait porte un motif tracé"
                  />
                </div>
                <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-[#111]">
                    <ShieldCheck size={13} /> Ce que ce centre ne fait pas
                  </p>
                  <ul className="space-y-1 text-[11px] text-black/60">
                    {d.avertissements.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {(onglet === "pays" || onglet === "services") && (
              <div className="space-y-2">
                {(onglet === "pays" ? d.pays : d.services).length === 0 ? (
                  <p className="text-sm text-black/50">Aucun avis publié pour l'instant.</p>
                ) : (
                  (onglet === "pays" ? d.pays : d.services).map((r) => (
                    <div
                      key={r.cle}
                      className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3"
                    >
                      {onglet === "pays" ? (
                        <Globe size={16} className="text-[#D4AF37]" />
                      ) : (
                        <Building2 size={16} className="text-[#D4AF37]" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#111]">{r.libelle}</p>
                        <p className="text-[11px] text-black/50">
                          {r.avis} avis · {r.avisVerifies} vérifié(s) · {r.tauxReponsePct} % de
                          réponses
                        </p>
                      </div>
                      <p className="text-sm font-black text-[#111]">{note(r.noteMoyenne)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "professionnels" && (
              <div className="space-y-2">
                {d.professionnels.length === 0 ? (
                  <p className="text-sm text-black/50">
                    Aucun professionnel n'a encore reçu d'avis.
                  </p>
                ) : (
                  d.professionnels.map((p) => (
                    <div
                      key={`${p.targetType}-${p.targetId}-${p.univers}`}
                      className="rounded-xl border border-black/5 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Users size={15} className="text-[#D4AF37]" />
                        <p className="flex-1 text-sm font-bold text-[#111]">
                          {p.libelleUnivers} #{p.targetId}
                        </p>
                        <p className="text-sm font-black text-[#111]">{note(p.noteMoyenne)}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-black/50">
                        {p.avis} avis · {p.avisVerifies} vérifié(s) · {p.avisSansReponse} sans
                        réponse · note de classement {p.notePonderee.toFixed(2)}
                      </p>
                      {p.volumeInsuffisant ? (
                        <p className="mt-1 text-[11px] font-bold text-amber-700">
                          Volume insuffisant : cette note ne permet pas de conclure.
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "verifies" && (
              <div className="space-y-2">
                <Carte
                  titre="Expériences vérifiées"
                  valeur={`${d.global.avisVerifies} / ${d.global.avisPublies}`}
                  detail="une expérience n'est vérifiée que si la plateforme a constaté la transaction"
                />
                {d.services.map((s) => (
                  <div
                    key={s.cle}
                    className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-3"
                  >
                    <ShieldCheck size={15} className="text-[#D4AF37]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111]">{s.libelle}</p>
                      <p className="text-[11px] text-black/50">
                        {s.avisVerifies} vérifié(s) sur {s.avis} avis
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onglet === "google" && (
              <div className="space-y-2">
                <div className="rounded-xl border border-black/5 bg-white p-3">
                  <p className="text-sm font-bold text-[#111]">
                    Connecteur Google Business Profile : {d.google.etat.state}
                  </p>
                  <p className="mt-1 text-[11px] text-black/60">{d.google.etat.message}</p>
                  <p className="mt-2 text-[11px] text-black/50">
                    Les avis Google ne sont jamais additionnés aux avis MKA.P-MS.
                  </p>
                </div>
                {d.google.etablissements.length === 0 ? (
                  <p className="text-sm text-black/50">
                    Aucun établissement physique déclaré pour l'instant.
                  </p>
                ) : (
                  d.google.etablissements.map((e) => (
                    <div key={e.locationId} className="rounded-xl border border-black/5 bg-white p-3">
                      <p className="text-sm font-bold text-[#111]">{e.nom}</p>
                      <p className="text-[11px] text-black/50">
                        {[e.ville, e.pays].filter(Boolean).join(" · ") || "localisation non renseignée"}{" "}
                        · {e.statut}
                      </p>
                      <p className="mt-1 text-[11px] text-black/60">
                        {e.note === null
                          ? "Aucun relevé Google effectué."
                          : `${e.note}/5 sur ${e.avis} avis Google — relevé ${
                              e.fromApi ? "obtenu de Google" : "saisi à la main"
                            }${e.releveLe ? ` le ${new Date(e.releveLe).toLocaleDateString("fr-FR")}` : ""}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "signalements" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Carte titre="Signalements ouverts" valeur={String(d.signalements.ouverts)} />
                  <Carte titre="Dont critiques" valeur={String(d.signalements.critiques)} />
                </div>
                {d.signalements.derniers.length === 0 ? (
                  <p className="text-sm text-black/50">Aucun signal en attente de décision.</p>
                ) : (
                  d.signalements.derniers.map((s) => (
                    <div key={s.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-red-500" />
                        <p className="flex-1 text-sm font-bold text-[#111]">{s.type}</p>
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold">
                          {s.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-black/60">{s.detail}</p>
                      <p className="mt-1 text-[10px] text-black/40">
                        Avis #{s.reviewId} · {new Date(s.createdAt).toLocaleDateString("fr-FR")} ·
                        décision humaine requise
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "reponses" && (
              <div className="grid grid-cols-2 gap-2">
                <Carte titre="Taux de réponse" valeur={`${d.reponses.tauxReponsePct} %`} />
                <Carte titre="Avis sans réponse" valeur={String(d.reponses.avisSansReponse)} />
                <Carte
                  titre="Sans réponse depuis 7 jours"
                  valeur={String(d.reponses.enRetard)}
                  detail="un avis sans réponse reste visible tel quel"
                />
              </div>
            )}

            {onglet === "tendances" && (
              <div className="space-y-2">
                {d.tendances.length === 0 ? (
                  <p className="text-sm text-black/50">
                    Aucune tendance : il faut au moins 3 avis sur la période pour conclure.
                  </p>
                ) : (
                  d.tendances.map((t, i) => (
                    <div
                      key={`${t.kind}-${t.targetType}-${t.targetId}-${i}`}
                      className="rounded-xl border border-black/5 bg-white p-3"
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#D4AF37]" />
                        <p className="flex-1 text-sm text-[#111]">{t.constat}</p>
                      </div>
                      <p className="mt-1 text-[10px] text-black/40">
                        {t.targetType} #{t.targetId} ·{" "}
                        {Object.entries(t.preuve)
                          .map(([k, v]) => `${k} : ${v}`)
                          .join(" · ")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "alertes" && (
              <div className="space-y-2">
                {d.alertesIA.length === 0 ? (
                  <p className="text-sm text-black/50">Aucune alerte d'avis ouverte.</p>
                ) : (
                  d.alertesIA.map((a) => (
                    <div key={a.id} className="rounded-xl border border-black/5 bg-white p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <p className="flex-1 text-sm text-[#111]">{a.titre}</p>
                      </div>
                      {a.description ? (
                        <p className="mt-1 text-[11px] text-black/60">{a.description}</p>
                      ) : null}
                      <p className="mt-1 text-[10px] text-black/40">
                        {a.severite ?? "info"}
                        {a.creeLe ? ` · ${new Date(a.creeLe).toLocaleDateString("fr-FR")}` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {onglet === "audience" && (
              <div className="space-y-2">
                <p className="rounded-xl bg-white p-3 text-[11px] text-black/60">
                  La réputation alimente le moteur d'Audience : rien n'est mis en avant
                  automatiquement, ce sont des propositions et des mises en garde.
                </p>
                {conseils.isLoading ? (
                  <p className="text-sm text-black/50">Analyse en cours…</p>
                ) : (conseils.data ?? []).length === 0 ? (
                  <p className="text-sm text-black/50">
                    Aucune recommandation : pas encore assez d'avis pour décider.
                  </p>
                ) : (
                  (conseils.data ?? []).map((c) => (
                    <div
                      key={`${c.targetType}-${c.targetId}-${c.kind}`}
                      className={`rounded-xl border p-3 ${
                        c.kind === "risque_avant_mise_en_avant"
                          ? "border-red-200 bg-red-50"
                          : c.kind === "recommander_mise_en_avant"
                            ? "border-emerald-200 bg-emerald-50"
                            : "border-black/5 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-black/40" />
                        <p className="flex-1 text-sm font-bold text-[#111]">
                          {c.libelleUnivers} #{c.targetId}
                        </p>
                        <p className="text-sm font-black text-[#111]">
                          {c.noteMoyenne.toFixed(2)}/5
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-black/70">{c.constat}</p>
                      <p className="mt-1 text-[10px] text-black/40">
                        {c.avis} avis · {c.avisVerifies} vérifié(s)
                        {c.consultations30j === null
                          ? " · consultations non suivies pour ce service"
                          : ` · ${c.consultations30j} consultations (30 j)`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
