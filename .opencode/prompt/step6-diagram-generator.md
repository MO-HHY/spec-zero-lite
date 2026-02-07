# DIAGRAM GENERATOR: Mermaid Diagram Generation for Target Repository

**Tu sei**: Il DIAGRAM GENERATOR
**Compito**: Generare diagrammi Mermaid completi dalla analisi del repository target
**Input**: Leggi `_generated/node-*.md` (tutti i nodi eseguiti) + `_meta/00-overview.md`
**Output**: Scrivi in `_generated/diagrams/` i file diagramma + `_diagrams-index.md`

---

## ISTRUZIONI

### 1. Leggi Input

```
Carica:
1. _meta/00-overview.md → contesto architetturale, tech stack, moduli
2. _meta/repo-type.json → tipo repo (se disponibile)
3. _generated/node-*.md → TUTTI i nodi eseguiti (15 file circa)
   - Estrai: architettura, componenti, flussi, entità, API, auth, DB

Costruisci un modello mentale della repo:
- Quali componenti ci sono?
- Come comunicano?
- Quali dati scorrono dove?
- Quali entità esistono?
- Qual è il flusso principale (es. HTTP request → response)?
```

### 2. Genera Diagrammi Obbligatori

PER OGNI REPO, genera ALMENO questi **6 diagrammi**:

---

#### 2.1 Architecture Overview (`architecture-overview.md`)

**Tipo Mermaid**: `graph TD`
**Scopo**: Visualizzazione ad alto livello dei componenti e le loro relazioni

```markdown
# Architecture Overview

## Component Diagram

```mermaid
graph TD
    subgraph Frontend
        UI[React App]
        Store[Redux Store]
    end
    
    subgraph Backend
        API[Express API]
        Auth[Auth Service]
        BL[Business Logic]
    end
    
    subgraph Data
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end
    
    UI --> Store
    Store --> API
    API --> Auth
    API --> BL
    BL --> DB
    BL --> Cache
```

**REGOLE**:
- Usa `subgraph` per raggruppare componenti per layer
- Nomi dei nodi SPECIFICI al progetto (non generici)
- Max 20 nodi per diagramma
- Includi direzione delle dipendenze
```

---

#### 2.2 Data Flow (`data-flow.md`)

**Tipo Mermaid**: `flowchart LR`
**Scopo**: Come i dati scorrono attraverso il sistema

```markdown
# Data Flow Diagram

```mermaid
flowchart LR
    User([User]) -->|HTTP Request| LB[Load Balancer]
    LB --> API[API Gateway]
    API -->|Validate| Auth{Auth Check}
    Auth -->|Valid| Handler[Request Handler]
    Auth -->|Invalid| Error[401 Response]
    Handler -->|Query| DB[(Database)]
    DB -->|Result| Handler
    Handler -->|Format| Response([JSON Response])
```

**REGOLE**:
- Mostra il percorso dei dati dall'input all'output
- Includi decisioni con nodi rombo `{}`
- Evidenzia trasformazioni dei dati
```

---

#### 2.3 Dependency Graph (`dependency-graph.md`)

**Tipo Mermaid**: `graph TD`
**Scopo**: Dipendenze tra moduli/package/servizi

```markdown
# Module Dependency Graph

```mermaid
graph TD
    App[app.ts] --> Routes[routes/]
    App --> Config[config.ts]
    Routes --> Controllers[controllers/]
    Controllers --> Services[services/]
    Controllers --> Middleware[middleware/]
    Services --> Models[models/]
    Services --> Utils[utils/]
    Models --> DB[database.ts]
    Middleware --> Auth[auth.ts]
```

**REGOLE**:
- Un nodo per modulo/directory principale
- Frecce nella direzione dell'import
- Evidenzia cicli di dipendenza (se presenti) con colore rosso
```

---

#### 2.4 Sequence Diagram - Main Flow (`sequence-main-flow.md`)

**Tipo Mermaid**: `sequenceDiagram`
**Scopo**: Il flusso principale dell'applicazione (es. request lifecycle, user action)

```markdown
# Main Flow Sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as API Server
    participant Auth as Auth Service
    participant DB as Database

    User->>UI: Click action
    UI->>API: POST /api/resource
    API->>Auth: Validate token
    Auth-->>API: Token valid
    API->>DB: SELECT * FROM resources
    DB-->>API: Result set
    API-->>UI: 200 JSON response
    UI-->>User: Display result
```

**REGOLE**:
- Identifica il flusso PIÙ IMPORTANTE dell'applicazione
- Usa `actor` per utenti/esterni
- Usa `participant` per componenti interni
- Mostra request (->>) e response (-->>)
- Max 8 participant per diagramma
```

---

#### 2.5 Class/Entity Hierarchy (`class-hierarchy.md`)

**Tipo Mermaid**: `classDiagram`
**Scopo**: Struttura delle classi/entità principali

```markdown
# Class Hierarchy

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String role
        +login()
        +logout()
    }
    
    class BaseService {
        <<abstract>>
        +create()
        +findById()
        +update()
        +delete()
    }
    
    class UserService {
        +register()
        +authenticate()
    }
    
    BaseService <|-- UserService
    UserService --> User
