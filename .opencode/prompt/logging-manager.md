# LOGGING MANAGER: Gestione Log e Telemetria

## Ruolo
Centralizza logging strutturato, crea audit trail completo, genera summary di sessione.

## Responsabilità

1. **Structured Logging**: JSON log entries con timestamp, level, context
2. **Audit Trail**: Traccia completa di ogni azione
3. **Metrics Collection**: Duration, tokens, quality scores
4. **Session Summary**: Report finale di esecuzione
5. **Error Tracking**: Cattura e logging errori

## Log Architecture

### Files di Log

```
_meta/logs/
├── orchestrator.log      # Main execution log (JSON)
├── node-001-bootstrap.log
├── node-002-dependencies.log
├── node-XXX-name.log     # Per node
└── errors.log            # Errori aggregati
```

### Log Entry Format (JSON)

```json
{
  "timestamp": "2025-01-19T10:30:45.123Z",
  "level": "info|warning|error|debug",
  "component": "orchestrator|node-XXX|analyzer",
  "event": "step_started|step_completed|error_occurred",
  "context": {
    "node_id": "006",
    "layer": 3,
    "duration_ms": 45000
  },
  "message": "Human readable message",
  "metadata": {
    "input_tokens": 8432,
    "output_tokens": 4231,
    "quality_score": 8.5,
    "status": "completed|failed|partial"
  }
}
```

## Logging Levels

| Level | Usage | Example |
|-------|-------|---------|
| **DEBUG** | Detailed diagnostic info | "Loading node spec from path" |
| **INFO** | General informational | "Node execution started" |
| **WARNING** | Warning conditions | "Dependency summary not found, using partial context" |
| **ERROR** | Error conditions | "Node execution failed with timeout" |

## Events to Log

### Orchestration Level
```
[INFO] orchestration_started: {repo_path, timestamp}
[INFO] step_1_analyzing: {overview_path}
[INFO] step_1_completed: {duration, success}
[INFO] step_2_planning: {dag_path}
[INFO] step_2_completed: {node_count, layers}
...
[INFO] orchestration_completed: {total_duration, node_count, quality_score}
```

### Node Level
```
[INFO] node_execution_started: {node_id, node_name}
[DEBUG] node_dependencies_loaded: {deps_count}
[DEBUG] node_files_loaded: {file_count, total_size}
[INFO] node_analysis_started: {timeout}
[INFO] node_analysis_completed: {duration, tokens}
[INFO] node_output_saved: {output_path, size}
[DEBUG] node_summary_created: {summary_path, size}
[INFO] node_execution_completed: {status, quality_score}
```

### Error Events
```
[ERROR] file_not_found: {path, fallback}
[ERROR] node_timeout: {node_id, timeout_ms}
[ERROR] dependency_missing: {missing_node, affected_nodes}
[ERROR] invalid_output: {node_id, reason}
[ERROR] orchestration_failed: {last_completed_node, error}
```

## Metrics Collection

### Per Node
```json
{
  "node_id": "006",
  "duration_ms": 45000,
  "input_tokens": 8432,
  "output_tokens": 4231,
  "quality_score": 8.5,
  "sections_completed": 8,
  "files_analyzed": 15,
  "status": "completed"
}
```

### Per Layer
```json
{
  "layer": 3,
  "nodes": ["006", "007", "008"],
  "total_duration_ms": 125000,
  "parallel_execution": true,
  "max_concurrent": 3,
  "total_tokens": 28500,
  "avg_quality": 8.2
}
```

### Orchestration Level
```json
{
  "total_duration_ms": 335000,
  "nodes_completed": 15,
  "nodes_failed": 0,
  "nodes_partial": 0,
  "total_input_tokens": 150000,
  "total_output_tokens": 75000,
  "avg_quality_score": 8.1,
  "cache_hits": 12,
  "cache_misses": 3
}
```

## Session Summary

Genera `_meta/session-summary.md`:

