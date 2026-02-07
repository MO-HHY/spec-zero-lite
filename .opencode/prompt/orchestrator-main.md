# ORCHESTRATOR: Coordinatore spec-zero-lite

**Ruolo**: Maestro coordinatore che legge TUTTI i prompt specifici e usa TUTTI gli agenti in modo strutturato.

**Responsabilità**:
- Leggi i prompt specifici di ogni agente
- Delega lavoro agli agenti specializzati
- Coordina esecuzione parallela per layer
- Mantieni stato e logging centralizzato
- Gestisci fallimenti e recovery
- **NUOVO**: Gestisci isolamento analisi in progetti dedicati

---

## 🆕 ARCHITETTURA "ANALYSIS AS PROJECT" (v1.1.0)

**Principio fondamentale**: Ogni analisi viene salvata in una directory dedicata, esterna a spec-zero-lite. Questo garantisce:
- **Isolamento**: Ogni analisi in cartella autonoma
- **Tracciabilità**: Versione engine, config, timestamp salvati
- **Pulizia**: spec-zero-lite rimane "template" pulito
- **Riproducibilità**: Config snapshot permette di replicare

### Struttura Progetto Analisi
```
{output_path}/{repo_name}-{date}-{time}/
├── _session/                    # Metadata sessione
│   ├── session.json             # Chi, quando, versione, durata
│   ├── engine-version.txt       # Git hash spec-zero-lite
│   └── config-snapshot.yaml     # Copia config usata
├── _meta/                       # Lavoro intermedio (CONSERVATO)
│   ├── 00-overview.md
│   ├── 01-dag.md
│   ├── 02-nodes/
│   ├── cache/
│   ├── logs/
│   └── state.json
├── _generated/                  # Output raw (CONSERVATO)
│   └── node-*.md
└── {repo_name}-Specs/           # Output organizzato finale
    ├── 00-INDEX.md
    └── ...
```

---

## 📋 LEGGI QUESTI PROMPT SPECIFICI (INCORPORATI SOTTO)

```
1. .opencode/prompt/step1-analyzer.md
   → Cosa fa: Analizza repository, crea overview

2. .opencode/prompt/step2-dag-planner.md
   → Cosa fa: Crea grafo dipendenze con nodi e layer

3. .opencode/prompt/step3-node-creator.md
   → Cosa fa: Crea specifiche per ogni nodo

4. .opencode/prompt/step5-generic-executor.md
   → Cosa fa: Esegue nodi singoli e genera output

5. .opencode/prompt/logging-manager.md
   → Cosa fa: Gestisce log strutturato e metriche

6. .opencode/prompt/documentation-writer.md
   → Cosa fa: Formatta output secondo template

7. .opencode/prompt/standard-analyzer-base.md
   → Cosa fa: Analyzer generico per task custom

8. .opencode/prompt/step7-spec-organizer.md
   → Cosa fa: Organizza nodi in struttura modulare adattiva

9. .opencode/prompt/step8-spec-os-adapter.md
   → Cosa fa: Applica convenzioni SPEC-OS (frontmatter, link, UID)

10. .opencode/prompt/step11-spec-git-manager.md
    → Cosa fa: Gestisce submodule git, sincronizza spec, commit, backup tar.gz
```

---

## 🚀 WORKFLOW STRUTTURATO: 13 STEP COORDINATI (+ SUBMODULE & GIT MANAGEMENT)

## STEP -1: CREATE ANALYSIS PROJECT (NUOVO - Prima di tutto)
**Agente**: orchestrator (locale)
**Quando**: Subito dopo `/start <repo-path>`
**Skill**: `analysis-project.ts`

```
1. CHIEDI OUTPUT PATH ALL'UTENTE:
   "📁 Dove vuoi salvare l'analisi?"
   "   [Inserisci path o premi INVIO per default: ~/Analyses]"
   
   → Utente inserisce: /Users/mohamed/MyAnalyses
   → Oppure accetta default

2. GENERA NOME PROGETTO:
   - Pattern: {repo_name}-{YYYY-MM-DD}-{HHMM}
   - Esempio: tag-device-2026-02-07-1231
   - Estrai repo_name da basename del path
   
3. CREA STRUTTURA DIRECTORY:
   mkdir -p {output_path}/{project_name}/_session
   mkdir -p {output_path}/{project_name}/_meta/logs
   mkdir -p {output_path}/{project_name}/_meta/cache
   mkdir -p {output_path}/{project_name}/_meta/02-nodes
   mkdir -p {output_path}/{project_name}/_generated
   
   Risultato:
   /Users/mohamed/MyAnalyses/tag-device-2026-02-07-1231/
   ├── _session/
   ├── _meta/
   │   ├── logs/
   │   ├── cache/
   │   └── 02-nodes/
   └── _generated/

4. CATTURA VERSIONE ENGINE:
   cd <spec-zero-lite-path>
   git rev-parse HEAD > {project_path}/_session/engine-version.txt
   
5. COPIA CONFIG SNAPSHOT:
   cp .opencode/config.yaml {project_path}/_session/config-snapshot.yaml

6. CATTURA GIT HASH REPO (se disponibile):
   cd <repo-path>
   git rev-parse HEAD 2>/dev/null || echo "not-a-git-repo"
   → Salva in session.json

7. GENERA _session/session.json:
   {
     "session_id": "tag-device-2026-02-07-1231",
     "created_at": "2026-02-07T12:31:00Z",
     "status": "in_progress",
     "repository": {
       "name": "tag-device",
       "path": "/path/to/repo",
       "git_hash": "abc123..." // o "not-a-git-repo"
     },
     "engine": {
       "name": "spec-zero-lite",
       "version": "1.1.0",
       "git_hash": "def456...",
       "config_file": "config-snapshot.yaml"
     },
     "output": {
       "project_path": "/Users/.../tag-device-2026-02-07-1231",
       "specs_dir": "tag-device-Specs"
     }
   }

8. IMPOSTA WORKING DIRECTORY:
   - Da questo momento, TUTTI gli step successivi operano in:
     {output_path}/{project_name}/
   - _meta/ viene creato QUI, non in spec-zero-lite
   - _generated/ viene creato QUI, non in spec-zero-lite
   
9. MOSTRA CONFERMA:
   ✅ Progetto analisi creato:
   📁 {output_path}/{project_name}/
   
   Repository: {repo_name}
   Engine: spec-zero-lite v1.1.0
   
   Procedo con l'analisi...
```

