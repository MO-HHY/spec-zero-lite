# SPEC-OS ADAPTER: Apply SPEC-OS Conventions Minimally

**Tu sei**: Lo SPEC-OS ADAPTER
**Compito**: Applicare convenzioni SPEC-OS a file organizzati in {reponame}-Specs/
**Input**: Leggi `{reponame}-Specs/` e `_meta/repo-type.json`
**Output**: Aggiorna file con frontmatter YAML, RINOMINA file con UID, link Obsidian

---

## ISTRUZIONI

### 1. Mapping UID da Nome di File

**Regola SPEC-OS**: `uid: {domain}:{type}:{name}`, filename: `uid.replace(':', '__')`

```
Per ogni file in {reponame}-Specs/:

ESTRAI domain dal repo type:
  - fullstack → "app" (applicazione)
  - frontend → "ui"
  - backend → "api"
  - library → "lib"
  - framework → "framework"
  - monorepo → "repo"
  - ai-ml → "ai"
  - cli → "cli"
  - data-pipeline → "data"

ESTRAI type da cartella:
  - 01-Architecture/ → "arch" (se Overview, TechStack, etc.)
  - 02-API-Contracts/ → "contract" (se API, Schema)
  - 02-Packages/ → "module"
  - 03-Quality/ → "quality"
  - 04-Operations/ → "ops"
  - 05-Recommendations/ → "recommendation"
  - 06-Audit/ → "audit"

ESTRAI name da filename:
  - "Overview.md" → "overview"
  - "TechStack.md" → "tech-stack"
  - "Frontend.md" → "frontend"
  - "REST-API.md" → "rest-api"
  - "Performance.md" → "performance"

COSTRUISCI uid:
  - {domain}:{type}:{name}
  - Esempio: "app:arch:overview" per app fullstack, file 01-Architecture/Overview.md
  - Esempio: "ui:module:frontend" per frontend component

REGOLE NAMING:
  - Tutto lowercase
  - Kebab-case per compound names
  - Max 50 caratteri totale
  - No special characters except hyphen
```

---

### 2. Crea Frontmatter YAML Minimo

