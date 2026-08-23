import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Truck, MapPin, Clock, Check, AlertTriangle, Ship, Train, Plane, Package,
} from "lucide-react";
import type { inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@server/router.js";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

type DevisInput = inferRouterInputs<AppRouter>["livraisonVehicule"]["devis"];
type ModeCode = NonNullable<DevisInput["mode"]>;
type CategorieCode = NonNullable<DevisInput["categorie"]>;

/* ══════════════════════════════════════════════════════════════════════════
   LIVRAISON DU VÉHICULE — moteur Vehicle Delivery
   Aucun prix n'est écrit dans cette page : tout vient du moteur, avec la
   qualité du prix (confirmé / estimé / à confirmer / non mesuré) et la source.
   ══════════════════════════════════════════════════════════════════════════ */

const QUALITE_STYLE: Record<string, { label: string; classe: string }> = {
  confirme: { label: "Prix confirmé", classe: "text-green-700 bg-green-50 border-green-200" },
  estime: { label: "Prix estimé", classe: "text-amber-700 bg-amber-50 border-amber-200" },
  confirmation_requise: { label: "À confirmer par le transporteur", classe: "text-amber-700 bg-amber-50 border-amber-200" },
  non_mesure: { label: "Non mesuré", classe: "text-red-700 bg-red-50 border-red-200" },
  indisponible: { label: "Indisponible", classe: "text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]" },
};

const ICONE_MODE: Record<string, typeof Truck> = {
  conteneur_maritime: Ship,
  roro_maritime: Ship,
  train: Train,
  avion_cargo: Plane,
};

function Qualite({ code }: { code: string }) {
  const q = QUALITE_STYLE[code] ?? QUALITE_STYLE.non_mesure;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${q.classe}`}>
      {q.label}
    </span>
  );
}

function montant(prix: number | null, devise: string): string {
  return prix === null ? "—" : `${prix.toLocaleString("fr-FR")} ${devise}`;
}

export default function LivraisonVehicule() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"commander" | "suivi">("commander");
  const [mode, setMode] = useState<ModeCode | null>(null);
  const [categorie, setCategorie] = useState<CategorieCode>("berline");
  const [paysDepart, setPaysDepart] = useState("");
  const [paysArrivee, setPaysArrivee] = useState("");
  const [villeDepart, setVilleDepart] = useState("");
  const [villeArrivee, setVilleArrivee] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const catalogue = trpc.livraisonVehicule.catalogue.useQuery();
  const devis = trpc.livraisonVehicule.devis.useQuery(
    {
      mode: mode ?? undefined,
      categorie,
      paysDepart: paysDepart.trim().toUpperCase() || undefined,
      paysArrivee: paysArrivee.trim().toUpperCase() || undefined,
      villeDepart: villeDepart.trim() || undefined,
      villeArrivee: villeArrivee.trim() || undefined,
    },
    { enabled: tab === "commander" },
  );
  const expeditions = trpc.livraisonVehicule.mesExpeditions.useQuery(undefined, {
    enabled: tab === "suivi" && Boolean(user),
  });
  const utils = trpc.useUtils();
  const accepter = trpc.livraisonVehicule.accepter.useMutation({
    onSuccess: (r) => {
      setMessage(`Expédition ${r.expedition.reference} créée. Suivez-la dans l'onglet Suivi.`);
      setTab("suivi");
      void utils.livraisonVehicule.mesExpeditions.invalidate();
    },
    onError: (e) => setMessage(e.message),
  });

  const d = devis.data;
  const modesAffichables = useMemo(
    () => d?.modesPossibles.filter((m) => m.disponible) ?? [],
    [d],
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Livraison du véhicule</h1>
        <p className="mt-1 text-sm text-white/60">Mode d'acheminement, étapes, délais et prix réels</p>
      </div>

      <div className="px-4 mt-4 flex gap-2">
        <button onClick={() => setTab("commander")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${tab === "commander" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Devis</button>
        <button onClick={() => setTab("suivi")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition ${tab === "suivi" ? "bg-[#D4AF37] text-white" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>Suivi</button>
      </div>

      {message && (
        <div className="mx-4 mt-4 rounded-xl border border-[#D4AF37]/40 bg-white p-3 text-xs text-[#111]">{message}</div>
      )}

      {tab === "commander" && (
        <div className="px-4 mt-4 space-y-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
            <div>
              <label className="text-xs text-[#6B7280]">Gabarit du véhicule</label>
              <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieCode)} className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm">
                {(catalogue.data?.categories ?? []).map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#6B7280]">Pays de départ</label>
                <input value={paysDepart} onChange={(e) => setPaysDepart(e.target.value)} maxLength={2} placeholder="FR" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm uppercase" />
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Pays d'arrivée</label>
                <input value={paysArrivee} onChange={(e) => setPaysArrivee(e.target.value)} maxLength={2} placeholder="SN" className="mt-1 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#6B7280]">Ville de départ</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                  <MapPin size={14} className="text-[#D4AF37]" />
                  <input value={villeDepart} onChange={(e) => setVilleDepart(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Lyon" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6B7280]">Ville d'arrivée</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                  <MapPin size={14} className="text-[#D4AF37]" />
                  <input value={villeArrivee} onChange={(e) => setVilleArrivee(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Dakar" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-[#111]">Modes adaptés à ce gabarit</p>
            {modesAffichables.map((m) => {
              const Icon = ICONE_MODE[m.code] ?? Truck;
              const actif = (mode ?? d?.mode) === m.code;
              return (
                <button key={m.code} onClick={() => setMode(m.code)} className={`w-full flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${actif ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5F3EF]"><Icon size={20} className="text-[#D4AF37]" /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#111]">{m.label}</h3>
                  </div>
                  {actif && <Check size={16} className="text-[#D4AF37]" />}
                </button>
              );
            })}
            {d && d.modesPossibles.some((m) => !m.disponible) && (
              <p className="text-[10px] text-[#6B7280]">
                Modes écartés pour ce gabarit : {d.modesPossibles.filter((m) => !m.disponible).map((m) => m.label).join(", ")}.
              </p>
            )}
          </div>

          {devis.isLoading && <p className="text-xs text-[#6B7280]">Calcul du devis…</p>}
          {devis.error && <p className="text-xs text-red-600">{devis.error.message}</p>}

          {d && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#F3F4F6]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#111]">{d.modeLabel}</h3>
                  <Qualite code={d.qualite} />
                </div>
                <p className="mt-1 text-xs text-[#6B7280]">{d.resume}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#6B7280]">Total</span>
                  <span className="text-lg font-black text-[#111]">{montant(d.total, d.devise)}</span>
                </div>
                {(d.delaiJoursMin !== null || d.delaiJoursMax !== null) && (
                  <p className="text-[10px] text-[#6B7280] flex items-center gap-1">
                    <Clock size={10} /> Délai {d.delaiJoursMin ?? "?"} à {d.delaiJoursMax ?? "?"} jours cumulés
                  </p>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs font-bold text-[#111]">Étapes de l'acheminement</p>
                {d.etapes.map((e) => (
                  <div key={e.etape} className="rounded-lg border border-[#F3F4F6] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#111]">{e.label}</p>
                      <span className="text-sm font-bold text-[#111]">{montant(e.prix, e.devise)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Qualite code={e.qualite} />
                      {!e.obligatoire && <span className="text-[10px] text-[#6B7280]">optionnelle</span>}
                    </div>
                    <p className="mt-1 text-[10px] text-[#6B7280]">{e.preuve}</p>
                    {e.manque && (
                      <p className="mt-1 text-[10px] text-red-600 flex items-start gap-1">
                        <AlertTriangle size={10} className="mt-0.5 shrink-0" /> Manque : {e.manque}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {d.options.length > 0 && (
                <div className="p-4 border-t border-[#F3F4F6] space-y-2">
                  <p className="text-xs font-bold text-[#111]">Options</p>
                  {d.options.map((o) => (
                    <div key={o.code} className={`rounded-lg border p-3 ${o.disponible ? "border-[#F3F4F6]" : "border-[#E5E7EB] bg-[#FAFAF8]"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#111]">
                          {o.label}{o.premium && <span className="ml-1 text-[10px] font-bold text-[#D4AF37]">premium</span>}
                        </p>
                        <span className="text-sm font-bold text-[#111]">{montant(o.prix, o.devise)}</span>
                      </div>
                      <p className="text-[10px] text-[#6B7280]">{o.description}</p>
                      <div className="mt-1 flex items-center gap-2"><Qualite code={o.qualite} /></div>
                      {o.motif && <p className="mt-1 text-[10px] text-[#6B7280]">{o.motif}</p>}
                    </div>
                  ))}
                </div>
              )}

              {d.manques.length > 0 && (
                <div className="p-4 border-t border-[#F3F4F6]">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-1"><AlertTriangle size={12} /> Ce qui manque pour un prix ferme</p>
                  <ul className="mt-1 space-y-1">
                    {d.manques.map((m) => (
                      <li key={m} className="text-[10px] text-[#6B7280]">• {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 border-t border-[#F3F4F6]">
                {!user ? (
                  <Link to="/connexion" className="block w-full rounded-xl bg-[#111] py-3.5 text-center text-sm font-bold text-white">
                    Se connecter pour accepter ce devis
                  </Link>
                ) : (
                  <button
                    disabled={d.total === null || accepter.isPending}
                    onClick={() =>
                      accepter.mutate({
                        mode: d.mode,
                        categorie: d.categorie,
                        paysDepart: d.paysDepart ?? undefined,
                        paysArrivee: d.paysArrivee ?? undefined,
                        villeDepart: d.villeDepart ?? undefined,
                        villeArrivee: d.villeArrivee ?? undefined,
                      })
                    }
                    className="w-full rounded-xl bg-[#D4AF37] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#6B7280]"
                  >
                    {d.total === null ? "Devis non chiffrable — acceptation impossible" : `Accepter et lancer l'acheminement (${montant(d.total, d.devise)})`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "suivi" && (
        <div className="px-4 mt-4 space-y-4">
          {!user && (
            <Link to="/connexion" className="block rounded-xl border border-[#E5E7EB] bg-white p-4 text-center text-sm font-bold text-[#111]">
              Se connecter pour voir vos acheminements
            </Link>
          )}
          {user && expeditions.isLoading && <p className="text-xs text-[#6B7280]">Chargement…</p>}
          {user && expeditions.data?.length === 0 && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
              <Package size={24} className="mx-auto text-[#D4AF37]" />
              <p className="mt-2 text-sm font-bold text-[#111]">Aucun acheminement</p>
              <p className="text-xs text-[#6B7280]">Vos acheminements acceptés apparaîtront ici avec leurs étapes réelles.</p>
            </div>
          )}
          {(expeditions.data ?? []).map((exp) => (
            <div key={exp.id} className={`rounded-xl bg-white border overflow-hidden ${exp.statut === "bloquee" ? "border-red-300" : "border-[#E5E7EB]"}`}>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#111]">{exp.reference}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#111]">
                    {exp.statut}
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280]">
                  {exp.modeLabel} · {montant(exp.total === null ? null : Number(exp.total), exp.devise)}
                </p>
                <div className="mt-1"><Qualite code={exp.qualitePrix} /></div>
              </div>
              <div className="px-4 pb-4 border-t border-[#F3F4F6]">
                <div className="mt-3 space-y-3">
                  {exp.suivi.map((s, i) => {
                    const fait = s.statut === "fait";
                    const bloque = s.statut === "bloque";
                    return (
                      <div key={s.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center ${bloque ? "bg-red-500" : fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}>
                            {fait && <Check size={10} className="text-white" />}
                            {bloque && <AlertTriangle size={10} className="text-white" />}
                          </div>
                          {i < exp.suivi.length - 1 && <div className={`w-0.5 h-6 ${fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}
                        </div>
                        <div>
                          <p className={`text-sm ${fait ? "font-bold text-[#111]" : "text-[#6B7280]"}`}>{s.label}</p>
                          <p className="text-[10px] text-[#6B7280]">{s.statut}{s.note ? ` — ${s.note}` : ""}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
