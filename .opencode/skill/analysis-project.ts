/**
 * analysis-project.ts
 * ===================
 * Skill per la gestione dei progetti di analisi isolati.
 * 
 * Funzionalità:
 * - Creazione struttura directory per nuovo progetto analisi
 * - Generazione session.json con metadata
 * - Cattura versione engine (git hash)
 * - Snapshot della configurazione
 * - Cleanup dell'engine dopo completamento
 * - Generazione ANALYSIS-SUMMARY.md
 * 
 * Uso:
 *   npx ts-node analysis-project.ts create <repo-path> <output-base> [project-name]
 *   npx ts-node analysis-project.ts finalize <project-path>
 *   npx ts-node analysis-project.ts cleanup <engine-path>
 * 
 * @version 1.1.0
 * @author spec-zero-lite
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================================================
// INTERFACES
// ============================================================================

interface SessionMetadata {
  session_id: string;
  created_at: string;
  completed_at?: string;
  status: 'in_progress' | 'completed' | 'failed';
  duration_sec?: number;
  repository: {
    name: string;
    path: string;
    git_hash: string;
  };
  engine: {
    name: string;
    version: string;
    git_hash: string;
    config_file: string;
  };
  execution?: {
    total_nodes: number;
    completed: number;
    failed: number;
    success_rate: string;
    layers_executed: number;
  };
  output: {
    project_path: string;
    specs_dir: string;
    total_files_generated?: number;
    spec_os_applied?: boolean;
  };
}

interface CreateResult {
  success: boolean;
  project_path: string;
  session_id: string;
  message: string;
}

interface FinalizeResult {
  success: boolean;
  summary_path: string;
  message: string;
}

interface CleanupResult {
  success: boolean;
  directories_removed: string[];
  message: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Genera timestamp nel formato YYYY-MM-DD-HHMM
 */
function generateTimestamp(): { date: string; time: string; full: string } {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
  return {
    date,
    time,
    full: `${date}-${time}`
  };
}

/**
 * Estrae il nome del repository dal path
 */
function extractRepoName(repoPath: string): string {
  return path.basename(repoPath.replace(/\/+$/, ''));
}

/**
 * Ottiene il git hash di una directory (se è un repo git)
 */
function getGitHash(dirPath: string): string {
  try {
    const hash = execSync('git rev-parse HEAD', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    return hash.substring(0, 12); // Short hash
  } catch {
    return 'not-a-git-repo';
  }
}

/**
 * Legge la versione dal config.yaml
 */
function getEngineVersion(enginePath: string): string {
  try {
    const configPath = path.join(enginePath, '.opencode', 'config.yaml');
    const content = fs.readFileSync(configPath, 'utf-8');
    const match = content.match(/version:\s*["']?([^"'\n]+)["']?/);
    return match ? match[1] : '1.0.0';
  } catch {
    return '1.0.0';
  }
}

/**
 * Espande ~ nel path
 */
function expandPath(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return path.join(process.env.HOME || '', inputPath.slice(1));
  }
  return path.resolve(inputPath);
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * CREATE: Crea un nuovo progetto di analisi
 * 
 * @param repoPath - Path del repository da analizzare
 * @param outputBase - Directory base per output (es: ~/Analyses)
 * @param projectName - Nome progetto (opzionale, generato automaticamente)
 * @param enginePath - Path dell'engine spec-zero-lite
 */
function createAnalysisProject(
  repoPath: string,
  outputBase: string,
  projectName?: string,
  enginePath?: string
): CreateResult {
  try {
    // Normalizza paths
    const resolvedRepoPath = expandPath(repoPath);
    const resolvedOutputBase = expandPath(outputBase);
    const resolvedEnginePath = enginePath ? expandPath(enginePath) : process.cwd();
    
    // Genera nome progetto se non fornito
    const repoName = extractRepoName(resolvedRepoPath);
    const timestamp = generateTimestamp();
    const sessionId = projectName || `${repoName}-${timestamp.full}`;
    const projectPath = path.join(resolvedOutputBase, sessionId);
    
    // Verifica che il repo esista
    if (!fs.existsSync(resolvedRepoPath)) {
      return {
        success: false,
        project_path: '',
        session_id: '',
        message: `Repository not found: ${resolvedRepoPath}`
      };
    }
    
    // Crea struttura directory
    const directories = [
      path.join(projectPath, '_session'),
      path.join(projectPath, '_meta', 'logs'),
      path.join(projectPath, '_meta', 'cache'),
      path.join(projectPath, '_meta', '02-nodes'),
      path.join(projectPath, '_generated')
    ];
    
    for (const dir of directories) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Cattura git hash dell'engine
    const engineGitHash = getGitHash(resolvedEnginePath);
    const engineVersion = getEngineVersion(resolvedEnginePath);
    
    // Cattura git hash del repo
    const repoGitHash = getGitHash(resolvedRepoPath);
    
    // Salva engine version
    fs.writeFileSync(
      path.join(projectPath, '_session', 'engine-version.txt'),
      `${engineGitHash}\nspec-zero-lite v${engineVersion}\nCaptured: ${new Date().toISOString()}\n`
    );
    
    // Copia config snapshot
    const configSource = path.join(resolvedEnginePath, '.opencode', 'config.yaml');
    const configDest = path.join(projectPath, '_session', 'config-snapshot.yaml');
    if (fs.existsSync(configSource)) {
      fs.copyFileSync(configSource, configDest);
    }
    
    // Genera session.json
    const session: SessionMetadata = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      status: 'in_progress',
      repository: {
        name: repoName,
        path: resolvedRepoPath,
        git_hash: repoGitHash
      },
      engine: {
        name: 'spec-zero-lite',
        version: engineVersion,
        git_hash: engineGitHash,
        config_file: 'config-snapshot.yaml'
      },
      output: {
        project_path: projectPath,
        specs_dir: `${repoName}-Specs`
      }
    };
    
    fs.writeFileSync(
      path.join(projectPath, '_session', 'session.json'),
      JSON.stringify(session, null, 2)
    );
    
    return {
      success: true,
      project_path: projectPath,
      session_id: sessionId,
      message: `Analysis project created: ${projectPath}`
    };
    
  } catch (error) {
    return {
      success: false,
      project_path: '',
      session_id: '',
      message: `Error creating project: ${error}`
    };
  }
}

