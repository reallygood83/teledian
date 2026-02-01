# Telegram Sidebar for Obsidian

Embed **Telegram Web** directly in your Obsidian sidebar. Chat with bots, contacts, groups, and channels without leaving your vault.

![Desktop Only](https://img.shields.io/badge/platform-desktop%20only-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Sidebar Telegram Web** — Full Telegram Web client in your Obsidian sidebar
- **Persistent Login** — Log in once, stay logged in across restarts
- **Direct Chat Navigation** — Configure a default bot/user/channel to open automatically
- **Configurable** — Choose Web version (K/A), panel side (left/right), auto-open on startup
- **Command Palette** — Open, reload, and navigate via commands

## Use Cases

- Chat with **AI bots** (OpenClaw, ChatGPT bots, etc.) while taking notes
- Monitor **Telegram channels** alongside your knowledge base
- Quick replies without switching windows

## Installation (BRAT)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Community Plugins
2. Open BRAT Settings → **Add Beta Plugin**
3. Enter: `https://github.com/reallygood83/teledian`
4. Enable the plugin in Settings → Community Plugins

## Usage

1. Click the **paper plane icon** (✈) in the left ribbon, or use Command Palette → **Open Telegram Sidebar**
2. Log in to Telegram Web (first time only)
3. Start chatting!

### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Telegram Username** | Bot/user/channel to open on launch (without @) | Empty (main screen) |
| **Web Version** | K (lightweight) or A (modern React UI) | K |
| **Panel Side** | Left or Right sidebar | Right |
| **Auto Open** | Open sidebar automatically on startup | Off |

### Commands

| Command | Action |
|---------|--------|
| **Open Telegram Sidebar** | Toggle the sidebar panel |
| **Reload Telegram** | Refresh the webview |
| **Go to Chat** | Navigate to the configured username |

## Requirements

- **Obsidian Desktop** (Windows, macOS, Linux)
- Not compatible with Obsidian Mobile (uses Electron webview)

## Development

```bash
git clone https://github.com/reallygood83/teledian.git
cd obsidian-telegram-sidebar
npm install
npm run dev     # watch mode
npm run build   # production build
```

Copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/obsidian-telegram-sidebar/` folder.

## License

MIT
