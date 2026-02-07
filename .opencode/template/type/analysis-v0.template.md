---
template_name: "analysis-v0"
template_type: "analysis_report"
version: "0.1.0"
description: "Template for initial repository analysis report (00-overview.md)"
sections:
  - summary
  - tech_stack
  - project_type
  - structure
  - features
  - dependencies
  - assessment
---

# {{project_name}} - Repository Analysis Overview

**Analysis Date**: {{analyzed_at}}

## Executive Summary

{{#if summary}}
{{summary}}
{{else}}
[Insert 2-3 sentence executive summary describing the project's purpose and key characteristics]
{{/if}}

## Tech Stack

### Languages
{{#each languages}}
- {{this}}
{{/each}}

### Frameworks & Libraries
{{#each frameworks}}
- {{this}}
{{/each}}

### Databases & Storage
{{#each databases}}
- {{this}}
{{/each}}

### Tools & Infrastructure
{{#each tools}}
- {{this}}
{{/each}}

## Project Type

**Type**: `{{project_type}}`

**Description**: {{project_type_description}}

## Directory Structure

{{#if directory_tree}}
```
{{directory_tree}}
```
{{else}}
[Include ASCII tree of repository structure]
{{/if}}

## Core Features

### Feature 1
**Description**: [What does this feature do?]
**Location**: {{feature_1_location}}
**Key Components**: [List components]

### Feature 2
**Description**: [What does this feature do?]
**Location**: {{feature_2_location}}
**Key Components**: [List components]

### Feature 3
**Description**: [What does this feature do?]
**Location**: {{feature_3_location}}
**Key Components**: [List components]

## Key Files & Entry Points

| File | Purpose | Type |
|------|---------|------|
| {{file_1}} | {{file_1_purpose}} | {{file_1_type}} |
| {{file_2}} | {{file_2_purpose}} | {{file_2_type}} |
| {{file_3}} | {{file_3_purpose}} | {{file_3_type}} |

## Dependencies Overview

### Production Dependencies
{{#each prod_dependencies}}
- `{{@key}}@{{this}}` - {{description}}
{{/each}}

### Development Dependencies
{{#each dev_dependencies}}
- `{{@key}}@{{this}}` - {{description}}
{{/each}}

## Code Patterns & Conventions

### Naming Conventions
- **Variables**: {{naming_variables}}
- **Classes**: {{naming_classes}}
- **Constants**: {{naming_constants}}
- **Files**: {{naming_files}}

### Error Handling Strategy
{{error_handling_strategy}}

### Testing Approach
- **Framework**: {{testing_framework}}
- **Coverage Target**: {{testing_coverage_target}}
- **Test Locations**: {{testing_locations}}

## Documentation Quality Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| README | {{readme_status}} | {{readme_notes}} |
| API Docs | {{api_docs_status}} | {{api_docs_notes}} |
| Inline Comments | {{comments_status}} | {{comments_notes}} |
| Architecture Docs | {{arch_docs_status}} | {{arch_docs_notes}} |

## Key Findings

### Strengths
- {{strength_1}}
- {{strength_2}}
- {{strength_3}}

### Areas for Improvement
- {{improvement_1}}
- {{improvement_2}}
- {{improvement_3}}

### Potential Risks
- {{risk_1}}: {{risk_1_mitigation}}
- {{risk_2}}: {{risk_2_mitigation}}

## Analysis Recommendations

### Priority 1 - Critical
1. {{critical_1}}: {{critical_1_rationale}}

### Priority 2 - High
1. {{high_1}}: {{high_1_rationale}}
2. {{high_2}}: {{high_2_rationale}}

### Priority 3 - Medium
1. {{medium_1}}: {{medium_1_rationale}}

## Next Steps

This analysis will feed into the following phase:

**Phase 2: DAG Planning**
- Generate dependency graph for analysis nodes
- Define execution layers
- Establish analysis sequence

**Phase 3: Node Creation**
- Create specifications for each analysis node
- Define context injection points
- Prepare execution environment

---

**Analysis Tool**: spec-zero-lite
**Analyzer Version**: 1.0.0
