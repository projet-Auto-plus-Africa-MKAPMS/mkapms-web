/**
 * Documents et exports réellement produits.
 *
 * Partout dans la plateforme, les boutons « PDF », « Export Excel » et
 * « Télécharger » affichaient une notification verte sans jamais produire de
 * fichier ni de feuille imprimable. Une confirmation sans document est pire
 * qu'un bouton absent : le client croit détenir sa facture.
 *
 * Deux sorties réelles, sans dépendance externe :
 *  - `telechargerCSV` : un fichier réellement enregistré sur l'appareil, qui
 *    s'ouvre dans Excel, LibreOffice ou Numbers ;
 *  - `imprimerFeuille` : une feuille A4 mise en page, envoyée à l'impression,
 *    que le navigateur permet d'enregistrer en PDF.
 */

import { getToken } from "./auth";

export interface ColonneExport {
  cle: string;
  titre: string;
  /** Aligne à droite les colonnes de montants. */
  numerique?: boolean;
}

export type LigneExport = Record<string, string | number | null | undefined>;

/** Types acceptés par le registre Document OS (`DOC_EDITION_TYPES`). */
export type TypeDocument =
  | "facture" | "devis" | "contrat" | "avoir" | "recu" | "bordereau_enchere"
  | "rapport_historique" | "carnet_entretien" | "reservation" | "rapport_comptable"
  | "rapport_tva" | "releve_bancaire" | "rapport_analytique" | "rapport_publicitaire"
  | "attestation" | "export_donnees";

/**
 * Déclare l'édition au Document OS : le registre des documents ne voyait
 * jamais passer ce que les écrans remettaient réellement au client. La trace
 * est best-effort — elle ne retarde ni ne bloque la remise du document.
 */
export function tracerEdition(entree: {
  typeCode: TypeDocument;
  canal: "impression" | "fichier";
  titre: string;
  referenceEcran?: string;
  lignes?: number;
}): void {
  try {
    const token = getToken();
    void fetch("/api/trpc/documentOs.editions.record", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        json: {
          typeCode: entree.typeCode,
          canal: entree.canal,
          ecran: window.location.pathname.slice(0, 160),
          titre: entree.titre.slice(0, 160),
          referenceEcran: entree.referenceEcran?.slice(0, 64),
          lignes: entree.lignes,
        },
      }),
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}

