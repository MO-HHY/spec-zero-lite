/**
 * Repository Tree Generator
 *
 * Genera un albero strutturato del repository con configurazioni di profondità e filtri.
 * Output: ASCII tree per documentazione o JSON per processamento.
 */

import fs from "fs";
import path from "path";

interface TreeOptions {
  maxDepth?: number;
  includeHidden?: boolean;
  exclude?: string[];
  format?: "ascii" | "json" | "markdown";
  ignorePatterns?: RegExp[];
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeNode[];
}

const DEFAULT_EXCLUDE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  ".DS_Store",
  "package-lock.json",
  "yarn.lock",
];

const DEFAULT_IGNORE_PATTERNS = [
  /^\.(?!env|example)/,  // Hidden files except .env, .example
  /\.(log|tmp)$/,        // Temporary files
  /__pycache__/,         // Python cache
  /\.egg-info/,          // Python packaging
];

/**
 * Generate repository tree structure
 */
export function generateRepoTree(
  rootPath: string,
  options: TreeOptions = {}
): TreeNode {
  const {
    maxDepth = 3,
    includeHidden = false,
    exclude = DEFAULT_EXCLUDE,
    ignorePatterns = DEFAULT_IGNORE_PATTERNS,
  } = options;

  function buildTree(
    currentPath: string,
    relativePath: string,
    depth: number
  ): TreeNode {
    const stat = fs.statSync(currentPath);
    const name = path.basename(currentPath);

    const node: TreeNode = {
      name,
      path: relativePath,
      type: stat.isDirectory() ? "directory" : "file",
    };

    // Add file size
    if (!stat.isDirectory()) {
      node.size = stat.size;
    }

    // Don't traverse deeper if max depth reached
    if (depth >= maxDepth) {
      return node;
    }

    // Traverse directories
    if (stat.isDirectory()) {
      try {
        const entries = fs.readdirSync(currentPath);
        const children: TreeNode[] = [];

        for (const entry of entries) {
          // Check exclusions
          if (exclude.includes(entry)) continue;

          // Check hidden files
          if (!includeHidden && entry.startsWith(".")) continue;

          // Check ignore patterns
          if (ignorePatterns.some((pattern) => pattern.test(entry))) {
            continue;
          }

          const childPath = path.join(currentPath, entry);
          const childRelativePath = path.join(relativePath, entry);

          try {
            const childNode = buildTree(
              childPath,
              childRelativePath,
              depth + 1
            );
            children.push(childNode);
          } catch (e) {
            // Skip unreadable files
            console.warn(`Skipping unreadable: ${childRelativePath}`);
          }
        }

        // Sort: directories first, then alphabetically
        children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

        if (children.length > 0) {
          node.children = children;
        }
      } catch (e) {
        console.warn(`Cannot read directory: ${currentPath}`);
      }
    }

    return node;
  }

  return buildTree(rootPath, path.basename(rootPath), 0);
}

/**
 * Format tree as ASCII art
 */
export function formatAsAscii(node: TreeNode, prefix = ""): string {
  const lines: string[] = [];

  function traverse(n: TreeNode, currentPrefix: string, isLast: boolean) {
    const connector = isLast ? "└── " : "├── ";
    const nextPrefix = currentPrefix + (isLast ? "    " : "│   ");

    const suffix = n.type === "directory" ? "/" : "";
    const sizeStr = n.size ? ` (${formatBytes(n.size)})` : "";

    lines.push(`${currentPrefix}${connector}${n.name}${suffix}${sizeStr}`);

    if (n.children) {
      n.children.forEach((child, index) => {
        traverse(child, nextPrefix, index === n.children!.length - 1);
      });
    }
  }

  // Root
  lines.push(`${node.name}/`);
  if (node.children) {
    node.children.forEach((child, index) => {
      traverse(child, "", index === node.children!.length - 1);
    });
  }

  return lines.join("\n");
}

/**
 * Format tree as JSON
 */
export function formatAsJson(node: TreeNode): string {
  return JSON.stringify(node, null, 2);
}

/**
 * Format tree as Markdown
 */
export function formatAsMarkdown(node: TreeNode): string {
  const lines: string[] = [`# ${node.name}\n`];

  function traverse(n: TreeNode, level: number) {
    const prefix = "  ".repeat(level);
    const suffix = n.type === "directory" ? "/" : "";
    const sizeStr = n.size ? ` (${formatBytes(n.size)})` : "";

    lines.push(`${prefix}- **${n.name}${suffix}**${sizeStr}`);

    if (n.children) {
      n.children.forEach((child) => {
        traverse(child, level + 1);
      });
    }
  }

  if (node.children) {
    node.children.forEach((child) => {
      traverse(child, 0);
    });
  }

  return lines.join("\n");
}

/**
 * Calculate statistics about the tree
 */
export function calculateStats(node: TreeNode) {
  let fileCount = 0;
  let dirCount = 0;
  let totalSize = 0;
  const fileTypes = new Map<string, number>();

  function traverse(n: TreeNode) {
    if (n.type === "file") {
      fileCount++;
      if (n.size) totalSize += n.size;

      const ext = path.extname(n.name) || "no-extension";
      fileTypes.set(ext, (fileTypes.get(ext) || 0) + 1);
    } else {
      dirCount++;
    }

    if (n.children) {
      n.children.forEach(traverse);
    }
  }

  traverse(node);

  return {
    fileCount,
    dirCount,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    fileTypes: Object.fromEntries(fileTypes),
  };
}

/**
 * Export tree to file
 */
export function exportTree(
  node: TreeNode,
  outputPath: string,
  format: "ascii" | "json" | "markdown" = "ascii"
) {
  let content: string;

  switch (format) {
    case "json":
      content = formatAsJson(node);
      break;
    case "markdown":
      content = formatAsMarkdown(node);
      break;
    default:
      content = formatAsAscii(node);
  }

  fs.writeFileSync(outputPath, content, "utf-8");
  console.log(`Tree exported to: ${outputPath}`);
}

/**
 * Helper: Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

/**
 * CLI usage
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const repoPath = args[0] || ".";
  const format = (args[1] || "ascii") as "ascii" | "json" | "markdown";
  const maxDepth = parseInt(args[2] || "3");

  console.log(`Generating tree for: ${repoPath}`);
  console.log(`Format: ${format}, Max Depth: ${maxDepth}\n`);

  const tree = generateRepoTree(repoPath, {
    maxDepth,
    includeHidden: false,
  });

  const stats = calculateStats(tree);
  console.log(`Files: ${stats.fileCount}, Directories: ${stats.dirCount}`);
  console.log(`Total Size: ${stats.totalSizeFormatted}\n`);

  const formatted =
    format === "json"
      ? formatAsJson(tree)
      : format === "markdown"
        ? formatAsMarkdown(tree)
        : formatAsAscii(tree);

  console.log(formatted);
}

export default {
  generateRepoTree,
  formatAsAscii,
  formatAsJson,
  formatAsMarkdown,
  calculateStats,
  exportTree,
};
