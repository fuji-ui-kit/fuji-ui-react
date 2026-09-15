import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DropdownMenu, Select, Combobox and MultiSelect all mark the keyboard/pointer
 * row with Base UI's `data-highlighted`. That row used to paint
 * `bg-fuji-surface-strong`, which under dark glass is a translucent WHITE fill
 * - white on purpose, so bare textless tracks stay visible against a near-black
 * page - and white lightens toward whatever is behind it. The highlighted label
 * washed out over a bright backdrop: measured 3.35:1 on DropdownMenu. They now
 * use the fill/text inversion every other selection indicator in the library
 * uses, and that CommandMenu moved to for the same reason (13.48:1).
 *
 * Asserted against source rather than a rendered menu. Opening a Base UI popup
 * in jsdom does not reliably position or highlight a row - its roving highlight
 * ignores synthetic key events - so a render test here would be flaky, and a
 * flaky guard gets deleted. The class strings are static (Tailwind's scanner
 * requires it), so the source is the contract.
 */
const MENUS = {
  DropdownMenu: "dropdown-menu/DropdownMenu.tsx",
  Select: "select/Select.tsx",
  Combobox: "combobox/Combobox.tsx",
  MultiSelect: "multi-select/MultiSelect.tsx",
} as const;

function source(file: string): string {
  const raw = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  // Comments may legitimately NAME the old class while explaining why it left.
  return raw.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("menu highlight inversion", () => {
  for (const [name, file] of Object.entries(MENUS)) {
    it(`${name} inverts fill and ink on the highlighted row`, () => {
      const code = source(file);
      expect(code).toContain("fj:data-[highlighted]:bg-fuji-contained-default");
      expect(code).toContain("fj:data-[highlighted]:text-fuji-default-foreground");
    });

    it(`${name} no longer highlights on the translucent bare-fill surface`, () => {
      expect(source(file)).not.toContain("fj:data-[highlighted]:bg-fuji-surface-strong");
    });
  }
});