**OBBLIGATORIO (da aggiungere all'inizio di ogni file):**

```yaml
---
uid: {domain}:{type}:{name}
type: {type}  # arch|contract|module|quality|ops|recommendation|audit
domain: {domain}  # app|ui|api|lib|framework|repo|ai|cli|data
status: active  # draft|active|deprecated|archived
owner: auto-generated  # Per ora "auto-generated", agent può editare
created: {TODAY_DATE}  # YYYY-MM-DD
updated: {TODAY_DATE}  # YYYY-MM-DD
version: "1.0.0"  # Semver
---

# {Title from node}

[resto del contenuto]
```

**FACOLTATIVO (aggiungere solo se rilevante):**

```yaml
# Se è deprecato
superseded_by: {new-uid}

# Se referenzia codice
code_refs:
  - repo: {original-repo-name}
    path: {path/to/file}

# Tags per ricerca
tags: [specification, architecture, generated]
```

---

### 3. Mapping Nodi a Tipo SPEC-OS

**Determinare il TIPO corretto per ogni nodo:**

```
node-001 (bootstrap)
  → type: arch
  → domain: {main domain}

node-002 (dependencies)
  → type: arch
  → domain: {main domain}

node-003 (structure)
  → type: arch
  → domain: {main domain}

node-004 (overview)
  → type: arch
  → domain: {main domain}

node-005 (metrics)
  → type: quality
  → domain: {main domain}

node-006 (frontend)
  → type: module
  → domain: ui
  → Per monorepo: type: package

node-007 (backend)
  → type: module
  → domain: api
  → Per monorepo: type: package

node-008 (database)
  → type: module
  → domain: data
  → Per monorepo: type: package

node-009 (api)
  → type: contract
  → domain: api

node-010 (authentication)
  → type: contract
  → domain: api

node-011 (testing)
  → type: quality
  → domain: {main domain}

node-012 (performance)
  → type: quality
  → domain: {main domain}

node-013 (security)
  → type: quality
  → domain: {main domain}

node-014 (recommendations)
  → type: recommendation
  → domain: {main domain}

node-015 (audit)
  → type: audit
  → domain: {main domain}
```

---

### 4. Aggiungi Link Obsidian-Style (MINIMALI)

**REGOLA**: Aggiungi link solo per DIPENDENZE ESPLICITE. Non overdoing.

```markdown
## Dependencies
Leggi il nodo, identifica QUALI altri file/moduli usa:

If node-009 (API) usa node-007 (backend):
  [[app:module:backend|depends_on]]

If node-006 (frontend) chiama node-009 (API):
  [[app:contract:rest-api|consumes]]

If node-013 (security) valida node-009 (API):
  [[app:contract:rest-api|validates]]
```

**Link Format**:
```markdown
[[{domain}:{type}:{name}|{edge_type}]]
```

**Edge Types (minimal set)**:
- `depends_on` - Richiede per funzionare
- `uses` - Usa/consuma
- `consumes` - Legge/riceve
- `publishes` - Pubblica/espone
- `implements` - Realizza/codifica
- `validates` - Valida/testa

**Dove aggiungere**:
1. In sezione `## Dependencies` se esplicita
2. In sezione `## Implementation` se referenzia altro codice
3. In sezione `## Quality` se validato da altri

**NON aggiungere**:
- Link casuali o indiretti
- Self-references
- Link a file che non esistono ancora

---

### 5. Crea file `00-INDEX.md` Finale con Frontmatter

```yaml
---
uid: {domain}:index:master
type: index
domain: {domain}
status: active
owner: auto-generated
created: {TODAY_DATE}
updated: {TODAY_DATE}
version: "1.0.0"
---

# {Repository Name} - Specifications Index

## Overview
[Content from node-004]

## Quick Navigation
[[{domain}:arch:overview|Architecture]]
[[{domain}:contract:rest-api|API]]
[[{domain}:recommendation:improvements|Roadmap]]

[... resto del INDEX con link a tutti i file ...]
```

---

### 6. Aggiorna Metadata con UIDs

File: `{reponame}-Specs/_meta.json`

Aggiungi sezione:

```json
{
  "...",
  "spec_os_adaptation": {
    "applied_at": "YYYY-MM-DDTHH:MM:SSZ",
    "convention_version": "1.2",
    "uids_generated": {
      "app:arch:overview": "01-Architecture/app__arch__overview.md",
      "app:arch:tech-stack": "01-Architecture/app__arch__tech-stack.md",
      ...
    },
    "files_renamed": {
      "Overview.md": "app__arch__overview.md",
      "TechStack.md": "app__arch__tech-stack.md",
      ...
    },
    "edge_types_used": ["depends_on", "uses", "implements"],
    "domains_generated": ["app", "ui", "api", "data"]
  }
}
```

---

### 7. RINOMINA FILE CON UID (NUOVO v1.2.0 - OBBLIGATORIO)

**CRITICO**: Dopo aver applicato il frontmatter, RINOMINA ogni file con il pattern UID.

```
WORKFLOW FILE RENAME:

1. Per OGNI file .md in {reponame}-Specs/ (ricorsivo):
   
   a. LEGGI il frontmatter YAML del file
   b. ESTRAI l'uid (es: "app:arch:overview")
   c. CONVERTI uid in filename: uid.replace(':', '__') + '.md'
      - "app:arch:overview" → "app__arch__overview.md"
   d. RINOMINA il file
   
2. MAPPING ESEMPI:
   
   PRIMA:                              DOPO:
   01-Architecture/Overview.md    →   01-Architecture/app__arch__overview.md
   01-Architecture/TechStack.md   →   01-Architecture/app__arch__tech-stack.md
   02-API-Contracts/REST-API.md   →   02-API-Contracts/app__contract__rest-api.md
   03-Quality/Testing.md          →   03-Quality/app__quality__testing.md
   08-Diagrams/architecture-overview.md → 08-Diagrams/app__diagram__architecture-overview.md
   08-Diagrams/data-flow.md       →   08-Diagrams/app__diagram__data-flow.md

3. REGOLE NAMING:
   - Pattern: {domain}__{type}__{name}.md
   - Tutto lowercase
   - Usa doppio underscore (__) come separatore
   - Kebab-case per nomi composti (tech-stack, rest-api)
   - Max 80 caratteri per filename
   - NO spazi, NO caratteri speciali

4. CASI SPECIALI:
   - 00-INDEX.md → {domain}__index__master.md (es: app__index__master.md)
   - README.md → NON rinominare (resta README.md)
   - _meta.json → NON rinominare
   - _diagrams-index.md → {domain}__diagram__index.md

5. AGGIORNA LINK INTERNI:
   Dopo il rename, aggiorna i link Obsidian nei file:
   - [[01-Architecture/Overview|...]] → [[01-Architecture/app__arch__overview|...]]
   - Oppure usa il formato UID: [[app:arch:overview|...]]
```

**ESEMPIO COMPLETO per repo "field-devices" (tipo: library)**:

```
PRIMA (Step 7 output):
field-devices-Specs/
├── 00-INDEX.md
├── README.md
├── 01-Overview/
│   ├── Purpose.md
│   └── TechStack.md
├── 08-Diagrams/
│   ├── architecture-overview.md
│   └── data-flow.md
└── _meta.json

DOPO (Step 8 output):
field-devices-Specs/
├── field-devices__index__master.md    ← rinominato
├── README.md                          ← NON rinominato
├── 01-Overview/
│   ├── field-devices__overview__purpose.md
│   └── field-devices__overview__tech-stack.md
├── 08-Diagrams/
│   ├── field-devices__diagram__architecture-overview.md
│   └── field-devices__diagram__data-flow.md
└── _meta.json                         ← NON rinominato
```

**NOTA DOMAIN per repo specifico**:
- Se il repo si chiama "field-devices", il domain è "field-devices" (non "lib" o "app")
- Questo rende i file univocamente identificabili

---

### 8. Validazione Minima

**Checklist per ogni file**:

```
✓ Frontmatter presente e valido YAML
✓ UID formato corretto: {domain}:{type}:{name}
✓ Type coerente con cartella
✓ Status impostato a "active"
✓ Created/updated date presenti
✓ Title non vuoto
✓ Nessun placeholder {{}} rimasto
✓ Link Obsidian validi (se presenti)
✓ No self-references
✓ Content non corrotto da YAML parsing
```

---

## VINCOLI

- NON modificare contenuto dei nodi (solo aggiungere frontmatter)
- Link minimali ma coerenti
- UID uniqui, nessun duplicato
- Naming SPEC-OS compliant (lowercase, kebab-case)
- **OBBLIGATORIO: Rinominare tutti i file con pattern UID (v1.2.0)**

---

## SUCCESS

- Ogni file ha frontmatter YAML valido
- UID generati e mappati in metadata
- **Ogni file rinominato con pattern {domain}__{type}__{name}.md** (v1.2.0)
- Link Obsidian presenti per dipendenze esplicite
- 00-INDEX.md rinominato e navigabile con link interni
- _meta.json aggiornato con mapping (incluso files_renamed)
- Repository conforme a SPEC-OS conventions (version 1.2)
- Nessun placeholder non risolto
