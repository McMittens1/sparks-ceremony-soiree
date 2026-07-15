import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getFeatureFlags } from "@/lib/feature-flags.functions";

/**
 * Whether a guest-facing feature flag is enabled. Defaults to false while
 * loading and on error, so gated features stay hidden until positively
 * confirmed on rather than flashing on then off.
 */
export function useFeatureFlag(key: string): boolean {
  const loadFlags = useServerFn(getFeatureFlags);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFlags({})
      .then((flags) => {
        if (cancelled) return;
        setEnabled(flags.find((f) => f.key === key)?.enabled ?? false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, loadFlags]);

  return enabled;
}
