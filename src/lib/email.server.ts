// Server-only Brevo email sender for RSVP confirmations.

const GATEWAY = "https://connector-gateway.lovable.dev/brevo";

interface Args {
  to: string;
  language: "en" | "es";
  partyName: string;
  guests: { full_name: string; attending: boolean | null }[];
}

export async function sendRsvpConfirmation(args: Args): Promise<void> {
  const lovable = process.env.LOVABLE_API_KEY;
  const brevo = process.env.BREVO_API_KEY;
  if (!lovable || !brevo) {
    console.warn("Email skipped: missing gateway credentials");
    return;
  }

  const attending = args.guests.filter((g) => g.attending === true);
  const declined = args.guests.filter((g) => g.attending === false);
  const es = args.language === "es";

  const subject = es
    ? `Confirmación de RSVP — Boda de Geo & Partner`
    : `RSVP confirmed — Geo & Partner's wedding`;

  const li = (g: { full_name: string }) => `<li style="margin:4px 0;">${escapeHtml(g.full_name)}</li>`;

  const html = `<!doctype html><html><body style="font-family:Georgia,serif;background:#FAF6F0;color:#3A342E;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E7DFD3;padding:32px;">
    <h1 style="font-family:Georgia,serif;color:#6E5C87;font-size:24px;margin:0 0 8px;">
      ${es ? "¡Gracias por confirmar!" : "Thank you for your RSVP"}
    </h1>
    <p style="margin:0 0 16px;">${es ? "Grupo" : "Party"}: <strong>${escapeHtml(args.partyName)}</strong></p>
    ${attending.length ? `<h3 style="color:#6E5C87;margin:16px 0 4px;">${es ? "Asistirán" : "Attending"}</h3><ul style="padding-left:20px;margin:0;">${attending.map(li).join("")}</ul>` : ""}
    ${declined.length ? `<h3 style="color:#6E5C87;margin:16px 0 4px;">${es ? "No asistirán" : "Not attending"}</h3><ul style="padding-left:20px;margin:0;">${declined.map(li).join("")}</ul>` : ""}
    <p style="margin:24px 0 8px;">${es ? "Fecha" : "Date"}: October 10, 2026</p>
    <p style="margin:0 0 8px;">${es ? "Lugar" : "Venue"}: Sparks' Barn, Louisville, Nebraska</p>
    <p style="color:#6B6259;font-size:13px;margin-top:24px;">
      ${es ? "Puedes actualizar tu respuesta hasta el 15 de septiembre de 2026 volviendo al sitio." : "You can update your response until September 15, 2026 by returning to the site."}
    </p>
  </div>
  </body></html>`;

  const res = await fetch(`${GATEWAY}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": brevo,
    },
    body: JSON.stringify({
      sender: { name: "Geo & Partner", email: "wedding@notifications.brevo.com" },
      to: [{ email: args.to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    console.error("Brevo send failed", res.status, await res.text().catch(() => ""));
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
