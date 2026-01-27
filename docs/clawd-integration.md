# Clawd Integration Guide

This guide covers integrating claude-recall with [Clawd](https://github.com/moltbot/moltbot), the popular personal AI assistant.

## Overview

Claude Recall provides three integration methods for Clawd:

1. **Extension**: Full integration with Clawd's extension system
2. **Skill**: Lightweight tool-based integration
3. **MCP Server**: Protocol-based integration for advanced setups

## Quick Start

### Extension (Recommended)

```bash
# Clone into Clawd extensions
cd ~/.clawd/extensions
git clone https://github.com/nhevers/claude-recall.git

# Build the extension
cd claude-recall/integrations/clawd
npm install && npm run build
```

Add to `~/.clawd/config.json`:

```json
{
  "extensions": {
    "claude-recall": {
      "enabled": true
    }
  }
}
```

Restart Clawd and you're done!

## How It Works

### Memory Flow

```
User Message → Clawd → claude-recall hooks
                           ↓
                    Search relevant memories
                           ↓
                    Inject into context
                           ↓
                    Generate response
                           ↓
                    Extract observations
                           ↓
                    Save to memory store
```

### Automatic Capture

Claude Recall automatically captures:

| Type | Trigger | Example |
|------|---------|---------|
| Preference | "I prefer...", "I like..." | "I prefer tabs over spaces" |
| Decision | "Let's...", "We should..." | "Let's use PostgreSQL" |
| Learning | Technical explanations | "The API uses OAuth2" |
| Context | Project-specific info | File paths, configs |

### Context Injection

Before each response, claude-recall searches for relevant memories and injects them:

```xml
<recalled_context>
- [preference] User prefers TypeScript over JavaScript
- [decision] Using PostgreSQL for the database
- [learning] The auth module uses JWT tokens
</recalled_context>
```

## Configuration

### Extension Config

```json
{
  "extensions": {
    "claude-recall": {
      "enabled": true,
      "dataDir": ".claude-recall",
      "maxMemories": 10,
      "autoCapture": true,
      "channels": []
    }
  }
}
```

### Skill Config

```json
{
  "skills": {
    "claude-recall": {
      "maxMemories": 10,
      "channels": ["discord", "slack"]
    }
  }
}
```

### MCP Config

```json
{
  "mcp": {
    "servers": {
      "claude-recall": {
        "command": "node",
        "args": ["~/.clawd/extensions/claude-recall/src/mcp/server.js", "--stdio"]
      }
    }
  }
}
```

## Channel-Specific Setup

### Discord

No additional setup needed. Memories are captured from all Discord interactions.

### Slack

No additional setup needed. Works with both DMs and channels.

### iMessage

Memories are stored per-conversation. Group chats are supported.

### Microsoft Teams

Works with both personal and team channels.

## Advanced Usage

### Manual Memory Management

Use the skill tools to manually manage memories:

```
# Save important info
save_memory("The production server is at api.example.com", type="context")

# Search memories
search_memories("server configuration")

# Get relevant context
recall_context("deploying to production")
```

### Filtering by Channel

Limit memory capture to specific channels:

```json
{
  "channels": ["discord", "slack"]
}
```

### Memory Types

| Type | Use Case |
|------|----------|
| `preference` | User preferences and settings |
| `decision` | Architectural and design decisions |
| `learning` | Technical knowledge and insights |
| `context` | Project-specific information |

## Troubleshooting

### Memories Not Being Captured

1. Check `autoCapture` is `true`
2. Verify the channel is enabled
3. Check logs for errors

### Context Not Being Injected

1. Verify memories exist: `search_memories("*")`
2. Check `maxMemories` setting
3. Ensure extension is loaded

### MCP Connection Issues

1. Verify server is running: `npm run mcp:status`
2. Check port availability (default: 3847)
3. Review MCP logs

## Performance

- Memory search: ~10ms average
- Context injection: ~5ms overhead
- Storage: ~1KB per memory entry

## Security

- All data stored locally
- No external API calls
- Memories are per-installation
