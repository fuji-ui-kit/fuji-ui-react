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

/** No preflight ships (SPEC.md §8), so without a consumer reset `box-sizing` is `content-box` and
 * padding lands outside an explicit size: `Container` overhung the viewport (1233px border box in a
 * 1169px parent), hidden by any Tailwind reset, and thirteen others shared the shape. Fix is
 * `fj:box-border` per element; a global `*` rule would restyle consumer markup (see base.css). */
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

  // Guards against the assertion above going vacuous if the regexes stopped matching anything.
  it("recognises the shape it is guarding against", () => {
    expect(offenders('<div class="fj:w-full fj:px-4">x</div>')).toEqual(["fj:w-full + fj:px-4"]);
    expect(offenders('<div class="fj:box-border fj:w-full fj:px-4">x</div>')).toEqual([]);
    expect(offenders('<div class="fj:w-full fj:p-0">x</div>')).toEqual([]);
  });
});
