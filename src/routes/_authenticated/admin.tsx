import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/context";
import { getAdminPhotos, setPhotoStatus, type AdminPhoto } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin · Geo & Addison" },
    { name: "robots", content: "noindex,nofollow" },
  ]}),
  component: Admin,
});

function Admin() {
  const t = useT();
  const nav = useNavigate();
  const loadPhotos = useServerFn(getAdminPhotos);
  const setStatus = useServerFn(setPhotoStatus);
  const [photoTab, setPhotoTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);

  useEffect(() => {
    loadPhotos({ data: { status: photoTab } }).then(setPhotos).catch(() => {});
  }, [photoTab, loadPhotos]);

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  async function updatePhoto(id: string, s: "approved" | "rejected") {
    await setStatus({ data: { id, status: s } });
    const next = await loadPhotos({ data: { status: photoTab } });
    setPhotos(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl text-primary">{t.admin.title}</h1>
        <button onClick={signOut} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-primary">{t.admin.signOut}</button>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{t.admin.photosTab}</p>

      <div className="mt-8">
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s} onClick={() => setPhotoTab(s)}
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${photoTab === s ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
            >
              {s === "pending" ? t.admin.pending : s === "approved" ? t.admin.approved : t.admin.rejected}
            </button>
          ))}
        </div>
        {photos.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t.admin.noPhotos}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((p) => (
              <div key={p.id} className="rounded-sm border border-border/60 bg-card overflow-hidden">
                <img src={p.url} alt="" className="w-full aspect-square object-cover" />
                <div className="p-3 space-y-2">
                  <div className="text-sm">{p.uploader_name}</div>
                  {p.uploader_email && <div className="text-xs text-muted-foreground">{p.uploader_email}</div>}
                  {p.caption && <p className="text-xs text-foreground/80">{p.caption}</p>}
                  {photoTab === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => updatePhoto(p.id, "approved")} className="flex-1 rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-[0.15em] py-2">{t.admin.approve}</button>
                      <button onClick={() => updatePhoto(p.id, "rejected")} className="flex-1 rounded-full border border-input text-xs uppercase tracking-[0.15em] py-2">{t.admin.reject}</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
