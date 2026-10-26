type MediaAdSlotProps = {
  label?: string;
  dark?: boolean;
};

export default function MediaAdSlot({ label = "Espace partenaire", dark = false }: MediaAdSlotProps) {
  return (
    <aside
      aria-label="Emplacement publicitaire"
      className={`flex min-h-24 flex-col items-center justify-center rounded-3xl border border-dashed px-5 py-5 text-center ${
        dark ? "border-white/15 bg-white/[0.03] text-white/55" : "border-slate-300 bg-white text-slate-500"
      }`}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Emplacement publicitaire</span>
      <span className="mt-1 text-xs">{label}</span>
    </aside>
  );
}
