# @fujiui/mcp

An [MCP](https://modelcontextprotocol.io) server for
[`@fujiui/react`](https://www.npmjs.com/package/@fujiui/react). It gives a
coding agent - Claude Code, Codex, Claude Desktop, Cursor or any other MCP
client - an accurate view of the **exact `@fujiui/react` version your project
has installed**, and checks the code the agent writes against the conventions
the package locks down.

## Requirements

- Node.js 18.18 or later.
- A project that depends on `@fujiui/react` **0.3.0 or later** - the first
  release that ships the `registry.json` this server reads. Monorepos opened at
  their root work too, including pnpm and Turborepo.

## Install

It is also listed in the [MCP Registry](https://registry.modelcontextprotocol.io)
as `io.github.fuji-ui-kit/fuji-ui`, for clients that install servers from there.

### Claude Code

**Recommended: the Fuji UI plugin.** It installs this server together with the
`fuji-ui` skill, which tells Claude when to use it. Inside Claude Code:

```text
/plugin marketplace add fuji-ui-kit/fuji-ui-react
/plugin install fuji-ui@fuji-ui
```

**Or the server on its own.** Run this inside your project:

```bash
claude mcp add fuji -- npx -y @fujiui/mcp
```

That adds it for you, in that project. The other two scopes work too:

- `--scope project` writes a `.mcp.json` you can commit, so your whole team gets
  it. Claude Code asks each person to approve it once.
- `--scope user` adds it to every project you open. Claude Code starts those
  servers outside the project but tells them where the project is, so this
  works - and in a project that does not use Fuji, the tools say so rather than
  the server failing.

```bash
claude mcp add --scope project fuji -- npx -y @fujiui/mcp
```

Check the connection with `/mcp` inside Claude Code. Use the plugin or the
server on its own, not both - with both, Claude sees every tool twice.

### Codex

```bash
codex mcp add fuji -- npx -y @fujiui/mcp
```

Or in `~/.codex/config.toml` - or `.codex/config.toml` in a trusted project:

```toml
[mcp_servers.fuji]
command = "npx"
args = ["-y", "@fujiui/mcp"]
# The first start downloads the server, which can outlast the 10-second default.
startup_timeout_sec = 30
```

Check it with `codex mcp list`, or `/mcp` in the Codex TUI. Codex does not
document which directory it starts servers in; if the tools report that they
cannot find `@fujiui/react`, add `"--project", "/absolute/path/to/your/app"` to
`args`. Add [the skill](#getting-agents-to-use-it) as well.

### Claude Desktop, Cursor and other clients

Most clients take this JSON shape. Claude Desktop reads it from
`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS and
`%APPDATA%\Claude\claude_desktop_config.json` on Windows. A chat app has no
project folder, so name yours:

```json
{
  "mcpServers": {
    "fuji": {
      "command": "npx",
      "args": ["-y", "@fujiui/mcp", "--project", "/absolute/path/to/your/app"]
    }
  }
}
```

## Tools

| Tool                                 | Answers                                                           |
| ------------------------------------ | ----------------------------------------------------------------- |
| `list_components(category?, query?)` | What exists                                                       |
| `get_component(name)`                | How to use one - props, allowed values, defaults, parts, examples |
| `review_usage(code)`                 | Whether what you wrote is correct                                 |

`get_component` for `FujiProvider` also returns the steps for setting Fuji up in
an app: the stylesheet import, and where the provider goes in Next.js and Vite.

`review_usage` is the one that raises output quality. A documentation dump is a
commodity; checking against contracts an agent gets wrong in predictable ways is
not. It catches subpath imports, per-component `theme`/`material`/`radius`/
`elevation` props, the removed `glassTint` prop, string icon names, runtime-built
Tailwind class names, icon-only controls with no accessible name, dot-access
sub-parts inside a Server Component, invalid prop values, and imports of
components the package does not export. Every finding names the rule it breaks
and where that rule is written down.

It checks conventions, not types - keep running `tsc`. All three tools are
read-only.

## Getting agents to use it

When it connects, the server tells the client how it is meant to be used: look
a component up with `get_component` before using it, and run `review_usage` on
anything written against the library. Claude Code passes that on to the model.

For other agents - and to make it dependable in Claude Code without the plugin -
install the **`fuji-ui` skill**. It covers when to call each tool, how to add
Fuji to an existing app, and the rules `review_usage` enforces, and it works in
Codex, Cursor, Gemini CLI and other agents that support
[Agent Skills](https://agentskills.io):

```bash
npx skills add fuji-ui-kit/fuji-ui-react
```

That installs only `fuji-ui`. The repository's other skills are for working on
Fuji itself; they are marked internal, so the CLI skips them.

To make it a project rule instead, add this to `CLAUDE.md` or `AGENTS.md`:

```md
## Fuji UI

This project uses @fujiui/react, and the `fuji` MCP server is connected.

- Before using a Fuji component you haven't used yet in this session, call
  `get_component` for it. Never guess props or allowed values.
- To find a component, call `list_components` with a `query` or `category`.
- After writing or editing a file that imports @fujiui/react, call
  `review_usage` on it and fix every finding before you finish.
```

Prompts that work well:

- "Add Fuji UI to this app and build a settings page in a Card with name and
  email Inputs and a notifications Switch."
- "Which Fuji component should I use to pick several tags?"
- "Run review_usage over src/app/checkout and fix what it finds."

## How it finds your project

In order, stopping at the first `@fujiui/react` install it finds:

1. `--registry <file>` - exactly that `registry.json`.
2. `--project <dir>` - that project, and never a different one.
3. `CLAUDE_PROJECT_DIR`, which Claude Code sets for every scope and for plugins.
4. The directory the client started it in.
5. Where the server itself is installed, for a project that has it as a
   devDependency.

When the directory in 2-4 is a monorepo root with nothing installed there -
always the case under pnpm, and under npm or Yarn when the package was not
hoisted - it looks in the workspace packages that depend on `@fujiui/react`,
read from `package.json` `workspaces` or `pnpm-workspace.yaml`. If those packages
use different versions, it asks you to choose rather than guess.

If the install it finds predates `registry.json`, it reports that version and
how to upgrade instead of searching on - answers from a different version would
describe props your code does not have.

The server always starts. Without a registry, every tool answers with the
reason, so your agent can tell you what to fix instead of the server just
showing as failed. It looks again on the next call, so installing
`@fujiui/react`, or upgrading it from a release that predates `registry.json`,
takes effect without a restart. Once it has read a registry it keeps it: after
upgrading `@fujiui/react` mid-session, start a new session so the answers match
the new version.

## Troubleshooting

| The tools say                                  | Fix                                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Could not find @fujiui/react`                 | Install it in the project, or pass `--project <path>`.                                                                                            |
| `... predates registry.json`                   | Run `npm install @fujiui/react@latest` in the project.                                                                                            |
| `... uses more than one @fujiui/react version` | Open the agent in the package you are working in, or pass `--project <path to that package>`.                                                     |
| `... is listed in ... but is not installed`    | Run your package manager's install.                                                                                                               |
| `... uses Yarn Plug'n'Play`                    | Set `nodeLinker: node-modules` in `.yarnrc.yml`, or run `yarn unplug @fujiui/react` and pass `--registry` with the unplugged path.                |
| `Stopped scanning ...`                         | The workspace is too large to search from its root. Open the agent in the package you are working in, or pass `--project <path to that package>`. |
| The server times out on its first start        | `npx` is still downloading it. Raise the client's startup timeout - `startup_timeout_sec` in Codex, `MCP_TIMEOUT` in Claude Code.                 |

## Context cost

A tool result is spent from the caller's context on every turn, so the shapes
here are chosen for that:

| call                                       | tokens   |
| ------------------------------------------ | -------- |
| tool schemas and instructions, per session | ~680     |
| `list_components` (filtered)               | 55-350   |
| `list_components` (everything)             | ~2.3k    |
| `get_component`                            | ~200-950 |
| `get_component` for `FujiProvider`         | ~1.4k    |
| `review_usage` (clean code)                | ~10      |
| `review_usage` (nine violations)           | ~420     |

Listings read the registry's precomputed `index`; returning the full
`components` array instead would cost ~47k tokens to answer the same question.
Responses are rendered as compact markdown rather than JSON, which is roughly a
third the tokens for the same content. The skill costs under 100 tokens until an
agent uses it, and about 1.5k when it does.

## Development

```bash
npm install            # from the repo root
npm run build          # the library - produces dist/registry.json
npm run build:mcp      # tsc -p mcp/tsconfig.json
node mcp/dist/index.js --registry dist/registry.json
```

`node scripts/smoke-mcp.mjs` packs this server, installs the tarball outside the
repository and drives it from each of the places the clients above start it.
`claude plugin validate plugins/fuji-ui --strict` checks the plugin. The registry
is generated by `scripts/build-registry.mjs` in the same repo, so a schema change
and its consumer land in one commit. See `ARCHITECTURE.md`.

## Releasing

This package is published separately from `@fujiui/react`, outside changesets -
see `ARCHITECTURE.md` for why. Bump `version` in `package.json` and in both
places in `server.json` (the smoke test fails if they disagree), add a
`CHANGELOG.md` entry, and push a tag named `mcp-v<version>`.
`.github/workflows/release-mcp.yml` checks the tag matches, runs the gate and the
smoke test, publishes to npm, then publishes `server.json` to the MCP Registry.

The Claude Code plugin in `plugins/fuji-ui/` is not published anywhere - Claude
Code reads it from this repository. It has its own `version`, in
`.claude-plugin/plugin.json`, and installed copies are pinned to it: bump it
whenever the skill or the plugin's server configuration changes.
