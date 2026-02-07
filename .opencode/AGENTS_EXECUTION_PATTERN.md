# Sub-Agent Execution Pattern

## Come i Sub-Agent devono funzionare

Ogni sub-agent riceve un prompt dal file `.opencode/prompt/` che dice ESATTAMENTE:
1. Che ruolo hai
2. Qual è il tuo input (il path)
3. Cosa devi fare
4. Dove scrivere l'output

**Niente altro. Niente dettagli step-by-step.**

---

## PATTERN UNIVERSALE per tutti i Sub-Agent

### 1. LEGGI IL TUO PROMPT
Quando ricevi `/task <agent-name> "<instructions>"`, il prompt viene dal file `.opencode/prompt/<agent-file>.md`.

Esempio per `analyzer`:
```
/task analyzer "
LEGGI IL REPOSITORY:
  path: <repo-path>

ANALIZZA:
  - Tech stack
  - Architettura
  - Features

SCRIVI in _meta/00-overview.md
"
```

### 2. ASSUMI IL TUO RUOLO
```
TU SEI: L'ANALYZER
Il tuo compito: Analizzare repository
Il tuo input: <repo-path>
Il tuo output: _meta/00-overview.md
```

### 3. LEGGI L'INPUT
```
Input è il PATH che ricevi nel prompt:
- Se è un file: leggilo
- Se è una directory: esplorala
- Se è un reference a file precedente (_meta/...): leggilo

ESEMPIO:
- Input: "/path/to/repo" → Leggi da filesystem
- Input: "_meta/00-overview.md" → Leggi da _meta/
```

### 4. ESEGUI IL COMPITO (Autonomamente)
```
Segui le istruzioni nel prompt:
- Analizza, pianifica, crea spec, esegui, ecc.
- Nessuno ti dirà step-by-step cosa fare
- Il prompt descrive il "cosa", tu decidi il "come"
```

### 5. SCRIVI L'OUTPUT NEL POSTO CORRETTO
```
Output path è sempre nel prompt:
- _meta/00-overview.md
- _meta/01-dag.md
- _meta/02-nodes/
- _generated/node-XXX.md
- _meta/cache/
- _meta/logs/

SEMPRE scrivi nel path specificato nel prompt.
MAI inventare nuovi path.
```

### 6. RIPORTA COMPLETAMENTO
```
Quando finito:
- Scrivi in _meta/logs/orchestrator.log: [TIMESTAMP] agent: ✅ COMPLETED
- Se errore: [TIMESTAMP] agent: ❌ ERROR - [reason]
```

---

## ESEMPIO CONCRETO: ANALYZER

### Ricevi dal Orchestrator:
```
/task analyzer "
LEGGI IL REPOSITORY:
  path: /path/to/bleutils-js

ANALIZZA:
  - Tech stack
  - Architettura
  - Features

SCRIVI in _meta/00-overview.md
"
```

### Tu (analyzer) fai:

1. **Assumi il ruolo**: "Sono l'ANALYZER"
2. **Capisco l'input**: "/path/to/bleutils-js"
3. **Eseguo il compito**:
   - Vado a `/path/to/bleutils-js`
   - Leggo `package.json`, `src/`, README, etc.
   - Analizo tech stack, architettura, features
4. **Scrivo l'output**:
   - Credo file: `_meta/00-overview.md`
   - Formato: Markdown con sezioni specifiche
5. **Riporto**:
   - Scrivo in `_meta/logs/orchestrator.log`: "✅ analyzer completed"

### Fine.

L'orchestrator sa che hai finito quando:
- File `_meta/00-overview.md` esiste e è leggibile
- Oppure legge il log se vuol verificare

---

## ERRORI COMUNI DA EVITARE

❌ **NON FARE**:
- Non aspettare istruzioni step-by-step (non arriveranno)
- Non inventare nuovi path di output
- Non chiedere al orchestrator "cosa faccio adesso?"
- Non ignorare le dipendenze (leggi i file precedenti da _meta/)
- Non creare file in path random

✅ **FAI**:
- Leggi il prompt del tuo agente
- Capisco il ruolo, input, output
- Esegui autonomamente
- Scrivi nel path specificato
- Riporta nel log

---

## VINCOLI UNIVERSALI

Tutti i sub-agent rispettano:

| Aspetto | Vincolo |
|---------|---------|
| **Input** | Path ricevuto nel prompt (file o directory) |
| **Output** | Path specificato nel prompt (MAI cambiare) |
| **Dipendenze** | Leggi da `_meta/cache/` se specificate |
| **Tempo** | Segui timing nel prompt (< 45s, < 2 min, etc.) |
| **Logging** | Scrivi completamento in `_meta/logs/orchestrator.log` |
| **Format** | Segui formato output nel prompt |
| **Context** | Carichi SOLO ciò che serve (< 120KB) |

---

## AUTONOMIA È LA CHIAVE

L'intero design si basa su **sub-agent autonomi**:
- Non ringano il coordinatore
- Non chiedono conferma
- Non scaliano problemi banali
- Leggono il loro prompt, capiscono il compito, lo eseguono

**Se questo non accade, il sistema fallisce.**

---

## Per i Sub-Agent IMPLEMENTATI

### ANALYZER (step1-analyzer.md)
- Input: `<repo-path>`
- Output: `_meta/00-overview.md`
- Autonomy: Legge tutto da filesystem, decide cosa è rilevante

### DAG-PLANNER (step2-dag-planner.md)
- Input: `_meta/00-overview.md`
- Output: `_meta/01-dag.md`
- Autonomy: Pianifica DAG senza aiuto, decide layers e dipendenze

### NODE-CREATOR (step3-node-creator.md)
- Input: `_meta/00-overview.md`, `_meta/01-dag.md`
- Output: `_meta/02-nodes/node-*.md` (uno per nodo)
- Autonomy: Crea spec per ogni nodo, decide contenuti

### GENERIC-EXECUTOR (step5-generic-executor.md)
- Input: `_meta/02-nodes/node-XXX.md`
- Output: `_generated/node-XXX.md`, `_meta/cache/node-XXX.md`
- Autonomy: Esegue nodo, legge dipendenze, produce output

---

## Orchestrator NON è autonomo

L'orchestrator è il **coordinatore**, NON un executor:
- Delega SEMPRE con `/task`
- Non esegue logica di business
- Monitora completion leggendo file
- Mantiene stato in `_meta/state.json`
- Coordina parallelizzazione per layer

**Se orchestrator fa logica di business, il sistema è rotto.**
