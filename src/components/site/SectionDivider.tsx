export function SectionDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 py-10 ${className}`} aria-hidden>
      <span className="h-px w-16 bg-primary/40" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-primary/70">
        <path
          d="M12 3c1.2 2.3 3 3.5 5 4-2 .5-3.8 1.7-5 4-1.2-2.3-3-3.5-5-4 2-.5 3.8-1.7 5-4Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="18" r="1.2" fill="currentColor" />
      </svg>
      <span className="h-px w-16 bg-primary/40" />
    </div>
  );
}