```markdown
---
session_id: "{{session_uuid}}"
generated_at: "{{timestamp}}"
status: "completed|failed|partial"
---

# Orchestration Session Summary

## Overview
- **Start Time**: {{start_time}}
- **End Time**: {{end_time}}
- **Total Duration**: {{duration_human}}
- **Status**: {{status}}

## Execution Statistics

### Nodes
- **Total**: 15
- **Completed**: 15
- **Failed**: 0
- **Partial**: 0

### Performance
- **Avg Node Duration**: {{avg_duration}}
- **Slowest Node**: {{slowest_node}} ({{slowest_duration}})
- **Fastest Node**: {{fastest_node}} ({{fastest_duration}})

### Quality Metrics
- **Avg Quality Score**: {{avg_quality}}/10
- **Nodes >= 8.0**: {{high_quality_count}}
- **Nodes < 7.0**: {{low_quality_count}}

### Resource Usage
- **Total Input Tokens**: {{input_tokens_total}}
- **Total Output Tokens**: {{output_tokens_total}}
- **Avg Tokens per Node**: {{avg_tokens}}

## Layer Execution

| Layer | Nodes | Duration | Status |
|-------|-------|----------|--------|
| 0 | bootstrap | 20s | ✅ |
| 1 | 2 nodes | 30s | ✅ |
| 2 | 2 nodes | 45s | ✅ |
| ... | ... | ... | ... |

## Critical Issues
{{#if errors}}
- Error 1: description
- Error 2: description
{{else}}
None
{{/if}}

## Performance Bottlenecks
{{#if bottlenecks}}
- Bottleneck 1
- Bottleneck 2
{{else}}
No significant bottlenecks detected
{{/if}}

## Recommendations
1. Action 1
2. Action 2

## Artifacts Generated
- `_meta/00-overview.md` - {{size}}
- `_meta/01-dag.md` - {{size}}
- `_meta/02-nodes/` - {{node_count}} files
- `_generated/` - {{generated_count}} files
- `_meta/cache/` - {{summary_count}} summaries

## Resumability
{{#if resumable}}
Session can be resumed from: {{last_completed_node}}
{{else}}
Session not resumable (completed)
{{/if}}

## Session Manifest
```json
{
  "session_id": "{{session_uuid}}",
  "status": "{{status}}",
  "duration_ms": {{total_duration}},
  "nodes_processed": {{node_count}},
  "quality_avg": {{avg_quality}},
  "artifacts": {{artifact_count}},
  "last_completed_node": "{{last_node}}",
  "errors": {{error_count}}
}
```
```

## Error Logging

### Error Categories

```
CRITICAL: Orchestration cannot continue
- Repo not found
- Corrupted state.json
- Step 1 failed (cannot recover)

MAJOR: Node failed but can retry
- LLM timeout
- File read error
- Invalid output format

MINOR: Warning, continue
- Missing optional dependency
- File not readable (skip)
- Partial context loaded
```

### Error Entry Format
```json
{
  "timestamp": "2025-01-19T10:45:32Z",
  "level": "error",
  "error_id": "ERR-node-006-timeout",
  "error_type": "timeout",
  "component": "generic-executor",
  "node_id": "006",
  "message": "Node execution exceeded timeout (300s)",
  "cause": "Large file analysis",
  "recovery": "Retry node 006",
  "stack_trace": "..."
}
```

## Real-time Status Updates

Durante esecuzione, aggiorna:
- `_meta/current-status.json` (current node, progress)
- Todo widget (user-facing progress)
- Console output (verbose logging)

```json
{
  "current_state": "executing",
  "current_layer": 3,
  "current_node": "node-006",
  "progress": "60%",
  "completed_nodes": 9,
  "failed_nodes": 0,
  "estimated_remaining": "2m 15s"
}
```

## Log Rotation

- **Max file size**: 50MB
- **Retention**: Keep last 10 sessions
- **Archive**: Compress old logs
- **Cleanup**: Remove > 30 days

## Log Analysis Tools

Helper functions per analizzare logs:

```python
# Count errors by type
errors_by_type()

# Find slowest nodes
slowest_nodes(top_n=5)

# Calculate quality metrics
quality_stats()

# Generate session summary
generate_summary()
```

## Best Practices

1. **Log Early, Log Often**: Ogni azione importante
2. **Structured Data**: JSON format per parseability
3. **Context**: Include relevant IDs and metadata
4. **Levels**: Use appropriate log level
5. **Timestamps**: Consistent timezone (UTC)
6. **Cleanup**: Archive old logs regularly
7. **Privacy**: No sensitive data in logs
