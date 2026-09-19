"use client";

import { useCallback, useInsertionEffect, useRef, useState } from "react";

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
  // `useInsertionEffect` (React's own `useEffectEvent` polyfill shape): a passive effect can be
  // deferred past commit under concurrent rendering, so a parent that swaps `onChange` and fires
  // the control at once would get the old callback. Insertion effects run synchronously in commit.
  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  });

  // Dev-only controlled<->uncontrolled warning: the symptom (an input that stops responding or
  // ignores its prop) never points back here, and React only warns for its own inputs.
  const wasControlled = useRef(isControlled);
  if (process.env.NODE_ENV !== "production" && wasControlled.current !== isControlled) {
    wasControlled.current = isControlled;
    console.error(
      `[fuji-ui] A component switched from ${isControlled ? "uncontrolled to controlled" : "controlled to uncontrolled"}. ` +
        "Decide for the component's lifetime: pass `value` (plus `onChange`) to control it, or `defaultValue` to let it manage itself. " +
        "A `value` of `undefined` reads as uncontrolled - use `null` or an empty value instead if you mean 'no selection'.",
    );
  }

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [current, setValue];
}
