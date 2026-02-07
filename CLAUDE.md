# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**spec-zero-lite** is an intelligent repository analyzer that autonomously generates comprehensive technical documentation using a modular agentic orchestration system. Rather than hardcoded logic, it uses specialized LLM agents to analyze software repositories and generate 15 detailed specification documents through a 14-step pipeline.

**Key Paradigm**: Shifting from algorithmic (hardcoded logic) to agentic (LLM agent-based) problem solving—specifying what to do rather than writing code that "knows" what to do.

**v1.2.0 Update** (Latest):
- File auto-rename with UID pattern (`{domain}__{type}__{name}.md`)
- `08-Diagrams/` folder automatically integrated in output structure
- `README.md` with embedded architecture diagram (Mermaid)
- GitHub repository auto-creation via `gh` CLI
- Submodule created at `{repo}/{repo-name}-spec/`

**v1.1.0 Update**: Analysis projects are now isolated in dedicated directories, keeping spec-zero-lite clean as a template/engine.

## Common Development Commands

### Setup & Verification
```bash
# Install TypeScript dependencies
npm install

# Install Python dependencies
pip install pyyaml

# Verify TypeScript skill (generates ASCII repo tree)
npx ts-node .opencode/skill/repo-tree-generator.ts . ascii 2

# Verify Python skill (detects tech stack)
python .opencode/skill/repo_analyzer.py .

# Test analysis-project skill
npx ts-node .opencode/skill/analysis-project.ts --help
```

### Running Analysis
```bash
# Start analysis on target repository
# NOTE: You will be prompted for output directory
/start /path/to/target-repo

# Or analyze the project itself (good for validation)
/start .

# Check current execution status
/status

# View dependency graph (DAG) visualization
/view-dag

# List all analysis nodes and their status
/list-nodes

# Resume from last failed node (resumable by design)
/resume

# Execute only a specific layer (0-6)
/execute-layer 3

# Debug a specific node
/debug node-006

# Generate final report
/finalize
```

## High-Level Architecture

### Analysis as Project (v1.1.0)

Every analysis is saved to a dedicated, isolated directory:

```
/Users/you/Analyses/                      # Your chosen output base
└── my-repo-2026-02-07-1231/             # Isolated analysis project
    ├── _session/                         # Session metadata
    │   ├── session.json                  # Who, when, version, results
    │   ├── engine-version.txt            # Git hash of spec-zero-lite
    │   └── config-snapshot.yaml          # Config used for this analysis
    ├── _meta/                            # Intermediate work (preserved)
    │   ├── 00-overview.md
    │   ├── 01-dag.md
    │   ├── 02-nodes/
    │   ├── cache/
    │   ├── logs/
    │   └── state.json
    ├── _generated/                       # Raw analysis output
    │   └── node-*.md
    ├── my-repo-Specs/                    # Organized SPEC-OS output
    │   ├── 00-INDEX.md
    │   └── ...
    └── ANALYSIS-SUMMARY.md               # Quick reference
```

**Benefits**:
- **Isolation**: Each analysis in its own folder
- **Traceability**: Engine version, config, timestamps saved
- **Reproducibility**: Config snapshot enables replication
- **Clean Engine**: spec-zero-lite stays clean as a template

### v1.2.0 New Features

#### 1. Automatic File Rename with UID Pattern

Files are now automatically renamed to match SPEC-OS conventions:

```
BEFORE (Step 7):                    AFTER (Step 8):
Overview.md                    →    field-devices__overview__bootstrap.md
TechStack.md                   →    field-devices__arch__tech-stack.md
architecture-overview.md       →    field-devices__diagram__architecture-overview.md
```

Pattern: `{domain}__{type}__{name}.md`

#### 2. Integrated Diagrams Folder

All Mermaid diagrams are now automatically copied to `08-Diagrams/`:

```
{repo}-Specs/
├── ...
├── 08-Diagrams/
│   ├── {domain}__diagram__architecture-overview.md
│   ├── {domain}__diagram__data-flow.md
│   ├── {domain}__diagram__dependency-graph.md
│   ├── {domain}__diagram__sequence-main-flow.md
│   ├── {domain}__diagram__class-hierarchy.md
│   └── {domain}__diagram__deployment.md
└── README.md
```

