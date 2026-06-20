import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Search, Car, CheckCircle, Cog, Settings,
  Disc, Thermometer, Wind, Fuel, Gauge, Zap, Shield,
  CircuitBoard, Battery, Lightbulb, LifeBuoy, ShoppingBag,
  Plus, ChevronRight, Download
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   CATALOGUE TECHNIQUE STANDALONE — Type AutoData
   Accessible depuis la page principale. Recherche plaque/VIN.
   Tous vehicules (anciens, recents), tous types, tous systemes.
   ══════════════════════════════════════════════════════════════════════════ */

const SYSTEMS_ALL = [
  // MECANIQUES
  { id: "moteur", label: "Moteur", cat: "Mecanique", icon: Cog, color: "text-red-500" },
  { id: "distribution", label: "Distribution", cat: "Mecanique", icon: Settings, color: "text-orange-500" },
  { id: "embrayage", label: "Embrayage", cat: "Mecanique", icon: Disc, color: "text-amber-600" },
  { id: "boite", label: "Boite de vitesses", cat: "Mecanique", icon: Settings, color: "text-yellow-600" },
  { id: "freinage", label: "Freinage", cat: "Mecanique", icon: LifeBuoy, color: "text-blue-500" },
  { id: "direction", label: "Direction", cat: "Mecanique", icon: LifeBuoy, color: "text-indigo-500" },
  { id: "suspension", label: "Suspension", cat: "Mecanique", icon: Settings, color: "text-violet-500" },
  { id: "refroidissement", label: "Refroidissement", cat: "Mecanique", icon: Thermometer, color: "text-cyan-500" },
  { id: "echappement", label: "Echappement", cat: "Mecanique", icon: Wind, color: "text-slate-500" },
  { id: "alimentation", label: "Alimentation carburant", cat: "Mecanique", icon: Fuel, color: "text-green-600" },
  { id: "turbo", label: "Turbo / Compresseur", cat: "Mecanique", icon: Gauge, color: "text-rose-500" },
  // ELECTRONIQUES
  { id: "injection", label: "Injection", cat: "Electronique", icon: Zap, color: "text-purple-500" },
  { id: "allumage", label: "Allumage", cat: "Electronique", icon: Zap, color: "text-pink-500" },
  { id: "abs_esp", label: "ABS / ESP / TC", cat: "Electronique", icon: Shield, color: "text-blue-600" },
  { id: "airbags", label: "Airbags / SRS", cat: "Electronique", icon: Shield, color: "text-red-600" },
  { id: "climatisation", label: "Climatisation", cat: "Electronique", icon: Thermometer, color: "text-sky-500" },
  { id: "tableau_bord", label: "Tableau de bord", cat: "Electronique", icon: Gauge, color: "text-emerald-500" },
  { id: "capteurs", label: "Capteurs", cat: "Electronique", icon: CircuitBoard, color: "text-teal-500" },
  { id: "calculateurs", label: "Calculateurs (ECU)", cat: "Electronique", icon: CircuitBoard, color: "text-fuchsia-500" },
  { id: "multiplexage", label: "CAN / LIN / MOST", cat: "Electronique", icon: CircuitBoard, color: "text-lime-600" },
  { id: "diagnostic", label: "Diagnostic OBD", cat: "Electronique", icon: Search, color: "text-gray-500" },
  // ELECTRIQUES
  { id: "batterie", label: "Batterie", cat: "Electrique", icon: Battery, color: "text-green-500" },
  { id: "alternateur", label: "Alternateur", cat: "Electrique", icon: Zap, color: "text-amber-500" },
  { id: "demarreur", label: "Demarreur", cat: "Electrique", icon: Zap, color: "text-orange-600" },
  { id: "eclairage", label: "Eclairage", cat: "Electrique", icon: Lightbulb, color: "text-yellow-500" },
  { id: "fusibles", label: "Fusibles / Relais", cat: "Electrique", icon: Settings, color: "text-gray-500" },
  { id: "cablage", label: "Cablage / Faisceaux", cat: "Electrique", icon: CircuitBoard, color: "text-gray-600" },
  // CARROSSERIE
  { id: "dimensions", label: "Dimensions", cat: "Carrosserie", icon: Car, color: "text-blue-400" },
  { id: "poids", label: "Poids", cat: "Carrosserie", icon: Settings, color: "text-slate-400" },
  { id: "vitrage", label: "Vitrage", cat: "Carrosserie", icon: Settings, color: "text-sky-400" },
  { id: "ouvrants", label: "Ouvrants / Serrures", cat: "Carrosserie", icon: Settings, color: "text-indigo-400" },
];

