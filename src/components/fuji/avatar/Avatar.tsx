"use client";

import * as React from "react";
import { Avatar as Base } from "@base-ui/react/avatar";
import { cn } from "../../../lib/cn";
import type { ComponentSize, ComponentTone } from "../../../types";
import { softClasses } from "../lib/appearance";

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof Base.Root> {
  /** Image URL. On a load error the `fallback` takes over. */
  src?: string;
  /** Alternative text for the image. */
  alt?: string;
  /** Fallback content (initials or icon) shown while loading or on error. */
  fallback?: React.ReactNode;
  /** Diameter, matching the control scale used elsewhere. */
  size?: ComponentSize;
  /** Background/text color behind the fallback content. Default "default". */
  tone?: ComponentTone;
}

const SIZE_CLASSES: Record<ComponentSize, string> = {
  sm: "fj:size-8 fj:text-[length:var(--fuji-text-xs)]",
  md: "fj:size-10 fj:text-[length:var(--fuji-text-sm)]",
  lg: "fj:size-12 fj:text-[length:var(--fuji-text-base)]",
};

/** Circular avatar (wraps Base UI Avatar) with an automatic initials/icon fallback. */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt = "", fallback, size = "md", tone = "default", className, ...props },
  ref,
) {
  return (
    <Base.Root
      ref={ref}
      className={cn(
        // `shadow-fuji-control` makes Avatar answer to the elevation axis; without a shadow token
        // `regular` and `floating` rendered identically.
        "fj:box-border fj:flex fj:shrink-0 fj:items-center fj:justify-center fj:overflow-hidden fj:rounded-full fj:font-medium fj:shadow-fuji-control",
        softClasses(tone),
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {src && <Base.Image src={src} alt={alt} className="fj:size-full fj:object-cover" />}
      <Base.Fallback className="fj:flex fj:items-center fj:justify-center">{fallback}</Base.Fallback>
    </Base.Root>
  );
});
