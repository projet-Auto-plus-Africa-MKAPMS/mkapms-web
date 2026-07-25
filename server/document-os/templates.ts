/**
 * Document OS — Templates HTML par défaut (FR).
 *
 * Charte de marque : chaque document intègre OBLIGATOIREMENT le logo
 * officiel MKA.P-MS "fermé" (Version 1 – Terre / Unité), positionné
 * en haut à gauche. Le logo est exposé via la variable {{logo_url}}
 * (par défaut `/logo-closed.png`).
 *
 * Ces templates sont insérés/mis à jour de façon idempotente au
 * démarrage du serveur (fonction `ensureDefaultTemplates`).
 */
import { upsertTemplate } from "./index.js";

// Variables communes attendues par tous les templates :
export const COMMON_VARS = [
  "logo_url",         // URL absolue ou chemin du logo fermé (fallback /logo-closed.png)
  "brand_name",       // "MKA.P-MS"
  "brand_tagline",    // "Auto Plus Africa"
  "doc_ref",          // numéro du document (ex FAC-2026-000123)
  "doc_date",
  "doc_language",
  "issuer_name",
  "issuer_address",
  "issuer_siret",
  "issuer_vat",
  "client_name",
  "client_address",
  "client_email",
  "client_phone",
  "lines_html",       // HTML des lignes (rendu par le service)
  "total_ht",
  "total_tva",
  "total_ttc",
  "currency",
  "legal_mentions",
  "signature_block",
];

