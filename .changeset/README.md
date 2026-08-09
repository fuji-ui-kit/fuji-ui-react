# Changesets

This directory manages release notes and versioning via
[Changesets](https://github.com/changesets/changesets).

Run `npm run changeset` after making a user-facing change to record what
changed. `npm run version` applies pending changesets to `package.json` and
`CHANGELOG.md`. CI publishes on merge to `main` once the version bump lands.
