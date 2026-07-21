import * as React from "react";
import Image from "next/image";
import Link from "next/link";

function cx(...c: Array<string | false | undefined | null>): string {
  return c.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ *
 * Buttons — tactile pill controls. Flat fills, 2px inset outline,
 * physical pressed state (translate + colour inversion). No gradients.
 * ------------------------------------------------------------------ */

type ButtonVariant = "primario" | "secondario" | "morbido" | "fantasma" | "pericolo";

const variantClasses: Record<ButtonVariant, string> = {
  // On the dark table: white fill, black text, presses to inverted.
  primario:
    "bg-white text-black shadow-[inset_0_0_0_2px_#000] active:bg-black active:text-white active:shadow-[inset_0_0_0_2px_#fff] active:translate-y-[2px]",
  // Lemon accent action.
  secondario:
    "bg-lemon-card text-black shadow-[inset_0_0_0_2px_#000] active:bg-black active:text-lemon-card active:shadow-[inset_0_0_0_2px_var(--color-lemon-card)] active:translate-y-[2px]",
  // Ghost on dark: transparent, white outline.
  morbido:
    "bg-transparent text-white shadow-[inset_0_0_0_2px_#fff] active:bg-white active:text-black active:translate-y-[2px]",
  fantasma:
    "bg-transparent text-current shadow-[inset_0_0_0_2px_currentColor] active:translate-y-[2px]",
  pericolo:
    "bg-signal-red text-white shadow-[inset_0_0_0_2px_#000] active:translate-y-[2px]",
};

const baseBtn =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-6 py-3 font-titolo font-extrabold uppercase tracking-wide text-base min-h-[48px] transition-[transform,background-color,color] duration-100 disabled:opacity-40 disabled:pointer-events-none select-none";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({ variant = "primario", fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(baseBtn, variantClasses[variant], fullWidth && "w-full", className)}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primario",
  fullWidth,
  className,
  ...props
}: { variant?: ButtonVariant; fullWidth?: boolean } & React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cx(baseBtn, variantClasses[variant], fullWidth && "w-full", className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ *
 * PlayingCard — the visual identity primitive. A flat card face with a
 * thick inset outline and no drop shadow.
 * ------------------------------------------------------------------ */

export type PlayingCardVariant =
  | "white"
  | "black"
  | "lemon"
  | "lavender"
  | "cobalt"
  | "sky"
  | "bubblegum"
  | "mint"
  | "tangerine"
  | "red-outline"
  | "violet-outline"
  | "gold-outline";

// [background class, text-context class, outline colour]
const cardFaces: Record<PlayingCardVariant, [string, "on-light" | "on-dark", string]> = {
  white: ["bg-white", "on-light", "#000"],
  black: ["bg-black", "on-dark", "#fff"],
  lemon: ["bg-lemon-card", "on-light", "#000"],
  lavender: ["bg-lavender-card", "on-light", "#000"],
  cobalt: ["bg-cobalt-card", "on-dark", "#000"],
  sky: ["bg-sky-card", "on-light", "#000"],
  bubblegum: ["bg-bubblegum-card", "on-light", "#000"],
  mint: ["bg-mint-card", "on-light", "#000"],
  tangerine: ["bg-tangerine-card", "on-light", "#000"],
  "red-outline": ["bg-black", "on-dark", "var(--color-signal-red)"],
  "violet-outline": ["bg-white", "on-light", "var(--color-royal-violet)"],
  "gold-outline": ["bg-black", "on-dark", "var(--color-antique-gold)"],
};

// Fixed, deterministic rotations (no per-render randomness → no hydration drift).
const rotazioni = ["-rotate-2", "-rotate-1", "rotate-1", "rotate-2", "rotate-0"] as const;

interface PlayingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PlayingCardVariant;
  rotate?: 0 | 1 | 2 | 3 | 4;
  interactive?: boolean;
  selected?: boolean;
}