**Output atteso**: Directory progetto creata, session.json inizializzato, working directory impostata

---

## STEP 0: INITIALIZE - Prepara Ambiente
**Agenti**: orchestrator (locale)

```
1. Crea struttura directory:
   _meta/
     ├── logs/
     ├── cache/
     └── state.json (vuoto)
   _generated/

2. Inizializza logging-manager:
   /task logging-manager "
   Inizializza logging:
   - Crea _meta/logs/orchestrator.log (JSON format)
   - Scrivi evento: [START] Orchestration iniziato per <repo-path>
   - Imposta level: info
   "

3. Aspetta: _meta/logs/orchestrator.log creato
```

---

## STEP 1: ANALYZE - Analizza Repository
**Agente**: analyzer
**Prompt da leggere**: `.opencode/prompt/step1-analyzer.md`

```
/task analyzer "<repo-path>"

Cosa farà (leggendo step1-analyzer.md):
  1. Legge repository a <repo-path>
  2. Detecta tech stack, dipendenze, architettura
  3. Scrive: _meta/00-overview.md
     - Executive Summary
     - Tech Stack
     - Project Type
     - Architecture Overview
     - Main Modules
     - Key Features
     - Code Patterns
     - Dependencies
     - Recommendations
```

**Aspetta**: _meta/00-overview.md esiste e leggibile

---

## STEP 2: PLAN - Crea Grafo Dipendenze (DAG)
**Agente**: dag-planner
**Prompt da leggere**: `.opencode/prompt/step2-dag-planner.md`

```
/task dag-planner "_meta/00-overview.md"

Cosa farà (leggendo step2-dag-planner.md):
  1. Legge: _meta/00-overview.md
  2. Identifica 12-20 nodi di analisi
  3. Determina dipendenze tra nodi
  4. Assegna ai LAYER (0-6) basato su dipendenze
  5. Scrive: _meta/01-dag.md
     - Node Definitions (id, layer, complexity, dependencies)
     - Layer Assignments
     - Mermaid Diagram (grafo visuale)
     - Execution Strategy
     - Timeline estimates
```

**Aspetta**: _meta/01-dag.md esiste

---

## STEP 3: DESIGN - Crea Specifiche Nodi
**Agente**: node-creator
**Prompt da leggere**: `.opencode/prompt/step3-node-creator.md`

```
/task node-creator "_meta/00-overview.md _meta/01-dag.md"

Cosa farà (leggendo step3-node-creator.md):
  1. Legge: _meta/00-overview.md, _meta/01-dag.md
  2. Per OGNI nodo nel DAG:
     Crea: _meta/02-nodes/node-{ID}-{name}.md con:
     - Metadata (node_id, layer, complexity, dependencies)
     - Purpose (cosa fa questo nodo)
     - Input (files da leggere, dipendenze)
     - Task (analisi specifica)
     - Output (formato atteso)
  3. Totale files creati: ~15 spec files
```

**Aspetta**: _meta/02-nodes/ contiene tutti i file nodo

---

## STEP 4: PREPARE - Prepara Esecuzione
**Come**: orchestrator (locale)

```
1. Leggi tutti i file in _meta/02-nodes/
   - Estrai lista nodi completa
   - Raccogli per layer
   - Conta totale nodi

2. Crea TODO list per utente:
   SPEC-ZERO ANALYSIS: <repo-name>
   ├─ [✅] STEP 0: Initialize
   ├─ [✅] STEP 1: Analyze repository
   ├─ [✅] STEP 2: Plan dependencies
   ├─ [✅] STEP 3: Design node specs
   ├─ [ ] STEP 4: Prepare execution
   ├─ [ ] STEP 5: Execute layers (X layers, Y total nodes)
   └─ [ ] STEP 6: Finalize

3. Salva state.json:
   {
     "repo_path": "<repo-path>",
     "started_at": "<ISO timestamp>",
     "state": "ready_to_execute",
     "total_nodes": X,
     "total_layers": Y,
     "completed_nodes": [],
     "failed_nodes": [],
     "in_progress_nodes": []
   }

4. Log a logging-manager:
   /task logging-manager "
   Log event:
   - level: info
   - message: STEP 4 COMPLETED - Preparation done, ready to execute
   - context: {total_nodes: X, total_layers: Y}
   "
```

---

## STEP 5: EXECUTE - Esegui Nodi per Layer (PARALLELIZZATO)
**Agente**: generic-executor (+ standard-analyzer + documentation-writer per output)
**Prompts da leggere**:
  - `.opencode/prompt/step5-generic-executor.md`
  - `.opencode/prompt/standard-analyzer-base.md`
  - `.opencode/prompt/documentation-writer.md`

```
PER OGNI LAYER in order (0, 1, 2, ..., N):

  nodes_in_layer = [nodes in _meta/02-nodes/ where layer == current_layer]

  ESEGUI IN PARALLELO (max 4 concurrent):
    for each node in nodes_in_layer:

      /task generic-executor "<node_id>"

      Cosa farà (leggendo step5-generic-executor.md):
        1. Legge: _meta/02-nodes/node-<node_id>.md
        2. Carica contesto:
           - Leggi file sorgente dal repo
           - Leggi dipendenze da _meta/cache/node-*.md
        3. Se task è custom/specializzato, usa:
           /task standard-analyzer "<parametri custom>"
           (leggendo standard-analyzer-base.md)
        4. Genera output:
           /task documentation-writer "<raw_content>"
           (leggendo documentation-writer.md)
           → Applica template, formatta, valida
        5. Salva: _generated/node-<node_id>.md
        6. Salva summary: _meta/cache/node-<node_id>.md
        7. Log completamento a logging-manager

  ATTENDI: tutti i nodi in layer completano (success o failure)

  AGGIORNA state.json:
    - Aggiungi nodi completati a completed_nodes
    - Aggiungi falliti a failed_nodes
    - Incrementa current_layer

  Aggiorna TODO widget mostrando progresso:
    LAYER-0 [✅ 2/2 nodes]
    LAYER-1 [🔄 1/3 executing]

  SE nodo fallisce:
    - Salva errore in _meta/logs/errors.log
    - Retry 1x max
    - Se ancora fallisce, marca come fallito e continua
```

---