#### 3. README with Embedded Architecture Diagram

Each spec output includes a `README.md` with:
- Repository overview (from node-004)
- **Embedded Mermaid architecture diagram** (inline, renders on GitHub/Obsidian)
- Quick navigation table
- Tech stack summary

#### 4. GitHub Repository Auto-Creation

Step 11 now uses `gh` CLI to:
1. Check if `{repo-name}-spec` exists on GitHub
2. Create it if not (`gh repo create --public`)
3. Clone/initialize as submodule
4. Sync files and push
5. Update `.gitmodules` in parent repo

```bash
# Manual test of git-manager
npx ts-node .opencode/skill/git-manager.ts full-sync \
  field-devices \
  /path/to/field-devices \
  /path/to/field-devices-Specs
```

### The 13-Step Orchestration Pipeline

The system automatically orchestrates repository analysis through five sequential steps:

```
Step -1: CREATE ANALYSIS PROJECT (NEW in v1.1.0)
  ├─ Input: Repository path + Output directory (prompted)
  ├─ Output: Isolated project folder with _session/, _meta/, _generated/
  └─ Duration: ~2s

Step 1: ANALYZER
  ├─ Input: Repository path
  ├─ Output: _meta/00-overview.md (comprehensive repo analysis)
  └─ Duration: ~45s

Step 2: DAG PLANNER
  ├─ Input: 00-overview.md
  ├─ Output: _meta/01-dag.md (15 nodes, dependencies, layers)
  └─ Duration: ~30s

Step 3: NODE CREATOR
  ├─ Input: 01-dag.md + 00-overview.md
  ├─ Output: _meta/02-nodes/*.md (15 detailed specs)
  └─ Duration: ~60s

Step 4: PREPARATION
  ├─ Input: 02-nodes/
  ├─ Output: Todo list + _meta/state.json
  └─ Duration: ~20s (local, no LLM calls)

Step 5: EXECUTOR (Parallelized)
  ├─ Input: 02-nodes/node-XXX.md
  ├─ Output: _generated/node-XXX.md + logs
  └─ Duration: ~2-5 min total
```

**Total Pipeline Time**: ~5-7 minutes for complete repository analysis.

### Directory Structure & Memory Model

**`.opencode/`** = Configuration & Orchestration Infrastructure
- `prompt/` - 8 agent instruction prompts (orchestration, analysis, planning, execution, utilities)
- `skill/` - 5 utility scripts (TypeScript: tree generation, structure creation, markdown compilation; Python: tech detection, metadata management)
- `template/type/` - 5 output templates (analysis, DAG, node-spec, execution-report, summary)
- `config.yaml` - Complete execution configuration (logging, timeouts, parallelism, context, quality thresholds)
- `opencode.json` - Agent definitions, model assignments, ClickUp MCP integration

**`_meta/`** = Persistent Brain (Generated During Step 1-4)
- `00-overview.md` - Initial repository analysis
- `01-dag.md` - Execution plan (DAG with 15 nodes, 7 layers, dependencies)
- `02-nodes/` - 15 detailed node specifications
- `logs/` - Execution logs (orchestrator.log + node-specific logs)
- `cache/` - Compressed summaries for dependency injection
- `state.json` - Execution state for resumability
- `manifest.json` - Metadata and statistics

**`_generated/`** = Analysis Results (Generated During Step 5)
- `node-001-bootstrap.md` through `node-015-audit.md` (15 analysis documents)
- Complete audit trail and execution logs

### The 15 Analysis Nodes

Generated nodes cover comprehensive repository analysis:

| Layer | Node | Purpose |
|-------|------|---------|
| 0 | bootstrap | Initialize analysis context |
| 1 | dependencies | Analyze project dependencies |
| 1 | structure | Document project structure |
| 2 | overview | High-level technical overview |
| 2 | metrics | Quantitative assessment |
| 3 | frontend | Frontend-specific analysis (React, Vue, etc.) |
| 3 | backend | Backend analysis (Node, Python, Go, etc.) |
| 3 | database | Database & persistence layer |
| 4 | api | API design and endpoints |
| 4 | authentication | Security & authentication mechanisms |
| 4 | testing | Test coverage and testing infrastructure |
| 5 | performance | Performance metrics and optimization |
| 5 | security | Security assessment and vulnerabilities |
| 6 | recommendations | Actionable improvements |
| 6 | audit | Final audit trail |

