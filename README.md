# Open on GitHub Web (VS Code Extension)

## What it does

- Adds a command, context menus, and an editor title button to open the current file on GitHub for the active branch.
- Supports both HTTPS and SSH remotes (including GitHub Enterprise hosts).
- Preserves the current text selection by appending GitHub line anchors (e.g., #L10-L20).

## Usage

- Editor: Click the GitHub button in the editor title bar, right-click in the editor and choose "Open on GitHub", or press Cmd+Alt+G (macOS) / Ctrl+Alt+G (Windows/Linux).
- Explorer: Right-click a file and choose "Open on GitHub".

## Notes

- Prefers the `origin` remote; falls back to the first remote if `origin` is missing.
- If the branch name is unavailable (detached HEAD), it uses the current commit SHA.
- Works with GitHub Enterprise by using the remote host detected from your repo URL.

## Install (local)

1. Open this folder in VS Code.
2. Press F5 to launch an Extension Development Host and try the command/menus.

## Install (VSIX)

- Build locally: `cd open-on-github && npx @vscode/vsce package` (outputs a `.vsix` named like `open-on-github-web-0.1.2.vsix`).
- Install: `code --install-extension open-on-github-web-*.vsix` or via Extensions view → … → Install from VSIX.

## GitHub Release (CI)

- Push a tag like `v0.1.0` to the repo. GitHub Actions will build `open-on-github-web.vsix` and attach it to the release.
- Team can download the VSIX from the release and install it.

## Marketplace (optional)

- Create a VS Code publisher, set `publisher` in `package.json`, then run `npx vsce publish` (requires a Marketplace PAT). See https://code.visualstudio.com/api/working-with-extensions/publishing-extension.

## CI auto-publish

- Set repo secret `VSCE_PAT` with a VS Code Marketplace Personal Access Token (scope: Marketplace > Manage).
- Optional: Set `OVSX_TOKEN` to also publish to Open VSX for VSCodium users.
- Tag a release like `v0.1.0` or use "Run workflow" on the "Publish to Marketplaces" action.
- The workflow publishes from `open-on-github/package.json` using its `publisher` and `version`.

## Create a publisher

- VS Code Marketplace: https://marketplace.visualstudio.com/manage → Create Publisher (ID should match `publisher` in `package.json`, e.g., `elropero`).
- Generate PAT: https://dev.azure.com → User settings → Personal Access Tokens → New Token → Scopes: Marketplace (Acquire, Publish), Packaging (Read).
