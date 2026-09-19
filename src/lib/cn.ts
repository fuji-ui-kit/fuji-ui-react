import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges classes; twMerge reads `fj:` as a variant (`fj:p-2 fj:p-4` -> `fj:p-4`) and passes
 * `fuji-*` and unprefixed consumer classes through. Don't swap for `clsx` (~10 kB): twMerge makes
 * `NATIVE_CONTROL_RESET`'s `border-0`/`bg-transparent` lose to later `border`/`bg-*` (else every
 * contained Button went transparent). First make no component emit two classes per conflict group. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