export function PlayingCard({
  variant = "white",
  rotate,
  interactive,
  selected,
  className,
  children,
  ...props
}: PlayingCardProps) {
  const [bg, ctx, outline] = cardFaces[variant];
  return (
    <div
      data-selected={selected || undefined}
      className={cx(
        ctx,
        bg,
        "relative rounded-[var(--radius-card)] p-5 text-[color:var(--color-testo)]",
        rotate !== undefined && rotate < 5 && rot2class(rotate),
        interactive &&
          "transition-transform duration-100 hover:-translate-y-1 active:translate-y-0 cursor-pointer",
        selected && "-translate-y-1",
        className,
      )}
      style={{
        boxShadow: selected
          ? `inset 0 0 0 4px ${outline}`
          : `inset 0 0 0 2px ${outline}`,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function rot2class(r: number) {
  return rotazioni[Math.max(0, Math.min(rotazioni.length - 1, r))];
}

/* Card — generic content surface built on the white card face. Keeps the old
   API (a padded white box) but now flat with a black inset outline, and sets a
   light-surface text context so text-testo utilities render dark. */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "on-light bg-[var(--color-superficie)] text-[color:var(--color-testo)]",
        "rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-morbida)]",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Badge — a mini tag/label with a flat outline.
 * ------------------------------------------------------------------ */
export function Badge({
  children,
  colore = "giallo",
}: {
  children: React.ReactNode;
  colore?: "giallo" | "cielo" | "corallo" | "menta" | "viola";
}) {
  const map: Record<string, string> = {
    giallo: "bg-lemon-card text-black",
    cielo: "bg-sky-card text-black",
    corallo: "bg-signal-red text-white",
    menta: "bg-mint-card text-black",
    viola: "bg-royal-violet text-white",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[var(--radius-pill)] px-3 py-1 text-xs font-extrabold uppercase tracking-wide shadow-[inset_0_0_0_2px_#000]",
        map[colore],
      )}
    >
      {children}
    </span>
  );
}

/* Avatar — a player mini-card (rounded square, flat outline) with initials. */
export function Avatar({ nome, colore }: { nome: string; colore: string }) {
  const iniziali = nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <span
      aria-hidden
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] font-titolo font-extrabold text-black text-sm shadow-[inset_0_0_0_2px_#000]"
      style={{ backgroundColor: colore }}
    >
      {iniziali || "?"}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Logo — shared brand asset used as a normal website/app logo:
 * clickable wordmark in headers and compact square mark for shortcuts.
 * ------------------------------------------------------------------ */
type LogoProps = {
  variant?: "horizontal" | "icon";
  size?: "sm" | "md" | "lg" | "text-xl" | "text-2xl";
  link?: boolean;
  priority?: boolean;
  className?: string;
};

const logoSizes = {
  horizontal: {
    sm: { width: 172, height: 50 },
    md: { width: 212, height: 62 },
    lg: { width: 264, height: 77 },
  },
  icon: {
    sm: { width: 36, height: 36 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
  },
} as const;

export function Logo({
  variant = "horizontal",
  size = "md",
  link = true,
  priority,
  className,
}: LogoProps) {
  const normalizedSize =
    size === "text-xl" ? "sm" : size === "text-2xl" ? "md" : size;
  const dim = logoSizes[variant][normalizedSize];
  const image = (
    <Image
      src={variant === "horizontal" ? "/logo_horizontal.png" : "/logo_icon.png"}
      alt="Giallo-Aria"
      width={dim.width}
      height={dim.height}
      priority={priority}
      className={cx("h-auto max-w-full", className)}
    />
  );

  if (!link) return image;

  return (
    <Link href="/" aria-label="Vai alla home di Giallo-Aria" className="inline-flex shrink-0">
      {image}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * ScatteredCardBackground — decorative dealt cards behind the content.
 * Deterministic positions/rotations, aria-hidden, no overflow, never over
 * interactive controls. Reduced on very small screens.
 * ------------------------------------------------------------------ */
export function SfondoDecorativo() {
  const carte = [
    { c: "bg-lemon-card", pos: "top-[12%] -left-10 rotate-[-8deg]", show: "" },
    { c: "bg-sky-card", pos: "top-[38%] -right-12 rotate-[7deg]", show: "hidden sm:block" },
    { c: "bg-bubblegum-card", pos: "bottom-[14%] -left-14 rotate-[4deg]", show: "hidden sm:block" },
    { c: "bg-mint-card", pos: "bottom-[6%] right-[-2.5rem] rotate-[-4deg]", show: "" },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {carte.map((k, i) => (
        <div
          key={i}
          className={cx(
            "absolute h-40 w-28 rounded-[var(--radius-card)] opacity-[0.10] shadow-[inset_0_0_0_2px_#fff]",
            k.c,
            k.pos,
            k.show,
          )}
        />
      ))}
    </div>
  );
}
