import { useState, useRef, useEffect } from "react";
import { X, Download, Printer, Send, CheckCircle, PenTool, RotateCcw } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   COMPOSANTS PDF VISUELS — Facture, Devis, Contrat
   Style papier A4 professionnel avec header MKA.P-MS,
   lignes détaillées, TVA, total, mentions légales.
   + Signature électronique (canvas tactile)
   ══════════════════════════════════════════════════════════════════ */

// ───── Types ─────
export interface LigneDocument {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tva?: number;
}

export interface DocumentData {
  ref: string;
  type: "facture" | "devis" | "contrat";
  date: string;
  dateEcheance?: string;
  validite?: string;
  client: { nom: string; adresse?: string; email?: string; tel?: string; siret?: string };
  lignes: LigneDocument[];
  remise?: number;
  mentionsLegales?: string;
  conditions?: string;
  objet?: string;
  statut?: string;
  dureeContrat?: string;
  clauseResiliation?: string;
}

// ───── Signature Pad ─────
export function SignaturePad({ onSign, onClear }: { onSign: (dataUrl: string) => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function endDraw() {
    setDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSign(canvasRef.current.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onClear();
  }

  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold text-[#6B7280] mb-1 flex items-center gap-1"><PenTool size={10} /> Signature electronique</p>
      <div className="relative rounded-xl border-2 border-dashed border-[#D4AF37]/40 bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-24 cursor-crosshair touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {!hasDrawn && <p className="absolute inset-0 flex items-center justify-center text-[10px] text-[#9CA3AF] pointer-events-none">Signez ici</p>}
      </div>
      {hasDrawn && (
        <button onClick={clear} className="mt-1 text-[9px] text-red-500 font-bold flex items-center gap-1"><RotateCcw size={10} /> Effacer</button>
      )}
    </div>
  );
}

// ───── Format helpers ─────
function eur(v: number) { return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR"; }
function today() { return new Date().toLocaleDateString("fr-FR"); }

// ───── PDF Layout Header ─────
function PDFHeader({ type, ref: docRef }: { type: string; ref: string }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-xl font-black text-[#111] tracking-tight">MKA.P-MS</h2>
        <p className="text-[8px] text-[#6B7280] leading-relaxed mt-0.5">
          Auto Plus Africa<br />
          SIRET : 123 456 789 00012<br />
          TVA : FR 12 345678901<br />
          12 Avenue des Champs-Elysees, 75008 Paris
        </p>
      </div>
      <div className="text-right">
        <div className={`inline-block rounded-lg px-3 py-1 text-xs font-black ${type === "facture" ? "bg-blue-50 text-blue-700" : type === "devis" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
          {type === "facture" ? "FACTURE" : type === "devis" ? "DEVIS" : "CONTRAT"}
        </div>
        <p className="text-[10px] font-bold text-[#111] mt-1">{docRef}</p>
      </div>
    </div>
  );
}

// ───── Full Document View ─────
export function DocumentView({ doc, onClose }: { doc: DocumentData; onClose: () => void }) {
  const [signed, setSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const totalHT = doc.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const remise = doc.remise || 0;
  const totalApresRemise = totalHT - remise;
  const tvaRate = doc.lignes[0]?.tva ?? 20;
  const tva = totalApresRemise * tvaRate / 100;
  const totalTTC = totalApresRemise + tva;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-[#F5F3EF] w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white/80 grid place-items-center shadow"><X size={16} /></button>

        {/* ── Paper ── */}
        <div className="m-3 sm:m-4 bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
          {/* Gold top bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#B8962E] to-[#D4AF37]" />

          <div className="p-4 sm:p-6">
            <PDFHeader type={doc.type} ref={doc.ref} />

            {/* Dates */}
            <div className="flex gap-4 text-[9px] text-[#6B7280] mb-4">
              <div><span className="font-bold text-[#111]">Date :</span> {doc.date}</div>
              {doc.dateEcheance && <div><span className="font-bold text-[#111]">Echeance :</span> {doc.dateEcheance}</div>}
              {doc.validite && <div><span className="font-bold text-[#111]">Validite :</span> {doc.validite}</div>}
            </div>

            {/* Client info */}
            <div className="rounded-lg bg-[#F5F3EF] p-3 mb-4">
              <p className="text-[8px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">{doc.type === "contrat" ? "Parties" : "Facturer a"}</p>
              <p className="text-xs font-bold text-[#111]">{doc.client.nom}</p>
              {doc.client.adresse && <p className="text-[9px] text-[#6B7280]">{doc.client.adresse}</p>}
              <div className="flex gap-3 mt-1 flex-wrap">
                {doc.client.email && <p className="text-[8px] text-[#6B7280]">{doc.client.email}</p>}
                {doc.client.tel && <p className="text-[8px] text-[#6B7280]">{doc.client.tel}</p>}
                {doc.client.siret && <p className="text-[8px] text-[#6B7280]">SIRET: {doc.client.siret}</p>}
              </div>
            </div>

            {/* Objet */}
            {doc.objet && (
              <div className="mb-3">
                <p className="text-[8px] font-bold text-[#D4AF37] uppercase tracking-widest">Objet</p>
                <p className="text-xs text-[#111] font-semibold">{doc.objet}</p>
              </div>
            )}

            {/* Duree contrat */}
            {doc.dureeContrat && (
              <div className="mb-3">
                <p className="text-[8px] font-bold text-[#D4AF37] uppercase tracking-widest">Duree du contrat</p>
                <p className="text-xs text-[#111]">{doc.dureeContrat}</p>
              </div>
            )}

            {/* Table lignes */}
            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden mb-4">
              <div className="bg-[#111] grid grid-cols-12 gap-1 px-3 py-2">
                <div className="col-span-5 text-[8px] font-bold text-[#D4AF37] uppercase">Designation</div>
                <div className="col-span-2 text-[8px] font-bold text-[#D4AF37] uppercase text-center">Qte</div>
                <div className="col-span-2 text-[8px] font-bold text-[#D4AF37] uppercase text-right">P.U. HT</div>
                <div className="col-span-3 text-[8px] font-bold text-[#D4AF37] uppercase text-right">Total HT</div>
              </div>
              {doc.lignes.map((l, i) => (
                <div key={i} className={`grid grid-cols-12 gap-1 px-3 py-2 ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"} border-t border-[#E5E7EB]`}>
                  <div className="col-span-5 text-[9px] text-[#111] font-medium">{l.designation}</div>
                  <div className="col-span-2 text-[9px] text-[#6B7280] text-center">{l.quantite}</div>
                  <div className="col-span-2 text-[9px] text-[#6B7280] text-right">{eur(l.prixUnitaire)}</div>
                  <div className="col-span-3 text-[9px] text-[#111] font-bold text-right">{eur(l.quantite * l.prixUnitaire)}</div>
                </div>
              ))}
            </div>

            {/* Totaux */}
            <div className="ml-auto w-56 space-y-1 mb-4">
              <div className="flex justify-between text-[9px]"><span className="text-[#6B7280]">Total HT</span><span className="font-bold text-[#111]">{eur(totalHT)}</span></div>
              {remise > 0 && <div className="flex justify-between text-[9px]"><span className="text-[#6B7280]">Remise</span><span className="font-bold text-red-500">-{eur(remise)}</span></div>}
              <div className="flex justify-between text-[9px]"><span className="text-[#6B7280]">TVA ({tvaRate}%)</span><span className="font-bold text-[#111]">{eur(tva)}</span></div>
              <div className="flex justify-between text-xs border-t-2 border-[#D4AF37] pt-1 mt-1"><span className="font-black text-[#111]">Total TTC</span><span className="font-black text-[#D4AF37] text-base">{eur(totalTTC)}</span></div>
            </div>

            {/* Conditions / clause contrat */}
            {doc.conditions && (
              <div className="rounded-lg bg-[#F5F3EF] p-3 mb-3">
                <p className="text-[8px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Conditions</p>
                <p className="text-[9px] text-[#6B7280] leading-relaxed whitespace-pre-line">{doc.conditions}</p>
              </div>
            )}

            {doc.clauseResiliation && (
              <div className="rounded-lg bg-red-50 p-3 mb-3">
                <p className="text-[8px] font-bold text-red-600 uppercase tracking-widest mb-1">Clause de resiliation</p>
                <p className="text-[9px] text-red-800 leading-relaxed">{doc.clauseResiliation}</p>
              </div>
            )}

            {/* Mentions legales */}
            <div className="border-t border-[#E5E7EB] pt-3 mb-3">
              <p className="text-[7px] text-[#9CA3AF] leading-relaxed">
                {doc.mentionsLegales || (
                  doc.type === "facture"
                    ? "En cas de retard de paiement, une penalite de 3 fois le taux d'interet legal sera appliquee, ainsi qu'une indemnite forfaitaire de 40 EUR pour frais de recouvrement. Pas d'escompte en cas de paiement anticipe. TVA non applicable, art. 293 B du CGI (si applicable)."
                    : doc.type === "devis"
                    ? "Ce devis est valable pour la duree indiquee. Tout devis signe vaut bon de commande. Le client s'engage a regler le montant total a la reception de la facture. Les travaux supplementaires feront l'objet d'un devis complementaire."
                    : "Le present contrat est regi par le droit francais. En cas de litige, les parties conviennent de rechercher une solution amiable avant toute action judiciaire. Les tribunaux de Paris seront seuls competents."
                )}
              </p>
            </div>

            {/* Signature section */}
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-[8px] font-bold text-[#6B7280] uppercase mb-1">MKA.P-MS (emetteur)</p>
                <div className="h-16 rounded-lg bg-[#F5F3EF] border border-[#E5E7EB] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs font-black text-[#D4AF37] italic">MKA.P-MS</p>
                    <p className="text-[7px] text-[#9CA3AF]">Signe electroniquement</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[8px] font-bold text-[#6B7280] uppercase mb-1">{doc.client.nom} (client)</p>
                {signed && signatureData ? (
                  <div className="h-16 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center relative">
                    <img src={signatureData} alt="Signature" className="max-h-14 max-w-full" />
                    <CheckCircle size={12} className="absolute top-1 right-1 text-green-500" />
                  </div>
                ) : (
                  <div className="h-16 rounded-lg border-2 border-dashed border-[#E5E7EB] flex items-center justify-center">
                    <p className="text-[8px] text-[#9CA3AF]">En attente de signature</p>
                  </div>
                )}
              </div>
            </div>

            {/* Signature Pad for contracts */}
            {doc.type === "contrat" && !signed && (
              <SignaturePad
                onSign={(dataUrl) => setSignatureData(dataUrl)}
                onClear={() => setSignatureData(null)}
              />
            )}

            {/* Date + page */}
            <div className="flex justify-between mt-4 text-[7px] text-[#9CA3AF]">
              <span>Document genere le {today()}</span>
              <span>Page 1/1</span>
            </div>
          </div>

          {/* Gold bottom bar */}
          <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#B8962E] to-[#D4AF37]" />
        </div>

        {/* Actions */}
        <div className="px-3 sm:px-4 pb-4 space-y-2">
          {doc.type === "contrat" && !signed && signatureData && (
            <button onClick={() => { setSigned(true); showToast("Contrat signe electroniquement !"); }} className="w-full rounded-xl bg-green-500 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition"><PenTool size={16} /> Valider la signature</button>
          )}
          <div className="flex gap-2">
            <button onClick={() => showToast("Impression lancee")} className="flex-1 rounded-xl bg-[#D4AF37] py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><Printer size={14} /> Imprimer</button>
            <button onClick={() => showToast(`PDF ${doc.ref} telecharge`)} className="flex-1 rounded-xl bg-[#111] py-2.5 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1 active:scale-[0.97]"><Download size={14} /> PDF</button>
            <button onClick={() => { setLinkCopied(true); navigator.clipboard.writeText(`https://mkapms.co/doc/${doc.ref}`).catch(() => {}); showToast("Lien de signature copie !"); setTimeout(() => setLinkCopied(false), 2000); }} className="flex-1 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-[0.97]"><Send size={14} /> {linkCopied ? "Copie !" : "Envoyer"}</button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[90%]">
            <div className="rounded-xl bg-[#111] px-4 py-3 text-xs font-bold text-white shadow-xl flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400 shrink-0" />
              <span>{toast}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───── Helper: build document data from a basic facture ─────
export function buildFactureData(f: { ref: string; objet: string; client: string; montant: string; date: string; statut: string; type: string }): DocumentData {
  const montantNum = Math.abs(parseFloat(f.montant.replace(/[^\d,-]/g, "").replace(",", "."))) || 0;
  return {
    ref: f.ref,
    type: "facture",
    date: f.date,
    dateEcheance: f.statut === "En attente" ? "30 jours" : undefined,
    client: { nom: f.client, adresse: "Adresse client", email: `${f.client.toLowerCase().replace(/[^a-z]/g, "")}@email.com` },
    objet: f.objet,
    statut: f.statut,
    lignes: [{ designation: f.objet, quantite: 1, prixUnitaire: montantNum / 1.2, tva: 20 }],
  };
}

export function buildDevisData(d: { id?: number; type: string; garage?: string; montant: string; date: string; vehicule?: string; client?: string; ref?: string }): DocumentData {
  const montantNum = Math.abs(parseFloat(d.montant.replace(/[^\d,-]/g, "").replace(",", "."))) || 0;
  return {
    ref: d.ref || `DV-${d.date.replace(/\//g, "")}`,
    type: "devis",
    date: d.date,
    validite: "30 jours",
    client: { nom: d.client || d.garage || "Client", adresse: "Adresse client" },
    objet: d.type + (d.vehicule ? ` — ${d.vehicule}` : ""),
    lignes: [
      { designation: d.type, quantite: 1, prixUnitaire: montantNum * 0.6 / 1.2, tva: 20 },
      { designation: "Main d'oeuvre", quantite: 1, prixUnitaire: montantNum * 0.3 / 1.2, tva: 20 },
      { designation: "Fournitures et consommables", quantite: 1, prixUnitaire: montantNum * 0.1 / 1.2, tva: 20 },
    ],
    conditions: "Devis gratuit et sans engagement.\nValidite : 30 jours a compter de la date d'emission.\nTout devis signe vaut bon de commande.\nPaiement a la reception de la facture.",
  };
}

export function buildContratData(c: { vehicule?: string; client: string; type?: string; duree?: string; prix?: string; ref?: string; agence?: string; debut?: string; fin?: string }): DocumentData {
  const montantNum = Math.abs(parseFloat((c.prix || "0").replace(/[^\d,-]/g, "").replace(",", "."))) || 0;
  return {
    ref: c.ref || `CTR-${Date.now()}`,
    type: "contrat",
    date: c.debut || new Date().toLocaleDateString("fr-FR"),
    client: { nom: c.client, adresse: "Adresse du client" },
    objet: c.vehicule ? `Contrat de ${c.type || "location"} — ${c.vehicule}` : `Contrat ${c.type || "de service"}`,
    dureeContrat: c.duree || (c.debut && c.fin ? `Du ${c.debut} au ${c.fin}` : "12 mois"),
    lignes: [
      { designation: c.vehicule ? `${c.type || "Location"} ${c.vehicule}` : "Prestation de service", quantite: 1, prixUnitaire: montantNum / 1.2, tva: 20 },
      { designation: "Assurance tous risques", quantite: 1, prixUnitaire: montantNum * 0.1 / 1.2, tva: 20 },
      { designation: "Frais de dossier", quantite: 1, prixUnitaire: 25, tva: 20 },
    ],
    conditions: "Le present contrat prend effet a la date de signature par les deux parties.\nLe vehicule doit etre restitue dans l'etat dans lequel il a ete remis.\nToute degradation fera l'objet d'une facturation supplementaire.\nLe paiement s'effectue selon les modalites convenues.",
    clauseResiliation: "Chaque partie peut resilier le contrat avec un preavis de 30 jours par lettre recommandee avec accuse de reception. En cas de resiliation anticipee par le client, une indemnite equivalente a 2 mois de loyer sera due.",
  };
}
