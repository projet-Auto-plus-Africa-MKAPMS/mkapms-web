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

export function looksLikeProbePath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/.well-known/")) return false;
  const segments = lower.split("/").filter(Boolean);
  if (segments.some((s) => s.startsWith("."))) return true;
  if (SENSITIVE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return true;
  if (segments.some((s) => KNOWN_ATTACK_PATHS.has(s))) return true;
  return false;
}
