"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { cn } from "../../../lib/cn";
import { useControllableState } from "../../../hooks/useControllableState";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export interface CommandMenuItem {
  /** Unique key for the item. */
  id: string;
  /** What the row reads as, and the default search target. */
  label: string;
  /** Heading the item is filed under. Items with no group are listed first. */
  group?: string;
  /** Glyph before the label. */
  icon?: React.ReactNode;
  /** Keyboard hint shown on the trailing edge ("⌘P"). Display only - bind the key yourself. */
  shortcut?: string;
  /** Extra text matched by search (synonyms, category, summary). Falls back to `label`. */
  searchText?: string;
  onSelect: () => void;
  /**
   * Close the palette once `onSelect` has run. Default `true`. Set `false` for an item that opens
   * a second step: swap `items` from `onSelect`; the query clears and focus returns to search.
   */
  closeOnSelect?: boolean;
}

/** Lowercase and collapse punctuation so "multi-select" matches "multi select". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface CommandMenuProps {
  /** Controlled open state. Omit to let the component own it. */
  open?: boolean;
  /**
   * Uncontrolled initial open state. Default false. Lets a demo or a ⌘K-only palette skip
   * carrying its own `useState`.
   */
  defaultOpen?: boolean;
  /** Called whenever the palette opens or closes, including via ⌘K and Escape. */
  onOpenChange?: (open: boolean) => void;
  /** Everything searchable. Filtering happens here, not in the consumer. */
  items: CommandMenuItem[];
  /** Text in the search input while it is empty. */
  placeholder?: string;
  /**
   * Key toggling the palette with ⌘ or Ctrl (`"k"` = ⌘K/Ctrl+K, no UA sniffing). Off by default.
   * Skips keydowns already `preventDefault()`ed and blocks the browser's own binding.
   */
  hotkey?: string;
}

/** ⌘K-style command palette: filterable, keyboard-navigable, grouped. */
export function CommandMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
  hotkey,
}: CommandMenuProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const portalAttrs = usePortalThemeAttrs();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();
  const optionId = (id: string) => `${listboxId}-option-${id}`;

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((item) => normalize(`${item.label} ${item.searchText ?? ""}`).includes(q));
  }, [items, query]);

  const groups = React.useMemo(() => {
    // Seeded with the ungrouped bucket so it is listed first, as documented on
    // `CommandMenuItem.group`, even when the first item carries a group.
    const map = new Map<string, CommandMenuItem[]>([["", []]]);
    for (const item of filtered) {
      const key = item.group ?? "";
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return Array.from(map.entries()).filter(([, groupItems]) => groupItems.length > 0);
  }, [filtered]);

  // Rows in drawn order. Navigation, Enter and `aria-activedescendant` index into this, not
  // `filtered`: items are drawn bucketed by group (`A:x, B:y, C:x` draws `A, C, B`).
  const ordered = React.useMemo(() => groups.flatMap(([, groupItems]) => groupItems), [groups]);

  React.useEffect(() => {
    if (!hotkey) return;
    const key = hotkey.toLowerCase();
    const toggle = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey) return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== key) return;
      event.preventDefault();
      setOpen(!open);
    };
    document.addEventListener("keydown", toggle);
    return () => document.removeEventListener("keydown", toggle);
  }, [hotkey, open, setOpen]);

  // Reset the highlighted row when the query or open state changes, without an effect:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [resetKey, setResetKey] = React.useState({ query, open });
  if (resetKey.query !== query || resetKey.open !== open) {
    setResetKey({ query, open });
    setActiveIndex(0);
  }

  const select = (item: CommandMenuItem | undefined) => {
    if (!item) return;
    item.onSelect();
    if (item.closeOnSelect === false) {
      setQuery("");
      setActiveIndex(0);
      inputRef.current?.focus();
      return;
    }
    setOpen(false);
  };

  return (
    <Base.Root open={open} onOpenChange={setOpen}>
      <Base.Portal>
        <Base.Backdrop
          {...portalAttrs}
          className="fuji-overlay-backdrop fuji-motion-backdrop fj:fixed fj:inset-0 fj:z-50"
        />
        <Base.Popup
          {...portalAttrs}
          className={cn(
            "fuji-glass-surface-overlay fuji-motion-modal fj:fixed fj:top-[12%] fj:left-1/2 fj:z-50 fj:flex fj:w-[calc(100vw-2rem)] fj:max-w-lg fj:-translate-x-1/2 fj:flex-col",
            "fj:overflow-hidden fj:rounded-fuji-overlay fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
          )}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => Math.min(ordered.length - 1, i + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              select(ordered[activeIndex]);
            }
          }}
        >
          <Base.Title className="fj:sr-only">Command menu</Base.Title>
          <div className="fj:flex fj:items-center fj:gap-2 fj:border-b fj:border-fuji-border fj:px-4 fj:py-3">
            <Search className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted" />
            <input
              ref={inputRef}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: a command palette's whole purpose is instant keyboard search the moment it opens (same convention as VS Code / Linear / cmdk).
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={ordered[activeIndex] ? optionId(ordered[activeIndex].id) : undefined}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className={cn(
                NATIVE_CONTROL_RESET,
                "fj:w-full fj:min-w-0 fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground fj:outline-none fj:placeholder:text-fuji-foreground-subtle",
              )}
            />
          </div>
          <div id={listboxId} role="listbox" className="fuji-scrollbar fj:max-h-80 fj:overflow-y-auto fj:p-2">
            {filtered.length === 0 && (
              <p className="fj:m-0 fj:px-2 fj:py-6 fj:text-center fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-subtle">
                No results found.
              </p>
            )}
            {groups.map(([group, groupItems]) => (
              <div
                key={group || "_"}
                role="group"
                aria-label={group || undefined}
                className="fj:mb-1 fj:last:mb-0"
              >
                {group && (
                  <p className="fj:m-0 fj:px-2 fj:py-1 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle">
                    {group}
                  </p>
                )}
                {groupItems.map((item) => {
                  const index = ordered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      id={optionId(item.id)}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(item)}
                      className={cn(
                        NATIVE_CONTROL_RESET,
                        "fj:box-border fj:flex fj:w-full fj:cursor-pointer fj:items-center fj:gap-2.5 fj:rounded-fuji-item fj:px-2.5 fj:py-2 fj:text-left fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground",
                        // Inverted fill/text like every other selection indicator (~14-17:1 in
                        // every theme x material); `bg-fuji-surface-strong` measured ~1:1 on
                        // light+glass, invisible to keyboard users.
                        index === activeIndex &&
                          "fuji-raised fj:bg-fuji-contained-default fj:text-fuji-default-foreground",
                      )}
                    >
                      {item.icon}
                      <span className="fj:flex-1 fj:truncate">{item.label}</span>
                      {item.shortcut && (
                        <span className="fj:text-[length:var(--fuji-text-xs)] fj:text-fuji-foreground-subtle">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
