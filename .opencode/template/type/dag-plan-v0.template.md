---
template_name: "dag-plan-v0"
template_type: "dag_plan"
version: "0.1.0"
description: "Template for DAG (Directed Acyclic Graph) execution planning"
---

# Dependency Analysis Plan (DAG)

**Generated from**: {{overview_path}}
**Generated at**: {{timestamp}}

## Execution Overview

This document defines the analysis plan as a directed acyclic graph (DAG) of nodes, showing dependencies and execution layers.

## Mermaid Diagram

```mermaid
graph TD
    {{#each nodes}}
    {{this.id}}["{{this.name}}"]
    {{/each}}
    {{#each edges}}
    {{this.from}} --> {{this.to}}
    {{/each}}
```

## Execution Layers

Analysis is organized into {{layer_count}} layers for optimal parallelization.

{{#each layers}}
### Layer {{this.number}}: {{this.name}}

**Execution**: {{#if this.parallel}}Parallel (max {{this.max_concurrent}} concurrent){{else}}Serial{{/if}}
**Estimated Duration**: {{this.estimated_duration}}

| Node ID | Node Name | Priority | Dependencies |
|---------|-----------|----------|--------------|
{{#each this.nodes}}
| {{this.id}} | {{this.name}} | {{this.priority}} | {{this.dependencies}} |
{{/each}}

{{/each}}

## Node Metadata

Detailed information for each analysis node:

{{#each nodes}}
### {{this.id}} - {{this.name}}

- **Layer**: {{this.layer}}
- **Type**: {{this.type}}
- **Priority**: {{this.priority}}
- **Dependencies**: {{this.dependencies}}
- **Estimated Duration**: {{this.estimated_duration}}
- **Prompt Reference**: {{this.prompt_ref}}

**Purpose**: {{this.purpose}}

**Output**: `{{this.output_path}}`

{{/each}}

## Critical Path Analysis

**Critical Path**: {{critical_path}}

**Total Duration**: {{total_duration}}

**Bottlenecks**:
{{#each bottlenecks}}
- {{this.node}}: {{this.reason}}
{{/each}}

## Context Injection Strategy

When nodes complete, their outputs are summarized and made available to dependent nodes:

```
{{execution_strategy}}
```

## Error Recovery Strategy

| Failure Type | Recovery Action |
|--------------|-----------------|
| Critical Node | Stop orchestration, save state |
| Non-critical Node | Mark failed, continue with independent nodes |
| Layer Timeout | Mark as partial, continue to next layer |
| Dependency Missing | Use fallback context if available |

## Performance Optimization Notes

- **Parallelization Opportunities**: {{parallelization_notes}}
- **Cache Strategy**: {{cache_strategy}}
- **Context Window Management**: {{context_strategy}}

## Timeline Estimate

```
{{timeline_visualization}}
```

---

**Document Version**: {{version}}
**Last Updated**: {{updated_at}}
