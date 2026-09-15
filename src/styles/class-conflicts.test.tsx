import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  FujiProvider,
  IconButton,
  Input,
  NumberInput,
  PasswordInput,
  SearchInput,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Textarea,
  Typography,
} from "../index";
import type { ComponentAppearance, ComponentTone } from "../types";

/**
 * `NATIVE_CONTROL_RESET` is applied first by 31 components and carries
 * `border-0`/`bg-transparent`; each component then sets its own `border`/`bg-*`
 * later in the same `cn()` call. Those pairs conflict, and `cn`'s tailwind-merge
 * pass is what resolves them to the later class.
 *
 * Dropping that merge pass (an attractive ~10 kB saving) leaves both classes on
 * the element, at which point stylesheet source order decides - which silently
 * rendered every `contained` Button transparent, with no test failing. This
 * asserts the rendered markup never carries two classes from the same conflict
 * group, so the breakage is caught at the class level rather than by eye.
 */
const CONFLICT_GROUPS: Array<{ name: string; match: (cls: string) => boolean }> = [
  { name: "background", match: (c) => /^fj:bg-/.test(c) },
  { name: "border-width", match: (c) => c === "fj:border" || c === "fj:border-0" },
  { name: "padding-x", match: (c) => /^fj:px-/.test(c) },
  { name: "padding-all", match: (c) => /^fj:p-\d/.test(c) },
  { name: "margin-all", match: (c) => /^fj:m-\d/.test(c) },
  { name: "height", match: (c) => /^fj:h-/.test(c) },
];

const TONES: ComponentTone[] = ["default", "forest", "water", "sun", "fire"];
const APPEARANCES: ComponentAppearance[] = ["contained", "bordered", "dashed", "ghost"];

function markup() {
  return renderToStaticMarkup(
    <FujiProvider>
      {TONES.map((tone) =>
        APPEARANCES.map((appearance) => (
          <Button key={`${tone}-${appearance}`} tone={tone} appearance={appearance}>
            x
          </Button>
        )),
      )}
      {TONES.map((tone) => (
        <Badge key={tone} tone={tone}>
          x
        </Badge>
      ))}
      <IconButton aria-label="Star">
        <svg />
      </IconButton>
      <Input placeholder="x" />
      <Textarea />
      <NumberInput />
      <PasswordInput />
      <SearchInput />
      <Checkbox />
      <Switch />
      <Avatar fallback="A" />
      <Alert variant="info" title="t">
        x
      </Alert>
      <Card>
        <CardContent>x</CardContent>
      </Card>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Typography scale="body">x</Typography>
    </FujiProvider>,
  );
}

describe("rendered class conflicts", () => {
  const classAttributes = [...markup().matchAll(/class="([^"]*)"/g)].map((m) => m[1]);

  it("renders a representative sample of components", () => {
    expect(classAttributes.length).toBeGreaterThan(30);
  });

  it("never emits two classes from the same conflict group on one element", () => {
    const offenders: string[] = [];
    for (const attribute of classAttributes) {
      const classes = attribute.split(/\s+/).filter(Boolean);
      for (const group of CONFLICT_GROUPS) {
        const hits = classes.filter(group.match);
        if (hits.length > 1) offenders.push(`${group.name}: ${hits.join(" + ")}`);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });
});
