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
  // `<HTMLImageElement | null>` selects the mutable ref overload in both React 18 and 19; React 18
  // types `useRef<T>(null).current` as read-only, so the ref callback below would not compile.
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const portalAttrs = usePortalThemeAttrs();

  // Reset error/loaded state when the source changes so a failed image can recover; adjusted during
  // render so the stale status never paints.
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
            // Always tracked so the fallback effect below can resolve `status`, even when
            // `fullscreen` forwards the consumer's `ref` to the preview image.
            imageRef.current = node;
            if (fullscreen) return;
            if (typeof ref === "function") ref(node);
            // A bare structural cast, not `MutableRefObject`: `RefObject.current` is writable only
            // in React 19's types, so plain assignment fails on 18 (caught by CI's `react18` job).
            else if (ref) (ref as { current: HTMLImageElement | null }).current = node;
          }}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn(
            // `block`, as preflight would set: an inline <img> leaves a baseline gap below it.
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
          className="fj:absolute fj:inset-0 fj:animate-fuji-pulse fj:bg-fuji-surface-strong"
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
          className="fuji-lightbox-backdrop fuji-motion-backdrop fj:fixed fj:inset-0 fj:z-50"
        />
        <Base.Popup
          {...portalAttrs}
          className={cn(
            "fuji-motion-modal fj:fixed fj:inset-0 fj:z-50 fj:flex fj:items-center fj:justify-center fj:p-6 fj:outline-none",
          )}
        >
          {/* The frame shrink-wraps the image so the close button anchors to the picture's
              corner, not the far corner of a wide viewport. */}
          <div className="fj:relative fj:flex fj:max-h-full fj:max-w-full">
            {/* fullscreen preview of the same source; no next/image dependency by design. */}
            <img
              ref={ref}
              src={props.src}
              alt={alt}
              className="fj:block fj:max-h-full fj:max-w-full fj:rounded-fuji-panel fj:object-contain fj:shadow-fuji-overlay"
            />
            <Base.Close
              render={
                <DismissButton
                  aria-label="Close"
                  // Own scrim: the image beneath can be any colour, so the backdrop can't give contrast.
                  className="fj:absolute fj:top-2 fj:right-2 fj:bg-black/55 fj:text-white fj:backdrop-blur-sm fj:hover:bg-black/70"
                />
              }
            />
          </div>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
});
