import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { isAdmin, isDirection } from "@shared/roles";

export default function Admin() {
  const { user } = useAuth();
  const enabled = !!user && isAdmin(user.role);
  const direction = !!user && isDirection(user.role);

  const stats = trpc.admin.stats.useQuery(undefined, { enabled });
  const annoncesPending = trpc.admin.annoncesPending.useQuery(undefined, { enabled });
  const garagesPending = trpc.admin.garagesPending.useQuery(undefined, { enabled });
  const kycPending = trpc.admin.kycPending.useQuery(undefined, { enabled });
  const payments = trpc.admin.paymentsList.useQuery({ limit: 20 }, { enabled });
  const reservations = trpc.admin.reservationsList.useQuery({ limit: 20 }, { enabled });
  const staffList = trpc.admin.staffList.useQuery(undefined, { enabled: direction });
  const promoList = trpc.admin.promoList.useQuery(undefined, { enabled });
  const usersList = trpc.admin.usersList.useQuery({ limit: 30, offset: 0 }, { enabled });
  const deletionRequests = trpc.admin.deletionRequests.useQuery(undefined, { enabled });
  const auditLog = trpc.admin.auditLog.useQuery({ limit: 50 }, { enabled: direction });
  const modulesList = trpc.modules.list.useQuery(undefined, { enabled: direction });

  const utils = trpc.useUtils();
  const moderate = trpc.admin.moderateAnnonce.useMutation({ onSuccess: () => utils.admin.annoncesPending.invalidate() });
  const validateGarage = trpc.admin.validateGarage.useMutation({ onSuccess: () => utils.admin.garagesPending.invalidate() });
  const validateKyc = trpc.admin.validateKyc.useMutation({ onSuccess: () => utils.admin.kycPending.invalidate() });
  const createStaff = trpc.admin.createStaff.useMutation({
    onSuccess: () => { utils.admin.staffList.invalidate(); setStaff({ email: "", name: "", password: "", role: "employee" }); },
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({ onSuccess: () => utils.admin.staffList.invalidate() });
  const createPromo = trpc.admin.createPromo.useMutation({
    onSuccess: () => { utils.admin.promoList.invalidate(); setPromo({ code: "", type: "pourcentage", value: 10 }); },
  });
  const updatePromo = trpc.admin.updatePromo.useMutation({ onSuccess: () => utils.admin.promoList.invalidate() });
  const deletePromo = trpc.admin.deletePromo.useMutation({ onSuccess: () => utils.admin.promoList.invalidate() });
  const certify = trpc.admin.certifyVehicle.useMutation({ onSuccess: () => utils.admin.annoncesPending.invalidate() });
  const requestDeletion = trpc.admin.requestUserDeletion.useMutation({ onSuccess: () => utils.admin.deletionRequests.invalidate() });
  const decideDeletion = trpc.admin.decideDeletion.useMutation({
    onSuccess: () => { utils.admin.deletionRequests.invalidate(); utils.admin.usersList.invalidate(); },
  });
  const setModuleStatus = trpc.modules.setStatus.useMutation({ onSuccess: () => utils.modules.list.invalidate() });
  const updateModule = trpc.modules.update.useMutation({ onSuccess: () => utils.modules.list.invalidate() });

  const [staff, setStaff] = useState({ email: "", name: "", password: "", role: "employee" as "employee" | "admin" });
  const [promo, setPromo] = useState({ code: "", type: "pourcentage" as "pourcentage" | "montant", value: 10 });
  const [certifyId, setCertifyId] = useState("");

  if (!enabled) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-slate-500">Accès réservé au back-office.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">Retour</Link>
      </div>
    );
  }

  const cards = [
    { l: "Utilisateurs", v: stats.data?.users },
    { l: "Annonces", v: stats.data?.annonces },
    { l: "Garages", v: stats.data?.garages },
    { l: "Abonnements", v: stats.data?.subscriptions },
    { l: "Paiements", v: stats.data?.payments },
    { l: "Devis", v: stats.data?.devis },
  ];

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Back-office</h1>
          <p className="text-sm text-slate-500">Administration MKA.P-MS — Auto Plus Africa.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${direction ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-600"}`}>
          {direction ? "Direction / PDG" : "Employé"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        {cards.map((c) => (
          <div key={c.l} className="card p-4 text-center">
            <div className="text-2xl font-extrabold text-brand">{c.v ?? "—"}</div>
            <div className="text-xs text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>

      {/* Annonces à valider */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Annonces à valider</h2>
        <div className="mt-3 space-y-2">
          {annoncesPending.data?.map((a) => (
            <div key={a.id} className="card flex items-center justify-between p-3">
              <span className="text-sm font-medium text-slate-700">{a.titre}</span>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !text-xs" onClick={() => moderate.mutate({ id: a.id, action: "publiee" })}>Publier</button>
                <button className="btn-outline !py-1.5 !text-xs" onClick={() => moderate.mutate({ id: a.id, action: "refusee" })}>Refuser</button>
                {direction && (
                  <button className="btn-outline !py-1.5 !text-xs" onClick={() => certify.mutate({ annonceId: a.id, certified: true })}>Certifier</button>
                )}
              </div>
            </div>
          ))}
          {annoncesPending.data?.length === 0 && <p className="text-sm text-slate-500">Aucune annonce en attente.</p>}
        </div>
      </section>

      {/* Garages à valider */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Garages à valider</h2>
        <div className="mt-3 space-y-2">
          {garagesPending.data?.map((g) => (
            <div key={g.id} className="card flex items-center justify-between p-3">
              <span className="text-sm font-medium text-slate-700">{g.name} — {g.city}</span>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !text-xs" onClick={() => validateGarage.mutate({ id: g.id, action: "valide" })}>Valider</button>
                <button className="btn-outline !py-1.5 !text-xs" onClick={() => validateGarage.mutate({ id: g.id, action: "refuse" })}>Refuser</button>
              </div>
            </div>
          ))}
          {garagesPending.data?.length === 0 && <p className="text-sm text-slate-500">Aucun garage en attente.</p>}
        </div>
      </section>

      {/* Documents à vérifier (KYC) */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Documents à vérifier (SIRET / KBIS / RIB / identité)</h2>
        <div className="mt-3 space-y-2">
          {kycPending.data?.map((k) => (
            <div key={k.id} className="card flex items-center justify-between p-3">
              <span className="text-sm font-medium text-slate-700">
                {k.userName ?? k.userEmail} <span className="text-xs text-slate-400">({k.accountType})</span>
              </span>
              <div className="flex gap-2">
                <button className="btn-primary !py-1.5 !text-xs" onClick={() => validateKyc.mutate({ profileId: k.id, action: "valide" })}>Valider</button>
                <button className="btn-outline !py-1.5 !text-xs" onClick={() => validateKyc.mutate({ profileId: k.id, action: "refuse" })}>Refuser</button>
              </div>
            </div>
          ))}
          {kycPending.data?.length === 0 && <p className="text-sm text-slate-500">Aucun dossier en attente.</p>}
        </div>
      </section>

      {/* Comptes clients — Employé demande la suppression, Direction supprime directement */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Comptes</h2>
        <div className="mt-3 space-y-1">
          {usersList.data?.map((u) => (
            <div key={u.id} className="card flex items-center justify-between p-2 text-sm">
              <span className="text-slate-700">{u.name} — {u.email} <span className="text-xs text-slate-400">({u.role})</span></span>
              {u.role !== "super_admin" && (direction ? (
                <button className="btn-outline !py-1 !text-xs" onClick={() => { if (confirm(`Supprimer ${u.email} ?`)) deleteUser.mutate({ userId: u.id }); }}>Supprimer</button>
              ) : (
                <button className="btn-outline !py-1 !text-xs" onClick={() => requestDeletion.mutate({ userId: u.id })}>Demander suppression</button>
              ))}
            </div>
          ))}
        </div>
        {!direction && requestDeletion.isSuccess && <p className="mt-2 text-sm text-green-600">Demande envoyée à la Direction pour approbation.</p>}
      </section>

      {/* Paiements & réservations */}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-lg font-bold text-slate-800">Derniers paiements</h2>
          <div className="mt-3 space-y-1">
            {payments.data?.map((p) => (
              <div key={p.id} className="card flex items-center justify-between p-2 text-sm">
                <span className="text-slate-600">#{p.id} · {p.type}</span>
                <span className="font-semibold">{p.amount} {p.currency}</span>
                <span className="text-xs text-slate-400">{p.status}</span>
              </div>
            ))}
            {payments.data?.length === 0 && <p className="text-sm text-slate-500">Aucun paiement.</p>}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-800">Dernières réservations</h2>
          <div className="mt-3 space-y-1">
            {reservations.data?.map((r) => (
              <div key={r.id} className="card flex items-center justify-between p-2 text-sm">
                <span className="text-slate-600">#{r.id} · {r.type}</span>
                <span className="text-xs text-slate-400">{r.status}</span>
              </div>
            ))}
            {reservations.data?.length === 0 && <p className="text-sm text-slate-500">Aucune réservation.</p>}
          </div>
        </section>
      </div>

      {/* ===== Zone Direction (PDG) ===== */}
      {direction && (
        <>
          {/* Demandes de suppression à approuver */}
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-800">Demandes de suppression de compte <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <div className="mt-3 space-y-1">
              {deletionRequests.data?.filter((r) => r.status === "en_attente").map((r) => (
                <div key={r.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{r.targetName ?? r.targetEmail} <span className="text-xs text-slate-400">demandé par #{r.requestedBy}</span></span>
                  <div className="flex gap-2">
                    <button className="btn-primary !py-1 !text-xs" onClick={() => decideDeletion.mutate({ requestId: r.id, approve: true })}>Approuver</button>
                    <button className="btn-outline !py-1 !text-xs" onClick={() => decideDeletion.mutate({ requestId: r.id, approve: false })}>Refuser</button>
                  </div>
                </div>
              ))}
              {deletionRequests.data?.filter((r) => r.status === "en_attente").length === 0 && <p className="text-sm text-slate-500">Aucune demande en attente.</p>}
            </div>
          </section>
          {/* Équipe interne */}
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-800">Équipe interne <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <form
              className="mt-3 grid gap-2 md:grid-cols-5"
              onSubmit={(e) => { e.preventDefault(); createStaff.mutate(staff); }}
            >
              <input className="input" placeholder="Nom" value={staff.name} onChange={(e) => setStaff({ ...staff, name: e.target.value })} required />
              <input className="input" type="email" placeholder="Email" value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} required />
              <input className="input" type="password" placeholder="Mot de passe (8+)" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} required minLength={8} />
              <select className="input" value={staff.role} onChange={(e) => setStaff({ ...staff, role: e.target.value as "employee" | "admin" })}>
                <option value="employee">Employé</option>
                <option value="admin">Administration</option>
              </select>
              <button className="btn-primary !text-sm" disabled={createStaff.isPending}>Créer le compte</button>
            </form>
            {createStaff.error && <p className="mt-2 text-sm text-red-600">{createStaff.error.message}</p>}
            <div className="mt-4 space-y-1">
              {staffList.data?.map((s) => (
                <div key={s.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{s.name} — {s.email} <span className="text-xs text-slate-400">({s.role})</span></span>
                  {s.role !== "super_admin" && (
                    <button className="btn-outline !py-1 !text-xs" onClick={() => { if (confirm(`Supprimer ${s.email} ?`)) deleteUser.mutate({ userId: s.id }); }}>Supprimer</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Codes promo */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Codes promotionnels <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <form
              className="mt-3 grid gap-2 md:grid-cols-4"
              onSubmit={(e) => { e.preventDefault(); createPromo.mutate({ ...promo, value: Number(promo.value) }); }}
            >
              <input className="input" placeholder="CODE" value={promo.code} onChange={(e) => setPromo({ ...promo, code: e.target.value })} required />
              <select className="input" value={promo.type} onChange={(e) => setPromo({ ...promo, type: e.target.value as "pourcentage" | "montant" })}>
                <option value="pourcentage">Pourcentage (%)</option>
                <option value="montant">Montant (centimes)</option>
              </select>
              <input className="input" type="number" placeholder="Valeur" value={promo.value} onChange={(e) => setPromo({ ...promo, value: Number(e.target.value) })} required />
              <button className="btn-primary !text-sm" disabled={createPromo.isPending}>Créer le code</button>
            </form>
            <div className="mt-4 space-y-1">
              {promoList.data?.map((p) => (
                <div key={p.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">
                    <span className="font-semibold">{p.code}</span> — {p.value}{p.type === "pourcentage" ? "%" : " ct"} · utilisé {p.usedCount}×
                    {!p.active && <span className="ml-2 text-xs text-red-500">(inactif)</span>}
                  </span>
                  <div className="flex gap-2">
                    <button className="btn-outline !py-1 !text-xs" onClick={() => updatePromo.mutate({ id: p.id, active: !p.active })}>{p.active ? "Désactiver" : "Activer"}</button>
                    <button className="btn-outline !py-1 !text-xs" onClick={() => { if (confirm(`Supprimer ${p.code} ?`)) deletePromo.mutate({ id: p.id }); }}>Supprimer</button>
                  </div>
                </div>
              ))}
              {promoList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun code promo.</p>}
            </div>
          </section>

          {/* Traçabilité — radar Direction */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Traçabilité — journal des actions <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Toutes les actions des employés et de la Direction sont enregistrées.</p>
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {auditLog.data?.map((l) => (
                <div key={l.id} className="card flex items-center justify-between p-2 text-xs">
                  <span className="font-mono text-slate-700">{l.action}{l.entityType ? ` · ${l.entityType}#${l.entityId ?? ""}` : ""}</span>
                  <span className="text-slate-400">{l.actorEmail ?? `#${l.actorId}`} · {new Date(l.createdAt).toLocaleString("fr-FR")}</span>
                </div>
              ))}
              {auditLog.data?.length === 0 && <p className="text-sm text-slate-500">Aucune action enregistrée pour l'instant.</p>}
            </div>
          </section>

          {/* Centre de contrôle des modules (Partie 6 §7) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Centre de contrôle des modules <span className="text-xs font-normal text-brand">(Super Admin)</span></h2>
            <p className="text-xs text-slate-500">Activez, masquez ou mettez en maintenance chaque univers — sans casser les autres.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="py-2">Module</th>
                    <th className="py-2">État</th>
                    <th className="py-2">Visible public</th>
                  </tr>
                </thead>
                <tbody>
                  {modulesList.data?.map((m) => (
                    <tr key={m.code} className="border-b border-slate-50">
                      <td className="py-2">
                        <p className="font-semibold text-slate-800">{m.nom}</p>
                        <p className="text-xs text-slate-400">{m.code}</p>
                      </td>
                      <td className="py-2">
                        <select
                          className="input !py-1 !text-xs"
                          value={m.status}
                          onChange={(e) => setModuleStatus.mutate({ code: m.code, status: e.target.value as "active" | "masque" | "maintenance" | "desactive" })}
                        >
                          <option value="active">Actif</option>
                          <option value="masque">Masqué</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="desactive">Désactivé</option>
                        </select>
                      </td>
                      <td className="py-2">
                        <button
                          className="btn-outline !py-1 !text-xs"
                          onClick={() => updateModule.mutate({ code: m.code, visiblePublic: !m.visiblePublic })}
                        >
                          {m.visiblePublic ? "Oui" : "Non"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {modulesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun module.</p>}
            </div>
          </section>

          {/* Certification par ID */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Certifier un véhicule « Sélection MKA.P-MS » <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (certifyId) { certify.mutate({ annonceId: Number(certifyId), certified: true }); setCertifyId(""); } }}
            >
              <input className="input max-w-xs" type="number" placeholder="ID de l'annonce" value={certifyId} onChange={(e) => setCertifyId(e.target.value)} />
              <button className="btn-primary !text-sm">Certifier</button>
            </form>
            {certify.isSuccess && <p className="mt-2 text-sm text-green-600">Certification mise à jour.</p>}
          </section>
        </>
      )}
    </div>
  );
}
