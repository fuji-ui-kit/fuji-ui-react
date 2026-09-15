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
  // `<HTMLImageElement | null>`, not `<HTMLImageElement>`. React 18 types
  // `useRef<T>(null)` as a `RefObject<T>` whose `current` is READ-ONLY, so the
  // ref callback below ("imageRef.current = node") compiles only against React
  // 19's types. Including `null` in the parameter selects the mutable
  // overload, which exists in both versions.
  const imageRef = React.useRef<HTMLImageElement | null>(null);
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
            // Cast to a bare structural type rather than to React's own
            // `MutableRefObject`: React 19's types made `RefObject.current`
            // writable, React 18's did not, so the plain assignment compiles
            // only on 19 ("Cannot assign to 'current' because it is a
            // read-only property"). This shape is identical on both and
            // depends on neither version's ref typings. Caught by CI's
            // `react18` job, which is the only run that resolves React 18.
            else if (ref) (ref as { current: HTMLImageElement | null }).current = node;
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
          {/* The frame shrink-wraps the image so the close button can anchor
              to the PICTURE's corner. Anchored to the popup instead, it sat in
              the far corner of the viewport - metres away from the photo on a
              wide display, and unrelated to the thing it closes. */}
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
                  // Just inside the corner, on a scrim of its own: the image
                  // underneath can be any colour, so the button cannot rely on
                  // the backdrop for contrast.
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
