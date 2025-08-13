# VS Code Import Hover Preview

A VS Code extension that lets you **hover over an import path** to instantly preview the file’s contents — with syntax highlighting, configurable preview lines, and a click-to-open option.

---

## ✨ Features

- **Hover Preview on Import Path** — Instantly see the contents of imported files.
- **Syntax Highlighting** — Readable previews with keyword coloring.
- **Configurable Preview Lines** — Show 5, 10, 20+ lines, your choice.
- **Click to Open File** — Open the file in a new tab directly from the tooltip.

---

## 🚀 Installation

1. Download from the [VS Code Marketplace](#) _(coming soon)_.
2. Or clone and install locally:

```bash
git clone https://github.com/0xDaniiel/vscode-import-hover-preview.git
cd vscode-import-hover-preview
npm install
```

## 📖 Usage

1. Hover over any import path (e.g., `import x from './file.js'`).
2. A tooltip will appear with the file’s preview.
3. Click inside the tooltip to open the file fully.

---

## 🛠 Configuration

- `importHoverPreview.previewLines` — Number of lines to show _(default: 10)_.

---

## 🗺 Roadmap

- Preview on hover anywhere in code (not just imports).
- Jump to specific lines from `./file.js:45`.
- Diff preview for unsaved changes.
- Multi-language support.

## 📜 License

[MIT](LICENSE)
