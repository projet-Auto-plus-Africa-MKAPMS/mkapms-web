import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Applications Android MKA.P-MS.
 *
 * Trois applications, un seul cœur : l'enveloppe native charge la plateforme
 * réellement déployée (le domaine détermine l'univers affiché, voir
 * client/src/lib/domain.tsx), donc l'app conserve un vrai domaine d'origine et
 * non un fichier local. Elles ne diffèrent que par leur identifiant, leur nom
 * et leur écran d'entrée — aucun second serveur, aucune donnée dupliquée.
 *
 * MOBILE_APP_VARIANT : grandpublic (défaut) | pro | command
 * MOBILE_APP_URL     : permet de viser une préproduction sans modifier le code.
 */
interface Variante {
  appId: string;
  appName: string;
  startPath: string;
  distribution: string;
  description: string;
}

const variantes: Record<string, Variante> = JSON.parse(
  // Chargé depuis le dossier du projet : la CLI Capacitor lit ce fichier en
  // CommonJS, import.meta n'y est pas disponible.
  readFileSync(join(process.cwd(), "mobile", "variants.json"), "utf8"),
);

const nomVariante = process.env.MOBILE_APP_VARIANT || "grandpublic";
const variante = variantes[nomVariante];

if (!variante) {
  throw new Error(
    `Variante d'application inconnue : « ${nomVariante} ». Variantes déclarées : ${Object.keys(variantes).join(", ")}.`,
  );
}

const baseUrl = (process.env.MOBILE_APP_URL || "https://www.mkapms.fr").replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: variante.appId,
  appName: variante.appName,
  // L'app charge la plateforme en ligne : seul un écran de repli « connexion
  // indisponible » est embarqué, pour ne pas alourdir le paquet de 600 Mo
  // d'images et de vidéos déjà servies par la plateforme.
  webDir: "mobile/www",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    // Signature lisible par la plateforme : elle permet de masquer ce qui n'a
    // aucun sens dans l'application (invitation à installer le site) et
    // d'identifier laquelle des trois applications est utilisée.
    appendUserAgent: `MKAPMSApp/1.6.0 (${nomVariante})`,
  },
  server: {
    url: `${baseUrl}${variante.startPath}`,
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "www.mkapms.fr",
      "mkapms.fr",
      "www.mkapms.pro",
      "mkapms.pro",
      "www.mkapms.site",
      "mkapms.site",
      "checkout.stripe.com",
      "*.stripe.com",
      "accounts.google.com",
    ],
  },
  plugins: {
    SplashScreen: {
      // L'écran de lancement se retire toujours de lui-même : l'application ne
      // doit jamais rester bloquée dessus si la plateforme répond lentement.
      launchAutoHide: true,
      launchShowDuration: 2500,
      backgroundColor: "#0B0B0F",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
