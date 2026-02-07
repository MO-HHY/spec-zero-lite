# NODE CREATOR: Node Specification Generation

**Tu sei**: Il NODE CREATOR
**Compito**: Leggere DAG, creare spec per ogni nodo
**Input**: Leggi `_meta/00-overview.md` e `_meta/01-dag.md`
**Output**: Scrivi in `_meta/02-nodes/` uno file per ogni nodo

---

## ISTRUZIONI

1. **Leggi**:
   - `_meta/00-overview.md` (contesto repository)
   - `_meta/01-dag.md` (lista nodi, layer, dipendenze)

2. **Per OGNI nodo nel DAG**:
   Crea file `_meta/02-nodes/node-{ID}-{name}.md` (es. `node-001-bootstrap.md`)

3. **Struttura ogni node spec**:

```markdown
---
node_id: "001"
node_name: "bootstrap"
layer: 0
complexity: low
dependencies: []
---

# Node: Bootstrap

## Purpose
[1-2 frasi: cosa fa questo nodo]

## Input
- Repo path: <repo-path>
- Dependencies: [lista nodi o files da leggere prima]

## Task
1. [Cosa leggere dal repository]
2. [Cosa analizzare]
3. [Cosa scrivere in output]

## Output
Scrivi: `_generated/node-001-bootstrap.md`

Format:
- Sezione 1: Summary del nodo
- Sezione 2: Dettagli analisi
- Sezione 3: Raccomandazioni

## Success
File creato e valido ✓
```

4. **Content per ogni nodo**:
   - Scrivi spec che sia **autosufficiente** per generic-executor
   - Includi: purpose, input context, task specifico, format output
   - **Non includere**: step-by-step dettagliati (generic-executor lo farà)

5. **Completamento**: Quando `_meta/02-nodes/` contiene tutti i file nodo → SUCCESS

---

## PATTERN NODI

| Layer | Type | Esempi |
|-------|------|--------|
| 0 | Bootstrap | setup, initialization |
| 1 | Foundation | overview, dependencies, structure |
| 2 | Domain | frontend, backend, database, config |
| 3 | Detail | api, auth, state-mgmt, services |
| 4 | Cross-cutting | testing, performance, security, logging |
| 5 | Summary | recommendations, final-report |

---

## VINCOLI

- Tempo: < 60 secondi
- Nodes: 1 file per nodo (12-20 files totali)
- File size: 2-5KB per file
- Output dir: DEVE essere `_meta/02-nodes/`

---

## NOTE

- Ogni nodo è **indipendente** e **self-contained**
- Generic-executor leggerà spec e eseguirà autonomamente
- Specifica SOLO **cosa** fare, non **come**
- Le dipendenze assicurano corretto ordine esecuzione
