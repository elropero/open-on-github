/*
  Open on GitHub - VS Code extension (no build step, plain JS)
  - Adds a command and context menu/button to open the current file on GitHub
  - Uses the built-in Git extension API to resolve repo, branch, and remote
*/

const vscode = require('vscode');
const path = require('path');

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const disposable = vscode.commands.registerCommand('openOnGithub.openFile', async (uri) => {
    try {
      const targetUri = uri || vscode.window.activeTextEditor?.document?.uri;
      if (!targetUri) {
        vscode.window.showWarningMessage('No file selected or active.');
        return;
      }

      // Load Git extension API
      const gitExt = vscode.extensions.getExtension('vscode.git');
      if (!gitExt) {
        vscode.window.showErrorMessage('VS Code Git extension not found.');
        return;
      }
      const git = gitExt.isActive ? gitExt.exports.getAPI(1) : (await gitExt.activate(), gitExt.exports.getAPI(1));

      // Resolve repository for the file
      let repo = git.getRepository(targetUri);
      if (!repo && git.repositories.length === 1) {
        repo = git.repositories[0];
      }
      if (!repo) {
        vscode.window.showErrorMessage('No Git repository found for this file.');
        return;
      }

      // Determine remote (prefer origin)
      const remotes = repo.state.remotes || [];
      const remote = remotes.find(r => r.name === 'origin') || remotes[0];
      if (!remote || !remote.fetchUrl) {
        vscode.window.showErrorMessage('No Git remote URL found (e.g., origin).');
        return;
      }

      const parsed = parseRemote(remote.fetchUrl);
      if (!parsed) {
        vscode.window.showErrorMessage('Unsupported or unrecognized remote URL: ' + remote.fetchUrl);
        return;
      }

      const head = repo.state.HEAD;
      const ref = head?.name || head?.commit; // prefer branch name; fallback to commit SHA
      if (!ref) {
        vscode.window.showErrorMessage('Could not determine current branch or commit.');
        return;
      }

      const repoRoot = repo.rootUri.fsPath;
      const relFsPath = path.relative(repoRoot, targetUri.fsPath);
      if (!relFsPath || relFsPath.startsWith('..')) {
        vscode.window.showErrorMessage('File is not inside the repository root.');
        return;
      }

      const relUrlPath = toPosixAndEncode(relFsPath);
      const encodedRef = encodeURIComponent(ref);
      const base = `https://${parsed.host}/${parsed.owner}/${parsed.repo}`;
      let url = `${base}/blob/${encodedRef}/${relUrlPath}`;

      // Append selection fragment if applicable (editor context)
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.uri.toString() === targetUri.toString()) {
        const sel = editor.selection;
        if (!sel.isEmpty) {
          const start = sel.start.line + 1;
          const end = sel.end.line + 1;
          url += start === end ? `#L${start}` : `#L${start}-L${end}`;
        }
      }

      await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (err) {
      console.error(err);
      vscode.window.showErrorMessage('Failed to open on GitHub. See console for details.');
    }
  });

  context.subscriptions.push(disposable);
}

/** @param {string} remoteUrl */
function parseRemote(remoteUrl) {
  // Normalize and parse common Git remote URL formats
  // Supported:
  // - https://github.com/owner/repo(.git)
  // - http://github.com/owner/repo(.git)
  // - git@github.com:owner/repo(.git)
  // - ssh://git@github.example.com/owner/repo(.git)

  try {
    // SSH scp-like syntax: git@host:owner/repo(.git)
    const scpLike = /^(?:[^@]+)@([^:]+):([^/]+)\/(.+)$/;
    const m1 = remoteUrl.match(scpLike);
    if (m1) {
      const host = m1[1];
      const owner = m1[2];
      const repo = stripGit(m1[3]);
      return { host, owner, repo };
    }

    // ssh://git@host/owner/repo(.git) or https?://host/owner/repo(.git)
    const url = new URL(remoteUrl.replace(/^git\+/, ''));
    const host = url.hostname;
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = stripGit(parts[1]);
      return { host, owner, repo };
    }
  } catch (_) { /* fallthrough */ }
  return null;
}

function stripGit(name) {
  return name.endsWith('.git') ? name.slice(0, -4) : name;
}

function toPosixAndEncode(p) {
  const posix = p.split(path.sep).join('/');
  // Encode each segment but keep slashes
  return posix.split('/').map(encodeURIComponent).join('/');
}

function deactivate() {}

module.exports = { activate, deactivate };
