# @fujiui/mcp

## 0.1.0

First public release.

- Three tools - `list_components`, `get_component` and `review_usage` - answered
  from the `registry.json` of the `@fujiui/react` version the project has
  installed. Requires `@fujiui/react` 0.3.0 or later.
- Finds the project from `--project`, then `CLAUDE_PROJECT_DIR` (so Claude
  Code's user scope works), then the working directory. `--registry` reads an
  exact file instead.
- Starts even when no registry can be found and answers every tool call with
  the reason - including the installed `@fujiui/react` version when it predates
  `registry.json`, and how to upgrade.
- Sends usage instructions to the client when it connects.
- `review_usage` findings point at the public repository where the rules they
  cite are written down.
- Listed in the MCP Registry as `io.github.fuji-ui-kit/fuji-ui`.
- Finds `@fujiui/react` in a monorepo opened at its root - pnpm, Turborepo, npm
  and Yarn workspaces - and asks which package to answer for rather than
  guessing when the workspace uses more than one version. Explains a Yarn
  Plug'n'Play install instead of reporting nothing found.
- `get_component` for `FujiProvider` includes the steps for setting Fuji up in an
  app.
- Every tool declares `readOnlyHint`.
- Ships with a Claude Code plugin and an Agent Skill, both in `plugins/fuji-ui/`.
