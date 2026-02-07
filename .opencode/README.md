# .opencode - Orchestration Configuration

**Version**: 1.0.0
**Project**: spec-zero-lite
**Purpose**: Modular agentic orchestrator for repository analysis and spec generation

---

## Overview

`.opencode/` contains the complete configuration and automation infrastructure for spec-zero-lite's agentic orchestration system. This directory implements a sophisticated approach to repository analysis using:

- **5-Step Orchestration Pipeline**: Structured analysis from overview to execution
- **DAG-Based Planning**: Dependency graph ensures efficient execution
- **Modular Agents**: Specialized LLM agents for specific tasks
- **Persistent Memory**: Complete audit trail in `_meta/`
- **Parallel Execution**: Layer-by-layer processing for scalability
- **Skill Integration**: Python and TypeScript utilities for automation

---

## Directory Structure

```
.opencode/
├── prompt/                      # Agent prompts and instructions (7 files)
│   ├── orchestrator-main.md    # Main orchestration prompt
│   ├── step1-analyzer.md       # Repository analysis
│   ├── step2-dag-planner.md    # Dependency planning
│   ├── step3-node-creator.md   # Node specification
│   ├── step5-generic-executor.md # Generic node executor
│   ├── standard-analyzer-base.md # Modular analyzer
│   ├── documentation-writer.md # Documentation generation
│   └── logging-manager.md      # Logging & telemetry
│
├── skill/                       # Utility scripts (5 files)
│   ├── repo-tree-generator.ts  # Repository structure mapping (TypeScript)
│   ├── structure-creator.ts    # Directory/file creation (TypeScript)
│   ├── markdown-compiler.ts    # Markdown compilation (TypeScript)
│   ├── repo_analyzer.py        # Tech stack detection (Python)
│   └── metadata_manager.py     # _meta/ directory management (Python)
│
├── template/type/              # Output templates (5 versions)
│   ├── analysis-v0.template.md         # Initial analysis report
│   ├── dag-plan-v0.template.md        # Dependency planning
│   ├── node-spec-v0.template.md       # Node specifications
│   ├── execution-report-v0.template.md # Node execution results
│   └── summary-v0.template.md         # Compressed summaries
│
├── logs/                        # Runtime logs (generated)
├── cache/                       # Runtime cache (generated)
│
├── config.yaml                  # Complete configuration
└── README.md                    # This file
```

---

## The 5-Step Orchestration Pipeline

### Step 1: ANALYZING
**Agent**: `analyzer`
**Input**: Repository path
**Output**: `_meta/00-overview.md`
**Duration**: ~45s

Analyzes the repository structure, tech stack, dependencies, and features. Generates a comprehensive overview document that serves as the basis for all subsequent analysis.

**Key Activities**:
- Detect technologies used
- Identify dependencies
- Recognize code patterns
- Assess documentation quality

### Step 2: PLANNING
**Agent**: `dag-planner`
**Input**: `_meta/00-overview.md`
**Output**: `_meta/01-dag.md`
**Duration**: ~30s

Creates a Directed Acyclic Graph (DAG) of analysis nodes with explicit dependencies and layer assignments. This enables parallel execution where possible.

**Key Activities**:
- Define analysis nodes
- Establish dependencies
- Assign to execution layers
- Estimate timeline

### Step 3: NODE_CREATION
**Agent**: `node-creator`
**Input**: `_meta/01-dag.md`, `_meta/00-overview.md`
**Output**: `_meta/02-nodes/*.md`
**Duration**: ~60s

Creates detailed specifications for each node in the DAG. Every spec is self-contained with all information needed for execution.

**Key Activities**:
- Define node purpose
- Specify analysis scope
- List key questions
- Define output format

### Step 4: PREPARATION
**Agent**: Orchestrator (local)
**Input**: `_meta/02-nodes/`
**Output**: Todo widget + `_meta/state.json`
**Duration**: ~20s

Validates node specifications, creates a todo list for the user, and saves orchestration state for resumability.

### Step 5: EXECUTION
**Agent**: `generic-executor` (parallelized)
**Input**: `_meta/02-nodes/node-XXX.md`
**Output**: `_generated/node-XXX.md` + logs
**Duration**: ~2-5 min total

Executes each node layer-by-layer, with parallel execution within layers. Each node generates output documentation and a summary for dependent nodes.

---

## Core Concepts

### Agents

The system uses 7 specialized agents:

| Agent | Role | Model |
|-------|------|-------|
| `orchestrator` | Coordinates entire pipeline | Claude Opus |
| `analyzer` | Initial repo analysis | Claude Opus |
| `dag-planner` | Dependency planning | Claude Opus |
| `node-creator` | Node spec generation | Claude Opus |
| `generic-executor` | Node execution | Claude Opus |
| `standard-analyzer` | Modular analysis tasks | Claude Opus |
| `documentation-writer` | Output formatting | Claude Opus |

### Layers

Nodes are organized in execution layers for optimization:

