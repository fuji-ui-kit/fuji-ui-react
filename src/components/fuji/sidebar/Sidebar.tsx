import * as React from "react";
import { cn } from "../../../lib/cn";

const SidebarRoot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(function SidebarRoot(
  { className, children, ...props },
  ref,
) {
  return (
    <aside
      ref={ref}
      className={cn(
        "fuji-scrollbar fuji-glass-surface-subtle fj:flex fj:h-full fj:w-64 fj:shrink-0 fj:flex-col fj:gap-4 fj:overflow-y-auto fj:border-r fj:border-fuji-border fj:bg-fuji-surface-subtle fj:p-4",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
});

const SidebarSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { label?: React.ReactNode }
>(function SidebarSection({ label, className, children, ...props }, ref) {
  return (
    <div ref={ref} className={cn("fj:flex fj:flex-col fj:gap-0.5", className)} {...props}>
      {label && (
        <p className="fj:m-0 fj:px-2 fj:py-1.5 fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-subtle fj:uppercase fj:tracking-wide">
          {label}
        </p>
      )}
      {children}
    </div>
  );
});

export interface SidebarItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  active?: boolean;
  as?: React.ElementType;
}

const SidebarItem = React.forwardRef<HTMLAnchorElement, SidebarItemProps>(function SidebarItem(
  { icon, active, as: Tag = "a", className, children, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref}
      aria-current={active ? "page" : undefined}
      className={cn(
        "fj:flex fj:cursor-pointer fj:items-center fj:gap-2.5 fj:rounded-fuji-control fj:px-2.5 fj:py-2 fj:text-[length:var(--fuji-text-base)] fj:font-medium fj:transition-colors fj:duration-[var(--fuji-duration-fast)]",
        active
          ? "fj:bg-fuji-default fj:text-fuji-default-foreground"
          : "fj:text-fuji-foreground-muted fj:hover:bg-fuji-surface-strong fj:hover:text-fuji-foreground",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="fj:flex fj:size-4 fj:shrink-0 fj:items-center fj:justify-center">{icon}</span>
      )}
      {children}
    </Tag>
  );
});

/** `<Sidebar><Sidebar.Section label="Main"><Sidebar.Item icon active>Home</Sidebar.Item></Sidebar.Section></Sidebar>` */
export const Sidebar = Object.assign(SidebarRoot, { Section: SidebarSection, Item: SidebarItem });
