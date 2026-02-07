# SPEC-ZERO-LITE: Correzioni Apportate

**Data**: 2025-01-19
**Versione**: 2.0 (Fixed Architecture)

---

## PROBLEMI IDENTIFICATI NEL SISTEMA ORIGINALE

### 1. ❌ Mancanza di Delegazione
**Problema**: L'orchestratore eseguiva direttamente l'analisi anziché delegare ai sub-agent
- Consumava il suo contesto per analisi (operazione vietata)
- Non c'era separazione chiara tra coordinamento e esecuzione
- Impossibile scalare con parallelizzazione

**Soluzione**: Orchestratore è **SOLO coordinatore**
- Delega TUTTO con `/task` ai sub-agent
- Mantiene stato in `_meta/state.json`
- Monitora completion leggendo file (non aspetta risposte sincrone)

---

### 2. ❌ Prompt Troppo Dettagliati
**Problema**: I prompt dei sub-agent avevano 200+ linee di istruzioni step-by-step
- Creavano confusione
- Dicevano AL PLACE DI CHE FARE COSA NON COME
- Sub-agent non erano autonomi

**Soluzione**: Prompt **MINIMALI E CHIARI**
```
Prima (❌):
  [250 linee di dettagli, step-by-step, esempi complicati]

Dopo (✅):
  Sei: ANALYZER
  Input: <repo-path>
  Compito: Analizza repo
  Output: _meta/00-overview.md
  [Solo questi 4 elementi]
```

---

### 3. ❌ Mancanza di Parallelizzazione DAG
**Problema**: I nodi venivano eseguiti in serie, non in parallelo
- Il DAG era creato ma non usato per esecuzione
- Tempo totale molto più lungo
- Non c'era visibilità su quali nodi potevano eseguire insieme

**Soluzione**: **Parallelizzazione esplicita per LAYER**
```
STEP 5: Per ogni LAYER nel DAG:
  for each node in layer:
    /task generic-executor node_id (NON aspettare)
  Aspetta: tutti i nodi in layer completati
  Aggiorna TODO widget
  Procedi al prossimo layer
```

---

### 4. ❌ Nessun Sistema di Logging Trovabile
**Problema**: I log non erano centralizzati e non erano trovabili
- Ogni sub-agent loggava in posti diversi
- Orchestrator non aveva traccia delle azioni
- Debugging impossibile

**Soluzione**: **Logging centralizzato in `_meta/logs/orchestrator.log`**
```
[TIMESTAMP] AGENT: ✅ ACTION_DESCRIPTION
[TIMESTAMP] AGENT: ❌ ERROR_DESCRIPTION
```
- Singolo file, TUTTI i log qui
- Facile da leggere e seguire l'esecuzione
- Perfetto per debugging

---

### 5. ❌ Orchestrator "si perde" (No state tracking)
**Problema**: Nessuna visibilità su stato dell'esecuzione
- Orchestrator non sapeva se stava completando il primo o ultimo step
- Nessun modo di riprendere da un failure
- L'utente non vedeva cosa stava succedendo

**Soluzione**: **TODO WIDGET + state.json**
- Orchestrator crea TODO list con 6 step principali
- Aggiorna widget in REAL-TIME durante esecuzione
- `_meta/state.json` mantiene stato persistente
- Resumable: se interruzione, riprendi dal punto esatto

---

### 6. ❌ Sub-agent Non Autonomi
**Problema**: I sub-agent non sapevano leggere il contesto e iniziare autonomamente
- Avevano troppi dettagli
- Non capivano il loro ruolo specifico
- Chiedevano istruzioni step-by-step

**Soluzione**: **Sub-agent Autonomi con Ruolo Chiaro**
- Ogni sub-agent riceve prompt minimalista
- Legge il suo prompt → capisce ruolo, input, output
- Esegue AUTONOMAMENTE senza istruzioni ulteriori
- Nessuna domanda, nessun chiedere aiuto
- Riporta completamento in log

---

## NUOVA ARCHITETTURA

### Struttura del Workflow

```
ORCHESTRATOR (Coordinatore)
  │
  ├─ /task ANALYZER → _meta/00-overview.md
  │  (attendi completion)
  │
  ├─ /task DAG-PLANNER → _meta/01-dag.md
  │  (attendi completion)
  │
  ├─ /task NODE-CREATOR → _meta/02-nodes/*.md
  │  (attendi completion)
  │
  ├─ PREPARATION (locale)
  │  - Leggi _meta/02-nodes/
  │  - Crea TODO layer execution
  │  - Salva state.json
  │
  ├─ PER OGNI LAYER (PARALLELO):
  │  ├─ /task EXECUTOR node-001 (max 4 concurrent)
  │  ├─ /task EXECUTOR node-002
  │  ├─ /task EXECUTOR node-003
  │  └─ /task EXECUTOR node-004
  │  → Aspetta tutti → Procedi layer successivo
  │
  └─ FINALIZATION (locale)
     - Crea manifest.json
     - Mostra statistiche finali
```

