"use client";

import * as React from "react";
import { UploadCloud, X } from "lucide-react";
import { cn } from "../../../lib/cn";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface DropzoneProps {
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  description?: string;
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
    className,
  },
  ref,
) {
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
        className={cn(
          "fuji-glass-surface-subtle fj:flex fj:flex-col fj:items-center fj:gap-2 fj:rounded-fuji-panel fj:border-2 fj:border-dashed fj:border-fuji-border-strong fj:bg-fuji-surface-subtle fj:px-6 fj:py-10 fj:text-center",
          "fj:transition-colors fj:duration-[var(--fuji-duration-fast)] fj:cursor-pointer",
          isDragActive && "fj:border-fuji-foreground fj:bg-fuji-surface-strong",
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
            // Without this, the input keeps the selected filename as its value,
            // so picking the exact same file again fires no `change` event at
            // all (the browser sees no value change) - including after it was
            // removed from the list below.
            event.target.value = "";
          }}
        />
        <UploadCloud className="fj:size-6 fj:text-fuji-foreground-muted" aria-hidden="true" />
        <p className="fj:m-0 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground-muted">
          {description}
        </p>
      </div>
      {files.length > 0 && (
        <ul className="fj:m-0 fj:flex fj:list-none fj:flex-col fj:gap-1 fj:p-0">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="fj:flex fj:items-center fj:justify-between fj:gap-2 fj:rounded-fuji-control fj:border fj:border-fuji-border fj:bg-fuji-surface-strong fj:px-3 fj:py-1.5 fj:text-[length:var(--fuji-text-sm)] fj:text-fuji-foreground"
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
