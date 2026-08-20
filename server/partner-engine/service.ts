/**
 * Partner Engine (points 36-37).
 *
 * Point 36 — le réseau : un partenaire est décrit par son pays, son métier, les
 * services qu'il couvre, sa zone, son statut, son contrat, ses leads et sa
 * performance. La performance est TOUJOURS calculée depuis les leads réellement
 * enregistrés : aucun chiffre de façade.
 *
 * Point 37 — l'acquisition : le moteur compare la demande réelle (recherches
 * des visiteurs) à l'offre réellement disponible (partenaires couvrant la zone)
 * et ouvre une opportunité là où le manque est mesuré. Les actions préparées
 * (page SEO, contenus social/LinkedIn, campagne) restent en brouillon : rien
 * n'est publié ni envoyé sans décision humaine.
 */
import { and, count, desc, eq, gte, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { newsletterSubscribers, partners, seoPages } from "../schema.js";
import { smartSearchLogs } from "../smart-engine/schema.js";
import { notifyDirection, notifyEvent } from "../notification-os/triggers.js";
import { ingest } from "../visibility-os/index.js";
import {
  partnerApplications,
  partnerContracts,
  partnerCoverage,
  partnerLeads,
  partnerOpportunities,
} from "./schema.js";
import { PARTNER_SERVICES, findPartnerService } from "./services.js";

/** Type de partenaire de la table historique `partners`, déduit du métier. */
const PROFESSION_TO_PARTNER_TYPE: Record<string, string> = {
  garage: "garage",
  carrosserie: "garage",
  controle_technique: "garage",
  depannage: "depanneur",
  pieces: "fournisseur_pieces",
  vendeur: "fournisseur_vehicules",
  concessionnaire: "fournisseur_vehicules",
  loueur: "autre",
  vtc_taxi: "vtc",
  transport_livraison: "transporteur",
  comptabilite: "autre",
  flotte: "autre",
  assurance_finance: "autre",
};

function reference(prefix: string): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

// ───────────────────────── Point 36 — candidatures ─────────────────────────

export interface ApplyInput {
  userId?: number | null;
  companyName: string;
  profession: string;
  countryCode: string;
  city?: string | null;
  zoneRadiusKm?: number | null;
  services: string[];
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  message?: string | null;
  opportunityId?: number | null;
}

export interface ApplyResult {
  id: number;
  reference: string;
  status: string;
  /** Ce que le candidat doit comprendre : rien n'est accordé automatiquement. */
  suite: string;
}

/** « Devenir partenaire MKA.P-MS » — entrée commerciale publique du portail Pro. */
export async function applyAsPartner(input: ApplyInput): Promise<ApplyResult> {
  const services = input.services.filter((s) => findPartnerService(s) !== undefined);
  const [app] = await db
    .insert(partnerApplications)
    .values({
      reference: reference("PART"),
      userId: input.userId ?? null,
      companyName: input.companyName.slice(0, 180),
      profession: input.profession,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city ?? null,
      zoneRadiusKm: input.zoneRadiusKm ?? null,
      services,
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      contactPhone: input.contactPhone ?? null,
      message: input.message ?? null,
      opportunityId: input.opportunityId ?? null,
      status: "recue",
    })
    .returning();

  if (input.userId) {
    try {
      await notifyEvent({
        userId: input.userId,
        event: "partenaire_candidature",
        vars: { reference: app.reference, metier: input.profession },
        url: "/pro/devenir-partenaire",
      });
    } catch { /* notification best-effort */ }
  }

  // Une candidature que personne ne voit reste sans réponse : la direction est
  // prévenue même si le candidat n'a pas de compte.
  try {
    await notifyDirection(
      "partenaire_candidature_recue",
      {
        metier: input.profession,
        societe: input.companyName,
        zone: input.city ? `${input.city} (${input.countryCode})` : input.countryCode,
      },
      "/superadmin/partenaires",
    );
  } catch { /* notification best-effort */ }

  return {
    id: app.id,
    reference: app.reference,
    status: app.status,
    suite:
      "Candidature enregistrée. Elle est examinée par l'équipe MKA.P-MS : aucun partenariat n'est accordé automatiquement.",
  };
}

export async function listApplications(status?: string) {
  const rows = await db
    .select()
    .from(partnerApplications)
    .where(status ? eq(partnerApplications.status, status) : undefined)
    .orderBy(desc(partnerApplications.createdAt))
    .limit(300);
  return rows;
}

export interface ReviewInput {
  id: number;
  decision: "en_examen" | "acceptee" | "refusee";
  note?: string | null;
  reviewerId: number;
}

/**
 * Décision humaine sur une candidature. L'acceptation crée le partenaire dans
 * la table historique `partners` et sa couverture de zone : c'est ce qui le rend
 * comptable dans les opportunités du point 37.
 */
export async function reviewApplication(input: ReviewInput) {
  const [app] = await db
    .select()
    .from(partnerApplications)
    .where(eq(partnerApplications.id, input.id))
    .limit(1);
  if (!app) throw new Error("Candidature introuvable.");

  let partnerId = app.partnerId;
  if (input.decision === "acceptee" && partnerId === null) {
    const [p] = await db
      .insert(partners)
      .values({
        name: app.companyName,
        type: (PROFESSION_TO_PARTNER_TYPE[app.profession] ?? "autre") as never,
        country: app.countryCode,
        contactEmail: app.contactEmail,
        contactPhone: app.contactPhone,
        notes: `Candidature ${app.reference} — métier ${app.profession}.`,
      })
      .returning();
    partnerId = p.id;

    for (const service of app.services) {
      await db.insert(partnerCoverage).values({
        partnerId: p.id,
        service,
        countryCode: app.countryCode,
        city: app.city,
        radiusKm: app.zoneRadiusKm,
        status: "active",
      });
    }
  }

  await db
    .update(partnerApplications)
    .set({
      status: input.decision,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      reviewNote: input.note ?? null,
      partnerId,
      updatedAt: new Date(),
    })
    .where(eq(partnerApplications.id, input.id));

  if (app.userId && input.decision !== "en_examen") {
    try {
      await notifyEvent({
        userId: app.userId,
        event: "partenaire_decision",
        vars: {
          decision: input.decision === "acceptee" ? "acceptée" : "refusée",
          note: input.note ?? "",
        },
        url: "/pro/devenir-partenaire",
      });
    } catch { /* notification best-effort */ }
  }

  return { ok: true, partnerId, status: input.decision };
}

// ───────────────────────── Point 36 — réseau & performance ─────────────────

export interface PartnerNetworkRow {
  partnerId: number;
  name: string;
  type: string;
  country: string | null;
  active: boolean;
  services: string[];
  cities: string[];
  contract: {
    reference: string;
    kind: string;
    status: string;
    commissionRate: number | null;
    endsAt: string | null;
  } | null;
  performance: {
    leads: number;
    accepted: number;
    concluded: number;
    lost: number;
    /** Chiffre d'affaires connu : seuls les leads conclus avec montant réel. */
    knownRevenue: number | null;
    /** Commission due, uniquement si un contrat porte un taux. */
    commissionDue: number | null;
  };
}

export async function partnerNetwork(countryCode?: string): Promise<PartnerNetworkRow[]> {
  const rows = await db
    .select()
    .from(partners)
    .where(countryCode ? eq(partners.country, countryCode.toUpperCase()) : undefined)
    .orderBy(desc(partners.createdAt))
    .limit(500);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const coverage = await db
    .select()
    .from(partnerCoverage)
    .where(inArray(partnerCoverage.partnerId, ids));
  const contracts = await db
    .select()
    .from(partnerContracts)
    .where(inArray(partnerContracts.partnerId, ids))
    .orderBy(desc(partnerContracts.createdAt));
  const leads = await db
    .select({
      partnerId: partnerLeads.partnerId,
      status: partnerLeads.status,
      amount: partnerLeads.amount,
    })
    .from(partnerLeads)
    .where(inArray(partnerLeads.partnerId, ids));

  return rows.map((p) => {
    const cov = coverage.filter((c) => c.partnerId === p.id && c.status === "active");
    const contract = contracts.find((c) => c.partnerId === p.id && c.status === "actif")
      ?? contracts.find((c) => c.partnerId === p.id)
      ?? null;
    const mine = leads.filter((l) => l.partnerId === p.id);
    const concluded = mine.filter((l) => l.status === "conclu");
    const amounts = concluded
      .map((l) => (l.amount === null ? null : Number(l.amount)))
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const knownRevenue = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) : null;
    const rate = contract?.commissionRate === null || contract === null
      ? null
      : Number(contract.commissionRate);

    return {
      partnerId: p.id,
      name: p.name,
      type: p.type,
      country: p.country,
      active: p.active,
      services: [...new Set(cov.map((c) => c.service))],
      cities: [...new Set(cov.map((c) => c.city).filter((c): c is string => c !== null))],
      contract: contract
        ? {
            reference: contract.reference,
            kind: contract.kind,
            status: contract.status,
            commissionRate: rate,
            endsAt: contract.endsAt ? contract.endsAt.toISOString() : null,
          }
        : null,
      performance: {
        leads: mine.length,
        accepted: mine.filter((l) => l.status === "accepte").length,
        concluded: concluded.length,
        lost: mine.filter((l) => l.status === "perdu" || l.status === "refuse").length,
        knownRevenue,
        commissionDue:
          knownRevenue !== null && rate !== null && Number.isFinite(rate)
            ? Math.round(knownRevenue * (rate / 100) * 100) / 100
            : null,
      },
    };
  });
}

