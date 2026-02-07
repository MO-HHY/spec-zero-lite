/**
 * Structure Creator
 *
 * Crea directory e file structure con template e convenzioni di naming.
 * Supporta variabili e configurazione per strutture complesse.
 */

import fs from "fs";
import path from "path";

interface FileSpec {
  name: string;
  content?: string;
  template?: string;
  isDirectory?: boolean;
}

interface StructureSpec {
  name: string;
  basePath: string;
  items: FileSpec[];
}

/**
 * Create directory structure from spec
 */
export function createStructure(spec: StructureSpec, dryRun = false) {
  const results = {
    created: [] as string[],
    skipped: [] as string[],
    errors: [] as { path: string; error: string }[],
  };

  function createItem(item: FileSpec, parentPath: string) {
    const itemPath = path.join(parentPath, item.name);

    try {
      if (item.isDirectory) {
        if (dryRun) {
          console.log(`[DRY] mkdir: ${itemPath}`);
          results.created.push(itemPath);
        } else {
          if (!fs.existsSync(itemPath)) {
            fs.mkdirSync(itemPath, { recursive: true });
            console.log(`✓ Created directory: ${itemPath}`);
            results.created.push(itemPath);
          } else {
            console.log(`- Skipped existing directory: ${itemPath}`);
            results.skipped.push(itemPath);
          }
        }
      } else {
        const content = item.content || item.template || "";
        if (dryRun) {
          console.log(`[DRY] create: ${itemPath} (${content.length} bytes)`);
          results.created.push(itemPath);
        } else {
          if (!fs.existsSync(itemPath)) {
            fs.writeFileSync(itemPath, content, "utf-8");
            console.log(`✓ Created file: ${itemPath}`);
            results.created.push(itemPath);
          } else {
            console.log(`- Skipped existing file: ${itemPath}`);
            results.skipped.push(itemPath);
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`✗ Error creating ${itemPath}: ${errorMsg}`);
      results.errors.push({ path: itemPath, error: errorMsg });
    }
  }

  // Create base directory
  if (!fs.existsSync(spec.basePath)) {
    fs.mkdirSync(spec.basePath, { recursive: true });
  }

  // Create items recursively
  function createItems(items: FileSpec[], currentPath: string) {
    for (const item of items) {
      createItem(item, currentPath);

      // If directory with children, create children recursively
      if (item.isDirectory && "children" in item) {
        const itemPath = path.join(currentPath, item.name);
        createItems((item as any).children, itemPath);
      }
    }
  }

  createItems(spec.items, spec.basePath);

  return results;
}

/**
 * Create .opencode structure
 */
export function createOpenCodeStructure(basePath: string, dryRun = false) {
  const spec: StructureSpec = {
    name: ".opencode",
    basePath: path.join(basePath, ".opencode"),
    items: [
      {
        name: "prompt",
        isDirectory: true,
      },
      {
        name: "skill",
        isDirectory: true,
      },
      {
        name: "template",
        isDirectory: true,
      },
      {
        name: "template/type",
        isDirectory: true,
      },
      {
        name: "logs",
        isDirectory: true,
      },
      {
        name: "cache",
        isDirectory: true,
      },
      {
        name: "README.md",
        content: `# .opencode Directory

Orchestration configuration and automation scripts for spec-zero-lite.

## Structure

\`\`\`
.opencode/
├── prompt/          # Agent prompts and instructions
├── skill/           # Utility scripts (TypeScript/Python)
├── template/        # Output templates
│   └── type/        # Template types
├── logs/            # Execution logs
└── cache/           # Runtime cache
\`\`\`

See parent README.md for workflow documentation.
`,
      },
    ],
  };

  return createStructure(spec, dryRun);
}

/**
 * Create _meta structure for orchestration
 */
export function createMetaStructure(basePath: string, dryRun = false) {
  const spec: StructureSpec = {
    name: "_meta",
    basePath: path.join(basePath, "_meta"),
    items: [
      {
        name: "logs",
        isDirectory: true,
      },
      {
        name: "cache",
        isDirectory: true,
      },
      {
        name: "02-nodes",
        isDirectory: true,
      },
      {
        name: ".gitkeep",
        content: "",
      },
    ],
  };

  return createStructure(spec, dryRun);
}

/**
 * Create _generated structure
 */
export function createGeneratedStructure(basePath: string, dryRun = false) {
  const spec: StructureSpec = {
    name: "_generated",
    basePath: path.join(basePath, "_generated"),
    items: [
      {
        name: ".gitkeep",
        content: "",
      },
    ],
  };

  return createStructure(spec, dryRun);
}

/**
 * Create initial state file
 */
export function createInitialState(
  metaPath: string,
  dryRun = false
): string | null {
  const statePath = path.join(metaPath, "state.json");

  const initialState = {
    sessionId: generateUUID(),
    startTime: new Date().toISOString(),
    currentState: "idle",
    currentLayer: 0,
    completedNodes: [] as string[],
    failedNodes: [] as string[],
    resumable: false,
    lastError: null as string | null,
  };

  if (dryRun) {
    console.log(`[DRY] create state.json with:`, initialState);
    return JSON.stringify(initialState, null, 2);
  }

  try {
    fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2), "utf-8");
    console.log(`✓ Created state file: ${statePath}`);
    return statePath;
  } catch (error) {
    console.error(
      `✗ Error creating state file:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Validate .opencode structure
 */
export function validateStructure(basePath: string): {
  valid: boolean;
  missing: string[];
  errors: string[];
} {
  const required = [
    ".opencode",
    ".opencode/prompt",
    ".opencode/skill",
    ".opencode/template",
    ".opencode/template/type",
    ".opencode/logs",
    ".opencode/cache",
  ];

  const missing: string[] = [];
  const errors: string[] = [];

  for (const dir of required) {
    const fullPath = path.join(basePath, dir);
    if (!fs.existsSync(fullPath)) {
      missing.push(dir);
    } else if (!fs.statSync(fullPath).isDirectory()) {
      errors.push(`${dir} exists but is not a directory`);
    }
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Helper: Generate UUID v4
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * CLI usage
 */
if (require.main === module) {
  const basePath = process.argv[2] || ".";
  const dryRun = process.argv.includes("--dry-run");

  console.log(
    `Creating .opencode structure in: ${basePath}${dryRun ? " [DRY RUN]" : ""}\n`
  );

  // Create all structures
  console.log("=== Creating .opencode directory ===");
  createOpenCodeStructure(basePath, dryRun);

  console.log("\n=== Creating _meta directory ===");
  createMetaStructure(basePath, dryRun);

  console.log("\n=== Creating _generated directory ===");
  createGeneratedStructure(basePath, dryRun);

  console.log("\n=== Creating initial state ===");
  createInitialState(path.join(basePath, "_meta"), dryRun);

  console.log("\n=== Validating structure ===");
  const validation = validateStructure(basePath);
  if (validation.valid) {
    console.log("✓ Structure is valid!");
  } else {
    if (validation.missing.length > 0) {
      console.log("Missing directories:", validation.missing);
    }
    if (validation.errors.length > 0) {
      console.log("Errors:", validation.errors);
    }
  }
}

export default {
  createStructure,
  createOpenCodeStructure,
  createMetaStructure,
  createGeneratedStructure,
  createInitialState,
  validateStructure,
};
