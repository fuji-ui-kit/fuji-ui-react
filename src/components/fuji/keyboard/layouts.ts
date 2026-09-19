/**
 * Key data and grid resolver for `Keyboard`. Codes are real `KeyboardEvent.code` values, so
 * `captureKeys` needs no translation table - except `Fn`, which no browser reports.
 */

/** A single cap on an on-screen keyboard. */
export interface KeyboardKeyDef {
  /** Identity of the cap, matching `KeyboardEvent.code` (`"KeyA"`, `"Escape"`, `"Numpad7"`). */
  code: string;
  /** Legend printed on the cap. */
  label: string;
  /** Accessible name, when the legend alone doesn't identify the cap - a glyph (`"↑"` reads as "Arrow up"), or a label duplicated by another cap in the same board (both Shifts print "Shift"). Falls back to `label`. */
  name?: string;
  /** Smaller legend printed above `label` - the shifted character (`"!"` over `"1"`). */
  secondary?: string;
  /** Character this cap types, for consumers building an input. Absent on modifiers. */
  value?: string;
  /** Cap width in key units, where 1 is a letter key. Default 1. */
  width?: number;
  /** Cap height in key units - 2 for the tall numpad `+` and `Enter`. Default 1. */
  height?: number;
  /** Renders the cap blank while keeping `label` as its accessible name (the space bar). */
  hideLabel?: boolean;
  /** `"modifier"` caps are drawn in the darker, muted grouping tone. Default `"alpha"`. */
  role?: "alpha" | "modifier";
}

/** Which physical board `Keyboard` draws. */
export type KeyboardLayout = "full" | "tkl" | "compact" | "numpad" | "phone";

/** A cap with its resolved position on the quarter-unit grid. Internal to `Keyboard`. */
export interface PlacedKey extends KeyboardKeyDef {
  /** 1-based grid column, counted in quarter key units. */
  column: number;
  /** Column span, in quarter key units. */
  span: number;
  /** 1-based grid row, counted in whole key units. */
  row: number;
  /** Row span, in whole key units. */
  rowSpan: number;
}

/** A layout resolved to absolute grid placements. Internal to `Keyboard`. */
export interface ResolvedLayout {
  /** Board width in whole key units. */
  columns: number;
  /** Board width in quarter key units - the grid's real column count. */
  quarterColumns: number;
  /** Board height in whole key units. */
  rows: number;
  keys: PlacedKey[];
}

/** Character cap: one unit wide, types its own single-character legend. */
function k(code: string, label: string, secondary?: string): KeyboardKeyDef {
  return { code, label, secondary, value: label.length === 1 ? label.toLowerCase() : undefined };
}

/** Modifier/utility cap: wider, drawn in the muted grouping tone, types nothing by default. */
function m(code: string, label: string, width = 1, extra: Partial<KeyboardKeyDef> = {}): KeyboardKeyDef {
  return { code, label, width, role: "modifier", ...extra };
}

/** Widens an existing cap - `\` and the numpad `0` are the same keys, just longer. */
function wide(key: KeyboardKeyDef, width: number): KeyboardKeyDef {
  return { ...key, width };
}

const ARROWS = {
  up: m("ArrowUp", "↑", 1, { name: "Arrow up" }),
  down: m("ArrowDown", "↓", 1, { name: "Arrow down" }),
  left: m("ArrowLeft", "←", 1, { name: "Arrow left" }),
  right: m("ArrowRight", "→", 1, { name: "Arrow right" }),
};

const SPACE: KeyboardKeyDef = {
  code: "Space",
  label: "Space",
  value: " ",
  width: 6.25,
  hideLabel: true,
};

const FUNCTION_KEYS = Array.from({ length: 12 }, (_, index) => m(`F${index + 1}`, `F${index + 1}`));

// The four alphanumeric bands, shared by every layout that has them. Only the
// modifiers around their edges differ between a 65%, a 75% and a full board.
const DIGIT_BAND: KeyboardKeyDef[] = [
  k("Backquote", "`", "~"),
  k("Digit1", "1", "!"),
  k("Digit2", "2", "@"),
  k("Digit3", "3", "#"),
  k("Digit4", "4", "$"),
  k("Digit5", "5", "%"),
  k("Digit6", "6", "^"),
  k("Digit7", "7", "&"),
  k("Digit8", "8", "*"),
  k("Digit9", "9", "("),
  k("Digit0", "0", ")"),
  k("Minus", "-", "_"),
  k("Equal", "=", "+"),
];

const QWERTY_BAND: KeyboardKeyDef[] = [
  ..."QWERTYUIOP".split("").map((letter) => k(`Key${letter}`, letter)),
  k("BracketLeft", "[", "{"),
  k("BracketRight", "]", "}"),
];

const HOME_BAND: KeyboardKeyDef[] = [
  ..."ASDFGHJKL".split("").map((letter) => k(`Key${letter}`, letter)),
  k("Semicolon", ";", ":"),
  k("Quote", "'", '"'),
];

