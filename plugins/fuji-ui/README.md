# Fuji UI plugin for Claude Code

Build React UI with [Fuji UI](https://fujiui.com/) (`@fujiui/react`) in Claude
Code. The plugin bundles two things:

- **The Fuji MCP server**
  ([`@fujiui/mcp`](https://github.com/fuji-ui-kit/fuji-ui-react/tree/main/mcp#readme)) -
  the component API of the `@fujiui/react` version your project has installed,
  the steps for setting Fuji up in an app, recipes for dark mode and glass
  (`get_appearance`), and `review_usage`, which checks code against the
  package's conventions.
- **The `fuji-ui` skill** - tells Claude when to use those tools, how to add Fuji
  to an existing app, how to get dark mode and glass right, and the rules code
  review enforces.

Installing the plugin gives you both at once: the skill is loaded from the
plugin, and the MCP server starts from its `.mcp.json` (`npx -y @fujiui/mcp`).
There is nothing else to install.

## Install

Inside Claude Code:

```text
/plugin marketplace add fuji-ui-kit/fuji-ui-react
/plugin install fuji-ui@fuji-ui
```

Choose **Project** scope to add it for everyone who works on the repository.

If you added the server on its own before (`claude mcp add fuji ...`), remove
that entry with `claude mcp remove fuji` - otherwise Claude sees the same three
tools twice.

## Requirements

- Node.js 18.18 or later - the server runs through `npx`.
- A project that depends on `@fujiui/react` 0.3.0 or later. Monorepos opened at
  their root work too, including pnpm and Turborepo.

## Other agents

The skill also works in Codex, Cursor, Gemini CLI and other agents that support
[Agent Skills](https://agentskills.io):

```bash
npx skills add fuji-ui-kit/fuji-ui-react
```

That installs only `fuji-ui`; the repository's contributor skills are marked
internal and skipped.

Then add the MCP server for that agent - its
[README](https://github.com/fuji-ui-kit/fuji-ui-react/tree/main/mcp#readme) has
the configuration for Codex, Cursor, Claude Desktop and others.
