import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/rsvp")({
  head: () => ({ meta: [
    { title: "RSVP · Geo & Addison" },
    { name: "description", content: "Respond to our wedding invitation on The Knot. Please reply by September 15, 2026." },
    { property: "og:title", content: "RSVP · Geo & Addison" },
    { property: "og:description", content: "Respond to our wedding invitation on The Knot." },
  ]}),
  component: RsvpPage,
});

function RsvpPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-primary">October 10, 2026</p>
        <h1 className="mt-2 font-serif text-5xl sm:text-6xl">{t.rsvp.title}</h1>
        <p className="mt-6 text-foreground/70">
          We're using The Knot to collect responses. Tap the button below to open our RSVP page.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t.rsvp.deadlineLine}</p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <a
            href={SITE.rsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm uppercase tracking-[0.25em] text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            RSVP on The Knot
            <span aria-hidden>↗</span>
          </a>
          <p className="text-xs text-muted-foreground">Opens theknot.com in a new tab</p>
        </div>
      </Reveal>
    </div>
  );
}