const BOTTOM_BAND: KeyboardKeyDef[] = [
  ..."ZXCVBNM".split("").map((letter) => k(`Key${letter}`, letter)),
  k("Comma", ",", "<"),
  k("Period", ".", ">"),
  k("Slash", "/", "?"),
];

// 65%: sixteen units wide, five rows, arrows tucked under the right shift.
const COMPACT_ROWS: KeyboardKeyDef[][] = [
  [...DIGIT_BAND, m("Backspace", "Backspace", 2), m("Delete", "Del")],
  [m("Tab", "Tab", 1.5), ...QWERTY_BAND, wide(k("Backslash", "\\", "|"), 1.5), m("Home", "Home")],
  [m("CapsLock", "Caps", 1.75), ...HOME_BAND, m("Enter", "Enter", 2.25), m("PageUp", "PgUp")],
  [
    m("ShiftLeft", "Shift", 2.25, { name: "Shift left" }),
    ...BOTTOM_BAND,
    m("ShiftRight", "Shift", 1.75, { name: "Shift right" }),
    ARROWS.up,
    m("PageDown", "PgDn"),
  ],
  [
    m("ControlLeft", "Ctrl", 1.25),
    m("AltLeft", "⌥", 1.25, { name: "Option" }),
    m("MetaLeft", "⌘", 1.5, { name: "Command left" }),
    { ...SPACE, width: 6.5 },
    m("MetaRight", "⌘", 1.5, { name: "Command right" }),
    m("Fn", "Fn"),
    ARROWS.left,
    ARROWS.down,
    ARROWS.right,
  ],
];

// 75%: the 65% board with a function row on top.
const TKL_ROWS: KeyboardKeyDef[][] = [
  // Not `Del` at the end: the 65% rows below already carry one, and two caps
  // sharing a `code` would share a roving tabindex and a capture highlight.
  [
    m("Escape", "Esc"),
    ...FUNCTION_KEYS,
    m("PrintScreen", "PrtSc"),
    m("ScrollLock", "ScrLk"),
    m("Pause", "Pause"),
  ],
  ...COMPACT_ROWS,
];

// 100%: a fifteen-unit main block, a function row, and a four-unit numpad whose
// `+` and `Enter` are two units tall.
const FULL_ROWS: KeyboardKeyDef[][] = [
  [
    m("Escape", "Esc"),
    ...FUNCTION_KEYS,
    m("PrintScreen", "PrtSc"),
    m("Delete", "Del"),
    m("Home", "Home"),
    m("End", "End"),
    m("PageUp", "PgUp"),
    m("PageDown", "PgDn"),
  ],
  [
    ...DIGIT_BAND,
    m("Backspace", "Backspace", 2),
    m("NumLock", "Num"),
    m("NumpadDivide", "/", 1, { name: "Numpad divide", value: "/" }),
    m("NumpadMultiply", "*", 1, { name: "Numpad multiply", value: "*" }),
    m("NumpadSubtract", "−", 1, { name: "Numpad minus", value: "-" }),
  ],
  [
    m("Tab", "Tab", 1.5),
    ...QWERTY_BAND,
    wide(k("Backslash", "\\", "|"), 1.5),
    { ...k("Numpad7", "7"), name: "Numpad 7" },
    { ...k("Numpad8", "8"), name: "Numpad 8" },
    { ...k("Numpad9", "9"), name: "Numpad 9" },
    m("NumpadAdd", "+", 1, { name: "Numpad plus", value: "+", height: 2 }),
  ],
  [
    m("CapsLock", "Caps", 1.75),
    ...HOME_BAND,
    m("Enter", "Enter", 2.25),
    { ...k("Numpad4", "4"), name: "Numpad 4" },
    { ...k("Numpad5", "5"), name: "Numpad 5" },
    { ...k("Numpad6", "6"), name: "Numpad 6" },
  ],
  [
    m("ShiftLeft", "Shift", 2.25, { name: "Shift left" }),
    ...BOTTOM_BAND,
    m("ShiftRight", "Shift", 1.75, { name: "Shift right" }),
    ARROWS.up,
    { ...k("Numpad1", "1"), name: "Numpad 1" },
    { ...k("Numpad2", "2"), name: "Numpad 2" },
    { ...k("Numpad3", "3"), name: "Numpad 3" },
    m("NumpadEnter", "Enter", 1, { name: "Numpad enter", height: 2 }),
  ],
  [
    m("ControlLeft", "Ctrl", 1.25),
    m("AltLeft", "⌥", 1.25, { name: "Option" }),
    m("MetaLeft", "⌘", 1.25, { name: "Command left" }),
    SPACE,
    // No second Option here: the main block is fifteen units wide, and a tenth
    // one-unit cap pushed the whole numpad a unit past the board's own edge.
    m("MetaRight", "⌘", 1, { name: "Command right" }),
    m("Fn", "Fn"),
    ARROWS.left,
    ARROWS.down,
    ARROWS.right,
    { ...wide(k("Numpad0", "0"), 2), name: "Numpad 0" },
    { ...k("NumpadDecimal", "."), name: "Numpad decimal" },
  ],
];

