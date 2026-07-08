/**
 * Centre de Contrôle — Moteur de Permissions MKA.P-MS (Permission Engine)
 *
 * Page réservée : PDG uniquement (super_admin).
 *
 * Affiche en temps réel :
 * - synthèse sécurité (tentatives 24h, refus 24h, top modules refusés)
 * - journal de sécurité (chaque tentative d'accès sensible, autorisée ou refusée)
 * - accès temporaires accordés par le PDG
 */
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  ShieldCheck,
  ChevronLeft,
  Database,
  KeyRound,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Tab = "dashboard" | "journal" | "grants";

const TABS: { key: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { key: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
  { key: "journal", label: "Journal de sécurité", icon: Database },
  { key: "grants", label: "Accès temporaires", icon: KeyRound },
];

export default function PermissionEngineControlCenter() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [onlyDenied, setOnlyDenied] = useState(false);

  const stats = trpc.permissionEngine.stats.useQuery(undefined, {
    enabled: user?.role === "super_admin",
    refetchInterval: 15000,
  });
  const journal = trpc.permissionEngine.journal.useQuery(
    { onlyDenied, limit: 200 },
    { enabled: user?.role === "super_admin", refetchInterval: 15000 },
  );
  const grants = trpc.permissionEngine.grants.useQuery(undefined, {
    enabled: user?.role === "super_admin",
  });

  // Accès PDG uniquement
  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/admin" className="flex items-center gap-1 text-sm text-white/60 mb-3">
          <ChevronLeft size={14} /> Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/20">
            <ShieldCheck size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Moteur de Permissions MKA.P-MS</h1>
            <p className="text-xs text-white/50">Centre de contrôle — Permission Engine (accès PDG)</p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                tab === t.key ? "bg-[#111] text-[#D4AF37]" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-5xl px-4 py-5">
        {tab === "dashboard" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Tentatives (24h)</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats.data?.last24h ?? 0}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-600">Accès refusés (24h)</p>
              <p className="mt-1 text-2xl font-black text-red-700">{stats.data?.denied24h ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Modules les plus refusés</p>
              <ul className="mt-1 space-y-0.5">
                {(stats.data?.topDenied ?? []).slice(0, 5).map((m, i) => (
                  <li key={i} className="flex justify-between text-xs text-slate-700">
                    <span>{m.module ?? "—"}</span>
                    <b>{m.count}</b>
                  </li>
                ))}
                {!stats.data?.topDenied?.length && (
                  <li className="text-xs text-slate-400">Aucun refus enregistré</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {tab === "journal" && (
          <div>
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => setOnlyDenied((v) => !v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  onlyDenied ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {onlyDenied ? "Refusés uniquement" : "Tout afficher"}
              </button>
              <button
                onClick={() => journal.refetch()}
                className="flex items-center gap-1 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <RefreshCw size={12} /> Rafraîchir
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Heure</th>
                    <th className="px-3 py-2">Utilisateur</th>
                    <th className="px-3 py-2">Rôle</th>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">Chemin</th>
                    <th className="px-3 py-2">Résultat</th>
                  </tr>
                </thead>
                <tbody>
                  {(journal.data ?? []).map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-500">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "—"}
                      </td>
                      <td className="px-3 py-2">{row.userId ?? "—"}</td>
                      <td className="px-3 py-2">{row.role ?? "—"}</td>
                      <td className="px-3 py-2">{row.module ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{row.path ?? "—"}</td>
                      <td className="px-3 py-2">
                        {row.allowed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={12} /> Autorisé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle size={12} /> Refusé
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!journal.data?.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                        Aucune tentative enregistrée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "grants" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Utilisateur</th>
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Lecture seule</th>
                  <th className="px-3 py-2">Expire</th>
                  <th className="px-3 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(grants.data ?? []).map((g) => (
                  <tr key={g.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{g.userId}</td>
                    <td className="px-3 py-2">{g.module}</td>
                    <td className="px-3 py-2">{g.action ?? "—"}</td>
                    <td className="px-3 py-2">{g.readOnly ? "Oui" : "Non"}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {g.expiresAt ? new Date(g.expiresAt).toLocaleString("fr-FR") : "—"}
                    </td>
                    <td className="px-3 py-2">{g.revoked ? "Révoqué" : "Actif"}</td>
                  </tr>
                ))}
                {!grants.data?.length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      Aucun accès temporaire accordé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
