#!/usr/bin/env ts-node
/**
 * Git Manager - Handle submodule operations, commits, and backups
 *
 * Usage: npx ts-node git-manager.ts <operation> <params>
 * Operations:
 *   - create-submodule <repo-path> <spec-path> <spec-name>
 *   - update-submodule <repo-path> <spec-path>
 *   - commit-specs <spec-path> <message>
 *   - create-backup <spec-path> <output-path> <spec-name>
 *   - update-register <register-path> <operation-data>
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "crypto";

interface SubmoduleConfig {
  repo_path: string;
  spec_path: string;
  spec_name: string;
  spec_domain: string;
}

interface BackupMetadata {
  spec_name: string;
  spec_domain: string;
  repo_name: string;
  backup_date: string;
  submodule_path: string;
  backup_path: string;
  files_included: number;
  tar_gz_size_kb: number;
  md5_checksum: string;
  contents: string[];
}

interface RegisterOperation {
  operation_id: string;
  operation: string;
  repo_name: string;
  spec_domain: string;
  spec_name: string;
  timestamp: string;
  status: "completed" | "failed";
  submodule_status: "created" | "mounted" | "updated";
  actions: string[];
  details: Record<string, unknown>;
}

/**
 * Execute shell command safely
 */
function exec(cmd: string, silent = false): string {
  try {
    if (!silent) console.log(`  ↳ ${cmd}`);
    return execSync(cmd, { encoding: "utf-8", stdio: silent ? "pipe" : "inherit" }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error}`);
  }
}

/**
 * Calculate MD5 checksum
 */
function calculateMD5(filePath: string): string {
  try {
    const hash = crypto.createHash("md5");
    const content = fs.readFileSync(filePath);
    hash.update(content);
    return hash.digest("hex");
  } catch (error) {
    console.warn(`Warning: Could not calculate MD5 for ${filePath}`);
    return "not-calculated";
  }
}

/**
 * Count files recursively
 */
function countFiles(dirPath: string, excludeGit = true): number {
  let count = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (excludeGit && (file === ".git" || file === ".gitmodules")) {
      continue;
    }

    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      count += countFiles(filePath, excludeGit);
    } else {
      count += 1;
    }
  }

  return count;
}

/**
 * Get directory size recursively
 */
function getDirSize(dirPath: string, excludeGit = true): number {
  let size = 0;

  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (excludeGit && (file === ".git" || file === ".gitmodules")) {
      continue;
    }

    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      size += getDirSize(filePath, excludeGit);
    } else {
      size += stats.size;
    }
  }

  return size;
}

/**
 * Create submodule (if not exists)
 */
function createSubmodule(config: SubmoduleConfig): void {
  console.log(`\n📦 Creating submodule: ${config.spec_name}`);
  console.log(`  Path: ${config.spec_path}`);

  // Check if path already exists
  if (fs.existsSync(config.spec_path)) {
    console.log(`  ⚠️  Path already exists, skipping creation`);
    return;
  }

  // Create directory structure
  console.log(`  Creating directory structure...`);
  fs.mkdirSync(config.spec_path, { recursive: true });

  // Initialize as git repo
  console.log(`  Initializing git repository...`);
  exec(`git init "${config.spec_path}"`);

  // Create initial files
  const readmePath = path.join(config.spec_path, "README.md");
  fs.writeFileSync(
    readmePath,
    `# ${config.spec_name}\n\nSpecifications for ${config.spec_domain} domain\n`
  );

  // Initial commit
  console.log(`  Creating initial commit...`);
  exec(`git -C "${config.spec_path}" config user.email "spec-manager@localhost"`);
  exec(`git -C "${config.spec_path}" config user.name "Spec Manager"`);
  exec(`git -C "${config.spec_path}" add README.md`);
  exec(`git -C "${config.spec_path}" commit -m "chore: Initialize ${config.spec_name}"`);

  console.log(`✅ Submodule created successfully`);
}

/**
 * Update/mount submodule
 */
function updateSubmodule(config: SubmoduleConfig): void {
  console.log(`\n🔄 Updating submodule: ${config.spec_name}`);
  console.log(`  Path: ${config.spec_path}`);

  if (!fs.existsSync(config.spec_path)) {
    console.log(`  ⚠️  Path does not exist, cannot update`);
    return;
  }

  console.log(`  Updating git submodule...`);
  try {
    exec(`git -C "${config.repo_path}" submodule update --init --recursive "${config.spec_path}"`);
  } catch (error) {
    console.log(`  Note: Submodule update may not have remote URL set yet`);
  }

  console.log(`✅ Submodule updated successfully`);
}

/**
 * Commit spec files
 */
function commitSpecs(specPath: string, message: string): string {
  console.log(`\n📝 Committing spec files`);
  console.log(`  Path: ${specPath}`);

  exec(`git -C "${specPath}" config user.email "spec-manager@localhost"`, true);
  exec(`git -C "${specPath}" config user.name "Spec Manager"`, true);

  // Add all changes
  exec(`git -C "${specPath}" add .`, true);

  // Check if there are changes
  try {
    const status = exec(`git -C "${specPath}" status --porcelain`, true);
    if (!status) {
      console.log(`  ℹ️  No changes to commit`);
      return "no-changes";
    }
  } catch (error) {
    console.log(`  ℹ️  Could not check status`);
  }

  // Commit
  try {
    const commitOutput = exec(`git -C "${specPath}" commit -m "${message}"`, true);
    console.log(`✅ Files committed successfully`);

    // Get commit hash
    const commitHash = exec(`git -C "${specPath}" rev-parse HEAD`, true);
    return commitHash;
  } catch (error) {
    console.log(`  ℹ️  Commit failed (likely no changes)`);
    return "failed";
  }
}

