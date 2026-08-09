import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { Avatar, type AvatarProps } from "../avatar/Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: AvatarProps[];
  max?: number;
  size?: ComponentSize;
}

const SIZE_CLASSES: Record<ComponentSize, string> = { sm: "fj:size-8", md: "fj:size-10", lg: "fj:size-12" };

/** Overlapping avatar stack with a "+N" overflow indicator. */
export const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { avatars, max = 4, size = "md", className, ...props },
  ref,
) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - visible.length;

  return (
    <div ref={ref} className={cn("fj:flex fj:-space-x-2", className)} {...props}>
      {visible.map((avatar, index) => (
        <Avatar key={index} size={size} className="fj:ring-2 fj:ring-fuji-border-strong" {...avatar} />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-strong fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-muted fj:ring-2 fj:ring-fuji-border-strong",
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
});
