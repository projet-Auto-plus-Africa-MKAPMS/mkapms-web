/**
 * Enveloppe native (application Android MKA.P-MS).
 *
 * Le même code sert au site et à l'application : sur un navigateur, tout ici est
 * un non-opérant. Rien n'est supposé disponible — chaque appel natif est isolé
 * pour qu'une plateforme sans le module correspondant continue de fonctionner.
 */
import { Capacitor } from "@capacitor/core";

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

export const nativePlatform = (): string => Capacitor.getPlatform();

/**
 * Reconnaissance de l'application par sa signature d'agent utilisateur. Utile
 * avant même le chargement du pont natif (l'application ouvre la plateforme en
 * ligne : le code du site s'exécute d'abord).
 */
export const estApplicationMkapms = (): boolean =>
  typeof navigator !== "undefined" && navigator.userAgent.includes("MKAPMSApp");

/**
 * Retour matériel Android : remonter dans l'historique de la plateforme, et
 * quitter l'application seulement quand il n'y a plus rien derrière.
 */
async function brancherRetourMateriel(): Promise<void> {
  const { App } = await import("@capacitor/app");
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack || window.history.length > 1) {
      window.history.back();
    } else {
      void App.exitApp();
    }
  });
}

async function appliquerBarreEtat(): Promise<void> {
  const { StatusBar, Style } = await import("@capacitor/status-bar");
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: "#0B0B0F" });
}

async function masquerEcranLancement(): Promise<void> {
  const { SplashScreen } = await import("@capacitor/splash-screen");
  await SplashScreen.hide();
}

/**
 * À appeler une seule fois au démarrage. Les échecs sont silencieux côté
 * interface mais tracés en console : une intégration native absente ne doit
 * jamais empêcher la plateforme de s'afficher.
 */
export function initialiserAppNative(): void {
  if (!isNativeApp()) return;

  document.documentElement.classList.add("app-native");

  void brancherRetourMateriel().catch((e) => console.warn("[native] retour", e));
  void appliquerBarreEtat().catch((e) => console.warn("[native] barre", e));
  void masquerEcranLancement().catch((e) => console.warn("[native] splash", e));
}
