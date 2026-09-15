"use client";

import * as React from "react";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import type { ComponentSize, ComponentTone, SlotClassNames } from "../../../types";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import {
  KEYBOARD_LAYOUT_ROWS,
  resolveLayout,
  type KeyboardKeyDef,
  type KeyboardLayout,
  type PlacedKey,
} from "./layouts";

/**
 * Which box a floating board is positioned against: the viewport, or the
 * nearest positioned ancestor (give that ancestor `position: relative`).
 */
export type KeyboardAnchor = "viewport" | "parent";

/** Where inside that box a floating board sits. */
export type KeyboardPlacement = "bottom" | "top" | "center";

export interface KeyboardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onKeyPress"> {
  /**
   * Which board to draw. Default "full".
   *
   * Only "numpad" and "phone" clear the 24x24 CSS px touch-target floor at
   * `size="md"` in a 375px-wide container; "full", "tkl" and "compact" render
   * caps well under it at that width and want a wider container or a larger
   * `size` on a phone-width page.
   */
  layout?: KeyboardLayout;
  /** Cap scale. The board also shrinks below this to fit its container. Default "md". */
  size?: ComponentSize;
  /** Color a cap lights up in when it is struck, and the color `accentKeys` paints. Default "fire". */
  tone?: ComponentTone;
  /**
   * `KeyboardEvent.code` values painted in `tone` - the coloured Esc and arrow
   * caps of a real board. Empty by default: colour on a cap should mean
   * something the consumer chose, not decoration the component invented.
   */
  accentKeys?: string[];
  /**
   * Whether the caps are buttons. Default `true`: a board is something you
   * press. Set it to `false` for a static diagram of a shortcut, which renders
   * plain `<kbd>` elements and takes no tab stop.
   */
  interactive?: boolean;
  /** Lights caps as the real keyboard is used. Client-only; ignored during SSR. */
  captureKeys?: boolean;
  /** Dims the board and stops it reporting presses. */
  disabled?: boolean;
  /**
   * Plays a short click on every press, the way a soft keyboard does. Off by
   * default - a component that makes noise unasked is a component nobody
   * ships. Synthesised through the Web Audio API, so it costs no asset and no
   * dependency, and it stays silent until the first press (browsers refuse a
   * sound that no gesture asked for).
   */
  sound?: boolean;
  /** Called with the pressed cap. Silent on a non-interactive board. */
  onKeyPress?: (key: KeyboardKeyDef) => void;
  /**
   * Float the board over the page instead of laying it out in flow: it fills
   * `anchor` edge to edge, centres itself, and unmounts while closed. The
   * margins around the board stay click-through, so a docked keyboard never
   * covers the page it is typing into.
   */
  floating?: boolean;
  /** Box a floating board is positioned against. Default "viewport". */
  anchor?: KeyboardAnchor;
  /** Where inside that box it sits. Default "bottom". */
  placement?: KeyboardPlacement;
  /**
   * Target width of the board - any CSS length, or a number of pixels. The cap
   * unit is derived from it and everything else (row height, legends, gaps)
   * follows, so the board stays in proportion at any width. It is a target,
   * not a floor: a board never outgrows the space it is given.
   *
   * Floating boards default to a screen-relative width per `size` - roughly
   * 45vw / 60vw / 75vw for `sm` / `md` / `lg`, never past 96vw - because a
   * docked keyboard is something you type on, not a diagram. In flow the
   * default is unset and `size`'s cap scale applies as before.
   */
  width?: string | number;
  /** Open state of a floating board, controlled. Ignored when not floating. */
  open?: boolean;
  /** Open state of a floating board, uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the board's next open state, from Escape, an outside press, or the trigger. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The control that opens the board. Presses on it are excluded from
   * outside-dismissal, so clicking it while open closes the board instead of
   * closing and immediately reopening it.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Close a floating board on Escape and on a pointer press outside. Default `true`. */
  dismissible?: boolean;
  /** Accessible name for the board. Default "On-screen keyboard". */
  label?: string;
  /** Extra classes for the named regions. */
  classNames?: SlotClassNames<"root" | "deck" | "key">;
}

// Cap scale lives in CSS so the legend sizes can be derived from the resolved
// key unit, which shrinks with the container - a JS-side pixel value could not
// follow it. Written out in full for the Tailwind scanner's sake, though these
// are hand-written classes rather than generated utilities.
const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fuji-keyboard-sm",
  md: "fuji-keyboard-md",
  lg: "fuji-keyboard-lg",
};

