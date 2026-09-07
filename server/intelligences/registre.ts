/**
 * MKA.P-MS Intelligences — lecture du registre de conversation.
 *
 * Avant de répondre, le moteur lit *comment* le visiteur lui parle : est-ce un
 * remerciement, une salutation, un au revoir ? Est-il courtois, familier,
 * pressé, agacé ? Vouvoie-t-il ? Cette lecture produit une consigne de ton que
 * le moteur ajoute à sa consigne fixe, et permet de rendre l'honneur d'un
 * remerciement sans passer par le fournisseur (une réponse de politesse ne
 * consomme pas le plafond journalier et arrive même si le fournisseur est
 * indisponible).
 *
 * Tout est déterministe et lisible : aucune supposition sur l'identité du
 * visiteur, seulement sur la forme de son message.
 */

export type Intention =
  | "remerciement"
  | "salutation"
  | "au_revoir"
  | "compliment"
  | "excuse"
  | "question";

export type Registre = "soutenu" | "courtois" | "familier" | "pressé" | "agacé";

export interface LectureRegistre {
  intention: Intention;
  registre: Registre;
  vouvoiement: boolean | null;
  /** Salutation religieuse ou culturelle détectée (salam, etc.). */
  salut: "salam" | null;
  /** Le message ne contient que la politesse : réponse locale possible. */
  pureCourtoisie: boolean;
  /** Consigne de ton à joindre à la consigne système. */
  consigneTon: string;
}

const normaliser = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s'!?.]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const MERCI =
  /\b(merci|mercii+|je (vous|te) remercie|thanks?|thank you|thx|gracias|obrigad[oa]|danke|grazie|choukran|shukran|chokran|jerejef|barka|nagode|akpe|medaase|asante|murakoze)\b/;
const SALAM = /\b(salam|salaam|assalam|assalamu|salamou|alaykoum|alaikum|aleykoum|aleikoum)\b/;
const BONJOUR =
  /\b(bonjour|bonsoir|salut|coucou|hello|hi|hey|good (morning|evening|afternoon)|buenos dias|buenas|hola|ola|guten tag|ciao|nanga def|bawo ni|sannu|akwaaba)\b/;
const AU_REVOIR =
  /\b(au revoir|a bientot|a plus|bonne journee|bonne soiree|bonne nuit|bye|goodbye|see you|adios|hasta luego|tchau|ciao|a la prochaine|bon courage)\b/;
const COMPLIMENT =
  /\b(bravo|felicitations|felicitation|excellent|super|genial|parfait|top|tres bien|bien joue|impressionnant|well done|great job|awesome|perfect)\b/;
const EXCUSE = /\b(desole|desolee|pardon|excuse|excusez|sorry|my bad)\b/;
const AGACEMENT =
  /\b(nul|null|ca marche pas|marche pas|fonctionne pas|encore|toujours pas|j'en ai marre|inadmissible|honteux|arnaque|c'est quoi ce|serieux|useless|broken|wtf)\b|!{2,}/;
const PRESSE = /\b(vite|rapidement|urgent|urgence|tout de suite|maintenant|asap|quick|now)\b/;
const FAMILIER = /\b(wesh|frer|frere|bro|mec|ouais|ok|okay|stp|svp|tkt|jsp|mdr|lol|yo)\b/;
const SOUTENU =
  /\b(je vous prie|veuillez|auriez[- ]vous|pourriez[- ]vous|serait[- ]il possible|cordialement|madame|monsieur|je vous remercie)\b/;
