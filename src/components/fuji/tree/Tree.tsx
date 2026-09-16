"use client";

import * as React from "react";
import { ChevronRight, Folder } from "lucide-react";
import { cn } from "../../../lib/cn";

export interface TreeNode {
  /** Unique across the whole tree - it is the selection and expansion key. */
  id: string;
  /** What the row reads as. */
  label: React.ReactNode;
  /** Glyph before the label. */
  icon?: React.ReactNode;
  /** Nested nodes. A node with children renders as an expandable group. */
  children?: TreeNode[];
}

export interface TreeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** The roots of the tree. */
  data: TreeNode[];
  /** `id` of the selected node. Controlled - the tree does not track selection itself. */
  selectedId?: string;
  /** Fires when a tree node is activated (click, or Enter/Space while focused) - unrelated to the native `onSelect` text-selection event. */
  onSelect?: (node: TreeNode) => void;
  /** `id`s expanded on first render. Expansion is uncontrolled from then on. */
  defaultExpandedIds?: string[];
  /**
   * Whether selecting a parent node also toggles it. Default `true` - clicking
   * a folder row, or pressing Enter/Space on it, both selects it and
   * expands/collapses it, as before.
   *
   * Set `false` to decouple the two, per the WAI-ARIA tree pattern: a row
   * click and Enter/Space only select, the chevron toggles on click, and
   * ArrowRight/ArrowLeft expand and collapse from the keyboard (they always
   * do, in both modes). Use it when a folder is itself something to select -
   * a file browser that shows a folder's details - without it opening or
   * closing every time.
   */
  expandOnSelect?: boolean;
}

interface FlatNode {
  node: TreeNode;
  depth: number;
}

/** Depth-first list of every node whose ancestors are all expanded - i.e. what's actually visible right now. */
function flattenVisible(nodes: TreeNode[], expandedIds: Set<string>, depth = 0): FlatNode[] {
  const result: FlatNode[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children?.length && expandedIds.has(node.id)) {
      result.push(...flattenVisible(node.children, expandedIds, depth + 1));
    }
  }
  return result;
}

/** Recursive expandable tree - for file browsers and nested navigation. */
export const Tree = React.forwardRef<HTMLDivElement, TreeProps>(function Tree(
  { data, selectedId, onSelect, defaultExpandedIds = [], expandOnSelect = true, className, ...props },
  ref,
) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set(defaultExpandedIds));
  const [activeId, setActiveId] = React.useState<string | undefined>(() => selectedId ?? data[0]?.id);
  const itemRefs = React.useRef(new Map<string, HTMLDivElement>());

  const visible = React.useMemo(() => flattenVisible(data, expandedIds), [data, expandedIds]);
  // Roving tabindex needs exactly one visible item to be reachable via Tab.
  // If the previously active item scrolled out of view (its ancestor
  // collapsed), fall back to the first visible item instead of pointing at
  // nothing.
  const activeVisibleId = visible.some((item) => item.node.id === activeId) ? activeId : visible[0]?.node.id;

  const toggleExpand = (id: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const focusItem = (id: string | undefined) => {
    if (!id) return;
    setActiveId(id);
    itemRefs.current.get(id)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent, node: TreeNode, index: number) => {
    const hasChildren = Boolean(node.children?.length);
    const depth = visible[index]?.depth ?? 0;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        focusItem(visible[index + 1]?.node.id);
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        focusItem(visible[index - 1]?.node.id);
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        if (hasChildren && !expandedIds.has(node.id)) {
          toggleExpand(node.id);
        } else if (hasChildren) {
          focusItem(visible[index + 1]?.node.id);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        if (hasChildren && expandedIds.has(node.id)) {
          toggleExpand(node.id);
        } else {
          for (let i = index - 1; i >= 0; i--) {
            if (visible[i].depth < depth) {
              focusItem(visible[i].node.id);
              break;
            }
          }
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        focusItem(visible[0]?.node.id);
        break;
      }
      case "End": {
        event.preventDefault();
        focusItem(visible[visible.length - 1]?.node.id);
        break;
      }
      case "Enter":
      case " ": {
        // Native <button> gave this for free; the treeitem row is a plain
        // element (see TreeItem), so activation is wired explicitly here.
        event.preventDefault();
        if (hasChildren && expandOnSelect) toggleExpand(node.id);
        onSelect?.(node);
        break;
      }
    }
  };

  return (
    <div ref={ref} role="tree" className={cn("fj:flex fj:flex-col fj:gap-0.5", className)} {...props}>
      {data.map((node, index) => (
        <TreeItem
          key={node.id}
          node={node}
          depth={0}
          posInSet={index + 1}
          setSize={data.length}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpand}
          expandOnSelect={expandOnSelect}
          activeId={activeVisibleId}
          onFocusItem={setActiveId}
          registerRef={(id, el) => {
            if (el) itemRefs.current.set(id, el);
            else itemRefs.current.delete(id);
          }}
          visible={visible}
          onItemKeyDown={handleKeyDown}
        />
      ))}
    </div>
  );
});

