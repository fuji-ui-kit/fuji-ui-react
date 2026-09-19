import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";

const meta = {
  title: "Foundation/Glass material",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Reads back what the browser resolved, so "is the glass working?" needs no devtools - every
 * cause of a flat-looking panel shows here.
 */
function Readout() {
  const [rows, setRows] = React.useState<Array<[string, string, boolean]>>([]);

  React.useEffect(() => {
    const panel = document.querySelector(".fuji-glass-surface-overlay");
    if (!panel) return;
    const cs = getComputedStyle(panel);
    const root = getComputedStyle(document.documentElement);
    const scope = document.querySelector(".fuji-theme-scope");
    const sc = scope ? getComputedStyle(scope) : root;
    const tok = (n: string) => sc.getPropertyValue(n).trim() || "(unset)";
    const filter = cs.backdropFilter || "none";
    setRows([
      [
        "--fuji-surface-overlay",
        tok("--fuji-surface-overlay"),
        tok("--fuji-surface-overlay").includes("40%"),
      ],
      ["--fuji-glass-edge", tok("--fuji-glass-edge"), tok("--fuji-glass-edge") !== "(unset)"],
      ["computed backdrop-filter", filter, filter !== "none"],
      [
        "browser supports backdrop-filter",
        String(CSS.supports("backdrop-filter", "blur(1px)")),
        CSS.supports("backdrop-filter", "blur(1px)"),
      ],
      [
        "prefers-reduced-transparency",
        matchMedia("(prefers-reduced-transparency: reduce)").matches
          ? "reduce (glass is flattened by design)"
          : "no-preference",
        !matchMedia("(prefers-reduced-transparency: reduce)").matches,
      ],
    ]);
  }, []);

  const allOk = rows.length > 0 && rows.every((r) => r[2]);
  return (
    <div
      style={{
        padding: "16px 20px",
        font: "13px/1.7 ui-monospace, Menlo, monospace",
        background: "#111",
        color: "#eee",
      }}
    >
      <div style={{ color: allOk ? "#7ee08a" : "#ff8f8f", marginBottom: 8 }}>
        {rows.length === 0
          ? "measuring…"
          : allOk
            ? "ALL OK — glass is active in this browser."
            : "SOMETHING IS OFF — see the BAD rows."}
      </div>
      {rows.map(([k, v, ok]) => (
        <div key={k}>
          <span style={{ color: ok ? "#7ee08a" : "#ff8f8f" }}>{ok ? "OK " : "BAD"}</span> {k}: {v}
        </div>
      ))}
    </div>
  );
}

/**
 * The overlay tier over a high-detail backdrop, where blur is obvious as it never is over a
 * gradient: a legible-but-softened pattern means the material works.
 */
export const OverlayOverDetail: Story = {
  name: "Overlay over a detailed backdrop",
  render: () => (
    <div>
      <div
        data-glass-stage=""
        style={{
          position: "relative",
          height: 420,
          display: "grid",
          placeItems: "center",
          background: [
            "radial-gradient(280px 200px at 18% 26%, #eef4fa, transparent 62%)",
            "radial-gradient(240px 180px at 58% 18%, #a8d072, transparent 60%)",
            "radial-gradient(220px 200px at 38% 80%, #1d3a18, transparent 62%)",
            "radial-gradient(300px 240px at 84% 72%, #efe7cc, transparent 60%)",
            "repeating-linear-gradient(48deg, #6f9e52 0 26px, #2f5340 26px 52px)",
          ].join(","),
        }}
      >
        <div
          className="fuji-glass-surface-overlay"
          style={{
            width: 320,
            padding: "18px 20px",
            borderRadius: "var(--fuji-radius-overlay)",
            border: "1px solid var(--fuji-border)",
            boxShadow: "var(--fuji-shadow-overlay)",
            background: "var(--fuji-surface-overlay)",
            color: "var(--fuji-foreground)",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontSize: 16 }}>Glass overlay</h2>
          <p style={{ margin: 0, color: "var(--fuji-foreground-muted)" }}>
            The striped pattern behind this panel should be visible but blurred.
          </p>
        </div>
      </div>
      <Readout />
    </div>
  ),
};

/* eslint-disable react-hooks/rules-of-hooks */
import { Popover, Button } from "@fujiui/react";
import { createPortal } from "react-dom";

const BACKDROP_ROOT_PROPS = [
  "transform",
  "willChange",
  "filter",
  "backdropFilter",
  "opacity",
  "mixBlendMode",
  "isolation",
  "contain",
  "clipPath",
  "maskImage",
  "perspective",
] as const;

/** Walks popup -> html and reports every property that can break a descendant's backdrop-filter. */
function chainReport(el: Element): string[] {
  const out: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const cs = getComputedStyle(node);
    const hits: string[] = [];
    for (const p of BACKDROP_ROOT_PROPS) {
      const v = (cs as unknown as Record<string, string>)[p];
      const benign =
        v === "none" || v === "auto" || v === "normal" || v === "1" || v === "" || v === "visible";
      if (!benign) hits.push(`${p}=${v.slice(0, 44)}`);
    }
    const anims = (node as HTMLElement).getAnimations?.({ subtree: false })?.length ?? 0;
    if (anims) hits.push(`activeAnimations=${anims}`);
    if (hits.length) {
      const label = (node.tagName + "." + String(node.className).replace(/fj:/g, "")).slice(0, 44);
      out.push(`${label} -> ${hits.join(", ")}`);
    }
    node = node.parentElement;
  }
  return out.length ? out : ["(ancestor chain is clean)"];
}

