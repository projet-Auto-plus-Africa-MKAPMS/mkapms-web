import { FonctionsControle } from "./FonctionsControle";
import { DeploiementApprobateurs } from "./DeploiementApprobateurs";
import { DeploiementSuivi } from "./DeploiementSuivi";
import { VoixTempsReel } from "./VoixTempsReel";
import { VoiceSettingsPanel } from "../../../components/VoiceSettingsPanel";
/**
 * MKA.P-MS AI — module Paramètres (LOT IA02B).
 *
 * Lecture réelle des règles maîtres et des commandes déclarées
 * (server/intelligences/regles.ts) — référence, pas un formulaire : ces
 * règles sont du code, pas une configuration modifiable depuis l'écran.
 */
import { Bell, ChevronRight, FileCheck2, Globe2, Lock, Palette, Plug, Settings, ShieldCheck, Sparkles, UserRound, Brain, Database, Crown, CircleHelp, MessageCircle, AudioLines, Gauge } from "lucide-react";
import { trpc } from "../../../lib/trpc";
import { useNavigate } from "react-router-dom";

type ActionReglage =
  | { type: "module"; value: string }
  | { type: "route"; value: string }
  | { type: "anchor"; value: string };

export function Parametres({ onChooseModule }: { onChooseModule?: (key: string) => void } = {}) {
  const regles = trpc.intelligences.regles.useQuery();
  const navigate = useNavigate();

  const groups = [
    { title: "Général", rows: [
      ["Voix", AudioLines, { type: "anchor", value: "alhud-voice-settings" }],
      ["Langue", Globe2, { type: "anchor", value: "alhud-voice-settings" }],
      ["Notifications", Bell, { type: "route", value: "/notifications/parametres-notifications" }],
      ["Apparence & compte", Palette, { type: "route", value: "/parametres" }],
      ["Confidentialité", ShieldCheck, { type: "route", value: "/confidentialite" }],
    ]},
    { title: "IA & plateforme principale", rows: [
      ["Plateforme principale", Sparkles, { type: "module", value: "conversation" }],
      ["Mémoire IA", Database, { type: "module", value: "memoire" }],
      ["Documents & contrôle", FileCheck2, { type: "module", value: "documents" }],
      ["Plugins", Plug, { type: "module", value: "integrations" }],
      ["Intensité & fonctions", Gauge, { type: "anchor", value: "alhud-live-settings" }],
      ["Règles maîtres", Brain, { type: "anchor", value: "alhud-master-rules" }],
    ]},
    { title: "Compte", rows: [
      ["Profil", UserRound, { type: "route", value: "/compte?tab=profil" }],
      ["Sécurité & connexion", Lock, { type: "route", value: "/parametres" }],
      ["Abonnement", Crown, { type: "route", value: "/compte?tab=abonnements" }],
    ]},
    { title: "Support", rows: [
      ["Centre d’aide", CircleHelp, { type: "route", value: "/aide" }],
      ["Envoyer un retour", MessageCircle, { type: "route", value: "/messagerie" }],
      ["À propos de AL-HUDHUD·M", Settings, { type: "route", value: "/aide#mentions" }],
    ]},
  ] satisfies { title: string; rows: readonly [string, typeof Bell, ActionReglage][] }[];

  function ouvrir(action: ActionReglage) {
    if (action.type === "module") {
      onChooseModule?.(action.value);
      return;
    }
    if (action.type === "route") {
      navigate(action.value);
      return;
    }
    document.getElementById(action.value)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-6">
      <section className="alhud-settings-visual" aria-label="Paramètres AL-HUDHUD·M">
        {groups.map(group => <div key={group.title}>
          <h2 className="mb-2">{group.title}</h2>
          <div className="alhud-settings-group">{group.rows.map(([label, Icon, action]) =>
            <button type="button" key={label} className="alhud-settings-row" onClick={() => ouvrir(action)}>
              <Icon className="h-5 w-5"/><span>{label}</span><ChevronRight/>
            </button>
          )}</div>
        </div>)}
      </section>
      <div id="alhud-voice-settings" className="scroll-mt-4"><VoiceSettingsPanel title="Voix AL-HUDHUD·M" /></div>
      <div id="alhud-live-settings"><FonctionsControle /></div>
      <div id="alhud-voix-settings" className="rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Voix & production</h2>
        </div>
        <p className="mb-3 text-sm text-black/60">
          Rester appuyé sur le micro du Chat ramène ici. Génération audio à partir d'un texte, et transcription d'un fichier audio.
        </p>
        <VoixTempsReel />
      </div>
      <DeploiementApprobateurs />
      <DeploiementSuivi />
      <div id="alhud-master-rules" className="scroll-mt-4 rounded-xl border border-black/10 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-black/40" />
          <h2 className="text-base font-black text-[#111]">Règles maîtres{regles.data ? ` — ${regles.data.nom}` : ""}</h2>
        </div>
        {regles.isLoading ? <p className="text-sm text-black/40">Chargement des règles…</p> : null}
        {regles.isError ? <p className="text-sm text-red-600">Règles temporairement indisponibles. Les réglages ci-dessus restent utilisables.</p> : null}
        <ul className="space-y-2">
          {(regles.data?.regles ?? []).map((r) => (
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
          {(regles.data?.commandes ?? []).map((c) => (
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
