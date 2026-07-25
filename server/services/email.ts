import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const FROM_NAME = "MKA.P-MS";
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@mkapms.site";

// URL publique absolue du logo (obligatoire dans les emails — pas de path relatif).
// Logo FERMÉ (Version 1 – Terre / Unité) : le logo utilisé sur tous les
// documents et contenus envoyés au client, conformément à la charte.
const LOGO_URL =
  process.env.MKA_EMAIL_LOGO_URL ||
  `${(process.env.PUBLIC_BASE_URL || "https://mkapms.fr").replace(/\/$/, "")}/logo-closed.png`;

/** En-tête HTML commun à tous les emails MKA.P-MS avec le logo officiel. */
function emailHeader(): string {
  return `
        <div style="text-align:center;padding:8px 0 16px;border-bottom:2px solid #D4AF37;margin-bottom:20px;">
          <img src="${LOGO_URL}" alt="MKA.P-MS" style="height:56px;width:auto;display:inline-block;" />
          <div style="font-size:9px;letter-spacing:0.18em;color:#6B7280;text-transform:uppercase;font-weight:700;margin-top:6px;">MKA.P-MS · La marketplace automobile</div>
        </div>`;
}

/** Pied de page HTML commun à tous les emails MKA.P-MS. */
function emailFooter(): string {
  return `
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="font-size:12px;color:#999;text-align:center;">MKA.P-MS — La marketplace automobile</p>`;
}

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[email] SMTP not configured — skipping email to ${to}: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[email] Sent to ${to}: ${subject}`);
    return true;
  } catch (e) {
    console.error(`[email] Failed to send to ${to}:`, e);
    return false;
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function emailAnnoncePubliee(titre: string, id: number): { subject: string; html: string } {
  return {
    subject: `Votre annonce "${titre}" a bien été publiée — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Votre annonce <strong>"${titre}"</strong> a bien été publiée sur la plateforme.</p>
        <p>Elle sera visible pendant <strong>30 jours</strong>. Vous recevrez une notification avant son expiration.</p>
        <p>Référence : ANN-${id}</p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailAnnonceModifiee(titre: string, id: number): { subject: string; html: string } {
  return {
    subject: `Votre annonce "${titre}" a été modifiée — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Votre annonce <strong>"${titre}"</strong> a bien été modifiée.</p>
        <p>Les changements sont visibles immédiatement sur la plateforme.</p>
        <p>Référence : ANN-${id}</p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailAnnonceSupprimee(titre: string, raison: string): { subject: string; html: string } {
  return {
    subject: `Votre annonce "${titre}" a été supprimée — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Votre annonce <strong>"${titre}"</strong> a été supprimée de la plateforme.</p>
        <p>Raison : ${raison}</p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailAnnonceProlongee(titre: string, newExpires: Date): { subject: string; html: string } {
  const dateStr = newExpires.toLocaleDateString("fr-FR");
  return {
    subject: `Votre annonce "${titre}" a été prolongée — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Votre annonce <strong>"${titre}"</strong> a été prolongée avec succès.</p>
        <p>Nouvelle date d'expiration : <strong>${dateStr}</strong></p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailAnnonceExpiree(titre: string, id: number): { subject: string; html: string } {
  return {
    subject: `Votre annonce "${titre}" a expiré — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Votre annonce <strong>"${titre}"</strong> a expiré après 30 jours.</p>
        <p>Vous pouvez la <strong>prolonger</strong> depuis votre espace "Mes annonces" pour la remettre en ligne.</p>
        <p>Si vous ne la prolongez pas, elle sera automatiquement supprimée après quelques semaines.</p>
        <p>Référence : ANN-${id}</p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailMessageRecu(annonceTitle: string, senderName: string): { subject: string; html: string } {
  return {
    subject: `Nouveau message pour "${annonceTitle}" — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Vous avez reçu un nouveau message de <strong>${senderName}</strong> concernant votre annonce <strong>"${annonceTitle}"</strong>.</p>
        <p>Connectez-vous à votre compte pour y répondre.</p>
        ${emailFooter()}
      </div>
    `,
  };
}

export function emailErreur(action: string, details: string): { subject: string; html: string } {
  return {
    subject: `Erreur lors de "${action}" — MKA.P-MS`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        ${emailHeader()}
        <p>Bonjour,</p>
        <p>Une erreur s'est produite lors de l'action : <strong>${action}</strong></p>
        <p>Détails : ${details}</p>
        <p>Veuillez réessayer ou contacter le support.</p>
        ${emailFooter()}
      </div>
    `,
  };
}
