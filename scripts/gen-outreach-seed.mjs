// Génère le SQL de seed pour outreach_contacts à partir de la liste brute
// de contacts approchés (mission Direction 26/10).
//
// Règle stricte : AUCUNE donnée inventée. Pour chaque contact :
//   - email : tel quel.
//   - domain : partie après @, en minuscules.
//   - company_name : label lisible dérivé MÉCANIQUEMENT du domaine (retire
//     le TLD, remplace les séparateurs par des espaces, met en forme) —
//     ce n'est PAS une affirmation d'identité, juste un libellé lisible.
//   - country : UNIQUEMENT si le TLD du domaine est un vrai ccTLD connu
//     (lecture structurelle de l'adresse, jamais une déduction du contenu
//     du nom de domaine) — jamais pour les fournisseurs de mail gratuits
//     (gmail, yahoo, outlook...).
//   - Tout le reste (catégorie, capacités, statut détaillé) est laissé à
//     vérifier humainement via l'écran dédié — jamais pré-rempli par
//     supposition.
//
// Les 3 réponses réellement reçues (Global Air Services Sénégal, Omnipack,
// TransConnect) sont codées à la main avec le contenu exact donné par la
// Direction, pas dérivées.
//
// Conservé ici pour traçabilité/reproductibilité de
// drizzle/0168_partner_outreach_seed_contacts.sql — ce script produit les
// lignes génériques (via `node scripts/gen-outreach-seed.mjs`), les 5 lignes
// enrichies des réponses connues restent écrites à la main dans la
// migration. Toute nouvelle vague de contacts approchés doit suivre la même
// règle : aucune catégorie/pays/capacité devinée à l'import.

const RAW_EMAILS = `julio.mvie@corex-international.com
commercial.lbv@corex-international.com
tmci.san-pedro@tractafric.com
tmci.abj-nord@tractafric.com
courrier.tmci@tractafric.com
info.tmsenegal@tractafric.com
mamadou.ouattara@tractafric.com
marouan.attoujani@orange.ne
georgeshaddad@haddadgroup-intl.com
Joe@ayazbeck.com
whg@abgafrica.com
somarem@mauritel.mr
l.niang@maliauto.net
seta-guinee@biasy.net
ignancadja@migmotors.net
service@aeygroup.com
Fadelgaya@yahoo.fr
steq@aremgroup.com
mecanica.dir@planet.tn
contact@fad.com.tn
contact@ad-tunisie.com
info@ramtradeco.com
contact@fgs.com
commercial.auto@sammotors.ci
Commercial.btp@sammotors.ci
contact@sammotors.ci
contact@garageautohrco.com
info@cmagarageci.com
contact@africagapasa.com
info@auto.ci
contact@e-garage.net
info@ivoireauto.com
service@aeygroup.com
a1dieselafrica@gmail.com
Wahid.hachem@autofast.com.gh
gesparc@groupesogafric.com
sales@royalmw.com
commercial@cpl-mg.com
info@cpl-mg.com
contact@ctmotors.mg
contact@materauto.mg
ndella@lasa.sn
contact@lasa.sn
Mdiagne@cfao.com
jlanglat@cfao.com
info@ramtradeco.com
cs@motion-autoparts.com
comptabilite@guineenneautomobilegarage.com
contact@guineenneautomobilegarage.com
contact@gag-guinee.com
usa@noraglobal.com
info@noraglobal.com
nadir@cnbmoverseas.com
cnbm-ivorycoast@cnbmoverseas.com
dg.acadec@acadec.net
contact@acadec.net
contact@senoto.sn
info@eaglefreightgh.com
info@novago.africa
CargoExport6@ethiopianairlines.com
CBControlEurope@ethiopianairlines.com
CBControlAfrica@ethiopianairlines.com
silops@obt.dk
ghaops@obt.dk
drcops@obt.dk
mozops@obt.dk
libops@obt.dk
bisops@obt.dk
gamops@obt.dk
ivcops@obt.dk
senops@obt.dk
amanuel@dhlasmara.com
lidya.tesfay@dhl.com
carolina.mbaga@dhl.com
kenneth.bedell@dhl.com
acsplan.eu@dhl.com
specialservices.fr@dhl.com
acscapman.ssa@dhl.com
acscs.ssa@dhl.com
biniyamd@ethiopianairlines.com
ShimelesA@ethiopianairlines.com
YohannesBT@ethiopianairlines.com
Fasikaz@ethiopianairlines.com
Yosephsh@ethiopianairlines.com
Samrawitg@ethiopianairlines.com
uganda@africashippinglogistics.com
rwanda@africashippinglogistics.com
mozlog@obt.dk
sillog@obt.dk
mrtlog@obt.dk
liblog@obt.dk
bislog@obt.dk
gamlog@obt.dk
drc@africashippinglogistics.com
congo@africashippinglogistics.com
info.sn@dhl-afs.com
info.ci@dhl-afs.com
info@midtrans.org
sales@fhb.sk
support@omnipack.com
contact@omnipack.com
productionforvidaXL@vidaxl.com
eren@cjdropshipping.co
support@cjdropshipping.com
customers@bigbuy.eu
gibrilla.mansaray@dhl.com
issifi.ali@dhl.com
salif.traore@dhl.com
Evarite.Vidah@africargoservices.com
mike.tanon@africargoservices.com
ops.abj@africargoservices.com
ikebe@globalairservices.sn
operation@globalairservices.sn
acssales.mena@dhl.com
acssales.ssa@dhl.com
gha@obt.dk
mal@obt.dk
ivclog@obt.dk
senlog@obt.dk
ginops@obt.dk
andre.duplessis@autocarriers.co.za
ccinfo@cargocarriers.co.za
contact@ehsafricalogistics.com
info@za.dsv.com
info.southafrica@dbschenker.com
cargocustomer@thy.com
CargoSales@ethiopianairlines.com
CargoAfricaMiddleEast@ethiopianairlines.com
CargoEurope@ethiopianairlines.com
CargoChina@ethiopianairlines.com
info@msc.com
rorosales@grimaldi-germany.de
westafrica@grimaldi.co.uk
ginlog@obt.dk
africa@sequana.co.uk
sales@aaa-de.com
info@auto-export-europe.com
info@africashippinglogistics.com
info.en@autopartner.com
sales@bricargogroup.com
info@shipcarsroro.co.uk
info@fastlanefwd.co.uk
info@ivssuk.com
info@britanniaexport.com
info@rorousa.com
TG003-cotationagltogotransit.togo@aglgroup.com
GN001-conakry-cotation@aglgroup.com
genuineparts@europeanautospares.com
sales@partshub.ee
ZA012-jnb.quote@aglgroup.com
info@9carlogistics.com
sales@transconnect.com
info@marlogautomotivelogistics.com
sales@partseurope.eu
sales007@goodhopefreight.com
admin@auto-in-china.com
commercial@lkqeurope.com
sales@interexautomotive.com
ae@transauto.be
vehicle@autoredo.com
euregistration.fr@bca.com`
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

