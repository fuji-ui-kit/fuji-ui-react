import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calendar,
  ChatBubble,
  Container,
  FujiProvider,
  List,
  ListItem,
  Sidebar,
  SidebarItem,
  Slider,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Tree,
} from "../index";

/**
 * This package deliberately ships no preflight (SPEC.md §8), so a consumer
 * with no global reset of their own gets the CSS default, `box-sizing:
 * content-box`. On an element that sets BOTH an explicit width/height and
 * padding, that means the padding lands OUTSIDE the declared size - `w-full`
 * plus `px-8` renders 64px wider than its parent's content box and overflows
 * it.
 *
 * `Container` shipped exactly that. At 1280px its `xl` width overhung the
 * viewport by its own gutter; measured in the preview, its computed
 * `box-sizing` was `content-box` and its border box was 1233px inside a
 * 1169px parent. It was invisible in any app that happens to have a Tailwind
 * reset, which is why neither the tests nor the fixtures caught it - and
 * thirteen other components had the same latent shape.
 *
 * The fix is `fj:box-border` on the element itself. A global
 * `.fuji-theme-scope * { box-sizing: border-box }` would restyle all of a
 * consumer's own markup nested inside the provider, which base.css rules out
 * for exactly that reason.
 */
const SIZE = /^fj:(w|h|size|max-w|max-h)-/;
// `p-0`/`px-0` can't overflow anything, so they don't need the declaration.
const PADDING = /^fj:p[xytrbl]?-(?!0(\.|$))/;

function offenders(markup: string): string[] {
  const found: string[] = [];
  for (const [, attribute] of markup.matchAll(/class="([^"]*)"/g)) {
    const classes = attribute.split(/\s+/).filter(Boolean);
    if (classes.includes("fj:box-border")) continue;
    const sized = classes.filter((c) => SIZE.test(c));
    const padded = classes.filter((c) => PADDING.test(c));
    if (sized.length && padded.length) found.push(`${sized.join(" ")} + ${padded.join(" ")}`);
  }
  return [...new Set(found)];
}

describe("explicit size + padding always sets box-border", () => {
  it("holds across the components that combine the two", () => {
    const markup = renderToStaticMarkup(
      <FujiProvider>
        <Container width="xl">x</Container>
        <List>
          <ListItem>x</ListItem>
        </List>
        <Sidebar>
          <SidebarItem href="/">x</SidebarItem>
        </Sidebar>
        <Slider defaultValue={1} />
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTab value="a">A</TabsTab>
          </TabsList>
          <TabsPanel value="a">x</TabsPanel>
        </Tabs>
        <Tree data={[{ id: "1", label: "One" }]} />
        <ChatBubble sender="A">x</ChatBubble>
        <Calendar />
      </FujiProvider>,
    );
    expect(offenders(markup)).toEqual([]);
  });

  // Without this the assertion above could quietly become vacuous - if the
  // regexes stopped matching anything, "no offenders" would still pass.
  it("recognises the shape it is guarding against", () => {
    expect(offenders('<div class="fj:w-full fj:px-4">x</div>')).toEqual(["fj:w-full + fj:px-4"]);
    expect(offenders('<div class="fj:box-border fj:w-full fj:px-4">x</div>')).toEqual([]);
    expect(offenders('<div class="fj:w-full fj:p-0">x</div>')).toEqual([]);
  });
});
