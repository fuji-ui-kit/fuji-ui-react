---
"@fujiui/react": patch
---

The README has a new "AI coding agents" section introducing
[`@fujiui/mcp`](https://github.com/fuji-ui-kit/fuji-ui-react/tree/main/mcp#readme),
an MCP server that gives Claude Code, Codex and other agents the API of the
exact `@fujiui/react` version a project has installed - including the steps for
setting Fuji up in an existing app - and checks the code they write against
this package's conventions. A companion `fuji-ui` Agent Skill tells agents when
to use it, and a Claude Code plugin installs both at once
(`/plugin marketplace add fuji-ui-kit/fuji-ui-react`). The server reads the
`dist/registry.json` this release adds, so it needs `@fujiui/react` 0.3.0 or
later.
