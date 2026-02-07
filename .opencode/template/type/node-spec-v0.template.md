---
template_name: "node-spec-v0"
template_type: "node_spec"
version: "0.1.0"
node_id: "{{node_id}}"
node_name: "{{node_name}}"
layer: {{layer}}
---

# Node Specification: {{node_name}}

**Node ID**: {{node_id}}
**Layer**: {{layer}}
**Priority**: {{priority}}
**Estimated Duration**: {{estimated_duration}}

## Purpose

{{purpose}}

## Layer & Dependencies

- **Layer**: {{layer}}
- **Dependencies**: {{#each dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- **Depended By**: {{#each depended_by}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

## Analysis Scope

### What to Analyze

{{#each analysis_items}}
- {{this}}
{{/each}}

### Key Questions to Answer

{{#each key_questions}}
{{@index}}. {{this}}
{{/each}}

### Output Format

The analysis should be structured as:

{{#each output_sections}}
- **{{this.name}}**: {{this.description}}
{{/each}}

## Execution Instructions

### Step 1: Load Dependencies
- Load summaries from `_meta/cache/` for: {{#each dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
- Inject dependency context into analysis prompt

### Step 2: Examine Files
Read and analyze the following files (prioritized):
{{#each files}}
- `{{this.path}}` - {{this.description}}
{{/each}}

### Step 3: Perform Analysis
- Answer all key questions with evidence from code
- Generate diagrams as specified in output format
- Validate findings against dependencies

### Step 4: Generate Output
- Create markdown document following output sections
- Save to: `_generated/node-{{node_id}}-{{node_name}}.md`
- Create summary to: `_meta/cache/summary-{{node_id}}.md`

### Step 5: Validate & Log
- Validate output markdown
- Append success log to `_meta/logs/orchestrator.log`
- Update state with completion metadata

## Acceptance Criteria

- [ ] All key questions answered comprehensively
- [ ] Evidence provided from code analysis
- [ ] Output sections match specified format
- [ ] Markdown is valid and renders properly
- [ ] No unresolved placeholders remain
- [ ] Diagrams (if required) are properly formatted
- [ ] Quality score >= 7.0/10
- [ ] Execution time <= {{estimated_duration}}

## Dependencies Context

{{#each dependencies}}
### {{this}}

This node depends on `{{this}}`. The following context from that node's summary should inform your analysis:

[Will be injected at execution time from `_meta/cache/summary-{{this}}.md`]

{{/each}}

## Input Files

Maximum file examination budget:
- **Total input**: {{max_input_size}}
- **Per file**: {{max_file_size}}
- **File count**: {{max_file_count}}

Files will be truncated if they exceed size limits. Priority files will be included first.

## Output Specifications

### Main Output

**Path**: `_generated/node-{{node_id}}-{{node_name}}.md`
**Max Size**: {{max_output_size}}
**Format**: Markdown with YAML frontmatter

### Summary (for downstream nodes)

**Path**: `_meta/cache/summary-{{node_id}}.md`
**Max Size**: {{summary_max_size}}
**Format**: Markdown (compressed version of findings)

### Logging

**Path**: `_meta/logs/node-{{node_id}}.log`
**Format**: JSON line-delimited entries

## Quality Scoring

Output will be evaluated on:

| Criterion | Weight |
|-----------|--------|
| Completeness | 50% |
| Clarity | 20% |
| Actionability | 15% |
| Evidence | 15% |

**Target Score**: >= 7.0/10

## Special Instructions

{{#if special_instructions}}
{{special_instructions}}
{{else}}
None
{{/if}}

## Failure Handling

If this node cannot be completed:
1. Log detailed error with context
2. Save partial output if available
3. Mark as "failed" in `_meta/state.json`
4. Continue with independent nodes
5. Return to this node if dependencies are resolved

---

**Template Version**: {{version}}
**Created**: {{created_at}}