### File Modificati/Creati

| File | Tipo | Descrizione |
|------|------|-------------|
| `.opencode/prompt/orchestrator-main.md` | REWRITTEN | Orchestrator è COORDINATORE, non executor |
| `.opencode/prompt/step1-analyzer.md` | SIMPLIFIED | Da 250 a 77 linee |
| `.opencode/prompt/step2-dag-planner.md` | SIMPLIFIED | Da 200 a 109 linee |
| `.opencode/prompt/step3-node-creator.md` | SIMPLIFIED | Da 200 a 93 linee |
| `.opencode/prompt/step5-generic-executor.md` | SIMPLIFIED | Da 200 a 109 linee |
| `.opencode/AGENTS_EXECUTION_PATTERN.md` | NEW | Template per sub-agent autonomi |
| `.opencode/CORRECTIONS_APPLIED.md` | NEW | Questo file |

---

## COME USARE IL NUOVO SISTEMA

### 1. Avviare un'analisi

```bash
/start /path/to/repo
```

L'orchestrator:
- Crea TODO widget con 6 step
- Inizia delegazione sequenziale
- Aggiorna TODO widget in real-time
- Mostra risultati finali

### 2. Tracciare lo stato

**Guardare il TODO widget** (fonte di verità)
- Vedi step completati/in_progress/pending
- Vedi layer che sta eseguendo
- Vedi nodi completati per layer

**Leggere i log** (per dettagli)
```bash
cat _meta/logs/orchestrator.log
```

**Verificare lo stato** (persistente)
```bash
cat _meta/state.json
```

### 3. Se qualcosa fallisce

1. Guarda `_meta/logs/orchestrator.log` per l'errore
2. Leggi la node spec in `_meta/02-nodes/` per capire cosa doveva fare
3. Controlla se l'output parziale esiste in `_generated/`
4. Riprova con `/start` per ricominciare da capo (o implementa `/resume`)

---

## DIFFERENZE PRINCIPALI

### PRIMA (Broken)
```
Orchestrator → esegue analisi direttamente (MALE)
           → dettagli tutto, crea confusione
           → nessun logging
           → nessuna visibilità stato
           → nodi eseguiti in serie
           → context consumption massimale
```

### DOPO (Fixed)
```
Orchestrator → SOLO delega con /task (BENE)
           → prompt minimali e chiari
           → logging centralizzato in .log
           → TODO widget mostra stato real-time
           → nodi eseguiti in parallelo per layer
           → context consumption minimale
```

---

## PARADIG M SHIFT

### Da "Execution" a "Coordination"

L'orchestrator **NON** è un executor che fa il lavoro.

L'orchestrator è un **coordinatore** che:
1. Delega tutto ai sub-agent
2. Monitora completamento (leggendo file)
3. Coordina parallelizzazione (layer-based)
4. Mantiene stato (state.json + TODO widget)
5. Gestisce logging centralizzato

Se l'orchestrator inizia a fare logica di business → il sistema è rotto.

---

## PROSSIMI PASSI

1. ✅ Correzioni completate
2. ⏳ Testare il nuovo workflow su un progetto reale
3. ⏳ Implementare `/resume` per riprendere da failure
4. ⏳ Aggiungere `/debug <node-id>` per debug specifico
5. ⏳ Monitoring avanzato e metriche

---

## VERIFICA CHE FUNZIONA

Per verificare che il nuovo sistema funziona:

```bash
cd spec-zero-lite

# Setup (una volta)
npm install
pip install pyyaml

# Test su un progetto piccolo
/start .

# Guarda il TODO widget
# Leggi _meta/logs/orchestrator.log
# Verifica che _generated/ ha output
# Controlla manifest.json per statistiche
```

Se tutto funziona:
- ✅ TODO widget mostra 6 step
- ✅ Log file ha traccia completa
- ✅ Nodi eseguiti in parallelo per layer
- ✅ Output in `_generated/` per ogni nodo
- ✅ Nessun errore di "orchestrator doing work"

---

## SUPPORTO

Tutti i file sono **self-documented**:
- `orchestrator-main.md` - Spiega cosa fa orchestrator
- `step*-*.md` - Spiega ruolo di ogni sub-agent
- `AGENTS_EXECUTION_PATTERN.md` - Spiega come sub-agent devono funzionare
- `_meta/logs/orchestrator.log` - Traccia completa esecuzione
- `_meta/state.json` - Stato attuale

Se non capisce qualcosa, leggi questi file.

---

**Status**: ✅ Correzioni Completate | Pronto per Testing
