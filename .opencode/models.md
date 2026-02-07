# Model Selection Strategy

**Version**: 1.0.0
**Last Updated**: 2025-01-19

---

## Overview

spec-zero-lite utilizza una **selezione intelligente dei modelli** basata sul ruolo dell'agente e sulla complessità del task. Questo documento descrive la strategia di selezione e la mappatura agente→modello.

## Available Models

| Model | Sigla | Use Case |
|-------|-------|----------|
| `google/antigravity-claude-opus-4-5-thinking` | **Opus** | Alto ragionamento, complessità elevata, contesto ampio |
| `google/antigravity-gemini-3-pro` | **Pro** | Alto contesto, analisi multisorgente, esecuzione variabile |
| `google/antigravity-claude-sonnet-4-5-thinking` | **Sonnet** | Analisi fine, scrittura precisa, formatting |
| `google/antigravity-gemini-3-flash` | **Flash** | Attività veloce, ripetitiva, basso contesto |

---

## Agent-Model Mapping

### 1. orchestrator → **Opus** (Claude Opus Thinking)
- **Role**: Coordinamento centrale (state machine)
- **Reasoning**: Alto - gestire 5 step sequenziali + error handling
- **Context**: Alto - carica state.json + overview + dag
- **Rationale**: Necessita massima qualità e ragionamento complesso

### 2. analyzer → **Pro** (Gemini 3 Pro)
- **Role**: Analisi iniziale repository
- **Context**: Molto alto - legge 20+ file per tech stack detection
- **Reasoning**: Medio-alto - inferire pattern da codice
- **Rationale**: Necessita contesto ampio per analizzare repo completi

### 3. dag-planner → **Opus** (Claude Opus Thinking)
- **Role**: Pianificazione DAG e dipendenze
- **Reasoning**: Molto alto - graph planning, cycle detection
- **Dependencies**: Analizza overview (50KB+)
- **Rationale**: Ragionamento strutturato su dipendenze

### 4. node-creator → **Opus** (Claude Opus Thinking)
- **Role**: Creazione spec per 15 nodi
- **Reasoning**: Molto alto - pianificazione nodo per nodo
- **Context**: Alto - overview + dag
- **Rationale**: Planning complesso per ogni nodo

### 5. generic-executor → **Pro** (Gemini 3 Pro)
- **Role**: Executor generico per qualsiasi nodo
- **Context**: Variabile - 50-100KB dipende da file + summaries
- **Frequency**: 15 volte - uno per nodo (parallelizzato)
- **Rationale**: Alto contesto + esecuzione parallela

### 6. standard-analyzer → **Sonnet** (Claude Sonnet Thinking)
- **Role**: Analizzatore modulare personalizzato
- **Context**: Medio - 30-50KB
- **Reasoning**: Medio-alto - analisi specifica dominio
- **Frequency**: Variabile - 10-30 esecuzioni custom
- **Rationale**: Analisi fine + costo moderato per esecuzioni multiple

### 7. documentation-writer → **Sonnet** (Claude Sonnet Thinking)
- **Role**: Generazione documentale
- **Context**: Basso - 20-30KB, output raw
- **Reasoning**: Basso - applicare template
- **Frequency**: 15+ volte - uno per nodo
- **Rationale**: Scrittura precisa + ripetitive

### 8. logging-manager → **Flash** (Gemini 3 Flash)
- **Role**: Logging e telemetria
- **Context**: Molto basso - < 10KB
- **Reasoning**: Nessuno - task deterministico
- **Frequency**: 100+ volte
- **Rationale**: Task veloce e deterministico

---

## Cost & Performance Analysis

### Estimated Token Usage per Execution

| Agent | Calls | Avg In | Avg Out | Total | Model | Cost |
|-------|-------|--------|---------|-------|-------|------|
| orchestrator | 1 | 80K | 5K | 85K | Opus | HIGH |
| analyzer | 1 | 100K | 20K | 120K | Pro | MED |
| dag-planner | 1 | 50K | 15K | 65K | Opus | HIGH |
| node-creator | 1 | 70K | 30K | 100K | Opus | HIGH |
| generic-executor | 15 | 60K | 20K | 1.2M | Pro | MED |
| standard-analyzer | 20 | 40K | 10K | 1.0M | Sonnet | LOW |
| documentation-writer | 20 | 30K | 5K | 700K | Sonnet | LOW |
| logging-manager | 100+ | 5K | 2K | 700K | Flash | VERY LOW |
| **TOTAL** | | | | **~4.5M** | | |

---

## Selection Criteria

### Complexity Level
- **HIGH (3+ dependencies)** → Opus
- **MEDIUM (1-3 dependencies)** → Sonnet
- **LOW (deterministic)** → Flash

### Context Requirements
- **VERY HIGH (>100KB)** → Pro
- **HIGH (50-100KB)** → Opus
- **MEDIUM (20-50KB)** → Sonnet
- **LOW (<20KB)** → Flash

### Output Quality Needs
- **Structured/Critical** → Opus
- **Precise/Formatted** → Sonnet
- **Fast/Simple** → Flash

### Execution Frequency
- **Single** → Opus (best quality)
- **Few (2-10)** → Sonnet (balanced)
- **Many (10+)** → Flash (cost-optimized)

---

## Best Practices

1. **Planning Phase**: Usa **Opus** per massima affidabilità
2. **High-Context Tasks**: Usa **Pro** per contesto ampio
3. **Iterative/Repeated**: Usa **Sonnet** per cost-effectiveness
4. **Utilities**: Usa **Flash** per minimizzare costo
5. **Monitor Tokens**: Traccia in `_meta/metrics.json`
6. **Progressive Optimization**: Opus → Sonnet → Flash
7. **Cache Aggressively**: Riusare sommari riduce context

---

**Document Version**: 1.0.0
**Strategy**: Cost-Optimized Intelligence Allocation
