import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Keyboard } from "./Keyboard";
import { KEYBOARD_LAYOUT_ROWS, resolveLayout, type KeyboardLayout } from "./layouts";

const LAYOUTS: KeyboardLayout[] = ["full", "tkl", "compact", "numpad", "phone"];

const BASE_CSS = fs.readFileSync(path.join(__dirname, "..", "..", "..", "styles", "base.css"), "utf8");
const TOKENS_CSS = fs.readFileSync(path.join(__dirname, "..", "..", "..", "styles", "tokens.css"), "utf8");

function cap(code: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-fuji-key="${code}"]`)!;
}

/** Engages an in-flow board's key capture by focusing inside it; floating boards need only be open. */
function engage(): void {
  // The first cap is the only one guaranteed on every layout.
  const target = document.querySelector<HTMLElement>("[data-fuji-key]");
  if (target) act(() => target.focus());
}

describe("Keyboard layouts", () => {
  it.each(LAYOUTS)("places every %s cap inside the board's own grid", (layout) => {
    const resolved = resolveLayout(KEYBOARD_LAYOUT_ROWS[layout]);
    const overflowing = resolved.keys.filter(
      (key) =>
        key.column + key.span - 1 > resolved.quarterColumns || key.row + key.rowSpan - 1 > resolved.rows,
    );
    expect(overflowing).toEqual([]);
  });

  it.each(LAYOUTS)("never overlaps two %s caps", (layout) => {
    const resolved = resolveLayout(KEYBOARD_LAYOUT_ROWS[layout]);
    const taken = new Set<string>();
    const collisions: string[] = [];
    for (const key of resolved.keys) {
      for (let row = key.row; row < key.row + key.rowSpan; row += 1) {
        for (let column = key.column; column < key.column + key.span; column += 1) {
          const cell = `${row}:${column}`;
          if (taken.has(cell)) collisions.push(`${key.code} at ${cell}`);
          taken.add(cell);
        }
      }
    }
    expect(collisions).toEqual([]);
  });

  it.each(LAYOUTS)("fills every %s row edge to edge, with no hole and no overhang", (layout) => {
    // A row one unit too wide silently widened the board and pushed numpad Enter off the edge,
    // since the resolver shifts caps right to avoid overlaps.
    const resolved = resolveLayout(KEYBOARD_LAYOUT_ROWS[layout]);
    const covered = new Set<string>();
    for (const key of resolved.keys) {
      for (let row = key.row; row < key.row + key.rowSpan; row += 1) {
        for (let column = key.column; column < key.column + key.span; column += 1) {
          covered.add(`${row}:${column}`);
        }
      }
    }
    const gaps: string[] = [];
    for (let row = 1; row <= resolved.rows; row += 1) {
      for (let column = 1; column <= resolved.quarterColumns; column += 1) {
        if (!covered.has(`${row}:${column}`)) gaps.push(`${row}:${column}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it.each(LAYOUTS)("gives every %s cap a unique code, so nothing shares a tab stop", (layout) => {
    const codes = KEYBOARD_LAYOUT_ROWS[layout].flat().map((key) => key.code);
    expect(codes).toHaveLength(new Set(codes).size);
  });

  it("puts the numpad's two-unit caps beside their neighbours, not under them", () => {
    const { keys } = resolveLayout(KEYBOARD_LAYOUT_ROWS.numpad);
    const plus = keys.find((key) => key.code === "NumpadAdd")!;
    const six = keys.find((key) => key.code === "Numpad6")!;
    expect(plus.rowSpan).toBe(2);
    // `6` sits on the row the `+` also occupies, and starts before it.
    expect(six.row).toBe(plus.row + 1);
    expect(six.column + six.span).toBeLessThanOrEqual(plus.column);
  });

  it("gives the standalone numpad a Backspace, so a PIN or OTP keypad can delete", () => {
    const { keys } = resolveLayout(KEYBOARD_LAYOUT_ROWS.numpad);
    const backspace = keys.find((key) => key.code === "Backspace");
    expect(backspace).toMatchObject({ label: "⌫", name: "Backspace", row: 1, column: 1 });
    // Types nothing itself, like every other layout's Backspace - the
    // consumer acts on the code.
    expect(backspace?.value).toBeUndefined();
    const phoneBackspace = resolveLayout(KEYBOARD_LAYOUT_ROWS.phone).keys.find(
      (key) => key.code === "Backspace",
    );
    expect(backspace?.label).toBe(phoneBackspace?.label);
  });

  it("keeps the phone layout at most ten units wide, so an interactive cap clears the 24x24 target floor", () => {
    // Column count is the only lever that lifts a phone-width cap above the WCAG 2.5.8 floor; jsdom
    // has no layout, so pin columns rather than pixels.
    const resolved = resolveLayout(KEYBOARD_LAYOUT_ROWS.phone);
    expect(resolved.columns).toBeLessThanOrEqual(10);
  });
});