// ccTLD -> pays. Uniquement des ccTLD réels présents dans la liste, jamais
// un fournisseur de mail gratuit (gmail.com, yahoo.fr, outlook.com...).
const CCTLD_COUNTRY = {
  sn: "Sénégal",
  ci: "Côte d'Ivoire",
  mr: "Mauritanie",
  gh: "Ghana",
  mg: "Madagascar",
  tn: "Tunisie",
  ne: "Niger",
  dk: "Danemark",
  sk: "Slovaquie",
  za: "Afrique du Sud",
  de: "Allemagne",
  uk: "Royaume-Uni", // co.uk
  ee: "Estonie",
  be: "Belgique",
};

const FREE_MAIL_DOMAINS = new Set(["gmail.com", "yahoo.fr", "yahoo.com", "outlook.com", "hotmail.com"]);

function deriveLabel(domain) {
  // Retire les TLD/ccTLD connus (y compris composés .co.uk/.com.tn/.co.za)
  let base = domain
    .replace(/\.(co\.uk|com\.tn|co\.za)$/i, "")
    .replace(/\.(com|net|org|eu|africa|dk|mr|ci|sn|mg|tn|ne|sk|za|de|ee|be|co)$/i, "");
  const words = base.split(/[-.]/).filter(Boolean);
  return words
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function deriveCountry(domain) {
  if (FREE_MAIL_DOMAINS.has(domain)) return null;
  if (domain.endsWith(".co.uk")) return CCTLD_COUNTRY.uk;
  if (domain.endsWith(".com.tn")) return CCTLD_COUNTRY.tn;
  if (domain.endsWith(".co.za")) return CCTLD_COUNTRY.za;
  const parts = domain.split(".");
  const tld = parts[parts.length - 1];
  return CCTLD_COUNTRY[tld] ?? null;
}

function sqlEscape(v) {
  if (v == null) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Domaines des 3 réponses réellement reçues — codés à la main avec le
// contenu exact donné par la Direction, exclus du lot générique ci-dessous
// pour ne pas être écrasés par des données dérivées génériques.
const KNOWN_RESPONSE_DOMAINS = new Set(["globalairservices.sn", "omnipack.com", "transconnect.com"]);

const seen = new Set();
const rows = [];
for (const email of RAW_EMAILS) {
  const key = email.toLowerCase();
  if (seen.has(key)) continue; // dédoublonnage exact (ramtradeco.com / service@aeygroup.com apparaissent deux fois)
  seen.add(key);
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (KNOWN_RESPONSE_DOMAINS.has(domain)) continue;
  const companyName = deriveLabel(domain);
  const country = deriveCountry(domain);
  rows.push({ email, domain, companyName, country });
}

console.log(`-- ${rows.length} contacts génériques (sur ${RAW_EMAILS.length} lignes brutes, dédoublonnés, hors 5 adresses des 3 réponses connues).`);
rows.forEach((r, i) => {
  const ref = `OUT-SEED-${String(i + 1).padStart(4, "0")}`;
  const sep = i === rows.length - 1 ? ";" : ",";
  console.log(
    `  (${sqlEscape(ref)}, ${sqlEscape(r.email)}, ${sqlEscape(r.domain)}, ${sqlEscape(r.companyName)}, ${sqlEscape(r.country)}, 'contacte', 'campagne_26_10')${sep}`,
  );
});