// Filled accent cap - the orange Esc/arrow keys of the reference boards. Full
// class strings: Tailwind's scanner never sees a templated name.
const ACCENT_CLASSES: Record<ComponentTone, string> = {
  default: "fj:border-transparent fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
  forest: "fj:border-transparent fj:bg-fuji-contained-forest fj:text-fuji-forest-foreground",
  sun: "fj:border-transparent fj:bg-fuji-contained-sun fj:text-fuji-sun-foreground",
  fire: "fj:border-transparent fj:bg-fuji-contained-fire fj:text-fuji-fire-foreground",
  water: "fj:border-transparent fj:bg-fuji-contained-water fj:text-fuji-water-foreground",
};

// The colour a cap lights up in when it is struck. Set once on the deck and
// inherited by every cap, rather than stamped on each of the hundred-odd of
// them. Hand-written classes, defined in base.css beside the strike keyframe.
const GLOW_CLASSES: Record<ComponentTone, string> = {
  default: "fuji-keycap-glow-default",
  forest: "fuji-keycap-glow-forest",
  sun: "fuji-keycap-glow-sun",
  fire: "fuji-keycap-glow-fire",
  water: "fuji-keycap-glow-water",
};

// A stable identity for the two optional key lists, so their `useMemo`s below
// do not rebuild a Set on every render just because a default array literal is
// a new object each time.
const EMPTY_KEYS: string[] = [];

type Direction = "up" | "down" | "left" | "right";

// Full class strings per axis - Tailwind's scanner never sees a templated name.
const ANCHOR_CLASSES: Record<KeyboardAnchor, string> = {
  viewport: "fj:fixed fj:z-50",
  parent: "fj:absolute fj:z-30",
};

const PLACEMENT_CLASSES: Record<KeyboardPlacement, string> = {
  bottom: "fj:inset-x-0 fj:bottom-0",
  top: "fj:inset-x-0 fj:top-0",
  center: "fj:inset-x-0 fj:top-1/2 fj:-translate-y-1/2",
};

const ARROW_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/**
 * Plays the strike animation on one cap.
 *
 * Written straight to the DOM rather than held in React state: a board is a
 * hundred-odd caps, and re-rendering all of them to mark one as struck - then
 * again to unmark it - is the wrong tool for something that is purely a
 * visual, self-ending effect. Removing the attribute and forcing a reflow
 * before re-adding it is what restarts the animation, so a cap hit twice in
 * quick succession plays two strikes instead of continuing the first.
 *
 * Nothing clears the attribute afterwards, on purpose. The obvious tidy-up -
 * dropping it on `animationend` - makes the component depend on a frame-driven
 * event arriving, and a throttled or backgrounded tab does not deliver one
 * (measured: the animation ran to completion and neither `animationstart` nor
 * `animationend` ever fired). A cap left marked is inert - the keyframes carry
 * no `fill-mode`, so the cap is back at its rest style the moment the stroke
 * ends - and the next strike restarts the animation explicitly rather than
 * waiting to be told the last one finished.
 */
function strike(node: HTMLElement): void {
  node.removeAttribute("data-struck");
  void node.offsetWidth;
  node.setAttribute("data-struck", "true");
}

/**
 * The keypress click, synthesised rather than sampled.
 *
 * A short pitch drop with a fast decay is what a key sounds like, and an
 * oscillator plus a gain ramp is the whole of it - no audio file to ship, no
 * decode, no dependency, and nothing to fail to load. Each press gets its own
 * oscillator (they are single-use by design) over one shared context.
 *
 * The context is created on the first press, not on mount: browsers start one
 * created outside a gesture in `suspended`, and an autoplay-blocked context
 * left running is a resource leak for a board nobody pressed.
 */
function playClick(context: AudioContext): void {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(1800, now);
  oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.03);
  // Ramps to and from a hair above zero, never zero: `exponentialRampToValue`
  // is undefined at 0 and silences the whole envelope.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

/** Horizontal centre of a cap, in quarter units - the axis vertical moves are matched on. */
function centre(key: PlacedKey): number {
  return key.column + key.span / 2;
}