```
Layer 0: Bootstrap (serial)
   ↓
Layer 1: Foundation (parallel, max 2)
   ↓
Layer 2: Analysis (parallel, max 2)
   ↓
Layer 3: Domain (parallel, max 3)
   ↓
Layer 4: Details (parallel, max 3)
   ↓
Layer 5: Operations (parallel, max 2)
   ↓
Layer 6: Summary (serial)
```

All nodes in a layer execute in parallel. Next layer starts only after previous layer completes.

### State Persistence

The `_meta/` directory serves as persistent memory:

```
_meta/
├── 00-overview.md           # Step 1 output
├── 01-dag.md                # Step 2 output
├── 02-nodes/                # Step 3 output
│   ├── node-001-bootstrap.md
│   ├── node-002-dependencies.md
│   └── ...
├── logs/
│   ├── orchestrator.log     # Main execution log
│   ├── node-XXX.log         # Per-node logs
│   └── errors.log           # Error collection
├── cache/
│   ├── summary-001.md       # Compressed outputs
│   ├── summary-002.md
│   └── ...
├── state.json               # Orchestration state
└── manifest.json            # Final metadata
```

### Dependency Injection

When a node completes:
1. Its output is summarized
2. Summary saved to `_meta/cache/summary-XXX.md`
3. Dependent nodes load this summary
4. Context injected into their analysis prompt

This enables each node to have necessary context without loading full outputs.

---

## Configuration

Edit `.opencode/config.yaml` to customize:

- **Logging**: Level, format, rotation
- **Execution**: Timeouts, retries, parallelism
- **Context**: Window size, file truncation, caching
- **Templates**: Template versions and names
- **Skills**: Python/TypeScript execution
- **Quality**: Scoring thresholds and weights
- **Advanced**: State persistence, resumability, debugging

Common adjustments:

```yaml
# For verbose debugging
logging:
  level: "debug"

# For faster execution (fewer parallel tasks)
execution:
  parallelism:
    max_concurrent_nodes: 2

# For resource-constrained environment
context:
  max_context_window: 50000
```

---

## Skills (Utilities)

### TypeScript Skills

**repo-tree-generator.ts**
Generates repository structure trees in ASCII, JSON, or Markdown format with configurable depth and filters.

```bash
npx ts-node repo-tree-generator.ts /path/to/repo ascii 3
```

**structure-creator.ts**
Creates `.opencode`, `_meta`, and `_generated` directory structures with initial files.

```bash
npx ts-node structure-creator.ts /path/to/repo
```

**markdown-compiler.ts**
Processes markdown with Handlebars partials, variable substitution, and YAML frontmatter validation.

```bash
npx ts-node markdown-compiler.ts input.md output.md
```

### Python Skills

**repo_analyzer.py**
Analyzes repositories to detect tech stack, languages, frameworks, databases, and project characteristics.

```bash
python repo_analyzer.py /path/to/repo
```

**metadata_manager.py**
Thread-safe management of `_meta/` directory: saving/loading specs, logs, cache, and state.

```bash
python metadata_manager.py /path/to/_meta
```

---

## Prompts

### orchestrator-main.md
The primary orchestration prompt. Defines the state machine, 5-step workflow, and orchestrator responsibilities. Controls overall flow and error handling.

### step1-analyzer.md
Detailed analysis prompt for initial repository assessment. Specifies what technologies to detect, what files to examine, and output format.

### step2-dag-planner.md
Planning prompt for DAG generation. Defines node types, layer assignments, dependency rules, and execution timeline estimation.

### step3-node-creator.md
Node spec creation prompt. Provides templates for all 15 analysis nodes (bootstrap through summary) with specific purpose and scope for each.

### step5-generic-executor.md
Generic executor prompt used for all node execution. Handles context loading, file reading, analysis, validation, and output formatting.

### standard-analyzer-base.md
Base prompt for modular analysis tasks. Parameterizable analyzer that can be given specific domains, components, and questions.

### documentation-writer.md
Specializes in converting raw analysis into polished documentation. Applies templates, validates formatting, ensures consistency.

### logging-manager.md
Manages structured logging, metrics collection, error tracking, and session summaries.

---

## Templates

### analysis-v0.template.md
Template for `00-overview.md` (initial analysis report). Sections:
- Executive Summary
- Tech Stack
- Project Type
- Directory Structure
- Core Features
- Key Files
- Dependencies
- Code Patterns
- Documentation Assessment

### dag-plan-v0.template.md
Template for `01-dag.md` (DAG plan). Sections:
- Mermaid diagram
- Execution layers
- Node metadata table
- Critical path analysis
- Context injection strategy
- Error recovery
- Timeline estimate

### node-spec-v0.template.md
Template for `02-nodes/*.md` (node specifications). Sections:
- Purpose and scope
- Layer & dependencies
- Analysis scope
- Key questions
- Execution instructions
- Acceptance criteria
- Output specifications

### execution-report-v0.template.md
Template for `_generated/node-XXX.md` (node execution results). Sections:
- Executive summary
- Detailed findings
- Diagrams
- Key metrics
- Code examples
- Risks & concerns
- Recommendations
- Appendix

