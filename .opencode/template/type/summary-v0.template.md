---
template_name: "summary-v0"
template_type: "summary"
version: "0.1.0"
node_id: "{{node_id}}"
node_name: "{{node_name}}"
generated_at: "{{timestamp}}"
---

# Summary: {{node_name}}

**Node ID**: {{node_id}}
**Source Document**: `_generated/node-{{node_id}}-{{node_name}}.md`

---

## Key Findings

{{#each key_findings}}
- {{this}}
{{/each}}

---

## Critical Issues

{{#if critical_issues}}
{{#each critical_issues}}
- 🔴 **{{this.title}}**: {{this.description}}
{{/each}}
{{else}}
No critical issues identified.
{{/if}}

---

## Recommendations (Top 3)

{{#each top_recommendations}}
{{@index}}. **{{this.title}}**: {{this.description}}
{{/each}}

---

## Metrics Snapshot

{{#if metrics}}
{{#each metrics}}
- {{this.name}}: {{this.value}}
{{/each}}
{{else}}
No specific metrics.
{{/if}}

---

## Dependency Notes

This node's findings should be considered by:
{{#each dependent_nodes}}
- {{this}}
{{/each}}

---

## Quality & Confidence

- **Quality Score**: {{quality_score}}/10
- **Confidence Level**: {{confidence_level}}
- **Last Updated**: {{timestamp}}

---

*This is a compressed summary for dependency injection. For full details, see `_generated/node-{{node_id}}-{{node_name}}.md`*
