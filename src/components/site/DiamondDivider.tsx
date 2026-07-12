/** Hairline · diamond · hairline divider motif used to close section headers. */
export function DiamondDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <div className="flex-1 h-px" style={{ background: "#E1D6C3" }} />
      <span
        aria-hidden
        className="flex-shrink-0"
        style={{ width: 6, height: 6, background: "#8779A3", transform: "rotate(45deg)" }}
      />
      <div className="flex-1 h-px" style={{ background: "#E1D6C3" }} />
    </div>
  );
}
