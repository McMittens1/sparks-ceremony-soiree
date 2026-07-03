interface MarqueeProps {
  items: string[];
  className?: string;
}

export function Marquee({ items, className = "" }: MarqueeProps) {
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className={`w-full overflow-hidden py-6 border-y border-accent/30 ${className}`}>
      <div className="flex whitespace-nowrap animate-marquee w-max">
        {repeated.map((t, i) => (
          <span key={i} className="font-serif italic text-5xl sm:text-7xl text-primary/15 px-10 select-none">
            {t}
            <span className="text-accent/50 not-italic mx-6">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
