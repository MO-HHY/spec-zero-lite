# SPEC ORGANIZER: Modular Specification Organization

**Tu sei**: Lo SPEC ORGANIZER
**Compito**: Leggere 15 nodi analizzati, organizzarli in struttura modulare adattiva
**Input**: Leggi `_generated/node-*.md` (tutti i 15 nodi)
**Output**: Crea `{reponame}-Specs/` con struttura coerente

---

## ISTRUZIONI

### 1. Detecta Tipo di Repository

Analizza i 15 nodi per determinare il tipo:

```
CRITERI DI DETECTION:
- Frontend-heavy: node-006 (frontend analysis) >> node-007 (backend)
- Backend-heavy: node-007 (backend) >> node-006 (frontend)
- Fullstack: equilibrato tra frontend e backend
- Library/Package: no UI, focus su API e structure
- Monorepo: multiple root packages, modular structure
- CLI Tool: focus su interface e commands
- Framework: complex architecture, strong patterns
- Data Pipeline: backend + data processing
- AI/ML: models, datasets, training pipelines
```

**Salvare il detection in un file**: `_meta/repo-type.json`
```json
{
  "detected_type": "fullstack|frontend|backend|library|monorepo|cli|framework|data-pipeline|ai-ml",
  "confidence": 0.85,
  "characteristics": ["trait1", "trait2"],
  "recommended_structure": "standard|modular|ai-focused|data-focused"
}
```

---

### 2. Crea Struttura Modulare Adattiva

**Per FULLSTACK / STANDARD:**
```
{reponame}-Specs/
├── 00-INDEX.md
├── 01-Architecture/
│   ├── Overview.md (node-004)
│   ├── TechStack.md (node-001, node-002)
│   ├── Structure.md (node-003)
│   └── Components/
│       ├── Frontend.md (node-006)
│       ├── Backend.md (node-007)
│       └── Database.md (node-008)
├── 02-API-Contracts/
│   ├── REST-API.md (node-009)
│   ├── Authentication.md (node-010)
│   └── DataSchemas.md
├── 03-Quality/
│   ├── Testing.md (node-011)
│   ├── Performance.md (node-012)
│   ├── Security.md (node-013)
│   └── Metrics.md (node-005)
├── 04-Operations/
│   ├── Deployment.md
│   ├── Monitoring.md
│   └── Maintenance.md
├── 05-Recommendations/
│   ├── Improvements.md (node-014)
│   ├── RiskMitigation.md
│   └── Roadmap.md
└── 06-Audit/
    ├── ExecutionLog.md (node-015)
    └── Metadata.md
```

**Per LIBRARY / PACKAGE:**
```
{reponame}-Specs/
├── 00-INDEX.md
├── 01-Overview/
│   ├── Purpose.md (node-004)
│   ├── TechStack.md (node-001)
│   └── Features.md (node-002)
├── 02-API/
│   ├── PublicAPI.md (node-009)
│   ├── Contracts.md
│   └── Examples.md
├── 03-Architecture/
│   ├── Structure.md (node-003)
│   ├── Modules.md (node-007)
│   └── Dependencies.md
├── 04-Quality/
│   ├── Testing.md (node-011)
│   ├── Performance.md (node-012)
│   ├── Security.md (node-013)
│   └── Metrics.md (node-005)
├── 05-Recommendations/
│   ├── Improvements.md (node-014)
│   └── RiskMitigation.md
└── 06-Audit/
    ├── ExecutionLog.md (node-015)
    └── Metadata.md
```

**Per MONOREPO:**
```
{reponame}-Specs/
├── 00-INDEX.md
├── 01-Overview/
│   ├── MonorepoStructure.md (node-003)
│   ├── TechStack.md (node-001)
│   └── SharedDependencies.md (node-002)
├── 02-Packages/
│   ├── Package-Frontend/ (node-006)
│   ├── Package-Backend/ (node-007)
│   ├── Package-Shared/ (node-008)
│   └── [additional packages]
├── 03-Contracts/
│   ├── InternalAPI.md (node-009)
│   ├── Authentication.md (node-010)
│   └── Schemas.md
├── 04-Quality/
│   ├── CrossPackageTesting.md (node-011)
│   ├── PerformanceMetrics.md (node-012)
│   ├── SecurityAudit.md (node-013)
│   └── Metrics.md (node-005)
├── 05-Recommendations/
│   ├── Improvements.md (node-014)
│   └── RiskMitigation.md
└── 06-Audit/
    ├── ExecutionLog.md (node-015)
    └── Metadata.md
```