describe("Keyboard", () => {
  it("is pressable out of the box - a board nobody can click is a picture", () => {
    render(<Keyboard layout="compact" />);
    const board = screen.getByRole("group", { name: "On-screen keyboard" });
    expect(within(board).getAllByRole("button").length).toBeGreaterThan(50);
    expect(cap("KeyA").tagName).toBe("BUTTON");
  });

  it("drops to static kbd caps under interactive={false}", () => {
    render(<Keyboard layout="compact" interactive={false} />);
    const board = screen.getByRole("group", { name: "On-screen keyboard" });
    expect(within(board).queryAllByRole("button")).toHaveLength(0);
    expect(cap("KeyA").tagName).toBe("KBD");
  });

  it("reports the pressed key", async () => {
    const onKeyPress = vi.fn();
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" onKeyPress={onKeyPress} />);

    await user.click(cap("Numpad7"));
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "Numpad7", value: "7" }), {
      shift: false,
      meta: false,
      ctrl: false,
      alt: false,
    });
    expect(cap("Numpad7")).toHaveAttribute("type", "button");
  });

  it("strikes the cap on press rather than on release", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    // Held down, not yet released: the cap has already travelled.
    await user.pointer({ keys: "[MouseLeft>]", target: cap("Numpad7") });
    expect(cap("Numpad7")).toHaveAttribute("data-struck", "true");
    expect(cap("Numpad8")).not.toHaveAttribute("data-struck");
    await user.pointer({ keys: "[/MouseLeft]" });
  });

  it("strikes a cap activated from the keyboard, which fires no pointer event", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    act(() => cap("Numpad7").focus());
    await user.keyboard("{Enter}");
    expect(cap("Numpad7")).toHaveAttribute("data-struck", "true");
  });

  it("restarts the strike on a repeat hit rather than waiting for the last one to end", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    // `data-struck` is never cleared (throttled tabs skip `animationend`), so a re-hit must
    // un-mark, reflow and re-mark or the second strike plays nothing.
    await user.click(cap("Numpad7"));
    expect(cap("Numpad7")).toHaveAttribute("data-struck", "true");

    const restarts = vi.spyOn(cap("Numpad7"), "removeAttribute");
    await user.click(cap("Numpad7"));
    expect(restarts).toHaveBeenCalledWith("data-struck");
    expect(cap("Numpad7")).toHaveAttribute("data-struck", "true");
    restarts.mockRestore();
  });

  it("names a glyph cap for screen readers rather than leaving it as an arrow", () => {
    render(<Keyboard layout="compact" />);
    expect(screen.getByRole("button", { name: "Arrow up" })).toBe(cap("ArrowUp"));
    expect(screen.getByRole("button", { name: "Space" })).toBe(cap("Space"));
  });

  it("is one tab stop, with the arrow keys moving between caps", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    expect(cap("Backspace")).toHaveAttribute("tabindex", "0");
    expect(cap("Numpad7")).toHaveAttribute("tabindex", "-1");

    // The sound toggle takes the first tab stop; the deck must still be a single stop after it.
    await user.tab();
    expect(screen.getByRole("button", { name: /key sounds/i })).toHaveFocus();
    await user.tab();
    expect(cap("Backspace")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(cap("NumpadDivide")).toHaveFocus();
    expect(cap("NumpadDivide")).toHaveAttribute("tabindex", "0");
    expect(cap("Backspace")).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowDown}");
    expect(cap("Numpad8")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(cap("Numpad7")).toHaveFocus();
  });

  it("moves down past a two-unit cap to the row below it", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    act(() => cap("NumpadAdd").focus());
    await user.keyboard("{ArrowDown}");
    // `+` covers rows 2-3, so down from it lands on row 4, not row 3.
    expect(cap("NumpadEnter")).toHaveFocus();
  });

  it("jumps to the first and last cap with Home and End", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    act(() => cap("Numpad5").focus());
    await user.keyboard("{End}");
    expect(cap("NumpadDecimal")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(cap("Backspace")).toHaveFocus();
  });

  it("stays put at the edge of the board", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    act(() => cap("Backspace").focus());
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(cap("Backspace")).toHaveFocus();
  });

  it("disables every cap and reports nothing when disabled", async () => {
    const onKeyPress = vi.fn();
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" interactive disabled onKeyPress={onKeyPress} />);

    expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
    expect(cap("Numpad7")).toBeDisabled();
    await user.click(cap("Numpad7"));
    expect(onKeyPress).not.toHaveBeenCalled();
  });

  it("paints no cap in the accent tone until asked to", () => {
    // Colour is opt-in: a default accent once shipped five meaningless red caps.
    const { rerender, container } = render(<Keyboard layout="tkl" />);
    expect(container.querySelectorAll('[class*="bg-fuji-contained-"]')).toHaveLength(0);

    rerender(<Keyboard layout="tkl" tone="water" accentKeys={["Escape", "ArrowUp"]} />);
    expect(cap("Escape").className).toContain("bg-fuji-contained-water");
    expect(cap("ArrowUp").className).toContain("bg-fuji-contained-water");
    expect(cap("KeyA").className).not.toContain("bg-fuji-contained-water");
  });

  it("carries the tone's backlight on the deck, so a struck cap lights up in it", () => {
    const { container, rerender } = render(<Keyboard layout="numpad" />);
    expect(container.querySelector(".fuji-keyboard-deck")).toHaveClass("fuji-keycap-glow-fire");

    rerender(<Keyboard layout="numpad" tone="water" />);
    expect(container.querySelector(".fuji-keyboard-deck")).toHaveClass("fuji-keycap-glow-water");
  });

  it("lights a cap while the real key is held, and releases it again", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" captureKeys />);
    engage();

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    await user.keyboard("{/Shift}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
  });

  it("mirrors the physical keyboard by default, without being asked to", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);
    engage();

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    await user.keyboard("{/Shift}");
  });

  it("stays out of it until the board is engaged, so one page of boards is not one chorus", async () => {
    // Eight boards share the docs page; a global listener would light and click all of them.
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");
  });

  it("engages when focus is already inside it, not only when focus arrives", async () => {
    // Focus already inside (autofocus, restored focus) fired its `focusin` before the listener.
    const user = userEvent.setup();
    function Late() {
      const [mounted, setMounted] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setMounted(true)}>
            mount it
          </button>
          {mounted ? <Keyboard layout="compact" /> : null}
        </>
      );
    }
    render(<Late />);
    await user.click(screen.getByRole("button", { name: "mount it" }));
    // Focus is on the trigger, outside the board: nothing should mirror.
    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");

    engage();
    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    await user.keyboard("{/Shift}");
  });

  it("lets go again when focus leaves the board", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Keyboard layout="compact" />
        <button type="button">elsewhere</button>
      </>,
    );
    engage();
    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    await user.keyboard("{/Shift}");

    act(() => screen.getByRole("button", { name: "elsewhere" }).focus());
    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");
  });

  it("strikes the mirrored cap, so a real key feels like a pressed one", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);
    engage();

    await user.keyboard("{a>}");
    expect(cap("KeyA")).toHaveAttribute("data-struck", "true");
    await user.keyboard("{/a}");
  });

  it("does not stutter the strike through an auto-repeating hold", () => {
    render(<Keyboard layout="compact" />);
    engage();
    const first = cap("KeyB");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyB", key: "b" }));
    });
    expect(first).toHaveAttribute("data-struck", "true");

    // Replaying the strike (and click) on every auto-repeat keydown would stutter.
    const restarts = vi.spyOn(first, "removeAttribute");
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyB", key: "b", repeat: true }));
    });
    expect(restarts).not.toHaveBeenCalled();
    restarts.mockRestore();
  });

  it("never reports a mirrored press through onKeyPress, which would type it twice", async () => {
    // The real key already reached the focused field; reporting it would type it twice.
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);
    engage();

    await user.keyboard("{a>}{/a}");
    expect(onKeyPress).not.toHaveBeenCalled();

    // A press on the board itself still reports, exactly as before.
    await user.click(cap("KeyA"));
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "KeyA" }), expect.anything());
  });

  it("ignores the real keyboard entirely under captureKeys={false}, engaged or not", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" captureKeys={false} />);
    engage();

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");
  });

  it("drops every lit cap when the window loses focus mid-press", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" captureKeys />);
    engage();

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    act(() => window.dispatchEvent(new Event("blur")));
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");
  });

  it("stops listening to the real keyboard once unmounted", async () => {
    const user = userEvent.setup();
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Keyboard layout="numpad" captureKeys />);
    engage();
    unmount();

    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["keydown", "keyup", "blur"]));
    remove.mockRestore();
    await user.keyboard("{a}");
  });

  it("clears a held key's pressed state when captureKeys is turned off mid-hold", () => {
    const { rerender } = render(<Keyboard layout="compact" captureKeys />);
    engage();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    });
    expect(cap("KeyE")).toHaveAttribute("data-pressed", "true");

    // The key can come up while captureKeys is off, with no listener to see it; the render gate
    // only masks `pressedCodes`, it doesn't clear it.
    rerender(<Keyboard layout="compact" captureKeys={false} />);
    expect(cap("KeyE")).not.toHaveAttribute("data-pressed");

    // Re-enabling must not resurrect a pre-teardown code, or it would read as held forever.
    rerender(<Keyboard layout="compact" captureKeys />);
    engage();
    expect(cap("KeyE")).not.toHaveAttribute("data-pressed");
  });

  it("gives a cap no hover state - the press is the only feedback", () => {
    // Checked in the stylesheet: jsdom has no pointer, so render tests can't see a hover rule.
    const hoverRules = [...BASE_CSS.matchAll(/^[^{}\n]*fuji-keycap[^{}\n]*:hover[^{}\n]*\{/gm)].map((match) =>
      match[0].trim(),
    );
    expect(hoverRules).toEqual([]);
  });

  it("keeps every cap shadow inside the gap between caps", () => {
    // `--fuji-shadow-control` reached ~28px at `floating` into a <=5px gap: invisible waste on up to
    // 104 caps, so only a test can catch it. `matchAll`, not `exec`, so dark isn't skipped.
    const gaps = [...BASE_CSS.matchAll(/--fuji-key-gap:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(gaps.length).toBeGreaterThan(0);
    const widestGap = Math.max(...gaps);

    const defs = [...TOKENS_CSS.matchAll(/--fuji-shadow-keycap:\s*([^;]+);/g)].map((m) => m[1]);
    // One per theme; a material/elevation override would reintroduce an elevation-scaled shadow.
    expect(defs).toHaveLength(2);

    for (const def of defs) {
      // Strip colour functions so their commas aren't read as layer separators.
      for (const layer of def.replace(/\b(?:rgba?|hsla?|color)\([^)]*\)/g, "").split(",")) {
        // Positional, not /px/: unitless zeros (`0 1px 3px`) would shift values left and read blur as
        // y-offset, passing `0 20px 2px` (reach 21px) as "reach 2".
        const lengths = layer
          .trim()
          .split(/\s+/)
          .map((token) => Number.parseFloat(token))
          .filter((n) => !Number.isNaN(n));
        if (lengths.length === 0) continue;
        const [, y = 0, blur = 0, spread = 0] = lengths;
        // Reach below the cap: half the blur falls outside the shadow's edge.
        expect(Math.abs(y) + spread + blur / 2).toBeLessThanOrEqual(widestGap);
      }
    }
  });

  it("does not put a cap back on the free-standing control shadow", () => {
    // The strike keyframe's 0%/100% must match the resting rule, or a struck cap pops and snaps back.
    const capRule = /\.fuji-keycap \{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(capRule).toBeTruthy();
    expect(capRule).toContain("var(--fuji-shadow-keycap)");

    const strike = /@keyframes fuji-keycap-strike \{([\s\S]*?)\n {2}\}/.exec(BASE_CSS)?.[1];
    expect(strike).toBeTruthy();
    expect(strike).not.toContain("var(--fuji-shadow-control)");
    expect([...strike!.matchAll(/var\(--fuji-shadow-keycap\)/g)]).toHaveLength(2);
  });

  it("gives a focused cap an author-declared outline ring instead of relying on the UA default", () => {
    // Stylesheet check: jsdom never matches `:focus-visible` from a real Tab press.
    const rule = /\.fuji-keycap:focus-visible\s*\{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain("var(--fuji-focus-ring)");
    expect(rule).toMatch(/outline(?!-offset):/);
    expect(rule).toContain("outline-offset");
    // Must be `outline`: Tailwind `ring-*` is `box-shadow`, already used by the sculpt and strike.
    expect(rule).not.toContain("box-shadow");
  });

  it("forwards its ref and spreads native props onto the root", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Keyboard ref={ref} layout="numpad" label="Number pad" data-testid="board" />);
    const root = screen.getByTestId("board");
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("role", "group");
    expect(root).toHaveAttribute("aria-label", "Number pad");
  });

  it("merges className and the per-slot classNames", () => {
    render(<Keyboard layout="numpad" className="board" classNames={{ key: "cap" }} data-testid="board" />);
    expect(screen.getByTestId("board")).toHaveClass("board");
    expect(cap("Numpad7")).toHaveClass("cap");
  });

  it("has no axe violations, static or interactive", async () => {
    const staticBoard = render(<Keyboard layout="compact" interactive={false} />);
    expect(await axe(staticBoard.container)).toHaveNoViolations();
    staticBoard.unmount();

    const interactive = render(<Keyboard layout="compact" />);
    expect(await axe(interactive.container)).toHaveNoViolations();
  });
});

