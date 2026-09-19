"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface DropzoneProps {
  /** Controlled list of accepted files. Pair with `onChange`; omit for uncontrolled. */
  value?: File[];
  /** Starting files when uncontrolled. */
  defaultValue?: File[];
  /** Called with the whole list after a drop, a pick or a removal. */
  onChange?: (files: File[]) => void;
  /** Forwarded to the native input: a comma-separated list of extensions or MIME types. */
  accept?: string;
  /** Allows more than one file, and appends each drop to the list rather than replacing it. */
  multiple?: boolean;
  /** Disables the drop target and its input. */
  disabled?: boolean;
  /** Prose inside the target ("PNG or JPG, up to 5 MB"). Not the accessible name - see `label`. */
  description?: string;
  /**
   * Accessible name for the drop target and its file list. Defaults to "Upload files"; set it when
   * a page has several Dropzones so they are distinguishable ("Upload avatar").
   */
  label?: string;
  /** Extra classes merged onto the drop target. */
  className?: string;
}

/** Drag-and-drop file target with a click-to-browse fallback. */
export const Dropzone = React.forwardRef<HTMLInputElement, DropzoneProps>(function Dropzone(
  {
    value,
    defaultValue = [],
    onChange,
    accept,
    multiple = false,
    disabled,
    description = "Drag and drop files here, or click to browse",
    label = "Upload files",
    className,
  },
  ref,
) {
  const descriptionId = React.useId();
  const [internalFiles, setInternalFiles] = React.useState<File[]>(defaultValue);
  const files = value ?? internalFiles;
  const [isDragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const setFiles = (next: File[]) => {
    if (value === undefined) setInternalFiles(next);
    onChange?.(next);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    setFiles(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  return (
    <div className={cn("fj:flex fj:flex-col fj:gap-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        // Explicit name: `role="button"` otherwise names itself from its contents, announcing the
        // `description` prose as the name and making two Dropzones indistinguishable.
        aria-label={label}
        aria-describedby={descriptionId}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        data-drag-active={isDragActive || undefined}
        className={cn(
          "fuji-dropzone fuji-glass-surface-subtle fj:flex fj:flex-col fj:items-center fj:gap-2 fj:rounded-fuji-panel fj:border-2 fj:border-dashed fj:border-fuji-border-strong fj:bg-fuji-surface-subtle fj:px-6 fj:py-10 fj:text-center",
          "fj:transition-colors fj:duration-[var(--fuji-duration-fast)] fj:cursor-pointer",
          // The fill comes from `.fuji-dropzone[data-drag-active]` in base.css,
          // not a utility - see the comment there for why a utility cannot win.
          isDragActive && "fj:border-fuji-foreground",
          disabled && "fj:pointer-events-none fj:cursor-not-allowed fj:opacity-45",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="fj:sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            // Reset the value so re-picking the same file (e.g. after removing it) still fires `change`.
            event.target.value = "";
          }}
        />
        <UploadCloud className="fj:size-6 fj:text-fuji-foreground-muted" aria-hidden="true" />
        <p
          id={descriptionId}
          className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted"
        >
          {description}
        </p>
      </div>
      {files.length > 0 && (
        // Named and announced, so screen-reader users get confirmation that a drop landed.
        <ul
          aria-label={`${label}: selected files`}
          aria-live="polite"
          className="fj:m-0 fj:flex fj:list-none fj:flex-col fj:gap-1 fj:p-0"
        >
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="fj:flex fj:items-center fj:justify-between fj:gap-2 fj:rounded-fuji-control fj:border fj:border-fuji-border fj:bg-fuji-surface-raised fj:px-3 fj:py-1.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground"
            >
              <span className="fj:truncate">{file.name}</span>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                className={cn(
                  NATIVE_CONTROL_RESET,
                  "fj:flex fj:shrink-0 fj:cursor-pointer fj:items-center fj:text-fuji-foreground-subtle fj:hover:text-fuji-fire",
                )}
              >
                <X className="fj:size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
