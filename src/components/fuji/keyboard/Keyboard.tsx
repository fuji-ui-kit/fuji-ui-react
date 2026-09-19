"use client";

import * as React from "react";
import { Volume2, VolumeX } from "lucide-react";
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

/** Modifiers a press was made under: latched on screen (a clicked ⌘) or held on the real keyboard. */
export interface KeyboardModifiers {
  shift: boolean;
  meta: boolean;
  ctrl: boolean;
  alt: boolean;
}

export interface KeyboardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onKeyPress"> {
  /**
   * Which board to draw. Default "full". Only "numpad" and "phone" clear the 24x24px touch-target
   * floor at `size="md"` in a 375px container; the others need a wider container or larger `size`.
   */
  layout?: KeyboardLayout;
  /** Cap scale. The board also shrinks below this to fit its container. Default "md". */
  size?: ComponentSize;
  /** Color a cap lights up in when it is struck, and the color `accentKeys` paints. Default "fire". */
  tone?: ComponentTone;
  /**
   * `KeyboardEvent.code` values painted in `tone`, like a real board's coloured Esc and arrows.
   * Empty by default: cap colour should mean something the consumer chose.
   */
  accentKeys?: string[];
  /**
   * Whether the caps are buttons. Default `true`. Set `false` for a static shortcut diagram of
   * plain `<kbd>` elements with no tab stop.
   */
  interactive?: boolean;
  /**
   * Mirrors the physical keyboard (strike, click, shared Shift/Caps Lock); on by default, ignored in SSR.
   * Listens only while engaged (open, or focus inside) and never calls `onKeyPress` (it already typed).
   */
  captureKeys?: boolean;
  /** Dims the board and stops it reporting presses. */
  disabled?: boolean;
  /**
   * Plays a short click on every press (controlled). Off by default. Synthesised via Web Audio, so no
   * asset or dependency; silent until the first press, since browsers block gesture-less audio.
   */
  sound?: boolean;
  /** Initial sound state when the board owns it. Default `false`. */
  defaultSound?: boolean;
  /** Called with the next sound state, from the board's own toggle. */
  onSoundChange?: (sound: boolean) => void;
  /**
   * Shows the board's own sound toggle in a strip above the caps. Defaults to `interactive`
   * (static diagrams make no sound). Set `false` where the app already offers the control.
   */
  soundToggle?: boolean;
  /**
   * Called with the pressed cap and the modifiers it was pressed under; a held cap repeats. Under ⌘ or
   * Ctrl the cap reports no `value` (a shortcut types nothing) - branch on `modifiers` for ⌘A, ⌘C, ⌘V.
   */
  onKeyPress?: (key: KeyboardKeyDef, modifiers: KeyboardModifiers) => void;
  /**
   * Float the board over `anchor`, centred, unmounted while closed. The margins around it stay
   * click-through, so a docked keyboard never blocks the page it types into.
   */
  floating?: boolean;
  /** Box a floating board is positioned against. Default "viewport". */
  anchor?: KeyboardAnchor;
  /** Where inside that box it sits. Default "bottom". */
  placement?: KeyboardPlacement;
  /**
   * Target board width (CSS length, px, or `%` of its box); never outgrows its box, lifts the size cap.
   * Floating default ~45vw/60vw/75vw for `sm`/`md`/`lg` (max 96vw); unset in flow, where `size` applies.
   */
  width?: string | number;
  /** Open state of a floating board, controlled. Ignored when not floating. */
  open?: boolean;
  /** Open state of a floating board, uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the board's next open state, from Escape, an outside press, or the trigger. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The control that opens the board. Excluded from outside-dismissal, so clicking it while open
   * closes the board instead of closing and immediately reopening it.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Close a floating board on Escape and on a pointer press outside. Default `true`. */
  dismissible?: boolean;
  /** Accessible name for the board. Default "On-screen keyboard". */
  label?: string;
  /** Extra classes for the named regions. */
  classNames?: SlotClassNames<"root" | "deck" | "key">;
}

