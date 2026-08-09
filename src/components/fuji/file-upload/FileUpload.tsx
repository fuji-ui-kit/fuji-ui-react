"use client";

import * as React from "react";
import { Paperclip, X } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Button } from "../button/Button";
import { NATIVE_CONTROL_RESET } from "../lib/native-control-reset";

export interface FileUploadProps {
  value?: File[];
  defaultValue?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

/** Button-triggered file input with a removable file list. Use `Dropzone` for drag-and-drop. */
export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  {
    value,
    defaultValue = [],
    onChange,
    accept,
    multiple = false,
    disabled,
    label = "Choose file",
    className,
  },
  ref,
) {
  const [internalFiles, setInternalFiles] = React.useState<File[]>(defaultValue);
  const files = value ?? internalFiles;
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const setFiles = (next: File[]) => {
    if (value === undefined) setInternalFiles(next);
    onChange?.(next);
  };

  return (
    <div className={cn("fj:flex fj:flex-col fj:gap-2", className)}>
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
          const list = Array.from(event.target.files ?? []);
          setFiles(multiple ? [...files, ...list] : list);
          // Without this, the input keeps the selected filename as its value,
          // so picking the exact same file again fires no `change` event at
          // all (the browser sees no value change) - including after it was
          // removed from the list below.
          event.target.value = "";
        }}
      />
      <Button appearance="bordered" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <Paperclip className="fj:size-4" />
        {label}
      </Button>
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
