import { FonctionsControle } from "./FonctionsControle";
import { DeploiementApprobateurs } from "./DeploiementApprobateurs";
import { DeploiementSuivi } from "./DeploiementSuivi";
/**
 * MKA.P-MS AI — module Paramètres (LOT IA02B).
 *
 * Lecture réelle des règles maîtres et des commandes déclarées
 * (server/intelligences/regles.ts) — référence, pas un formulaire : ces
 * règles sont du code, pas une configuration modifiable depuis l'écran.
 */
import { Bell, ChevronRight, Cloud, FileCheck2, Globe2, Laptop, Lock, Palette, Plug, Settings, ShieldCheck, Sparkles, UserRound, Brain, Database, Crown, RefreshCw, CircleHelp, MessageCircle } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export function Parametres() {
  const regles = trpc.intelligences.regles.useQuery();

  if (regles.isLoading) return <p className="text-sm text-black/40">Chargement…</p>;
  if (!regles.data) return <p className="text-sm text-red-600">Règles indisponibles.</p>;

  const groups = [
    { title: "Général", rows: [
      ["Langue", Globe2], ["Notifications", Bell], ["Apparence", Palette], ["Mode travail", Laptop], ["Confidentialité", ShieldCheck],
    ]},
    { title: "IA & plateforme principale", rows: [
      ["Plateforme principale", Sparkles], ["Mémoire IA", Database], ["Documents & contrôle", FileCheck2], ["Plugins", Plug], ["Réflexion approfondie", Brain],
    ]},
    { title: "Compte", rows: [
      ["Profil", UserRound], ["Sécurité", Lock], ["Abonnement", Crown], ["Synchronisation", RefreshCw], ["Sauvegarde", Cloud],
    ]},
    { title: "Support", rows: [
      ["Centre d’aide", CircleHelp], ["Envoyer un retour", MessageCircle], ["À propos de AL-HUDHUD·M", Settings],
    ]},
  ] as const;

  return (
    <div className="space-y-6">
      <section className="alhud-settings-visual" aria-label="Paramètres AL-HUDHUD·M">
        {groups.map(group => <div key={group.title}>
          <h2 className="mb-2">{group.title}</h2>
          <div className="alhud-settings-group">{group.rows.map(([label, Icon]) =>
            <button type="button" key={label} className="alhud-settings-row" onClick={() => document.getElementById("alhud-live-settings")?.scrollIntoView({ behavior: "smooth" })}>
              <Icon className="h-5 w-5"/><span>{label}</span><ChevronRight/>
            </button>
          )}</div>
        </div>)}
      </section>
      <div id="alhud-live-settings"><FonctionsControle /></div>
      <DeploiementApprobateurs />
      <DeploiementSuivi />
      <div className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Règles maîtres — {regles.data.nom}</h2>
        </div>
        <ul className="space-y-2">
          {regles.data.regles.map((r) => (
            <li key={r.code} className="rounded-lg border border-black/5 bg-[#FAFAFA] p-3">
              <span className="text-sm font-bold text-[#111]">{r.regle}</span>
              <p className="mt-1 text-xs text-black/50">{r.application}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-base font-black text-[#111]">Commandes déclarées</h2>
        <ul className="divide-y divide-black/5">
          {regles.data.commandes.map((c) => (
            <li key={c.code} className="py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-[#111]">{c.libelle}</span>
                <span className="text-[11px] text-black/30">{c.cote}</span>
                {c.validationHumaine && (
                  <span className="rounded bg-[#FFFBEA] px-1.5 py-0.5 text-[10px] font-bold text-[#8B7500]">
                    validation humaine requise
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-black/60">{c.effet}</p>
              <p className="mt-0.5 text-[11px] text-black/30">{c.limite}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