const CATEGORIES_SYS = ["Mecanique", "Electronique", "Electrique", "Carrosserie"];

const DEMO_DATA: Record<string, { coupleSerrage: { piece: string; valeur: string; outil: string }[]; tempsBaremes: { operation: string; temps: string; difficulte: string; outilSpecial?: string }[]; pieces: { nom: string; ref: string; prix: string; dispo: boolean }[] }> = {
  moteur: {
    coupleSerrage: [
      { piece: "Culasse (vis)", valeur: "40 Nm + 90° + 90°", outil: "Cle dynamometrique + rapporteur" },
      { piece: "Bielle (chapeau)", valeur: "30 Nm + 45°", outil: "Cle dynamometrique + rapporteur" },
      { piece: "Palier vilebrequin", valeur: "25 Nm + 60°", outil: "Cle dynamometrique" },
      { piece: "Bougie allumage", valeur: "25 Nm", outil: "Cle a bougie 16mm" },
      { piece: "Injecteur (bride)", valeur: "9 Nm", outil: "Cle dynamometrique" },
      { piece: "Carter huile", valeur: "10 Nm", outil: "Douille Torx T30" },
      { piece: "Couvre-culasse", valeur: "8 Nm", outil: "Douille Torx T25" },
      { piece: "Collecteur admission", valeur: "20 Nm", outil: "Douille 13mm" },
      { piece: "Collecteur echappement", valeur: "25 Nm", outil: "Douille 15mm" },
      { piece: "Bouchon vidange", valeur: "35 Nm", outil: "Cle carre 8mm" },
      { piece: "Support moteur (AV)", valeur: "55 Nm", outil: "Douille 18mm" },
      { piece: "Support moteur (AR)", valeur: "65 Nm", outil: "Douille 18mm + allonge" },
    ],
    tempsBaremes: [
      { operation: "Vidange + filtre huile", temps: "0.5h", difficulte: "Facile", outilSpecial: "Cle filtre a sangle" },
      { operation: "Remplacement bougies x4", temps: "0.8h", difficulte: "Facile", outilSpecial: "Cle a bougie magnetique 16mm" },
      { operation: "Distribution complete", temps: "4.5h", difficulte: "Expert", outilSpecial: "Kit calage PSA EP6" },
      { operation: "Joints de culasse", temps: "6.0h", difficulte: "Expert", outilSpecial: "Extracteur + kit calage" },
      { operation: "Remplacement turbo", temps: "3.5h", difficulte: "Avance", outilSpecial: "Cle a pipe longue 10/13mm" },
      { operation: "Injecteurs x4", temps: "2.0h", difficulte: "Avance", outilSpecial: "Extracteur injecteur" },
      { operation: "Pompe a eau", temps: "2.5h", difficulte: "Moyen" },
      { operation: "Courroie accessoire", temps: "0.7h", difficulte: "Facile" },
      { operation: "Support moteur (AV)", temps: "1.5h", difficulte: "Moyen", outilSpecial: "Verin de fosse" },
      { operation: "Joint carter huile", temps: "3.0h", difficulte: "Avance" },
      { operation: "Capteur PMH", temps: "0.5h", difficulte: "Facile" },
      { operation: "Sonde lambda AV", temps: "0.8h", difficulte: "Moyen", outilSpecial: "Cle sonde lambda 22mm" },
    ],
    pieces: [
      { nom: "Bougie allumage", ref: "PSA 9806 043 880", prix: "12 EUR", dispo: true },
      { nom: "Filtre a huile", ref: "PSA 1109 CK", prix: "15 EUR", dispo: true },
      { nom: "Filtre a air", ref: "PSA 1444 TT", prix: "22 EUR", dispo: true },
      { nom: "Injecteur", ref: "Continental A2C59517051", prix: "195 EUR", dispo: false },
      { nom: "Bobine allumage", ref: "PSA 9808 653 680", prix: "58 EUR", dispo: true },
      { nom: "Kit distribution", ref: "Gates KP15606XS", prix: "185 EUR", dispo: true },
      { nom: "Pompe a eau", ref: "SKF VKPC 83649", prix: "89 EUR", dispo: true },
      { nom: "Thermostat", ref: "PSA 1336 Z7", prix: "42 EUR", dispo: false },
      { nom: "Capteur PMH", ref: "PSA 1920 LS", prix: "35 EUR", dispo: true },
      { nom: "Turbo complet", ref: "Garrett 784011-5005S", prix: "890 EUR", dispo: false },
      { nom: "Joint culasse", ref: "Elring 150.131", prix: "78 EUR", dispo: true },
      { nom: "Kit embrayage", ref: "Valeo 826 818", prix: "420 EUR", dispo: true },
      { nom: "Sonde lambda", ref: "Bosch 0 258 017 217", prix: "85 EUR", dispo: true },
      { nom: "Courroie accessoire", ref: "Gates 6PK1078", prix: "25 EUR", dispo: true },
      { nom: "Galet tendeur", ref: "INA F-553470", prix: "45 EUR", dispo: true },
    ],
  },
};