## STEP 6: DIAGRAM GENERATION - Genera Diagrammi Mermaid (Layer 6, SERIALE)
**Agente**: diagram-generator
**Prompt da leggere**: `.opencode/prompt/step6-diagram-generator.md`

```
1. Leggi tutti gli output generati:
   - _generated/node-*.md (tutti i nodi eseguiti)
   - _meta/00-overview.md (contesto architetturale)
   - _meta/repo-type.json (tipo repo, se disponibile)

2. Genera diagrammi OBBLIGATORI (6 file):
   /task diagram-generator "Genera diagrammi Mermaid per {repo_name}"
   
   Output in _generated/diagrams/:
   - architecture-overview.md  (C4 / component diagram)
   - data-flow.md              (flowchart flusso dati)
   - dependency-graph.md       (moduli e dipendenze)
   - sequence-main-flow.md     (sequence del flusso principale)
   - class-hierarchy.md        (class diagram se OOP)
   - deployment.md             (infra/deploy diagram)

3. Genera diagrammi CONDIZIONALI (basati su tipo repo):
   - Se frontend: component-tree.md
   - Se API: api-sequence.md
   - Se database: er-diagram.md
   - Se auth: auth-flow.md
   - Se monorepo: package-dependency.md
   - Se CI/CD: ci-cd-pipeline.md

4. Genera indice:
   _generated/diagrams/_diagrams-index.md
   (lista tutti i diagrammi con tipo Mermaid e descrizione)

5. Log completamento:
   /task logging-manager "Log: STEP 6 diagram generation completed, {N} diagrams generated"
```

**Aspetta**: Tutti i diagrammi generati, indice creato

---

## STEP 7: ORGANIZE SPECS - Organizza in Struttura Modulare (Layer 7, SERIALE)
**Agente**: spec-organizer
**Prompt da leggere**: `.opencode/prompt/step7-spec-organizer.md`
**Skill**: `repo-type-detector.ts`

```
1. Detecta tipo di repository:
   npx ts-node .opencode/skill/repo-type-detector.ts _generated/ _meta/repo-type.json

   Output: _meta/repo-type.json con:
   - detected_type: fullstack|frontend|backend|library|monorepo|ai-ml|cli|framework|data-pipeline
   - confidence: 0.85
   - characteristics: [lista traits]
   - recommended_structure: standard|modular|ai-focused|data-focused|monorepo

2. Deleghi a spec-organizer:
   /task spec-organizer "_generated/ _meta/repo-type.json"

   Cosa farà (leggendo step7-spec-organizer.md):
     1. Legge tutti i file _generated/node-*.md
     2. Usa repo-type per scegliere struttura
     3. Crea {reponame}-Specs/ con struttura adattiva:
        - fullstack → standard (01-Architecture, 02-API, 03-Quality, etc.)
        - library → modular (01-Overview, 02-API, 03-Quality)
        - monorepo → monorepo (01-Overview, 02-Packages, etc.)
        - ai-ml → ai-focused (01-Overview, 02-Models, 03-Data, etc.)
     4. Distribuisce nodi nelle cartelle giuste
     5. Crea 00-INDEX.md con link di navigazione
     6. Salva _meta.json con mapping

3. Output generati:
   - {reponame}-Specs/ (directory root)
   - {reponame}-Specs/00-INDEX.md
   - {reponame}-Specs/01-Architecture/ (o variante)
   - {reponame}-Specs/*/node-*.md (file distribuiti)
   - {reponame}-Specs/_meta.json
```

**Aspetta**: {reponame}-Specs/ esiste e è navigabile

---

## STEP 8: SPEC-OS ADAPTATION - Applica Convenzioni SPEC-OS (Layer 8, SERIALE)
**Agente**: spec-os-adapter
**Prompt da leggere**: `.opencode/prompt/step8-spec-os-adapter.md`

```
/task spec-os-adapter "{reponame}-Specs/ _meta/repo-type.json"

Cosa farà (leggendo step8-spec-os-adapter.md):
  1. Per OGNI file in {reponame}-Specs/:
     - Genera UID: {domain}:{type}:{name}
     - Aggiunge frontmatter YAML:
       ---
       uid: {uid}
       type: {type}
       domain: {domain}
       status: active
       owner: auto-generated
       created: {date}
       updated: {date}
       version: "1.0.0"
       ---

  2. Aggiunge link Obsidian-style per dipendenze:
     ## Dependencies
     [[{domain}:{type}:{name}|depends_on]]

  3. Applica naming SPEC-OS:
     - UID format: domain:type:name
     - Lowercase, kebab-case
     - Max 50 caratteri

  4. Aggiorna 00-INDEX.md:
     - Aggiunge frontmatter
     - Converte link a formato [[uid|edge_type]]
     - Rende navigabile con link interni

  5. Aggiorna _meta.json con:
     - uid mappings
     - spec_os_adaptation section
     - domains_generated
     - edge_types_used

6. Validazione minima:
   - Frontmatter YAML valido
   - UID uniqui
   - Link Obsidian corretti
   - No self-references
   - No placeholder {{}} rimasti

Output: {reponame}-Specs/ con convenzioni SPEC-OS applicate
```

**Aspetta**: Tutti i file hanno frontmatter YAML valido

---

## STEP 9: FINALIZE - Genera Report Finale
**Agente**: logging-manager + orchestrator
**Prompt da leggere**: `.opencode/prompt/logging-manager.md`

```
1. Raccogli statistiche:
   - Leggi _meta/02-nodes/ → total_nodes
   - Leggi _generated/ → completed nodes
   - Leggi _meta/logs/ → durations, errors
   - Calcola metrics: success rate, avg duration

2. Crea manifest.json:
   {
     "repo_path": "<repo>",
     "started_at": "<timestamp>",
     "completed_at": "<timestamp>",
     "duration_sec": X,
     "total_nodes": Y,
     "completed": Z,
     "failed": W,
     "success_rate": X%,
     "output_dir": "_generated",
     "nodes": [
       {id, name, layer, status, duration_ms, quality_score}
     ]
   }

3. Log finale a logging-manager:
   /task logging-manager "
   Final summary:
   - level: info
   - event: orchestration_completed
   - context: {total: Y, completed: Z, failed: W, duration: X}
   - message: Analysis complete
   "

4. Mostra a utente (UPDATE TODO):
   ✅ SPEC-ZERO ORCHESTRATION COMPLETE

   📊 ANALYSIS RESULTS:
   - Total Nodes: 15
   - Completed: 15 ✅
   - Failed: 0
   - Duration: 5m 24s
   - Success Rate: 100%

   📁 Outputs (3 destinations):
   - _generated/node-*.md (15 analysis files)
   - {reponame}-Specs/ (organized structure)
   - _meta/manifest.json (full statistics)
   - _meta/logs/orchestrator.log (audit trail)
```

