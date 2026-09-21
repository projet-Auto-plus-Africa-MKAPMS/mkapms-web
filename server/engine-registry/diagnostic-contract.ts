/** Contrat commun des diagnostics remis à MKA PMS IA par les moteurs. */
export type GraviteDiagnostic = "info" | "warning" | "important" | "critical";

export interface DiagnosticMoteur {
  moteur: string;
  composant: string;
  univers: string | null;
  typeErreur: string;
  contexte: string;
  route: string | null;
  redirection: string | null;
  permission: string | null;
  evenement: string | null;
  dependance: string | null;
  elementsTechniques: string[];
  gravite: GraviteDiagnostic;
  actionPossible: string;
  testsRequis: string[];
  traceId: string | null;
}
