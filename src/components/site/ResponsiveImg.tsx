import manifest from "@/lib/image-manifest.json";

/**
 * Photo <img> that swaps the full-size original asset for a build-time
 * generated WebP srcset when one exists for that filename.
 *
 * The derivatives live in `public/images/derived` and are keyed in
 * `src/lib/image-manifest.json` by the asset's original filename, so this
 * works for any `@/assets/**.asset.json` URL without touching the data files.
 * Unknown sources fall through to a plain <img> with the original src.
 */
type Entry = { width: number; height: number; srcset: string; fallback: string };
const MANIFEST = manifest as Record<string, Entry>;

function lookup(src: string): Entry | undefined {
  const file = src.split("?")[0]!.split("/").pop();
  return file ? MANIFEST[file] : undefined;
}

export interface ResponsiveImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** `sizes` hint for the browser; defaults to full viewport width. */
  sizes?: string;
}

export function ResponsiveImg({ src, alt, sizes = "100vw", ...rest }: ResponsiveImgProps) {
  const entry = lookup(src);
  if (!entry) return <img src={src} alt={alt} {...rest} />;
  return (
    <img
      src={entry.fallback}
      srcSet={entry.srcset}
      sizes={sizes}
      alt={alt}
      width={rest.width ?? entry.width}
      height={rest.height ?? entry.height}
      {...rest}
    />
  );
}