function TreeItem({
  node,
  depth,
  posInSet,
  setSize,
  selectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  expandOnSelect,
  activeId,
  onFocusItem,
  registerRef,
  visible,
  onItemKeyDown,
}: {
  node: TreeNode;
  depth: number;
  posInSet: number;
  setSize: number;
  selectedId?: string;
  onSelect?: (node: TreeNode) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  expandOnSelect: boolean;
  activeId: string | undefined;
  onFocusItem: (id: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  visible: FlatNode[];
  onItemKeyDown: (event: React.KeyboardEvent, node: TreeNode, index: number) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isActive = activeId === node.id;
  const index = visible.findIndex((item) => item.node.id === node.id);

  return (
    <div>
      {/*
        The treeitem role, its aria-expanded/selected/level/posinset/setsize,
        and the roving tabIndex all live on this single node - it's the
        element that actually receives DOM focus. Splitting them across this
        wrapper and a nested interactive child (as an earlier version did,
        wrapping a real <button> inside) leaves AT focus landing on an
        element with none of that tree semantics attached. A plain div (not
        a <button>) also avoids nesting one interactive role inside another.
      */}
      <div
        ref={(el) => registerRef(node.id, el)}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={isSelected}
        aria-level={depth + 1}
        aria-setsize={setSize}
        aria-posinset={posInSet}
        tabIndex={isActive ? 0 : -1}
        onFocus={() => onFocusItem(node.id)}
        onKeyDown={(event) => onItemKeyDown(event, node, index)}
        onClick={() => {
          if (hasChildren && expandOnSelect) onToggleExpand(node.id);
          onSelect?.(node);
        }}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        className={cn(
          "fj:box-border fj:flex fj:w-full fj:cursor-pointer fj:items-center fj:gap-1.5 fj:rounded-fuji-item fj:py-1.5 fj:pr-2 fj:text-[length:var(--fuji-text-base)] fj:outline-none fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring",
          isSelected
            ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
            : "fj:text-fuji-foreground-muted fj:hover:bg-fuji-surface-subtle fj:hover:text-fuji-foreground",
        )}
      >
        {hasChildren ? (
          // With `expandOnSelect={false}` the chevron is the pointer's toggle.
          // Deliberately not a <button>: a focusable control nested in the
          // treeitem would split focus from the tree semantics (see above),
          // and keyboard users already have ArrowRight/ArrowLeft. It stops
          // propagation so the toggle does not also select the row.
          <span
            aria-hidden="true"
            data-tree-toggle=""
            onClick={
              expandOnSelect
                ? undefined
                : (event) => {
                    event.stopPropagation();
                    onToggleExpand(node.id);
                  }
            }
            className={cn(
              "fj:flex fj:shrink-0 fj:items-center fj:justify-center",
              // A larger hit area than the 14px glyph, without moving it.
              !expandOnSelect && "fj:-m-1 fj:rounded-fuji-item fj:p-1 fj:hover:bg-fuji-surface-strong",
            )}
          >
            <ChevronRight
              className={cn(
                "fj:size-3.5 fj:shrink-0 fj:transition-transform fj:duration-[var(--fuji-duration-fast)]",
                expanded && "fj:rotate-90",
              )}
            />
          </span>
        ) : (
          <span className="fj:size-3.5 fj:shrink-0" />
        )}
        <span
          className={cn(
            "fj:flex fj:size-4 fj:shrink-0 fj:items-center fj:justify-center",
            !isSelected && "fj:text-fuji-foreground-subtle",
          )}
        >
          {node.icon ?? (hasChildren && <Folder className="fj:size-4" />)}
        </span>
        <span className="fj:truncate">{node.label}</span>
      </div>
      {hasChildren && expanded && (
        <div role="group">
          {node.children!.map((child, childIndex) => (
            <TreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              posInSet={childIndex + 1}
              setSize={node.children!.length}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              expandOnSelect={expandOnSelect}
              activeId={activeId}
              onFocusItem={onFocusItem}
              registerRef={registerRef}
              visible={visible}
              onItemKeyDown={onItemKeyDown}
            />
          ))}
        </div>
      )}
    </div>
  );
}
