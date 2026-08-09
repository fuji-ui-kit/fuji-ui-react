import { describe, expect, it } from "vitest";
import { isSafeHref } from "./safe-href";

// Built with fromCharCode rather than a literal escape in this source file so
// the exact control character survives untouched through any tool in the
// editing/formatting pipeline.
const NUL = String.fromCharCode(0);
const SOH = String.fromCharCode(1);
const ESC = String.fromCharCode(27);
const TAB = String.fromCharCode(9);

describe("isSafeHref", () => {
  it("allows relative, hash, query, and protocol-relative URLs", () => {
    expect(isSafeHref("/relative/path")).toBe(true);
    expect(isSafeHref("relative/path")).toBe(true);
    expect(isSafeHref("#hash")).toBe(true);
    expect(isSafeHref("?query=1")).toBe(true);
    expect(isSafeHref("//example.com/x")).toBe(true);
  });

  it("allows the supported absolute schemes", () => {
    expect(isSafeHref("https://example.com")).toBe(true);
    expect(isSafeHref("http://example.com")).toBe(true);
    expect(isSafeHref("mailto:a@b.com")).toBe(true);
    expect(isSafeHref("tel:+15551234567")).toBe(true);
  });

  it("allows an absent href", () => {
    expect(isSafeHref(undefined)).toBe(true);
    expect(isSafeHref(null)).toBe(true);
    expect(isSafeHref("")).toBe(true);
  });

  it("rejects script-executing and unrecognized schemes", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("JavaScript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHref("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeHref("file:///etc/passwd")).toBe(false);
  });

  // Regression: a naive "strip tabs/newlines, then match a leading scheme"
  // regex sees no scheme at all once a stray control character sits in front
  // of it, and treats "no scheme" as safe (indistinguishable from a relative
  // URL). A real browser's URL parser strips leading C0 controls and spaces
  // before resolving the scheme, so the href still executes as `javascript:`
  // on click regardless. `URL` implements that same stripping, so it isn't
  // fooled the same way.
  it("rejects a script scheme disguised with a leading C0 control character", () => {
    expect(isSafeHref(NUL + "javascript:alert(1)")).toBe(false);
    expect(isSafeHref(SOH + "javascript:alert(1)")).toBe(false);
    expect(isSafeHref(ESC + "javascript:alert(1)")).toBe(false);
    expect(isSafeHref("   " + NUL + "javascript:alert(1)")).toBe(false);
    expect(isSafeHref(" javascript:alert(1)")).toBe(false);
  });

  it("rejects a script scheme with a tab spliced into the middle of it", () => {
    expect(isSafeHref("java" + TAB + "script:alert(1)")).toBe(false);
  });
});
