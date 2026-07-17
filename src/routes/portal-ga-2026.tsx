import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { claimAdminIfFirst } from "@/lib/admin.functions";
import { SITE } from "@/lib/site";
import { buildMeta } from "@/lib/seo";


export const Route = createFileRoute("/portal-ga-2026")({
  ssr: false,
  head: () =>
    buildMeta({
      title: "Admin sign-in",
      description: "Private sign-in page for wedding site administrators.",
      url: `${SITE.siteUrl}/portal-ga-2026`,
      robots: "noindex,nofollow",
    }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const nav = useNavigate();
  const claim = useServerFn(claimAdminIfFirst);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        nav({ to: "/portal-ga-2026/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, [nav]);

  async function goAdmin() {
    try {
      await claim();
      nav({ to: "/portal-ga-2026/dashboard" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t.rsvp.errGeneric);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    await goAdmin();
  }

  if (checking) {
    return <div className="mx-auto max-w-md px-4 sm:px-6 py-24 text-center text-muted-foreground text-sm">…</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Private</p>
        <h1 className="mt-3 font-serif text-4xl text-primary">{t.auth.title}</h1>
      </Reveal>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.email}</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.password}</span>
          <input type="password" autoComplete="current-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {loading ? t.common.loading : t.auth.submit}
        </button>
      </form>
    </div>
  );
}