describe("Keyboard focus", () => {
  it("does not blur the field it types into when laid out in flow", async () => {
    // Inline boards used to steal focus from the adjacent input on every press.
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(
      <>
        <input data-testid="field" />
        <Keyboard layout="numpad" onKeyPress={onKeyPress} />
      </>,
    );
    const field = screen.getByTestId("field");
    field.focus();

    await user.click(cap("Numpad7"));
    expect(document.activeElement).toBe(field);
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "Numpad7" }), expect.anything());
  });

  it("cancels the mousedown on an in-flow board and a floating one alike", () => {
    const { rerender } = render(<Keyboard layout="numpad" />);
    const press = () => {
      const event = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
      cap("Numpad7").dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(press()).toBe(true);

    rerender(<Keyboard floating open layout="numpad" />);
    expect(press()).toBe(true);
  });

  it("stays reachable from the keyboard - a cap still takes focus from Tab", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" soundToggle={false} />);
    await user.tab();
    expect(cap("Backspace")).toHaveFocus();
  });

  it("puts the sound toggle ahead of the caps, matching the order it is drawn in", async () => {
    // Focus order must follow visual order (WCAG 2.4.3): the strip above is reached first.
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);
    await user.tab();
    expect(screen.getByRole("button", { name: /key sounds/i })).toHaveFocus();
    await user.tab();
    expect(cap("Backspace")).toHaveFocus();
  });
});