```

**REGOLE**:
- Se il progetto NON è OOP, usa per le entità dati (modelli/tipi)
- Mostra ereditarietà, composizione, dipendenze
- Includi metodi principali (max 5 per classe)
- Usa `<<abstract>>`, `<<interface>>`, `<<enum>>` dove appropriato
```

---

#### 2.6 Deployment Diagram (`deployment.md`)

**Tipo Mermaid**: `graph TD`
**Scopo**: Come il sistema è deployato/hostato

```markdown
# Deployment Architecture

```mermaid
graph TD
    subgraph Cloud["Cloud Provider"]
        subgraph Compute["Compute"]
            App[App Server]
            Worker[Worker Process]
        end
        subgraph Storage["Storage"]
            DB[(Database)]
            S3[Object Storage]
        end
        subgraph Network["Network"]
            LB[Load Balancer]
            CDN[CDN]
        end
    end
    
    User([User]) --> CDN
    CDN --> LB
    LB --> App
    App --> DB
    App --> S3
    App --> Worker
    Worker --> DB
```

**REGOLE**:
- Se non ci sono info di deploy, dedurre da Dockerfile, docker-compose, CI/CD config
- Se non c'è infrastruttura, mostra almeno la struttura locale (dev server, DB, etc.)
```

---

### 3. Genera Diagrammi Condizionali

Genera SOLO se rilevanti (basato su `_meta/repo-type.json` e contenuto nodi):

| Condizione | Diagramma | File |
|-----------|-----------|------|
| Frontend con componenti | Component Tree (`graph TD`) | `component-tree.md` |
| API REST/GraphQL | API Sequence per endpoint group (`sequenceDiagram`) | `api-sequence.md` |
| Database presente | Entity-Relationship (`erDiagram`) | `er-diagram.md` |
| Autenticazione presente | Auth Flow (`sequenceDiagram`) | `auth-flow.md` |
| Monorepo | Package Dependency (`graph TD`) | `package-dependency.md` |
| State management | State Machine (`stateDiagram-v2`) | `state-machine.md` |
| CI/CD configurato | Pipeline (`graph LR`) | `ci-cd-pipeline.md` |

---

### 4. Crea Index dei Diagrammi

File: `_generated/diagrams/_diagrams-index.md`

```markdown
---
type: index
generated_at: {timestamp}
total_diagrams: {count}
---

# Diagrams Index — {Repository Name}

## Overview
Diagrammi Mermaid generati automaticamente dall'analisi del repository.

## Diagrammi Obbligatori

| # | Diagramma | Tipo Mermaid | File |
|---|-----------|-------------|------|
| 1 | Architecture Overview | graph TD | [architecture-overview.md] |
| 2 | Data Flow | flowchart LR | [data-flow.md] |
| 3 | Dependency Graph | graph TD | [dependency-graph.md] |
| 4 | Main Flow Sequence | sequenceDiagram | [sequence-main-flow.md] |
| 5 | Class/Entity Hierarchy | classDiagram | [class-hierarchy.md] |
| 6 | Deployment Architecture | graph TD | [deployment.md] |

## Diagrammi Condizionali

[lista solo quelli generati]

## Come Visualizzare

I diagrammi sono in formato Mermaid e possono essere visualizzati con:
- **Obsidian** (supporto nativo)
- **GitHub** (rendering automatico nei .md)
- **VS Code** (con estensione Mermaid Preview)
- **mermaid.live** (editor online)
```

---

## VINCOLI

- Tempo totale: < 120 secondi
- Ogni diagramma: max 30 nodi / 50 relazioni
- Ogni file: < 10KB
- I nomi dei nodi devono essere SPECIFICI al progetto (no "Component A", "Service B")
- I diagrammi DEVONO essere sintatticamente validi Mermaid
- Output: `_generated/diagrams/` con 6-12 file .md

---

## REGOLE DI QUALITÀ MERMAID

1. **Validità sintattica**: Ogni blocco ```mermaid deve renderizzarsi senza errori
2. **Nomi specifici**: Usa nomi reali dal codice (es. `UserController`, non `Controller`)
3. **Etichette sulle frecce**: Descrivi cosa transita (es. `-->|"HTTP POST"| `)
4. **Subgraph coerenti**: Raggruppa per layer logico o dominio
5. **No diagrammi vuoti**: Se non ci sono dati sufficienti, NON generare il diagramma
6. **Consistenza**: Usa gli stessi nomi tra diagrammi diversi per lo stesso componente

---

## ERROR HANDLING

| Situazione | Azione |
|-----------|--------|
| Nodo _generated mancante | LOG WARNING, continua con dati disponibili |
| Tipo repo non detectato | Genera solo diagrammi obbligatori |
| Componente senza info | Ometti dal diagramma (non inventare) |
| Diagramma troppo complesso | Splitta in sotto-diagrammi |

---

## SUCCESS

- `_generated/diagrams/` creato con almeno 6 file ✓
- `_generated/diagrams/_diagrams-index.md` creato ✓
- Tutti i blocchi ```mermaid sono sintatticamente validi ✓
- Nomi specifici al progetto analizzato ✓
- Nessun diagramma vuoto o con placeholder ✓
