import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Gavel, Shield, Clock, Users, AlertCircle, Star,
  CheckCircle, ArrowRight, Eye, Lock, Building2, FileText, Filter,
  ChevronDown, ChevronRight, Search, MapPin, Truck, RefreshCcw,
  Car, Wrench, ArrowLeft, Info, Phone, MessageSquare, X,
} from "lucide-react";
import { useAuth } from "../lib/auth";

/* ═══════════════════════════════════════════════════════════
   CATÉGORIES ACHETEURS AUTORISÉS
   ═══════════════════════════════════════════════════════════ */
const ACHETEURS_AUTORISES = [
  { id: "garage", label: "Garages", icon: Wrench, desc: "Garages et ateliers mécaniques" },
  { id: "marchand", label: "Marchands automobiles", icon: Car, desc: "Revendeurs et concessionnaires" },
  { id: "exportateur", label: "Exportateurs", icon: Truck, desc: "Export véhicules d'occasion" },
  { id: "carrossier", label: "Carrossiers", icon: Building2, desc: "Ateliers de carrosserie agréés" },
  { id: "casse", label: "Casse automobile agréée", icon: RefreshCcw, desc: "Centres de recyclage automobile" },
  { id: "pro_valide", label: "Professionnels validés", icon: Shield, desc: "SIRET/KBIS vérifié" },
];

/* ═══════════════════════════════════════════════════════════
   LOTS ENCHÈRES (demo enrichi — 3 circuits)
   ═══════════════════════════════════════════════════════════ */
const LOTS: LotType[] = [
  // Circuit 2 — Reprises véhicules à gros travaux
  {
    id: 1, titre: "Lot 5 véhicules — Reprises garage",
    circuit: "reprise", nbVehicules: 5, miseDepart: 8500, offreActuelle: 12400,
    encheres: 14, fin: "2h 15min", finTimestamp: Date.now() + 2 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop",
    marque: "Diverses", modele: "Lot mixte", annee: "2016-2020",
    km: "85 000 - 180 000 km", etat: "À remettre en état",
    carburant: "Diesel / Essence", description: "Lot de 5 véhicules de reprise nécessitant des travaux mécaniques et de carrosserie. Parfait pour garages et marchands.",
    vehicules: [
      { marque: "Peugeot", modele: "308 SW", annee: 2018, km: 95000, etat: "Distribution à faire" },
      { marque: "Renault", modele: "Mégane IV", annee: 2019, km: 85000, etat: "Embrayage usé" },
      { marque: "Citroën", modele: "C4 Cactus", annee: 2017, km: 110000, etat: "Turbo HS" },
      { marque: "Volkswagen", modele: "Golf VII", annee: 2016, km: 140000, etat: "Boîte de vitesse" },
      { marque: "Ford", modele: "Focus III", annee: 2018, km: 105000, etat: "Moteur à réviser" },
    ],
  },
  {
    id: 2, titre: "BMW Série 3 320d — Accident léger",
    circuit: "reprise", nbVehicules: 1, miseDepart: 6000, offreActuelle: 8200,
    encheres: 8, fin: "4h 30min", finTimestamp: Date.now() + 4.5 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop",
    marque: "BMW", modele: "Série 3 320d", annee: "2019",
    km: "78 000 km", etat: "Accident léger avant-droit",
    carburant: "Diesel", description: "BMW 320d accidentée côté avant droit. Mécanique parfaite, carrosserie à refaire (aile + pare-chocs + phare). Très bonne affaire pour carrossier.",
    vehicules: [
      { marque: "BMW", modele: "320d", annee: 2019, km: 78000, etat: "Aile AV droite + pare-chocs" },
    ],
  },
  {
    id: 3, titre: "Renault Clio V — Panne moteur",
    circuit: "reprise", nbVehicules: 1, miseDepart: 2500, offreActuelle: 3800,
    encheres: 11, fin: "1j 8h", finTimestamp: Date.now() + 32 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1604410869154-3c16714cd476?w=600&h=400&fit=crop",
    marque: "Renault", modele: "Clio V", annee: "2021",
    km: "45 000 km", etat: "Panne moteur — bielle coulée",
    carburant: "Essence", description: "Clio V récente avec panne moteur importante. Idéale pour garage spécialisé ou exportateur. Carrosserie et intérieur impeccables.",
    vehicules: [
      { marque: "Renault", modele: "Clio V", annee: 2021, km: 45000, etat: "Bielle coulée — moteur à remplacer" },
    ],
  },
  // Circuit 3 — Flotte location fin de cycle
  {
    id: 4, titre: "Lot 3 véhicules — Fin de flotte location",
    circuit: "flotte", nbVehicules: 3, miseDepart: 15000, offreActuelle: 19500,
    encheres: 6, fin: "5h 00min", finTimestamp: Date.now() + 5 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop",
    marque: "Diverses", modele: "Flotte MKA.P-MS", annee: "2021-2022",
    km: "120 000 - 160 000 km", etat: "Fin de cycle location — amortis",
    carburant: "Diesel", description: "3 véhicules de la flotte de location MKA.P-MS arrivés en fin de cycle. Kilométrage atteint, entretien constructeur suivi. Parfait pour revente ou export.",
    vehicules: [
      { marque: "Peugeot", modele: "3008 GT", annee: 2021, km: 125000, etat: "Entretien OK — pneus neufs" },
      { marque: "Renault", modele: "Kadjar", annee: 2022, km: 135000, etat: "Révision complète faite" },
      { marque: "Citroën", modele: "C5 Aircross", annee: 2021, km: 155000, etat: "Distribution à prévoir" },
    ],
  },
  {
    id: 5, titre: "Mercedes Classe A 180d — Retour location",
    circuit: "flotte", nbVehicules: 1, miseDepart: 9000, offreActuelle: 11200,
    encheres: 9, fin: "6h 45min", finTimestamp: Date.now() + 6.75 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop",
    marque: "Mercedes", modele: "Classe A 180d", annee: "2022",
    km: "140 000 km", etat: "Fin de contrat location",
    carburant: "Diesel", description: "Mercedes Classe A 180d, retour de location longue durée. Kilométrage élevé mais entretien constructeur complet. Quelques traces d'usage normales.",
    vehicules: [
      { marque: "Mercedes", modele: "Classe A 180d", annee: 2022, km: 140000, etat: "Entretien Mercedes suivi" },
    ],
  },
  // Circuit 2 — Véhicule moyen en enchère pro
  {
    id: 6, titre: "Citroën C3 Aircross — À réviser",
    circuit: "reprise", nbVehicules: 1, miseDepart: 4000, offreActuelle: 5100,
    encheres: 5, fin: "3h 20min", finTimestamp: Date.now() + 3.33 * 3600 * 1000,
    photo: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=400&fit=crop",
    marque: "Citroën", modele: "C3 Aircross", annee: "2020",
    km: "92 000 km", etat: "Révision complète à faire",
    carburant: "Essence", description: "C3 Aircross reprise client, nécessite une révision complète (distribution, freins, embrayage). Bon état général de carrosserie.",
    vehicules: [
      { marque: "Citroën", modele: "C3 Aircross", annee: 2020, km: 92000, etat: "Distribution + freins + embrayage" },
    ],
  },
];