### summary-v0.template.md
Template for `_meta/cache/summary-XXX.md` (compressed outputs). Compact version containing:
- Key findings
- Critical issues
- Top 3 recommendations
- Quality & confidence

---

## Workflow Example

### 1. Initialize

```bash
cd /path/to/spec-zero-lite

# Create necessary directories
npx ts-node .opencode/skill/structure-creator.ts .
```

### 2. Start Orchestration

```
/start /path/to/target-repo
```

The orchestrator will:
- ✓ Step 1: Analyze repo → `_meta/00-overview.md`
- ✓ Step 2: Plan DAG → `_meta/01-dag.md`
- ✓ Step 3: Create nodes → `_meta/02-nodes/*.md`
- ✓ Step 4: Prepare execution
- ✓ Step 5: Execute layers 0-6 → `_generated/node-*.md`

### 3. Monitor Progress

```
/status          # Current state
/list-nodes      # All nodes
/view-dag        # Visualize DAG
```

### 4. Review Results

Outputs saved to:
- `_generated/node-XXX-name.md` - Full analysis per node
- `_meta/cache/summary-XXX.md` - Compressed summaries
- `_meta/logs/orchestrator.log` - Complete execution log
- `_meta/manifest.json` - Metadata and statistics

### 5. Resume if Needed

```
/resume          # Continue from last failed node
```

---

## Best Practices

### 1. Configuration Management
- Version control `opencode.json` and `config.yaml`
- Use environment variables for sensitive values
- Document configuration changes

### 2. Prompt Maintenance
- Update prompts as analysis requirements evolve
- Version your custom prompts (v1, v2, etc.)
- Test changes with small repos first

### 3. Template Updates
- Keep templates consistent and well-documented
- Version templates (v0, v1, v2)
- Include guidance comments in templates

### 4. Log Analysis
- Review `_meta/logs/orchestrator.log` for issues
- Use `_meta/metrics.json` to track performance
- Archive old logs periodically

### 5. State Management
- Always save state before attempting resume
- Validate `state.json` integrity
- Clean up `_meta/` between major runs

---

## Troubleshooting

### Node Execution Failed

1. Check logs:
   ```bash
   tail -f _meta/logs/node-XXX.log
   tail -f _meta/logs/orchestrator.log
   ```

2. Review node spec:
   ```bash
   cat _meta/02-nodes/node-XXX.md
   ```

3. Check context loading:
   ```bash
   ls _meta/cache/summary-*.md
   ```

### Memory/Token Issues

Adjust in `config.yaml`:
```yaml
context:
  max_context_window: 50000
  max_lines_per_file: 250
  max_file_size_kb: 50
```

### Slow Execution

Check parallelism settings:
```yaml
execution:
  parallelism:
    max_concurrent_nodes: 2  # Reduce if system overloaded
```

### Resume Not Working

Validate state.json:
```bash
python -m json.tool _meta/state.json
```

Check if nodes are marked as completed:
```bash
grep "completed_nodes" _meta/state.json
```

---

## Advanced Features

### Custom Analyzers

Add your own analysis agents in `opencode.json`:

```json
"my-custom-analyzer": {
  "model": "claude-opus-4-5",
  "mode": "subagent",
  "description": "My custom analysis",
  "prompt": ".opencode/prompt/my-custom-analyzer.md"
}
```

### Custom Skills

Add Python or TypeScript scripts in `.opencode/skill/` and reference in config:

```yaml
skills:
  startup_scripts:
    - "my_custom_script.py"
```

### Template Customization

Create custom templates following the v0 pattern:

```
.opencode/template/type/my-template-v1.template.md
```

Update references in `config.yaml`.

---

## Performance Optimization

### Token Usage
- Monitor `_meta/metrics.json` for token trends
- Use shorter file excerpts via `context.max_lines_per_file`
- Cache dependency summaries aggressively

### Execution Time
- Increase `max_concurrent_nodes` for parallel layers
- Use `prefetch_dependencies: true` in advanced config
- Consider breaking analysis into smaller repos

### Storage
- Compress `_meta/logs/` periodically
- Archive old summaries in `_meta/cache/`
- Use `cleanup_old_logs(days=30)` method

---

## Integration

### With ClickUp
The main `opencode.json` includes ClickUp integration. Configure:
```json
"mcp": {
  "clickup": {
    "headers": {
      "Authorization": "Bearer {env:CLICKUP_API_TOKEN}"
    }
  }
}
```

### With External Tools
Extend `.opencode/prompt/` with custom agent prompts for:
- JIRA integration
- GitHub integration
- Slack notifications
- Custom databases

---

## Version History

### v1.0.0
- Initial release
- 5-step orchestration pipeline
- 7 specialized agents
- 5 output templates
- 5 skill scripts
- Full configuration system
- Complete logging & metrics

---

## Support & Contribution

For issues or enhancements:
1. Check `_meta/logs/orchestrator.log`
2. Review configuration in `.opencode/config.yaml`
3. Examine prompt in `.opencode/prompt/`
4. Test with `/status` and `/debug` commands

---

**Maintained by**: spec-zero-lite team
**Last Updated**: 2025-01-19
**Documentation Version**: 1.0.0