export interface CreateContractInput {
  partnerId: number;
  kind: "apporteur_affaires" | "prestataire" | "distribution" | "cadre";
  commissionRate?: number | null;
  currency?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  terms?: string | null;
}

/** Un contrat naît en brouillon : l'activation reste une décision humaine. */
export async function createContract(input: CreateContractInput) {
  const [c] = await db
    .insert(partnerContracts)
    .values({
      partnerId: input.partnerId,
      reference: reference("CTR"),
      kind: input.kind,
      commissionRate: input.commissionRate != null ? String(input.commissionRate) : null,
      currency: input.currency ?? "EUR",
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      terms: input.terms ?? null,
      status: "brouillon",
    })
    .returning();
  return c;
}

export async function setContractStatus(
  id: number,
  status: "brouillon" | "en_signature" | "actif" | "expire" | "resilie",
  userId: number,
) {
  await db
    .update(partnerContracts)
    .set({
      status,
      signedBy: status === "actif" ? userId : undefined,
      signedAt: status === "actif" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(partnerContracts.id, id));
  return { ok: true, status };
}

export interface RegisterLeadInput {
  partnerId?: number | null;
  service: string;
  countryCode: string;
  city?: string | null;
  source?: "recherche" | "demande_devis" | "reservation" | "campagne" | "manuel";
  userId?: number | null;
  detail?: string | null;
}

/** Enregistre un lead : seule source de la performance partenaire. */
export async function registerLead(input: RegisterLeadInput) {
  const [l] = await db
    .insert(partnerLeads)
    .values({
      partnerId: input.partnerId ?? null,
      service: input.service,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city ?? null,
      source: input.source ?? "recherche",
      userId: input.userId ?? null,
      detail: input.detail ?? null,
    })
    .returning();
  return l;
}

export async function updateLeadStatus(
  id: number,
  status: "nouveau" | "accepte" | "refuse" | "conclu" | "perdu",
  amount?: number | null,
) {
  await db
    .update(partnerLeads)
    .set({
      status,
      amount: amount != null ? String(amount) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(partnerLeads.id, id));
  return { ok: true, status };
}

// ───────────────────── Point 37 — acquisition automatique ──────────────────

export interface OpportunityRow {
  id: number;
  service: string;
  serviceLabel: string;
  countryCode: string;
  city: string | null;
  demandSignals: number;
  demandWithoutResults: number;
  partnersAvailable: number;
  priority: string;
  status: string;
  periodDays: number;
  detectedAt: string;
  actions: Record<string, unknown>[];
  /** Phrase factuelle : la mesure qui justifie l'opportunité. */
  constat: string;
}

export interface DetectResult {
  periodDays: number;
  searchesAnalysed: number;
  opportunities: number;
  created: number;
  updated: number;
  /** Renseigné quand aucune recherche n'est enregistrée : pas de faux vide. */
  limite: string | null;
}

/**
 * Détection du manque d'offre. Une opportunité n'est ouverte que si des
 * recherches réelles existent sur la zone ET que l'offre couvrant cette zone
 * est plus faible que la demande observée.
 */
export async function detectOpportunities(periodDays = 30): Promise<DetectResult> {
  const since = new Date(Date.now() - periodDays * 24 * 3600 * 1000);

  const [{ total }] = await db
    .select({ total: count() })
    .from(smartSearchLogs)
    .where(gte(smartSearchLogs.createdAt, since));

  if (Number(total) === 0) {
    return {
      periodDays,
      searchesAnalysed: 0,
      opportunities: 0,
      created: 0,
      updated: 0,
      limite:
        "Aucune recherche enregistrée sur la période : le moteur ne peut pas mesurer la demande, donc il n'invente aucune opportunité.",
    };
  }

  let created = 0;
  let updated = 0;
  let opportunities = 0;

  for (const svc of PARTNER_SERVICES) {
    const keywordFilter = or(...svc.keywords.map((k) => ilike(smartSearchLogs.query, `%${k}%`)));
    const zones = await db
      .select({
        ville: smartSearchLogs.ville,
        pays: smartSearchLogs.pays,
        searches: count(),
        withoutResults: sql<number>`sum(case when ${smartSearchLogs.hasResults} = false then 1 else 0 end)`,
      })
      .from(smartSearchLogs)
      .where(and(gte(smartSearchLogs.createdAt, since), keywordFilter))
      .groupBy(smartSearchLogs.ville, smartSearchLogs.pays)
      .having(sql`count(*) >= 3`);

    for (const z of zones) {
      const city = z.ville?.trim() || null;
      const countryCode = (z.pays?.trim() || "FR").slice(0, 4).toUpperCase();
      const demand = Number(z.searches);
      const withoutResults = Number(z.withoutResults ?? 0);

      const [{ available }] = await db
        .select({ available: sql<number>`count(distinct ${partnerCoverage.partnerId})` })
        .from(partnerCoverage)
        .innerJoin(partners, eq(partners.id, partnerCoverage.partnerId))
        .where(
          and(
            eq(partnerCoverage.service, svc.code),
            eq(partnerCoverage.status, "active"),
            eq(partnerCoverage.countryCode, countryCode),
            eq(partners.active, true),
            city
              ? or(eq(partnerCoverage.city, city), isNull(partnerCoverage.city))
              : undefined,
          ),
        );
      const partnersAvailable = Number(available ?? 0);

      // Un partenaire est jugé capable d'absorber une dizaine de demandes sur
      // la période : au-delà, la zone est sous-couverte. Seuil assumé, pas caché.
      const capacity = partnersAvailable * 10;
      if (demand <= capacity) continue;

      const priority =
        partnersAvailable === 0 && demand >= 10
          ? "critique"
          : demand >= capacity * 2 || withoutResults >= demand / 2
            ? "important"
            : "a_surveiller";

      opportunities += 1;

      const [existing] = await db
        .select({ id: partnerOpportunities.id, status: partnerOpportunities.status })
        .from(partnerOpportunities)
        .where(
          and(
            eq(partnerOpportunities.service, svc.code),
            eq(partnerOpportunities.countryCode, countryCode),
            city ? eq(partnerOpportunities.city, city) : isNull(partnerOpportunities.city),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(partnerOpportunities)
          .set({
            demandSignals: demand,
            demandWithoutResults: withoutResults,
            partnersAvailable,
            priority,
            periodDays,
            status: existing.status === "pourvue" ? "ouverte" : existing.status,
            detectedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(partnerOpportunities.id, existing.id));
        updated += 1;
      } else {
        const [row] = await db
          .insert(partnerOpportunities)
          .values({
            service: svc.code,
            countryCode,
            city,
            demandSignals: demand,
            demandWithoutResults: withoutResults,
            partnersAvailable,
            priority,
            periodDays,
            status: "ouverte",
          })
          .returning();
        created += 1;

        if (priority === "critique") {
          try {
            // Opportunité de zone : elle n'appartient à aucun client, elle
            // s'adresse à la direction.
            await notifyDirection(
              "opportunite_partenaire",
              {
                service: svc.label,
                zone: city ? `${city} (${countryCode})` : countryCode,
                detail: `${demand} recherche(s) sur ${periodDays} jours, ${partnersAvailable} partenaire(s) disponible(s).`,
              },
              `/superadmin/partenaires?opportunite=${row.id}`,
            );
          } catch { /* notification best-effort */ }
        }
      }
    }
  }

  return {
    periodDays,
    searchesAnalysed: Number(total),
    opportunities,
    created,
    updated,
    limite: null,
  };
}

export async function listOpportunities(status?: string): Promise<OpportunityRow[]> {
  const rows = await db
    .select()
    .from(partnerOpportunities)
    .where(status ? eq(partnerOpportunities.status, status) : undefined)
    .orderBy(desc(partnerOpportunities.detectedAt))
    .limit(200);

  return rows.map((o) => ({
    id: o.id,
    service: o.service,
    serviceLabel: findPartnerService(o.service)?.label ?? o.service,
    countryCode: o.countryCode,
    city: o.city,
    demandSignals: o.demandSignals,
    demandWithoutResults: o.demandWithoutResults,
    partnersAvailable: o.partnersAvailable,
    priority: o.priority,
    status: o.status,
    periodDays: o.periodDays,
    detectedAt: o.detectedAt.toISOString(),
    actions: o.actions,
    constat:
      `${o.demandSignals} recherche(s) « ${findPartnerService(o.service)?.label ?? o.service} » sur ` +
      `${o.periodDays} jours ${o.city ? `à ${o.city}` : `en ${o.countryCode}`}, ` +
      `pour ${o.partnersAvailable} partenaire(s) couvrant la zone` +
      (o.demandWithoutResults > 0 ? ` — dont ${o.demandWithoutResults} recherche(s) sans résultat.` : "."),
  }));
}

export interface PreparedAction {
  kind: "page_seo" | "contenu_social" | "campagne" | "emailing";
  state: "prepare" | "impossible";
  detail: string;
  ref?: string | number | null;
}

/**
 * Prépare les actions d'acquisition d'une opportunité.
 *
 * Tout reste en brouillon : la page SEO est créée non indexée, les contenus
 * social/LinkedIn en « préparé », et l'emailing n'est proposé que s'il existe
 * réellement une base consentie sur le pays — sinon l'action est marquée
 * impossible avec sa raison, jamais silencieusement ignorée.
 */
export async function prepareAcquisitionActions(opportunityId: number): Promise<{
  opportunityId: number;
  actions: PreparedAction[];
}> {
  const [o] = await db
    .select()
    .from(partnerOpportunities)
    .where(eq(partnerOpportunities.id, opportunityId))
    .limit(1);
  if (!o) throw new Error("Opportunité introuvable.");

  const svc = findPartnerService(o.service);
  const label = svc?.label ?? o.service;
  const zone = o.city ?? o.countryCode;
  const actions: PreparedAction[] = [];

  // 1. Page SEO de recrutement — créée NON indexée : elle attend relecture.
  const slugCity = (o.city ?? o.countryCode)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `service/devenir-partenaire-${o.service.replace(/_/g, "-")}/${slugCity}`;
  const title = `Devenir partenaire ${label} à ${zone} — MKA.P-MS`;
  const body =
    `MKA.P-MS recherche des professionnels « ${label.toLowerCase()} » à ${zone}. ` +
    `Nous mesurons ${o.demandSignals} recherche(s) sur ${o.periodDays} jours pour ` +
    `${o.partnersAvailable} partenaire(s) couvrant la zone : les demandes des clients dépassent l'offre disponible.`;

  try {
    const [page] = await db
      .insert(seoPages)
      .values({
        slug,
        title: title.slice(0, 160),
        metaDescription:
          `Professionnels ${label.toLowerCase()} à ${zone} : rejoignez le réseau MKA.P-MS et recevez les demandes de votre zone.`.slice(
            0,
            320,
          ),
        h1: `Devenir partenaire ${label} à ${zone}`,
        content: body,
        keywords: [
          `partenaire ${label.toLowerCase()} ${zone.toLowerCase()}`,
          `devenir partenaire ${label.toLowerCase()}`,
          `${label.toLowerCase()} ${zone.toLowerCase()}`,
        ],
        pageType: "recrutement_partenaire",
        univers: "partenaires",
        city: o.city,
        country: o.countryCode,
        indexed: false,
        priority: "0.5",
      })
      .onConflictDoNothing({ target: seoPages.slug })
      .returning();
    actions.push({
      kind: "page_seo",
      state: "prepare",
      detail: page
        ? `Page de recrutement créée non indexée : /${slug}. À relire puis indexer.`
        : `Page /${slug} déjà préparée précédemment.`,
      ref: slug,
    });
  } catch {
    actions.push({
      kind: "page_seo",
      state: "impossible",
      detail: "La page de recrutement n'a pas pu être préparée (table SEO indisponible).",
      ref: slug,
    });
  }

  // 2. Contenus organiques par canal (social, LinkedIn, assistants conversationnels) —
  //    préparés par le Global Visibility Engine, jamais publiés d'office.
  try {
    const res = await ingest({
      sourceType: "partenaire_opportunite",
      sourceId: String(o.id),
      title: `Professionnels ${label} à ${zone} : rejoignez MKA.P-MS`,
      body,
      country: o.countryCode.slice(0, 2),
      link: `/${slug}`,
      keywords: svc?.keywords.slice(0, 5) ?? [],
    });
    actions.push({
      kind: "contenu_social",
      state: "prepare",
      detail: `${res.variants} déclinaison(s) par canal préparée(s), ${res.publicationsPrepared} publication(s) en attente de validation.`,
      ref: res.contentId,
    });
    actions.push({
      kind: "campagne",
      state: "prepare",
      detail:
        res.autoPublished > 0
          ? `${res.autoPublished} diffusion(s) organique(s) sur canaux internes autorisés ; toute diffusion payante reste en brouillon.`
          : "Campagne organique prête ; aucune diffusion payante engagée (brouillon uniquement).",
      ref: res.contentId,
    });
  } catch {
    actions.push({
      kind: "contenu_social",
      state: "impossible",
      detail: "Les contenus n'ont pas pu être préparés (moteur de visibilité indisponible).",
    });
  }

  // 3. Emailing — uniquement si une base consentie existe sur le pays.
  const [{ subscribers }] = await db
    .select({ subscribers: count() })
    .from(newsletterSubscribers)
    .where(
      and(
        eq(newsletterSubscribers.active, true),
        eq(newsletterSubscribers.pays, o.countryCode.slice(0, 2)),
      ),
    );
  actions.push(
    Number(subscribers) > 0
      ? {
          kind: "emailing",
          state: "prepare",
          detail: `${Number(subscribers)} contact(s) consentant(s) en ${o.countryCode} : envoi possible après validation humaine.`,
        }
      : {
          kind: "emailing",
          state: "impossible",
          detail: `Aucune base consentie en ${o.countryCode} : aucun email ne sera envoyé. Une base achetée ou collectée sans consentement est exclue.`,
        },
  );

  await db
    .update(partnerOpportunities)
    .set({
      actions: actions as unknown as Record<string, unknown>[],
      status: o.status === "ouverte" ? "en_cours" : o.status,
      updatedAt: new Date(),
    })
    .where(eq(partnerOpportunities.id, o.id));

  return { opportunityId: o.id, actions };
}

export async function setOpportunityStatus(
  id: number,
  status: "ouverte" | "en_cours" | "pourvue" | "abandonnee",
) {
  await db
    .update(partnerOpportunities)
    .set({ status, updatedAt: new Date() })
    .where(eq(partnerOpportunities.id, id));
  return { ok: true, status };
}

// ───────────────────────────── Santé du moteur ─────────────────────────────

export interface PartnerEngineHealth {
  health: "ok" | "degraded" | "down";
  partenaires: number;
  partenairesActifs: number;
  zonesCouvertes: number;
  contratsActifs: number;
  candidaturesEnAttente: number;
  opportunitesOuvertes: number;
  details: string[];
}

export async function partnerEngineHealth(): Promise<PartnerEngineHealth> {
  const details: string[] = [];
  const [p] = await db.select({ n: count() }).from(partners);
  const [pa] = await db.select({ n: count() }).from(partners).where(eq(partners.active, true));
  const [cov] = await db
    .select({ n: count() })
    .from(partnerCoverage)
    .where(eq(partnerCoverage.status, "active"));
  const [ctr] = await db
    .select({ n: count() })
    .from(partnerContracts)
    .where(eq(partnerContracts.status, "actif"));
  const [app] = await db
    .select({ n: count() })
    .from(partnerApplications)
    .where(inArray(partnerApplications.status, ["recue", "en_examen"]));
  const [opp] = await db
    .select({ n: count() })
    .from(partnerOpportunities)
    .where(eq(partnerOpportunities.status, "ouverte"));

  const partenaires = Number(p.n);
  const zonesCouvertes = Number(cov.n);

  if (partenaires === 0) {
    details.push("Aucun partenaire enregistré : le réseau est vide, la détection d'opportunités reste possible.");
  } else if (zonesCouvertes === 0) {
    details.push(
      "Des partenaires existent mais aucune zone n'est déclarée : ils ne peuvent pas être comptés dans la couverture locale.",
    );
  }
  if (Number(app.n) > 0) {
    details.push(`${Number(app.n)} candidature(s) en attente de décision humaine.`);
  }
  if (Number(opp.n) > 0) {
    details.push(`${Number(opp.n)} opportunité(s) ouverte(s) : zones où la demande dépasse l'offre.`);
  }

  // Le moteur n'est pas « en panne » parce que le réseau est jeune ; il est
  // dégradé quand des partenaires existent sans aucune zone exploitable.
  const health: PartnerEngineHealth["health"] =
    partenaires > 0 && zonesCouvertes === 0 ? "degraded" : "ok";

  return {
    health,
    partenaires,
    partenairesActifs: Number(pa.n),
    zonesCouvertes,
    contratsActifs: Number(ctr.n),
    candidaturesEnAttente: Number(app.n),
    opportunitesOuvertes: Number(opp.n),
    details,
  };
}

export function partnerServiceCatalog() {
  return PARTNER_SERVICES.map((s) => ({
    code: s.code,
    label: s.label,
    professions: s.professions,
  }));
}
