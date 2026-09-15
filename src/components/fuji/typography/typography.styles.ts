// Sized 1px below the shared --fuji-text-* tokens (via calc), not the tokens
// themselves - those tokens are also reused by dozens of Inter-rendered
// components (buttons, badges, tables, form fields, etc.), so shrinking them
// directly would shrink UI text that has nothing to do with this component.
const TYPOGRAPHY_SCALES = {
  display:
    "fj:text-[length:calc(var(--fuji-text-3xl)_-_1px)] fj:font-semibold fj:leading-tight fj:tracking-tight",
  heading:
    "fj:text-[length:calc(var(--fuji-text-xl)_-_1px)] fj:font-semibold fj:leading-snug fj:tracking-tight",
  title: "fj:text-[length:calc(var(--fuji-text-md)_-_1px)] fj:font-semibold fj:leading-snug",
  subtitle: "fj:text-[length:calc(var(--fuji-text-base)_-_1px)] fj:font-medium fj:text-fuji-foreground-muted",
  body: "fj:text-[length:calc(var(--fuji-text-base)_-_1px)] fj:font-normal fj:leading-relaxed",
  bodySm:
    "fj:text-[length:calc(var(--fuji-text-sm)_-_1px)] fj:font-normal fj:leading-relaxed fj:text-fuji-foreground-muted",
  caption: "fj:text-[length:calc(var(--fuji-text-xs)_-_1px)] fj:font-normal fj:text-fuji-foreground-subtle",
} as const;

export type TypographyScale = keyof typeof TYPOGRAPHY_SCALES;

export function typographyStyles({ scale = "body" }: { scale?: TypographyScale } = {}): string {
  return `fj:font-fuji-primary fj:m-0 ${TYPOGRAPHY_SCALES[scale]}`;
}

export const TYPOGRAPHY_DEFAULT_TAG: Record<TypographyScale, keyof React.JSX.IntrinsicElements> = {
  display: "h1",
  heading: "h2",
  title: "h3",
  subtitle: "p",
  body: "p",
  bodySm: "p",
  caption: "span",
};
