import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The `plugins/fuji-ui/` plugin and its marketplace file. Nothing else in CI loads them (validation
 * needs the Claude Code CLI), and a broken skill fails silently - agents just never use it.
 */
const ROOT = path.join(__dirname, "..", "..");
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file: string) => JSON.parse(read(file)) as Record<string, unknown>;

// Names Claude Code refuses for third-party marketplaces (plugin-marketplaces docs).
const RESERVED = new Set([
  "claude-code-marketplace",
  "claude-code-plugins",
  "claude-plugins-official",
  "claude-plugins-community",
  "anthropic-marketplace",
  "anthropic-plugins",
  "agent-skills",
]);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const marketplace = json(".claude-plugin/marketplace.json") as {
  name: string;
  owner: { name: string };
  plugins: { name: string; source: string }[];
};

describe("the Claude Code marketplace", () => {
  it("has a usable, unreserved name and an owner", () => {
    expect(marketplace.name).toMatch(KEBAB);
    expect(RESERVED.has(marketplace.name)).toBe(false);
    expect(marketplace.owner?.name).toBeTruthy();
  });

  it.each(marketplace.plugins)("lists $name from a directory holding a plugin of that name", (entry) => {
    expect(entry.source.startsWith("./")).toBe(true);
    const manifest = json(path.join(entry.source, ".claude-plugin", "plugin.json"));
    expect(manifest.name).toBe(entry.name);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe("the fuji-ui plugin", () => {
  const dir = "plugins/fuji-ui";

  it("starts the published MCP server, by the name it is published under", () => {
    const published = json("mcp/package.json").name as string;
    const servers = (json(`${dir}/.mcp.json`).mcpServers ?? {}) as Record<string, { args?: string[] }>;
    const args = Object.values(servers).flatMap((server) => server.args ?? []);
    expect(args).toContain(published);
  });

  const skills = fs.readdirSync(path.join(ROOT, dir, "skills"));

  it.each(skills)("skill %s has frontmatter the Agent Skills spec accepts", (skill) => {
    const source = read(`${dir}/skills/${skill}/SKILL.md`);
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source)?.[1] ?? "";
    // Single-line values only - the skill is written that way on purpose.
    const field = (key: string) => new RegExp(`^${key}:\\s*(.+)$`, "m").exec(frontmatter)?.[1]?.trim() ?? "";
    const name = field("name");
    expect(name).toBe(skill);
    expect(name.length).toBeLessThanOrEqual(64);
    expect(name).toMatch(KEBAB);
    const description = field("description");
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThanOrEqual(1024);
    // `metadata.internal: true` hides a skill from `npx skills add`. The
    // contributor skills in .claude/skills need it; this one must never get it.
    expect(frontmatter).not.toMatch(/^\s*internal:\s*true/m);
    // The spec's ceiling before a skill should split into reference files.
    expect(source.split("\n").length).toBeLessThan(500);
  });

  /**
   * The skill restates `review_usage`'s conventions for agents without the MCP; each needs a
   * `<!-- rule: id -->` marker, so a new registry convention can't silently miss the skill.
   */
  const registryFile = path.join(ROOT, "dist", "registry.json");
  describe.skipIf(!fs.existsSync(registryFile))("against dist/registry.json", () => {
    it("covers every convention review_usage enforces", () => {
      const { conventions } = JSON.parse(fs.readFileSync(registryFile, "utf8")) as {
        conventions: { id: string }[];
      };
      const skill = read(`${dir}/skills/fuji-ui/SKILL.md`);
      const missing = conventions.map((c) => c.id).filter((id) => !skill.includes(`<!-- rule: ${id} -->`));
      expect(missing).toEqual([]);
    });
  });
});
