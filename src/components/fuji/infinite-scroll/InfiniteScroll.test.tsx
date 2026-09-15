import * as React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { InfiniteScroll } from "./InfiniteScroll";

/**
 * jsdom has no IntersectionObserver, and the component's whole job is to react
 * to one. This stub keeps the observed callbacks so a test can drive the
 * crossing directly - which is also the only way to assert the re-entry guard,
 * the part that actually breaks in real use.
 */
type Trigger = () => void;
let triggers: Trigger[] = [];

class MockIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {
    triggers.push(() =>
      this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never),
    );
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}

beforeEach(() => {
  triggers = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InfiniteScroll", () => {
  it("renders its children", () => {
    render(
      <InfiniteScroll hasMore onLoadMore={() => {}}>
        <p>Row one</p>
      </InfiniteScroll>,
    );
    expect(screen.getByText("Row one")).toBeInTheDocument();
  });

  it("calls onLoadMore when the sentinel is crossed", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScroll hasMore onLoadMore={onLoadMore}>
        <p>Rows</p>
      </InfiniteScroll>,
    );
    triggers.forEach((fire) => fire());
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not fire again while a load is still pending", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScroll hasMore onLoadMore={onLoadMore}>
        <p>Rows</p>
      </InfiniteScroll>,
    );
    // The observer can fire several times before the parent re-renders with
    // the next page; without the guard this is where duplicate fetches come
    // from.
    triggers.forEach((fire) => {
      fire();
      fire();
      fire();
    });
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("does not observe once hasMore is false", () => {
    const onLoadMore = vi.fn();
    render(
      <InfiniteScroll hasMore={false} onLoadMore={onLoadMore} endMessage="No more results">
        <p>Rows</p>
      </InfiniteScroll>,
    );
    triggers.forEach((fire) => fire());
    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.getByText("No more results")).toBeInTheDocument();
  });

  it("announces loading politely", () => {
    render(
      <InfiniteScroll hasMore loading onLoadMore={() => {}}>
        <p>Rows</p>
      </InfiniteScroll>,
    );
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/loading more/i);
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(
      <InfiniteScroll hasMore loading onLoadMore={() => {}}>
        <ul>
          <li>Row</li>
        </ul>
      </InfiniteScroll>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