/**
 * FINALIZE: Aggiorna session.json e genera ANALYSIS-SUMMARY.md
 * 
 * @param projectPath - Path del progetto analisi
 * @param executionStats - Statistiche di esecuzione (opzionale)
 */
function finalizeProject(
  projectPath: string,
  executionStats?: {
    total_nodes: number;
    completed: number;
    failed: number;
    layers_executed: number;
  }
): FinalizeResult {
  try {
    const resolvedPath = expandPath(projectPath);
    const sessionPath = path.join(resolvedPath, '_session', 'session.json');
    
    // Leggi session.json esistente
    if (!fs.existsSync(sessionPath)) {
      return {
        success: false,
        summary_path: '',
        message: `Session file not found: ${sessionPath}`
      };
    }
    
    const session: SessionMetadata = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
    
    // Calcola durata
    const startTime = new Date(session.created_at).getTime();
    const endTime = Date.now();
    const durationSec = Math.round((endTime - startTime) / 1000);
    
    // Aggiorna session
    session.completed_at = new Date().toISOString();
    session.status = 'completed';
    session.duration_sec = durationSec;
    
    if (executionStats) {
      session.execution = {
        ...executionStats,
        success_rate: `${Math.round((executionStats.completed / executionStats.total_nodes) * 100)}%`
      };
      session.output.total_files_generated = executionStats.completed;
      session.output.spec_os_applied = true;
    }
    
    // Salva session.json aggiornato
    fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    
    // Genera ANALYSIS-SUMMARY.md
    const summaryPath = path.join(resolvedPath, 'ANALYSIS-SUMMARY.md');
    const summary = generateSummaryMarkdown(session, durationSec);
    fs.writeFileSync(summaryPath, summary);
    
    return {
      success: true,
      summary_path: summaryPath,
      message: `Project finalized: ${summaryPath}`
    };
    
  } catch (error) {
    return {
      success: false,
      summary_path: '',
      message: `Error finalizing project: ${error}`
    };
  }
}

/**
 * Genera il contenuto del file ANALYSIS-SUMMARY.md
 */
