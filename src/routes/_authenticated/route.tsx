import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { hasAdminRole } from "@/lib/admin.functions";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: SITE.adminSignInUrl });
    // Redundant, earlier UX check — the real authorization boundary is
    // still `has_role()`/RLS on the server. This just avoids flashing
    // admin UI at a signed-in non-admin before their queries 403.
    const isAdmin = await hasAdminRole(supabase, data.user.id);
    if (!isAdmin) throw redirect({ to: SITE.adminSignInUrl });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