describe("Keyboard floating", () => {
  it("renders nothing until it is opened, and unmounts again on close", () => {
    const { rerender } = render(<Keyboard floating open={false} layout="numpad" data-testid="board" />);
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();

    rerender(<Keyboard floating open layout="numpad" data-testid="board" />);
    expect(screen.getByTestId("board")).toBeInTheDocument();

    rerender(<Keyboard floating open={false} layout="numpad" data-testid="board" />);
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("stays closed by default, so a floating board never covers the page unasked", () => {
    render(<Keyboard floating layout="numpad" data-testid="board" />);
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("opens uncontrolled from defaultOpen and reports its own close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Keyboard floating defaultOpen onOpenChange={onOpenChange} layout="numpad" data-testid="board" />);
    expect(screen.getByTestId("board")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("pins itself to the viewport or to the nearest positioned ancestor", () => {
    const { rerender } = render(<Keyboard floating open layout="numpad" data-testid="board" />);
    const board = screen.getByTestId("board");
    expect(board).toHaveAttribute("data-fuji-keyboard-anchor", "viewport");
    expect(board).toHaveClass("fj:fixed", "fj:inset-x-0", "fj:bottom-0");

    rerender(<Keyboard floating open anchor="parent" placement="top" layout="numpad" data-testid="board" />);
    const parented = screen.getByTestId("board");
    expect(parented).toHaveAttribute("data-fuji-keyboard-anchor", "parent");
    expect(parented).toHaveClass("fj:absolute", "fj:top-0");
  });

  it("centers a floating board when placement is center", () => {
    // "bottom" and "top" are covered elsewhere; "center" had no assertion.
    render(<Keyboard floating open placement="center" layout="numpad" data-testid="board" />);
    const board = screen.getByTestId("board");
    expect(board).toHaveClass("fj:inset-x-0", "fj:top-1/2", "fj:-translate-y-1/2");
    expect(board).not.toHaveClass("fj:bottom-0", "fj:top-0");
  });

  it("leaves the margins around the board click-through", () => {
    render(<Keyboard floating open layout="numpad" data-testid="board" />);
    // The wrapper spans the anchor, so presses beside the board must reach the page.
    expect(screen.getByTestId("board")).toHaveClass("fj:pointer-events-none");
    expect(cap("Numpad7").closest(".fuji-keyboard-deck")).toHaveClass("fj:pointer-events-auto");
  });

  it("does not blur the field it types into", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input data-testid="field" />
        <Keyboard floating open layout="numpad" />
      </>,
    );
    const field = screen.getByTestId("field");
    field.focus();

    await user.click(cap("Numpad7"));
    expect(document.activeElement).toBe(field);
  });

  it("closes on an outside press but not on a press on its trigger or itself", async () => {
    const user = userEvent.setup();

    function Harness() {
      const trigger = React.useRef<HTMLButtonElement>(null);
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <button type="button" ref={trigger} data-testid="trigger" onClick={() => setOpen((on) => !on)}>
            Keyboard
          </button>
          <span data-testid="elsewhere">elsewhere</span>
          <Keyboard
            floating
            open={open}
            onOpenChange={setOpen}
            triggerRef={trigger}
            layout="numpad"
            data-testid="board"
          />
        </>
      );
    }

    render(<Harness />);
    await user.click(cap("Numpad7"));
    expect(screen.getByTestId("board")).toBeInTheDocument();

    // The trigger is excluded from outside-dismissal, so its click toggles rather than close+reopen.
    await user.click(screen.getByTestId("trigger"));
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("trigger"));
    expect(screen.getByTestId("board")).toBeInTheDocument();

    await user.click(screen.getByTestId("elsewhere"));
    expect(screen.queryByTestId("board")).not.toBeInTheDocument();
  });

  it("keeps Escape and outside presses inert when dismissible is off", async () => {
    const user = userEvent.setup();
    render(
      <>
        <span data-testid="elsewhere">elsewhere</span>
        <Keyboard floating defaultOpen dismissible={false} layout="numpad" data-testid="board" />
      </>,
    );

    await user.keyboard("{Escape}");
    await user.click(screen.getByTestId("elsewhere"));
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("stays open on a dismiss attempt when open is controlled with no onOpenChange to tell", async () => {
    // Controlled with no `onOpenChange`: dismissal must neither crash nor auto-close; `open` stays
    // exactly as the consumer set it.
    const user = userEvent.setup();
    render(
      <>
        <span data-testid="elsewhere">elsewhere</span>
        <Keyboard floating open layout="numpad" data-testid="board" />
      </>,
    );

    await user.keyboard("{Escape}");
    expect(screen.getByTestId("board")).toBeInTheDocument();

    await user.click(screen.getByTestId("elsewhere"));
    expect(screen.getByTestId("board")).toBeInTheDocument();
  });

  it("still reports presses, and stays a plain in-flow board when not floating", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<Keyboard floating open layout="numpad" onKeyPress={onKeyPress} data-testid="board" />);
    await user.click(cap("Numpad7"));
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "Numpad7" }), expect.anything());

    const inFlow = render(<Keyboard layout="numpad" data-testid="in-flow" />);
    const board = inFlow.getByTestId("in-flow");
    expect(board).not.toHaveAttribute("data-fuji-keyboard-anchor");
    expect(board).toHaveClass("fj:block");
    expect(board).not.toHaveClass("fj:fixed");
  });

  it("has no axe violations while docked", async () => {
    const { container } = render(<Keyboard floating open layout="compact" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Keyboard Caps Lock", () => {
  it("latches on, stays on, and reports uppercase letters while it is", async () => {
    const user = userEvent.setup();
    const pressed: Array<string | undefined> = [];
    render(<Keyboard layout="compact" onKeyPress={(key) => pressed.push(key.value)} />);

    await user.click(cap("KeyA"));
    await user.click(cap("CapsLock"));
    await user.click(cap("KeyA"));
    await user.click(cap("KeyB"));
    // Still on after two more caps - it latches rather than applying once.
    expect(pressed).toEqual(["a", undefined, "A", "B"]);

    await user.click(cap("CapsLock"));
    await user.click(cap("KeyA"));
    expect(pressed.at(-1)).toBe("a");
  });

  it("leaves digits and punctuation alone - Caps Lock is not Shift", async () => {
    const user = userEvent.setup();
    const pressed: Array<string | undefined> = [];
    render(<Keyboard layout="compact" onKeyPress={(key) => pressed.push(key.value)} />);

    await user.click(cap("CapsLock"));
    await user.click(cap("Digit1"));
    await user.click(cap("Comma"));
    expect(pressed.slice(1)).toEqual(["1", ","]);
  });

  it("lights a lamp on the cap and announces the toggle", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);
    const caps = cap("CapsLock");
    expect(caps).not.toHaveAttribute("data-locked");
    expect(caps).toHaveAttribute("aria-pressed", "false");

    await user.click(caps);
    expect(cap("CapsLock")).toHaveAttribute("data-locked", "true");
    expect(cap("CapsLock")).toHaveAttribute("aria-pressed", "true");

    // No other cap claims the toggle role.
    expect(cap("KeyA")).not.toHaveAttribute("aria-pressed");
  });

  it("puts the lamp clear of a wide cap's left-set legend", () => {
    const lamp = /\.fuji-keycap\[data-locked\]::after\s*\{([^}]*)\}/.exec(BASE_CSS)![1];
    // Latched caps here are wide and left-set, so only the right corner is reliably clear.
    expect(lamp).toContain("inset-inline-end");
    expect(lamp).not.toContain("inset-inline-start");
  });

  it("draws the lamp from the board's tone rather than redrawing the legend", () => {
    const lamp = /\.fuji-keycap\[data-locked\]::after\s*\{([^}]*)\}/.exec(BASE_CSS);
    expect(lamp).not.toBeNull();
    expect(lamp![1]).toContain("var(--fuji-keycap-glow)");
    // Sized from the cap unit, with a floor so it survives a scaled-down board.
    expect(lamp![1]).toMatch(/max\(3px,/);
  });

  it("follows the real Caps Lock key while captureKeys is on", () => {
    render(<Keyboard layout="compact" captureKeys />);
    engage();
    expect(cap("CapsLock")).not.toHaveAttribute("data-locked");

    act(() => {
      const event = new KeyboardEvent("keydown", { code: "CapsLock", key: "CapsLock" });
      // jsdom's KeyboardEvent has no modifier state of its own to set.
      Object.defineProperty(event, "getModifierState", { value: () => true });
      window.dispatchEvent(event);
    });
    expect(cap("CapsLock")).toHaveAttribute("data-locked", "true");
  });
});

