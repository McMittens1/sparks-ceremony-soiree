/**
 * Shared helper for building a route's `head()` meta/links, so every route
 * emits a consistent, complete set of SEO/social tags instead of hand-rolled
 * (and easily-inconsistent) arrays.
 */

type MetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

export interface BuildMetaOptions {
  title: string;
  description: string;
  /** Absolute image URL for og:image/twitter:image. Omitted if the page has no dedicated image. */
  image?: string;
  /** Absolute canonical URL for this page — used for og:url and the canonical link. */
  url: string;
  /** og:type — defaults to "website". */
  type?: string;
  /** e.g. "noindex,nofollow" for private/non-indexable pages. */
  robots?: string;
}

export function buildMeta({
  title,
  description,
  image,
  url,
  type = "website",
  robots,
}: BuildMetaOptions): { meta: MetaEntry[]; links: { rel: string; href: string }[] } {
  const meta: MetaEntry[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
  ];
  if (image) meta.push({ property: "og:image", content: image });
  meta.push(
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  );
  if (image) meta.push({ name: "twitter:image", content: image });
  if (robots) meta.push({ name: "robots", content: robots });

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
  };
}
