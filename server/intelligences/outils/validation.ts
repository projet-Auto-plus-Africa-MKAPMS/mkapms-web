/**
 * MKA.P-MS Intelligence — validation minimale des arguments d'un outil contre
 * son schema_input (registre.ts).
 *
 * Volontairement restreint : type "object" à un niveau, propriétés de type
 * string/number/boolean/array et enum, "required". Suffisant pour les outils
 * de test de ce lot. Un outil métier réel avec un schéma plus riche devra
 * remplacer ceci par une vraie bibliothèque de JSON Schema (ex. ajv) — pas
 * question d'improviser une validation plus large sans l'outiller correctement.
 */
export interface ResultatValidation {
  valide: boolean;
  erreurs: string[];
}

type JsonSchemaObjet = {
  type?: string;
  properties?: Record<string, { type?: string; enum?: unknown[]; items?: { type?: string } }>;
  required?: string[];
};

export function validerArguments(schema: Record<string, unknown>, valeurs: unknown): ResultatValidation {
  const erreurs: string[] = [];
  const s = schema as JsonSchemaObjet;

  if (valeurs === null || typeof valeurs !== "object" || Array.isArray(valeurs)) {
    return { valide: false, erreurs: ["Les arguments doivent être un objet JSON."] };
  }
  const obj = valeurs as Record<string, unknown>;

  for (const champ of s.required ?? []) {
    if (!(champ in obj)) erreurs.push(`Champ requis manquant : « ${champ} ».`);
  }

  for (const [cle, spec] of Object.entries(s.properties ?? {})) {
    if (!(cle in obj)) continue;
    const valeur = obj[cle];
    if (spec.type && !correspondAuType(valeur, spec.type)) {
      erreurs.push(`« ${cle} » doit être de type ${spec.type}, reçu ${typeof valeur}.`);
      continue;
    }
    if (spec.enum && !spec.enum.includes(valeur)) {
      erreurs.push(`« ${cle} » doit être l'une de : ${spec.enum.join(", ")} (reçu « ${String(valeur)} »).`);
    }
  }

  return { valide: erreurs.length === 0, erreurs };
}

function correspondAuType(valeur: unknown, type: string): boolean {
  switch (type) {
    case "string":
      return typeof valeur === "string";
    case "number":
      return typeof valeur === "number" && Number.isFinite(valeur);
    case "boolean":
      return typeof valeur === "boolean";
    case "array":
      return Array.isArray(valeur);
    case "object":
      return typeof valeur === "object" && valeur !== null && !Array.isArray(valeur);
    default:
      return true;
  }
}
