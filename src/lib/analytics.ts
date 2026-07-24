import { useServerFn } from "@tanstack/react-start";
import { trackEvent as trackEventServer, type AnalyticsEvent } from "@/lib/analytics.functions";

/**
 * Client-side hook for anonymous analytics. Events are validated on the
 * server and logged fire-and-forget so they never block the UI or navigation.
 */
export function useAnalytics() {
  const run = useServerFn(trackEventServer);

  return function track(event: AnalyticsEvent, data?: Record<string, unknown>) {
    run({ data: { event, data: data ?? {} } }).catch(() => {
      // Analytics should never surface errors to guests.
    });
  };
}