describe("Keyboard shortcut modifiers", () => {
  it("latches a clicked ⌘ for the next cap, which then types nothing and reports meta", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);

    await user.click(cap("MetaLeft"));
    expect(cap("MetaLeft")).toHaveAttribute("aria-pressed", "true");
    expect(cap("MetaLeft")).toHaveAttribute("data-locked", "true");

    await user.click(cap("KeyA"));
    expect(onKeyPress).toHaveBeenLastCalledWith(expect.objectContaining({ code: "KeyA", value: undefined }), {
      shift: false,
      meta: true,
      ctrl: false,
      alt: false,
    });
    // Spent by the chord, like a sticky Shift.
    expect(cap("MetaLeft")).toHaveAttribute("aria-pressed", "false");

    await user.click(cap("KeyA"));
    expect(onKeyPress).toHaveBeenLastCalledWith(expect.objectContaining({ code: "KeyA", value: "a" }), {
      shift: false,
      meta: false,
      ctrl: false,
      alt: false,
    });
  });

  it("unlatches a modifier clicked a second time", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);
    await user.click(cap("ControlLeft"));
    await user.click(cap("ControlLeft"));
    expect(cap("ControlLeft")).toHaveAttribute("aria-pressed", "false");
  });

  it("counts a physically held ⌘ while the board is engaged", async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();
    render(<Keyboard floating open layout="compact" onKeyPress={onKeyPress} />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "MetaLeft", key: "Meta" }));
    });
    await user.click(cap("KeyC"));
    expect(onKeyPress).toHaveBeenLastCalledWith(
      expect.objectContaining({ code: "KeyC", value: undefined }),
      expect.objectContaining({ meta: true }),
    );
  });
});

