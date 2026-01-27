# claude-recall

<img width="1376" height="768" alt="claude-recall banner" src="https://github.com/user-attachments/assets/23bb84ed-8a6d-4933-ae8d-d8381090af6a" />

```
   _____ _                 _                                _ _ 
  / ____| |               | |                              | | |
 | |    | | __ _ _   _  __| | ___   _ __ ___  ___ __ _ | | |
 | |    | |/ _` | | | |/ _` |/ _ \ | '__/ _ \/ __/ _` | | |
 | |____| | (_| | |_| | (_| |  __/ | | |  __/ (_| (_| | | |
  \_____|_|\__,_|\__,_|\__,_|\___| |_|  \___|\___\__,_|_|_|
                                                           
        ╔═══════════════════════════════════════════════╗
        ║   Persistent Memory for Claude Code Sessions  ║
        ╚═══════════════════════════════════════════════╝
```

> **Give your AI assistant a memory that persists across sessions.**

---

## ⚡ Quick Install

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1    /plugin marketplace add nhevers/claude-recall    │
│  Step 2    /plugin install claude-recall                    │
└─────────────────────────────────────────────────────────────┘
```

That's it. claude-recall starts working automatically.

---

## 🧠 What It Does

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   SESSION 1                    SESSION 2                             │
│   ─────────                    ─────────                             │
│   You: "Set up auth"           You: "Add password reset"             │
│                                                                      │
│   Claude works...              Claude already knows:                 │
│   ├─ Discovers OAuth2          ├─ You use OAuth2                     │
│   ├─ Implements JWT            ├─ JWT tokens, 1hr expiry             │
│   └─ Configures bcrypt         └─ bcrypt with cost 12                │
│                                                                      │
│         │                              ▲                             │
│         ▼                              │                             │
│   ┌───────────┐                  ┌───────────┐                       │
│   │  CAPTURE  │ ───────────────► │  INJECT   │                       │
│   └───────────┘                  └───────────┘                       │
│         │                              ▲                             │
│         └──────────► MEMORY ───────────┘                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

```
╭─────────────────────────────────────────────────────────────────────╮
│                                                                     │
│  🔍 OBSERVATIONS      Automatically captures discoveries,          │
│                       decisions, and implementations                │
│                                                                     │
│  🔎 SEMANTIC SEARCH   Find relevant context with MCP tools          │
│                                                                     │
│  🌐 WEB VIEWER        Browse your memory at localhost:37777         │
│                                                                     │
│  📊 ANALYTICS         Track tokens, sessions, and concepts          │
│                                                                     │
│  🏷️  TAGS & FILTERS    Organize with custom tags and filters        │
│                                                                     │
│  ⭐ FAVORITES          Bookmark important observations              │
│                                                                     │
│  📤 EXPORT            JSON, CSV, or Markdown exports                │
│                                                                     │
│  🎨 THEMES            Dark and light mode support                   │
│                                                                     │
│  ⌨️  SHORTCUTS         Keyboard navigation in viewer                │
│                                                                     │
│  🌍 i18n              English, Spanish, French locales              │
│                                                                     │
╰─────────────────────────────────────────────────────────────────────╯
```

---

## 🔧 How It Works

```
                    ┌─────────────────────────────────────┐
                    │         CLAUDE CODE SESSION         │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │            LIFECYCLE HOOKS          │
                    │   SessionStart │ PostToolUse │ Stop │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
     ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
     │    CAPTURE     │     │    PROCESS     │     │    SUMMARIZE   │
     │  Tool outputs  │     │  Extract obs   │     │  Session end   │
     └───────┬────────┘     └───────┬────────┘     └───────┬────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │         WORKER SERVICE        │
                    │      localhost:37777          │
                    └───────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
     │    SQLite      │   │    ChromaDB    │   │   Web Viewer   │
     │   Database     │   │  Vector Search │   │      UI        │
     └────────────────┘   └────────────────┘   └────────────────┘
```

---

## ⚙️ Configuration

Settings stored in `~/.claude-recall/settings.json`:

```
┌────────────────────────────────────┬─────────┬──────────────────────────┐
│ Setting                            │ Default │ Description              │
├────────────────────────────────────┼─────────┼──────────────────────────┤
│ CLAUDE_RECALL_WORKER_PORT          │ 37777   │ Worker service port      │
│ CLAUDE_RECALL_CONTEXT_OBSERVATIONS │ 50      │ Max observations inject  │
│ CLAUDE_RECALL_PROVIDER             │ claude  │ AI provider for summaries│
│ CLAUDE_RECALL_PRUNE_DAYS           │ 0       │ Auto-prune (0=disabled)  │
│ CLAUDE_RECALL_THEME                │ system  │ UI theme preference      │
│ CLAUDE_RECALL_LOG_LEVEL            │ info    │ Logging verbosity        │
└────────────────────────────────────┴─────────┴──────────────────────────┘
```

---

## 💻 CLI Commands

```bash
claude-recall stats          # Show memory statistics
claude-recall export         # Export to markdown  
claude-recall tag <id> <t>   # Tag an observation
claude-recall prune          # Manual cleanup
claude-recall search <q>     # Search observations
```

---

## 📁 Project Structure

```
claude-recall/
├── benchmarks/        # Performance tests
├── contrib/           # Community modes & themes
├── docs/              # Documentation
├── examples/          # Usage examples
├── extension/         # Plugin runtime
│   ├── profiles/      # Observation modes
│   ├── runtime/       # Worker scripts
│   ├── themes/        # UI themes
│   ├── snippets/      # Code snippets
│   └── templates/     # Summary templates
├── locales/           # i18n translations
├── migrations/        # Database migrations
├── schemas/           # JSON schemas
├── scripts/           # Build & utility scripts
├── src/
│   ├── analytics/     # Token & session tracking
│   ├── cache/         # Query & context caching
│   ├── core/          # Core engine
│   ├── export/        # JSON/CSV/MD exporters
│   ├── favorites/     # Bookmark system
│   ├── filters/       # Date/type/project filters
│   ├── formatters/    # Output formatters
│   ├── shortcuts/     # Keyboard shortcuts
│   ├── themes/        # Theme system
│   └── validators/    # Input validation
├── templates/         # Export templates
├── tests/             # Test suites
└── tools/             # CLI utilities
```

---

## 🔌 API

The worker exposes a REST API at `http://localhost:37777`:

```bash
# Health check
curl http://localhost:37777/health

# Search observations
curl "http://localhost:37777/api/search?q=authentication"

# Get timeline
curl "http://localhost:37777/api/timeline?project=my-app&days=7"

# Export data
curl "http://localhost:37777/api/export?format=json" > backup.json
```

---

## 📋 Requirements

```
┌────────────────────────────────────┐
│  Node.js 18+  or  Bun 1.0+        │
│  Claude Code                       │
└────────────────────────────────────┘
```

---

## 📄 License

AGPL-3.0

---

<p align="center">
  <sub>Built with ❤️ for the Claude Code community</sub>
</p>