interface LotVehicule { marque: string; modele: string; annee: number; km: number; etat: string; }
interface LotType {
  id: number; titre: string; circuit: string; nbVehicules: number;
  miseDepart: number; offreActuelle: number; encheres: number;
  fin: string; finTimestamp: number; photo: string;
  marque: string; modele: string; annee: string;
  km: string; etat: string; carburant: string; description: string;
  vehicules: LotVehicule[];
}

const CIRCUIT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  reprise: { label: "Reprise", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  flotte: { label: "Flotte location", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

export default function VenteEncheres() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"landing" | "lots" | "detail">("landing");
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [filterCircuit, setFilterCircuit] = useState("");
  const [enchereInput, setEnchereInput] = useState("");
  const [showBidConfirm, setShowBidConfirm] = useState(false);

  const selectedLot = LOTS.find((l) => l.id === selectedLotId);
  const filteredLots = filterCircuit ? LOTS.filter((l) => l.circuit === filterCircuit) : LOTS;

  const isPro = user?.accountType === "professionnel" || user?.accountType === "admin";

  /* ════════════════════════════════════════════════════════════
     LANDING PAGE — Présentation Enchères
     ════════════════════════════════════════════════════════════ */
  if (mode === "landing") {
    return (
      <div className="min-h-screen bg-[#F5F3EF]">
        {/* HERO */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2d1b69] via-[#1a1145] to-[#111]">
          <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="relative px-4 py-10 md:py-16 md:px-8 max-w-6xl mx-auto">
            <div className="md:flex md:items-center md:justify-between md:gap-12">
              <div className="md:max-w-xl">
                <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-[10px] font-bold text-white mb-3 uppercase tracking-widest">Enchères professionnelles</span>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  ENCHÈRES<br /><span className="text-[#D4AF37]">AUTOMOBILES PRO</span>
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/70 max-w-md">
                  Véhicules de reprise, fins de flotte, véhicules à travaux — réservés aux professionnels.
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2"><Lock size={14} className="text-[#D4AF37]" /> Accès réservé aux :</h3>
                  {ACHETEURS_AUTORISES.map((a) => (
                    <div key={a.id} className="flex items-center gap-2">
                      <a.icon size={14} className="text-[#D4AF37] shrink-0" />
                      <span className="text-xs text-white/90">{a.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CIRCUITS */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10">
          <h2 className="text-xl font-extrabold text-[#111] text-center mb-6">LES 3 CIRCUITS D'ENCHÈRES</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 mb-3"><Car size={20} className="text-green-600" /></div>
              <h3 className="text-sm font-bold text-[#111]">Circuit 1 — Vente directe</h3>
              <p className="mt-1 text-xs text-[#6B7280]">Les meilleurs véhicules MKA.P-MS sont vendus en vente classique.</p>
              <p className="mt-2 text-[10px] text-green-600 font-semibold">→ Vente directe MKA.P-MS</p>
            </div>
            <div className="rounded-2xl bg-white border border-amber-200 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 mb-3"><RefreshCcw size={20} className="text-amber-600" /></div>
              <h3 className="text-sm font-bold text-[#111]">Circuit 2 — Reprises</h3>
              <p className="mt-1 text-xs text-[#6B7280]">Véhicules de reprise avec travaux importants → enchères professionnelles.</p>
              <p className="mt-2 text-[10px] text-amber-600 font-semibold">→ Enchères Pro</p>
            </div>
            <div className="rounded-2xl bg-white border border-blue-200 p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 mb-3"><Truck size={20} className="text-blue-600" /></div>
              <h3 className="text-sm font-bold text-[#111]">Circuit 3 — Flottes</h3>
              <p className="mt-1 text-xs text-[#6B7280]">Véhicules de location en fin de cycle, kilométrage cible atteint.</p>
              <p className="mt-2 text-[10px] text-blue-600 font-semibold">→ Enchères Pro</p>
            </div>
          </div>
        </div>

        {/* AVANTAGES */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, text: "Véhicules expertisés", desc: "Chaque véhicule est inspecté" },
              { icon: Eye, text: "Transparence totale", desc: "Historique et état détaillés" },
              { icon: Gavel, text: "Enchères sécurisées", desc: "Système d'enchères fiable" },
              { icon: Lock, text: "Accès pro uniquement", desc: "SIRET/KBIS vérifié" },
            ].map((a) => (
              <div key={a.text} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10"><a.icon size={22} className="text-[#D4AF37]" /></div>
                <h3 className="mt-3 text-sm font-bold text-[#111]">{a.text}</h3>
                <p className="mt-1 text-xs text-[#6B7280]">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 md:px-8 max-w-6xl mx-auto mt-10 mb-10">
          <div className="rounded-2xl bg-gradient-to-r from-[#2d1b69] to-[#111] p-6 md:p-8 text-center">
            <h2 className="text-lg md:text-xl font-extrabold text-white">ACCÉDER AUX ENCHÈRES</h2>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
              {isPro ? "Vous êtes vérifié. Accédez aux lots disponibles." : "Réservé aux professionnels avec SIRET/KBIS vérifié."}
            </p>
            <button
              className="mt-5 rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#C5A028] transition"
              onClick={() => {
                if (!user) { navigate("/connexion"); return; }
                setMode("lots");
              }}
            >
              {isPro ? "Voir les lots disponibles" : "Se connecter en tant que Pro"}
            </button>
            {!isPro && user && (
              <p className="mt-3 text-xs text-white/40">
                Votre compte est de type particulier. Les enchères sont réservées aux comptes professionnels.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     LISTE DES LOTS
     ════════════════════════════════════════════════════════════ */
  if (mode === "lots") {
    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-r from-[#2d1b69] to-[#1a1145] px-4 pt-6 pb-5">
          <button onClick={() => setMode("landing")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour</button>
          <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold text-white mb-2 uppercase tracking-widest">Enchères Pro</span>
          <h1 className="text-xl font-black text-white flex items-center gap-2"><Gavel size={20} /> Lots disponibles</h1>
          <p className="mt-1 text-sm text-white/70">{filteredLots.length} lot(s) en cours</p>
        </div>

        {!isPro && (
          <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800"><span className="font-bold">Accès restreint :</span> Les enchères sont réservées aux professionnels validés. Vérification SIRET/KBIS obligatoire.</p>
          </div>
        )}

        {/* Filtres circuit */}
        <div className="px-4 mt-4 flex gap-2">
          <button onClick={() => setFilterCircuit("")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${!filterCircuit ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>Tous les lots</button>
          <button onClick={() => setFilterCircuit("reprise")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filterCircuit === "reprise" ? "bg-amber-500 text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>Reprises</button>
          <button onClick={() => setFilterCircuit("flotte")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filterCircuit === "flotte" ? "bg-blue-500 text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>Flottes</button>
        </div>

        {/* Lots */}
        <div className="px-4 mt-4 space-y-3">
          {filteredLots.map((l) => {
            const ci = CIRCUIT_LABELS[l.circuit];
            return (
              <div key={l.id} className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => { setSelectedLotId(l.id); setMode("detail"); }}>
                <div className="relative h-[160px]">
                  <img src={l.photo} alt={l.titre} className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute top-3 left-3 rounded-full bg-purple-700 px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1"><Gavel size={10} /> Enchère</span>
                  <span className={`absolute top-3 right-3 rounded-full border px-3 py-1 text-[10px] font-bold ${ci?.bg} ${ci?.color}`}>{ci?.label}</span>
                  <span className="absolute bottom-3 right-3 rounded-full bg-[#111]/80 px-3 py-1 text-[10px] font-bold text-white flex items-center gap-1"><Clock size={10} /> {l.fin}</span>
                  {l.nbVehicules > 1 && <span className="absolute bottom-3 left-3 rounded-full bg-[#D4AF37] px-3 py-1 text-[10px] font-bold text-white">{l.nbVehicules} véhicules</span>}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-[#111]">{l.titre}</h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">{l.etat}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <p className="text-[8px] text-[#6B7280]">Mise de départ</p>
                      <p className="text-sm font-bold text-[#111]">{l.miseDepart.toLocaleString("fr-FR")} €</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-2 text-center">
                      <p className="text-[8px] text-purple-600">Offre actuelle</p>
                      <p className="text-sm font-black text-purple-700">{l.offreActuelle.toLocaleString("fr-FR")} €</p>
                    </div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2 text-center">
                      <p className="text-[8px] text-[#6B7280]">Enchères</p>
                      <p className="text-sm font-bold text-[#111]">{l.encheres}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     DÉTAIL LOT / ENCHÉRIR
     ════════════════════════════════════════════════════════════ */
  if (mode === "detail" && selectedLot) {
    const ci = CIRCUIT_LABELS[selectedLot.circuit];
    const nextBid = selectedLot.offreActuelle + 200;

    return (
      <div className="min-h-screen bg-[#F5F3EF] pb-24">
        <div className="bg-gradient-to-r from-[#2d1b69] to-[#1a1145] px-4 pt-6 pb-5">
          <button onClick={() => setMode("lots")} className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour aux lots</button>
          <h1 className="text-xl font-black text-white">{selectedLot.titre}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`rounded-full border px-3 py-0.5 text-[10px] font-bold ${ci?.bg} ${ci?.color}`}>{ci?.label}</span>
            <span className="text-[10px] text-white/60 flex items-center gap-1"><Clock size={10} /> Fin dans {selectedLot.fin}</span>
          </div>
        </div>

        <div className="px-4 mt-4 space-y-4">
          {/* Photo */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm">
            <img src={selectedLot.photo} alt={selectedLot.titre} className="w-full h-56 object-cover" />
          </div>

          {/* Enchère actuelle */}
          <div className="rounded-2xl bg-white border-2 border-purple-300 p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-[#6B7280]">Mise de départ</p>
                <p className="text-lg font-bold text-[#111]">{selectedLot.miseDepart.toLocaleString("fr-FR")} €</p>
              </div>
              <div className="border-x border-[#E5E7EB]">
                <p className="text-[10px] text-purple-600">Offre actuelle</p>
                <p className="text-xl font-black text-purple-700">{selectedLot.offreActuelle.toLocaleString("fr-FR")} €</p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280]">Enchères</p>
                <p className="text-lg font-bold text-[#111]">{selectedLot.encheres}</p>
              </div>
            </div>

            {/* Enchérir */}
            {isPro ? (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-xl border-2 border-[#E5E7EB] p-3 bg-white">
                    <span className="text-sm font-bold text-[#6B7280] mr-2">€</span>
                    <input
                      className="flex-1 text-lg font-bold text-[#111] outline-none"
                      placeholder={`Min. ${nextBid.toLocaleString("fr-FR")}`}
                      value={enchereInput}
                      onChange={(e) => setEnchereInput(e.target.value.replace(/[^\d]/g, ""))}
                    />
                  </div>
                  <button
                    className="rounded-xl bg-purple-700 px-6 py-3 text-sm font-bold text-white hover:bg-purple-800 transition disabled:opacity-50"
                    disabled={!enchereInput || Number(enchereInput) < nextBid}
                    onClick={() => setShowBidConfirm(true)}
                  >
                    <Gavel size={16} className="inline mr-1" /> Enchérir
                  </button>
                </div>
                <p className="text-[10px] text-[#9CA3AF] text-center">Enchère minimum : {nextBid.toLocaleString("fr-FR")} € (palier de 200 €)</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                <Lock size={16} className="text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-amber-800">Enchères réservées aux professionnels validés</p>
                <p className="text-[10px] text-amber-600 mt-1">Connectez-vous avec un compte professionnel pour enchérir.</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] mb-2">Description du lot</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed">{selectedLot.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">Marque</p><p className="text-sm font-bold text-[#111]">{selectedLot.marque}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">Modèle</p><p className="text-sm font-bold text-[#111]">{selectedLot.modele}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">Année</p><p className="text-sm font-bold text-[#111]">{selectedLot.annee}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">Kilométrage</p><p className="text-sm font-bold text-[#111]">{selectedLot.km}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">Carburant</p><p className="text-sm font-bold text-[#111]">{selectedLot.carburant}</p></div>
              <div className="rounded-xl bg-[#F5F3EF] p-3"><p className="text-[10px] text-[#9CA3AF]">État</p><p className="text-sm font-bold text-[#111]">{selectedLot.etat}</p></div>
            </div>
          </div>

          {/* Véhicules du lot */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#111] mb-3">Véhicules du lot ({selectedLot.vehicules.length})</h3>
            <div className="space-y-2">
              {selectedLot.vehicules.map((v, i) => (
                <div key={i} className="rounded-xl border border-[#E5E7EB] p-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F3EF] text-lg shrink-0">🚗</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#111]">{v.marque} {v.modele}</p>
                    <p className="text-[10px] text-[#6B7280]">{v.annee} · {v.km.toLocaleString("fr-FR")} km</p>
                    <p className="text-[10px] text-amber-600 font-semibold">{v.etat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div className="rounded-2xl bg-[#F5F3EF] border border-[#E5E7EB] p-5">
            <h3 className="text-sm font-bold text-[#111] mb-2">Conditions de vente</h3>
            <ul className="space-y-1.5">
              {[
                "Vente en l'état — sans garantie",
                "Enlèvement sous 72h après adjudication",
                "Paiement intégral avant enlèvement",
                "Frais de dossier : 150 € HT par lot",
                "Véhicule vendu sans contrôle technique",
                "Visite sur rendez-vous uniquement",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2 text-xs text-[#6B7280]">
                  <Info size={10} className="text-[#9CA3AF] mt-0.5 shrink-0" /> {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Confirmation enchère */}
        {showBidConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBidConfirm(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-extrabold text-[#111]">Confirmer votre enchère</h3>
                <button onClick={() => setShowBidConfirm(false)}><X size={20} className="text-[#9CA3AF]" /></button>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 text-center mb-4">
                <p className="text-sm text-purple-600">Votre enchère</p>
                <p className="text-3xl font-black text-purple-700">{Number(enchereInput).toLocaleString("fr-FR")} €</p>
              </div>
              <p className="text-sm text-[#111] font-bold mb-1">{selectedLot.titre}</p>
              <p className="text-xs text-[#6B7280] mb-4">{selectedLot.etat}</p>
              <div className="space-y-2">
                <button className="w-full rounded-xl bg-purple-700 py-3 text-sm font-bold text-white hover:bg-purple-800"
                  onClick={() => { setShowBidConfirm(false); setEnchereInput(""); }}>
                  Confirmer l'enchère
                </button>
                <button className="w-full rounded-xl border border-[#E5E7EB] py-3 text-sm font-semibold text-[#6B7280]" onClick={() => setShowBidConfirm(false)}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
