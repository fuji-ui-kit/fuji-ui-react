#!/usr/bin/env node
/*
 * Fails if .claude/.codex skills drift, a dir name differs from its `name:` (un-invokable), or a skill
 * lacks `metadata: internal: true`, which keeps `npx skills add` from installing all 12 into apps.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const CLAUDE = ".claude/skills";
const CODEX = ".codex/skills";

const problems = [];

function skillDirs(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function frontmatterName(file) {
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const name = match[1].match(/^name:\s*(.+)$/m);
  return name ? name[1].trim() : null;
}

function isInternal(file) {
  const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!match) return false;
  const lines = match[1].split("\n");
  const at = lines.findIndex((line) => /^metadata:\s*$/.test(line));
  if (at === -1) return false;
  for (const line of lines.slice(at + 1)) {
    if (!/^\s/.test(line)) break;
    if (/^\s+internal:\s*true\s*$/.test(line)) return true;
  }
  return false;
}

const claudeSkills = skillDirs(CLAUDE);
const codexSkills = skillDirs(CODEX);

for (const name of claudeSkills) {
  if (!codexSkills.includes(name)) problems.push(`${name}: present in ${CLAUDE} but missing from ${CODEX}`);
}
for (const name of codexSkills) {
  if (!claudeSkills.includes(name)) problems.push(`${name}: present in ${CODEX} but missing from ${CLAUDE}`);
}

for (const name of claudeSkills.filter((n) => codexSkills.includes(n))) {
  const a = join(CLAUDE, name, "SKILL.md");
  const b = join(CODEX, name, "SKILL.md");

  if (!existsSync(a) || !existsSync(b)) {
    problems.push(`${name}: missing SKILL.md in ${existsSync(a) ? CODEX : CLAUDE}`);
    continue;
  }

  if (readFileSync(a, "utf8") !== readFileSync(b, "utf8")) {
    problems.push(`${name}: SKILL.md differs between ${CLAUDE} and ${CODEX}`);
  }

  const declared = frontmatterName(a);
  if (declared === null) problems.push(`${name}: SKILL.md has no \`name:\` in its frontmatter`);
  else if (declared !== name)
    problems.push(`${name}: frontmatter name is "${declared}" but the directory is "${name}"`);

  if (!isInternal(a)) {
    problems.push(
      `${name}: SKILL.md frontmatter is missing \`metadata: internal: true\` - without it \`npx skills add\` installs this contributor skill into apps that use @fujiui/react`,
    );
  }

  const manifest = join(CODEX, name, "agents", "openai.yaml");
  if (!existsSync(manifest)) problems.push(`${name}: missing ${manifest}`);
}

if (problems.length > 0) {
  console.error("Skill sync check failed:\n");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(`\nKeep ${CLAUDE} and ${CODEX} byte-identical.`);
  process.exit(1);
}

console.log(`Skill sync OK - ${claudeSkills.length} skill(s) consistent across ${CLAUDE} and ${CODEX}.`);
