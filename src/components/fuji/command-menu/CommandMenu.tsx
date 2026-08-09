"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";

export interface CommandMenuItem {
  id: string;
  label: string;
  group?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  /** Extra text matched by search (synonyms, category, summary). Falls back to `label`. */
  searchText?: string;
  onSelect: () => void;
}

/** Lowercase and collapse punctuation so "multi-select" matches "multi select". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandMenuItem[];
  placeholder?: string;
}

/** ⌘K-style command palette: filterable, keyboard-navigable, grouped. */
export function CommandMenu({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search…",
}: CommandMenuProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const portalAttrs = usePortalThemeAttrs();
  const listboxId = React.useId();
  const optionId = (id: string) => `${listboxId}-option-${id}`;

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((item) => normalize(`${item.label} ${item.searchText ?? ""}`).includes(q));
  }, [items, query]);

  const groups = React.useMemo(() => {
    const map = new Map<string, CommandMenuItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "";
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // Reset the highlighted row whenever the query or open-state changes,
  // without an effect (React's "adjusting state during render" pattern:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [resetKey, setResetKey] = React.useState({ query, open });
  if (resetKey.query !== query || resetKey.open !== open) {
    setResetKey({ query, open });
    setActiveIndex(0);
  }

  const select = (item: CommandMenuItem | undefined) => {
    if (!item) return;
    item.onSelect();
    onOpenChange(false);
  };

  return (
    <Base.Root open={open} onOpenChange={onOpenChange}>
      <Base.Portal>
        <Base.Backdrop
          {...portalAttrs}
          className="fuji-overlay-backdrop fj:fixed fj:inset-0 fj:z-50 fj:transition-opacity fj:duration-[var(--fuji-duration-base)] fj:data-[ending-style]:opacity-0 fj:data-[starting-style]:opacity-0"
        />
        <Base.Popup
          {...portalAttrs}
          className={cn(
            "fuji-glass-surface-overlay fj:fixed fj:top-[12%] fj:left-1/2 fj:z-50 fj:flex fj:w-[calc(100vw-2rem)] fj:max-w-lg fj:-translate-x-1/2 fj:flex-col",
            "fj:overflow-hidden fj:rounded-fuji-overlay fj:border fj:border-fuji-border fj:bg-fuji-surface-overlay fj:shadow-fuji-overlay fj:outline-none",
            "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
            "fj:data-[starting-style]:scale-[0.98] fj:data-[starting-style]:opacity-0",
            "fj:data-[ending-style]:scale-[0.98] fj:data-[ending-style]:opacity-0",
          )}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              select(filtered[activeIndex]);
            }
          }}
        >
          <Base.Title className="fj:sr-only">Command menu</Base.Title>
          <div className="fj:flex fj:items-center fj:gap-2 fj:border-b fj:border-fuji-border fj:px-4 fj:py-3">
            <Search className="fj:size-4 fj:shrink-0 fj:text-fuji-foreground-muted" />
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus -- deliberate: a command palette's whole purpose is instant keyboard search the moment it opens (same convention as VS Code / Linear / cmdk).
              autoFocus
              role="combobox"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={filtered[activeIndex] ? optionId(filtered[activeIndex].id) : undefined}
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
                  const index = filtered.indexOf(item);
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
                        "fj:flex fj:w-full fj:cursor-pointer fj:items-center fj:gap-2.5 fj:rounded-[6px] fj:px-2.5 fj:py-2 fj:text-left fj:text-[length:var(--fuji-text-base)] fj:text-fuji-foreground",
                        index === activeIndex && "fj:bg-fuji-surface-strong",
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
