/**
 * Garde avant le catch-all SPA (server/index.ts) : refuse en 404 réel les
 * chemins qui ne sont jamais des routes client légitimes — fichiers sensibles,
 * sondes d'attaque connues — plutôt que de leur servir index.html (200) comme
 * à n'importe quelle route React.
 *
 * Constaté le 26/11/2026 (rapport de scan de sécurité externe transmis par le
 * Fondateur) : .env, .git/HEAD, wp-admin, phpmyadmin, etc. recevaient tous un
 * 200. express.static avait déjà écarté ces chemins (aucun fichier réel ne
 * porte ces noms), mais le catch-all qui suit servait quand même le shell SPA
 * — rendant impossible, vu de l'extérieur, de distinguer un vrai fichier
 * exposé d'un simple retour par défaut.
 *
 * `.well-known/` est exclu : convention standard (assetlinks.json,
 * apple-app-site-association…), déjà traitée au cas par cas plus haut dans
 * server/index.ts.
 */

const SENSITIVE_EXTENSIONS = [
  ".env",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".cgi",
  ".sql",
  ".bak",
  ".swp",
  ".ini",
  ".log",
  ".yml",
  ".yaml",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
];

const KNOWN_ATTACK_PATHS = new Set([
  "wp-admin",
  "wp-login.php",
  "wp-content",
  "wp-includes",
  "xmlrpc.php",
  "phpmyadmin",
  "pma",
  "vendor",
  "config.php",
  "database.sql",
  "server-status",
  "actuator",
]);

/** Décode un segment sans jamais faire planter l'appelant sur un %-encodage invalide. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function looksLikeProbePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/.well-known/")) return false;
  // Découpage sur les "/" bruts d'abord (un "%2f" encodé reste donc à l'intérieur de son
  // segment, jamais une nouvelle limite), puis décodage de chaque segment — trouvé par la revue
  // Devin sur #717 : une barre oblique finale (/backup.zip/) ou un point encodé (%2e) faisait
  // passer la vérification d'extension sur la chaîne entière plutôt que sur le dernier segment.
  const segments = lower.split("/").filter(Boolean).map(decodeSegment);
  if (segments.some((s) => s.startsWith("."))) return true;
  const lastSegment = segments[segments.length - 1] ?? "";
  if (SENSITIVE_EXTENSIONS.some((ext) => lastSegment.endsWith(ext))) return true;
  if (segments.some((s) => KNOWN_ATTACK_PATHS.has(s))) return true;
  return false;
}