describe("Keyboard hold to repeat", () => {
  it("repeats a held cap after a pause, and the click that ends the hold adds nothing", () => {
    vi.useFakeTimers();
    try {
      const onKeyPress = vi.fn();
      render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);
      const backspace = cap("Backspace");

      fireEvent.pointerDown(backspace, { button: 0 });
      act(() => vi.advanceTimersByTime(399));
      expect(onKeyPress).not.toHaveBeenCalled();
      // The first press at 400ms, then one every 50ms.
      act(() => vi.advanceTimersByTime(1 + 150));
      expect(onKeyPress).toHaveBeenCalledTimes(4);
      expect(onKeyPress).toHaveBeenLastCalledWith(
        expect.objectContaining({ code: "Backspace" }),
        expect.anything(),
      );

      fireEvent.pointerUp(backspace);
      fireEvent.click(backspace, { detail: 1 });
      act(() => vi.advanceTimersByTime(500));
      expect(onKeyPress).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports a quick tap exactly once", () => {
    vi.useFakeTimers();
    try {
      const onKeyPress = vi.fn();
      render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);
      fireEvent.pointerDown(cap("KeyA"), { button: 0 });
      act(() => vi.advanceTimersByTime(120));
      fireEvent.pointerUp(cap("KeyA"));
      fireEvent.click(cap("KeyA"), { detail: 1 });
      act(() => vi.advanceTimersByTime(1000));
      expect(onKeyPress).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops repeating when the pointer slides off the cap", () => {
    vi.useFakeTimers();
    try {
      const onKeyPress = vi.fn();
      render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);
      fireEvent.pointerDown(cap("Backspace"), { button: 0 });
      act(() => vi.advanceTimersByTime(450));
      fireEvent.pointerLeave(cap("Backspace"));
      const calls = onKeyPress.mock.calls.length;
      act(() => vi.advanceTimersByTime(1000));
      expect(onKeyPress).toHaveBeenCalledTimes(calls);
    } finally {
      vi.useRealTimers();
    }
  });

  it("never repeats a modifier or a toggle", () => {
    vi.useFakeTimers();
    try {
      const onKeyPress = vi.fn();
      render(<Keyboard layout="compact" onKeyPress={onKeyPress} />);
      fireEvent.pointerDown(cap("ShiftLeft"), { button: 0 });
      fireEvent.pointerDown(cap("MetaLeft"), { button: 0 });
      act(() => vi.advanceTimersByTime(2000));
      expect(onKeyPress).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Keyboard sizing", () => {
  it("derives the cap unit from `width` instead of the size scale", () => {
    render(<Keyboard layout="numpad" width="900px" data-testid="board" />);
    const deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("900px");
  });

  it("takes a number of pixels as well as a CSS length", () => {
    render(<Keyboard layout="numpad" width={640} />);
    const deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("640px");
  });

  it("lifts the size's cap ceiling when a width is given, so width can grow a board", () => {
    // With the ceiling left on, an in-flow `width="900px"` drew a 630px board.
    render(<Keyboard layout="compact" width="900px" />);
    const deck = cap("KeyA").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-ceiling")).toBe("100000px");
  });

  it("reads a percentage width as a share of the board's container", () => {
    // A bare `%` in calc() resolves against the grid itself: `width="100%"` collapsed a numpad.
    render(<Keyboard layout="numpad" width="100%" />);
    const deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("100cqi");
  });

  it("subtracts the deck's own border from the container-bound unit", () => {
    const deck = /\.fuji-keyboard-deck\s*\{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(deck).toContain("--fuji-key-frame: 2px");
    expect(deck).toMatch(/100cqi - var\(--fuji-key-pad\) \* 2 - var\(--fuji-key-frame\)/);
  });

  it("leaves an in-flow board on the px cap scale when no width is given", () => {
    render(<Keyboard layout="numpad" />);
    const deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("");
    expect(deck.style.getPropertyValue("--fuji-key-ceiling")).toBe("");
  });

  it("renders the sm and lg deck size classes, not only the md default", () => {
    // Every other test uses `md`, so a swapped `SIZE_CLASSES` entry would otherwise go unnoticed.
    const { rerender, container } = render(<Keyboard layout="numpad" size="sm" />);
    const deck = () => container.querySelector(".fuji-keyboard-deck")!;
    expect(deck()).toHaveClass("fuji-keyboard-sm");
    expect(deck()).not.toHaveClass("fuji-keyboard-md");
    expect(deck()).not.toHaveClass("fuji-keyboard-lg");

    rerender(<Keyboard layout="numpad" size="lg" />);
    expect(deck()).toHaveClass("fuji-keyboard-lg");
    expect(deck()).not.toHaveClass("fuji-keyboard-sm");
    expect(deck()).not.toHaveClass("fuji-keyboard-md");
  });

  it("sizes every floating board from the screen, and lets width override it", () => {
    const { rerender } = render(<Keyboard floating open layout="numpad" />);
    let deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck).toHaveClass("fuji-keyboard-md");
    // No inline target: the default comes from the size class in base.css.
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("");

    rerender(<Keyboard floating open layout="numpad" width="50rem" />);
    deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("50rem");
  });

  it("gives a docked board a screen-relative default of at least 60vw at md", () => {
    const target = (size: string) =>
      new RegExp(`\\.fuji-keyboard-floating \\.fuji-keyboard-${size}\\s*\\{([^}]*)\\}`).exec(BASE_CSS)?.[1];

    // The default size, as a rule rather than px: a dock is sized to the display, not the cap scale.
    expect(target("md")).toContain("min(96vw, max(60vw, 40rem))");
    expect(target("sm")).toContain("45vw");
    expect(target("lg")).toContain("75vw");

    // A target, not a floor: min() with the ceiling and container keeps it inside its parent.
    const deck = /\.fuji-keyboard-deck\s*\{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(deck).toContain("var(--fuji-key-ceiling)");
    expect(deck).toContain("100cqi");

    // Parent-anchored docks drop the viewport target: 60vw over four numpad columns is a 187px cap.
    expect(BASE_CSS).toContain(
      '.fuji-keyboard-floating[data-fuji-keyboard-anchor="parent"] .fuji-keyboard-deck',
    );
  });
});

describe("Keyboard Shift", () => {
  const values = (keys: Array<{ value?: string }>) => keys.map((k) => k.value);

  it("takes the second legend, and applies to one cap before letting go", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" onKeyPress={(key) => seen.push(key)} />);

    await user.click(cap("ShiftLeft"));
    await user.click(cap("Digit1"));
    await user.click(cap("Digit1"));
    // Sticky, not latched: the second `1` is unshifted again.
    expect(values(seen).slice(1)).toEqual(["!", "1"]);
  });

  it("shifts letters to uppercase", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" onKeyPress={(key) => seen.push(key)} />);
    await user.click(cap("ShiftRight"));
    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("A");
  });

  it("cancels against Caps Lock the way the hardware does", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" onKeyPress={(key) => seen.push(key)} />);

    await user.click(cap("CapsLock"));
    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("A");

    await user.click(cap("ShiftLeft"));
    await user.click(cap("KeyA"));
    // Shift on a locked board types lowercase.
    expect(seen.at(-1)?.value).toBe("a");

    // ...and Caps Lock is still on afterwards; Shift only spent itself.
    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("A");
  });

  it("lights the side that is engaged, and releases when pressed again", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
    expect(cap("ShiftRight")).not.toHaveAttribute("data-locked");
    expect(cap("ShiftLeft")).toHaveAttribute("aria-pressed", "true");

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
  });

  it("shares one Shift with the physical keyboard, held rather than sticky", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />);
    engage();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftRight", key: "Shift" }));
    });
    expect(cap("ShiftRight")).toHaveAttribute("data-locked", "true");

    // Held, so it survives more than one cap - unlike a Shift armed by click.
    await user.click(cap("KeyA"));
    await user.click(cap("KeyB"));
    expect(values(seen)).toEqual(["A", "B"]);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftRight", key: "Shift" }));
    });
    expect(cap("ShiftRight")).not.toHaveAttribute("data-locked");
    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("a");
  });

  it("does not let the real Shift release one armed by clicking the cap", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" captureKeys />);
    engage();
    await user.click(cap("ShiftLeft"));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
  });

  it("drops the modifier when the window loses focus mid-hold", () => {
    render(<Keyboard layout="compact" captureKeys />);
    engage();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
  });

  it("keeps a sticky Shift armed through a window blur, unlike a physically held one", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />);
    engage();

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    // Click-armed, so it never awaited a keyup; a blur is no evidence the user let go.
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("A");
  });

  it("releases a physical Shift when captureKeys is turned off mid-hold, instead of stranding the cap lit", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    const { rerender } = render(
      <Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />,
    );
    engage();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // Its keyup listener was torn down with the effect, so nothing else could release it.
    rerender(<Keyboard layout="compact" captureKeys={false} onKeyPress={(key) => seen.push(key)} />);
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
    expect(cap("ShiftLeft")).toHaveAttribute("aria-pressed", "false");

    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("a");
  });

  it("leaves a sticky Shift armed when captureKeys is turned off, since the real keyboard never armed it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Keyboard layout="compact" captureKeys />);
    engage();

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    rerender(<Keyboard layout="compact" captureKeys={false} />);
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
  });

  it("does not let a click on the held cap itself cancel a physical Shift hold", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />);
    engage();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // Clicking the held cap must not null the state, or the physical keyup has nothing to release.
    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("A");

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
    await user.click(cap("KeyB"));
    expect(seen.at(-1)?.value).toBe("b");
  });

  it("does not let a click on the other Shift cap turn a physical hold into a one-shot sticky latch", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />);
    engage();

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // Clicking the OTHER cap mid-hold must not arm a sticky latch: both caps are one modifier.
    await user.click(cap("ShiftRight"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
    expect(cap("ShiftRight")).not.toHaveAttribute("data-locked");

    // Not a spent one-shot: two letters both come through shifted (`seen[0]` is the ShiftRight click).
    await user.click(cap("KeyA"));
    await user.click(cap("KeyB"));
    expect(values(seen).slice(1)).toEqual(["A", "B"]);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
    await user.click(cap("KeyC"));
    expect(seen.at(-1)?.value).toBe("c");
  });
});

