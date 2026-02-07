# spec-zero-lite: Quick Start Guide

**Version**: 1.0.0
**First Setup**: ~5 minutes

---

## 🎯 What is spec-zero-lite?

An intelligent repository analyzer using a 5-step agentic orchestration pipeline:

1. **Analyze** - Detect tech stack and features
2. **Plan** - Create dependency graph (DAG)
3. **Design** - Generate analysis node specifications
4. **Prepare** - Setup execution environment
5. **Execute** - Analyze in parallel, generate reports

**Output**: 15 detailed analysis documents in `_generated/`

---

## ⚡ Quick Start (First Time)

### 1️⃣ Navigate to Project
```bash
cd spec-zero-lite
```

### 2️⃣ Install Dependencies
```bash
# For TypeScript skills
npm install

# For Python skills
pip install pyyaml
```

### 3️⃣ Verify Installation
```bash
# Test TypeScript skill
npx ts-node .opencode/skill/repo-tree-generator.ts . ascii 2

# Test Python skill
python .opencode/skill/repo_analyzer.py .
```

✓ If both commands work, you're ready!

---

## 🚀 Running an Analysis

### Command Structure
```bash
# Start analysis on a target repository
/start /path/to/target-repo

# Or locally (analyzes itself)
/start .
```

### What Happens
```
Step 1: Analyzer
  └─> Reads repo, detects tech stack
  └─> Output: _meta/00-overview.md (45s)

Step 2: DAG Planner
  └─> Creates dependency graph
  └─> Output: _meta/01-dag.md (30s)

Step 3: Node Creator
  └─> Generates 15 node specifications
  └─> Output: _meta/02-nodes/*.md (60s)

Step 4: Preparation
  └─> Validates specs, creates todo list
  └─> Output: _meta/state.json (20s)

Step 5: Executor (Parallel)
  └─> Analyzes each node
  └─> Output: _generated/node-*.md (2-5min)

TOTAL: ~5-7 minutes for complete analysis
```

---

## 📂 What Gets Created

### Input
```
spec-zero-lite/
└── .opencode/     (Configuration + prompts + skills + templates)
```

### Output
```
spec-zero-lite/
├── _meta/                    (Orchestration memory)
│   ├── 00-overview.md        (Repository analysis)
│   ├── 01-dag.md             (Execution plan)
│   ├── 02-nodes/             (15 node specs)
│   │   ├── node-001-bootstrap.md
│   │   ├── node-002-dependencies.md
│   │   └── ...
│   ├── logs/
│   │   ├── orchestrator.log  (Audit trail)
│   │   └── node-*.log
│   ├── cache/
│   │   └── summary-*.md      (Compressed outputs)
│   ├── state.json            (Execution state)
│   └── manifest.json         (Final metadata)
│
└── _generated/               (Analysis results)
    ├── node-001-bootstrap.md
    ├── node-002-dependencies.md
    ├── node-003-structure.md
    ├── node-004-overview.md
    ├── node-005-metrics.md
    ├── node-006-frontend.md
    ├── node-007-backend.md
    ├── node-008-database.md
    ├── node-009-api.md
    ├── node-010-authentication.md
    ├── node-011-testing.md
    ├── node-012-performance.md
    ├── node-013-security.md
    ├── node-014-recommendations.md
    └── node-015-audit.md
```

---

## 🎮 Main Commands

```bash
# Start new analysis
/start /path/to/repo

# Check current status
/status

# View execution plan
/view-dag

# List all nodes and their status
/list-nodes

# Resume from last failed node
/resume

# Execute only a specific layer
/execute-layer 3

# Debug a specific node
/debug node-006

# Generate final report
/finalize
```

---

## 📊 Understanding the Output

Each `_generated/node-*.md` contains:

- **Executive Summary** - Key findings overview
- **Detailed Analysis** - In-depth investigation
- **Diagrams** - Architecture/structure visualizations (Mermaid)
- **Metrics** - Quantitative assessment
- **Recommendations** - Actionable improvements
- **Risk Assessment** - Potential issues and mitigations

**Example**: `_generated/node-006-frontend.md`
```markdown
# Frontend Analysis

## Summary
React 18 + TypeScript SPA with Redux state management...

## Component Architecture
- Root: App.tsx
  - Layout (header, sidebar, main)
  - Pages (Home, Dashboard, Settings)
  - Components (reusable UI)

## State Management
Redux store with async thunks for API calls...

[Details, diagrams, recommendations...]
```

---

## ⚙️ Configuration

Edit `.opencode/config.yaml` to customize:

```yaml
# Logging level
logging:
  level: "debug"  # or "info", "warning", "error"

# Parallelization
execution:
  parallelism:
    max_concurrent_nodes: 4

# Context management
context:
  max_context_window: 100000  # tokens
  max_lines_per_file: 500
```

---

## 🔧 Customization

### Add Custom Analysis Node
Edit `.opencode/prompt/step3-node-creator.md` and add node definition.

### Add Custom Skill
Create a new file in `.opencode/skill/` (Python or TypeScript) and reference in `opencode.json`.

### Change Model Assignment
Edit `opencode.json` to change model for specific agents:

```json
{
  "agent": {
    "analyzer": {
      "model": "google/antigravity-claude-opus-4-5-thinking"
    }
  }
}
```

See `.opencode/MODELS.md` for model selection strategy.

---

## 🐛 Troubleshooting

### "Module not found: ts-node"
```bash
npm install -g ts-node typescript
```

### "ModuleNotFoundError: yaml"
```bash
pip install pyyaml
```

### Analysis timed out
Increase timeout in `.opencode/config.yaml`:
```yaml
execution:
  timeout_seconds: 600
```

### Out of context memory
Reduce context window in `.opencode/config.yaml`:
```yaml
context:
  max_context_window: 50000
  max_lines_per_file: 250
```

### Resume from interrupted analysis
```bash
/resume
```

This continues from the last completed node.

---

## 📖 Documentation

- **`.opencode/README.md`** - Complete architecture documentation
- **`.opencode/MODELS.md`** - Model selection strategy
- **`.opencode/config.yaml`** - All configuration options
- **`_meta/manifest.json`** - Analysis metadata and statistics

---

## 🎯 Next Steps

1. ✓ Setup complete
2. → Run `/start .` to analyze spec-zero-lite itself
3. → Review outputs in `_generated/`
4. → Check `_meta/logs/orchestrator.log` for execution details
5. → Read `.opencode/README.md` for advanced usage

---

## 💡 Tips

- **First run analyzes spec-zero-lite itself** - great for validation
- **Logs are your friend** - check `_meta/logs/` for any issues
- **Resumable by default** - can pause and resume safely
- **Models are optimized** - see `.opencode/MODELS.md` for reasoning

---

**Created**: 2025-01-19
**Status**: Production Ready
**Support**: See `.opencode/README.md` for detailed documentation
