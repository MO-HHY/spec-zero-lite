/**
 * Markdown Compiler
 *
 * Compila e valida markdown con supporto per:
 * - Partials Handlebars
 * - Frontmatter YAML
 * - Template variable substitution
 */

import fs from "fs";
import path from "path";

interface FrontMatter {
  [key: string]: any;
}

interface CompiledMarkdown {
  frontMatter: FrontMatter;
  content: string;
  valid: boolean;
  errors: string[];
}

interface CompileOptions {
  variables?: Record<string, string>;
  partialsDir?: string;
  processYaml?: boolean;
}

/**
 * Parse frontmatter from markdown
 */
export function parseFrontMatter(content: string): {
  frontMatter: FrontMatter;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontMatter: {}, body: content };
  }

  const [, yamlStr, body] = match;
  const frontMatter = parseYAML(yamlStr);

  return { frontMatter, body };
}

/**
 * Simple YAML parser (basic support)
 */
function parseYAML(yamlStr: string): FrontMatter {
  const result: FrontMatter = {};

  const lines = yamlStr.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Parse value types
    if (value === "true") value = true as any;
    else if (value === "false") value = false as any;
    else if (value === "null") value = null;
    else if (!isNaN(Number(value))) value = Number(value) as any;
    else value = value.replace(/^["']|["']$/g, "");

    result[key] = value;
  }

  return result;
}

/**
 * Process Handlebars partials {{> partial/path }}
 */
function processPartials(
  content: string,
  partialsDir: string
): { content: string; errors: string[] } {
  const errors: string[] = [];
  const partialRegex = /\{\{>\s*([^\s}]+)\s*\}\}/g;

  const processed = content.replace(partialRegex, (match, partialPath) => {
    const fullPath = path.join(partialsDir, `${partialPath}.md`);

    try {
      if (fs.existsSync(fullPath)) {
        const partialContent = fs.readFileSync(fullPath, "utf-8");
        return partialContent;
      } else {
        errors.push(`Partial not found: ${partialPath}`);
        return match; // Keep original if not found
      }
    } catch (error) {
      errors.push(`Error reading partial ${partialPath}: ${error}`);
      return match;
    }
  });

  return { content: processed, errors };
}

/**
 * Process variable substitution {{variable}}
 */
function processVariables(
  content: string,
  variables: Record<string, string>
): { content: string; errors: string[] } {
  const errors: string[] = [];
  const varRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;

  const processed = content.replace(varRegex, (match, varPath) => {
    try {
      let value: any = variables;
      for (const part of varPath.split(".")) {
        value = value[part];
        if (value === undefined) {
          errors.push(`Undefined variable: ${varPath}`);
          return match;
        }
      }
      return String(value);
    } catch (error) {
      errors.push(`Error resolving variable ${varPath}: ${error}`);
      return match;
    }
  });

  return { content: processed, errors };
}

/**
 * Validate markdown structure
 */