// Cap scale lives in CSS so legend sizes can follow the container-derived key unit, which a JS pixel
// value could not.
const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fuji-keyboard-sm",
  md: "fuji-keyboard-md",
  lg: "fuji-keyboard-lg",
};

// Filled accent cap. Full class strings: Tailwind's scanner never sees a templated name.
const ACCENT_CLASSES: Record<ComponentTone, string> = {
  default: "fj:border-transparent fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
  forest: "fj:border-transparent fj:bg-fuji-contained-forest fj:text-fuji-forest-foreground",
  sun: "fj:border-transparent fj:bg-fuji-contained-sun fj:text-fuji-sun-foreground",
  fire: "fj:border-transparent fj:bg-fuji-contained-fire fj:text-fuji-fire-foreground",
  water: "fj:border-transparent fj:bg-fuji-contained-water fj:text-fuji-water-foreground",
};

// Strike colour, set once on the deck and inherited by every cap. Defined in base.css.
const GLOW_CLASSES: Record<ComponentTone, string> = {
  default: "fuji-keycap-glow-default",
  forest: "fuji-keycap-glow-forest",
  sun: "fuji-keycap-glow-sun",
  fire: "fuji-keycap-glow-fire",
  water: "fuji-keycap-glow-water",
};

// Stable default so `useMemo` doesn't rebuild the Set every render.
const EMPTY_KEYS: string[] = [];

// Clicked on screen, these latch until the next ordinary cap, like Shift: click ⌘ then A for ⌘A.
const LATCHING_MODIFIERS: Record<string, "meta" | "ctrl" | "alt"> = {
  MetaLeft: "meta",
  MetaRight: "meta",
  ControlLeft: "ctrl",
  ControlRight: "ctrl",
  AltLeft: "alt",
  AltRight: "alt",
};

// Caps a held press never repeats: toggles and modifiers act once, as on hardware.
const NON_REPEATING = new Set([
  "ShiftLeft",
  "ShiftRight",
  "CapsLock",
  "NumLock",
  "Fn",
  "Escape",
  ...Object.keys(LATCHING_MODIFIERS),
]);

// Hardware-like auto-repeat: a pause before the first repeat, then a steady rate (20 per second).
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 50;

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
 * Strikes via the DOM, not state (no re-rendering ~100 caps); the reflow restarts a rapid re-hit. Never
 * cleared: backgrounded tabs skip `animationend`, and with no `fill-mode` the attribute is inert.
 */
function strike(node: HTMLElement): void {
  node.removeAttribute("data-struck");
  void node.offsetWidth;
  node.setAttribute("data-struck", "true");
}

/**
 * The keypress click: a single-use oscillator with a fast pitch drop and decay, no audio file. The
 * shared context is created on first press, not mount, since pre-gesture contexts start suspended.
 */
function playClick(context: AudioContext): void {
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(1800, now);
  oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.03);
  // Never ramp to 0: `exponentialRampToValue` is undefined there and silences the envelope.
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

/**
 * `width` as `--fuji-key-target`, with `%` as `cqi` of the root: in grid tracks a bare `%` resolves
 * against the grid itself (`width="100%"` collapsed a numpad to 88px).
 */
function boardTarget(width: string | number): string {
  if (typeof width === "number") return `${width}px`;
  const percent = /^\s*(\d*\.?\d+)%\s*$/.exec(width);
  return percent ? `${percent[1]}cqi` : width;
}

/** Horizontal centre of a cap, in quarter units - the axis vertical moves are matched on. */
function centre(key: PlacedKey): number {
  return key.column + key.span / 2;
}

/**
 * The cap an arrow key moves focus to, found geometrically since rows differ in length and tall
 * numpad caps span rows. Left/right stay on overlapping rows; up/down pick the nearest centre.
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
 * On-screen keyboard with `Kbd`'s vocabulary: caps light in `tone` and report via `onKeyPress`. Sits on a
 * container-sized quarter-unit grid, so it keeps proportions at any width without a resize listener.
 */
