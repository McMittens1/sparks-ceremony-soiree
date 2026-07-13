import type { CSSProperties, ReactNode } from "react";

/**
 * Small typography primitives that centralize the three text patterns repeated
 * across the site (uppercase eyebrow label, italic display heading, serif body
 * paragraph). Visuals mirror the existing inline-style patterns exactly — this
 * is a compression pass, not a redesign.
 */

type Color =
  | "ink"
  | "ink-body"
  | "ink-soft"
  | "lavender"
  | "lavender-deep"
  | "tan"
  | "tan-deep"
  | "gold"
  | "ivory";

const colorClass: Record<Color, string> = {
  ink: "text-ink",
  "ink-body": "text-ink-body",
  "ink-soft": "text-ink-soft",
  lavender: "text-lavender",
  "lavender-deep": "text-lavender-deep",
  tan: "text-tan",
  "tan-deep": "text-tan-deep",
  gold: "text-gold",
  ivory: "text-ivory",
};

type EyebrowSize = "sm" | "md" | "lg";

/**
 * Uppercase Work Sans label (the "I · Counting Down" / "Day-of schedule" pattern).
 * sm ≈ 10px 0.24em, md ≈ 11px 0.3em, lg ≈ 12px 0.4em.
 */
export function Eyebrow({
  children,
  color = "tan-deep",
  size = "md",
  className = "",
  style,
  as: As = "p",
}: {
  children: ReactNode;
  color?: Color;
  size?: EyebrowSize;
  className?: string;
  style?: CSSProperties;
  as?: "p" | "span" | "div" | "label";
}) {
  const sizeStyle: CSSProperties =
    size === "sm"
      ? { fontSize: 10, letterSpacing: "0.24em" }
      : size === "lg"
      ? { fontSize: 12, letterSpacing: "0.4em" }
      : { fontSize: 11, letterSpacing: "0.3em" };
  const Cmp = As as "p";
  return (
    <Cmp
      className={`uppercase font-sans ${colorClass[color]} ${className}`}
      style={{ margin: 0, ...sizeStyle, ...style }}
    >
      {children}
    </Cmp>
  );
}

type HeadingSize = "sm" | "md" | "lg" | "xl";

const headingClamp: Record<HeadingSize, string> = {
  sm: "clamp(30px, 4vw, 46px)",
  md: "clamp(32px, 5vw, 52px)",
  lg: "clamp(36px, 6vw, 60px)",
  xl: "clamp(44px, 7vw, 76px)",
};

/**
 * Serif italic display heading (the "Our Story" / "The Day" / section title pattern).
 */
export function DisplayHeading({
  children,
  size = "xl",
  color = "ink",
  italic = true,
  className = "",
  style,
  as: As = "h2",
}: {
  children: ReactNode;
  size?: HeadingSize;
  color?: Color;
  italic?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: "h1" | "h2" | "h3" | "h4";
}) {
  const Cmp = As as "h2";
  return (
    <Cmp
      className={`font-serif ${italic ? "italic" : ""} ${colorClass[color]} ${className}`}
      style={{
        fontWeight: 500,
        fontSize: headingClamp[size],
        lineHeight: 1.1,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Cmp>
  );
}

/**
 * Serif italic subheading / section lede (the "How we got from a first hello..." pattern).
 */
export function Subhead({
  children,
  color = "ink-soft",
  className = "",
  style,
}: {
  children: ReactNode;
  color?: Color;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      className={`font-serif italic ${colorClass[color]} ${className}`}
      style={{ fontSize: 22, margin: 0, ...style }}
    >
      {children}
    </p>
  );
}

/**
 * Body copy — Work Sans at ~17px, 1.8 line-height, capped at ~560–640px.
 */
export function BodyProse({
  children,
  color = "ink-body",
  maxWidth = 560,
  className = "",
  style,
}: {
  children: ReactNode;
  color?: Color;
  maxWidth?: number | string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p
      className={`font-sans ${colorClass[color]} ${className}`}
      style={{ fontSize: 17, lineHeight: 1.8, maxWidth, margin: 0, ...style }}
    >
      {children}
    </p>
  );
}