/**
 * The cap a direction key should move focus to.
 *
 * Geometric rather than index-based: the rows have different key counts and
 * the numpad's two-unit caps straddle a row boundary, so "the next item in the
 * array" is not the cap under the user's finger. Left/right stay on rows that
 * overlap the current one; up/down jump to the nearest row band and then to
 * the cap whose centre is closest.
 */
function neighbor(keys: PlacedKey[], from: PlacedKey, direction: Direction): PlacedKey | undefined {
  if (direction === "left" || direction === "right") {
    const sameBand = keys.filter(
      (key) => key !== from && key.row < from.row + from.rowSpan && from.row < key.row + key.rowSpan,
    );
    const candidates = sameBand.filter((key) =>
      direction === "right" ? key.column > from.column : key.column < from.column,
    );
    if (!candidates.length) return undefined;
    return candidates.reduce((best, key) =>
      direction === "right" ? (key.column < best.column ? key : best) : key.column > best.column ? key : best,
    );
  }

  const candidates = keys.filter((key) =>
    direction === "up" ? key.row + key.rowSpan <= from.row : key.row >= from.row + from.rowSpan,
  );
  if (!candidates.length) return undefined;
  const band =
    direction === "up"
      ? Math.max(...candidates.map((key) => key.row + key.rowSpan))
      : Math.min(...candidates.map((key) => key.row));
  const inBand = candidates.filter((key) =>
    direction === "up" ? key.row + key.rowSpan === band : key.row === band,
  );
  return inBand.reduce((best, key) =>
    Math.abs(centre(key) - centre(from)) < Math.abs(centre(best) - centre(from)) ? key : best,
  );
}

/**
 * A full on-screen keyboard: the same key vocabulary as `Kbd`, drawn as a
 * complete board. Every cap is a button that travels down and lights up in
 * `tone` when it is struck, the way a backlit mechanical key does, and reports
 * itself through `onKeyPress`; pass `interactive={false}` for a static diagram
 * of a shortcut instead. `captureKeys` lights caps from the real keyboard
 * rather than from clicks.
 *
 * Caps sit on a quarter-unit CSS grid sized from the container, so a 100%
 * board keeps its proportions from a wide page down to a narrow column
 * without a resize listener.
 */
