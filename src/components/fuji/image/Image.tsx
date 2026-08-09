"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";
import { Dialog as Base } from "@base-ui/react/dialog";
import { cn } from "../../../lib/cn";
import { usePortalThemeAttrs } from "../lib/use-portal-theme-attrs";
import { DismissButton } from "../lib/dismiss-button";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** width / height, e.g. 16 / 9. Omit to size intrinsically. */
  ratio?: number;
  /** Shows a skeleton shimmer until the image has loaded. */
  showLoadingSkeleton?: boolean;
  /** Click (or Enter/Space) opens a fullscreen preview overlay. Defaults to false. */
  fullscreen?: boolean;
}

/** Plain `<img>` wrapper - no Next/Image dependency - with loading/error states and an optional fullscreen preview. */
export const Image = React.forwardRef<HTMLImageElement, ImageProps>(function Image(
  { ratio, showLoadingSkeleton = true, fullscreen = false, className, style, alt, onLoad, onError, ...props },
  ref,
) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">("loading");
  const imageRef = React.useRef<HTMLImageElement>(null);
  const portalAttrs = usePortalThemeAttrs();

  // Reset a previous error/loaded state when the caller points the component
  // at a new source, so a failed image can recover instead of permanently
  // showing the fallback icon. Adjusting state during render (rather than in
  // an effect) applies before this render paints the stale status.
  const [prevSrc, setPrevSrc] = React.useState(props.src);
  if (props.src !== prevSrc) {
    setPrevSrc(props.src);
    setStatus("loading");
  }

  React.useEffect(() => {
    // Cached images can already be complete before React attaches onLoad.
    // Resolve that state explicitly so a loaded image never stays transparent.
    const image = imageRef.current;
    if (image?.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "error");
    }
  }, [props.src]);

  const img = (
    <span
      className={cn(
        "fj:box-border fj:relative fj:block fj:overflow-hidden fj:bg-fuji-surface-strong",
        !fullscreen && className,
      )}
      style={fullscreen ? undefined : { aspectRatio: ratio, ...style }}
    >
      {status === "error" ? (
        <span className="fj:flex fj:h-full fj:min-h-16 fj:w-full fj:items-center fj:justify-center fj:text-fuji-foreground-subtle">
          <ImageOff className="fj:size-5" aria-hidden="true" />
        </span>
      ) : (
        // Framework-agnostic package: no next/image here by design.
        <img
          ref={(node) => {
            // Always tracked so the loaded/cached-image fallback effect below
            // can resolve `status`, even when `fullscreen` forwards the
            // consumer's own `ref` to the popup preview image instead.
            imageRef.current = node;
            if (fullscreen) return;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            // `block` matches preflight's `img,svg,video{display:block}` -
            // without it a raw <img> defaults to inline, which can leave a
            // few px of baseline gap below it.
            "fj:block fj:h-full fj:w-full fj:object-cover fj:transition-opacity fj:duration-[var(--fuji-duration-slow)]",
            status === "loading" && "fj:opacity-0",
          )}
          onLoad={(event) => {
            setStatus("loaded");
            onLoad?.(event);
          }}
          onError={(event) => {
            setStatus("error");
            onError?.(event);
          }}
          {...props}
        />
      )}
      {showLoadingSkeleton && status === "loading" && (
        <span
          className="fj:absolute fj:inset-0 fj:animate-pulse fj:bg-fuji-surface-strong"
          aria-hidden="true"
        />
      )}
    </span>
  );

  if (!fullscreen) return img;

  return (
    <Base.Root>
      <Base.Trigger
        className={cn(
          NATIVE_CONTROL_RESET,
          "fj:relative fj:block fj:cursor-pointer fj:overflow-hidden fj:bg-fuji-surface-strong fj:outline-none fj:focus-visible:ring-2 fj:focus-visible:ring-fuji-focus-ring",
          className,
        )}
        style={{ aspectRatio: ratio, ...style }}
        aria-label={alt ? `View "${alt}" fullscreen` : "View image fullscreen"}
      >
        {img}
      </Base.Trigger>
      <Base.Portal>
        <Base.Backdrop
          {...portalAttrs}
          className="fuji-overlay-backdrop fj:fixed fj:inset-0 fj:z-50 fj:transition-opacity fj:duration-[var(--fuji-duration-base)] fj:data-[ending-style]:opacity-0 fj:data-[starting-style]:opacity-0"
        />
        <Base.Popup
          {...portalAttrs}
          className={cn(
            "fj:fixed fj:inset-0 fj:z-50 fj:flex fj:items-center fj:justify-center fj:p-6 fj:outline-none",
            "fj:transition-[transform,opacity] fj:duration-[var(--fuji-duration-base)] fj:ease-[var(--fuji-ease)]",
            "fj:data-[starting-style]:scale-[0.98] fj:data-[starting-style]:opacity-0",
            "fj:data-[ending-style]:scale-[0.98] fj:data-[ending-style]:opacity-0",
          )}
        >
          <Base.Close
            render={
              <DismissButton
                aria-label="Close"
                className="fj:absolute fj:top-4 fj:right-4 fj:text-white fj:opacity-90 fj:hover:opacity-100"
              />
            }
          />
          {/* fullscreen preview of the same source; no next/image dependency by design. */}
          <img
            ref={ref}
            src={props.src}
            alt={alt}
            className="fj:block fj:max-h-full fj:max-w-full fj:rounded-fuji-panel fj:object-contain fj:shadow-fuji-overlay"
          />
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
});