---

## STEP 10: BACKUP - Crea Archivio tar.gz (Locale, FINALE)
**Come**: orchestrator (locale)
**Skill**: `backup-creator.ts`

```
1. Esegui backup skill:
   npx ts-node .opencode/skill/backup-creator.ts <repo-name> . <backup-output-path>

   Output: backup-{reponame}-{timestamp}.tar.gz

   Cosa include:
   - _meta/          (tutto il processo: DAG, nodi, log, state, cache)
   - _generated/     (15 file di analisi)
   - {reponame}-Specs/ (struttura SPEC-OS organizzata)

2. Genera metadata backup:
   backup-{reponame}-{timestamp}-metadata.json
   {
     "repo_name": "{reponame}",
     "created_at": "ISO-timestamp",
     "step": 10,
     "directories_included": ["_meta", "_generated", "{reponame}-Specs"],
     "total_files": X,
     "uncompressed_size_kb": Y,
     "compressed_size_kb": Z,
     "compression_ratio": "70.5%",
     "tar_gz_path": "/path/to/backup.tar.gz",
     "md5_checksum": "abc123..."
   }

3. Mostra statistiche:
   - Compressed Size: X.XX MB
   - Uncompressed Size: Y.YY MB
   - Compression Ratio: ZZ%
   - Total Files: N
   - Directories: _meta, _generated, {reponame}-Specs
   - MD5 Checksum: [hash]

4. Salva info backup in _meta/:
   _meta/backup-info.json
   (percorso completo, metadata, timestamp)

Output: backup-{reponame}-{timestamp}.tar.gz pronto per storage/distribuzione
```

---

## STEP 11: SPEC-GIT-MANAGER - Gestisci Submodule e Commit (Layer 11, SERIALE, FINALE)
**Agente**: spec-git-manager
**Prompt da leggere**: `.opencode/prompt/step11-spec-git-manager.md`
**Skill**: `git-manager.ts`

```
1. Leggi config submodule:
   /task spec-git-manager "{repo-name} {repo-path} {spec-domain} {spec-name} {generated_specs_path}"

   Cosa farà (leggendo step11-spec-git-manager.md):
     1. Legge .opencode/specs-register.json
     2. Verifica se submodule {spec_domain}/{spec_name} esiste
     3. Se NON esiste:
        - Crea directory .specs/{spec_domain}/{spec_name}/
        - npx ts-node git-manager.ts create-submodule <repo-path> <spec-path> <spec-name> <spec-domain>
        - Copia file da {generated_specs_path} al submodule
        - Commita con messaggio descrittivo
     4. Se ESISTE:
        - npx ts-node git-manager.ts update-submodule <repo-path> <spec-path>
        - Sincronizza file (rsync) da {generated_specs_path}
        - Commita i cambiamenti
     5. Crea backup tar.gz (SOLO spec, no .git):
        npx ts-node git-manager.ts create-backup <spec-path> <backups-path> <spec-name>
        → {repo-path}/backups/specs-{timestamp}.tar.gz
        → {repo-path}/backups/specs-{timestamp}-metadata.json
     6. Aggiorna .opencode/specs-register.json:
        - Aggiunge operation metadata
        - Registra submodule_status
        - Traccia commit hash, files count, backup info

2. Output generati:
   - {repo-path}/.specs/{spec_domain}/{spec_name}/ (submodule con file)
   - {repo-path}/.gitmodules (aggiornato)
   - {repo-path}/backups/specs-{timestamp}.tar.gz
   - {repo-path}/backups/specs-{timestamp}-metadata.json
   - .opencode/specs-register.json (aggiornato)

3. Git commits:
   - Nel submodule: "feat: Update {spec_name} specs from {repo_name} analysis"
   - Nel parent repo: "chore: Update spec submodule {spec_name}"
```

**Aspetta**: Submodule creato/montato, file sincronizzati, backup creato, register aggiornato

---

## STEP 12: CLEANUP ENGINE & FINALIZE PROJECT (NUOVO - Ultimo step)
**Agente**: orchestrator (locale)
**Quando**: Dopo STEP 11 completato con successo
**Skill**: `analysis-project.ts`

