/**
 * MKA.P-MS Gouvernance — Settings Registry (règle permanente n°3 adoptée à la
 * clôture du LOT IA02B).
 *
 * Catalogue progressif des réglages de la plateforme, avec leur état
 * réellement constaté — jamais un état espéré. Un réglage listé ici comme
 * HARDCODED ou NOT_CONNECTED n'est pas une régression : c'est l'inventaire
 * honnête qui rend visible ce qui reste à centraliser, condition explicite du
 * PDG (« créer PROGRESSIVEMENT »). Chaque ligne renvoie, quand il existe, au
 * fichier qui porte réellement ce réglage aujourd'hui — jamais un second
 * système de configuration créé en parallèle.
 */

export const ETATS_REGLAGE = [
  "EXISTS",
  "HARDCODED",
  "CENTRALIZED",
  "PARTIAL",
  "NOT_CONNECTED",
  "CONNECTED_NOT_TESTED",
  "CONNECTED_AND_TESTED",
  "ACTIVE",
  "DISABLED",
] as const;
export type EtatReglage = (typeof ETATS_REGLAGE)[number];

export type CategorieReglage = "intelligence" | "execution" | "securite" | "plateforme";

export interface Reglage {
  cle: string;
  categorie: CategorieReglage;
  libelle: string;
  etat: EtatReglage;
  /** Fichier(s) qui portent réellement ce réglage aujourd'hui. */
  source: string;
  motif: string;
}

