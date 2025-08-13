const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("Import Hover Preview extension is now active!");

  // Register the command that opens a file
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

  // Register the hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    ["javascript", "typescript"],
    {
      provideHover(document, position) {
        // Get the word at the hover position
        const range = document.getWordRangeAtPosition(
          position,
          /(['"`])(.*?)\1/
        );
        if (!range) return;

        const text = document.getText(range);
        const match = text.match(/['"`](.*?)['"`]/);
        if (!match) return;

        const importPath = match[1];

        // Resolve relative paths
        const fileDir = path.dirname(document.fileName);
        const fullPath = path.resolve(fileDir, importPath);

        if (!fs.existsSync(fullPath)) return;

        // Configurable preview lines
        const config = vscode.workspace.getConfiguration("importHoverPreview");
        const previewLines = config.get("previewLines", 10);

        const content = fs
          .readFileSync(fullPath, "utf8")
          .split("\n")
          .slice(0, previewLines)
          .join("\n");

        // Dynamic syntax highlighting
        const ext = path.extname(fullPath).toLowerCase();
        let lang = "plaintext";
        if (ext === ".js" || ext === ".jsx") lang = "javascript";
        else if (ext === ".ts" || ext === ".tsx") lang = "typescript";
        else if (ext === ".py") lang = "python";

        // Hover content with clickable link
        const markdown = new vscode.MarkdownString(
          `\`\`\`${lang}\n${content}\n\`\`\`\n\n[Open full file](command:importHoverPreview.openFile?${encodeURIComponent(
            JSON.stringify(fullPath)
          )})`
        );
        markdown.isTrusted = true; // Allow command links

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
