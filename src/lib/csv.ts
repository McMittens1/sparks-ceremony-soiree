// Shared CSV helpers. Both the admin dashboard exports and the attendee
// report build files the same way, so the escaping and the download shim
// live here rather than being duplicated (and drifting) in each page.

/** RFC-4180 escaping: quote the field only when it needs it. */
export function escCsv(s: string | null | undefined): string {
  const v = s ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Triggers a browser download of `csv` as `<name>-YYYY-MM-DD.csv`. */
export function downloadCsv(csv: string, name: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