export const SETTINGS_REGISTRY: Reglage[] = [
  // ── Intelligence ──────────────────────────────────────────────────────
  { cle: "intelligence.modeles", categorie: "intelligence", libelle: "Modèles", etat: "HARDCODED", source: "server/intelligences/provider.ts (ENDPOINTS)", motif: "Modèle par défaut et point d'entrée codés par fournisseur ; découverte dynamique du modèle réel (modeleDisponible), mais le catalogue lui-même n'est pas en base." },
  { cle: "intelligence.providers", categorie: "intelligence", libelle: "Fournisseurs", etat: "CENTRALIZED", source: "server/ai-fabric/service.ts (PROVIDER_CATALOG)", motif: "Catalogue unique, wireStatus LOT IA02A." },
  { cle: "intelligence.routing", categorie: "intelligence", libelle: "Routage", etat: "CENTRALIZED", source: "server/intelligences/routeur.ts", motif: "Porte unique des capacités, imposée par scripts/check-providers.mjs." },
  { cle: "intelligence.prompts", categorie: "intelligence", libelle: "Prompts système", etat: "HARDCODED", source: "server/intelligences/regles.ts (CONSIGNE_DIRECTION/CONSIGNE_PUBLIC)", motif: "Constantes de code, non éditables sans déploiement." },
  { cle: "intelligence.capacites", categorie: "intelligence", libelle: "Capacités", etat: "CENTRALIZED", source: "server/intelligences/capacites.ts", motif: "" },
  { cle: "intelligence.outils", categorie: "intelligence", libelle: "Outils (Tool Registry)", etat: "CENTRALIZED", source: "server/intelligences/outils/registre.ts", motif: "" },
  { cle: "intelligence.agents", categorie: "intelligence", libelle: "Agents", etat: "NOT_CONNECTED", source: "client/.../modules/Agents.tsx", motif: "Aucun moteur d'agents autonomes réel — module placeholder." },
  { cle: "intelligence.memoire", categorie: "intelligence", libelle: "Mémoire", etat: "CENTRALIZED", source: "server/intelligences/memoire.ts", motif: "" },
  { cle: "intelligence.contexte", categorie: "intelligence", libelle: "Contexte", etat: "CENTRALIZED", source: "server/intelligences/contexte/service.ts", motif: "Context Engine, LOT IA01 — branché à la conversation en LOT IA02B." },
  { cle: "intelligence.rag", categorie: "intelligence", libelle: "RAG", etat: "NOT_CONNECTED", source: "—", motif: "Aucun pipeline de récupération documentaire n'existe dans ce dépôt." },
  { cle: "intelligence.recherche", categorie: "intelligence", libelle: "Recherche", etat: "PARTIAL", source: "server/search-os, client/.../modules/Recherche.tsx", motif: "Search OS existe pour d'autres usages ; le module conversationnel reste un placeholder." },
  { cle: "intelligence.embeddings", categorie: "intelligence", libelle: "Embeddings", etat: "NOT_CONNECTED", source: "—", motif: "Aucun moteur d'embeddings dans ce dépôt à ce jour." },
  { cle: "intelligence.fichiers", categorie: "intelligence", libelle: "Fichiers", etat: "NOT_CONNECTED", source: "client/.../modules/FichiersDocuments.tsx", motif: "Module placeholder — aucune lecture de fichier réelle côté conversation." },
  { cle: "intelligence.vision", categorie: "intelligence", libelle: "Vision", etat: "PARTIAL", source: "server/ai-fabric (ia_vision), capacites.ts (documents)", motif: "Capacité Fabrique existe ; jamais câblée à un module conversationnel réel." },
  { cle: "intelligence.image", categorie: "intelligence", libelle: "Génération d'image", etat: "NOT_CONNECTED", source: "client/.../modules/Images.tsx", motif: "Capacité « image » REGISTERED, non implémentée." },
  { cle: "intelligence.code", categorie: "intelligence", libelle: "Code", etat: "PARTIAL", source: "server/intelligences/chantier/", motif: "Chantier de développement réel pour un petit projet ; pas un assistant de code généraliste sur le dépôt lui-même." },
  { cle: "intelligence.sandbox", categorie: "intelligence", libelle: "Sandbox d'exécution", etat: "CENTRALIZED", source: "server/intelligences/chantier/shell.ts", motif: "Shell borné (allowlist npm/npx/node, ulimit)." },
  { cle: "intelligence.voix", categorie: "intelligence", libelle: "Voix", etat: "NOT_CONNECTED", source: "client/.../modules/VoixTempsReel.tsx", motif: "" },
  { cle: "intelligence.realtime", categorie: "intelligence", libelle: "Temps réel", etat: "NOT_CONNECTED", source: "—", motif: "" },
  { cle: "intelligence.transcription", categorie: "intelligence", libelle: "Transcription", etat: "NOT_CONNECTED", source: "—", motif: "" },
  { cle: "intelligence.tts", categorie: "intelligence", libelle: "Synthèse vocale (TTS)", etat: "NOT_CONNECTED", source: "—", motif: "" },
  { cle: "intelligence.mcp", categorie: "intelligence", libelle: "MCP", etat: "NOT_CONNECTED", source: "—", motif: "Aucun serveur/client MCP exposé par la plateforme." },
  { cle: "intelligence.automations", categorie: "intelligence", libelle: "Automatisations", etat: "NOT_CONNECTED", source: "client/.../modules/Automatisations.tsx", motif: "" },
  { cle: "intelligence.background_tasks", categorie: "intelligence", libelle: "Tâches de fond", etat: "PARTIAL", source: "server/intelligences/orchestrateur.ts", motif: "Missions orchestrées existent ; pas de file de tâches générique." },

  // ── Exécution ─────────────────────────────────────────────────────────
  { cle: "execution.timeout", categorie: "execution", libelle: "Timeout d'appel", etat: "CONNECTED_AND_TESTED", source: "server/intelligences/provider.ts (AbortSignal.timeout)", motif: "90s fixe, non configurable par capacité." },
  { cle: "execution.retry", categorie: "execution", libelle: "Retry", etat: "PARTIAL", source: "server/intelligences/provider.ts (replier)", motif: "Le repli change de fournisseur plutôt que de réessayer le même — pas un retry classique." },
  { cle: "execution.fallback", categorie: "execution", libelle: "Fallback fournisseur", etat: "CONNECTED_AND_TESTED", source: "server/intelligences/provider.ts (replier)", motif: "Testé (server/intelligences/__tests__/fuite-fournisseurs.test.ts, scénarios 8-9)." },
  { cle: "execution.circuit_breaker", categorie: "execution", libelle: "Circuit breaker", etat: "NOT_CONNECTED", source: "—", motif: "Chaque appel retente le fournisseur, aucun disjoncteur temporaire après une série d'échecs." },
  { cle: "execution.quotas", categorie: "execution", libelle: "Quotas", etat: "CENTRALIZED", source: "server/intelligences/regles.ts (PLAFOND_JOUR)", motif: "" },
  { cle: "execution.rate_limits", categorie: "execution", libelle: "Rate limits", etat: "PARTIAL", source: "server/intelligences/regles.ts (PLAFOND_JOUR)", motif: "Plafond journalier seulement, aucune limite par minute/seconde." },
  { cle: "execution.context_windows", categorie: "execution", libelle: "Fenêtre de contexte", etat: "HARDCODED", source: "server/intelligences/service.ts (limit 8 messages)", motif: "Nombre de messages d'historique repris codé en dur, pas de gestion de fenêtre/résumé." },
  { cle: "execution.max_output", categorie: "execution", libelle: "Sortie maximale", etat: "HARDCODED", source: "server/intelligences/service.ts (maxTokens littéraux)", motif: "" },
  { cle: "execution.cache", categorie: "execution", libelle: "Cache de réponse", etat: "NOT_CONNECTED", source: "server/intelligences/provider.ts (cacheModele, modèle seulement)", motif: "Seul le nom du modèle découvert est mis en cache ; aucune réponse n'est mise en cache." },
  { cle: "execution.concurrence", categorie: "execution", libelle: "Concurrence", etat: "NOT_CONNECTED", source: "—", motif: "" },
  { cle: "execution.files_attente", categorie: "execution", libelle: "Files d'attente", etat: "NOT_CONNECTED", source: "—", motif: "" },

  // ── Sécurité ──────────────────────────────────────────────────────────
  { cle: "securite.roles", categorie: "securite", libelle: "Rôles", etat: "CENTRALIZED", source: "server/intelligences/permissions.ts (ROLES)", motif: "" },
  { cle: "securite.permissions", categorie: "securite", libelle: "Permissions techniques", etat: "CENTRALIZED", source: "server/intelligences/permissions.ts", motif: "" },
  { cle: "securite.validation_humaine", categorie: "securite", libelle: "Validation humaine", etat: "CENTRALIZED", source: "server/resilience/service.ts (requestCriticalConfirmation)", motif: "" },
  { cle: "securite.niveaux_risque", categorie: "securite", libelle: "Niveaux de risque", etat: "CENTRALIZED", source: "server/intelligences/outils/registre.ts (riskLevel)", motif: "" },
  { cle: "securite.secrets", categorie: "securite", libelle: "Secrets", etat: "CENTRALIZED", source: "server/env.ts", motif: "Jamais dans le code — imposé par scripts/check-providers.mjs." },
  { cle: "securite.retention", categorie: "securite", libelle: "Rétention des données", etat: "NOT_CONNECTED", source: "—", motif: "Aucune politique de rétention centralisée par catégorie de donnée." },
  { cle: "securite.audit", categorie: "securite", libelle: "Audit", etat: "CENTRALIZED", source: "server/audit-os/, server/intelligences/outils/audit.ts", motif: "Deux journaux distincts et légitimes (actions générales / outils Intelligence), non fusionnés." },
  { cle: "securite.logs", categorie: "securite", libelle: "Logs", etat: "PARTIAL", source: "console + audit_logs", motif: "Pas de niveau de log configurable centralement." },
  { cle: "securite.traces", categorie: "securite", libelle: "Traces (trace_id)", etat: "PARTIAL", source: "server/intelligences/schema.ts (traceId, LOT IA02B)", motif: "Introduit sur in_messages/in_outils_journal seulement, pas encore sur tous les appels plateforme." },
  { cle: "securite.pays", categorie: "securite", libelle: "Pays", etat: "CENTRALIZED", source: "server/country-os/", motif: "" },
  { cle: "securite.restrictions", categorie: "securite", libelle: "Restrictions pays", etat: "CENTRALIZED", source: "server/country-policy/", motif: "" },

  // ── Plateforme ────────────────────────────────────────────────────────
  { cle: "plateforme.applications", categorie: "plateforme", libelle: "Applications", etat: "CENTRALIZED", source: "mobile/variants.json", motif: "Relié au registre de versions en LOT IA02B (server/governance/versions.ts)." },
  { cle: "plateforme.feature_flags", categorie: "plateforme", libelle: "Feature flags", etat: "NOT_CONNECTED", source: "—", motif: "Aucun système de feature flag générique ; les interrupteurs existants (domaines Intelligence, capacités) sont spécifiques à leur moteur." },
  { cle: "plateforme.moteurs", categorie: "plateforme", libelle: "Moteurs", etat: "CENTRALIZED", source: "server/engine-registry/", motif: "" },
  { cle: "plateforme.notifications", categorie: "plateforme", libelle: "Notifications", etat: "CENTRALIZED", source: "server/messaging-os/", motif: "" },
  { cle: "plateforme.paiements", categorie: "plateforme", libelle: "Paiements", etat: "CENTRALIZED", source: "server/payment-orchestrator/", motif: "" },
  { cle: "plateforme.documents", categorie: "plateforme", libelle: "Documents", etat: "CENTRALIZED", source: "server/document-os/", motif: "" },
  { cle: "plateforme.deploiements", categorie: "plateforme", libelle: "Déploiements", etat: "PARTIAL", source: "server/command-center/, server/resilience/", motif: "Pipeline de dossier de développement réel ; pas de CD automatisé vers Railway." },
  { cle: "plateforme.domaines", categorie: "plateforme", libelle: "Domaines", etat: "CENTRALIZED", source: "server/country-os/domain.ts", motif: "" },
  { cle: "plateforme.versions", categorie: "plateforme", libelle: "Versions", etat: "CENTRALIZED", source: "server/governance/versions.ts (LOT IA02B)", motif: "Nouvellement centralisé — une seule version de dépôt sert les cinq applications aujourd'hui." },
  { cle: "plateforme.compatibilite", categorie: "plateforme", libelle: "Compatibilité", etat: "PARTIAL", source: "server/governance/schema.ts (compatibilityStatus)", motif: "Champ enregistré à chaque release ; calcul automatique de compatibilité non construit." },
];

export function parCategorie(categorie: CategorieReglage): Reglage[] {
  return SETTINGS_REGISTRY.filter((r) => r.categorie === categorie);
}

export function resume(): { total: number; parEtat: Record<EtatReglage, number> } {
  const parEtat = ETATS_REGLAGE.reduce(
    (acc, e) => ({ ...acc, [e]: SETTINGS_REGISTRY.filter((r) => r.etat === e).length }),
    {} as Record<EtatReglage, number>,
  );
  return { total: SETTINGS_REGISTRY.length, parEtat };
}
