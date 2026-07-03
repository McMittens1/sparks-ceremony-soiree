import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Admin sign-in" },
    { name: "robots", content: "noindex,nofollow" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(t.auth.err); setLoading(false); return; }
    nav({ to: "/_authenticated/admin" as string });
  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24">
      <Reveal>
        <h1 className="font-serif text-4xl text-primary">{t.auth.title}</h1>
      </Reveal>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.email}</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.password}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button type="submit" disabled={loading} className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {loading ? t.common.loading : t.auth.submit}
        </button>
      </form>
    </div>
  );
}