// Wrapper HTML commun (papier A4, wordmark + filigrane logo M — charte 2026)
function wrap(inner: string, docLabel: string): string {
  return `<!doctype html>
<html lang="{{doc_language}}">
<head>
  <meta charset="utf-8" />
  <title>${docLabel} {{doc_ref}} — {{brand_name}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;700;800;900&display=swap" />
  <style>
    :root { --gold:#FFD700; --gold-dark:#B78D00; --blue:#0086FF; --blue-light:#7FD3FF; --ink:#0B0B0F; --muted:#6B7280; --paper:#F5F3EF; --line:#E5E7EB; }
    * { box-sizing: border-box; }
    body { font-family: 'Raleway','Helvetica Neue',Arial,sans-serif; color: var(--ink); background:#fff; margin:0; padding:24px; }
    .page { max-width: 780px; margin: 0 auto; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; position:relative; }
    /* Filigrane MKA.P-MS — logo M centré derrière le contenu (charte : documents) */
    .watermark {
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      opacity:0.06; pointer-events:none; z-index:0;
    }
    .watermark img { width:70%; max-width:520px; height:auto; }
    .goldbar { height:6px; background: linear-gradient(90deg,var(--gold),var(--gold-dark),var(--gold)); }
    .inner { padding: 28px 32px; position:relative; z-index:1; }
    header.doc { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:24px; }
    .brand { display:flex; flex-direction:column; align-items:flex-start; gap:6px; }
    /* Wordmark SVG dans le header (M K A . P - M S — charte officielle) */
    .brand svg.wm { height:34px; width:auto; }
    .brand .tagline { font-size:8.5px; font-weight:700; letter-spacing:2.4px; color:var(--gold-dark); text-transform:uppercase; margin-top:2px; }
    .brand .issuer { font-size:9px; color:var(--muted); line-height:1.5; margin-top:6px; }
    .doc-badge { display:inline-block; padding:5px 12px; border-radius:8px; font-weight:900; font-size:11px; background:linear-gradient(180deg,#FEF3C7,#FCD34D); color:#78350F; text-transform:uppercase; letter-spacing:.08em; }
    .doc-ref { margin-top:6px; font-weight:800; font-size:12px; color:var(--ink); }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin: 12px 0 20px; }
    .card { background:var(--paper); border-radius:10px; padding:12px 14px; }
    .card h4 { margin:0 0 6px; font-size:9px; color:var(--gold-dark); text-transform:uppercase; letter-spacing:.16em; font-weight:800; }
    .card p { margin:0; font-size:12px; }
    table.lines { width:100%; border-collapse: collapse; margin: 12px 0 16px; font-size:12px; }
    table.lines thead th { background: var(--ink); color: var(--gold); text-align:left; padding:8px 10px; font-size:10px; letter-spacing:.06em; text-transform:uppercase; }
    table.lines tbody td { padding:8px 10px; border-top:1px solid var(--line); }
    table.lines tbody tr:nth-child(even) td { background:#FAFAF8; }
    .totals { margin-left:auto; width: 260px; font-size:12px; }
    .totals .row { display:flex; justify-content:space-between; padding:4px 0; }
    .totals .row.grand { border-top: 2px solid var(--gold); padding-top:8px; margin-top:4px; font-weight:900; font-size:14px; }
    .totals .row.grand .val { color: var(--gold-dark); }
    .legal { margin-top:18px; padding-top:12px; border-top:1px solid var(--line); font-size:9px; color: var(--muted); line-height:1.5; }
    .sign { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:24px; }
    .sign .box { border:1px dashed #D1D5DB; border-radius:10px; padding:14px; min-height:80px; }
    .sign .box img.emit { height:36px; opacity:.9; }
    .sign small { color: var(--muted); font-size:10px; }
    footer.page-foot { padding: 8px 32px 16px; font-size:9px; color:#9CA3AF; display:flex; justify-content:space-between; position:relative; z-index:1; }
  </style>
</head>
<body>
  <div class="page">
    <div class="goldbar"></div>
    <div class="watermark"><img src="{{logo_url}}" alt="" /></div>
    <div class="inner">
      <header class="doc">
        <div class="brand">
          <!-- Wordmark officiel MKA.P-MS (charte 2026 : M K A . en OR, P en BLEU + queue,
               - en OR, M en OR, S en BLEU + flèche) -->
          <svg class="wm" viewBox="0 0 560 70" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{{brand_name}}">
            <defs>
              <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset="0.45" stop-color="#FFD700"/><stop offset="1" stop-color="#B78D00"/></linearGradient>
              <linearGradient id="db" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FD3FF"/><stop offset="0.5" stop-color="#0086FF"/><stop offset="1" stop-color="#0058B0"/></linearGradient>
            </defs>
            <g style="font-family:Raleway,sans-serif;font-weight:900;">
              <text x="0" y="52" fill="url(#dg)" font-size="58" letter-spacing="1">M</text>
              <text x="68" y="52" fill="url(#dg)" font-size="58" letter-spacing="1">K</text>
              <text x="136" y="52" fill="url(#dg)" font-size="58" letter-spacing="1">A</text>
              <circle cx="197" cy="47" r="5" fill="url(#dg)"/>
              <text x="216" y="52" fill="url(#db)" font-size="58" letter-spacing="1">P</text>
              <path d="M 228 55 Q 238 66 256 66" stroke="url(#db)" stroke-width="4" stroke-linecap="round" fill="none"/>
              <rect x="288" y="41" width="28" height="9" rx="3" fill="url(#dg)"/>
              <text x="322" y="52" fill="url(#dg)" font-size="58" letter-spacing="1">M</text>
              <text x="390" y="52" fill="url(#db)" font-size="58" letter-spacing="1">S</text>
              <path d="M 432 20 L 452 8 M 452 8 L 442 8 M 452 8 L 452 18" stroke="url(#db)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </g>
          </svg>
          <div class="tagline">PROTÉGER · RELIER · SERVIR LE MONDE ENTIER</div>
          <div class="issuer">{{issuer_name}}<br/>{{issuer_address}}<br/>SIRET : {{issuer_siret}} · TVA : {{issuer_vat}}</div>
        </div>
        <div style="text-align:right;">
          <span class="doc-badge">${docLabel}</span>
          <div class="doc-ref">{{doc_ref}}</div>
          <div style="font-size:10px; color:var(--muted); margin-top:4px;">Date : {{doc_date}}</div>
        </div>
      </header>
      ${inner}
    </div>
    <div class="goldbar" style="height:4px"></div>
    <footer class="page-foot">
      <span>Document généré par {{brand_name}} — {{brand_tagline}}</span>
      <span>Page 1/1</span>
    </footer>
  </div>
</body>
</html>`;
}

const BODY_INVOICE = `
      <div class="grid-2">
        <div class="card">
          <h4>Facturer à</h4>
          <p><strong>{{client_name}}</strong></p>
          <p style="color:var(--muted); font-size:11px;">{{client_address}}</p>
          <p style="color:var(--muted); font-size:11px;">{{client_email}} · {{client_phone}}</p>
        </div>
        <div class="card">
          <h4>Émetteur</h4>
          <p><strong>{{issuer_name}}</strong></p>
          <p style="color:var(--muted); font-size:11px;">{{issuer_address}}</p>
        </div>
      </div>

      <table class="lines">
        <thead>
          <tr><th>Désignation</th><th style="text-align:center;">Qté</th><th style="text-align:right;">P.U. HT</th><th style="text-align:right;">Total HT</th></tr>
        </thead>
        <tbody>{{lines_html}}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Total HT</span><span class="val">{{total_ht}} {{currency}}</span></div>
        <div class="row"><span>TVA</span><span class="val">{{total_tva}} {{currency}}</span></div>
        <div class="row grand"><span>Total TTC</span><span class="val">{{total_ttc}} {{currency}}</span></div>
      </div>

      <div class="legal">{{legal_mentions}}</div>
      <div class="sign">
        <div class="box"><small>{{brand_name}} (émetteur)</small><br/><img class="emit" src="{{logo_url}}" alt="{{brand_name}}"/><br/><small>Signé électroniquement</small></div>
        <div class="box"><small>{{client_name}} (client)</small>{{signature_block}}</div>
      </div>`;

