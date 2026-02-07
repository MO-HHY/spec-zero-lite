# OpenCode Configuration Schema

**Version**: 1.0.0
**Status**: ✅ Valid & Conformant

---

## Overview

`opencode.json` è la configurazione principale per spec-zero-lite, conforme allo schema OpenCode ufficiale.

## File Structure

```json
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "orchestrator",
  
  "mcp": {
    // Optional MCP integrations
    "clickup": { ... }
  },
  
  "agent": {
    // 8 agenti specializzati
    "orchestrator": { ... },
    "analyzer": { ... },
    // ... altri agenti
  }
}
```

## Valid Top-Level Properties

| Property | Type | Required | Example |
|----------|------|----------|---------|
| `$schema` | string | ✅ | `"https://opencode.ai/config.json"` |
| `default_agent` | string | ✅ | `"orchestrator"` |
| `mcp` | object | ❌ | `{ "clickup": {...} }` |
| `agent` | object | ✅ | `{ "orchestrator": {...}, ... }` |

## ⚠️ Invalid Properties (Removed)

These properties are **NOT** part of the OpenCode schema:

- ❌ `project_name`
- ❌ `project_description`
- ❌ `version`
- ❌ `skills`
- ❌ `templates`
- ❌ `configuration`

**Where to put this info instead**:
- Use `config.yaml` for application configuration
- Use `.opencode/README.md` for documentation
- Use `.opencode/MODELS.md` for model strategy

---

## Agent Definition Structure

Each agent follows this schema:

```json
{
  "agent_name": {
    "model": "google/antigravity-claude-opus-4-5-thinking",
    "mode": "primary|subagent",
    "description": "Agent description",
    "prompt": ".opencode/prompt/file.md"
  }
}
```

### Agent Properties

| Property | Type | Required | Values |
|----------|------|----------|--------|
| `model` | string | ✅ | LLM model identifier |
| `mode` | string | ✅ | `primary` or `subagent` |
| `description` | string | ✅ | Human-readable description |
| `prompt` | string | ✅ | Path to prompt file (relative to project root) |

---

## MCP (Model Context Protocol)

Optional integrations with external services:

```json
"mcp": {
  "service_name": {
    "type": "remote|local",
    "url": "https://endpoint",
    "oauth": true|false,
    "headers": { ... },
    "enabled": true|false
  }
}
```

**Current MCP Integrations**:
- ✅ ClickUp (for task tracking)

---

## Current Agents (8 Total)

### Primary Agent
1. **orchestrator** - Coordinates 5-step pipeline

### Analysis & Planning (3)
2. **analyzer** - Initial repo analysis
3. **dag-planner** - Dependency planning
4. **node-creator** - Spec generation

### Execution & Reporting (2)
5. **generic-executor** - Node execution
6. **documentation-writer** - Output formatting

### Utilities (2)
7. **standard-analyzer** - Custom analysis
8. **logging-manager** - Telemetry

Plus inherited agents from Dev Swarm:
- architect, planner, executor-manager
- coder-frontend, coder-backend, coder-fullstack
- tester, reviewer
- clickup, activity-register

---

## Configuration Location

**Main config**: `.opencode/config.yaml`
- Logging settings
- Execution parameters
- Context management
- Model assignments (overrides)

**Documentation**: `.opencode/README.md`
- Architecture overview
- Workflow documentation
- Advanced features

**Model Strategy**: `.opencode/MODELS.md`
- Model selection criteria
- Cost analysis
- Performance metrics

---

## Validation

To validate opencode.json:

```bash
# Check JSON syntax
python3 -m json.tool opencode.json > /dev/null

# Test with opencode CLI
opencode --version
```

---

## Key Design Decisions

1. **Minimal Schema Compliance**
   - Only required properties in JSON
   - Additional config in separate files
   - Cleaner, more maintainable structure

2. **Prompt-Based Configuration**
   - Agents use `.md` files for prompts
   - Easier to version and update
   - Better readability and IDE support

3. **Separation of Concerns**
   - `opencode.json`: Agent definitions
   - `config.yaml`: Application settings
   - `MODELS.md`: Model strategy
   - `README.md`: Documentation

---

## References

- [OpenCode Schema](https://opencode.ai/config.json)
- [MCP Integration](https://modelcontextprotocol.io)
- See `.opencode/config.yaml` for runtime configuration

---

**Last Updated**: 2025-01-19
**Status**: ✅ Valid & Production-Ready
