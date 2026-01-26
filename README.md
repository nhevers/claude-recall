# claude-recall

Persistent memory plugin for Claude Code. Captures session context and injects relevant history into future sessions.

<img width="1376" height="768" alt="Untitled design (28)" src="https://github.com/user-attachments/assets/23bb84ed-8a6d-4933-ae8d-d8381090af6a" />

## Install

```bash
Step 1	/plugin marketplace add nhevers/claude-recall
Step 2	/plugin install claude-recall
```

## How It Works

1. **Capture**: Hooks into Claude Code lifecycle events (SessionStart, PostToolUse, Stop)
2. **Process**: Worker service extracts observations from tool outputs
3. **Store**: SQLite database with optional Chroma vector search
4. **Inject**: Relevant context injected at session start via CLAUDE.md

## Features

- Automatic observation capture from tool outputs
- Semantic search via MCP tools
- Multi-provider support (Claude, Gemini, OpenRouter)
- Web viewer UI for browsing history
- Memory tagging and filtering
- Export to markdown
- Auto-pruning of old memories

## Configuration

Settings stored in `~/.claude-recall/settings.json`:

| Setting | Default | Description |
|---------|---------|-------------|
| CLAUDE_RECALL_WORKER_PORT | 37777 | Worker service port |
| CLAUDE_RECALL_CONTEXT_OBSERVATIONS | 50 | Max observations to inject |
| CLAUDE_RECALL_PROVIDER | claude | AI provider for summaries |
| CLAUDE_RECALL_PRUNE_DAYS | 0 | Auto-prune after N days (0=disabled) |

## CLI Commands

```bash
claude-recall stats          # Show memory statistics
claude-recall export         # Export to markdown
claude-recall tag <id> <t>   # Tag an observation
claude-recall prune          # Manual cleanup
```

## Requirements

- Node.js 18+ or Bun 1.0+
- Claude Code

## License

AGPL-3.0