export default function CatalogueTechnique() {
  const [plaque, setPlaque] = useState("");
  const [found, setFound] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState("moteur");
  const [catFilter, setCatFilter] = useState("Mecanique");

  const doSearch = () => { if (plaque.trim().length >= 3) setFound(true); };
  const data = DEMO_DATA["moteur"];
  const filteredSystems = SYSTEMS_ALL.filter((s) => s.cat === catFilter);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-r from-[#111] to-[#1a1a2e] px-4 pt-6 pb-5">
        <Link to="/atelier-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Atelier Pro</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Catalogue Technique</h1>
        <p className="mt-0.5 text-sm text-white/60">Type AutoData — Tous vehicules, tous systemes, toutes references</p>
      </div>

      {/* Recherche */}
      <div className="px-4 mt-4">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <p className="text-xs text-slate-500 mb-3">Recherche par plaque d'immatriculation ou numero VIN</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <span className="text-[9px] font-bold text-white bg-blue-600 px-1 rounded">F</span>
              </div>
              <input
                type="text"
                value={plaque}
                onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                placeholder="AB-123-CD ou VF3MCYHZRML..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F5F3EF] pl-10 pr-3 py-3 text-sm font-bold text-center tracking-widest uppercase"
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
              />
            </div>
            <button onClick={doSearch} className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-white"><Search size={16} /></button>
          </div>
        </div>
      </div>

      {found && (
        <div className="px-4 mt-3 space-y-3">
          {/* Vehicule identifie */}
          <div className="rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a2e] p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-sm font-bold text-green-400">Vehicule identifie automatiquement</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {[
                ["Marque", "Peugeot"], ["Modele", "3008 GT"], ["Version", "1.6 PureTech 225 Hybrid4 EAT8"],
                ["Annee", "2024"], ["Code moteur", "EP6FADTX"], ["Cylindree", "1 598 cm3"],
                ["Puissance", "225 ch / 165 kW"], ["Couple max", "300 Nm a 3 000 tr/min"], ["Norme", "Euro 6d-ISC-FCM"],
                ["Transmission", "BVA 8 rapports EAT8"], ["Architecture", "4 cylindres en ligne"], ["Injection", "Directe haute pression"],
                ["Poids a vide", "1 880 kg"], ["PTAC", "2 280 kg"], ["Dimensions", "4 447 x 1 841 x 1 620 mm"],
                ["Empattement", "2 675 mm"], ["Reservoir", "53 litres"], ["Batterie hybride", "13.2 kWh"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/40">{l}</span>
                  <span className="font-bold text-white text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories systemes */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES_SYS.map((c) => (
              <button key={c} onClick={() => { setCatFilter(c); setSelectedSystem(SYSTEMS_ALL.find((s) => s.cat === c)?.id || "moteur"); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${catFilter === c ? "bg-[#111] text-[#D4AF37]" : "bg-white text-[#6B7280] border border-[#E5E7EB]"}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Systemes dans la categorie */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3">
            <div className="flex flex-wrap gap-1.5">
              {filteredSystems.map((s) => {
                const Icon = s.icon;
                return (
                  <button key={s.id} onClick={() => setSelectedSystem(s.id)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${selectedSystem === s.id ? "bg-[#111] text-[#D4AF37]" : "bg-[#F5F3EF] text-[#6B7280] hover:bg-[#E5E7EB]"}`}>
                    <Icon size={10} className={selectedSystem === s.id ? "text-[#D4AF37]" : s.color} /> {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couples de serrage */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#D4AF37]">Couples de serrage</h3>
              <button className="text-[10px] text-white/40 flex items-center gap-1"><Download size={10} /> PDF</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F5F3EF]">
                  <tr><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Piece</th><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Valeur</th><th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Outil</th></tr>
                </thead>
                <tbody>
                  {data.coupleSerrage.map((c, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-3 py-2 text-slate-600">{c.piece}</td>
                      <td className="px-3 py-2 font-bold text-[#111]">{c.valeur}</td>
                      <td className="px-3 py-2 text-slate-400">{c.outil}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Temps baremes */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Temps baremes & outils speciaux</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F5F3EF]">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Operation</th>
                    <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Temps</th>
                    <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Niveau</th>
                    <th className="px-3 py-1.5 text-left text-[10px] text-slate-500">Outil special</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tempsBaremes.map((t, i) => (
                    <tr key={i} className="border-b border-[#F3F4F6]">
                      <td className="px-3 py-2 text-slate-600">{t.operation}</td>
                      <td className="px-3 py-2 font-bold text-[#111]">{t.temps}</td>
                      <td className="px-3 py-2"><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${t.difficulte === "Expert" ? "bg-red-50 text-red-600" : t.difficulte === "Avance" ? "bg-orange-50 text-orange-600" : t.difficulte === "Moyen" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{t.difficulte}</span></td>
                      <td className="px-3 py-2 text-slate-400">{t.outilSpecial || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pieces detectees — schema cliquable */}
          <div className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <div className="bg-[#111] px-3 py-2">
              <h3 className="text-xs font-bold text-[#D4AF37]">Pieces — cliquez pour commander</h3>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {data.pieces.map((p, i) => (
                <button key={i} className={`rounded-lg border p-2 text-left transition hover:shadow-md ${p.dispo ? "border-green-200 bg-green-50/30 hover:border-green-400" : "border-red-200 bg-red-50/30 hover:border-red-400"}`}>
                  <p className="text-[10px] font-bold text-[#111] leading-tight">{p.nom}</p>
                  <p className="text-[8px] text-slate-400 truncate mt-0.5">{p.ref}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#D4AF37]">{p.prix}</span>
                    <span className={`text-[8px] font-bold ${p.dispo ? "text-green-600" : "text-red-500"}`}>{p.dispo ? "Stock" : "Cmd"}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!found && (
        <div className="px-4 mt-12 text-center">
          <Car size={48} className="mx-auto text-[#D4AF37] opacity-30" />
          <h2 className="mt-4 text-lg font-bold text-[#111]">Trouvez toutes les donnees techniques</h2>
          <p className="mt-2 text-sm text-[#6B7280] max-w-sm mx-auto">Entrez la plaque ou le VIN de n'importe quel vehicule. Le catalogue charge automatiquement toutes les informations techniques, couples de serrage, temps baremes et references pieces.</p>
          <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs mx-auto text-xs">
            {["Tous vehicules", "Anciens & recents", "Motos & quads", "Utilitaires & camions", "26 systemes", "Outils speciaux"].map((t) => (
              <div key={t} className="flex items-center gap-1 rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
                <CheckCircle size={12} className="text-green-500" />
                <span className="text-[#111] font-semibold">{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
