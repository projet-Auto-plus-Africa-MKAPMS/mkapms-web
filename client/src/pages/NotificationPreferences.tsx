import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Settings, Mail, MessageSquare, Smartphone, Bell, Clock } from "lucide-react";
import { trpc } from "../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   PRÉFÉRENCES DE NOTIFICATION — base partagée (ParametresNotifications,
   CanauxCommunication, ObjectifNotifications). Données réelles :
   trpc.notificationOs.preferences.me/update (server/notification-os/index.ts,
   table notif_user_preferences) — moteur déjà construit, jamais un second
   système de préférences inventé pour ces écrans.
   ══════════════════════════════════════════════════════════════════════════ */

const DIGEST_LABEL: Record<string, string> = { realtime: "Immédiat", daily: "Quotidien", weekly: "Hebdomadaire" };

interface NotificationPreferencesProps {
  titre?: string;
  sousTitre?: string;
  sections?: ("canaux" | "digest" | "silence")[];
}

export default function NotificationPreferences({
  titre = "Préférences de notification",
  sousTitre,
  sections = ["canaux", "digest", "silence"],
}: NotificationPreferencesProps) {
  const prefs = trpc.notificationOs.preferences.me.useQuery();
  const update = trpc.notificationOs.preferences.update.useMutation({ onSuccess: () => prefs.refetch() });

  const [local, setLocal] = useState({
    emailEnabled: true, smsEnabled: false, pushEnabled: true, inappEnabled: true,
    digestEnabled: false, digestFrequency: "daily" as "realtime" | "daily" | "weekly",
    quietHoursFrom: null as number | null, quietHoursTo: null as number | null,
  });

  useEffect(() => {
    if (prefs.data) {
      setLocal({
        emailEnabled: prefs.data.emailEnabled,
        smsEnabled: prefs.data.smsEnabled,
        pushEnabled: prefs.data.pushEnabled,
        inappEnabled: prefs.data.inappEnabled,
        digestEnabled: prefs.data.digestEnabled,
        digestFrequency: prefs.data.digestFrequency as "realtime" | "daily" | "weekly",
        quietHoursFrom: prefs.data.quietHoursFrom,
        quietHoursTo: prefs.data.quietHoursTo,
      });
    }
  }, [prefs.data]);

  const toggle = (champ: "emailEnabled" | "smsEnabled" | "pushEnabled" | "inappEnabled" | "digestEnabled") => {
    const val = !local[champ];
    setLocal((l) => ({ ...l, [champ]: val }));
    update.mutate({ [champ]: val });
  };

  const setDigestFrequency = (freq: "realtime" | "daily" | "weekly") => {
    setLocal((l) => ({ ...l, digestFrequency: freq }));
    update.mutate({ digestFrequency: freq });
  };

  const setQuietHours = (from: number | null, to: number | null) => {
    setLocal((l) => ({ ...l, quietHoursFrom: from, quietHoursTo: to }));
    update.mutate({ quietHoursFrom: from, quietHoursTo: to });
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/notifications" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Notifications</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Settings size={20} className="text-[#D4AF37]" /> {titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-white/60">{sousTitre}</p>}
      </div>

      {prefs.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {sections.includes("canaux") && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Canaux de communication</h3>
          {([
            ["emailEnabled", Mail, "E-mail"],
            ["smsEnabled", MessageSquare, "SMS"],
            ["pushEnabled", Smartphone, "Notifications push"],
            ["inappEnabled", Bell, "Notifications dans l'application"],
          ] as const).map(([champ, Icon, label]) => (
            <div key={champ} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-[#6B7280]" />
                <span className="text-sm text-[#111]">{label}</span>
              </div>
              <button
                onClick={() => toggle(champ)}
                className={`h-6 w-11 rounded-full transition ${local[champ] ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}
              >
                <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${local[champ] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {sections.includes("digest") && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111]">Regroupement (digest)</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#111]">Regrouper mes notifications</span>
            <button onClick={() => toggle("digestEnabled")} className={`h-6 w-11 rounded-full transition ${local.digestEnabled ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}>
              <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${local.digestEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {local.digestEnabled && (
            <div className="flex gap-2">
              {(["realtime", "daily", "weekly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDigestFrequency(f)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold ${local.digestFrequency === f ? "bg-[#111] text-white" : "bg-[#F5F3EF] text-[#6B7280]"}`}
                >
                  {DIGEST_LABEL[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sections.includes("silence") && (
        <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><Clock size={14} /> Heures de silence</h3>
          <p className="text-xs text-[#6B7280]">Aucune notification push ou SMS ne sera envoyée pendant cette période.</p>
          <div className="flex items-center gap-2">
            <select
              value={local.quietHoursFrom ?? ""}
              onChange={(e) => setQuietHours(e.target.value === "" ? null : Number(e.target.value), local.quietHoursTo)}
              className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
            >
              <option value="">Désactivé</option>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>)}
            </select>
            <span className="text-xs text-[#6B7280]">à</span>
            <select
              value={local.quietHoursTo ?? ""}
              onChange={(e) => setQuietHours(local.quietHoursFrom, e.target.value === "" ? null : Number(e.target.value))}
              disabled={local.quietHoursFrom === null}
              className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm disabled:opacity-50"
            >
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>)}
            </select>
          </div>
        </div>
      )}

      {update.error && <p className="mx-4 mt-3 text-xs text-red-600 text-center">{update.error.message}</p>}
    </div>
  );
}