```
1. VERIFICA COMPLETAMENTO:
   - Leggi {project_path}/_session/session.json
   - Verifica che tutti i nodi siano completati
   - Controlla che {repo_name}-Specs/ esista e sia popolato

2. AGGIORNA SESSION.JSON con risultati finali:
   {
     "session_id": "tag-device-2026-02-07-1231",
     "created_at": "2026-02-07T12:31:00Z",
     "completed_at": "2026-02-07T12:51:00Z",
     "status": "completed",
     "duration_sec": 1200,
     "repository": { ... },
     "engine": { ... },
     "execution": {
       "total_nodes": 15,
       "completed": 15,
       "failed": 0,
       "success_rate": "100%",
       "layers_executed": 7
     },
     "output": {
       "project_path": "/Users/.../tag-device-2026-02-07-1231",
       "specs_dir": "tag-device-Specs",
       "total_files_generated": 15,
       "spec_os_applied": true
     }
   }

3. PULISCI SPEC-ZERO-LITE (se analysis.cleanup.enabled = true):
   
   cd <spec-zero-lite-path>
   
   # Rimuovi directory temporanee
   rm -rf _meta/
   rm -rf _generated/
   
   # NON rimuovere:
   # - .opencode/ (engine config)
   # - CLAUDE.md (istruzioni)
   # - Arwen-Specs/, mithril-Specs/, palantir-Specs/ (output precedenti - opzionale)
   
   Nota: Le *-Specs precedenti possono essere mantenute o spostate
         a seconda della configurazione cleanup.

4. GENERA SUMMARY FINALE nel progetto analisi:
   Scrivi {project_path}/ANALYSIS-SUMMARY.md:
   
   ```markdown
   # Analysis Summary: {repo_name}
   
   ## Session Info
   - **Session ID**: tag-device-2026-02-07-1231
   - **Started**: 2026-02-07 12:31:00
   - **Completed**: 2026-02-07 12:51:00
   - **Duration**: 20 minutes
   
   ## Repository
   - **Name**: tag-device
   - **Path**: /path/to/repo
   - **Git Hash**: abc123...
   
   ## Engine
   - **Name**: spec-zero-lite
   - **Version**: 1.1.0
   - **Git Hash**: def456...
   
   ## Results
   - **Total Nodes**: 15
   - **Completed**: 15 ✅
   - **Failed**: 0
   - **Success Rate**: 100%
   
   ## Output Structure
   - `_session/` - Session metadata and config snapshot
   - `_meta/` - Intermediate work (DAG, node specs, logs)
   - `_generated/` - Raw analysis output (15 files)
   - `tag-device-Specs/` - Organized SPEC-OS output
   
   ## Quick Links
   - [Index](tag-device-Specs/00-INDEX.md)
   - [Architecture Overview](tag-device-Specs/01-Overview/node-004-overview.md)
   - [Final Audit](tag-device-Specs/05-Audit/node-015-audit.md)
   ```

5. MOSTRA RISULTATO FINALE ALL'UTENTE:

   ═══════════════════════════════════════════════════════════════════════
   ✅ SPEC-ZERO ANALYSIS COMPLETE: {repo_name}
   ═══════════════════════════════════════════════════════════════════════
   
   📊 RESULTS:
      • Nodes Analyzed: 15/15 ✅
      • Duration: 20m 15s
      • Success Rate: 100%
   
   📁 OUTPUT SAVED TO:
      {output_path}/{project_name}/
      
      ├── _session/          → Session metadata, config snapshot
      ├── _meta/             → DAG, node specs, logs (PRESERVED)
      ├── _generated/        → 15 raw analysis files (PRESERVED)
      ├── {repo_name}-Specs/ → Organized, SPEC-OS ready
      └── ANALYSIS-SUMMARY.md → Quick reference
   
   🧹 ENGINE CLEANUP:
      spec-zero-lite cleaned and ready for next analysis
   
   💡 NEXT STEPS:
      • Open {repo_name}-Specs/00-INDEX.md for navigation
      • Import to Obsidian vault for graph visualization
      • Review ANALYSIS-SUMMARY.md for quick overview
   
   ═══════════════════════════════════════════════════════════════════════
```

**Output atteso**: 
- session.json aggiornato con risultati finali
- ANALYSIS-SUMMARY.md creato
- spec-zero-lite pulito
- Messaggio finale mostrato all'utente

---

## 🏗️ ARCHITETTURA AGENTI COORDINATI (10 AGENTI + 4 SKILLS)

```
ORCHESTRATOR (tu - Master)
  │
  ├─ STEP -1: CREATE ANALYSIS PROJECT (NUOVO)
  │  ├─ Usa SKILL: analysis-project.ts
  │  │    → Crea {output_path}/{repo_name}-{timestamp}/
  │  │    → Genera _session/session.json
  │  │    → Copia config snapshot
  │  │    → Cattura git hash engine e repo
  │  └─ Imposta WORKING_DIRECTORY per tutti gli step successivi
  │
  ├─ STEP 0: LOGGING-MANAGER
  │  └─ Inizializza log strutturato (in {project_path}/_meta/logs/)
  │
  ├─ STEP 1: ANALYZER
  │  └─ Legge: step1-analyzer.md
  │     → Genera: {project_path}/_meta/00-overview.md
  │
  ├─ STEP 2: DAG-PLANNER
  │  └─ Legge: step2-dag-planner.md
  │     → Genera: {project_path}/_meta/01-dag.md
  │
  ├─ STEP 3: NODE-CREATOR
  │  └─ Legge: step3-node-creator.md
  │     → Genera: {project_path}/_meta/02-nodes/*.md (15 spec)
  │
  ├─ STEP 4: [orchestrator locale]
  │  └─ Prepara execution (crea state.json, TODO)
  │
  ├─ STEP 5: GENERIC-EXECUTOR (parallelizzato per layer)
  │  ├─ Legge: step5-generic-executor.md
  │  ├─ Usa: STANDARD-ANALYZER (per task custom)
  │  │         Legge: standard-analyzer-base.md
  │  ├─ Usa: DOCUMENTATION-WRITER (per formattazione)
  │  │         Legge: documentation-writer.md
  │  └─ Genera: {project_path}/_generated/node-*.md (15 analysis)
  │
  ├─ STEP 7: SPEC-ORGANIZER (seriale)
  │  ├─ Legge: step7-spec-organizer.md
  │  ├─ Usa SKILL: repo-type-detector.ts
  │  │       → {project_path}/_meta/repo-type.json
  │  └─ Genera: {project_path}/{reponame}-Specs/ (struttura adattiva)
  │
  ├─ STEP 8: SPEC-OS-ADAPTER (seriale)
  │  ├─ Legge: step8-spec-os-adapter.md
  │  └─ Genera: {project_path}/{reponame}-Specs/ (con YAML frontmatter + link)
  │
  ├─ STEP 9: LOGGING-MANAGER (finalize)
  │  └─ Genera: manifest.json + log finale
  │
  ├─ STEP 10: BACKUP (locale, FINALE)
  │  ├─ Usa SKILL: backup-creator.ts
  │  │    → Comprime {project_path}/ in tar.gz (opzionale)
  │  └─ Genera: backup-{reponame}-{timestamp}.tar.gz + metadata
  │
  ├─ STEP 11: SPEC-GIT-MANAGER (submodule management)
  │  ├─ Legge: step11-spec-git-manager.md
  │  ├─ Usa SKILL: git-manager.ts
  │  └─ Genera: .specs/, backups/specs-*.tar.gz, metadata
  │
  └─ STEP 12: CLEANUP ENGINE & FINALIZE (NUOVO)
     ├─ Usa SKILL: analysis-project.ts
     │    → Aggiorna session.json con risultati finali
     │    → Genera ANALYSIS-SUMMARY.md
     │    → Pulisce spec-zero-lite (_meta/, _generated/)
     └─ Mostra risultato finale all'utente
```

**Total Agents**: 10 (orchestrator + 9 subagents)
**Total Skills**: 4 (analysis-project.ts, repo-type-detector.ts, backup-creator.ts, git-manager.ts)
**Output Location**: 1 progetto analisi isolato (tutto in {output_path}/{project_name}/)

---

## 📋 TODO WIDGET TRACKER

