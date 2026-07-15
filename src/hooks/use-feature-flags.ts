import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getFeatureFlags } from "@/lib/feature-flags.functions";

export interface FeatureFlagState {
  enabled: boolean;
  loading: boolean;
}

/**
 * Whether a guest-facing feature flag is enabled. `enabled` defaults to
 * false while loading and on error, so gated features stay hidden until
 * positively confirmed on rather than flashing on then off. `loading`
 * lets callers show a neutral state instead of assuming "disabled"
 * during the initial fetch, for pages where that flash would be
 * misleading (e.g. showing "not open yet" for a split second on a page
 * that's actually open).
 */
export function useFeatureFlag(key: string): FeatureFlagState {
  const loadFlags = useServerFn(getFeatureFlags);
  const [state, setState] = useState<FeatureFlagState>({ enabled: false, loading: true });

  useEffect(() => {
    let cancelled = false;
    loadFlags({})
      .then((flags) => {
        if (cancelled) return;
        setState({ enabled: flags.find((f) => f.key === key)?.enabled ?? false, loading: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ enabled: false, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [key, loadFlags]);

  return state;
}
