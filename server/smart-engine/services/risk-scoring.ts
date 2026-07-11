/**
 * Feature 7 (renfort) — Score de risque anti-fraude
 *
 * Complément 100% MKA.P-MS au service `fraud-detection.ts` existant.
 * Additif : n'enlève rien, ne remplace rien. Fournit des utilitaires purs
 * (normalisation + scoring) que le service existant peut consommer.
 *
 * PROBLÈME couvert :
 * Les comparaisons brutes email / téléphone / IP identiques sont trop
 * faciles à contourner (points dans un gmail, +alias, VPN…).
 *
 * SOLUTION 100% interne :
 *  - Normalisation email (gmail : ignore les points et +alias)
 *  - Normalisation téléphone (E.164 basique : ne garde que les chiffres,
 *    ajoute un + si international)
 *  - Empreinte device stable (userAgent + langue + timezone) → hash court
 *  - Score de risque agrégé 0-100 (jamais bloquant, seulement informatif)
 *
 * Aucune API externe, aucune dépendance ajoutée.
 */
import crypto from "node:crypto";

/**
 * Normalise un email pour comparaison de duplication.
 * Traitement gmail-compatible (points ignorés dans la partie locale,
 * suffixe `+xxx` ignoré). Les autres domaines gardent leur partie locale
 * telle quelle (uniquement lowercase + trim).
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  const at = clean.indexOf("@");
  if (at <= 0) return null;
  let local = clean.slice(0, at);
  const domain = clean.slice(at + 1);
  // Coupe +alias
  const plus = local.indexOf("+");
  if (plus >= 0) local = local.slice(0, plus);
  // Gmail : les points sont ignorés
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain === "googlemail.com" ? "gmail.com" : domain}`;
}

/**
 * Normalise un téléphone au format E.164 approximatif.
 * Ne garde que les chiffres, préfixe `+` si le premier chiffre suggère un
 * indicatif international (longueur ≥ 10). Retourne null si trop court.
 */
/** Indicatifs internationaux fréquents (à étendre au besoin). */
const COUNTRY_CODES = ["1", "33", "44", "49", "212", "213", "216", "225", "237"];

export function normalizePhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D+/g, "");
  if (digits.length < 8) return null;
  // Cas français national : 06/07... → 33 6/7...
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+33${digits.slice(1)}`;
  }
  // Cas courant "code pays + 0 national" : ex 33 06 12 34 56 78 → 33 6 12 34 56 78
  for (const cc of COUNTRY_CODES) {
    if (digits.startsWith(cc + "0") && digits.length > cc.length + 8) {
      digits = cc + digits.slice(cc.length + 1);
      break;
    }
  }
  return `+${digits}`;
}

/**
 * Empreinte device stable — hash court basé sur les signaux disponibles
 * côté serveur (userAgent, langue, timezone). Insensible aux versions
 * mineures du navigateur (on ne garde que le nom principal).
 */
export function computeDeviceFingerprint(input: {
  userAgent?: string | null;
  language?: string | null;
  timezone?: string | null;
}): string {
  const ua = (input.userAgent ?? "").toLowerCase();
  // Extrait le navigateur principal (chrome/firefox/safari/edge/opera) sans version.
  const browser = /(chrome|firefox|safari|edge|opera)/.exec(ua)?.[1] ?? "unknown";
  const os = /(windows|mac os|android|ios|linux)/.exec(ua)?.[1] ?? "unknown";
  const raw = [browser, os, input.language ?? "", input.timezone ?? ""].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

/**
 * Score de risque agrégé 0-100 à partir de signaux comparables au sein
 * d'une population d'utilisateurs. Le service `fraud-detection.ts` peut
 * l'appeler pour graduer sa `severity` (>=70 → critical, >=50 → important,
 * >=30 → warning, <30 → info).
 *
 * Chaque signal est booléen : présent = ajoute son poids au score.
 */
export interface RiskSignals {
  duplicateNormalizedEmail?: boolean; // même email normalisé qu'un autre compte
  duplicateNormalizedPhone?: boolean; // même téléphone E.164 qu'un autre compte
  duplicateDeviceFingerprint?: boolean; // même empreinte device qu'un autre compte récent
  sharedIp?: boolean; // même IP qu'un autre compte
  disposableEmailDomain?: boolean; // domaine email jetable (mailinator, tempmail…)
  freshAccount?: boolean; // compte créé il y a < 24h
  abnormalActivity?: boolean; // activité inhabituelle (rafales, horaires)
}

const RISK_WEIGHTS: Record<keyof RiskSignals, number> = {
  duplicateNormalizedEmail: 45,
  duplicateNormalizedPhone: 45,
  duplicateDeviceFingerprint: 25,
  sharedIp: 15,
  disposableEmailDomain: 20,
  freshAccount: 5,
  abnormalActivity: 20,
};

export function computeRiskScore(signals: RiskSignals): {
  score: number;
  severity: "info" | "warning" | "important" | "critical";
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];
  for (const key of Object.keys(RISK_WEIGHTS) as (keyof RiskSignals)[]) {
    if (signals[key]) {
      score += RISK_WEIGHTS[key];
      reasons.push(key);
    }
  }
  score = Math.min(100, score);
  const severity =
    score >= 70 ? "critical" : score >= 50 ? "important" : score >= 30 ? "warning" : "info";
  return { score, severity, reasons };
}

/** Liste (extensible) de domaines email jetables les plus fréquents. */
export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "throwaway.email",
]);

export function isDisposableEmail(email?: string | null): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  return DISPOSABLE_EMAIL_DOMAINS.has(email.slice(at + 1).toLowerCase());
}
