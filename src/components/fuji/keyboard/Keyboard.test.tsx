import fs from "node:fs";
import path from "node:path";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
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
    // The invariant a row-width arithmetic slip breaks silently: the resolver
    // will happily shift a cap right to avoid an overlap, so a bottom row one
    // unit too wide widened the whole board and pushed the numpad's Enter off
    // the right-hand edge with every other assertion still green.
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

  it("keeps the phone layout at most ten units wide, so an interactive cap clears the 24x24 target floor", () => {
    // Column count is the whole story here: the sizing already takes min()
    // against the container, so a narrower board is the only lever that moves
    // a phone-width cap above the WCAG 2.5.8 floor. jsdom does no layout, so
    // this pins the column count rather than a pixel size it can't produce.
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
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "Numpad7", value: "7" }));
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

    // The restart is the component's own job: nothing clears `data-struck` on
    // `animationend`, because a throttled tab never delivers that event. A cap
    // hit while still marked must be un-marked, reflowed and re-marked, or the
    // second strike silently plays nothing.
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

    expect(cap("NumLock")).toHaveAttribute("tabindex", "0");
    expect(cap("Numpad7")).toHaveAttribute("tabindex", "-1");

    await user.tab();
    expect(cap("NumLock")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(cap("NumpadDivide")).toHaveFocus();
    expect(cap("NumpadDivide")).toHaveAttribute("tabindex", "0");
    expect(cap("NumLock")).toHaveAttribute("tabindex", "-1");

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
    expect(cap("NumLock")).toHaveFocus();
  });

  it("stays put at the edge of the board", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="numpad" />);

    act(() => cap("NumLock").focus());
    await user.keyboard("{ArrowLeft}{ArrowUp}");
    expect(cap("NumLock")).toHaveFocus();
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
    // A default accent shipped five red caps that meant nothing, which reads as
    // a highlight the consumer did not ask for. Colour is opt-in.
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

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).toHaveAttribute("data-pressed", "true");
    await user.keyboard("{/Shift}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
  });

  it("ignores the real keyboard unless captureKeys is set", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" />);

    await user.keyboard("{Shift>}");
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-pressed");
    await user.keyboard("{/Shift}");
  });

  it("drops every lit cap when the window loses focus mid-press", async () => {
    const user = userEvent.setup();
    render(<Keyboard layout="compact" captureKeys />);

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
    unmount();

    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toEqual(expect.arrayContaining(["keydown", "keyup", "blur"]));
    remove.mockRestore();
    await user.keyboard("{a}");
  });

  it("clears a held key's pressed state when captureKeys is turned off mid-hold", () => {
    const { rerender } = render(<Keyboard layout="compact" captureKeys />);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    });
    expect(cap("KeyE")).toHaveAttribute("data-pressed", "true");

    // The physical key can come back up while captureKeys is off - a keyup
    // this effect has no listener for, since captureKeys governs whether one
    // exists at all. The render-time gate that hides `pressedCodes` while the
    // prop is off only masks this; it does not clear the underlying state.
    rerender(<Keyboard layout="compact" captureKeys={false} />);
    expect(cap("KeyE")).not.toHaveAttribute("data-pressed");

    // Turning captureKeys back on must not resurrect a code from before the
    // teardown - nothing observed the real key coming back up, so a state
    // that survived the teardown would report it held forever.
    rerender(<Keyboard layout="compact" captureKeys />);
    expect(cap("KeyE")).not.toHaveAttribute("data-pressed");
  });

  it("gives a cap no hover state - the press is the only feedback", () => {
    // Asserted against the stylesheet because a hover rule is invisible to a
    // render test: jsdom has no pointer, so a cap that lifts under the cursor
    // would pass every behavioural assertion in this file.
    const hoverRules = [...BASE_CSS.matchAll(/^[^{}\n]*fuji-keycap[^{}\n]*:hover[^{}\n]*\{/gm)].map((match) =>
      match[0].trim(),
    );
    expect(hoverRules).toEqual([]);
  });

  it("keeps every cap shadow inside the gap between caps", () => {
    // A cap is recessed into its board, so its shadow is a contact shadow. It
    // used to take `--fuji-shadow-control`, the token for free-standing
    // controls: at `floating` elevation that reaches ~28px down, into a gap
    // that is never wider than 5px. The overflow is drawn entirely underneath
    // the neighbouring cap - invisible, and paid for once per cap on a board
    // that has up to 104 of them. Guarded here rather than visually because
    // the wasted rasters look identical to the correct ones.
    //
    // `matchAll` deliberately, not `exec`: the token is defined once per
    // theme, and a non-global read would check light and silently skip dark.
    const gaps = [...BASE_CSS.matchAll(/--fuji-key-gap:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(gaps.length).toBeGreaterThan(0);
    const widestGap = Math.max(...gaps);

    const defs = [...TOKENS_CSS.matchAll(/--fuji-shadow-keycap:\s*([^;]+);/g)].map((m) => m[1]);
    // One per theme. A material or elevation block redefining it would put the
    // cap back on an elevation-scaled shadow, which is the bug.
    expect(defs).toHaveLength(2);

    for (const def of defs) {
      // Strip the colour functions first so their internal commas cannot be
      // mistaken for layer separators.
      for (const layer of def.replace(/\b(?:rgba?|hsla?|color)\([^)]*\)/g, "").split(",")) {
        // Positionally, NOT by matching a `px` suffix: a zero offset is written
        // unitless (`0 1px 3px`), so a /px/ match silently drops it and shifts
        // every value one slot left - which reads the BLUR as the y-offset and
        // the y-offset not at all. That made this guard pass `0 20px 2px`
        // (real reach 21px) as "reach 2".
        const lengths = layer
          .trim()
          .split(/\s+/)
          .map((token) => Number.parseFloat(token))
          .filter((n) => !Number.isNaN(n));
        if (lengths.length === 0) continue;
        const [, y = 0, blur = 0, spread = 0] = lengths;
        // How far the shadow is painted below the cap: the blur fades over
        // `blur`, half of it outside the shadow's own edge.
        expect(Math.abs(y) + spread + blur / 2).toBeLessThanOrEqual(widestGap);
      }
    }
  });

  it("does not put a cap back on the free-standing control shadow", () => {
    // Both the resting rule and the strike keyframe's 0%/100% frames, which
    // have to agree with it or a struck cap pops to a different shadow for the
    // length of the animation and snaps back.
    const capRule = /\.fuji-keycap \{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(capRule).toBeTruthy();
    expect(capRule).toContain("var(--fuji-shadow-keycap)");

    const strike = /@keyframes fuji-keycap-strike \{([\s\S]*?)\n {2}\}/.exec(BASE_CSS)?.[1];
    expect(strike).toBeTruthy();
    expect(strike).not.toContain("var(--fuji-shadow-control)");
    expect([...strike!.matchAll(/var\(--fuji-shadow-keycap\)/g)]).toHaveLength(2);
  });

  it("gives a focused cap an author-declared outline ring instead of relying on the UA default", () => {
    // Asserted against the stylesheet for the same reason as the hover rule
    // above: jsdom does not match `:focus-visible` from a real Tab press, so
    // a missing rule here would still pass every render-level assertion.
    const rule = /\.fuji-keycap:focus-visible\s*\{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(rule).toBeTruthy();
    expect(rule).toContain("var(--fuji-focus-ring)");
    expect(rule).toMatch(/outline(?!-offset):/);
    expect(rule).toContain("outline-offset");
    // A Tailwind `ring-*` utility compiles to `box-shadow` - the same
    // property the moulded-cap sculpt and the strike keyframe already use -
    // so this has to be `outline`, a separate layer, rather than adding to
    // that property.
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
    // "bottom" and "top" are exercised above and by the default; "center" -
    // the third option - had nothing asserting it at all.
    render(<Keyboard floating open placement="center" layout="numpad" data-testid="board" />);
    const board = screen.getByTestId("board");
    expect(board).toHaveClass("fj:inset-x-0", "fj:top-1/2", "fj:-translate-y-1/2");
    expect(board).not.toHaveClass("fj:bottom-0", "fj:top-0");
  });

  it("leaves the margins around the board click-through", () => {
    render(<Keyboard floating open layout="numpad" data-testid="board" />);
    // The wrapper spans the whole anchor, so a press on the page either side
    // of the board has to reach the page rather than the keyboard.
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

    // The trigger is excluded from outside-dismissal, so its own click is the
    // only thing that toggles it - not a close followed by a reopen.
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
    // A fully controlled board with nothing wired to `onOpenChange` has no way
    // to act on its own dismissal - `useControllableState` calls the (absent)
    // callback and otherwise leaves `open` exactly as the consumer set it.
    // This is the "controlled and the consumer hasn't wired a handler yet"
    // state, not a crash or a silent auto-close, and nothing exercised it.
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
    expect(onKeyPress).toHaveBeenCalledWith(expect.objectContaining({ code: "Numpad7" }));

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
    // Every latched cap on this board is wide, so its legend is against the
    // left edge and only the right corner is reliably clear.
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

  it("leaves an in-flow board on the px cap scale when no width is given", () => {
    render(<Keyboard layout="numpad" />);
    const deck = cap("Numpad7").closest(".fuji-keyboard-deck") as HTMLElement;
    expect(deck.style.getPropertyValue("--fuji-key-target")).toBe("");
  });

  it("renders the sm and lg deck size classes, not only the md default", () => {
    // Every other test in this file renders the `md` default, so a swapped
    // `SIZE_CLASSES` entry (`sm` pointing at the `md` or `lg` class, say)
    // would pass the whole suite with nothing exercising `sm` or `lg` at all.
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

    // The default size. The reason this is a rule rather than a px value: a
    // dock is measured against the display, not against the cap scale that
    // suits a board sitting inside a card.
    expect(target("md")).toContain("min(96vw, max(60vw, 40rem))");
    expect(target("sm")).toContain("45vw");
    expect(target("lg")).toContain("75vw");

    // A target, never a floor - the unit still takes the smaller of it, the
    // size's own ceiling, and whatever the container can actually give, so a
    // board can never outgrow its parent.
    const deck = /\.fuji-keyboard-deck\s*\{([^}]*)\}/.exec(BASE_CSS)?.[1];
    expect(deck).toContain("var(--fuji-key-ceiling)");
    expect(deck).toContain("100cqi");

    // A parent-anchored dock drops the viewport target entirely: 60vw spread
    // over the numpad's four columns is a 187px cap that swallows the card.
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
    await user.click(cap("ShiftLeft"));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
  });

  it("drops the modifier when the window loses focus mid-hold", () => {
    render(<Keyboard layout="compact" captureKeys />);
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

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    // Armed by a click, so no keyup was ever going to release it - a blur
    // (the lost-keyup case this handler exists for) is not evidence the user
    // let go of it.
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

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // The keyup that would have released this Shift can never arrive now -
    // its listener was just torn down along with the rest of the effect - so
    // nothing else is left to let go of it.
    rerender(<Keyboard layout="compact" captureKeys={false} onKeyPress={(key) => seen.push(key)} />);
    expect(cap("ShiftLeft")).not.toHaveAttribute("data-locked");
    expect(cap("ShiftLeft")).toHaveAttribute("aria-pressed", "false");

    await user.click(cap("KeyA"));
    expect(seen.at(-1)?.value).toBe("a");
  });

  it("leaves a sticky Shift armed when captureKeys is turned off, since the real keyboard never armed it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Keyboard layout="compact" captureKeys />);

    await user.click(cap("ShiftLeft"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    rerender(<Keyboard layout="compact" captureKeys={false} />);
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
  });

  it("does not let a click on the held cap itself cancel a physical Shift hold", async () => {
    const user = userEvent.setup();
    const seen: Array<{ value?: string }> = [];
    render(<Keyboard layout="compact" captureKeys onKeyPress={(key) => seen.push(key)} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // Clicking the very cap the real key is holding down must not null the
    // shared state out from under it - the physical key is still down, and
    // there would be nothing left for its keyup to release.
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

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ShiftLeft", key: "Shift" }));
    });
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");

    // Clicking the OTHER cap while the real key holds this one must not arm a
    // fresh sticky latch there either - the two caps are one shared modifier,
    // not two, so this has to stay a no-op for as long as the hold lasts.
    await user.click(cap("ShiftRight"));
    expect(cap("ShiftLeft")).toHaveAttribute("data-locked", "true");
    expect(cap("ShiftRight")).not.toHaveAttribute("data-locked");

    // Proof it isn't a spent one-shot: two more letters both come through
    // shifted, not just the first. (`seen[0]` is the ShiftRight click itself,
    // which reports its own - valueless - key def.)
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
    // A regular function, not an arrow: the component calls `new AudioContext()`,
    // and an arrow has no [[Construct]]. Vitest 3 tolerated it; Vitest 4 throws
    // "() => context is not a constructor". Returning an object from a function
    // constructor yields that object, so `new Ctor()` is still `context`.
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
    // Browsers cap AudioContexts per document, so one left open for the rest
    // of the component's life - because only the unmount effect ever closed
    // it - is a real leak, not a cosmetic one.
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
    // A regular function, not an arrow: the component calls `new AudioContext()`,
    // and an arrow has no [[Construct]]. Vitest 3 tolerated it; Vitest 4 throws
    // "() => context is not a constructor". Returning an object from a function
    // constructor yields that object, so `new Ctor()` is still `context`.
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

    // Already closed and nulled out the moment sound went false - unmounting
    // afterwards must not call close() a second time, which would reject on
    // an already-closed context and surface as an unhandled rejection.
    unmount();
    expect(context.close).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
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

    // `layout` is a prop, so it can change under a board that has already been
    // focused - a size toggle, a responsive switch, the Storybook select. The
    // remembered code is not on the new board, and without a fallback every
    // cap sat at tabIndex -1 and the board left the tab order for good.
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
    // An imperative handle with no dependency array re-ran on every commit and
    // gave a detach/attach pair per render of a hundred-cap board.
    expect(calls).toHaveLength(1);
  });

  it("does not re-attach a per-cap ref callback on every render", () => {
    // Each cap's ref callback is cached per `code` rather than written inline
    // in the render below, for the same reason as the root ref just above: an
    // inline `(node) => { ... }` is a new function every render, and React
    // detaches and reattaches a ref whenever its identity changes - measured
    // at 99 `set` calls plus 99 `delete` calls per re-render of the `full`
    // board, for a prop (`tone`) that touched no cap at all. Spied on `Map`
    // itself, since `caps` - the map the ref callback writes into - is a
    // plain `Map` with no public hook of its own. Filtered to a node value to
    // isolate `caps` from the separate cache map that stores the callback
    // functions themselves (which also writes one `set` per code, but only
    // ever once - it is never touched again once a code's callback exists).
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
    // `hideLabel` draws the space bar with no legend, and a <kbd> has no name
    // requirement for axe to catch - it was simply an empty element.
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
    // A shortcut diagram - `interactive={false}`'s documented purpose - is
    // read, not clicked, so a glyph legend with no accessible name is worse
    // there than anywhere else on the board: `aria-label` (which the
    // interactive path already carries `key.name` on) is prohibited on
    // `<kbd>`, and `hideLabel` only wired the visually-hidden fallback up for
    // the one cap drawn blank.
    const staticBoard = render(<Keyboard layout="compact" interactive={false} />);
    const arrowUp = staticBoard.container.querySelector('[data-fuji-key="ArrowUp"]')!;
    expect(arrowUp.tagName).toBe("KBD");
    // The glyph is still what's drawn...
    expect(arrowUp).toHaveTextContent("↑");
    // ...but hidden from assistive tech, which reads the real name instead.
    expect(arrowUp.querySelector('[aria-hidden="true"]')).toHaveTextContent("↑");
    expect(arrowUp.querySelector(".fj\\:sr-only")).toHaveTextContent("Arrow up");

    // A cap whose name and label already match (a plain letter) gets none of
    // this - nothing to hide, nothing to add.
    const keyA = staticBoard.container.querySelector('[data-fuji-key="KeyA"]')!;
    expect(keyA.querySelector(".fj\\:sr-only")).toBeNull();
    staticBoard.unmount();
  });

  it("prints one cap the same way in every layout it appears in", () => {
    // Left-set legends are for the wide modifier column - Tab, Caps, Shift -
    // not for any wide cap that happens to sit at column 1. The numpad's 2u
    // `0` is at the left edge of the `numpad` board and mid-row on `full`.
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
    // The phone board's 1.5u ShiftLeft sits at column 1 like Tab/Caps/Shift do
    // on the desktop boards, but its legend is a single `⇧` glyph rather than
    // a word - left-setting it put that glyph hard against the board's edge
    // while the matching `⌫` Backspace at the other end of the same row
    // stayed centred.
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