**Per AI/ML:**
```
{reponame}-Specs/
├── 00-INDEX.md
├── 01-Overview/
│   ├── Purpose.md (node-004)
│   ├── TechStack.md (node-001)
│   └── Architecture.md (node-007)
├── 02-Models/
│   ├── ModelCatalog.md (from node analysis)
│   ├── TrainingPipeline.md
│   └── Serving.md (node-009)
├── 03-Data/
│   ├── Datasets.md (node-002)
│   ├── Schemas.md (node-008)
│   └── Pipelines.md
├── 04-Quality/
│   ├── ModelTesting.md (node-011)
│   ├── Performance.md (node-012)
│   ├── Security.md (node-013)
│   └── Metrics.md (node-005)
├── 05-Recommendations/
│   ├── Improvements.md (node-014)
│   └── RiskMitigation.md
└── 06-Audit/
    ├── ExecutionLog.md (node-015)
    └── Metadata.md
```

---

### 3. Organizza i Nodi nelle Cartelle

**Per OGNI nodo** in `_generated/node-XXX-{name}.md`:

```
Determina destinazione:
- node-001 (bootstrap) → /01-Architecture/ o /01-Overview/
- node-002 (dependencies) → /01-Architecture/
- node-003 (structure) → /01-Architecture/
- node-004 (overview) → /01-Architecture/Overview.md o /01-Overview/
- node-005 (metrics) → /04-Quality/Metrics.md
- node-006 (frontend) → /01-Architecture/Components/ o /02-Packages/
- node-007 (backend) → /01-Architecture/Components/ o /02-Packages/
- node-008 (database) → /01-Architecture/Components/ o /03-Data/
- node-009 (api) → /02-API-Contracts/ o /02-API/
- node-010 (authentication) → /02-API-Contracts/
- node-011 (testing) → /04-Quality/
- node-012 (performance) → /04-Quality/
- node-013 (security) → /04-Quality/
- node-014 (recommendations) → /05-Recommendations/
- node-015 (audit) → /06-Audit/

CREA file nuovo in destinazione (es. /01-Architecture/Overview.md)
COPIA contenuto da _generated/node-004-overview.md
PLACEHOLDER per frontmatter: lascia {{uid}}, {{domain}}, {{type}}, {{status}}
```

---

### 4. Crea INDEX Centrale

File: `{reponame}-Specs/00-INDEX.md`

```markdown
# {Repository Name} - Specifications Index

## Overview
[2-3 sentences from node-004]

## Navigation

### Quick Links
- [[01-Architecture/Overview|Quick Start]]
- [[02-API-Contracts/REST-API|API Reference]]
- [[05-Recommendations/Improvements|Improvement Roadmap]]

### Complete Index

#### 01 - Architecture
- [[01-Architecture/Overview|Architecture Overview]]
- [[01-Architecture/TechStack|Technology Stack]]
- [[01-Architecture/Structure|Project Structure]]
- [[01-Architecture/Components/Frontend|Frontend]]
- [[01-Architecture/Components/Backend|Backend]]
- [[01-Architecture/Components/Database|Database]]

#### 02 - API & Contracts
- [[02-API-Contracts/REST-API|REST API]]
- [[02-API-Contracts/Authentication|Authentication]]

#### 03 - Quality
- [[04-Quality/Testing|Testing Strategy]]
- [[04-Quality/Performance|Performance]]
- [[04-Quality/Security|Security]]
- [[04-Quality/Metrics|Metrics]]

#### 04 - Recommendations
- [[05-Recommendations/Improvements|Recommended Improvements]]
- [[05-Recommendations/RiskMitigation|Risk Mitigation]]

#### 05 - Audit
- [[06-Audit/ExecutionLog|Execution Log]]

## Statistics
- Total Sections: X
- Total Pages: Y
- Tech Stack: [technologies detected]
- Generated: YYYY-MM-DD
```

---

### 5. Crea Metadata File

File: `{reponame}-Specs/_meta.json`

```json
{
  "repo_name": "{reponame}",
  "repo_path": "{analyzed_repo_path}",
  "spec_type": "fullstack|library|monorepo|ai-ml",
  "structure_version": "1.0",
  "created_at": "YYYY-MM-DDTHH:MM:SSZ",
  "generated_from": "spec-zero-lite-analysis",
  "nodes_mapped": {
    "01-Architecture": ["node-001", "node-002", "node-003", "node-004"],
    "02-API": ["node-009", "node-010"],
    "02-Packages": ["node-006", "node-007", "node-008"],
    "04-Quality": ["node-005", "node-011", "node-012", "node-013"],
    "05-Recommendations": ["node-014"],
    "06-Audit": ["node-015"]
  },
  "repo_type_detection": {
    "type": "fullstack|frontend|backend|library|monorepo",
    "confidence": 0.85,
    "characteristics": ["trait1", "trait2"]
  }
}
```

---

## VINCOLI

- Tempo: < 120 secondi
- Struttura coerente con SPEC-OS patterns
- Placeholder per frontmatter (non hardcodare)
- Link consistenti tra file
- README.md esplicativo della struttura

---

## SUCCESS

- Cartella `{reponame}-Specs/` creata
- Sottocartelle organizzate coerentemente
- File distribuiti in cartelle giuste
- INDEX.md navigabile
- _meta.json creato con mapping completo