// Phone: ten units wide like iOS, so caps clear the WCAG 2.5.8 24x24 floor at 375px (31.5px in flow,
// 29.1px docked; numpad 27px). full renders 14.7px, tkl/compact 18.2px (16.7px docked, size="md").
// No shifted symbols and no `?123` switch: no such `KeyboardEvent.code` exists and there is no
// symbol mode.
const PHONE_ROWS: KeyboardKeyDef[][] = [
  [
    k("Digit1", "1"),
    k("Digit2", "2"),
    k("Digit3", "3"),
    k("Digit4", "4"),
    k("Digit5", "5"),
    k("Digit6", "6"),
    k("Digit7", "7"),
    k("Digit8", "8"),
    k("Digit9", "9"),
    k("Digit0", "0"),
  ],
  [..."QWERTYUIOP".split("").map((letter) => k(`Key${letter}`, letter))],
  [..."ASDFGHJKL".split("").map((letter) => k(`Key${letter}`, letter)), k("Semicolon", ";")],
  [
    m("ShiftLeft", "⇧", 1.5, { name: "Shift" }),
    ..."ZXCVBNM".split("").map((letter) => k(`Key${letter}`, letter)),
    m("Backspace", "⌫", 1.5, { name: "Backspace" }),
  ],
  [
    wide(k("Comma", ","), 1.25),
    wide(SPACE, 6),
    wide(k("Period", "."), 1.25),
    m("Enter", "⏎", 1.5, { name: "Enter" }),
  ],
];

// The standalone numpad backs PIN/OTP keypads, which need a delete, so its top-left cap is Backspace
// (same glyph/name as phone's) instead of a drawn Num Lock that does nothing. `full` keeps Num Lock:
// its main block already has Backspace and it depicts real hardware.
const NUMPAD_ROWS: KeyboardKeyDef[][] = [
  [
    m("Backspace", "⌫", 1, { name: "Backspace" }),
    m("NumpadDivide", "/", 1, { name: "Numpad divide", value: "/" }),
    m("NumpadMultiply", "*", 1, { name: "Numpad multiply", value: "*" }),
    m("NumpadSubtract", "−", 1, { name: "Numpad minus", value: "-" }),
  ],
  [
    { ...k("Numpad7", "7"), name: "Numpad 7" },
    { ...k("Numpad8", "8"), name: "Numpad 8" },
    { ...k("Numpad9", "9"), name: "Numpad 9" },
    m("NumpadAdd", "+", 1, { name: "Numpad plus", value: "+", height: 2 }),
  ],
  [
    { ...k("Numpad4", "4"), name: "Numpad 4" },
    { ...k("Numpad5", "5"), name: "Numpad 5" },
    { ...k("Numpad6", "6"), name: "Numpad 6" },
  ],
  [
    { ...k("Numpad1", "1"), name: "Numpad 1" },
    { ...k("Numpad2", "2"), name: "Numpad 2" },
    { ...k("Numpad3", "3"), name: "Numpad 3" },
    m("NumpadEnter", "Enter", 1, { name: "Numpad enter", height: 2 }),
  ],
  [
    { ...wide(k("Numpad0", "0"), 2), name: "Numpad 0" },
    { ...k("NumpadDecimal", "."), name: "Numpad decimal" },
  ],
];

/** The authored rows behind each layout, before placement. */
export const KEYBOARD_LAYOUT_ROWS: Record<KeyboardLayout, KeyboardKeyDef[][]> = {
  full: FULL_ROWS,
  tkl: TKL_ROWS,
  compact: COMPACT_ROWS,
  numpad: NUMPAD_ROWS,
  phone: PHONE_ROWS,
};

function isFree(taken: Set<string>, column: number, span: number, row: number, rowSpan: number): boolean {
  for (let r = row; r < row + rowSpan; r += 1) {
    for (let c = column; c < column + span; c += 1) {
      if (taken.has(`${r}:${c}`)) return false;
    }
  }
  return true;
}

/**
 * Places rows on a quarter-unit grid, since every real cap width (1.25u...6.25u) is whole quarters.
 * A cap skips columns a taller cap above already occupies - that puts numpad `4 5 6` beside `+`.
 */
export function resolveLayout(rows: KeyboardKeyDef[][]): ResolvedLayout {
  const taken = new Set<string>();
  const keys: PlacedKey[] = [];
  let quarterColumns = 0;

  rows.forEach((row, rowIndex) => {
    let cursor = 0;
    for (const key of row) {
      const span = Math.round((key.width ?? 1) * 4);
      const rowSpan = key.height ?? 1;
      while (!isFree(taken, cursor, span, rowIndex, rowSpan)) cursor += 1;
      for (let r = rowIndex; r < rowIndex + rowSpan; r += 1) {
        for (let c = cursor; c < cursor + span; c += 1) taken.add(`${r}:${c}`);
      }
      keys.push({ ...key, column: cursor + 1, span, row: rowIndex + 1, rowSpan });
      cursor += span;
      quarterColumns = Math.max(quarterColumns, cursor);
    }
  });

  return { columns: quarterColumns / 4, quarterColumns, rows: rows.length, keys };
}
