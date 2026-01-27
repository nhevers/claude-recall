<p align="center">
  <img width="1376" height="768" alt="claude-recall banner" src="https://github.com/user-attachments/assets/23bb84ed-8a6d-4933-ae8d-d8381090af6a" />
</p>

<p align="center">

</p>

<p align="center">
  <strong>Long-term memory layer for Claude Code that learns and recalls your project context automatically.</strong>
</p>

<p align="center">
  <a href="#-quick-install">Install</a> •
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-clawd-integration">Clawd</a> •
  <a href="#%EF%B8%8F-configuration">Config</a> •
  <a href="#-api">API</a>
</p>

---

<br>

## ⚡ Quick Install

<p align="center">

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   Step 1    /plugin marketplace add nhevers/claude-recall            ║
║   Step 2    /plugin install claude-recall                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

</p>

<p align="center"><em>That's it. claude-recall starts working automatically.</em></p>

---

<br>

## 🧠 What It Does

```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│     ┌─────────────────┐                      ┌─────────────────┐             │
│     │   SESSION #1    │                      │   SESSION #47   │             │
│     │─────────────────│                      │─────────────────│             │
│     │                 │                      │                 │             │
│     │  "Set up auth   │                      │  "Add password  │             │
│     │   with OAuth"   │                      │   reset flow"   │             │
│     │                 │                      │                 │             │
│     └────────┬────────┘                      └────────┬────────┘             │
│              │                                        │                      │
│              │  Claude discovers:                     │  Claude remembers:   │
│              │  • OAuth2 + PKCE flow                  │  • Your auth setup   │
│              │  • JWT with 1hr expiry                 │  • Token structure   │
│              │  • bcrypt cost factor 12               │  • Security choices  │
│              │                                        │                      │
│              ▼                                        ▲                      │
│     ┌────────────────┐                      ┌────────────────┐               │
│     │    CAPTURE     │ ──────────────────►  │     INJECT     │               │
│     │   & LEARN      │      MEMORY          │    & RECALL    │               │
│     └────────────────┘                      └────────────────┘               │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

<br>

---

## ✨ Features

```
+-------------------------+-------------------------+-------------------------+
|                         |                         |                         |
|   OBSERVATIONS          |   SMART SEARCH          |   WEB VIEWER            |
|   ----------------      |   ----------------      |   ----------------      |
|   Auto-captures         |   Semantic search       |   Browse history        |
|   discoveries,          |   via MCP tools         |   at localhost          |
|   decisions & code      |   finds context         |   :37777                |
|                         |                         |                         |
+-------------------------+-------------------------+-------------------------+
|                         |                         |                         |
|   ANALYTICS             |   TAGS & FILTERS        |   FAVORITES             |
|   ----------------      |   ----------------      |   ----------------      |
|   Track tokens,         |   Organize with         |   Bookmark your         |
|   sessions, and         |   custom tags &         |   most important        |
|   concept trends        |   smart filters         |   observations          |
|                         |                         |                         |
+-------------------------+-------------------------+-------------------------+
|                         |                         |                         |
|   EXPORT                |   THEMES                |   SHORTCUTS             |
|   ----------------      |   ----------------      |   ----------------      |
|   JSON, CSV, or         |   Dark & light          |   Full keyboard         |
|   Markdown with         |   mode with             |   navigation in         |
|   custom templates      |   custom themes         |   the web viewer        |
|                         |                         |                         |
+-------------------------+-------------------------+-------------------------+
```

<br>

---

## 🔧 How It Works

```
                         ╔═══════════════════════════════════╗
                         ║      CLAUDE CODE SESSION          ║
                         ╚═══════════════╤═══════════════════╝
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ╔════════════════╗   ╔════════════════╗   ╔════════════════╗
           ║  SessionStart  ║   ║  PostToolUse   ║   ║     Stop       ║
           ║────────────────║   ║────────────────║   ║────────────────║
           ║ Inject context ║   ║ Capture output ║   ║ Generate       ║
           ║ from memory    ║   ║ extract facts  ║   ║ summary        ║
           ╚═══════╤════════╝   ╚═══════╤════════╝   ╚═══════╤════════╝
                   │                    │                    │
                   └────────────────────┼────────────────────┘
                                        │
                         ╔══════════════╧══════════════╗
                         ║      WORKER SERVICE         ║
                         ║    http://localhost:37777   ║
                         ╚══════════════╤══════════════╝
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
     ╔════════════════╗       ╔════════════════╗       ╔════════════════╗
     ║    SQLite      ║       ║   ChromaDB     ║       ║  Web Viewer    ║
     ║   Database     ║       ║ Vector Search  ║       ║     UI         ║
     ║────────────────║       ║────────────────║       ║────────────────║
     ║ Observations   ║       ║ Semantic       ║       ║ Timeline       ║
     ║ Summaries      ║       ║ similarity     ║       ║ Search         ║
     ║ Sessions       ║       ║ matching       ║       ║ Analytics      ║
     ╚════════════════╝       ╚════════════════╝       ╚════════════════╝