function horodatage(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function assainirNom(nom: string): string {
  return (
    nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "document"
  );
}

function valeur(ligne: LigneExport, cle: string): string {
  const v = ligne[cle];
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Échappement CSV : un montant « 1 200,50 € » ne doit pas casser les colonnes. */
function champCSV(valeurBrute: string): string {
  const propre = valeurBrute.replace(/\r?\n/g, " ");
  return `"${propre.replace(/"/g, '""')}"`;
}

/**
 * Enregistre réellement un fichier sur l'appareil. Le séparateur point-virgule
 * et le BOM sont nécessaires pour qu'Excel ouvre correctement les accents et
 * les colonnes dans les réglages français.
 */
export function telechargerCSV(
  nomFichier: string,
  colonnes: ColonneExport[],
  lignes: LigneExport[],
  typeDocument: TypeDocument = "export_donnees",
): { ok: boolean; nom: string; lignes: number } {
  const entete = colonnes.map((c) => champCSV(c.titre)).join(";");
  const corps = lignes.map((l) => colonnes.map((c) => champCSV(valeur(l, c.cle))).join(";"));
  const contenu = `\uFEFF${[entete, ...corps].join("\r\n")}\r\n`;
  const nom = `${assainirNom(nomFichier)}-${horodatage()}.csv`;

  try {
    const blob = new Blob([contenu], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nom;
    lien.style.display = "none";
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    tracerEdition({
      typeCode: typeDocument,
      canal: "fichier",
      titre: nomFichier,
      referenceEcran: nom,
      lignes: lignes.length,
    });
    return { ok: true, nom, lignes: lignes.length };
  } catch {
    return { ok: false, nom, lignes: lignes.length };
  }
}

function echapperHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface FeuilleImprimable {
  titre: string;
  sousTitre?: string;
  reference?: string;
  /** Paires libellé/valeur affichées en tête de document (client, période…). */
  informations?: { libelle: string; valeur: string }[];
  colonnes?: ColonneExport[];
  lignes?: LigneExport[];
  /** Lignes de total mises en évidence sous le tableau. */
  totaux?: { libelle: string; valeur: string }[];
  /** Mentions de bas de page (légales, conditions, avertissement). */
  mentions?: string[];
  /** Type enregistré au Document OS (défaut : export de données). */
  typeDocument?: TypeDocument;
}

function corpsHtml(feuille: FeuilleImprimable): string {
  const infos = (feuille.informations ?? [])
    .map(
      (i) =>
        `<div class="info"><span>${echapperHtml(i.libelle)}</span><b>${echapperHtml(i.valeur)}</b></div>`,
    )
    .join("");

  const colonnes = feuille.colonnes ?? [];
  const lignes = feuille.lignes ?? [];
  const tableau =
    colonnes.length > 0
      ? `<table>
        <thead><tr>${colonnes
          .map((c) => `<th class="${c.numerique ? "num" : ""}">${echapperHtml(c.titre)}</th>`)
          .join("")}</tr></thead>
        <tbody>${
          lignes.length > 0
            ? lignes
                .map(
                  (l) =>
                    `<tr>${colonnes
                      .map(
                        (c) =>
                          `<td class="${c.numerique ? "num" : ""}">${echapperHtml(valeur(l, c.cle))}</td>`,
                      )
                      .join("")}</tr>`,
                )
                .join("")
            : `<tr><td colspan="${colonnes.length}" class="vide">Aucune ligne à ce jour.</td></tr>`
        }</tbody>
      </table>`
      : "";

  const totaux = (feuille.totaux ?? [])
    .map(
      (t) =>
        `<div class="total"><span>${echapperHtml(t.libelle)}</span><b>${echapperHtml(t.valeur)}</b></div>`,
    )
    .join("");

  const mentions = (feuille.mentions ?? [])
    .map((m) => `<p class="mention">${echapperHtml(m)}</p>`)
    .join("");

  return `
    <header>
      <div class="marque">
        <div class="nom">MKA.P-MS</div>
        <div class="baseline">Auto Plus Africa</div>
      </div>
      <div class="entete">
        <h1>${echapperHtml(feuille.titre)}</h1>
        ${feuille.sousTitre ? `<p>${echapperHtml(feuille.sousTitre)}</p>` : ""}
        ${feuille.reference ? `<p class="ref">Réf. ${echapperHtml(feuille.reference)}</p>` : ""}
        <p class="ref">Édité le ${new Date().toLocaleString("fr-FR")}</p>
      </div>
    </header>
    ${infos ? `<section class="infos">${infos}</section>` : ""}
    ${tableau}
    ${totaux ? `<section class="totaux">${totaux}</section>` : ""}
    ${mentions}
  `;
}

const STYLE_FEUILLE = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #D4AF37; padding-bottom: 12px; }
  .marque .nom { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
  .marque .baseline { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .entete { text-align: right; }
  .entete h1 { font-size: 17px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px; }
  .entete p { margin: 0; font-size: 11px; color: #4b5563; }
  .entete .ref { color: #6b7280; }
  .infos { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 16px 0; }
  .info { font-size: 11px; }
  .info span { color: #6b7280; display: block; text-transform: uppercase; letter-spacing: 1px; font-size: 9px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
  th { background: #111; color: #D4AF37; text-align: left; padding: 7px 8px; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
  td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; }
  .num { text-align: right; }
  .vide { text-align: center; color: #6b7280; font-style: italic; padding: 18px; }
  .totaux { margin-top: 14px; margin-left: auto; width: 280px; }
  .total { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  .total:last-child { border-bottom: none; border-top: 2px solid #111; font-size: 14px; font-weight: 800; }
  .mention { margin-top: 14px; font-size: 9px; color: #6b7280; line-height: 1.5; }
  @page { size: A4; margin: 12mm; }
`;

/**
 * Ouvre la feuille dans une fenêtre d'impression réelle : l'utilisateur imprime
 * ou enregistre en PDF depuis son navigateur.
 *
 * Retourne `false` quand la fenêtre est bloquée par le navigateur — l'appelant
 * doit alors le dire, au lieu d'annoncer un téléchargement inexistant.
 */
export function imprimerFeuille(feuille: FeuilleImprimable): boolean {
  const fenetre = window.open("", "_blank", "width=880,height=1000");
  if (!fenetre) return false;

  fenetre.document.write(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echapperHtml(
      feuille.titre,
    )}</title><style>${STYLE_FEUILLE}</style></head><body>${corpsHtml(feuille)}</body></html>`,
  );
  fenetre.document.close();
  fenetre.focus();
  // L'impression est demandée après le rendu : imprimer un document vide
  // donnerait une page blanche au client.
  setTimeout(() => {
    try {
      fenetre.print();
    } catch {
      // La fenêtre reste ouverte : l'utilisateur imprime lui-même.
    }
  }, 300);
  tracerEdition({
    typeCode: feuille.typeDocument ?? "export_donnees",
    canal: "impression",
    titre: feuille.titre,
    referenceEcran: feuille.reference,
    lignes: feuille.lignes?.length,
  });
  return true;
}
