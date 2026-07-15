import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SITE } from "@/lib/site";
import { buildMeta } from "@/lib/seo";
import { LanguageProvider } from "@/i18n/context";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Spine } from "@/components/site/Spine";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif italic text-6xl" style={{ color: "#2A2520" }}>404</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page isn't part of our story.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center border px-5 py-2 text-sm uppercase"
            style={{ borderColor: "#2A2520", color: "#2A2520", letterSpacing: "0.2em", fontSize: 11 }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif italic text-2xl text-foreground">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please refresh the page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="border px-5 py-2 text-sm uppercase bg-ink text-ivory"
            style={{ borderColor: "#2A2520", background: "#2A2520", color: "#F8F4EC", letterSpacing: "0.2em", fontSize: 11 }}
          >
            Try again
          </button>
          <a
            href="/"
            className="border px-5 py-2 text-sm uppercase"
            style={{ borderColor: "#2A2520", color: "#2A2520", letterSpacing: "0.2em", fontSize: 11 }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    // Only the meta half of buildMeta() is used here — the canonical link is
    // deliberately left to each leaf route. TanStack Router de-dupes meta
    // tags by name/property (child wins), but link tags are only de-duped by
    // exact equality, so a root-level canonical would render *alongside*
    // (not instead of) a more specific one from the active route.
    const { meta } = buildMeta({
      title: "Geovanni & Addison · October 10, 2026",
      description:
        "The wedding website for Geovanni Moreno & Addison Hillman. Schedule, travel, registry, and RSVP for October 10, 2026 at Sparks' Barn, Louisville, NE.",
      image:
        "https://storage.googleapis.com/gpt-engineer-file-uploads/QgOLQ93F1TPGT6HHK39DmJ7E6bY2/social-images/social-1783945112817-IMG_1610.webp",
      url: SITE.siteUrl,
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...meta,
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500;1,600&family=Work+Sans:wght@400;500;600;700&display=swap",
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isRsvp = location.pathname === "/rsvp";

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {isHome && (
          <div className="hidden xl:block">
            <Spine />
          </div>
        )}
        <div
          className={`min-h-screen flex flex-col ${isHome ? "xl:ml-[52px]" : ""}`}
        >
          <a href="#main-content" className="skip-link">Skip to main content</a>
          {!isRsvp && <Header />}
          <main id="main-content" tabIndex={-1} className="flex-1"><Outlet /></main>
          {!isRsvp && <Footer />}
        </div>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

