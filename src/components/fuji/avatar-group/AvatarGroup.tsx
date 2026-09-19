import * as React from "react";
import { cn } from "../../../lib/cn";
import type { ComponentSize } from "../../../types";
import { Avatar, type AvatarProps } from "../avatar/Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Each face, in stacking order. Earlier entries sit above later ones. */
  avatars: AvatarProps[];
  /** How many faces to show before the rest collapse into a "+N" tile. */
  max?: number;
  /** Diameter applied to every avatar in the group. */
  size?: ComponentSize;
}

const SIZE_CLASSES: Record<ComponentSize, string> = { sm: "fj:size-8", md: "fj:size-10", lg: "fj:size-12" };

/**
 * The ring between stacked avatars uses the surface colour behind them so each reads as cut out;
 * a visible colour drew grey arcs over neighbours. Override via `--fuji-avatar-group-ring`.
 */
const RING = "fj:ring-2 fj:ring-[color:var(--fuji-avatar-group-ring,var(--fuji-surface))]";

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
        <Avatar
          key={index}
          size={size}
          // Earlier avatars stack above later ones, so "+N" tucks under the last face.
          style={{ zIndex: visible.length - index }}
          className={cn("fj:relative", RING)}
          {...avatar}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:rounded-full fj:bg-fuji-surface-raised fj:text-[length:var(--fuji-text-xs)] fj:font-medium fj:text-fuji-foreground-muted",
            RING,
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
});