Each layer executes in parallel (except bootstrap/audit which are serial). Next layer starts only after previous completes.

### Modular Agent System

12 specialized agents with specific responsibilities:

| Agent | Model* | Purpose |
|-------|--------|---------|
| orchestrator | Opus | Coordinates entire 14-step pipeline |
| analyzer | Opus | Initial repository analysis and tech stack detection |
| dag-planner | Opus | Creates dependency graph and node definitions |
| node-creator | Opus | Generates detailed specifications for analysis nodes |
| generic-executor | Opus | Executes individual nodes with context injection |
| standard-analyzer | Opus | Modular analyzer for parameterized analysis tasks |
| documentation-writer | Opus | Converts raw analysis into polished documentation |
| diagram-generator | Flash | Generates Mermaid diagrams (architecture, sequence, ER, flows) |
| spec-organizer | Flash | Organizes generated specs into modular adaptive structure |
| spec-os-adapter | Flash | Applies SPEC-OS conventions (UIDs, frontmatter, links) |
| spec-git-manager | Flash | Manages git submodules and spec synchronization |
| logging-manager | Flash | Handles telemetry, metrics, and structured logging |

*Model assignments in `opencode.json` support intelligent selection based on task complexity and context size. See `.opencode/models.md` for selection strategy.

### State Persistence & Resumability

Complete file-based memory enables:
- **Resumable from any failed node** - State saved to `_meta/state.json`
- **Debuggable** - Each file is self-contained with full context
- **Auditable** - Complete execution log in `_meta/logs/orchestrator.log`
- **Dependency injection** - Completed nodes' outputs cached and injected into dependent nodes

## Technology Stack

- **Languages**: TypeScript, Python, Markdown/YAML
- **Runtime**: Node.js (TypeScript skills), Python 3.8+
- **Framework**: OpenCode AI orchestration platform
- **Models**: Google AI (Opus, Pro, Sonnet, Flash for different task types)
- **Package Manager**: npm, pip
- **Version Control**: git
- **Optional Integration**: ClickUp via MCP

## Configuration

### Key Configuration File: `.opencode/config.yaml`

**Sections**:
- `project` - Metadata and naming
- `paths` - Directory configuration (_meta, _generated, logs, cache)
- `logging` - Level (debug/info/warning/error), format, rotation, per-component levels
- `execution` - Timeouts (300-600s), retry policy (3 attempts), parallelization (max 4 concurrent nodes)
- `context` - Max window (100KB default), file truncation, caching strategy
- `templates` - Version selection (v0 templates)
- `skills` - Python/TypeScript execution requirements
- `analysis_layers` - 7-layer pipeline configuration with concurrency limits per layer
- `quality` - Minimum score threshold (7.0/10), scoring weights
- `advanced` - State persistence, resumability options, metrics collection

### Common Customizations

```yaml
# For verbose debugging (dev mode)
logging:
  level: "debug"

# For resource-constrained environments
execution:
  parallelism:
    max_concurrent_nodes: 2
context:
  max_context_window: 50000
  max_lines_per_file: 250
```

## Important Development Patterns

### Adding Custom Agents

1. Create prompt file: `.opencode/prompt/my-agent.md`
2. Add to `opencode.json`:
```json
"my-agent": {
  "model": "google/model-name",
  "mode": "subagent",
  "description": "My custom agent",
  "prompt": ".opencode/prompt/my-agent.md"
}
```

### Adding Custom Skills

1. Create TypeScript or Python script in `.opencode/skill/`
2. Reference in `.opencode/config.yaml` under `skills.startup_scripts`

### Understanding Node Specifications

Each file in `_meta/02-nodes/` contains:
- **Purpose**: What this node analyzes
- **Layer & Dependencies**: When it runs and what it depends on
- **Analysis Scope**: What aspects to examine
- **Key Questions**: Specific investigation points
- **Execution Instructions**: For the agent
- **Acceptance Criteria**: What constitutes complete analysis
- **Output Format**: Expected structure and sections

