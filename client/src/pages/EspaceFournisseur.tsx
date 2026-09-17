/**
 * Espace Fournisseur — parcours réel au-delà du portail en lecture (LOT7 suite).
 *
 * Un compte "supplier" (accès accordé par le PDG, jamais un onboarding
 * automatique) atterrit ici après connexion (Account Routing Engine,
 * shared/account-routing.ts). Consomme trpc.supplierPortal.* : le fournisseur
 * configure et teste lui-même son flux de données, ajoute ses contacts —
 * jamais une seconde fois les décisions Direction (KYB, contrat,
 * territoires, activation) qui restent dans server/routers/superadmin.
 */
import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { Building2, Check, Clock, Plug, Plus, RefreshCw, Users, XCircle } from "lucide-react";

const STATUT_LABEL: Record<string, string> = {
  brouillon: "Brouillon", en_verification: "En vérification", valide_direction: "Validé par la Direction",
  contrat_signe: "Contrat signé", test_connexion: "Test de connexion", actif: "Actif",
  suspendu: "Suspendu", desactive: "Désactivé",
};

const HEALTH_LABEL: Record<string, string> = {
  not_connected: "Non connecté", configured: "Configuré", active: "Actif", suspended: "Suspendu", disabled: "Désactivé",
};

export default function EspaceFournisseur() {
  const { user } = useAuth();
  const monAcces = trpc.supplierPortal.monAcces.useQuery(undefined, { enabled: !!user });
  const detail = trpc.supplierPortal.monDetail.useQuery(undefined, { enabled: !!user });
  const methodes = trpc.supplierEngine.connectionMethods.useQuery();

  const testerConnexion = trpc.supplierPortal.testerMaConnexion.useMutation({ onSuccess: () => detail.refetch() });
  const configurerConnexion = trpc.supplierPortal.configurerMaConnexion.useMutation({
    onSuccess: () => { detail.refetch(); setNouvelleMethode(""); },
  });
  const ajouterContact = trpc.supplierPortal.ajouterMonContact.useMutation({
    onSuccess: () => { detail.refetch(); setContact({ kind: "commercial", name: "", email: "", phone: "" }); },
  });

  const [nouvelleMethode, setNouvelleMethode] = useState("");
  const [contact, setContact] = useState({ kind: "commercial" as "commercial" | "technique" | "comptabilite", name: "", email: "", phone: "" });

  if (!user) {
    return <div className="container-page py-16 text-center text-slate-500">Connecte-toi pour accéder à ton espace fournisseur.</div>;
  }
  if (monAcces.isLoading) {
    return <div className="container-page py-16 text-center text-slate-400">Chargement…</div>;
  }
  if (!monAcces.data || monAcces.data.accountType !== "supplier") {
    return <div className="container-page py-16 text-center text-slate-500">Aucun accès fournisseur actif sur ce compte.</div>;
  }

  const acces = monAcces.data;
  const profil = detail.data?.profil;
  const fiche = acces.fiche as { companyLegalName: string; countryCode: string; status: string } | null;

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} className="text-[#D4AF37]" /> Espace fournisseur</h1>
        <p className="mt-1 text-sm text-white/60">{profil?.companyLegalName ?? fiche?.companyLegalName ?? ""} · {profil?.countryCode ?? fiche?.countryCode ?? ""}</p>
        <span className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-[#D4AF37]">{STATUT_LABEL[profil?.status ?? fiche?.status ?? ""] ?? "Statut inconnu"}</span>
      </div>

      {detail.isLoading ? (
        <p className="p-4 text-center text-slate-400">Chargement du détail…</p>
      ) : (
        <div className="px-4 mt-4 space-y-4">
          {/* ── Étapes d'onboarding ── */}
          <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-black text-[#111] mb-3">Progression</h2>
            <ul className="space-y-1.5">
              {(detail.data?.etapes ?? []).map((e) => (
                <li key={e.step} className="flex items-center gap-2 text-sm">
                  {e.status === "valide" ? <Check size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-500" />}
                  <span className="text-[#374151]">{e.step}</span>
                  <span className="text-xs text-slate-400">{e.status}</span>
                </li>
              ))}
              {detail.data?.etapes.length === 0 && <li className="text-sm text-slate-400">Aucune étape enregistrée pour le moment.</li>}
            </ul>
          </section>

          {/* ── Connexions ── */}
          <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-black text-[#111] mb-3 flex items-center gap-1"><Plug size={14} /> Connexion de données</h2>
            <div className="space-y-2">
              {(detail.data?.connexions ?? []).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-sm">
                  <div>
                    <p className="font-bold text-[#111]">{methodes.data?.find((m) => m.code === c.method)?.label ?? c.method}</p>
                    <p className="text-xs text-slate-400">{HEALTH_LABEL[c.lastHealthStatus] ?? c.lastHealthStatus}{c.lastHealthMessage ? ` — ${c.lastHealthMessage}` : ""}</p>
                  </div>
                  <button
                    onClick={() => testerConnexion.mutate({ connectionId: c.id })}
                    disabled={testerConnexion.isPending}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <RefreshCw size={12} /> Tester
                  </button>
                </div>
              ))}
              {detail.data?.connexions.length === 0 && <p className="text-sm text-slate-400">Aucune connexion configurée.</p>}
            </div>

            <div className="mt-3 flex gap-2">
              <select value={nouvelleMethode} onChange={(e) => setNouvelleMethode(e.target.value)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
                <option value="">Ajouter une méthode…</option>
                {methodes.data?.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
              <button
                disabled={!nouvelleMethode || configurerConnexion.isPending}
                onClick={() => configurerConnexion.mutate({ method: nouvelleMethode })}
                className="flex items-center gap-1 rounded-lg bg-[#111] px-3 py-2 text-xs font-bold text-[#D4AF37] disabled:opacity-40"
              >
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {configurerConnexion.error && <p className="mt-2 text-xs text-red-600">{configurerConnexion.error.message}</p>}
          </section>

          {/* ── Contacts ── */}
          <section className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <h2 className="text-sm font-black text-[#111] mb-3 flex items-center gap-1"><Users size={14} /> Contacts</h2>
            <div className="space-y-2 mb-3">
              {(detail.data?.contacts ?? []).map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-100 p-2 text-sm">
                  <p className="font-bold text-[#111]">{c.name ?? "—"} <span className="text-xs font-normal text-slate-400">({c.kind})</span></p>
                  <p className="text-xs text-slate-400">{c.email ?? ""} {c.phone ?? ""}</p>
                </div>
              ))}
              {detail.data?.contacts.length === 0 && <p className="text-sm text-slate-400">Aucun contact enregistré.</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={contact.kind} onChange={(e) => setContact({ ...contact, kind: e.target.value as typeof contact.kind })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white col-span-2">
                <option value="commercial">Commercial</option>
                <option value="technique">Technique</option>
                <option value="comptabilite">Comptabilité</option>
              </select>
              <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Nom" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="Email" type="email" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Téléphone" className="rounded-lg border border-slate-200 px-3 py-2 text-sm col-span-2" />
            </div>
            <button
              disabled={ajouterContact.isPending}
              onClick={() => ajouterContact.mutate({ kind: contact.kind, name: contact.name || undefined, email: contact.email || undefined, phone: contact.phone || undefined })}
              className="mt-2 w-full rounded-lg bg-[#111] py-2 text-xs font-bold text-[#D4AF37] disabled:opacity-40"
            >
              Ajouter le contact
            </button>
            {ajouterContact.error && <p className="mt-2 text-xs text-red-600">{ajouterContact.error.message}</p>}
          </section>

          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <XCircle size={12} /> La vérification (KYB), le contrat et l'activation restent des décisions de l'équipe MKA.P-MS.
          </p>
        </div>
      )}
    </div>
  );
}