const BODY_QUOTE = BODY_INVOICE.replace("Facturer à", "Devis pour");
const BODY_CONTRACT = `
      <div class="grid-2">
        <div class="card">
          <h4>Parties</h4>
          <p><strong>Émetteur :</strong> {{issuer_name}} — {{issuer_siret}}</p>
          <p><strong>Client :</strong> {{client_name}} — {{client_address}}</p>
        </div>
        <div class="card">
          <h4>Objet du contrat</h4>
          <p>{{brand_tagline}} — Réf. {{doc_ref}}</p>
        </div>
      </div>

      <table class="lines">
        <thead><tr><th>Désignation</th><th style="text-align:center;">Qté</th><th style="text-align:right;">P.U. HT</th><th style="text-align:right;">Total HT</th></tr></thead>
        <tbody>{{lines_html}}</tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Total HT</span><span class="val">{{total_ht}} {{currency}}</span></div>
        <div class="row"><span>TVA</span><span class="val">{{total_tva}} {{currency}}</span></div>
        <div class="row grand"><span>Total TTC</span><span class="val">{{total_ttc}} {{currency}}</span></div>
      </div>

      <div class="legal">{{legal_mentions}}</div>
      <div class="sign">
        <div class="box"><small>{{brand_name}} (émetteur)</small><br/><img class="emit" src="{{logo_url}}" alt="{{brand_name}}"/><br/><small>Signé électroniquement</small></div>
        <div class="box"><small>{{client_name}} (signature)</small>{{signature_block}}</div>
      </div>`;

// Registre des templates par défaut (FR).
export const DEFAULT_TEMPLATES = [
  { typeCode: "facture",           language: "fr", htmlBody: wrap(BODY_INVOICE,  "Facture") },
  { typeCode: "facture_avoir",     language: "fr", htmlBody: wrap(BODY_INVOICE,  "Facture d'avoir") },
  { typeCode: "devis",             language: "fr", htmlBody: wrap(BODY_QUOTE,    "Devis") },
  { typeCode: "bon_commande",      language: "fr", htmlBody: wrap(BODY_INVOICE,  "Bon de commande") },
  { typeCode: "contrat_vente",     language: "fr", htmlBody: wrap(BODY_CONTRACT, "Contrat de vente") },
  { typeCode: "contrat_location",  language: "fr", htmlBody: wrap(BODY_CONTRACT, "Contrat de location") },
  { typeCode: "cgv",               language: "fr", htmlBody: wrap(BODY_CONTRACT, "CGV") },
  { typeCode: "cgu",               language: "fr", htmlBody: wrap(BODY_CONTRACT, "CGU") },
  { typeCode: "mandat_vente",      language: "fr", htmlBody: wrap(BODY_CONTRACT, "Mandat de vente") },
  { typeCode: "attestation",       language: "fr", htmlBody: wrap(BODY_CONTRACT, "Attestation") },
  { typeCode: "rapport_expertise", language: "fr", htmlBody: wrap(BODY_INVOICE,  "Rapport d'expertise") },
  { typeCode: "bon_livraison",     language: "fr", htmlBody: wrap(BODY_INVOICE,  "Bon de livraison") },
  { typeCode: "proces_verbal",     language: "fr", htmlBody: wrap(BODY_CONTRACT, "Procès-verbal") },
];

/**
 * Assure la présence des templates par défaut au démarrage (idempotent).
 * Le drapeau `MKA_SEED_DOC_TEMPLATES=0` désactive le seed.
 */
export async function ensureDefaultTemplates(): Promise<{ inserted: number; skipped: number }> {
  if (process.env.MKA_SEED_DOC_TEMPLATES === "0") return { inserted: 0, skipped: DEFAULT_TEMPLATES.length };
  let inserted = 0;
  for (const t of DEFAULT_TEMPLATES) {
    try {
      await upsertTemplate({
        typeCode: t.typeCode,
        language: t.language,
        countryCode: null,
        htmlBody: t.htmlBody,
        variables: COMMON_VARS,
        active: true,
      });
      inserted += 1;
    } catch (err) {
      console.warn(`[document-os] template seed skipped for ${t.typeCode}:`, err);
    }
  }
  return { inserted, skipped: 0 };
}