function generateSummaryMarkdown(session: SessionMetadata, durationSec: number): string {
  const durationMin = Math.round(durationSec / 60);
  const exec = session.execution || { total_nodes: 0, completed: 0, failed: 0, success_rate: 'N/A', layers_executed: 0 };
  
  return `# Analysis Summary: ${session.repository.name}

## Session Info
- **Session ID**: ${session.session_id}
- **Started**: ${session.created_at}
- **Completed**: ${session.completed_at || 'In Progress'}
- **Duration**: ${durationMin} minutes (${durationSec} seconds)
- **Status**: ${session.status}

## Repository
- **Name**: ${session.repository.name}
- **Path**: ${session.repository.path}
- **Git Hash**: ${session.repository.git_hash}

## Engine
- **Name**: ${session.engine.name}
- **Version**: ${session.engine.version}
- **Git Hash**: ${session.engine.git_hash}
- **Config**: ${session.engine.config_file}

## Execution Results
- **Total Nodes**: ${exec.total_nodes}
- **Completed**: ${exec.completed} ✅
- **Failed**: ${exec.failed}
- **Success Rate**: ${exec.success_rate}
- **Layers Executed**: ${exec.layers_executed}

## Output Structure
\`\`\`
${session.output.project_path}/
├── _session/           # Session metadata and config snapshot
│   ├── session.json
│   ├── engine-version.txt
│   └── config-snapshot.yaml
├── _meta/              # Intermediate work (preserved)
│   ├── 00-overview.md
│   ├── 01-dag.md
│   ├── 02-nodes/
│   ├── cache/
│   ├── logs/
│   └── state.json
├── _generated/         # Raw analysis output (${exec.completed} files)
│   └── node-*.md
├── ${session.output.specs_dir}/  # Organized SPEC-OS output
│   ├── 00-INDEX.md
│   └── ...
└── ANALYSIS-SUMMARY.md # This file
\`\`\`

## Quick Links
- [Index](${session.output.specs_dir}/00-INDEX.md)
- [Architecture Overview](${session.output.specs_dir}/01-Overview/)
- [Final Audit](${session.output.specs_dir}/05-Audit/)

---
*Generated by spec-zero-lite v${session.engine.version}*
*${new Date().toISOString()}*
`;
}

/**
 * CLEANUP: Pulisce l'engine spec-zero-lite dopo il completamento
 * 
 * @param enginePath - Path dell'engine spec-zero-lite
 */
function cleanupEngine(enginePath: string): CleanupResult {
  try {
    const resolvedPath = expandPath(enginePath);
    const directoriesToRemove = ['_meta', '_generated'];
    const removed: string[] = [];
    
    for (const dir of directoriesToRemove) {
      const fullPath = path.join(resolvedPath, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        removed.push(dir);
      }
    }
    
    return {
      success: true,
      directories_removed: removed,
      message: `Engine cleaned: removed ${removed.join(', ')}`
    };
    
  } catch (error) {
    return {
      success: false,
      directories_removed: [],
      message: `Error cleaning engine: ${error}`
    };
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function printUsage(): void {
  console.log(`
analysis-project.ts - Gestione progetti di analisi spec-zero-lite

USAGE:
  npx ts-node analysis-project.ts <command> [options]

COMMANDS:
  create <repo-path> <output-base> [project-name] [engine-path]
    Crea un nuovo progetto di analisi isolato.
    
    Esempio:
      npx ts-node analysis-project.ts create /repos/my-app ~/Analyses
      npx ts-node analysis-project.ts create /repos/my-app ~/Analyses my-app-v2

  finalize <project-path> [total_nodes] [completed] [failed] [layers]
    Finalizza il progetto e genera ANALYSIS-SUMMARY.md.
    
    Esempio:
      npx ts-node analysis-project.ts finalize ~/Analyses/my-app-2026-02-07-1231 15 15 0 7

  cleanup <engine-path>
    Pulisce l'engine spec-zero-lite (_meta/, _generated/).
    
    Esempio:
      npx ts-node analysis-project.ts cleanup /path/to/spec-zero-lite

OUTPUT:
  Ritorna JSON con risultato dell'operazione.
`);
}

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'create': {
      if (args.length < 3) {
        console.error('Error: create requires <repo-path> and <output-base>');
        process.exit(1);
      }
      const result = createAnalysisProject(args[1], args[2], args[3], args[4]);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }
    
    case 'finalize': {
      if (args.length < 2) {
        console.error('Error: finalize requires <project-path>');
        process.exit(1);
      }
      const stats = args.length >= 6 ? {
        total_nodes: parseInt(args[2], 10),
        completed: parseInt(args[3], 10),
        failed: parseInt(args[4], 10),
        layers_executed: parseInt(args[5], 10)
      } : undefined;
      const result = finalizeProject(args[1], stats);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }
    
    case 'cleanup': {
      if (args.length < 2) {
        console.error('Error: cleanup requires <engine-path>');
        process.exit(1);
      }
      const result = cleanupEngine(args[1]);
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
      break;
    }
    
    case '--help':
    case '-h':
      printUsage();
      process.exit(0);
      break;
    
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

// Esegui se chiamato direttamente
main();

// Export per uso programmatico
export {
  createAnalysisProject,
  finalizeProject,
  cleanupEngine,
  SessionMetadata,
  CreateResult,
  FinalizeResult,
  CleanupResult
};