## Key Files to Know

| File | Purpose |
|------|---------|
| `.opencode/config.yaml` | Master configuration for entire orchestration |
| `.opencode/opencode.json` | Agent definitions and model assignments |
| `.opencode/prompt/orchestrator-main.md` | Main orchestration state machine |
| `.opencode/prompt/step5-generic-executor.md` | Generic node execution logic |
| `_meta/state.json` | Current execution state (for resume) |
| `_meta/manifest.json` | Final metadata and statistics |

## Execution Flow Details

### Layer-by-Layer Parallelization

Nodes within a layer execute in parallel, with layer synchronization:

```
Layer 0: bootstrap (1 node, serial)
   │ Completes → Summaries cached
   ↓
Layer 1: dependencies, structure (2 nodes, parallel max=2)
   │ Both complete → Summaries cached → Injected to Layer 2
   ↓
Layer 2: overview, metrics (2 nodes, parallel max=2)
   │ Both complete → Summaries cached → Injected to Layer 3
   ↓
[Layers 3-5 similar pattern]
   ↓
Layer 6: recommendations, audit (2 nodes, serial)
   │ Final outputs to _generated/
```

### Dependency Injection Strategy

When a node completes:
1. Output is summarized and scored for quality
2. Summary saved to `_meta/cache/summary-XXX.md`
3. Downstream nodes automatically load summaries
4. Context injected into their analysis prompt
5. Enables efficient context reuse without loading full outputs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module not found (ts-node) | `npm install -g ts-node typescript` |
| YAML import error (Python) | `pip install pyyaml` |
| Analysis timeout | Increase `execution.timeout_seconds` in config.yaml |
| Out of memory | Reduce `context.max_context_window` or `context.max_lines_per_file` |
| Resume doesn't work | Validate `_meta/state.json` integrity using `python -m json.tool` |
| Execution too slow | Increase `execution.parallelism.max_concurrent_nodes` if system resources allow |

## Output Quality Assurance

All nodes validated against:
- **Completeness (50%)** - All required sections present, sufficient depth
- **Clarity (20%)** - Well-structured, self-contained, no ambiguity
- **Actionability (15%)** - Specific recommendations, measurable insights
- **Evidence (15%)** - Backed by code examination, specific examples

Minimum acceptable score: 7.0/10. Quality scores tracked in `_meta/metrics.json`.

## Integration Points

### ClickUp Integration (Configured but Optional)
- MCP-based integration in `opencode.json`
- Can push analysis results to ClickUp workspace
- Requires `CLICKUP_API_TOKEN` environment variable

### Extending the System
- Add custom analyzers in `.opencode/prompt/`
- Create custom skills in `.opencode/skill/`
- Define custom output templates in `.opencode/template/type/`
- All changes version-controlled and resumable

## Important Notes

- **File-based architecture** - All state persisted to files, no databases
- **Resumable by design** - Can pause/resume safely from any point
- **Complete auditability** - Every operation logged and timestamped
- **Cost-optimized** - Intelligent model selection based on task needs
- **Production-ready** - v1.0.0 with comprehensive configuration and error handling
- **Git-tracked** - Safe to commit analysis infrastructure (skip _meta/ and _generated/ in .gitignore for production)

## When Working on This Codebase

1. **Always check `_meta/logs/`** before debugging - logs contain detailed execution info
2. **Review `config.yaml`** when changing execution behavior
3. **Test on small repos first** when modifying prompts or adding agents
4. **Use `/resume`** to continue from failures without losing progress
5. **Check `_meta/manifest.json`** for metadata about completed analysis
6. **Reference `.opencode/README.md`** for detailed architecture documentation
7. **Use `/debug node-XXX`** to isolate issues to specific analysis nodes

## References

- `.opencode/README.md` - Complete architecture documentation (15KB)
- `QUICKSTART.md` - Getting started guide with step-by-step examples
- `.opencode/config.yaml` - Configuration reference with all options explained
- `.opencode/models.md` - Model selection strategy and cost analysis
- `.opencode/AGENTS_EXECUTION_PATTERN.md` - Agent execution guidelines
