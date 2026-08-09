"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseControllableStateProps<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** Backs controlled/uncontrolled component APIs with one call site. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateProps<T>): [T, (next: T) => void] {
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const current = isControlled ? (value as T) : uncontrolled;

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [current, setValue];
}