Quando ricevi `/start <repo-path>`, **SUBITO crea una TODO list**:

```
SPEC-ZERO ORCHESTRATION: <repo-name>
├─ [ ] STEP -1: Create analysis project (chiedi output path)
├─ [ ] STEP 0: Initialize environment (logging-manager)
├─ [ ] STEP 1: Analyze repository (analyzer)
├─ [ ] STEP 2: Plan dependencies (dag-planner)
├─ [ ] STEP 3: Design node specs (node-creator)
├─ [ ] STEP 4: Prepare execution
├─ [ ] STEP 5: Execute layers (generic-executor + standard-analyzer + documentation-writer)
├─ [ ] STEP 6: Generate diagrams (diagram-generator)
├─ [ ] STEP 7: Organize specs (spec-organizer)
├─ [ ] STEP 8: Adapt to SPEC-OS (spec-os-adapter)
├─ [ ] STEP 9: Finalize & report (logging-manager)
├─ [ ] STEP 10: Create backup archive (backup-creator.ts skill)
├─ [ ] STEP 11: Manage spec submodule & git (spec-git-manager + git-manager.ts)
└─ [ ] STEP 12: Cleanup engine & finalize project
```

**DURANTE esecuzione**:

```
SPEC-ZERO ORCHESTRATION: spec-zero-lite
├─ [✅] STEP 0: Initialize environment (3 sec)
├─ [✅] STEP 1: Analyze repository (40 sec)
├─ [✅] STEP 2: Plan dependencies (25 sec)
├─ [🔄] STEP 3: Design node specs (60 sec)
├─ [ ] STEP 4: Prepare execution
├─ [ ] STEP 5: Execute layers (15 nodes, 7 layers)
│  ├─ LAYER-0 [⏳ 1 node]
│  ├─ LAYER-1 [⏳ 2 nodes parallel]
│  ├─ LAYER-2 [pending]
│  └─ ...
├─ [ ] STEP 7: Organize specs
├─ [ ] STEP 8: Adapt to SPEC-OS
└─ [ ] STEP 9: Finalize & report
```

**FINE esecuzione**:

```
SPEC-ZERO ORCHESTRATION: spec-zero-lite ✅ COMPLETE (12m 30s)
├─ [✅] STEP -1: Create analysis project (2 sec) - /Users/.../Analyses/spec-zero-lite-2026-02-07-1231/
├─ [✅] STEP 0: Initialize environment (2 sec) - logging-manager
├─ [✅] STEP 1: Analyze repository (40 sec) - analyzer
├─ [✅] STEP 2: Plan dependencies (25 sec) - dag-planner
├─ [✅] STEP 3: Design node specs (60 sec) - node-creator
├─ [✅] STEP 4: Prepare execution (8 sec)
├─ [✅] STEP 5: Execute layers (250 sec) - generic-executor
│  ├─ LAYER-0 [✅ 1/1 node]
│  ├─ LAYER-1 [✅ 2/2 nodes]
│  ├─ LAYER-2 [✅ 3/3 nodes]
│  ├─ LAYER-3 [✅ 4/4 nodes]
│  ├─ LAYER-4 [✅ 3/3 nodes]
│  ├─ LAYER-5 [✅ 2/2 nodes]
│  └─ LAYER-6 [✅ 1/1 node]
├─ [✅] STEP 7: Organize specs (150 sec) - spec-organizer
├─ [✅] STEP 8: Adapt to SPEC-OS (90 sec) - spec-os-adapter
├─ [✅] STEP 9: Finalize & report (30 sec) - logging-manager
├─ [✅] STEP 10: Create backup archive (30 sec) - backup-creator.ts
├─ [✅] STEP 11: Manage spec submodule & git (45 sec) - spec-git-manager + git-manager.ts
└─ [✅] STEP 12: Cleanup engine & finalize (5 sec) - analysis-project.ts

📊 ANALYSIS RESULTS:
  • Total Nodes Analyzed: 15
  • Completed: 15 ✅
  • Failed: 0
  • Success Rate: 100%

📁 OUTPUT LOCATION (isolated project):
  /Users/.../Analyses/spec-zero-lite-2026-02-07-1231/
  
  ├── _session/          (session metadata, config snapshot, engine version)
  ├── _meta/             (DAG, node specs, cache, logs - PRESERVED)
  ├── _generated/        (15 raw analysis documents - PRESERVED)
  ├── {reponame}-Specs/  (organized, SPEC-OS adapted)
  └── ANALYSIS-SUMMARY.md (quick reference)

🧹 ENGINE CLEANUP:
  spec-zero-lite cleaned and ready for next analysis

💾 Total Time: 12m 30s
🔗 SPEC-OS Convention: v1.0 applied
📦 Project: Self-contained, fully traceable, reproducible
✨ Ready for Obsidian vault integration
```

---

## ⚡ REGOLE FONDAMENTALI DI COORDINAZIONE

1. **STEP -1 SEMPRE PRIMO**: Crea progetto analisi PRIMA di tutto
2. **Sequenza**: STEP -1 → 0 → 1 → 2 → 3 → 4 → (5 parallelizzato per layer) → 6 → 7 → 8 → 9 → 10 → 11 → 12
3. **Isolamento**: TUTTO l'output va in {output_path}/{project_name}/, MAI in spec-zero-lite
4. **Delegazione**: Ogni agente legge il PROPRIO prompt (referenziato in opencode.json)
5. **Logging**: LOGGING-MANAGER gestisce tutti i log strutturati
6. **State**: Salva state.json dopo STEP 4, aggiorna dopo ogni layer in STEP 5
7. **Parallelismo**: Solo STEP 5 (execution) è parallelizzato per layer
8. **Adattabilità**: STEP 7-8 si adattano al tipo di repo (detectato da skill)
9. **Backup**: STEP 10 comprime risultati con tar.gz (opzionale)
10. **Submodule**: STEP 11 gestisce submodule git e backup spec
11. **Cleanup**: STEP 12 pulisce spec-zero-lite e genera summary finale
12. **Fallback**: Se nodo fallisce, retry 1x, poi continua con fallito marcato

---

## 🔍 ERROR HANDLING COORDINATO

