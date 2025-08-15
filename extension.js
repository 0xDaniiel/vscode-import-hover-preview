const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const SUPPORTED_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".py"];

// --- Read path aliases from tsconfig/jsconfig ---
function getPathAliases() {
  const aliases = {};

  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return aliases;

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const configFiles = ["tsconfig.json", "jsconfig.json"];

  for (const configFile of configFiles) {
    const configPath = path.join(workspaceRoot, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (config.compilerOptions && config.compilerOptions.paths) {
          for (const [alias, targetArr] of Object.entries(
            config.compilerOptions.paths
          )) {
            const cleanAlias = alias.replace(/\*$/, "");
            const targetPath = targetArr[0].replace(/\*$/, "");
            aliases[cleanAlias] = path.resolve(workspaceRoot, targetPath);
          }
        }
      } catch (err) {
        console.error("Error reading config file:", err);
      }
    }
  }

  // Default fallbacks for Next.js style aliases
  if (!aliases["@"]) {
    aliases["@"] = path.join(workspaceRoot, "src");
  }
  if (!aliases["~"]) {
    aliases["~"] = path.join(workspaceRoot, "src");
  }

  return aliases;
}

const PATH_ALIASES = getPathAliases();

// --- Try to resolve file path, adding extensions or index files ---
function resolveImportPath(basePath) {
  // Exact file
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  // Add extensions
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (fs.existsSync(basePath + ext)) {
      return basePath + ext;
    }
  }

  // index files
  if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const indexPath = path.join(basePath, "index" + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }
  }

  return null;
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Import Hover Preview extension is now active!");

  const openFileCommand = vscode.commands.registerCommand(
    "importHoverPreview.openFile",
    (filePath) => {
      if (fs.existsSync(filePath)) {
        vscode.window.showTextDocument(vscode.Uri.file(filePath));
      } else {
        vscode.window.showErrorMessage(`File not found: ${filePath}`);
      }
    }
  );
  context.subscriptions.push(openFileCommand);

  const hoverProvider = vscode.languages.registerHoverProvider(
    ["javascript", "typescript", "python"],
    {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(
          position,
          /(['"`])(.*?)\1|require\((['"`])(.*?)\3\)/
        );
        if (!range) return;

        const text = document.getText(range);
        const match =
          text.match(/['"`](.*?)['"`]/) ||
          text.match(/require\(['"`](.*?)['"`]\)/);

        if (!match) return;

        let importPath = match[1] || match[2];

        // Resolve alias imports like @/ or ~/
        for (const [alias, targetPath] of Object.entries(PATH_ALIASES)) {
          if (importPath.startsWith(alias + "/") || importPath === alias) {
            importPath = path.join(
              targetPath,
              importPath.slice(alias.length + 1)
            );
            break;
          }
        }

        // Resolve relative imports
        const fileDir = path.dirname(document.fileName);
        let fullPath = importPath.startsWith(".")
          ? resolveImportPath(path.resolve(fileDir, importPath))
          : resolveImportPath(importPath);

        if (!fullPath) return;

        const config = vscode.workspace.getConfiguration("importHoverPreview");
        const previewLines = config.get("previewLines", 25);

        const content = fs
          .readFileSync(fullPath, "utf8")
          .split("\n")
          .slice(0, previewLines)
          .join("\n");

        const ext = path.extname(fullPath).toLowerCase();
        let lang = "plaintext";
        if (ext === ".js" || ext === ".jsx") lang = "javascript";
        else if (ext === ".ts" || ext === ".tsx") lang = "typescript";
        else if (ext === ".py") lang = "python";

        const markdown = new vscode.MarkdownString(
          `\`\`\`${lang}\n${content}\n\`\`\`\n\n[Open full file](command:importHoverPreview.openFile?${encodeURIComponent(
            JSON.stringify(fullPath)
          )})`
        );
        markdown.isTrusted = true;

        return new vscode.Hover(markdown);
      },
    }
  );

  context.subscriptions.push(hoverProvider);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
