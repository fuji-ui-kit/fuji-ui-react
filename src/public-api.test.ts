import { describe, expect, it } from "vitest";
import * as fuji from "./index";

// `README.md`, `docs/nextjs.md` and `SPEC.md` §4 all tell Server Component
// consumers to import the named sub-export (`DialogContent`) because a static
// property read (`Dialog.Content`) fails across a "use client" boundary. Those
// named exports were documented but never actually exported, so following the
// documentation was a compile error. Every compound's parts are asserted here
// so the dot-access form and the named form can never drift apart again.
const COMPOUNDS: Record<string, string[]> = {
  AlertDialog: ["Trigger", "Content", "Close", "Title", "Description", "Footer"],
  Card: ["Media", "Overlay", "Header", "Title", "Description", "Content", "Footer"],
  ChatBubble: ["Attachment"],
  Collapsible: ["Root", "Trigger", "Panel"],
  Dialog: ["Trigger", "Content", "Close", "Title", "Description"],
  Drawer: ["Trigger", "Content", "Close", "Title", "Description"],
  DropdownMenu: ["Trigger", "Content", "Item", "Separator", "Group", "GroupLabel"],
  Fieldset: ["Legend"],
  FormField: ["Label", "Description", "Error"],
  List: ["Item"],
  NavigationMenu: ["List", "Item", "Trigger", "Content", "Link", "Portal"],
  Popover: ["Trigger", "Content", "Close", "Title", "Description"],
  RadioGroup: ["Item"],
  Sidebar: ["Section", "Item"],
  Table: ["Header", "Body", "Row", "Head", "Cell", "Footer"],
  Tabs: ["List", "Tab", "Panel"],
  Tooltip: ["Provider", "Trigger", "Content"],
};

const exported = fuji as unknown as Record<string, unknown>;

describe("public API", () => {
  describe.each(Object.entries(COMPOUNDS))("%s", (compound, parts) => {
    it("is exported", () => {
      expect(exported[compound]).toBeDefined();
    });

    it.each(parts)(`exports ${compound}%s as a named export`, (part) => {
      expect(exported[`${compound}${part}`]).toBeDefined();
    });

    it.each(parts)(`${compound}.%s matches the named export`, (part) => {
      const root = exported[compound] as Record<string, unknown>;
      expect(root[part]).toBe(exported[`${compound}${part}`]);
    });
  });

  it("exports the compound roots used as the Root element", () => {
    for (const name of [
      "AlertDialogRoot",
      "CardRoot",
      "DialogRoot",
      "DrawerRoot",
      "DropdownMenuRoot",
      "FieldsetRoot",
      "FormFieldRoot",
      "ListRoot",
      "NavigationMenuRoot",
      "PopoverRoot",
      "RadioGroupRoot",
      "SidebarRoot",
      "TableRoot",
      "TabsRoot",
      "TooltipRoot",
    ]) {
      expect(exported[name], `${name} is not exported`).toBeDefined();
    }
  });

  // `src/components/fuji/lib/` is internal except for `dismiss-button`
  // (SPEC.md §3). These leaked through a barrel once and must not again.
  it("does not leak internal helpers", () => {
    for (const name of [
      "cn",
      "appearanceClasses",
      "fieldSurface",
      "usePortalThemeAttrs",
      "useControllableState",
      "isSafeHref",
      "safeHref",
      "buttonBase",
      "iconButtonBase",
      "typographyStyles",
      "GAP_CLASSES",
      "MOBILE_BEHAVIOR_CLASSES",
      "getMonthGrid",
      "getHydrationSafeToday",
    ]) {
      expect(exported[name], `${name} must stay internal`).toBeUndefined();
    }
  });

  it("exports DismissButton, the one sanctioned lib export", () => {
    expect(exported.DismissButton).toBeDefined();
  });
});