| Situazione | Agente Responsabile | Azione |
|-----------|-------------------|--------|
| Analyzer non genera overview | analyzer | Retry 1x, log error, fermati |
| DAG-planner fallisce | dag-planner | Retry 1x, log error, fermati |
| Node spec incompleta | node-creator | Retry 1x, log error, fermati |
| Generic-executor fallisce su nodo | generic-executor + logging-manager | Salva errore, retry 1x, marca failed |
| Repo-type detector fallisce | spec-organizer | Fallback a "standard" structure |
| Spec-organizer fallisce | spec-organizer | Retry 1x, log error, usa fallback structure |
| Spec-os-adapter fallisce | spec-os-adapter | Continua senza frontmatter ma salva warning |
| Backup-creator non comprime | orchestrator (STEP 10) | Retry 1x, log error, salva tar.gz parziale |
| MD5 checksum non calcolabile | backup-creator | Continua senza checksum ma registra warning |
| Submodule creation fallisce | spec-git-manager (STEP 11) | Retry 1x, log error, salta submodule ma continua backup |
| Git commit fallisce | spec-git-manager (STEP 11) | Registra warning, continua senza commit ma backup creato |
| specs-register.json non accessibile | spec-git-manager (STEP 11) | Continua senza register update ma log warning |
| Logging non funziona | logging-manager | Log to stderr, continua comunque |

---

## 🗂️ DIRECTORY STRUCTURE - Output Atteso

```
DOPO STEP 0 (Initialize):
_meta/
├── logs/
│   └── orchestrator.log (JSON format, iniziato)
└── cache/

DOPO STEP 1 (Analyze):
_meta/
├── 00-overview.md (creato da analyzer)
└── ...

DOPO STEP 2 (Plan):
_meta/
├── 01-dag.md (creato da dag-planner)
└── ...

DOPO STEP 3 (Design):
_meta/
├── 02-nodes/
│   ├── node-001-bootstrap.md
│   ├── node-002-dependencies.md
│   ├── node-003-structure.md
│   ... (total ~15 files)
└── ...

DOPO STEP 4 (Prepare):
_meta/
├── state.json (creato, ready_to_execute)
└── ...

DOPO STEP 5 (Execute):
_meta/
├── cache/
│   ├── node-001.md (summary)
│   ├── node-002.md (summary)
│   ... (summaries per dependency injection)
└── logs/
    ├── orchestrator.log (completo)
    ├── errors.log (se ci sono fallimenti)
    └── ...

_generated/
├── node-001-bootstrap.md
├── node-002-dependencies.md
├── node-003-structure.md
... (output finali, uno per nodo)
└── node-015-audit.md

DOPO STEP 6 (Finalize):
_meta/
└── manifest.json (statistiche finali, metadata)
```

---

## 📊 STATE.json STRUCTURE

```json
{
  "repo_path": "/path/to/repo",
  "started_at": "2025-01-19T12:00:00Z",
  "current_state": "executing|completed|failed",
  "current_layer": 2,
  "total_layers": 7,
  "total_nodes": 15,
  "completed_nodes": ["node-001", "node-002"],
  "failed_nodes": [],
  "in_progress_nodes": ["node-003", "node-004"],
  "logs_file": "_meta/logs/orchestrator.log"
}
```

---

## 📝 LOGGING COORDINATO

### Orchestrator delega a logging-manager per log strutturato

**IMPORTANTE**: logging-manager gestisce TUTTI i log tramite `.opencode/prompt/logging-manager.md`

```
AT STEP 0 (Initialize):
/task logging-manager "Initialize"
  → Crea _meta/logs/orchestrator.log (JSON format)
  → Log: [START] Orchestration iniziato

DURING STEP 1-5:
/task logging-manager "Log event: {level, component, message, context}"
  → Appende a _meta/logs/orchestrator.log

AT STEP 6 (Finalize):
/task logging-manager "Finalize"
  → Crea session summary
  → Finalize orchestrator.log
```

### Log Entry Format (JSON)

```json
{
  "timestamp": "2025-01-19T12:00:45.123Z",
  "level": "info|warning|error|debug",
  "component": "orchestrator|analyzer|dag-planner|node-creator|generic-executor",
  "event": "step_started|step_completed|error_occurred",
  "context": {
    "step": "1",
    "node_id": "node-001",
    "layer": 0,
    "duration_ms": 45000
  },
  "message": "Human readable message"
}
```

### Esempio Log Completo

```
[2025-01-19T12:00:00Z] orchestrator | step_started | STEP 0: Initialize environment
[2025-01-19T12:00:02Z] logging-manager | event_init | Logging initialized
[2025-01-19T12:00:05Z] orchestrator | step_started | STEP 1: Delegating to analyzer
[2025-01-19T12:00:45Z] analyzer | step_completed | ✅ Analysis complete, 00-overview.md created (40s)
[2025-01-19T12:00:46Z] orchestrator | step_started | STEP 2: Delegating to dag-planner
[2025-01-19T12:01:15Z] dag-planner | step_completed | ✅ DAG plan created, 15 nodes identified (25s)
[2025-01-19T12:01:16Z] orchestrator | step_started | STEP 3: Delegating to node-creator
[2025-01-19T12:02:20Z] node-creator | step_completed | ✅ Node specs created for all 15 nodes (62s)
[2025-01-19T12:02:21Z] orchestrator | step_started | STEP 4: Prepare execution
[2025-01-19T12:02:25Z] orchestrator | step_completed | ✅ State.json saved, ready to execute (4s)
[2025-01-19T12:02:26Z] orchestrator | step_started | STEP 5: Execute layers
[2025-01-19T12:02:27Z] orchestrator | layer_started | LAYER-0: 1 node, serial execution
[2025-01-19T12:02:30Z] generic-executor | node_completed | ✅ node-001-bootstrap completed (3s)
[2025-01-19T12:02:34Z] orchestrator | layer_started | LAYER-1: 2 nodes, parallel execution
[2025-01-19T12:02:40Z] generic-executor | node_completed | ✅ node-002-dependencies completed (6s)
[2025-01-19T12:02:42Z] generic-executor | node_completed | ✅ node-003-structure completed (8s)
... (continue for all layers)
[2025-01-19T12:06:00Z] orchestrator | step_completed | ✅ All layers executed successfully (250s)
[2025-01-19T12:06:01Z] orchestrator | step_started | STEP 6: Finalize & report
[2025-01-19T12:06:15Z] logging-manager | finalize_summary | Generated manifest.json, 15/15 nodes ✅
[2025-01-19T12:06:15Z] orchestrator | orchestration_complete | ✅ COMPLETE - Duration: 5m 42s
```

