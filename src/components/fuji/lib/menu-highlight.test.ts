import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Menu `data-highlighted` rows use the fill/text inversion (13.48:1), not `bg-fuji-surface-strong`
 * (dark-glass WHITE, 3.35:1 on bright backdrops). Checked on source: jsdom highlighting is flaky.
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