const VOUS = /\b(vous|votre|vos|pouvez|pourriez|auriez|veuillez|avez)\b/;
const TU = /\b(tu|toi|ton|ta|tes|peux|pourrais|t'es|stp)\b/;

const MOTS_QUESTION =
  /\b(comment|pourquoi|quel|quelle|quels|quelles|combien|ou|quand|est[- ]ce|peux|peut|pouvez|cherche|voudrais|veux|besoin|prix|probleme|panne|voiture|vehicule|piece|garage|location|louer|acheter|vendre)\b|\?/;

export function lireRegistre(question: string): LectureRegistre {
  const t = normaliser(question);
  const mots = t.split(" ").filter((m) => m.length > 0);
  const court = mots.length <= 8;

  const aMerci = MERCI.test(t);
  const aSalam = SALAM.test(t);
  const aBonjour = BONJOUR.test(t) || aSalam;
  const aAuRevoir = AU_REVOIR.test(t);
  const aCompliment = COMPLIMENT.test(t);
  const aExcuse = EXCUSE.test(t);
  const porteQuestion = MOTS_QUESTION.test(t) && !(court && (aMerci || aBonjour || aAuRevoir));

  let intention: Intention = "question";
  if (!porteQuestion) {
    if (aMerci) intention = "remerciement";
    else if (aAuRevoir) intention = "au_revoir";
    else if (aCompliment) intention = "compliment";
    else if (aExcuse) intention = "excuse";
    else if (aBonjour) intention = "salutation";
  }

  let registre: Registre = "courtois";
  if (AGACEMENT.test(t)) registre = "agacé";
  else if (PRESSE.test(t)) registre = "pressé";
  else if (SOUTENU.test(t)) registre = "soutenu";
  else if (FAMILIER.test(t)) registre = "familier";

  const vous = VOUS.test(t);
  const tu = TU.test(t);
  const vouvoiement = vous && !tu ? true : tu && !vous ? false : null;

  const pureCourtoisie = intention !== "question" && court;

  const consigne: string[] = [];
  consigne.push(
    vouvoiement === false
      ? "Le visiteur te tutoie : tutoie-le en retour, naturellement."
      : "Le visiteur te vouvoie ou reste neutre : vouvoie-le.",
  );
  switch (registre) {
    case "soutenu":
      consigne.push("Registre soutenu : réponds avec la même tenue, formules complètes, sans familiarité.");
      break;
    case "familier":
      consigne.push("Registre familier et détendu : réponds simplement, chaleureusement, sans jargon ni raideur, en restant correct.");
      break;
    case "pressé":
      consigne.push("Le visiteur est pressé : va droit au but, l'essentiel en premier, pas de préambule.");
      break;
    case "agacé":
      consigne.push(
        "Le visiteur est agacé ou déçu : commence par reconnaître le désagrément en une phrase sincère, sans te justifier, puis donne une aide concrète et une porte de sortie (garage, support, page d'aide).",
      );
      break;
    default:
      consigne.push("Registre courtois : réponds avec courtoisie et chaleur, sans excès.");
  }
  if (aSalam) {
    consigne.push("Le visiteur a salué avec « salam » : rends le salut (« Wa alaykoum salam ») avant de répondre.");
  } else if (aBonjour && intention === "question") {
    consigne.push("Le visiteur a salué : rends la salutation en un mot avant de répondre.");
  }
  if (aMerci && intention === "question") {
    consigne.push("Le visiteur te remercie en passant : accueille le remerciement brièvement, puis réponds.");
  }

  return {
    intention,
    registre,
    vouvoiement,
    salut: aSalam ? "salam" : null,
    pureCourtoisie,
    consigneTon: consigne.join("\n"),
  };
}

const choisir = <T,>(liste: readonly T[], graine: string): T => {
  let h = 0;
  for (const c of graine) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return liste[h % liste.length]!;
};

/**
 * Réponse de courtoisie rendue par le moteur lui-même quand le message ne
 * contient que de la politesse. `null` si une vraie question est présente.
 */
export function reponseCourtoisie(
  lecture: LectureRegistre,
  nomMoteur: string,
  question: string,
): string | null {
  if (!lecture.pureCourtoisie) return null;
  const tu = lecture.vouvoiement === false;
  const v = (formeVous: string, formeTu: string) => (tu ? formeTu : formeVous);
  const prefixeSalam = lecture.salut === "salam" ? "Wa alaykoum salam. " : "";

  switch (lecture.intention) {
    case "remerciement": {
      const honneurs = [
        `C'est moi qui ${v("vous", "te")} remercie : c'est un honneur d'avoir pu ${v("vous aider", "t'aider")}.`,
        `Avec plaisir, et merci à ${v("vous", "toi")} pour ${v("votre", "ta")} confiance — c'est ce qui donne du sens à mon travail.`,
        `Tout l'honneur est pour moi. Si une autre question ${v("vous", "te")} vient, je suis là.`,
        `Je ${v("vous", "te")} remercie en retour : ${v("votre", "ton")} mot fait plaisir. À ${v("votre", "ta")} disposition pour la suite.`,
      ];
      const suite = lecture.registre === "familier"
        ? " N'hésite pas si tu as besoin d'autre chose."
        : ` ${nomMoteur} reste à ${v("votre", "ta")} disposition.`;
      return prefixeSalam + choisir(honneurs, question) + suite;
    }
    case "salutation":
      return (
        prefixeSalam +
        (lecture.registre === "soutenu"
          ? `Bonjour, et bienvenue. Je suis ${nomMoteur}, l'assistant de MKA.P-MS. En quoi puis-je ${v("vous être utile", "t'être utile")} aujourd'hui — véhicule, entretien, pièces, location, dépannage, ou l'utilisation du site ?`
          : `Bonjour ! Je suis ${nomMoteur}, l'assistant de MKA.P-MS. ${v("Dites-moi", "Dis-moi")} ce qui ${v("vous amène", "t'amène")} : véhicule, entretien, pièces, location, dépannage, ou une question sur le site.`)
      );
    case "au_revoir":
      return (
        prefixeSalam +
        choisir(
          [
            `Au revoir, et bonne route. Merci de ${v("votre", "ta")} visite — je suis là quand ${v("vous voudrez", "tu voudras")}.`,
            `À bientôt ! ${v("Prenez", "Prends")} soin de ${v("vous", "toi")} et de ${v("votre", "ton")} véhicule.`,
          ],
          question,
        )
      );
    case "compliment":
      return (
        prefixeSalam +
        `Merci, ${v("votre", "ton")} mot me touche et je le prends comme un encouragement à faire mieux encore. ${v("Vous", "Tu")} ${v("avez", "as")} une autre question ?`
      );
    case "excuse":
      return (
        prefixeSalam +
        `Aucun souci, il n'y a rien à excuser. ${v("Dites-moi", "Dis-moi")} simplement comment je peux ${v("vous aider", "t'aider")}.`
      );
    default:
      return null;
  }
}