export const Keyboard = React.forwardRef<HTMLDivElement, KeyboardProps>(function Keyboard(
  {
    layout = "full",
    size = "md",
    tone = "fire",
    accentKeys = EMPTY_KEYS,
    interactive = true,
    captureKeys = true,
    disabled = false,
    sound,
    defaultSound = false,
    onSoundChange,
    soundToggle,
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
  const [soundOn, setSoundOn] = useControllableState({
    value: sound,
    defaultValue: defaultSound,
    onChange: onSoundChange,
  });
  // The toolbar takes grid row 1, so caps shift down one; `layouts.ts` stays unaware of chrome.
  const showToolbar = soundToggle ?? interactive;
  const rowOffset = showToolbar ? 1 : 0;
  // A visible toggle on controlled `sound` without `onSoundChange` is a dead button. Only a defect
  // because we draw the control, so `useControllableState` can't catch it.
  if (process.env.NODE_ENV !== "production" && showToolbar && sound !== undefined && !onSoundChange) {
    console.error(
      "[fuji-ui] Keyboard renders its sound toggle but `sound` is controlled with no `onSoundChange`, " +
        "so pressing the toggle cannot change anything. Pass `defaultSound` to let the board own the " +
        "state, pass `onSoundChange` to own it yourself, or pass `soundToggle={false}` if the control " +
        "belongs elsewhere in your UI.",
    );
  }
  const root = React.useRef<HTMLDivElement | null>(null);
  const deck = React.useRef<HTMLDivElement | null>(null);
  /**
   * Composed, not `useImperativeHandle`, which re-ran callback refs every commit and hid `null`. Bare
   * `{ current }` cast: React 18 types `RefObject.current` readonly, React 19 does not.
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
  /**
   * Focus inside the board: an in-flow board is "engaged" (see `captureKeys`) only then. Tracked with
   * `focusin`/`focusout`, since `focus`/`blur` don't bubble up from the caps.
   */
  const [focusWithin, setFocusWithin] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);
  /**
   * The engaged Shift (by code, so the right side lights) or null. `sticky` = clicked on screen and
   * released after the next character; a physical Shift holds until keyup.
   */
  const [shift, setShift] = React.useState<{ code: string; sticky: boolean } | null>(null);
  const [pressedCodes, setPressedCodes] = React.useState<readonly string[]>([]);
  /** ⌘/Ctrl/Alt caps latched by a click, spent by the next ordinary cap. */
  const [latched, setLatched] = React.useState<readonly string[]>([]);
  /** The running auto-repeat of a held cap; `fired` swallows the click that ends it. */
  const repeat = React.useRef<{ timeout?: number; interval?: number; fired: boolean } | null>(null);
  const caps = React.useRef(new Map<string, HTMLButtonElement>());
  const audio = React.useRef<AudioContext | null>(null);
  /**
   * Cached ref callback per code: inline refs cost 99 `set` + 99 `delete` calls per `full` re-render.
   * Never pruned, since the set of codes is small and fixed.
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

  /** Strike and click, run from `pointerdown`: a sound on mouse-up reads as a separate event. */
  const hit = (node: HTMLElement) => {
    strike(node);
    if (!soundOn) return;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const context = (audio.current ??= new Ctor());
    // Suspended if created before a gesture, or parked while the tab was backgrounded.
    if (context.state === "suspended") void context.resume();
    playClick(context);
  };

  // Ref so capture listeners don't re-subscribe on sound changes (that loses a mid-hold keyup). An
  // insertion effect runs synchronously in commit, so the ref is never a render behind.
  const hitRef = React.useRef(hit);
  React.useInsertionEffect(() => {
    hitRef.current = hit;
  });

  // Keyed on `soundOn` so the context closes when sound turns off and on unmount (browsers cap
  // AudioContexts). Nulling right after `close()` prevents a double-close unhandled rejection.
  React.useEffect(
    () => () => {
      void audio.current?.close();
      audio.current = null;
    },
    [soundOn],
  );

  React.useEffect(() => {
    const node = root.current;
    if (!node || !captureKeys) return;
    // Read current state too: focus may already be inside (autofocus, restored focus), and its
    // `focusin` has already fired.
    setFocusWithin(node.contains(document.activeElement));
    const enter = () => setFocusWithin(true);
    const leave = (event: FocusEvent) => {
      // Moving within the board isn't leaving; a null `relatedTarget` (window blur) is.
      const next = event.relatedTarget;
      if (next instanceof Node && node.contains(next)) return;
      setFocusWithin(false);
    };
    node.addEventListener("focusin", enter);
    node.addEventListener("focusout", leave);
    return () => {
      node.removeEventListener("focusin", enter);
      node.removeEventListener("focusout", leave);
      setFocusWithin(false);
    };
    // `isOpen`: a closed floating board has no root, so listeners re-attach on open.
  }, [captureKeys, isOpen]);

  /** Engaged: a floating board whenever mounted (i.e. open), an in-flow board while it holds focus. */
  const capturing = captureKeys && !disabled && (floating || focusWithin);

  React.useEffect(() => {
    if (!capturing) return;
    const press = (event: KeyboardEvent) => {
      // Sync the lamp only on the Caps Lock press itself; sampling every keystroke would undo a
      // lock set by clicking the cap.
      if (event.code === "CapsLock" && typeof event.getModifierState === "function") {
        setCapsLock(event.getModifierState("CapsLock"));
      }
      // One Shift shared by both keyboards: a cap clicked while real Shift is held types shifted.
      if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
        setShift({ code: event.code, sticky: false });
      }
      setPressedCodes((codes) => (codes.includes(event.code) ? codes : [...codes, event.code]));
      // Strike and click like a finger press, but skip auto-repeat (a held key would stutter). Never
      // call `onKeyPress`: the real key already reached the focused field, so it would type twice.
      if (!event.repeat) {
        const cap = deck.current?.querySelector<HTMLElement>(`[data-fuji-key="${CSS.escape(event.code)}"]`);
        if (cap) hitRef.current(cap);
      }
    };
    const release = (event: KeyboardEvent) => {
      // The real Shift's keyup only releases a Shift it engaged, never a click-armed one.
      setShift((current) => (current && !current.sticky && current.code === event.code ? null : current));
      setPressedCodes((codes) => codes.filter((code) => code !== event.code));
    };
    // Keys held across a window blur (⌘-Tab) never get a keyup, so clear them; a click-armed Shift
    // never awaited one and survives.
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
      // Teardown mid-hold loses the physical Shift's keyup, so release it (sticky Shift survives).
      // capsLock stays: the OS lock really is still on, and the cap can toggle it.
      setShift((current) => (current && !current.sticky ? null : current));
      // Same for pressedCodes: the render gate only hides stale codes, so they'd resurface when
      // capture resumes. A key still held is re-added by its next keydown.
      setPressedCodes([]);
    };
  }, [capturing]);

  React.useEffect(() => {
    if (!interactive) return;
    const node = deck.current;
    // Null while a floating board is closed - it renders nothing.
    if (!node) return;
    // Swallow mousedown in every mode so the field being typed into keeps focus and caret; caps stay
    // Tab/arrow focusable. Bound imperatively since a JSX `onMouseDown` on this static container
    // trips `jsx-a11y/no-static-element-interactions`.
    const keepFocus = (event: MouseEvent) => event.preventDefault();
    node.addEventListener("mousedown", keepFocus);
    return () => node.removeEventListener("mousedown", keepFocus);
    // `floating`/`isOpen` decide whether the deck is mounted, so re-bind onto the new node.
  }, [interactive, floating, isOpen]);

  React.useEffect(() => {
    if (!floating || !isOpen || !dismissible) return;

    // `pointerdown`, not `click`: by click time focus has already moved on.
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

  // A repeat must not outlive its cap: closing, disabling or unmounting the board stops it.
  React.useEffect(() => {
    if (disabled || (floating && !isOpen)) stopRepeat();
    return stopRepeat;
  }, [disabled, floating, isOpen]);

  /**
   * What a cap reports under the engaged modifiers. Shift uses `secondary` (`1` → `!`) else flips
   * case; Caps Lock only flips letters. Shift on a locked board types lowercase, as hardware does.
   */
  const held = capturing ? pressedCodes : EMPTY_KEYS;
  const engaged = (kind: "meta" | "ctrl" | "alt") =>
    latched.some((code) => LATCHING_MODIFIERS[code] === kind) ||
    held.some((code) => LATCHING_MODIFIERS[code] === kind);
  const modifiers: KeyboardModifiers = {
    shift: shift !== null,
    meta: engaged("meta"),
    ctrl: engaged("ctrl"),
    alt: engaged("alt"),
  };

  const emitted = (key: PlacedKey): KeyboardKeyDef => {
    if (key.value === undefined) return key;
    // A shortcut chord types nothing, exactly as ⌘A doesn't insert "a" into a real field.
    if (modifiers.meta || modifiers.ctrl) return { ...key, value: undefined };
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
  // Gate only hides stale codes between the cleanup above and the next render. Follows `capturing`,
  // not the prop, so a cap held when focus leaves an in-flow board doesn't stay lit.
  const pressed = capturing ? new Set(pressedCodes) : new Set<string>();
  // Fall back if `layout` changed and dropped the focused code, or every cap gets `tabIndex={-1}` and
  // the board leaves the tab order (seen switching `full` on Numpad5 to `compact`).
  const rovingCode =
    focusedCode !== null && resolved.keys.some((key) => key.code === focusedCode)
      ? focusedCode
      : resolved.keys[0]?.code;

  /** One press of `key`: update the latches it toggles or spends, then report it. */
  function activate(key: PlacedKey) {
    if (key.code === "CapsLock") setCapsLock((on) => !on);
    else if (key.code === "ShiftLeft" || key.code === "ShiftRight") {
      setShift((current) => {
        // A click never cancels or replaces a physical hold: that would orphan its keyup, or spend a
        // sticky latch after one letter while the real key is still down.
        if (current && !current.sticky) return current;
        return current?.code === key.code ? null : { code: key.code, sticky: true };
      });
    } else if (key.code in LATCHING_MODIFIERS) {
      setLatched((codes) =>
        codes.includes(key.code) ? codes.filter((code) => code !== key.code) : [...codes, key.code],
      );
    } else {
      // Sticky Shift and latched ⌘/Ctrl/Alt are spent; a physically held key lasts until keyup.
      if (shift?.sticky) setShift(null);
      if (latched.length) setLatched([]);
    }
    onKeyPress?.(emitted(key), modifiers);
  }

  function stopRepeat() {
    const current = repeat.current;
    if (!current) return;
    window.clearTimeout(current.timeout);
    window.clearInterval(current.interval);
  }

  /**
   * Held cap: after `REPEAT_DELAY_MS` it fires once (spending latches) and then every interval, with
   * the key and modifiers as they were at press time - held ⇧A keeps typing "A".
   */
  function startRepeat(key: PlacedKey, node: HTMLElement) {
    stopRepeat();
    const state: { timeout?: number; interval?: number; fired: boolean } = { fired: false };
    const sameKey = emitted(key);
    const sameModifiers = modifiers;
    state.timeout = window.setTimeout(() => {
      state.fired = true;
      activate(key);
      state.interval = window.setInterval(() => {
        strike(node);
        onKeyPress?.(sameKey, sameModifiers);
      }, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
    repeat.current = state;
  }

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
          ? // Click-through: the wrapper spans the anchor to centre the board.
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
          // Overlay shadow, and clickable again inside the click-through wrapper.
          floating && "fuji-glass-surface-overlay fj:pointer-events-auto fj:shadow-fuji-overlay",
          classNames?.deck,
        )}
        style={
          {
            "--fuji-key-columns": String(resolved.columns),
            ...(width === undefined
              ? null
              : {
                  "--fuji-key-target": boardTarget(width),
                  // Explicit width lifts the size's ceiling, which capped caps at 38px (`width="900px"`
                  // drew 630px). base.css's container `min()` still bounds it.
                  "--fuji-key-ceiling": "100000px",
                }),
            // Inline: a per-layout column count can't be a Tailwind-scannable class.
            gridTemplateColumns: `repeat(${resolved.quarterColumns}, calc(var(--fuji-key-unit) / 4))`,
            // Toolbar is grid row 1 to inherit the deck's sizing; explicit `auto` because implicit
            // rows are one cap tall.
            ...(showToolbar ? { gridTemplateRows: "auto" } : null),
          } as React.CSSProperties
        }
      >
        {showToolbar && (
          <div className="fuji-keyboard-toolbar">
            <button
              type="button"
              aria-pressed={soundOn}
              aria-label={soundOn ? "Turn key sounds off" : "Turn key sounds on"}
              disabled={disabled}
              onClick={() => setSoundOn(!soundOn)}
              className={cn(NATIVE_CONTROL_RESET, "fuji-keyboard-sound")}
            >
              {/* Icon shape plus a tone lamp: state is never signalled by colour alone. */}
              {soundOn ? (
                <Volume2 aria-hidden="true" className="fuji-keyboard-sound-icon" />
              ) : (
                <VolumeX aria-hidden="true" className="fuji-keyboard-sound-icon" />
              )}
              <span aria-hidden="true" className="fuji-keyboard-sound-lamp" />
            </button>
          </div>
        )}
        {resolved.keys.map((key) => {
          const isAccent = accented.has(key.code);
          const isLocked =
            (key.code === "CapsLock" && capsLock) ||
            (shift !== null && key.code === shift.code) ||
            latched.includes(key.code);
          const isToggle =
            key.code === "CapsLock" ||
            key.code === "ShiftLeft" ||
            key.code === "ShiftRight" ||
            key.code in LATCHING_MODIFIERS;
          // Word legends take smaller type to fit a one-unit cap.
          const isWord = !key.hideLabel && key.label.length > 1;
          // Left-set legend only for wide left-edge word modifiers (Tab, Caps, Shift): not right-side
          // caps, not the value-typing numpad `0` (column 1 only on `numpad`), and not phone's lone `⇧`.
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
            gridRow: `${key.row + rowOffset} / span ${key.rowSpan}`,
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
          // Spoken name for glyph legends (arrows, ⌘, ⌥) on the static `<kbd>` path, where `aria-label`
          // is prohibited; buttons carry it on `aria-label` instead.
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
                {/* Blank or glyph caps still need a name; `aria-label` is prohibited on <kbd>, so use
                    sr-only text (the glyph above is aria-hidden to avoid a double announcement). */}
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
              // Roving tabindex: one tab stop, arrow keys move between caps.
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
              // Latched modifiers announce their state, not just light up.
              aria-pressed={isToggle ? isLocked : undefined}
              onFocus={() => setFocusedCode(key.code)}
              onKeyDown={(event) => move(event, key)}
              // Travel on press, not release: waiting for `click` left a visible lag.
              onPointerDown={(event) => {
                hit(event.currentTarget);
                if (event.button === 0 && !NON_REPEATING.has(key.code)) startRepeat(key, event.currentTarget);
              }}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
              onClick={(event) => {
                // The hold already reported this press when it started repeating.
                if (repeat.current?.fired) {
                  repeat.current = null;
                  return;
                }
                repeat.current = null;
                // `detail === 0`: Enter/Space, so no `pointerdown` struck it yet. Pointer clicks skip
                // this, or the animation would restart on mouse-up.
                if (event.detail === 0) hit(event.currentTarget);
                activate(key);
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