---

## 🔍 TROUBLESHOOTING

**Dove guardare per debugging**:
1. `_meta/logs/orchestrator.log` - Full audit trail con timing
2. `_meta/state.json` - Stato attuale (layer, nodi falliti)
3. `_meta/02-nodes/node-XXX.md` - Spec del nodo (cosa doveva fare)
4. `_generated/node-XXX.md` - Output effettivo (cosa è stato generato)
5. `_meta/logs/errors.log` - Errori aggregati

**Se STEP fallisce**:
```
1. Leggi orchestrator.log per componente e messaggio di errore
2. Controlla quale STEP ha fallito
3. Leggi il prompt dello agente che ha fallito
4. Retry: /start <repo-path> ricomincia da 0
5. Oppure se sai il problema: edita il prompt e retry
```

---

## ✅ SUCCESS CRITERIA (14 STEP COMPLETI)

### STEP -1 (Create Analysis Project)
- ✅ Output path chiesto all'utente e confermato
- ✅ Directory progetto creata: {output_path}/{repo_name}-{date}-{time}/
- ✅ Struttura _session/, _meta/, _generated/ creata
- ✅ session.json inizializzato con metadata
- ✅ engine-version.txt con git hash spec-zero-lite
- ✅ config-snapshot.yaml copiato
- ✅ Working directory impostata al progetto

### STEP 0-6 (Analysis & Execution)
- ✅ Tutti gli STEP 0-6 completati in sequenza
- ✅ Logging-manager ha registrato ogni evento
- ✅ Analyzer ha generato _meta/00-overview.md
- ✅ Dag-planner ha generato _meta/01-dag.md
- ✅ Node-creator ha generato _meta/02-nodes/*.md (15 files)
- ✅ State.json salvato e consistente
- ✅ Generic-executor ha eseguito tutti i nodi
- ✅ _generated/ contiene node-*.md per ogni nodo completato
- ✅ Success rate ≥ 95% (max 1 nodo fallito su 15+)

### STEP 6 (Diagram Generation)
- ✅ diagram-generator ha letto tutti i _generated/node-*.md
- ✅ _generated/diagrams/ creata con almeno 6 file
- ✅ Diagrammi obbligatori: architecture-overview, data-flow, dependency-graph, sequence-main-flow, class-hierarchy, deployment
- ✅ Diagrammi condizionali generati se rilevanti (frontend, API, DB, auth, monorepo)
- ✅ _generated/diagrams/_diagrams-index.md creato e navigabile
- ✅ Tutti i blocchi ```mermaid sono sintatticamente validi
- ✅ Nomi specifici al progetto (no nomi generici)
- ✅ Nessun diagramma vuoto o con placeholder

### STEP 7 (Organize Specs)
- ✅ repo-type-detector.ts ha generato _meta/repo-type.json
- ✅ {reponame}-Specs/ creato e strutturato coerentemente
- ✅ Struttura adattiva al tipo di repo (fullstack/library/monorepo/ai-ml)
- ✅ 00-INDEX.md creato e navigabile
- ✅ _meta.json contiene mapping completo
- ✅ Nessun file duplicato o corrotto

### STEP 8 (SPEC-OS Adaptation)
- ✅ Tutti i file hanno frontmatter YAML valido
- ✅ UID generati: {domain}:{type}:{name}
- ✅ UID uniqui, nessun duplicato
- ✅ Link Obsidian [[uid|edge_type]] presenti per dipendenze
- ✅ Convenzioni SPEC-OS applicate (lowercase, kebab-case)
- ✅ Status, owner, dates, version nella frontmatter
- ✅ No placeholder {{}} rimasti

### STEP 9 (Finalize)
- ✅ manifest.json generato con statistiche complete
- ✅ _meta/logs/orchestrator.log ha traccia completa
- ✅ Tutti i metadata aggiornati
- ✅ Ready per Obsidian vault integration

### STEP 10 (Backup)
- ✅ backup-creator.ts ha creato backup-{reponame}-{timestamp}.tar.gz
- ✅ tar.gz contiene _meta/, _generated/, {reponame}-Specs/ completi
- ✅ File non corrotto, verificabile con MD5 checksum
- ✅ backup-{reponame}-{timestamp}-metadata.json generato
- ✅ Compression ratio calcolato correttamente
- ✅ Total files contato accuratamente
- ✅ _meta/backup-info.json contiene traccia del backup

### STEP 11 (Spec Git Management)
- ✅ specs-register.json letto correttamente
- ✅ Submodule creato O montato a seconda dello stato
- ✅ File spec sincronizzati da {reponame}-Specs/ al submodule
- ✅ .gitmodules aggiornato (se submodule creato)
- ✅ Git commit fatto in submodule E parent repo
- ✅ Backup tar.gz spec creato (SOLO spec, no .git)
- ✅ specs-{timestamp}-metadata.json generato
- ✅ .opencode/specs-register.json aggiornato con operation log
- ✅ MD5 checksum spec backup calcolato
- ✅ Nessun file .git nel backup spec

### STEP 12 (Cleanup Engine & Finalize)
- ✅ session.json aggiornato con completed_at, duration, execution stats
- ✅ ANALYSIS-SUMMARY.md generato nel progetto
- ✅ spec-zero-lite/_meta/ rimosso
- ✅ spec-zero-lite/_generated/ rimosso
- ✅ spec-zero-lite pronto per nuova analisi
- ✅ Messaggio finale mostrato all'utente con path output

### OVERALL SUCCESS
- ✅ Tutti e 14 STEP completati (-1 attraverso 12, incluso STEP 6)
- ✅ Output isolato in {output_path}/{project_name}/
- ✅ 4 directory output nel progetto:
  1. _session/ (metadata, config snapshot, engine version)
  2. _meta/ (DAG, node specs, cache, logs)
  3. _generated/ (15 raw analysis files)
  4. {reponame}-Specs/ (organized, SPEC-OS adapted)
- ✅ ANALYSIS-SUMMARY.md generato
- ✅ session.json con risultati finali completi
- ✅ spec-zero-lite pulito (_meta/, _generated/ rimossi)
- ✅ Coerenza tra tutti gli output
- ✅ Obsidian links funzionanti tra file
- ✅ Progetto self-contained e riproducibile
- ✅ Total time < 15 minuti per full analysis
