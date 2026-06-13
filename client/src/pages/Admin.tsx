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
  const dashboard = trpc.admin.dashboard.useQuery(undefined, { enabled });
  const disputesList = trpc.disputes.listAll.useQuery(undefined, { enabled });
  const partnersList = trpc.partners.list.useQuery(undefined, { enabled: direction });
  const warehousesList = trpc.warehouses.list.useQuery(undefined, { enabled: direction });
  const countriesList = trpc.countries.listAll.useQuery(undefined, { enabled: direction });
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
  const decideDispute = trpc.disputes.decide.useMutation({ onSuccess: () => { utils.disputes.listAll.invalidate(); utils.admin.dashboard.invalidate(); } });
  const createPartner = trpc.partners.create.useMutation({ onSuccess: () => { utils.partners.list.invalidate(); setPartner({ name: "", type: "autre", country: "" }); } });
  const setPartnerActive = trpc.partners.setActive.useMutation({ onSuccess: () => utils.partners.list.invalidate() });
  const deletePartner = trpc.partners.remove.useMutation({ onSuccess: () => utils.partners.list.invalidate() });
  const createWarehouse = trpc.warehouses.create.useMutation({ onSuccess: () => { utils.warehouses.list.invalidate(); setWarehouse({ nom: "", countryCode: "FR", ville: "", type: "mixte" }); } });
  const upsertCountry = trpc.countries.upsert.useMutation({ onSuccess: () => utils.countries.listAll.invalidate() });

  const [staff, setStaff] = useState({ email: "", name: "", password: "", role: "employee" as "employee" | "admin" });
  const [promo, setPromo] = useState({ code: "", type: "pourcentage" as "pourcentage" | "montant", value: 10 });
  const [certifyId, setCertifyId] = useState("");
  const [partner, setPartner] = useState({ name: "", type: "autre", country: "" });
  const [warehouse, setWarehouse] = useState({ nom: "", countryCode: "FR", ville: "", type: "mixte" });

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

      {/* Centre de commandement PDG (Parties 13 & 16) — tout en un écran */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">Centre de commandement PDG <span className="text-xs font-normal text-brand">(temps réel)</span></h2>
        {(() => {
          const eur = (v?: number) => (dashboard.data && v != null ? `${v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €` : "—");
          return (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { l: "CA du jour", v: eur(dashboard.data?.caJour) },
            { l: "CA semaine", v: eur(dashboard.data?.caSemaine) },
            { l: "CA du mois", v: eur(dashboard.data?.caMois) },
            { l: "CA de l'année", v: eur(dashboard.data?.caAnnee) },
            { l: "Bénéfice estimé (mois)", v: eur(dashboard.data?.beneficeEstime) },
            { l: "Commissions (mois)", v: eur(dashboard.data?.commissionsMois) },
            { l: "Remboursements (mois)", v: eur(dashboard.data?.remboursementsMois) },
            { l: "Abonnements actifs", v: dashboard.data?.abonnementsActifs },
            { l: "Nouveaux comptes (mois)", v: dashboard.data?.nouveauxComptes },
            { l: "dont particuliers / pros", v: dashboard.data ? `${dashboard.data.nouveauxParticuliers} / ${dashboard.data.nouveauxPros}` : "—" },
            { l: "Véhicules vendus", v: dashboard.data?.vehiculesVendus },
            { l: "Réservations", v: dashboard.data?.reservations },
            { l: "Paiements en attente", v: dashboard.data?.paiementsEnAttente },
            { l: "Paiements échoués", v: dashboard.data?.paiementsEchoues, alert: !!dashboard.data?.paiementsEchoues },
            { l: "Litiges ouverts", v: dashboard.data?.litigesOuverts, alert: !!dashboard.data?.litigesOuverts },
            { l: "KYC à vérifier", v: dashboard.data?.kycEnAttente, alert: !!dashboard.data?.kycEnAttente },
            { l: "Annonces à valider", v: dashboard.data?.annoncesEnAttente, alert: !!dashboard.data?.annoncesEnAttente },
          ].map((c) => (
            <div key={c.l} className={`card p-4 text-center ${c.alert ? "ring-1 ring-amber-300" : ""}`}>
              <div className={`text-xl font-extrabold ${c.alert ? "text-amber-600" : "text-slate-900"}`}>{c.v ?? "—"}</div>
              <div className="text-xs text-slate-500">{c.l}</div>
            </div>
          ))}
        </div>
          );
        })()}
      </section>

      {/* Centre de litiges (Partie 8) */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Centre de litiges</h2>
        <p className="text-xs text-slate-500">Ouverture → preuves → analyse → décision (remboursement ou clôture).</p>
        <div className="mt-3 space-y-2">
          {disputesList.data?.map((d) => (
            <div key={d.id} className="card p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{d.reference ?? `#${d.id}`} · {d.univers} · {d.category}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${d.status === "ouvert" || d.status === "en_analyse" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{d.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{d.openerEmail} — {d.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className="btn-outline !py-1 !text-xs" onClick={() => decideDispute.mutate({ id: d.id, status: "en_analyse" })}>En analyse</button>
                <button className="btn-outline !py-1 !text-xs" onClick={() => decideDispute.mutate({ id: d.id, status: "resolu", resolution: "Résolu" })}>Résolu</button>
                <button className="btn-outline !py-1 !text-xs" onClick={() => { const m = prompt("Montant remboursé (€) :", "0"); if (m != null) decideDispute.mutate({ id: d.id, status: "rembourse", amountRefunded: Number(m), resolution: "Remboursement" }); }}>Rembourser</button>
                <button className="btn-outline !py-1 !text-xs" onClick={() => decideDispute.mutate({ id: d.id, status: "clos" })}>Clore</button>
              </div>
            </div>
          ))}
          {disputesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun litige.</p>}
        </div>
      </section>

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
                  <span className="text-slate-400">{l.actorEmail ?? `#${l.actorId}`}{l.ipAddress ? ` · ${l.ipAddress}` : ""} · {new Date(l.createdAt).toLocaleString("fr-FR")}</span>
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

          {/* Partenaires (Partie 15) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Partenaires <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => { e.preventDefault(); if (partner.name) createPartner.mutate({ name: partner.name, type: partner.type as "autre", country: partner.country || undefined }); }}
            >
              <input className="input max-w-xs" placeholder="Nom du partenaire" value={partner.name} onChange={(e) => setPartner({ ...partner, name: e.target.value })} />
              <select className="input max-w-[200px]" value={partner.type} onChange={(e) => setPartner({ ...partner, type: e.target.value })}>
                <option value="fournisseur_vehicules">Fournisseur véhicules</option>
                <option value="fournisseur_pieces">Fournisseur pièces</option>
                <option value="transporteur">Transporteur</option>
                <option value="garage">Garage partenaire</option>
                <option value="vtc">Société VTC</option>
                <option value="depanneur">Dépanneur</option>
                <option value="lavage">Lavage auto</option>
                <option value="karting">Karting</option>
                <option value="autre">Autre</option>
              </select>
              <input className="input max-w-[120px]" placeholder="Pays (FR)" value={partner.country} onChange={(e) => setPartner({ ...partner, country: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {partnersList.data?.map((p) => (
                <div key={p.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{p.name} <span className="text-xs text-slate-400">({p.type}{p.country ? ` · ${p.country}` : ""})</span></span>
                  <div className="flex gap-2">
                    <button className="btn-outline !py-1 !text-xs" onClick={() => setPartnerActive.mutate({ id: p.id, active: !p.active })}>{p.active ? "Actif" : "Inactif"}</button>
                    <button className="btn-outline !py-1 !text-xs" onClick={() => { if (confirm(`Supprimer ${p.name} ?`)) deletePartner.mutate({ id: p.id }); }}>Supprimer</button>
                  </div>
                </div>
              ))}
              {partnersList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun partenaire.</p>}
            </div>
          </section>

          {/* Multi-entrepôts (Partie 10) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Entrepôts <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => { e.preventDefault(); if (warehouse.nom) createWarehouse.mutate({ nom: warehouse.nom, countryCode: warehouse.countryCode, ville: warehouse.ville || undefined, type: warehouse.type as "mixte" }); }}
            >
              <input className="input max-w-xs" placeholder="Nom (Entrepôt Conakry)" value={warehouse.nom} onChange={(e) => setWarehouse({ ...warehouse, nom: e.target.value })} />
              <input className="input max-w-[120px]" placeholder="Pays (GN)" value={warehouse.countryCode} onChange={(e) => setWarehouse({ ...warehouse, countryCode: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="Ville" value={warehouse.ville} onChange={(e) => setWarehouse({ ...warehouse, ville: e.target.value })} />
              <select className="input max-w-[160px]" value={warehouse.type} onChange={(e) => setWarehouse({ ...warehouse, type: e.target.value })}>
                <option value="mixte">Mixte</option>
                <option value="vehicules">Véhicules</option>
                <option value="pieces">Pièces</option>
              </select>
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {warehousesList.data?.map((w) => (
                <div key={w.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{w.nom} <span className="text-xs text-slate-400">({w.countryCode}{w.ville ? ` · ${w.ville}` : ""} · {w.type})</span></span>
                  <span className={`text-xs ${w.active ? "text-green-600" : "text-slate-400"}`}>{w.active ? "Actif" : "Inactif"}</span>
                </div>
              ))}
              {warehousesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun entrepôt.</p>}
            </div>
          </section>

          {/* Plan Afrique — pays (Partie 14) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Plan Afrique — pays <span className="text-xs font-normal text-brand">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Activez les pays (devise + règles import/douane) pour ouvrir progressivement les marchés.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {countriesList.data?.map((c) => (
                <div key={c.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{c.name} <span className="text-xs text-slate-400">({c.code} · {c.currency})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${c.active ? "!border-green-500 !text-green-600" : ""}`} onClick={() => upsertCountry.mutate({ code: c.code, name: c.name, currency: c.currency, active: !c.active })}>{c.active ? "Actif" : "Inactif"}</button>
                </div>
              ))}
              {countriesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun pays configuré.</p>}
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