describe("Keyboard sound", () => {
  it("stays silent unless asked, and synthesises the click when it is", async () => {
    const user = userEvent.setup();
    const started: number[] = [];
    class FakeOscillator {
      type = "";
      frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
      connect = vi.fn(() => ({ connect: vi.fn() }));
      start = vi.fn((at: number) => started.push(at));
      stop = vi.fn();
    }
    const context = {
      currentTime: 0,
      state: "running",
      createOscillator: vi.fn(() => new FakeOscillator()),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      resume: vi.fn(),
      close: vi.fn(),
    };
    // A function, not an arrow: `new AudioContext()` needs [[Construct]] (Vitest 4 throws on arrows).
    // Returning an object from a constructor yields it, so `new Ctor()` is `context`.
    const Ctor = vi.fn(function () {
      return context;
    });
    vi.stubGlobal("AudioContext", Ctor);

    const silent = render(<Keyboard layout="numpad" />);
    await user.click(cap("Numpad7"));
    expect(Ctor).not.toHaveBeenCalled();
    silent.unmount();

    render(<Keyboard layout="numpad" sound />);
    await user.click(cap("Numpad7"));
    await user.click(cap("Numpad8"));
    // One context for the board, one oscillator per press.
    expect(Ctor).toHaveBeenCalledTimes(1);
    expect(started).toHaveLength(2);

    vi.unstubAllGlobals();
  });

  it("presses silently rather than throwing where the API is missing", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("AudioContext", undefined);
    const onKeyPress = vi.fn();
    render(<Keyboard layout="numpad" sound onKeyPress={onKeyPress} />);
    await user.click(cap("Numpad7"));
    expect(onKeyPress).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("closes the shared AudioContext as soon as sound is turned off, not only on unmount", async () => {
    // Browsers cap AudioContexts per document, so one left open until unmount is a real leak.
    const user = userEvent.setup();
    class FakeOscillator {
      type = "";
      frequency = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
      connect = vi.fn(() => ({ connect: vi.fn() }));
      start = vi.fn();
      stop = vi.fn();
    }
    const context = {
      currentTime: 0,
      state: "running",
      createOscillator: vi.fn(() => new FakeOscillator()),
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      resume: vi.fn(),
      close: vi.fn(),
    };
    context.close = vi.fn(() => {
      context.state = "closed";
      return Promise.resolve();
    });
    // A function, not an arrow: `new AudioContext()` needs [[Construct]] (Vitest 4 throws on arrows).
    // Returning an object from a constructor yields it, so `new Ctor()` is `context`.
    const Ctor = vi.fn(function () {
      return context;
    });
    vi.stubGlobal("AudioContext", Ctor);

    const { rerender, unmount } = render(<Keyboard layout="numpad" sound />);
    await user.click(cap("Numpad7"));
    expect(Ctor).toHaveBeenCalledTimes(1);
    expect(context.state).toBe("running");

    rerender(<Keyboard layout="numpad" sound={false} />);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.state).toBe("closed");

    // A second close() on unmount would reject and surface as an unhandled rejection.
    unmount();
    expect(context.close).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});

describe("Keyboard sound toggle", () => {
  it("is there by default on a board you can press", () => {
    render(<Keyboard layout="numpad" />);
    expect(screen.getByRole("button", { name: /key sounds/i })).toBeInTheDocument();
  });

  it("is absent on a static diagram, which has nothing to sound", () => {
    render(<Keyboard layout="numpad" interactive={false} />);
    expect(screen.queryByRole("button", { name: /key sounds/i })).not.toBeInTheDocument();
  });

  it("can be turned off where the app offers the control itself", () => {
    render(<Keyboard layout="numpad" soundToggle={false} />);
    expect(screen.queryByRole("button", { name: /key sounds/i })).not.toBeInTheDocument();
  });

  it("turns its own sound on and off, uncontrolled", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" soundToggle />);
    const toggle = screen.getByRole("button", { name: "Turn key sounds on" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    // The name states the action and the pressed state carries the fact.
    expect(screen.getByRole("button", { name: "Turn key sounds off" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("starts from defaultSound and reports every change", async () => {
    const user = userEvent.setup();
    const onSoundChange = vi.fn();
    render(<Keyboard layout="numpad" soundToggle defaultSound onSoundChange={onSoundChange} />);
    const toggle = screen.getByRole("button", { name: "Turn key sounds off" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(onSoundChange).toHaveBeenCalledWith(false);
  });

  it("obeys the controlled prop rather than its own click", async () => {
    const user = userEvent.setup();
    const onSoundChange = vi.fn();
    render(<Keyboard layout="numpad" soundToggle sound={false} onSoundChange={onSoundChange} />);
    await user.click(screen.getByRole("button", { name: "Turn key sounds on" }));
    // Controlled: nothing re-rendered it with a new value, so nothing moved.
    expect(onSoundChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Turn key sounds on" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps the caps below the toolbar, in layout order", () => {
    // The toolbar takes grid row 1, so every cap shifts down one or sits under the strip.
    const { rerender } = render(<Keyboard layout="numpad" soundToggle={false} />);
    const rowOf = (code: string) => Number(cap(code).style.gridRow.split(" / ")[0]);
    const bare = rowOf("Numpad7");
    rerender(<Keyboard layout="numpad" soundToggle />);
    expect(rowOf("Numpad7")).toBe(bare + 1);
    // ...and back up again when the strip goes away.
    rerender(<Keyboard layout="numpad" soundToggle={false} />);
    expect(rowOf("Numpad7")).toBe(bare);
  });

  it("is disabled along with the board", () => {
    render(<Keyboard layout="numpad" soundToggle disabled />);
    expect(screen.getByRole("button", { name: /key sounds/i })).toBeDisabled();
  });

  it("warns when the toggle is drawn against a controlled prop nobody listens to", () => {
    // Catches a toggle that silently does nothing and looks flaky rather than miswired.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Keyboard layout="numpad" sound />);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("no `onSoundChange`"));

    error.mockClear();
    render(<Keyboard layout="numpad" sound onSoundChange={() => {}} />);
    render(<Keyboard layout="numpad" defaultSound />);
    render(<Keyboard layout="numpad" sound soundToggle={false} />);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Keyboard layout="numpad" soundToggle />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Keyboard regressions", () => {
  it("keeps a tab stop when the layout changes under a focused board", () => {
    const stops = () => document.querySelectorAll('[data-fuji-key][tabindex="0"]').length;
    const { rerender } = render(<Keyboard layout="full" />);
    expect(stops()).toBe(1);

    // A cap that only the full board has.
    act(() => cap("Numpad5").focus());
    expect(stops()).toBe(1);

    // Switching `layout` after focus left the remembered code off-board, every cap at tabIndex -1,
    // and the board out of the tab order for good.
    rerender(<Keyboard layout="compact" />);
    expect(document.querySelector('[data-fuji-key="Numpad5"]')).toBeNull();
    expect(stops()).toBe(1);
  });

  it("does not re-attach a callback ref on every render", () => {
    const calls: Array<HTMLDivElement | null> = [];
    const collect = (node: HTMLDivElement | null) => {
      calls.push(node);
    };
    const { rerender } = render(<Keyboard layout="numpad" ref={collect} />);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBeInstanceOf(HTMLDivElement);

    rerender(<Keyboard layout="numpad" ref={collect} tone="water" />);
    rerender(<Keyboard layout="numpad" ref={collect} tone="sun" />);
    // An undeps'd imperative handle detached/re-attached on every commit.
    expect(calls).toHaveLength(1);
  });

  it("does not re-attach a per-cap ref callback on every render", () => {
    // Inline ref callbacks cost 99 `set` + 99 `delete` per `full` re-render (for a `tone` change).
    // Spies on `Map` since `caps` has no hook; filtering on node values excludes the callback cache.
    const sets = vi.spyOn(Map.prototype, "set");
    const deletes = vi.spyOn(Map.prototype, "delete");
    const { rerender } = render(<Keyboard layout="numpad" />);
    const attachesFor = (code: string) =>
      sets.mock.calls.filter(([key, value]) => key === code && value instanceof HTMLButtonElement).length;
    expect(attachesFor("Numpad7")).toBe(1);

    sets.mockClear();
    rerender(<Keyboard layout="numpad" tone="water" />);
    expect(deletes.mock.calls.filter(([key]) => key === "Numpad7")).toHaveLength(0);
    expect(attachesFor("Numpad7")).toBe(0);

    sets.mockRestore();
    deletes.mockRestore();
  });

  it("reports null through the ref while a floating board is closed", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { rerender } = render(<Keyboard floating open ref={ref} layout="numpad" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    rerender(<Keyboard floating open={false} ref={ref} layout="numpad" />);
    expect(ref.current).toBeNull();
  });

  it("names a blank cap on a static board", () => {
    // A blank <kbd> space bar has no name requirement for axe to catch; it was just empty.
    const staticBoard = render(<Keyboard layout="compact" interactive={false} />);
    const space = staticBoard.container.querySelector('[data-fuji-key="Space"]')!;
    expect(space.tagName).toBe("KBD");
    expect(space).toHaveTextContent("Space");
    staticBoard.unmount();

    // The interactive path names it on the button, where aria-label is allowed.
    render(<Keyboard layout="compact" />);
    expect(cap("Space")).toHaveAttribute("aria-label", "Space");
  });

  it("names a glyph cap for screen readers on a static board too, not only a blank one", () => {
    // Shortcut diagrams are read, not clicked, so glyph caps need a name; `aria-label` is prohibited
    // on `<kbd>`, and the sr-only fallback used to cover only `hideLabel` caps.
    const staticBoard = render(<Keyboard layout="compact" interactive={false} />);
    const arrowUp = staticBoard.container.querySelector('[data-fuji-key="ArrowUp"]')!;
    expect(arrowUp.tagName).toBe("KBD");
    // The glyph is still what's drawn...
    expect(arrowUp).toHaveTextContent("↑");
    // ...but hidden from assistive tech, which reads the real name instead.
    expect(arrowUp.querySelector('[aria-hidden="true"]')).toHaveTextContent("↑");
    expect(arrowUp.querySelector(".fj\\:sr-only")).toHaveTextContent("Arrow up");

    // A cap whose name matches its label (a plain letter) gets none of this.
    const keyA = staticBoard.container.querySelector('[data-fuji-key="KeyA"]')!;
    expect(keyA.querySelector(".fj\\:sr-only")).toBeNull();
    staticBoard.unmount();
  });

  it("prints one cap the same way in every layout it appears in", () => {
    // Left-set is for Tab/Caps/Shift, not any wide column-1 cap: numpad's 2u `0` must print the
    // same on `numpad` (column 1) as on `full` (mid-row).
    const numpad = render(<Keyboard layout="numpad" />);
    const inNumpad = cap("Numpad0").getAttribute("data-wide");
    numpad.unmount();

    render(<Keyboard layout="full" />);
    expect(cap("Numpad0").getAttribute("data-wide")).toBe(inNumpad);
    expect(inNumpad).toBeNull();

    // The modifier column still is left-set.
    expect(cap("CapsLock")).toHaveAttribute("data-wide", "true");
  });

  it("only left-sets a wide cap that carries a word legend, not a lone glyph", () => {
    // Phone's 1.5u ShiftLeft is at column 1, but a lone `⇧` left-set looked broken beside the
    // centred `⌫` at the other end of the row.
    const phone = render(<Keyboard layout="phone" />);
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-wide");
    expect(cap("Backspace")).not.toHaveAttribute("data-wide");
    phone.unmount();

    // A wide cap with a word legend still left-sets on the desktop boards.
    for (const layout of ["full", "tkl", "compact"] as const) {
      const { unmount } = render(<Keyboard layout={layout} />);
      expect(cap("Tab")).toHaveAttribute("data-wide", "true");
      expect(cap("CapsLock")).toHaveAttribute("data-wide", "true");
      expect(cap("ShiftLeft")).toHaveAttribute("data-wide", "true");
      unmount();
    }
  });
});
