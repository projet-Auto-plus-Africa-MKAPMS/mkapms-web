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

  // Parties 19-23
  const kpis = trpc.admin.kpis.useQuery(undefined, { enabled });
  const countryStats = trpc.countries.stats.useQuery(undefined, { enabled });
  const subsidiariesList = trpc.governance.listSubsidiaries.useQuery(undefined, { enabled: direction });
  const sitesList = trpc.governance.listSites.useQuery(undefined, { enabled: direction });
  const franchisesList = trpc.governance.listFranchises.useQuery(undefined, { enabled: direction });
  const platformStatus = trpc.platform.status.useQuery(undefined, { enabled });
  const monitoring = trpc.platform.monitoring.useQuery(undefined, { enabled });
  const backups = trpc.platform.backups.useQuery(undefined, { enabled });
  const insuranceList = trpc.insurance.list.useQuery(undefined, { enabled });
  const labList = trpc.lab.list.useQuery(undefined, { enabled });
  // Parties 24-29
  const procOrders = trpc.procurement.listOrders.useQuery(undefined, { enabled });
  const hrRecords = trpc.hr.records.useQuery(undefined, { enabled });
  const hrLeaves = trpc.hr.leaves.useQuery(undefined, { enabled });
  const qualityList = trpc.quality.list.useQuery(undefined, { enabled });
  const investor = trpc.investor.overview.useQuery(undefined, { enabled });
  const mediaList = trpc.media.list.useQuery(undefined, { enabled });
  const apiKeys = trpc.partnerApi.list.useQuery(undefined, { enabled });
  // Messagerie support / contact plateforme
  const ticketsListQ = trpc.admin.ticketsList.useQuery(undefined, { enabled });
  // Lavage / Karting / Formation (masqués au public) + carte plateforme
  const lavageStationsQ = trpc.lavage.listStations.useQuery(undefined, { enabled });
  const kartingCentersQ = trpc.karting.listCenters.useQuery(undefined, { enabled });
  const kartingFleetQ = trpc.karting.listFleet.useQuery(undefined, { enabled });
  const kartingEventsQ = trpc.karting.listEvents.useQuery(undefined, { enabled });
  const formationsQ = trpc.formation.list.useQuery(undefined, { enabled });
  const platformMapQ = trpc.platformMap.full.useQuery(undefined, { enabled });

  const setCountryActive = trpc.countries.setActive.useMutation({ onSuccess: () => { utils.countries.listAll.invalidate(); utils.countries.stats.invalidate(); } });
  const createSubsidiary = trpc.governance.createSubsidiary.useMutation({ onSuccess: () => { utils.governance.listSubsidiaries.invalidate(); setSubsidiary({ name: "", countryCode: "FR", city: "" }); } });
  const createSite = trpc.governance.createSite.useMutation({ onSuccess: () => { utils.governance.listSites.invalidate(); setSite({ name: "", type: "agence", countryCode: "FR", city: "" }); } });
  const createFranchise = trpc.governance.createFranchise.useMutation({ onSuccess: () => { utils.governance.listFranchises.invalidate(); setFranchise({ name: "", type: "garage", countryCode: "FR", zone: "" }); } });
  const setFranchiseStatus = trpc.governance.setFranchiseStatus.useMutation({ onSuccess: () => utils.governance.listFranchises.invalidate() });
  const setMaintenance = trpc.platform.setMaintenance.useMutation({ onSuccess: () => utils.platform.status.invalidate() });
  const resolveEvent = trpc.platform.resolveEvent.useMutation({ onSuccess: () => utils.platform.monitoring.invalidate() });
  const createInsurance = trpc.insurance.create.useMutation({ onSuccess: () => { utils.insurance.list.invalidate(); setInsurance({ type: "location", compagnie: "", numeroPolice: "" }); } });
  const createLab = trpc.lab.create.useMutation({ onSuccess: () => { utils.lab.list.invalidate(); setLab({ key: "", name: "", category: "autre" }); } });
  const setLabStatus = trpc.lab.setStatus.useMutation({ onSuccess: () => utils.lab.list.invalidate() });
  // Parties 24-29
  const createOrder = trpc.procurement.createOrder.useMutation({ onSuccess: () => { utils.procurement.listOrders.invalidate(); setOrder({ category: "vehicule", total: 0, notes: "" }); } });
  const setOrderStatus = trpc.procurement.setOrderStatus.useMutation({ onSuccess: () => utils.procurement.listOrders.invalidate() });
  const createLeave = trpc.hr.createLeave.useMutation({ onSuccess: () => { utils.hr.leaves.invalidate(); setLeave({ userId: "", type: "conge", reason: "" }); } });
  const decideLeave = trpc.hr.decideLeave.useMutation({ onSuccess: () => utils.hr.leaves.invalidate() });
  const upsertHr = trpc.hr.upsertRecord.useMutation({ onSuccess: () => { utils.hr.records.invalidate(); setHr({ userId: "", poste: "", contractType: "cdi", salaire: 0 }); } });
  const rateQuality = trpc.quality.rate.useMutation({ onSuccess: () => { utils.quality.list.invalidate(); setQuality({ targetType: "garage", targetId: "", grade: "B", note: "" }); } });
  const addMedia = trpc.media.add.useMutation({ onSuccess: () => { utils.media.list.invalidate(); setMedia({ type: "photo", title: "", url: "", channel: "" }); } });
  const removeMedia = trpc.media.remove.useMutation({ onSuccess: () => utils.media.list.invalidate() });
  const createApiKey = trpc.partnerApi.create.useMutation({ onSuccess: (d) => { utils.partnerApi.list.invalidate(); setNewApiKey(d.apiKey); setApiForm({ name: "", scopes: "" }); } });
  const setApiKeyActive = trpc.partnerApi.setActive.useMutation({ onSuccess: () => utils.partnerApi.list.invalidate() });
  // Lavage / Karting / Formation
  const createLavage = trpc.lavage.createStation.useMutation({ onSuccess: () => { utils.lavage.listStations.invalidate(); utils.platformMap.full.invalidate(); setLavage({ nom: "", countryCode: "FR", lat: "", lng: "", active: true }); } });
  const setLavageActive = trpc.lavage.setStationActive.useMutation({ onSuccess: () => { utils.lavage.listStations.invalidate(); utils.platformMap.full.invalidate(); } });
  const createKartingCenter = trpc.karting.createCenter.useMutation({ onSuccess: () => { utils.karting.listCenters.invalidate(); utils.platformMap.full.invalidate(); setKartingCenter({ nom: "", countryCode: "FR", ville: "", lat: "", lng: "", active: true }); } });
  const setKartingActive = trpc.karting.setCenterActive.useMutation({ onSuccess: () => { utils.karting.listCenters.invalidate(); utils.platformMap.full.invalidate(); } });
  const addKart = trpc.karting.addKart.useMutation({ onSuccess: () => { utils.karting.listFleet.invalidate(); setKart({ modele: "", marque: "MKA.P-MS", fabricationMaison: true, puissance: "", statut: "operationnel" }); } });
  const setKartStatus = trpc.karting.setKartStatus.useMutation({ onSuccess: () => utils.karting.listFleet.invalidate() });
  const createKartingEvent = trpc.karting.createEvent.useMutation({ onSuccess: () => { utils.karting.listEvents.invalidate(); setKartingEvent({ titre: "", type: "evenement", dateEvent: "" }); } });
  const createFormation = trpc.formation.create.useMutation({ onSuccess: () => { utils.formation.list.invalidate(); setFormation({ titre: "", categorie: "garage", certifiante: false, active: false }); } });
  const setFormationActive = trpc.formation.setActive.useMutation({ onSuccess: () => utils.formation.list.invalidate() });
  const respondTicket = trpc.support.respond.useMutation({ onSuccess: () => { utils.admin.ticketsList.invalidate(); setTicketReply({}); } });
  const setTicketStatus = trpc.support.setStatus.useMutation({ onSuccess: () => utils.admin.ticketsList.invalidate() });

  const [staff, setStaff] = useState({ email: "", name: "", password: "", role: "employee" as "employee" | "admin" });
  const [promo, setPromo] = useState({ code: "", type: "pourcentage" as "pourcentage" | "montant", value: 10 });
  const [certifyId, setCertifyId] = useState("");
  const [partner, setPartner] = useState({ name: "", type: "autre", country: "" });
  const [warehouse, setWarehouse] = useState({ nom: "", countryCode: "FR", ville: "", type: "mixte" });
  const [subsidiary, setSubsidiary] = useState({ name: "", countryCode: "FR", city: "" });
  const [site, setSite] = useState({ name: "", type: "agence", countryCode: "FR", city: "" });
  const [franchise, setFranchise] = useState({ name: "", type: "garage", countryCode: "FR", zone: "" });
  const [insurance, setInsurance] = useState({ type: "location", compagnie: "", numeroPolice: "" });
  const [lab, setLab] = useState({ key: "", name: "", category: "autre" });
  const [order, setOrder] = useState({ category: "vehicule", total: 0, notes: "" });
  const [leave, setLeave] = useState({ userId: "", type: "conge", reason: "" });
  const [hr, setHr] = useState({ userId: "", poste: "", contractType: "cdi", salaire: 0 });
  const [quality, setQuality] = useState({ targetType: "garage", targetId: "", grade: "B", note: "" });
  const [media, setMedia] = useState({ type: "photo", title: "", url: "", channel: "" });
  const [apiForm, setApiForm] = useState({ name: "", scopes: "" });
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [lavage, setLavage] = useState({ nom: "", countryCode: "FR", lat: "", lng: "", active: true });
  const [kartingCenter, setKartingCenter] = useState({ nom: "", countryCode: "FR", ville: "", lat: "", lng: "", active: true });
  const [kart, setKart] = useState({ modele: "", marque: "MKA.P-MS", fabricationMaison: true, puissance: "", statut: "operationnel" });
  const [kartingEvent, setKartingEvent] = useState({ titre: "", type: "evenement", dateEvent: "" });
  const [formation, setFormation] = useState({ titre: "", categorie: "garage", certifiante: false, active: false });
  const [ticketReply, setTicketReply] = useState<Record<number, string>>({});

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
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${direction ? "bg-gold-soft text-gold-dark" : "bg-slate-100 text-slate-600"}`}>
          {direction ? "Direction / PDG" : "Employé"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
        {cards.map((c) => (
          <div key={c.l} className="card p-4 text-center">
            <div className="text-2xl font-extrabold text-noir">{c.v ?? "—"}</div>
            <div className="text-xs text-slate-500">{c.l}</div>
          </div>
        ))}
      </div>

      {/* Centre de commandement PDG (Parties 13 & 16) — tout en un écran */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">Centre de commandement PDG <span className="text-xs font-normal text-gold-dark">(temps réel)</span></h2>
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

      {/* Partie 22 — Centre de performance (KPI par univers) */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">Centre de performance <span className="text-xs font-normal text-gold-dark">(KPI par univers)</span></h2>
        <p className="text-xs text-slate-500">Tout mesurer en un écran : vente, garage, location, pièces, livraison, Afrique.</p>
        {kpis.data && (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Vente</div>
              <div className="mt-1 text-xs text-slate-600">Vendus : <b>{kpis.data.vente.vendus}</b> / {kpis.data.vente.total}</div>
              <div className="text-xs text-slate-600">Conversion : <b>{kpis.data.vente.tauxConversion}%</b></div>
              <div className="text-xs text-slate-600">Panier moyen : <b>{kpis.data.vente.panierMoyen} €</b></div>
              <div className="text-xs text-slate-600">Délai moyen : <b>{kpis.data.vente.delaiMoyenJours} j</b></div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Garage</div>
              <div className="mt-1 text-xs text-slate-600">Devis créés : <b>{kpis.data.garage.devisCrees}</b></div>
              <div className="text-xs text-slate-600">Acceptés : <b>{kpis.data.garage.devisAcceptes}</b></div>
              <div className="text-xs text-slate-600">Taux acceptation : <b>{kpis.data.garage.tauxAcceptation}%</b></div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Location</div>
              <div className="mt-1 text-xs text-slate-600">Réservations : <b>{kpis.data.location.reservations}</b></div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Pièces Auto</div>
              <div className="mt-1 text-xs text-slate-600">Commandes : <b>{kpis.data.pieces.commandes}</b></div>
              <div className="text-xs text-slate-600">Boutiques : <b>{kpis.data.pieces.boutiques}</b></div>
              <div className="text-xs text-slate-600">Produits : <b>{kpis.data.pieces.produits}</b></div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Livraison</div>
              <div className="mt-1 text-xs text-slate-600">Missions : <b>{kpis.data.livraison.missions}</b></div>
            </div>
            <div className="card p-3">
              <div className="text-sm font-bold text-slate-800">Import Africa+</div>
              <div className="mt-1 text-xs text-slate-600">Importations : <b>{kpis.data.afrique.importations}</b></div>
              <div className="text-xs text-slate-600">Top pays : {kpis.data.afrique.paysActifs.map((p) => `${p.pays} (${p.c})`).join(", ") || "—"}</div>
            </div>
          </div>
        )}
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

      {/* Messagerie support — contact direct de la plateforme par les clients */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-800">
          Messages & support
          {ticketsListQ.data && ticketsListQ.data.filter((t) => t.status === "ouvert").length > 0 && (
            <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-noir">
              {ticketsListQ.data.filter((t) => t.status === "ouvert").length} ouvert(s)
            </span>
          )}
        </h2>
        <p className="text-xs text-slate-500">Messages envoyés par les clients via le bouton « Contacter MKA.P-MS ». Répondez ici — le client est notifié.</p>
        <div className="mt-3 space-y-2">
          {ticketsListQ.data?.map((t) => (
            <div key={t.id} className="card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-800">{t.sujet}</span>
                  <span className="ml-2 text-xs text-slate-400">{t.contactNom} · {t.contactEmail}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${t.status === "ouvert" ? "bg-amber-100 text-amber-700" : t.status === "resolu" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                  {t.status}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{t.message}</p>
              {t.response && (
                <div className="mt-2 rounded-lg border-l-2 border-gold bg-gold-soft p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gold-dark">Réponse envoyée</p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{t.response}</p>
                </div>
              )}
              <form
                className="mt-2 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  const txt = ticketReply[t.id]?.trim();
                  if (txt) respondTicket.mutate({ id: t.id, response: txt, status: "resolu" });
                }}
              >
                <input
                  className="input flex-1"
                  placeholder={t.response ? "Ajouter une réponse…" : "Votre réponse au client…"}
                  value={ticketReply[t.id] ?? ""}
                  onChange={(e) => setTicketReply((s) => ({ ...s, [t.id]: e.target.value }))}
                />
                <button className="btn-primary !text-sm" disabled={respondTicket.isPending}>Répondre</button>
                {t.status !== "ferme" && (
                  <button type="button" className="btn-outline !text-sm" onClick={() => setTicketStatus.mutate({ id: t.id, status: "ferme" })}>Clôturer</button>
                )}
              </form>
            </div>
          ))}
          {ticketsListQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucun message pour le moment.</p>}
        </div>
      </section>

      {/* ===== Zone Direction (PDG) ===== */}
      {direction && (
        <>
          {/* Demandes de suppression à approuver */}
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-800">Demandes de suppression de compte <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Équipe interne <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Codes promotionnels <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Traçabilité — journal des actions <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Centre de contrôle des modules <span className="text-xs font-normal text-gold-dark">(Super Admin)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Partenaires <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
            <h2 className="text-lg font-bold text-slate-800">Entrepôts <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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

          {/* International — catalogue mondial des pays (Parties 14 & 19) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">International — pays du monde <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Tous les pays du monde (Europe comprise). Activez progressivement les marchés en un clic (devise + règles import/douane).</p>
            <p className="mt-1 text-xs text-slate-400">{countriesList.data?.length ?? 0} pays au catalogue · {countriesList.data?.filter((c) => c.active).length ?? 0} actifs</p>
            <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto md:grid-cols-3">
              {countriesList.data?.map((c) => (
                <div key={c.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{c.name} <span className="text-xs text-slate-400">({c.code} · {c.currency})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${c.active ? "!border-green-500 !text-green-600" : ""}`} onClick={() => setCountryActive.mutate({ code: c.code, active: !c.active })}>{c.active ? "Actif" : "Inactif"}</button>
                </div>
              ))}
              {countriesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun pays configuré.</p>}
            </div>
          </section>

          {/* Partie 19 §4 — Objectifs / stats par pays */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Stats par pays <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Utilisateurs et annonces par pays — suivi de l'expansion.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Pays</th><th>Statut</th><th>Utilisateurs</th><th>Annonces</th></tr></thead>
                <tbody>
                  {countryStats.data?.filter((c) => c.active || c.users > 0 || c.annonces > 0).map((c) => (
                    <tr key={c.code} className="border-t border-slate-100">
                      <td className="py-1 text-slate-700">{c.name} <span className="text-xs text-slate-400">({c.code})</span></td>
                      <td className={c.active ? "text-green-600" : "text-slate-400"}>{c.active ? "Actif" : "Inactif"}</td>
                      <td className="font-semibold">{c.users}</td>
                      <td className="font-semibold">{c.annonces}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Partie 19 — Gouvernance : filiales, sites, franchises */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Gouvernance — filiales <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Niveau Pays. Chaque filiale gère ses équipes/véhicules sans accéder aux autres pays.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (subsidiary.name) createSubsidiary.mutate({ name: subsidiary.name, countryCode: subsidiary.countryCode, city: subsidiary.city || undefined }); }}>
              <input className="input max-w-xs" placeholder="Nom (MKA Guinée)" value={subsidiary.name} onChange={(e) => setSubsidiary({ ...subsidiary, name: e.target.value })} />
              <input className="input max-w-[120px]" placeholder="Pays (GN)" value={subsidiary.countryCode} onChange={(e) => setSubsidiary({ ...subsidiary, countryCode: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="Ville" value={subsidiary.city} onChange={(e) => setSubsidiary({ ...subsidiary, city: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {subsidiariesList.data?.map((s) => (
                <div key={s.id} className="card flex items-center justify-between p-2 text-sm"><span className="text-slate-700">{s.name} <span className="text-xs text-slate-400">({s.countryCode}{s.city ? ` · ${s.city}` : ""})</span></span><span className={`text-xs ${s.active ? "text-green-600" : "text-slate-400"}`}>{s.active ? "Active" : "Inactive"}</span></div>
              ))}
              {subsidiariesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucune filiale.</p>}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Gouvernance — sites locaux <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Niveau Ville : agence, entrepôt, garage, karting, lavage (apparaissent sur la carte mondiale si géolocalisés).</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (site.name) createSite.mutate({ name: site.name, type: site.type as "agence", countryCode: site.countryCode, city: site.city || undefined }); }}>
              <input className="input max-w-xs" placeholder="Nom (Agence Dakar)" value={site.name} onChange={(e) => setSite({ ...site, name: e.target.value })} />
              <select className="input max-w-[150px]" value={site.type} onChange={(e) => setSite({ ...site, type: e.target.value })}>
                <option value="agence">Agence</option><option value="entrepot">Entrepôt</option><option value="garage">Garage</option><option value="karting">Karting</option><option value="lavage">Lavage</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-[120px]" placeholder="Pays (SN)" value={site.countryCode} onChange={(e) => setSite({ ...site, countryCode: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="Ville" value={site.city} onChange={(e) => setSite({ ...site, city: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {sitesList.data?.map((s) => (
                <div key={s.id} className="card flex items-center justify-between p-2 text-sm"><span className="text-slate-700">{s.name} <span className="text-xs text-slate-400">({s.type} · {s.countryCode}{s.city ? ` · ${s.city}` : ""})</span></span></div>
              ))}
              {sitesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun site.</p>}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Franchises <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Garage / lavage / karting en franchise : contrat, zone, redevance, statut.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (franchise.name) createFranchise.mutate({ name: franchise.name, type: franchise.type as "garage", countryCode: franchise.countryCode, zone: franchise.zone || undefined }); }}>
              <input className="input max-w-xs" placeholder="Nom" value={franchise.name} onChange={(e) => setFranchise({ ...franchise, name: e.target.value })} />
              <select className="input max-w-[150px]" value={franchise.type} onChange={(e) => setFranchise({ ...franchise, type: e.target.value })}>
                <option value="garage">Garage</option><option value="lavage">Lavage</option><option value="karting">Karting</option><option value="agence">Agence</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-[120px]" placeholder="Pays (CI)" value={franchise.countryCode} onChange={(e) => setFranchise({ ...franchise, countryCode: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="Zone (Abidjan)" value={franchise.zone} onChange={(e) => setFranchise({ ...franchise, zone: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {franchisesList.data?.map((f) => (
                <div key={f.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{f.name} <span className="text-xs text-slate-400">({f.type} · {f.countryCode}{f.zone ? ` · ${f.zone}` : ""})</span></span>
                  <select className="input !py-1 !text-xs max-w-[140px]" value={f.status} onChange={(e) => setFranchiseStatus.mutate({ id: f.id, status: e.target.value as "active" })}>
                    <option value="prospect">Prospect</option><option value="active">Active</option><option value="suspendue">Suspendue</option><option value="resiliee">Résiliée</option>
                  </select>
                </div>
              ))}
              {franchisesList.data?.length === 0 && <p className="text-sm text-slate-500">Aucune franchise.</p>}
            </div>
          </section>

          {/* Partie 21 — Assurances (polices par univers) */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Assurances <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Polices par univers : location, transport, garage, VTC, livraison. (Contrats & archivage légal gérés par le moteur de contrats.)</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (insurance.compagnie) createInsurance.mutate({ type: insurance.type as "location", compagnie: insurance.compagnie, numeroPolice: insurance.numeroPolice || undefined }); }}>
              <select className="input max-w-[150px]" value={insurance.type} onChange={(e) => setInsurance({ ...insurance, type: e.target.value })}>
                <option value="location">Location</option><option value="transport">Transport</option><option value="garage">Garage</option><option value="vtc">VTC</option><option value="livraison">Livraison</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-xs" placeholder="Compagnie" value={insurance.compagnie} onChange={(e) => setInsurance({ ...insurance, compagnie: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="N° police" value={insurance.numeroPolice} onChange={(e) => setInsurance({ ...insurance, numeroPolice: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {insuranceList.data?.map((p) => (
                <div key={p.id} className="card flex items-center justify-between p-2 text-sm"><span className="text-slate-700">{p.compagnie} <span className="text-xs text-slate-400">({p.type}{p.numeroPolice ? ` · ${p.numeroPolice}` : ""})</span></span><span className={`text-xs ${p.status === "active" ? "text-green-600" : "text-slate-400"}`}>{p.status}</span></div>
              ))}
              {insuranceList.data?.length === 0 && <p className="text-sm text-slate-500">Aucune police.</p>}
            </div>
          </section>

          {/* Partie 20 — Continuité & sécurité */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Continuité & sécurité <span className="text-xs font-normal text-gold-dark">(Super Admin)</span></h2>
            <div className="mt-3 card flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-bold text-slate-800">Mode maintenance</div>
                <div className="text-xs text-slate-500">{platformStatus.data?.maintenance ? "Plateforme EN MAINTENANCE" : "Plateforme en service normal"}</div>
              </div>
              <button className={`btn-outline !text-sm ${platformStatus.data?.maintenance ? "!border-amber-500 !text-amber-600" : ""}`} onClick={() => setMaintenance.mutate({ on: !platformStatus.data?.maintenance })}>{platformStatus.data?.maintenance ? "Désactiver" : "Activer"}</button>
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-800">Surveillance {monitoring.data && monitoring.data.criticalOpen > 0 && <span className="text-xs font-normal text-red-600">({monitoring.data.criticalOpen} critique(s))</span>}</div>
              <div className="mt-2 space-y-1">
                {monitoring.data?.events.slice(0, 8).map((ev) => (
                  <div key={ev.id} className="card flex items-center justify-between p-2 text-xs">
                    <span className="text-slate-700"><b className={ev.severity === "critical" || ev.severity === "error" ? "text-red-600" : "text-slate-500"}>[{ev.severity}]</b> {ev.source} — {ev.message}</span>
                    {!ev.resolved && <button className="btn-outline !py-0.5 !text-xs" onClick={() => resolveEvent.mutate({ id: ev.id })}>Résolu</button>}
                  </div>
                ))}
                {monitoring.data?.events.length === 0 && <p className="text-sm text-slate-500">Aucun événement enregistré.</p>}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-bold text-slate-800">Historique des sauvegardes</div>
              <p className="text-xs text-slate-500">Les sauvegardes managées PostgreSQL sont assurées par Railway. Journal applicatif :</p>
              <div className="mt-2 space-y-1">
                {backups.data?.slice(0, 6).map((b) => (
                  <div key={b.id} className="card flex items-center justify-between p-2 text-xs"><span className="text-slate-700">{b.type} · {new Date(b.createdAt).toLocaleString("fr-FR")}</span><span className={b.status === "success" ? "text-green-600" : "text-red-600"}>{b.status}</span></div>
                ))}
                {backups.data?.length === 0 && <p className="text-sm text-slate-500">Aucune sauvegarde journalisée.</p>}
              </div>
            </div>
          </section>

          {/* Partie 23 — MKA.P-MS Lab */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">MKA.P-MS Lab <span className="text-xs font-normal text-gold-dark">(Super Admin)</span></h2>
            <p className="text-xs text-slate-500">Tester de nouvelles idées (offre, page, service, paiement, IA) sans casser le système principal : brouillon → test → actif → désactivé.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (lab.key && lab.name) createLab.mutate({ key: lab.key, name: lab.name, category: lab.category as "autre" }); }}>
              <input className="input max-w-[180px]" placeholder="clé (ex: offre_test)" value={lab.key} onChange={(e) => setLab({ ...lab, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
              <input className="input max-w-xs" placeholder="Nom de l'expérience" value={lab.name} onChange={(e) => setLab({ ...lab, name: e.target.value })} />
              <select className="input max-w-[140px]" value={lab.category} onChange={(e) => setLab({ ...lab, category: e.target.value })}>
                <option value="offre">Offre</option><option value="page">Page</option><option value="service">Service</option><option value="paiement">Paiement</option><option value="ia">IA</option><option value="autre">Autre</option>
              </select>
              <button className="btn-primary !text-sm">Créer</button>
            </form>
            {createLab.error && <p className="mt-2 text-xs text-red-600">{createLab.error.message}</p>}
            <div className="mt-3 space-y-1">
              {labList.data?.map((x) => (
                <div key={x.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{x.name} <span className="text-xs text-slate-400">({x.key}{x.category ? ` · ${x.category}` : ""})</span></span>
                  <select className="input !py-1 !text-xs max-w-[130px]" value={x.status} onChange={(e) => setLabStatus.mutate({ id: x.id, status: e.target.value as "actif" })}>
                    <option value="brouillon">Brouillon</option><option value="test">Test</option><option value="actif">Actif</option><option value="desactive">Désactivé</option>
                  </select>
                </div>
              ))}
              {labList.data?.length === 0 && <p className="text-sm text-slate-500">Aucune expérience.</p>}
            </div>
          </section>

          {/* Partie 24 — Centre Achat / Approvisionnement */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Achat / Approvisionnement <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Bons de commande fournisseurs (Auto1, Europe, Chine…), réception + contrôle qualité.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); createOrder.mutate({ category: order.category as "vehicule", total: Number(order.total) || 0, notes: order.notes || undefined }); }}>
              <select className="input max-w-[150px]" value={order.category} onChange={(e) => setOrder({ ...order, category: e.target.value })}>
                <option value="vehicule">Véhicules</option><option value="piece">Pièces</option><option value="materiel">Matériel</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-[140px]" type="number" placeholder="Total" value={order.total || ""} onChange={(e) => setOrder({ ...order, total: Number(e.target.value) })} />
              <input className="input max-w-xs" placeholder="Notes / fournisseur" value={order.notes} onChange={(e) => setOrder({ ...order, notes: e.target.value })} />
              <button className="btn-primary !text-sm">Créer le bon</button>
            </form>
            <div className="mt-3 space-y-1">
              {procOrders.data?.map((o) => (
                <div key={o.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{o.reference ?? `#${o.id}`} <span className="text-xs text-slate-400">({o.category} · {o.total} {o.currency})</span></span>
                  <select className="input !py-1 !text-xs max-w-[150px]" value={o.status} onChange={(e) => setOrderStatus.mutate({ id: o.id, status: e.target.value as "envoye" })}>
                    <option value="brouillon">Brouillon</option><option value="envoye">Envoyé</option><option value="confirme">Confirmé</option><option value="recu_partiel">Reçu partiel</option><option value="recu">Reçu</option><option value="annule">Annulé</option>
                  </select>
                </div>
              ))}
              {procOrders.data?.length === 0 && <p className="text-sm text-slate-500">Aucun bon de commande.</p>}
            </div>
          </section>

          {/* Partie 25 — Centre RH */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Centre RH <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Fiches employé (contrat, poste, salaire), congés/absences, évaluations — relié à Finance+.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (hr.userId) upsertHr.mutate({ userId: Number(hr.userId), poste: hr.poste || undefined, contractType: hr.contractType as "cdi", salaire: Number(hr.salaire) || undefined }); }}>
              <input className="input max-w-[110px]" type="number" placeholder="ID user" value={hr.userId} onChange={(e) => setHr({ ...hr, userId: e.target.value })} />
              <input className="input max-w-[160px]" placeholder="Poste" value={hr.poste} onChange={(e) => setHr({ ...hr, poste: e.target.value })} />
              <select className="input max-w-[120px]" value={hr.contractType} onChange={(e) => setHr({ ...hr, contractType: e.target.value })}>
                <option value="cdi">CDI</option><option value="cdd">CDD</option><option value="stage">Stage</option><option value="freelance">Freelance</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-[120px]" type="number" placeholder="Salaire" value={hr.salaire || ""} onChange={(e) => setHr({ ...hr, salaire: Number(e.target.value) })} />
              <button className="btn-primary !text-sm">Enregistrer fiche</button>
            </form>
            <div className="mt-2 space-y-1">
              {hrRecords.data?.map((r) => (
                <div key={r.userId} className="card p-2 text-xs text-slate-700">User #{r.userId} — {r.poste ?? "—"} · {r.contractType}{r.salaire ? ` · ${r.salaire} ${r.currency}` : ""}</div>
              ))}
            </div>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (leave.userId) createLeave.mutate({ userId: Number(leave.userId), type: leave.type as "conge", reason: leave.reason || undefined }); }}>
              <input className="input max-w-[110px]" type="number" placeholder="ID user" value={leave.userId} onChange={(e) => setLeave({ ...leave, userId: e.target.value })} />
              <select className="input max-w-[140px]" value={leave.type} onChange={(e) => setLeave({ ...leave, type: e.target.value })}>
                <option value="conge">Congé</option><option value="absence">Absence</option><option value="maladie">Maladie</option><option value="formation">Formation</option>
              </select>
              <input className="input max-w-xs" placeholder="Motif" value={leave.reason} onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
              <button className="btn-outline !text-sm">Demander congé/absence</button>
            </form>
            <div className="mt-2 space-y-1">
              {hrLeaves.data?.map((l) => (
                <div key={l.id} className="card flex items-center justify-between p-2 text-xs">
                  <span className="text-slate-700">User #{l.userId} · {l.type} <span className={l.status === "approuve" ? "text-green-600" : l.status === "refuse" ? "text-red-600" : "text-slate-400"}>({l.status})</span></span>
                  {l.status === "demande" && <span className="flex gap-1"><button className="btn-outline !py-0.5 !text-xs !border-green-500 !text-green-600" onClick={() => decideLeave.mutate({ id: l.id, status: "approuve" })}>Approuver</button><button className="btn-outline !py-0.5 !text-xs !border-red-400 !text-red-500" onClick={() => decideLeave.mutate({ id: l.id, status: "refuse" })}>Refuser</button></span>}
                </div>
              ))}
              {hrLeaves.data?.length === 0 && <p className="text-sm text-slate-500">Aucune demande.</p>}
            </div>
          </section>

          {/* Partie 26 — Centre Qualité */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Centre Qualité <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Notation interne A+→D (invisible au public) : garages, vendeurs, livreurs, VTC, partenaires.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (quality.targetId) rateQuality.mutate({ targetType: quality.targetType as "garage", targetId: Number(quality.targetId), grade: quality.grade as "B", note: quality.note || undefined }); }}>
              <select className="input max-w-[140px]" value={quality.targetType} onChange={(e) => setQuality({ ...quality, targetType: e.target.value })}>
                <option value="garage">Garage</option><option value="vendeur">Vendeur</option><option value="livreur">Livreur</option><option value="vtc">VTC</option><option value="partenaire">Partenaire</option>
              </select>
              <input className="input max-w-[110px]" type="number" placeholder="ID cible" value={quality.targetId} onChange={(e) => setQuality({ ...quality, targetId: e.target.value })} />
              <select className="input max-w-[90px]" value={quality.grade} onChange={(e) => setQuality({ ...quality, grade: e.target.value })}>
                <option value="A+">A+</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
              <input className="input max-w-xs" placeholder="Note interne" value={quality.note} onChange={(e) => setQuality({ ...quality, note: e.target.value })} />
              <button className="btn-primary !text-sm">Noter</button>
            </form>
            <div className="mt-2 space-y-1">
              {qualityList.data?.map((q) => (
                <div key={q.id} className="card flex items-center justify-between p-2 text-sm"><span className="text-slate-700">{q.targetType} #{q.targetId}{q.note ? ` — ${q.note}` : ""}</span><span className={`font-bold ${q.grade.startsWith("A") ? "text-green-600" : q.grade === "B" ? "text-amber-600" : "text-red-600"}`}>{q.grade}</span></div>
              ))}
              {qualityList.data?.length === 0 && <p className="text-sm text-slate-500">Aucune notation.</p>}
            </div>
          </section>

          {/* Partie 27 — Mode Investisseurs */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Mode Investisseurs <span className="text-xs font-normal text-gold-dark">(lecture seule)</span></h2>
            <p className="text-xs text-slate-500">Croissance, revenus, valorisation indicative — pour partenaires financiers.</p>
            {investor.data && (
              <div className="mt-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="card p-3"><div className="text-xs text-slate-500">Utilisateurs</div><div className="text-xl font-extrabold text-slate-900">{investor.data.utilisateurs}</div></div>
                  <div className="card p-3"><div className="text-xs text-slate-500">Annonces</div><div className="text-xl font-extrabold text-slate-900">{investor.data.annonces}</div></div>
                  <div className="card p-3"><div className="text-xs text-slate-500">Revenu total</div><div className="text-xl font-extrabold text-slate-900">{Math.round(investor.data.revenuTotal)} €</div></div>
                  <div className="card p-3"><div className="text-xs text-slate-500">Valorisation indicative</div><div className="text-xl font-extrabold text-noir">{investor.data.valorisationIndicative.toLocaleString("fr-FR")} €</div></div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-slate-500"><th className="py-1">Mois</th><th>Revenu</th><th>Nouveaux comptes</th></tr></thead>
                    <tbody>
                      {investor.data.croissance.map((m) => (
                        <tr key={m.mois} className="border-t border-slate-100"><td className="py-1 text-slate-700">{m.mois}</td><td className="font-semibold">{Math.round(m.revenu)} €</td><td className="font-semibold">{m.nouveauxComptes}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Valorisation purement indicative (revenu annualisé × 4) — à affiner avec des données réelles.</p>
              </div>
            )}
          </section>

          {/* Partie 28 — Centre Médias */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Centre Médias <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Vidéos, photos, réseaux sociaux, influenceurs/ambassadeurs.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (media.title) addMedia.mutate({ type: media.type as "photo", title: media.title, url: media.url || undefined, channel: media.channel || undefined }); }}>
              <select className="input max-w-[120px]" value={media.type} onChange={(e) => setMedia({ ...media, type: e.target.value })}>
                <option value="photo">Photo</option><option value="video">Vidéo</option><option value="social">Réseau social</option><option value="campagne">Campagne</option><option value="autre">Autre</option>
              </select>
              <input className="input max-w-xs" placeholder="Titre" value={media.title} onChange={(e) => setMedia({ ...media, title: e.target.value })} />
              <input className="input max-w-[200px]" placeholder="URL (https://…)" value={media.url} onChange={(e) => setMedia({ ...media, url: e.target.value })} />
              <input className="input max-w-[150px]" placeholder="Canal (instagram…)" value={media.channel} onChange={(e) => setMedia({ ...media, channel: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            {addMedia.error && <p className="mt-2 text-xs text-red-600">{addMedia.error.message}</p>}
            <div className="mt-2 space-y-1">
              {mediaList.data?.map((m) => (
                <div key={m.id} className="card flex items-center justify-between p-2 text-sm"><span className="text-slate-700">{m.title} <span className="text-xs text-slate-400">({m.type}{m.channel ? ` · ${m.channel}` : ""})</span></span><button className="btn-outline !py-0.5 !text-xs !border-red-400 !text-red-500" onClick={() => removeMedia.mutate({ id: m.id })}>Suppr.</button></div>
              ))}
              {mediaList.data?.length === 0 && <p className="text-sm text-slate-500">Aucun média.</p>}
            </div>
          </section>

          {/* Partie 29 — API Partenaires */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">API Partenaires <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Clés API + portée pour brancher Auto1, historiques, assurances, paiements, transporteurs (sans refaire le système).</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (apiForm.name) createApiKey.mutate({ name: apiForm.name, scopes: apiForm.scopes || undefined }); }}>
              <input className="input max-w-xs" placeholder="Nom (ex: Auto1)" value={apiForm.name} onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })} />
              <input className="input max-w-[260px]" placeholder="Portée (vehicules,historique,paiements)" value={apiForm.scopes} onChange={(e) => setApiForm({ ...apiForm, scopes: e.target.value })} />
              <button className="btn-primary !text-sm">Générer une clé</button>
            </form>
            {newApiKey && (
              <div className="mt-2 card border-amber-300 bg-amber-50 p-2 text-xs">
                <b>Clé générée (copiez-la maintenant, elle ne sera plus affichée) :</b>
                <div className="mt-1 break-all font-mono text-slate-800">{newApiKey}</div>
                <button className="btn-outline mt-1 !py-0.5 !text-xs" onClick={() => setNewApiKey(null)}>J'ai copié</button>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {apiKeys.data?.map((k) => (
                <div key={k.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{k.name} <span className="text-xs text-slate-400 font-mono">({k.keyPrefix}…{k.scopes ? ` · ${k.scopes}` : ""})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${k.active ? "!border-green-500 !text-green-600" : "!border-slate-300"}`} onClick={() => setApiKeyActive.mutate({ id: k.id, active: !k.active })}>{k.active ? "Active" : "Inactive"}</button>
                </div>
              ))}
              {apiKeys.data?.length === 0 && <p className="text-sm text-slate-500">Aucune clé.</p>}
            </div>
          </section>

          {/* Karting (featuring — prioritaire) — masqué au public */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Karting <span className="rounded bg-gold-soft px-1.5 py-0.5 text-xs font-bold text-gold-dark">FEATURING</span> <span className="text-xs font-normal text-slate-400">(masqué au public)</span></h2>
            <p className="text-xs text-slate-500">Levier de marque MKA.P-MS : centres référencés sur la carte plateforme + flotte de karts (dont fabrication maison). Invisible aux clients tant que le module n'est pas activé.</p>

            <h3 className="mt-3 text-sm font-bold text-slate-700">Centres karting</h3>
            <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (kartingCenter.nom) createKartingCenter.mutate({ nom: kartingCenter.nom, countryCode: kartingCenter.countryCode, ville: kartingCenter.ville || undefined, lat: kartingCenter.lat ? Number(kartingCenter.lat) : undefined, lng: kartingCenter.lng ? Number(kartingCenter.lng) : undefined, active: kartingCenter.active }); }}>
              <input className="input max-w-xs" placeholder="Nom (Karting MKA Conakry)" value={kartingCenter.nom} onChange={(e) => setKartingCenter({ ...kartingCenter, nom: e.target.value })} />
              <input className="input max-w-[100px]" placeholder="Pays" value={kartingCenter.countryCode} onChange={(e) => setKartingCenter({ ...kartingCenter, countryCode: e.target.value })} />
              <input className="input max-w-[140px]" placeholder="Ville" value={kartingCenter.ville} onChange={(e) => setKartingCenter({ ...kartingCenter, ville: e.target.value })} />
              <input className="input max-w-[110px]" placeholder="Lat" value={kartingCenter.lat} onChange={(e) => setKartingCenter({ ...kartingCenter, lat: e.target.value })} />
              <input className="input max-w-[110px]" placeholder="Lng" value={kartingCenter.lng} onChange={(e) => setKartingCenter({ ...kartingCenter, lng: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter centre</button>
            </form>
            <div className="mt-2 space-y-1">
              {kartingCentersQ.data?.map((c) => (
                <div key={c.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{c.nom} <span className="text-xs text-slate-400">({c.countryCode ?? "—"}{c.ville ? ` · ${c.ville}` : ""}{c.lat != null && c.lng != null ? " · géolocalisé" : " · sans GPS"})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${c.active ? "!border-green-500 !text-green-600" : ""}`} onClick={() => setKartingActive.mutate({ id: c.id, active: !c.active })}>{c.active ? "Actif" : "Inactif"}</button>
                </div>
              ))}
              {kartingCentersQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucun centre.</p>}
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-700">Flotte de karts MKA.P-MS (vitrine marque + fabrication maison)</h3>
            <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (kart.modele) addKart.mutate({ modele: kart.modele, marque: kart.marque || "MKA.P-MS", fabricationMaison: kart.fabricationMaison, puissance: kart.puissance || undefined, statut: kart.statut as "operationnel" }); }}>
              <input className="input max-w-xs" placeholder="Modèle (MKA-Kart X1)" value={kart.modele} onChange={(e) => setKart({ ...kart, modele: e.target.value })} />
              <input className="input max-w-[140px]" placeholder="Marque" value={kart.marque} onChange={(e) => setKart({ ...kart, marque: e.target.value })} />
              <input className="input max-w-[150px]" placeholder="Puissance (9 CV…)" value={kart.puissance} onChange={(e) => setKart({ ...kart, puissance: e.target.value })} />
              <select className="input max-w-[150px]" value={kart.statut} onChange={(e) => setKart({ ...kart, statut: e.target.value })}>
                <option value="operationnel">Opérationnel</option><option value="maintenance">Maintenance</option><option value="vitrine">Vitrine</option><option value="prototype">Prototype</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={kart.fabricationMaison} onChange={(e) => setKart({ ...kart, fabricationMaison: e.target.checked })} /> Fabrication maison</label>
              <button className="btn-primary !text-sm">Ajouter kart</button>
            </form>
            <div className="mt-2 space-y-1">
              {kartingFleetQ.data?.map((k) => (
                <div key={k.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{k.modele} <span className="text-xs text-slate-400">({k.marque}{k.puissance ? ` · ${k.puissance}` : ""}{k.fabricationMaison ? " · 🏭 maison" : ""})</span></span>
                  <select className="input !py-1 !text-xs max-w-[140px]" value={k.statut} onChange={(e) => setKartStatus.mutate({ id: k.id, statut: e.target.value as "operationnel" })}>
                    <option value="operationnel">Opérationnel</option><option value="maintenance">Maintenance</option><option value="vitrine">Vitrine</option><option value="prototype">Prototype</option>
                  </select>
                </div>
              ))}
              {kartingFleetQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucun kart enregistré.</p>}
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-700">Événements / compétitions</h3>
            <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (kartingEvent.titre) createKartingEvent.mutate({ titre: kartingEvent.titre, type: kartingEvent.type || undefined, dateEvent: kartingEvent.dateEvent || undefined }); }}>
              <input className="input max-w-xs" placeholder="Titre (Grand Prix MKA)" value={kartingEvent.titre} onChange={(e) => setKartingEvent({ ...kartingEvent, titre: e.target.value })} />
              <select className="input max-w-[150px]" value={kartingEvent.type} onChange={(e) => setKartingEvent({ ...kartingEvent, type: e.target.value })}>
                <option value="evenement">Événement</option><option value="competition">Compétition</option>
              </select>
              <input className="input max-w-[150px]" type="date" value={kartingEvent.dateEvent} onChange={(e) => setKartingEvent({ ...kartingEvent, dateEvent: e.target.value })} />
              <button className="btn-outline !text-sm">Ajouter</button>
            </form>
            <div className="mt-2 space-y-1">
              {kartingEventsQ.data?.map((ev) => (
                <div key={ev.id} className="card p-2 text-xs text-slate-700">{ev.titre} <span className="text-slate-400">({ev.type ?? "—"}{ev.dateEvent ? ` · ${ev.dateEvent}` : ""})</span></div>
              ))}
              {kartingEventsQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucun événement.</p>}
            </div>
          </section>

          {/* Lavage Auto — masqué au public */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Lavage Auto <span className="text-xs font-normal text-slate-400">(masqué au public)</span></h2>
            <p className="text-xs text-slate-500">Stations (propres ou partenaires) référencées sur la carte plateforme. Invisible aux clients pour le moment.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (lavage.nom) createLavage.mutate({ nom: lavage.nom, countryCode: lavage.countryCode, lat: lavage.lat ? Number(lavage.lat) : undefined, lng: lavage.lng ? Number(lavage.lng) : undefined, active: lavage.active }); }}>
              <input className="input max-w-xs" placeholder="Nom (Lavage MKA Dakar)" value={lavage.nom} onChange={(e) => setLavage({ ...lavage, nom: e.target.value })} />
              <input className="input max-w-[100px]" placeholder="Pays" value={lavage.countryCode} onChange={(e) => setLavage({ ...lavage, countryCode: e.target.value })} />
              <input className="input max-w-[110px]" placeholder="Lat" value={lavage.lat} onChange={(e) => setLavage({ ...lavage, lat: e.target.value })} />
              <input className="input max-w-[110px]" placeholder="Lng" value={lavage.lng} onChange={(e) => setLavage({ ...lavage, lng: e.target.value })} />
              <button className="btn-primary !text-sm">Ajouter station</button>
            </form>
            <div className="mt-3 space-y-1">
              {lavageStationsQ.data?.map((s) => (
                <div key={s.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{s.nom} <span className="text-xs text-slate-400">({s.countryCode ?? "—"}{s.lat != null && s.lng != null ? " · géolocalisé" : " · sans GPS"})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${s.active ? "!border-green-500 !text-green-600" : ""}`} onClick={() => setLavageActive.mutate({ id: s.id, active: !s.active })}>{s.active ? "Active" : "Inactive"}</button>
                </div>
              ))}
              {lavageStationsQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucune station.</p>}
            </div>
          </section>

          {/* Formation — masqué au public */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Formation <span className="text-xs font-normal text-slate-400">(masqué au public)</span></h2>
            <p className="text-xs text-slate-500">Catalogue de formations (vidéos, certifiantes) pour garages, vendeurs, transporteurs.</p>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (formation.titre) createFormation.mutate({ titre: formation.titre, categorie: formation.categorie || undefined, certifiante: formation.certifiante, active: formation.active }); }}>
              <input className="input max-w-xs" placeholder="Titre" value={formation.titre} onChange={(e) => setFormation({ ...formation, titre: e.target.value })} />
              <input className="input max-w-[150px]" placeholder="Catégorie" value={formation.categorie} onChange={(e) => setFormation({ ...formation, categorie: e.target.value })} />
              <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={formation.certifiante} onChange={(e) => setFormation({ ...formation, certifiante: e.target.checked })} /> Certifiante</label>
              <button className="btn-primary !text-sm">Ajouter</button>
            </form>
            <div className="mt-3 space-y-1">
              {formationsQ.data?.map((f) => (
                <div key={f.id} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700">{f.titre} <span className="text-xs text-slate-400">({f.categorie ?? "—"}{f.certifiante ? " · certifiante" : ""})</span></span>
                  <button className={`btn-outline !py-1 !text-xs ${f.active ? "!border-green-500 !text-green-600" : ""}`} onClick={() => setFormationActive.mutate({ id: f.id, active: !f.active })}>{f.active ? "Active" : "Inactive"}</button>
                </div>
              ))}
              {formationsQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucune formation.</p>}
            </div>
          </section>

          {/* Carte plateforme (Direction) — inclut karting & lavage non visibles aux clients */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Carte plateforme <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
            <p className="text-xs text-slate-500">Tous les points référencés (sites, karting, lavage…). Les points <b>non visibles aux clients</b> sont signalés.</p>
            <div className="mt-3 space-y-1">
              {platformMapQ.data?.map((p) => (
                <div key={`${p.category}-${p.id}`} className="card flex items-center justify-between p-2 text-sm">
                  <span className="text-slate-700"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">{p.category}</span> {p.name} <span className="text-xs text-slate-400">({p.countryCode ?? "—"}{p.city ? ` · ${p.city}` : ""} · {p.lat.toFixed(3)}, {p.lng.toFixed(3)})</span></span>
                  {!p.publicVisible && <span className="text-xs font-semibold text-amber-600">non visible client</span>}
                </div>
              ))}
              {platformMapQ.data?.length === 0 && <p className="text-sm text-slate-500">Aucun point géolocalisé. Ajoutez des coordonnées (lat/lng) aux centres karting, stations lavage ou sites.</p>}
            </div>
          </section>

          {/* Certification par ID */}
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">Certifier un véhicule « Sélection MKA.P-MS » <span className="text-xs font-normal text-gold-dark">(Direction)</span></h2>
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
