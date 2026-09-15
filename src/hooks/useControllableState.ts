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
  // `useInsertionEffect`, not `useEffect`: this is the shape React's own docs
  // use for the `useEffectEvent` polyfill. Passive effects can be deferred
  // past a commit under concurrent rendering, which leaves an effect-updated
  // ref still holding the *previous* render's handler when an event fires in
  // between - so a parent that swaps `onChange` and immediately triggers the
  // control gets the old callback. Insertion effects run synchronously during
  // commit, before that window opens.
  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  });

  // Dev-only: switching a component between controlled and uncontrolled
  // silently changes which value wins, and the symptom (an input that stops
  // responding, or one that ignores its own prop) never points back here.
  // React warns about this for its own inputs; Fuji's controls are built on
  // this hook instead, so the warning has to live here.
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