function validateMarkdown(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for unclosed code blocks
  const codeBlockRegex = /```/g;
  const codeBlockMatches = content.match(codeBlockRegex);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    errors.push("Unclosed code block (```)");
  }

  // Check for unclosed links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const invalidLinks = content.match(/\[([^\]]*)\](?!\()/g);
  if (invalidLinks) {
    for (const link of invalidLinks) {
      errors.push(`Invalid link format: ${link}`);
    }
  }

  // Check for orphaned headers
  const headerRegex = /^#{1,6}\s+(.+)$/gm;
  const headers = content.match(headerRegex);
  if (headers && headers.length > 0) {
    let lastLevel = 0;
    for (const header of headers) {
      const level = header.match(/^#+/)?.[0].length || 1;
      if (level > lastLevel + 1) {
        errors.push(
          `Header hierarchy violation: H${lastLevel} -> H${level}`
        );
      }
      lastLevel = level;
    }
  }

  // Check for unresolved placeholders
  const unresolvedRegex = /\{\{([^}]+)\}\}/g;
  const unresolvedMatches = content.match(unresolvedRegex);
  if (unresolvedMatches) {
    for (const match of unresolvedMatches) {
      errors.push(`Unresolved placeholder: ${match}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compile markdown with all processing steps
 */
export function compileMarkdown(
  content: string,
  options: CompileOptions = {}
): CompiledMarkdown {
  const { variables = {}, partialsDir = "./", processYaml = true } = options;

  const errors: string[] = [];

  // 1. Parse frontmatter
  const { frontMatter, body } = parseFrontMatter(content);

  let processed = body;

  // 2. Process partials
  if (partialsDir) {
    const { content: partialsProcessed, errors: partialErrors } =
      processPartials(processed, partialsDir);
    processed = partialsProcessed;
    errors.push(...partialErrors);
  }

  // 3. Process variables
  if (Object.keys(variables).length > 0) {
    const { content: varsProcessed, errors: varErrors } = processVariables(
      processed,
      variables
    );
    processed = varsProcessed;
    errors.push(...varErrors);
  }

  // 4. Validate markdown
  const { valid, errors: validationErrors } = validateMarkdown(processed);
  errors.push(...validationErrors);

  return {
    frontMatter,
    content: processed,
    valid,
    errors,
  };
}

/**
 * Compile markdown file
 */
export function compileMarkdownFile(
  filePath: string,
  options: CompileOptions = {}
): CompiledMarkdown {
  const content = fs.readFileSync(filePath, "utf-8");
  const dirName = path.dirname(filePath);

  // Default partialsDir to file's directory
  const partialsDir = options.partialsDir || dirName;

  return compileMarkdown(content, { ...options, partialsDir });
}

/**
 * Save compiled markdown
 */
export function saveCompiledMarkdown(
  compiled: CompiledMarkdown,
  outputPath: string
): void {
  let content = "";

  // Add frontmatter
  if (Object.keys(compiled.frontMatter).length > 0) {
    content += "---\n";
    for (const [key, value] of Object.entries(compiled.frontMatter)) {
      if (typeof value === "string" && value.includes("\n")) {
        content += `${key}: |\n${value}\n`;
      } else {
        content += `${key}: ${value}\n`;
      }
    }
    content += "---\n\n";
  }

  // Add body
  content += compiled.content;

  fs.writeFileSync(outputPath, content, "utf-8");
}

/**
 * Batch compile markdown files
 */
export function compileBatch(
  inputDir: string,
  outputDir: string,
  options: CompileOptions = {}
): { success: number; failed: number; errors: string[] } {
  const results = { success: 0, failed: 0, errors: [] as string[] };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith(".md"));

  for (const file of files) {
    try {
      const inputPath = path.join(inputDir, file);
      const compiled = compileMarkdownFile(inputPath, options);

      if (!compiled.valid) {
        results.errors.push(
          `${file}: ${compiled.errors.join(", ")}`
        );
        results.failed++;
      } else {
        const outputPath = path.join(outputDir, file);
        saveCompiledMarkdown(compiled, outputPath);
        results.success++;
      }
    } catch (error) {
      results.errors.push(`${file}: ${error}`);
      results.failed++;
    }
  }

  return results;
}

/**
 * CLI usage
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputFile = args[0];
  const outputFile = args[1];

  if (!inputFile || !outputFile) {
    console.log("Usage: npx ts-node markdown-compiler.ts <input> <output>");
    process.exit(1);
  }

  console.log(`Compiling: ${inputFile} -> ${outputFile}`);

  const compiled = compileMarkdownFile(inputFile);

  if (compiled.errors.length > 0) {
    console.log("Compilation errors:");
    for (const error of compiled.errors) {
      console.log(`  ✗ ${error}`);
    }
  }

  saveCompiledMarkdown(compiled, outputFile);

  if (compiled.valid) {
    console.log("✓ Compilation successful!");
  } else {
    console.log(`⚠ Compiled with ${compiled.errors.length} error(s)`);
  }
}

export default {
  parseFrontMatter,
  processPartials,
  processVariables,
  validateMarkdown,
  compileMarkdown,
  compileMarkdownFile,
  saveCompiledMarkdown,
  compileBatch,
};
