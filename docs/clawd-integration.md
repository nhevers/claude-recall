# MoltBot Integration Guide

This guide covers integrating claude-recall with [MoltBot](https://github.com/moltbot/moltbot), the popular personal AI assistant.

## Overview

Claude Recall provides three integration methods for MoltBot:

1. **Extension**: Full integration with MoltBot's extension system
2. **Skill**: Lightweight tool-based integration
3. **MCP Server**: Protocol-based integration for advanced setups

## Quick Start

### Extension (Recommended)

#### For Bundled Installation

If you're using MoltBot from source or have cloned the repository:

```bash
# Clone into MoltBot extensions directory
cd your-moltbot-installation/extensions
git clone https://github.com/nhevers/claude-recall.git claude-recall

# Build the extension
cd claude-recall/integrations/clawd
npm install && npm run build
```

**Important:** Enable the plugin (bundled plugins are disabled by default):

```bash
pnpm moltbot plugins enable claude-recall
```

Add to MoltBot config:

```json
{
  "plugins": {
    "entries": {
      "claude-recall": {
        "enabled": true,
        "config": {
          "dataDir": ".claude-recall",
          "maxMemories": 10,
          "autoCapture": true
        }
      }
    }
  }
}
```

#### For Standalone Installation

```bash
# Clone into user extensions directory
cd ~/.moltbot/extensions
git clone https://github.com/nhevers/claude-recall.git claude-recall

# Build the extension
cd claude-recall/integrations/clawd
npm install && npm run build

# Enable the plugin
pnpm moltbot plugins enable claude-recall
```

Restart MoltBot gateway and you're done!

## How It Works

### Memory Flow

```
User Message → MoltBot → claude-recall hooks
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
  "plugins": {
    "entries": {
      "claude-recall": {
        "enabled": true,
        "config": {
          "dataDir": ".claude-recall",
          "maxMemories": 10,
          "autoCapture": true
        }
      }
    }
  }
}
```

**Note:** The plugin must be explicitly enabled using `pnpm moltbot plugins enable claude-recall` if it's installed as a bundled extension (in MoltBot's `extensions/` directory).

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
        "args": ["~/.moltbot/extensions/claude-recall/src/mcp/server.js", "--stdio"]
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

### Plugin Not Loading

**Problem:** Plugin shows as "disabled" in `pnpm moltbot plugins list`

**Solution:**
1. Enable the plugin: `pnpm moltbot plugins enable claude-recall`
2. Restart the MoltBot gateway
3. Verify in config: `plugins.entries.claude-recall.enabled` should be `true`

### Tools Not Appearing

**Problem:** Tools (`recall_context`, `search_memories`, `save_memory`) don't appear in agent's tool list

**Solution:**
1. Verify plugin is enabled (see above)
2. Rebuild TypeScript: `npm run build` or `pnpm tsc`
3. Restart MoltBot gateway
4. Check logs for registration messages: `[claude-recall] Extension register() called`

### Memories Not Being Captured

1. Check `autoCapture` is `true` in config
2. Verify the channel is enabled
3. Check logs for errors
4. Ensure plugin is enabled and loaded

### Context Not Being Injected

1. Verify memories exist: Use `search_memories` tool
2. Check `maxMemories` setting
3. Ensure extension is loaded and enabled
4. Check that tools are available to the agent

### MCP Connection Issues

1. Verify server is running: `npm run mcp:status`
2. Check port availability (default: 3847)
3. Review MCP logs

### Bundled Plugin Disabled by Default

**Note:** If the extension is installed in MoltBot's `extensions/` directory (bundled), it will be disabled by default. You must explicitly enable it using `pnpm moltbot plugins enable claude-recall`.

## Performance

- Memory search: ~10ms average
- Context injection: ~5ms overhead
- Storage: ~1KB per memory entry

## Security

- All data stored locally
- No external API calls
- Memories are per-installation