```

<br>

---

## ⚙️ Configuration

Settings stored in `~/.claude-recall/settings.json`:

```
┌──────────────────────────────────────┬─────────┬────────────────────────────┐
│             SETTING                  │ DEFAULT │        DESCRIPTION         │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_WORKER_PORT            │  37777  │ Worker service port        │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_CONTEXT_OBSERVATIONS   │   50    │ Max observations to inject │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_PROVIDER               │ claude  │ AI provider for summaries  │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_PRUNE_DAYS             │    0    │ Auto-prune (0 = disabled)  │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_THEME                  │ system  │ UI theme (dark/light/sys)  │
├──────────────────────────────────────┼─────────┼────────────────────────────┤
│ CLAUDE_RECALL_LOG_LEVEL              │  info   │ Logging verbosity level    │
└──────────────────────────────────────┴─────────┴────────────────────────────┘
```

<br>

---

## 💻 CLI Commands

```bash
claude-recall stats          # Show memory statistics
claude-recall export         # Export to markdown  
claude-recall tag <id> <t>   # Tag an observation
claude-recall prune          # Manual cleanup
claude-recall search <q>     # Search observations
```

<br>

---

## 📁 Project Structure

```
claude-recall/
│
├── 📊 benchmarks/         Performance tests
├── 🎨 contrib/            Community modes & themes
├── 📚 docs/               Documentation
├── 📖 examples/           Usage examples & guides
│
├── 🔌 extension/
│   ├── profiles/          Observation modes
│   ├── runtime/           Worker scripts
│   ├── themes/            UI themes (dark/light)
│   ├── snippets/          Code snippets
│   └── templates/         Summary templates
│
├── 🌍 locales/            i18n (en, es, fr)
├── 🗄️ migrations/         Database migrations
├── 📋 schemas/            JSON validation schemas
├── 🛠️ scripts/            Build & utility scripts
│
├── 💻 src/
│   ├── analytics/         Token & session tracking
│   ├── cache/             Query & context caching
│   ├── core/              Core engine
│   ├── export/            JSON/CSV/MD exporters
│   ├── favorites/         Bookmark system
│   ├── filters/           Date/type/project filters
│   ├── formatters/        Output formatters
│   ├── mcp/               MCP server for Clawd
│   ├── shortcuts/         Keyboard shortcuts
│   ├── themes/            Theme system
│   └── validators/        Input validation
│
├── 🦞 integrations/
│   └── clawd/             Clawd extension & skill
│
├── 📝 templates/          Export templates
├── 🧪 tests/              Test suites
└── 🔧 tools/              CLI utilities
```

<br>

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

# Get statistics
curl "http://localhost:37777/api/stats"
```

<br>

---

## 🦞 Clawd Integration

Works with [Clawd](https://github.com/moltbot/moltbot) (62k+ stars) - the popular personal AI assistant!

```
+-----------------------------------------------------------------------------+
|                                                                             |
|   EXTENSION        Add to Clawd's extensions/ folder                        |
|   ----------       Full lifecycle hooks integration                         |
|                                                                             |
|   SKILL            Install as a Clawd skill                                 |
|   ----------       recall_context, search_memories, save_memory tools       |
|                                                                             |
|   MCP SERVER       Protocol-based integration                               |
|   ----------       Works with any MCP-compatible client                     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

**Quick setup:**

```bash
# As Clawd extension
cd ~/.clawd/extensions
git clone https://github.com/nhevers/claude-recall.git

# Or via MCP
npm run mcp:start
```

See [integrations/clawd/README.md](integrations/clawd/README.md) for full setup guide.

<br>

---

## 📋 Requirements

```
╔══════════════════════════════════════╗
║                                      ║
║   •  Node.js 18+  or  Bun 1.0+      ║
║   •  Claude Code  or  Clawd          ║
║                                      ║
╚══════════════════════════════════════╝
```

<br>

---

## 📄 License

AGPL-3.0

---

<br>

<p align="center">
  <sub>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</sub>
</p>

<p align="center">
  <strong>Built with care for the Claude Code & Clawd community</strong>
</p>

<p align="center">
  <sub>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</sub>
</p>
