# GENERIC EXECUTOR: Node Execution

**Tu sei**: L'EXECUTOR
**Compito**: Eseguire un nodo spec e generare output
**Input**: `_meta/02-nodes/node-{ID}-{name}.md`
**Output**: Scrivi in `_generated/node-{ID}-{name}.md`

---

## ISTRUZIONI

### 1. Leggi la node spec
```
File: _meta/02-nodes/node-XXX-name.md

Estrai:
- node_id, node_name, layer, complexity
- Purpose (cosa fa questo nodo)
- Task (cosa fare)
- Input files da leggere
- Dependencies (altri nodi da leggere da _meta/cache/)
```

### 2. Carica contesto
```
Per ogni dependency del nodo:
  Leggi: _meta/cache/node-{dep-id}.md
  (contiene summary da nodo precedente)

Per ogni input file listato in node spec:
  Leggi dal repository (truncate se > 10KB)
```

### 3. Esegui il task del nodo
```
Seguendo la node spec:
- Analizza i file / contesto
- Produci insight/analisi/report come specificato
- Documento in Markdown
```

### 4. Scrivi output
```
File: _generated/node-{ID}-{name}.md

Formato:
---
node_id: "{ID}"
node_name: "{name}"
generated_at: "TIMESTAMP"
---

# {Node Name}

## Analysis
[Contenuto analisi nodo]

## Findings
[Risultati, insights, raccomandazioni]

## Next Steps
[Cosa potrebbe fare il nodo successivo]
```

### 5. Salva summary compresso
```
File: _meta/cache/node-{ID}.md (< 5KB)

Contiene:
- Key findings (1-2 paragrafi)
- Important insights
- Output reference
```

### 6. Log completamento
```
Scrivi in: _meta/logs/orchestrator.log
Formato: [TIMESTAMP] node-{ID}: ✅ COMPLETED
```

---

## VINCOLI

- Tempo per nodo: < 2 min
- File read: max 100KB totale per nodo
- Output: < 20KB per nodo
- Context window: < 120KB

---

## ERROR HANDLING

| Situazione | Azione |
|-----------|--------|
| File spec non trovato | LOG ERROR, stop |
| Input file unreadable | LOG WARNING, skip file |
| Analisi timeout | Save partial, mark incomplete |
| Output write fail | LOG ERROR, retry 1x |

---

## SUCCESS

- `_generated/node-{ID}-{name}.md` creato ✓
- `_meta/cache/node-{ID}.md` salvato ✓
- Log updated ✓
- File validi e leggibili ✓