function PortalProbeReadout() {
  const [lines, setLines] = React.useState<string[]>(["measuring…"]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const popup = document.querySelector(
        "[data-portal-probe] , .fuji-glass-surface-overlay.fuji-motion-popup",
      );
      const manual = document.querySelector("[data-manual-portal]");
      const out: string[] = [];
      if (popup) {
        const cs = getComputedStyle(popup);
        out.push(
          `BASE-UI POPUP  bg=${cs.backgroundColor}  filter=${(cs.backdropFilter || "none").slice(0, 52)}`,
        );
        out.push(`  self: transform=${cs.transform.slice(0, 30)} scale=${cs.scale} opacity=${cs.opacity}`);
        out.push(...chainReport(popup).map((l) => "  chain: " + l));
      } else out.push("BASE-UI POPUP not found");
      if (manual) {
        const cs = getComputedStyle(manual);
        out.push(
          `MANUAL PORTAL  bg=${cs.backgroundColor}  filter=${(cs.backdropFilter || "none").slice(0, 52)}`,
        );
        out.push(...chainReport(manual).map((l) => "  chain: " + l));
      }
      setLines(out);
    }, 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        padding: "14px 20px",
        font: "12px/1.7 ui-monospace, Menlo, monospace",
        background: "#111",
        color: "#9fdca9",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.join("\n")}
    </div>
  );
}

/**
 * The same glass inline (control), in a portaled Popover, and in a bare createPortal - whichever
 * loses its blur names the layer; the readout lists backdrop-root properties up the ancestors.
 */
export const PortalProbe: Story = {
  name: "Portal probe (diagnosis)",
  render: () => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    const stripes = [
      "radial-gradient(240px 180px at 70% 20%, #f2e8c8, transparent 60%)",
      "repeating-linear-gradient(48deg, #6f9e52 0 26px, #2f5340 26px 52px)",
    ].join(",");
    const panelStyle: React.CSSProperties = {
      width: 250,
      padding: "14px 16px",
      borderRadius: "var(--fuji-radius-overlay)",
      border: "1px solid var(--fuji-border)",
      boxShadow: "var(--fuji-shadow-overlay)",
      background: "var(--fuji-surface-overlay)",
      color: "var(--fuji-foreground)",
    };
    return (
      <div>
        <div
          style={{
            position: "relative",
            height: 340,
            background: stripes,
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "0 24px",
          }}
        >
          <div className="fuji-glass-surface-overlay" style={panelStyle}>
            <strong>A: inline</strong>
            <div>Stripes should read through, blurred.</div>
          </div>
          <Popover defaultOpen>
            <Popover.Trigger render={<Button appearance="ghost">anchor</Button>} />
            <Popover.Content showArrow={false} data-portal-probe="">
              <strong>B: Base UI portal</strong>
              <div>Same class, portaled + positioned.</div>
            </Popover.Content>
          </Popover>
          {mounted &&
            createPortal(
              <div
                data-manual-portal=""
                // Portaled outside the provider, so the attrs ride on the element (as
                // usePortalThemeAttrs does); without them it falls back to :root light, no filter.
                // `data-fuji-theme` also sets the glass tint; `data-fuji-material` enables glass.
                data-fuji-theme="dark"
                data-fuji-material="glass"
                data-fuji-radius="cornered"
                className="fuji-glass-surface-overlay"
                style={{ ...panelStyle, position: "fixed", right: 24, top: 90, zIndex: 60 }}
              >
                <strong>C: bare createPortal</strong>
                <div>Portaled, no positioner at all.</div>
              </div>,
              document.body,
            )}
        </div>
        <PortalProbeReadout />
      </div>
    );
  },
};

/**
 * Five overlay recipes plus the real Popover over a busy backdrop. Recipe 1 has no backdrop-filter;
 * if only it shows the stripes, the browser isn't sampling backdrops and tokens must lean on tint.
 */
export const RecipePicker: Story = {
  name: "Recipe picker",
  render: () => {
    const stripes = [
      "radial-gradient(300px 200px at 75% 25%, #f2e8c8, transparent 60%)",
      "repeating-linear-gradient(48deg, #6f9e52 0 26px, #2f5340 26px 52px)",
    ].join(",");
    const recipes: Array<[string, React.CSSProperties]> = [
      ["1: tint only (no blur)", { backdropFilter: "none" }],
      ["2: blur 6px", { backdropFilter: "blur(6px) saturate(1.4)" }],
      ["3: blur 12px", { backdropFilter: "blur(12px) saturate(1.4)" }],
      ["4: blur 18px", { backdropFilter: "blur(18px) saturate(1.4)" }],
      ["5: blur 18px, darkened", { backdropFilter: "blur(18px) brightness(0.65) saturate(1.5)" }],
    ];
    return (
      <div
        style={{
          position: "relative",
          minHeight: 460,
          background: stripes,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "flex-start",
          gap: 16,
          padding: 20,
        }}
      >
        {recipes.map(([label, css]) => (
          <div
            key={label}
            style={{
              width: 225,
              padding: "14px 16px",
              borderRadius: "var(--fuji-radius-overlay)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "var(--fuji-shadow-overlay)",
              background: "rgba(12, 14, 18, 0.62)",
              color: "#fff",
              ...css,
            }}
          >
            <strong>{label}</strong>
            <div style={{ opacity: 0.85 }}>August 2026 - 26 27 28 29 30</div>
          </div>
        ))}
        <Popover defaultOpen>
          <Popover.Trigger render={<Button appearance="ghost">anchor</Button>} />
          <Popover.Content showArrow={false}>
            <strong>6: current tokens (portaled)</strong>
            <div>What DatePicker uses right now.</div>
          </Popover.Content>
        </Popover>
      </div>
    );
  },
};