/**
 * Create tar.gz backup (specs only, excluding .git)
 */
function createBackup(specPath: string, outputPath: string, specName: string): BackupMetadata {
  console.log(`\n📦 Creating backup archive`);
  console.log(`  Source: ${specPath}`);
  console.log(`  Output: ${outputPath}`);

  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `specs-${specName}-${timestamp}.tar.gz`;
  const backupFilePath = path.join(outputPath, backupFileName);

  // Calculate sizes before compression
  console.log(`  Calculating directory size...`);
  const fileCount = countFiles(specPath, true); // exclude .git
  const uncompressedSize = getDirSize(specPath, true);

  console.log(`  Files to backup: ${fileCount}`);
  console.log(`  Uncompressed size: ${(uncompressedSize / 1024).toFixed(2)} KB`);

  // Create tar.gz
  console.log(`  Creating tar.gz archive...`);
  try {
    const tarCmd = `cd "${specPath}" && tar -czf "${backupFilePath}" --exclude='.git' --exclude='.gitmodules' --exclude='.gitignore' .`;
    exec(tarCmd);
  } catch (error) {
    throw new Error(`Failed to create tar.gz: ${error}`);
  }

  // Verify backup was created
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not created: ${backupFilePath}`);
  }

  // Get backup size and MD5
  const stats = fs.statSync(backupFilePath);
  const compressedSize = stats.size;
  const md5Checksum = calculateMD5(backupFilePath);

  console.log(`✅ Backup created successfully`);
  console.log(`  Compressed size: ${(compressedSize / 1024).toFixed(2)} KB`);
  console.log(`  MD5: ${md5Checksum}`);

  // Build metadata
  const metadata: BackupMetadata = {
    spec_name: specName,
    spec_domain: specPath.split("/").slice(-2, -1)[0] || "unknown",
    repo_name: specPath.split("/").slice(-3, -2)[0] || "unknown",
    backup_date: new Date().toISOString(),
    submodule_path: specPath,
    backup_path: backupFilePath,
    files_included: fileCount,
    tar_gz_size_kb: Math.round(compressedSize / 1024),
    md5_checksum: md5Checksum,
    contents: [],
  };

  // Write metadata file
  const metadataPath = path.join(outputPath, `specs-${specName}-${timestamp}-metadata.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`  Metadata: ${metadataPath}`);

  return metadata;
}

/**
 * Update specs register with operation
 */
function updateRegister(registerPath: string, operation: RegisterOperation): void {
  console.log(`\n📋 Updating specs register`);
  console.log(`  Register: ${registerPath}`);

  if (!fs.existsSync(registerPath)) {
    throw new Error(`Register file not found: ${registerPath}`);
  }

  // Read existing register
  const registerContent = fs.readFileSync(registerPath, "utf-8");
  const register = JSON.parse(registerContent);

  // Add operation to operations array
  if (!register.submodule_operations) {
    register.submodule_operations = [];
  }

  register.submodule_operations.push(operation);

  // Update updated_at timestamp
  register.updated_at = new Date().toISOString();

  // Write back
  fs.writeFileSync(registerPath, JSON.stringify(register, null, 2));
  console.log(`✅ Register updated successfully`);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: npx ts-node git-manager.ts <operation> <params>");
    console.error("\nOperations:");
    console.error("  create-submodule <repo-path> <spec-path> <spec-name> <spec-domain>");
    console.error("  update-submodule <repo-path> <spec-path>");
    console.error("  commit-specs <spec-path> <message>");
    console.error("  create-backup <spec-path> <output-path> <spec-name>");
    console.error("  update-register <register-path> <operation-json>");
    process.exit(1);
  }

  const operation = args[0];

  try {
    switch (operation) {
      case "create-submodule": {
        if (args.length < 4) {
          throw new Error("Missing parameters for create-submodule");
        }
        createSubmodule({
          repo_path: args[1],
          spec_path: args[2],
          spec_name: args[3],
          spec_domain: args[4] || "custom",
        });
        break;
      }

      case "update-submodule": {
        if (args.length < 2) {
          throw new Error("Missing parameters for update-submodule");
        }
        updateSubmodule({
          repo_path: args[1],
          spec_path: args[2],
          spec_name: args[2].split("/").pop() || "unknown",
          spec_domain: args[2].split("/").slice(-2, -1)[0] || "custom",
        });
        break;
      }

      case "commit-specs": {
        if (args.length < 2) {
          throw new Error("Missing parameters for commit-specs");
        }
        const message = args.slice(2).join(" ");
        const commitHash = commitSpecs(args[1], message);
        console.log(`Commit hash: ${commitHash}`);
        break;
      }

      case "create-backup": {
        if (args.length < 3) {
          throw new Error("Missing parameters for create-backup");
        }
        const metadata = createBackup(args[1], args[2], args[3]);
        console.log(`\nBackup metadata:`);
        console.log(JSON.stringify(metadata, null, 2));
        break;
      }

      case "update-register": {
        if (args.length < 2) {
          throw new Error("Missing parameters for update-register");
        }
        const operationJson = JSON.parse(args[2]);
        updateRegister(args[1], operationJson);
        break;
      }

      default: {
        throw new Error(`Unknown operation: ${operation}`);
      }
    }

    console.log("\n✅ Operation completed successfully");
  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    process.exit(1);
  }
}

main();
