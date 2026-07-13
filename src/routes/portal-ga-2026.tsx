import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { Reveal } from "@/components/site/Reveal";
import { claimAdminIfFirst } from "@/lib/admin.functions";


export const Route = createFileRoute("/portal-ga-2026")({
  head: () => ({ meta: [
    { title: "Admin sign-in" },
    { name: "robots", content: "noindex,nofollow" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const nav = useNavigate();
  const claim = useServerFn(claimAdminIfFirst);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function goAdmin() {
    try { await claim(); } catch {}
    nav({ to: "/admin" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setLoading(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/auth" },
      });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      if (data.session) {
        await goAdmin();
      } else {
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      }
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    await goAdmin();

  }

  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-24">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">Private</p>
        <h1 className="mt-3 font-serif text-4xl text-primary">
          {mode === "signup" ? "Create admin account" : t.auth.title}
        </h1>
      </Reveal>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.email}</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t.auth.password}</span>
          <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-sm border border-input bg-background px-3 py-2" />
        </label>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {loading ? t.common.loading : mode === "signup" ? "Create account" : t.auth.submit}
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setErr(null); setInfo(null); setMode(mode === "signup" ? "signin" : "signup"); }}
        className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary"
      >
        {mode === "signup" ? "Have an account? Sign in" : "Need an account? Create one"}
      </button>
    </div>
  );
}