export const Keyboard = React.forwardRef<HTMLDivElement, KeyboardProps>(function Keyboard(
  {
    layout = "full",
    size = "md",
    tone = "fire",
    accentKeys = EMPTY_KEYS,
    interactive = true,
    captureKeys = false,
    disabled = false,
    sound = false,
    onKeyPress,
    floating = false,
    anchor = "viewport",
    placement = "bottom",
    width,
    open,
    defaultOpen,
    onOpenChange,
    triggerRef,
    dismissible = true,
    label = "On-screen keyboard",
    classNames,
    className,
    ...props
  },
  ref,
) {
  const resolved = React.useMemo(() => resolveLayout(KEYBOARD_LAYOUT_ROWS[layout]), [layout]);
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });
  const root = React.useRef<HTMLDivElement | null>(null);
  const deck = React.useRef<HTMLDivElement | null>(null);
  /**
   * Composed rather than `useImperativeHandle`, for two reasons.
   *
   * An imperative handle with no dependency array re-runs on every commit, so
   * a consumer's callback ref - and anything built on one: ResizeObserver,
   * focus management, a positioning library - was torn down and re-attached
   * on every render of a hundred-cap board. A plain callback ref fires when
   * the node actually changes, which is React's own semantics.
   *
   * And it tells the truth about `null`. A closed floating board renders
   * nothing, so the ref genuinely holds `null` there; the handle version had
   * to cast that away and hand the consumer a `null` behind a non-null type.
   *
   * The cast on assignment is to a bare `{ current }` rather than to a React
   * ref type on purpose: React 18 types `RefObject.current` as readonly and
   * React 19 does not, and this package builds against both.
   */
  const setRoot = React.useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref],
  );
  const [focusedCode, setFocusedCode] = React.useState<string | null>(null);
  const [capsLock, setCapsLock] = React.useState(false);
  /**
   * The engaged Shift, or null. A code rather than a boolean so the lamp
   * lights the side actually in use, and `sticky` because the two ways of
   * engaging it let go differently: a cap you clicked releases after the next
   * character (every on-screen keyboard works this way - there is nothing to
   * hold down), while a physical Shift stays engaged until it is released.
   */
  const [shift, setShift] = React.useState<{ code: string; sticky: boolean } | null>(null);
  const [pressedCodes, setPressedCodes] = React.useState<readonly string[]>([]);
  const caps = React.useRef(new Map<string, HTMLButtonElement>());
  const audio = React.useRef<AudioContext | null>(null);
  /**
   * One ref callback per code, cached rather than written inline in the
   * render below. An inline `(node) => { ... }` is a new function every
   * render, and React detaches and reattaches a ref whenever its identity
   * changes - measured at 99 `set` calls plus 99 `delete` calls per
   * re-render of the `full` board, for a prop that touched no cap at all.
   * The map is keyed by `code` and never pruned: the codes across every
   * layout this component knows about are a fixed, small vocabulary, so the
   * cache cannot grow unbounded the way a per-instance cache of arbitrary
   * keys could.
   */
  const capRefs = React.useRef(new Map<string, (node: HTMLButtonElement | null) => void>());
  const capRef = (code: string) => {
    let fn = capRefs.current.get(code);
    if (!fn) {
      fn = (node) => {
        if (node) caps.current.set(code, node);
        else caps.current.delete(code);
      };
      capRefs.current.set(code, fn);
    }
    return fn;
  };

  /**
   * Struck: the cap travels, and clicks if the board has a voice. Both belong
   * to the press itself, so both run from `pointerdown` rather than waiting
   * for the click - a sound that arrives on mouse-up reads as a separate
   * event from the key going down.
   */
  const hit = (node: HTMLElement) => {
    strike(node);
    if (!sound) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const context = (audio.current ??= new Ctor());
    // Suspended if it was created before the page had a gesture, or parked by
    // the browser while the tab was in the background.
    if (context.state === "suspended") void context.resume();
    playClick(context);
  };

  // Keyed on `sound` rather than `[]` so the same cleanup fires both when
  // `sound` goes false and on unmount - a context opened while sound was on
  // must not outlive the prop, and browsers cap AudioContexts per document.
  // Safe against a double `close()` (which would reject on an already-closed
  // context, surfacing as an unhandled rejection): the cleanup nulls
  // `audio.current` synchronously right after calling `close()`, so whichever
  // of the two triggers runs second finds nothing left to close.
  React.useEffect(
    () => () => {
      void audio.current?.close();
      audio.current = null;
    },
    [sound],
  );

  React.useEffect(() => {
    if (!captureKeys) return;
    const press = (event: KeyboardEvent) => {
      // The real Caps Lock moves the lamp as well as lighting the cap. Read
      // only on the Caps Lock press itself, not on every keystroke: sampling
      // it continuously would overrule - and immediately undo - a lock the
      // user set by clicking the on-screen cap.
      if (event.code === "CapsLock" && typeof event.getModifierState === "function") {
        setCapsLock(event.getModifierState("CapsLock"));
      }
      // One Shift state, shared by both keyboards: holding the real Shift
      // engages the on-screen cap, so a cap clicked while it is down reports
      // its shifted value. The two are the same modifier, not two of them.
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        setShift({ code: event.code, sticky: false });
      }
      setPressedCodes((codes) => (codes.includes(event.code) ? codes : [...codes, event.code]));
    };
    const release = (event: KeyboardEvent) => {
      // Releasing the physical Shift lets go of the shared state - but only
      // when the real key is what engaged it. A Shift armed by clicking the
      // on-screen cap is not something the real key gets to cancel.
      setShift((current) => (current && !current.sticky && current.code === event.code ? null : current));
      setPressedCodes((codes) => codes.filter((code) => code !== event.code));
    };
    // A keyup never arrives for a key still held when the window loses focus
    // (the ⌘-Tab case), which would leave that cap lit for good. That only
    // implicates a physically-held Shift, though - one armed by clicking the
    // on-screen cap was never waiting on a keyup, so a blur is not evidence
    // the user let go of it.
    const clear = () => {
      setPressedCodes([]);
      setShift((current) => (current && !current.sticky ? null : current));
    };
    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", clear);
      // Turning captureKeys off mid-hold tears down `release` above, so a
      // physical Shift's keyup would have nowhere left to land and the cap
      // would stay lit - and every later press shifted - for good. A sticky
      // Shift survives this teardown: the real keyboard never armed it, so
      // losing the real keyboard's listeners has no business cancelling it.
      // capsLock is deliberately left alone here: unlike Shift, its value
      // stays true to reality (the OS lock really is still on) even with
      // captureKeys off, and the user can always toggle it back from the cap.
      setShift((current) => (current && !current.sticky ? null : current));
      // pressedCodes has the same problem, minus the sticky exception - there
      // is no click-armed equivalent of a held key. A code still down when
      // this listener goes away gets no keyup to remove it, and the
      // render-time gate below only hides a stale code while `captureKeys` is
      // off; it does not clear it, so the cap resurfaces lit the moment the
      // prop comes back on, regardless of whether the real key is still
      // down. Reset unconditionally: a key genuinely still held gets added
      // right back by the next keydown its own listener sees.
      setPressedCodes([]);
    };
  }, [captureKeys]);

  React.useEffect(() => {
    if (!floating || !isOpen) return;
    const node = deck.current;
    if (!node) return;
    // A docked keyboard types into something else, so the one thing it must
    // never do is take focus away from it. Swallowing the mousedown leaves the
    // field focused and its caret where it was; the cap still gets its
    // pointerdown, its strike and its click.
    //
    // Bound imperatively rather than as an `onMouseDown` prop: this is a
    // non-interactive container by design - the caps inside it are the
    // controls - and a mouse listener in JSX on one is exactly what
    // `jsx-a11y/no-static-element-interactions` exists to catch.
    const keepFocus = (event: MouseEvent) => event.preventDefault();
    node.addEventListener("mousedown", keepFocus);
    return () => node.removeEventListener("mousedown", keepFocus);
  }, [floating, isOpen]);

  React.useEffect(() => {
    if (!floating || !isOpen || !dismissible) return;

    // `pointerdown` rather than `click`: the board swallows the mousedown that
    // would blur the field it types into, and a `click` listener would then
    // fire after focus had already moved on.
    const outside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (root.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) return;
      setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [floating, isOpen, dismissible, triggerRef, setOpen]);

  /**
   * What a cap reports with the modifiers currently engaged.
   *
   * Shift takes the cap's second legend where it has one (`1` types `!`) and
   * otherwise flips case; Caps Lock only ever flips case, because it is not
   * Shift - `1` stays `1` on a real board. The two cancel, so Shift on a
   * locked board types lowercase, exactly as the hardware does.
   */
  const emitted = (key: PlacedKey): KeyboardKeyDef => {
    if (key.value === undefined) return key;
    if (shift) {
      if (key.secondary) return { ...key, value: key.secondary };
      return { ...key, value: capsLock ? key.value.toLowerCase() : key.value.toUpperCase() };
    }
    if (capsLock && key.value !== key.value.toUpperCase()) {
      return { ...key, value: key.value.toUpperCase() };
    }
    return key;
  };

  const accented = React.useMemo(() => new Set(accentKeys), [accentKeys]);
  // Reading the capture state only while `captureKeys` is on hides a stale
  // code while the prop is off - it does not, by itself, prevent one. The
  // effect cleanup above is what actually clears `pressedCodes`, and this
  // gate exists only so a resurfaced cap can never flash between that
  // cleanup running and the next render.
  const pressed = captureKeys ? new Set(pressedCodes) : new Set<string>();
  // Falls back when the focused code is not on the board any more. `layout` is
  // a prop, so it can change under a board that has already been focused - and
  // a `focusedCode` the new layout does not contain leaves EVERY cap at
  // `tabIndex={-1}`, which drops the board out of the tab order entirely until
  // it unmounts. Switching from `full` (focus on Numpad5) to `compact` did
  // exactly that.
  const rovingCode =
    focusedCode !== null && resolved.keys.some((key) => key.code === focusedCode)
      ? focusedCode
      : resolved.keys[0]?.code;

  function move(event: React.KeyboardEvent<HTMLButtonElement>, key: PlacedKey) {
    const direction = ARROW_DIRECTIONS[event.key];
    const target =
      direction !== undefined
        ? neighbor(resolved.keys, key, direction)
        : event.key === "Home"
          ? resolved.keys[0]
          : event.key === "End"
            ? resolved.keys[resolved.keys.length - 1]
            : undefined;
    if (!target) return;
    event.preventDefault();
    setFocusedCode(target.code);
    caps.current.get(target.code)?.focus();
  }

  if (floating && !isOpen) return null;

  return (
    <div
      ref={setRoot}
      role="group"
      aria-label={label}
      aria-disabled={disabled || undefined}
      data-fuji-keyboard-layout={layout}
      data-fuji-keyboard-anchor={floating ? anchor : undefined}
      className={cn(
        "fuji-keyboard",
        floating
          ? // Click-through margins: the wrapper spans the whole anchor so the
            // board can centre in it, and would otherwise swallow every press
            // on the page either side of the board.
            "fuji-keyboard-floating fj:pointer-events-none fj:flex fj:justify-center fj:p-3"
          : "fj:block fj:w-full",
        floating && ANCHOR_CLASSES[anchor],
        floating && PLACEMENT_CLASSES[placement],
        disabled && "fj:opacity-45",
        classNames?.root,
        className,
      )}
      {...props}
    >
      <div
        ref={deck}
        className={cn(
          "fuji-keyboard-deck",
          SIZE_CLASSES[size],
          GLOW_CLASSES[tone],
          "fj:box-border fj:rounded-fuji-panel fj:border fj:border-fuji-border-strong fj:bg-fuji-surface-subtle fj:shadow-fuji-panel",
          // Lifted onto the overlay shadow tier and made solid again inside the
          // click-through wrapper above.
          floating && "fuji-glass-surface-overlay fj:pointer-events-auto fj:shadow-fuji-overlay",
          classNames?.deck,
        )}
        style={
          {
            "--fuji-key-columns": String(resolved.columns),
            ...(width === undefined
              ? null
              : { "--fuji-key-target": typeof width === "number" ? `${width}px` : width }),
            // `repeat(var(--n), ...)` is written from here rather than from the
            // stylesheet: the column count is per layout, and a class name
            // carrying it could never be generated by Tailwind's static scanner.
            gridTemplateColumns: `repeat(${resolved.quarterColumns}, calc(var(--fuji-key-unit) / 4))`,
          } as React.CSSProperties
        }
      >
        {resolved.keys.map((key) => {
          const isAccent = accented.has(key.code);
          const isLocked =
            (key.code === "CapsLock" && capsLock) || (shift !== null && key.code === shift.code);
          const isToggle = key.code === "CapsLock" || key.code === "ShiftLeft" || key.code === "ShiftRight";
          // A word legend, as opposed to a single character or glyph: it takes
          // the smaller, tighter type so it still fits a one-unit cap.
          const isWord = !key.hideLabel && key.label.length > 1;
          // Only the caps moulded against the board's left edge print their
          // legend to the left - Tab, Caps, Shift. Backspace and Enter are the
          // same width but sit on the right, where a left-set legend reads as
          // a mistake rather than a convention.
          // ...and types nothing itself: the numpad's 2u `0` sits at column 1
          // of the `numpad` board and mid-row on `full`, so a rule about
          // position alone printed the same cap two different ways.
          // ...and it has to be a word: the phone board's 1.5u ShiftLeft carries
          // a lone `⇧` glyph at column 1, and left-setting a single glyph read
          // as broken rather than moulded - especially beside the matching
          // `⌫` Backspace at the other end of the same row, which stayed
          // centred.
          const isWide = isWord && (key.width ?? 1) >= 1.5 && key.column === 1 && key.value === undefined;
          const capClassName = cn(
            "fuji-keycap",
            "fj:box-border fj:flex fj:flex-col fj:items-center fj:justify-center fj:overflow-hidden",
            "fj:rounded-fuji-item fj:border fj:text-center fj:font-medium fj:select-none",
            isWord && "fuji-keycap-word",
            isAccent
              ? ACCENT_CLASSES[tone]
              : key.role === "modifier"
                ? "fuji-keycap-modifier fj:border-fuji-border fj:text-fuji-foreground-muted"
                : "fuji-keycap-alpha fj:border-fuji-border fj:text-fuji-foreground",
            classNames?.key,
          );
          const capStyle: React.CSSProperties = {
            gridColumn: `${key.column} / span ${key.span}`,
            gridRow: `${key.row} / span ${key.rowSpan}`,
          };
          const legend = key.hideLabel ? null : (
            <>
              {key.secondary ? (
                <span aria-hidden="true" className="fuji-keycap-secondary">
                  {key.secondary}
                </span>
              ) : null}
              <span>{key.label}</span>
            </>
          );
          // A printed legend that is a glyph or shorthand a screen reader
          // cannot parse on its own - an arrow, "⌘", "⌥" - has a real name in
          // `key.name` that differs from what is drawn. The interactive path
          // below carries that name on `aria-label`, which wins over the
          // button's own content regardless of what the content says; the
          // static `<kbd>` path has no such attribute to fall back on
          // (`aria-label` is prohibited on an element with no role), so it is
          // the one that needs this.
          const spokenName =
            !key.hideLabel && key.name !== undefined && key.name !== key.label ? key.name : undefined;

          if (!interactive) {
            return (
              <kbd
                key={`${key.code}-${key.row}`}
                className={capClassName}
                style={capStyle}
                data-fuji-key={key.code}
                data-wide={isWide ? "true" : undefined}
                data-pressed={pressed.has(key.code) ? "true" : undefined}
                data-locked={isLocked ? "true" : undefined}
              >
                {spokenName !== undefined ? (
                  <>
                    {key.secondary ? (
                      <span aria-hidden="true" className="fuji-keycap-secondary">
                        {key.secondary}
                      </span>
                    ) : null}
                    <span aria-hidden="true">{key.label}</span>
                  </>
                ) : (
                  legend
                )}
                {/* A cap drawn blank, or one whose only legend is a glyph
                    assistive tech can't read, still has to be named.
                    `aria-label` is prohibited on <kbd> - it carries no role
                    of its own - so the name goes in as visually hidden text
                    instead, and the glyph above (if any) is hidden from the
                    accessibility tree so the two don't both get announced.
                    The button path above puts the same string on
                    `aria-label`, where it is allowed. */}
                {key.hideLabel ? (
                  <span className="fj:sr-only">{key.name ?? key.label}</span>
                ) : spokenName !== undefined ? (
                  <span className="fj:sr-only">{spokenName}</span>
                ) : null}
              </kbd>
            );
          }

          return (
            <button
              key={`${key.code}-${key.row}`}
              type="button"
              ref={capRef(key.code)}
              disabled={disabled}
              aria-label={key.name ?? key.label}
              // Roving tabindex: the board is one tab stop and the arrow keys
              // move between caps, rather than a hundred-odd stops of Tab.
              tabIndex={key.code === rovingCode ? 0 : -1}
              className={cn(
                NATIVE_CONTROL_RESET,
                capClassName,
                "fj:cursor-pointer fj:disabled:cursor-not-allowed",
              )}
              style={capStyle}
              data-fuji-key={key.code}
              data-wide={isWide ? "true" : undefined}
              data-pressed={pressed.has(key.code) ? "true" : undefined}
              data-locked={isLocked ? "true" : undefined}
              // A latched modifier is a toggle, so its state is announced as
              // well as lit.
              aria-pressed={isToggle ? isLocked : undefined}
              onFocus={() => setFocusedCode(key.code)}
              onKeyDown={(event) => move(event, key)}
              // The cap travels on press, not on release - waiting for `click`
              // left a visible lag between the finger landing and the key
              // moving, which is the whole feel of a keyboard.
              onPointerDown={(event) => hit(event.currentTarget)}
              onClick={(event) => {
                // `detail === 0` means the click came from Enter/Space on a
                // focused cap rather than a pointer, so no `pointerdown` ran
                // and nothing has struck this cap yet. Striking on both would
                // restart the animation on mouse-up.
                if (event.detail === 0) hit(event.currentTarget);
                // Caps Lock latches the way the real key does: on until it is
                // pressed again, rather than applying to the next cap only.
                if (key.code === "CapsLock") setCapsLock((on) => !on);
                else if (key.code === "ShiftLeft" || key.code === "ShiftRight") {
                  setShift((current) => {
                    // A click never cancels or hijacks a hold the real
                    // keyboard already has: nulling it out (the held cap
                    // itself was clicked) leaves the physical keyup with
                    // nothing left to release, and arming a fresh sticky
                    // latch on the OTHER cap (see the capture effect's own
                    // comment - "the two are the same modifier, not two of
                    // them") spends after one letter even though the real key
                    // is still down. Either way the physical hold already
                    // supplies the shifted value, so a click has nothing to
                    // add until it lets go.
                    if (current && !current.sticky) return current;
                    return current?.code === key.code ? null : { code: key.code, sticky: true };
                  });
                } else if (shift?.sticky) {
                  // Spent on this cap. A Shift being physically held is not -
                  // it stays engaged until the real key comes back up.
                  setShift(null);
                }
                onKeyPress?.(emitted(key));
              }}
            >
              {legend}
            </button>
          );
        })}
      </div>
    </div>
  );
});
