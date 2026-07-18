import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe · Geovanni & Addison" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`);
        const body = await res.json();
        if (body.valid) setState({ kind: "ready" });
        else if (body.reason === "already_unsubscribed") setState({ kind: "already" });
        else setState({ kind: "invalid" });
      } catch {
        setState({ kind: "error", message: "Couldn't reach the server." });
      }
    })();
  }, [token]);

  async function confirm() {
    if (!token) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (body.success) setState({ kind: "done" });
      else if (body.reason === "already_unsubscribed") setState({ kind: "already" });
      else setState({ kind: "error", message: body.error ?? "Something went wrong." });
    } catch {
      setState({ kind: "error", message: "Couldn't reach the server." });
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-ivory, #F8F4EC)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          width: 480,
          maxWidth: "100%",
          border: "1px solid var(--color-hairline, #E1D6C3)",
          background: "#FFFFFF",
          padding: "48px 44px",
          textAlign: "center",
          boxShadow: "0 30px 60px -40px rgba(42,37,32,0.25)",
        }}
      >
        <p
          className="uppercase font-sans"
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#8A7A5C",
            margin: "0 0 14px",
          }}
        >
          Geovanni &amp; Addison
        </p>
        <h1
          className="font-serif italic"
          style={{ fontSize: 30, color: "#2A2520", margin: "0 0 16px", lineHeight: 1.2 }}
        >
          {title(state)}
        </h1>
        <p style={{ fontSize: 15, color: "#4A4238", lineHeight: 1.7, margin: "0 0 26px" }}>
          {body(state)}
        </p>
        {state.kind === "ready" && (
          <button
            onClick={confirm}
            className="uppercase font-sans"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              background: "#2A2520",
              color: "#F8F4EC",
              border: "none",
              fontSize: 11,
              letterSpacing: "0.24em",
              cursor: "pointer",
            }}
          >
            Confirm unsubscribe
          </button>
        )}
        {state.kind === "submitting" && (
          <p style={{ color: "#7A6F5F", fontSize: 13 }}>Working…</p>
        )}
      </div>
    </div>
  );
}

function title(s: State): string {
  switch (s.kind) {
    case "loading":
    case "submitting":
      return "One moment…";
    case "ready":
      return "Unsubscribe?";
    case "done":
      return "You're unsubscribed.";
    case "already":
      return "Already unsubscribed.";
    case "invalid":
      return "This link isn't valid.";
    case "error":
      return "Something went wrong.";
  }
}

function body(s: State): string {
  switch (s.kind) {
    case "loading":
      return "Checking your link.";
    case "submitting":
      return "Removing you from our list.";
    case "ready":
      return "You'll stop receiving emails from our wedding site.";
    case "done":
      return "We won't email you again. Sorry to see you go.";
    case "already":
      return "This address has already been removed from our list.";
    case "invalid":
      return "The unsubscribe link is missing or expired. If you'd like to be removed, reply to any of our emails.";
    case "error":
      return s.message;
  }
}
