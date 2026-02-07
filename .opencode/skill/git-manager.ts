#!/usr/bin/env ts-node
/**
 * Git Manager - Handle submodule operations, commits, backups, and GitHub repos
 * Version: 1.2.0
 *
 * Usage: npx ts-node git-manager.ts <operation> <params>
 * Operations:
 *   - create-submodule <repo-path> <spec-path> <spec-name>
 *   - update-submodule <repo-path> <spec-path>
 *   - commit-specs <spec-path> <message>
 *   - create-backup <spec-path> <output-path> <spec-name>
 *   - update-register <register-path> <operation-data>
 *   - create-github-repo <repo-name> <description>     (NEW v1.2.0)
 *   - clone-or-init <repo-path> <submodule-path> <remote-url>  (NEW v1.2.0)
 *   - sync-and-push <source-path> <dest-path> <commit-message>  (NEW v1.2.0)
 *   - full-sync <repo-name> <repo-path> <specs-path>   (NEW v1.2.0 - all-in-one)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as crypto from "crypto";

const VERSION = "1.2.0";

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

// NEW v1.2.0: GitHub sync result
interface GitHubSyncResult {
  operation: string;
  version: string;
  timestamp: string;
  status: "completed" | "failed";
  github: {
    repo_created: boolean;
    repo_url: string;
    repo_name: string;
  };
  submodule: {
    path: string;
    status: string;
    commit_hash: string;
  };
  files: {
    total_synced: number;
    markdown_files: number;
  };
  parent_repo: {
    gitmodules_updated: boolean;
    committed: boolean;
  };
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
 * Execute shell command, return null on failure instead of throwing
 */
function execSafe(cmd: string, silent = true): string | null {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch (error) {
    return null;
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

// ============================================================================
// NEW v1.2.0: GitHub CLI Operations
// ============================================================================

/**
 * Get current GitHub username using gh CLI
 */
function getGitHubUser(): string {
  console.log(`\n👤 Getting GitHub username...`);
  const user = execSafe(`gh api user --jq '.login'`);
  if (!user) {
    throw new Error("Could not get GitHub username. Run 'gh auth login' first.");
  }
  console.log(`  User: ${user}`);
  return user;
}

/**
 * Check if a GitHub repo exists
 */
function githubRepoExists(repoName: string): boolean {
  const user = getGitHubUser();
  const result = execSafe(`gh repo view ${user}/${repoName} --json name`);
  return result !== null;
}

/**
 * Create a new GitHub repository using gh CLI
 */
function createGitHubRepo(repoName: string, description: string): { created: boolean; url: string } {
  console.log(`\n🌐 Creating GitHub repository: ${repoName}`);
  
  const user = getGitHubUser();
  const fullName = `${user}/${repoName}`;
  
  // Check if repo already exists
  if (githubRepoExists(repoName)) {
    console.log(`  ℹ️  Repository already exists: ${fullName}`);
    const url = `https://github.com/${fullName}`;
    return { created: false, url };
  }
  
  // Create the repo
  console.log(`  Creating repository...`);
  try {
    exec(`gh repo create ${repoName} --public --description "${description}" --clone=false`, true);
    console.log(`✅ Repository created: ${fullName}`);
    const url = `https://github.com/${fullName}`;
    return { created: true, url };
  } catch (error) {
    // Check if it failed because it already exists
    if (githubRepoExists(repoName)) {
      const url = `https://github.com/${fullName}`;
      return { created: false, url };
    }
    throw error;
  }
}

/**
 * Clone or initialize a submodule from GitHub
 */
function cloneOrInitSubmodule(repoPath: string, submodulePath: string, remoteUrl: string): string {
  console.log(`\n📥 Clone/Init submodule`);
  console.log(`  Repo path: ${repoPath}`);
  console.log(`  Submodule path: ${submodulePath}`);
  console.log(`  Remote URL: ${remoteUrl}`);
  
  const submoduleName = path.basename(submodulePath);
  
  if (fs.existsSync(submodulePath)) {
    console.log(`  Submodule exists, pulling latest...`);
    try {
      exec(`git -C "${submodulePath}" pull origin main`, true);
    } catch {
      try {
        exec(`git -C "${submodulePath}" pull origin master`, true);
      } catch {
        console.log(`  Note: Could not pull (might be first push)`);
      }
    }
    return "updated";
  }
  
  // Try to clone first
  console.log(`  Attempting to clone...`);
  const cloneResult = execSafe(`git clone "${remoteUrl}" "${submodulePath}"`);
  
  if (cloneResult !== null) {
    console.log(`✅ Cloned successfully`);
    return "cloned";
  }
  
  // Clone failed (probably empty repo), initialize locally
  console.log(`  Clone failed, initializing locally...`);
  fs.mkdirSync(submodulePath, { recursive: true });
  exec(`git init "${submodulePath}"`, true);
  exec(`git -C "${submodulePath}" remote add origin "${remoteUrl}"`, true);
  exec(`git -C "${submodulePath}" config user.email "spec-manager@localhost"`, true);
  exec(`git -C "${submodulePath}" config user.name "Spec Manager"`, true);
  
  console.log(`✅ Initialized locally`);
  return "created";
}

/**
 * Sync files from source to destination and push to GitHub
 */
function syncAndPush(sourcePath: string, destPath: string, commitMessage: string): string {
  console.log(`\n🔄 Syncing files`);
  console.log(`  Source: ${sourcePath}`);
  console.log(`  Dest: ${destPath}`);
  
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }
  
  // Clean destination (except .git)
  if (fs.existsSync(destPath)) {
    const files = fs.readdirSync(destPath);
    for (const file of files) {
      if (file !== ".git") {
        const filePath = path.join(destPath, file);
        fs.rmSync(filePath, { recursive: true, force: true });
      }
    }
  }
  
  // Copy all files from source
  console.log(`  Copying files...`);
  const copyCmd = process.platform === "darwin" 
    ? `cp -R "${sourcePath}/"* "${destPath}/"`
    : `cp -r "${sourcePath}/"* "${destPath}/"`;
  exec(copyCmd, true);
  
  // Count files
  const fileCount = countFiles(destPath, true);
  console.log(`  Copied ${fileCount} files`);
  
  // Git operations
  exec(`git -C "${destPath}" config user.email "spec-manager@localhost"`, true);
  exec(`git -C "${destPath}" config user.name "Spec Manager"`, true);
  exec(`git -C "${destPath}" add -A`, true);
  
  // Check if there are changes
  const status = execSafe(`git -C "${destPath}" status --porcelain`);
  if (!status) {
    console.log(`  ℹ️  No changes to commit`);
    return "no-changes";
  }
  
  // Commit
  console.log(`  Committing...`);
  exec(`git -C "${destPath}" commit -m "${commitMessage}"`, true);
  
  // Get commit hash
  const commitHash = execSafe(`git -C "${destPath}" rev-parse HEAD`) || "unknown";
  
  // Push
  console.log(`  Pushing to GitHub...`);
  let pushResult = execSafe(`git -C "${destPath}" push -u origin main`);
  if (!pushResult) {
    // Try master branch
    pushResult = execSafe(`git -C "${destPath}" push -u origin master`);
    if (!pushResult) {
      // First push - create main branch
      exec(`git -C "${destPath}" branch -M main`, true);
      exec(`git -C "${destPath}" push -u origin main`, true);
    }
  }
  
  console.log(`✅ Pushed successfully`);
  return commitHash;
}

/**
 * Update .gitmodules in parent repo
 */
function updateGitmodules(parentPath: string, submoduleName: string, remoteUrl: string): boolean {
  console.log(`\n📝 Updating .gitmodules`);
  console.log(`  Parent: ${parentPath}`);
  console.log(`  Submodule: ${submoduleName}`);
  
  const gitmodulesPath = path.join(parentPath, ".gitmodules");
  const submodulePath = path.join(parentPath, submoduleName);
  
  // Check if already registered
  if (fs.existsSync(gitmodulesPath)) {
    const content = fs.readFileSync(gitmodulesPath, "utf-8");
    if (content.includes(submoduleName)) {
      console.log(`  ℹ️  Submodule already registered`);
      return false;
    }
  }
  
  // Add submodule reference
  console.log(`  Adding submodule reference...`);
  try {
    exec(`git -C "${parentPath}" submodule add "${remoteUrl}" "${submoduleName}"`, true);
  } catch {
    // Might already exist, try to just add files
    exec(`git -C "${parentPath}" add .gitmodules "${submoduleName}"`, true);
  }
  
  // Commit in parent
  exec(`git -C "${parentPath}" add .gitmodules "${submoduleName}"`, true);
  const status = execSafe(`git -C "${parentPath}" status --porcelain`);
  if (status) {
    exec(`git -C "${parentPath}" commit -m "chore: Update ${submoduleName} submodule"`, true);
    console.log(`✅ Parent repo updated`);
    return true;
  }
  
  return false;
}

/**
 * Full sync operation: Create GitHub repo, clone/init, sync files, push, update gitmodules
 * This is the all-in-one operation for Step 11
 */
function fullSync(repoName: string, repoPath: string, specsPath: string): GitHubSyncResult {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Full Sync Operation - spec-zero-lite v${VERSION}`);
  console.log(`${"=".repeat(60)}`);
  console.log(`  Repo: ${repoName}`);
  console.log(`  Repo path: ${repoPath}`);
  console.log(`  Specs path: ${specsPath}`);
  
  const specRepoName = `${repoName}-spec`;
  const submodulePath = path.join(repoPath, specRepoName);
  const timestamp = new Date().toISOString();
  
  const result: GitHubSyncResult = {
    operation: "spec_git_sync",
    version: VERSION,
    timestamp,
    status: "completed",
    github: {
      repo_created: false,
      repo_url: "",
      repo_name: specRepoName,
    },
    submodule: {
      path: submodulePath,
      status: "",
      commit_hash: "",
    },
    files: {
      total_synced: 0,
      markdown_files: 0,
    },
    parent_repo: {
      gitmodules_updated: false,
      committed: false,
    },
  };
  
  try {
    // Step 1: Create GitHub repo
    const githubResult = createGitHubRepo(specRepoName, `Technical specifications for ${repoName}`);
    result.github.repo_created = githubResult.created;
    result.github.repo_url = githubResult.url;
    
    // Step 2: Clone or init submodule
    const cloneStatus = cloneOrInitSubmodule(repoPath, submodulePath, githubResult.url);
    result.submodule.status = cloneStatus;
    
    // Step 3: Sync and push
    const commitMessage = `feat: Update specifications from ${repoName} analysis\n\nGenerated at: ${timestamp}\nEngine: spec-zero-lite v${VERSION}`;
    const commitHash = syncAndPush(specsPath, submodulePath, commitMessage);
    result.submodule.commit_hash = commitHash;
    
    // Step 4: Count files
    result.files.total_synced = countFiles(submodulePath, true);
    result.files.markdown_files = countMarkdownFiles(submodulePath);
    
    // Step 5: Update gitmodules
    result.parent_repo.gitmodules_updated = updateGitmodules(repoPath, specRepoName, githubResult.url);
    result.parent_repo.committed = result.parent_repo.gitmodules_updated;
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`✅ Full sync completed successfully!`);
    console.log(`  GitHub: ${result.github.repo_url}`);
    console.log(`  Files: ${result.files.total_synced}`);
    console.log(`${"=".repeat(60)}\n`);
    
  } catch (error) {
    result.status = "failed";
    console.error(`\n❌ Full sync failed: ${error}`);
    throw error;
  }
  
  return result;
}

/**
 * Count markdown files in directory
 */
function countMarkdownFiles(dirPath: string): number {
  let count = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file === ".git") continue;
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      count += countMarkdownFiles(filePath);
    } else if (file.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`Git Manager v${VERSION}`);
    console.error("\nUsage: npx ts-node git-manager.ts <operation> <params>");
    console.error("\nOperations:");
    console.error("  create-submodule <repo-path> <spec-path> <spec-name> <spec-domain>");
    console.error("  update-submodule <repo-path> <spec-path>");
    console.error("  commit-specs <spec-path> <message>");
    console.error("  create-backup <spec-path> <output-path> <spec-name>");
    console.error("  update-register <register-path> <operation-json>");
    console.error("\n  NEW v1.2.0:");
    console.error("  create-github-repo <repo-name> <description>");
    console.error("  clone-or-init <repo-path> <submodule-path> <remote-url>");
    console.error("  sync-and-push <source-path> <dest-path> <commit-message>");
    console.error("  full-sync <repo-name> <repo-path> <specs-path>  (all-in-one)");
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

      // NEW v1.2.0 operations
      case "create-github-repo": {
        if (args.length < 2) {
          throw new Error("Missing parameters: create-github-repo <repo-name> <description>");
        }
        const description = args.slice(2).join(" ") || "Technical specifications";
        const result = createGitHubRepo(args[1], description);
        console.log(`\nResult:`);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "clone-or-init": {
        if (args.length < 4) {
          throw new Error("Missing parameters: clone-or-init <repo-path> <submodule-path> <remote-url>");
        }
        const status = cloneOrInitSubmodule(args[1], args[2], args[3]);
        console.log(`Status: ${status}`);
        break;
      }

      case "sync-and-push": {
        if (args.length < 3) {
          throw new Error("Missing parameters: sync-and-push <source-path> <dest-path> <commit-message>");
        }
        const commitMsg = args.slice(3).join(" ") || "Update specifications";
        const hash = syncAndPush(args[1], args[2], commitMsg);
        console.log(`Commit hash: ${hash}`);
        break;
      }

      case "full-sync": {
        if (args.length < 4) {
          throw new Error("Missing parameters: full-sync <repo-name> <repo-path> <specs-path>");
        }
        const syncResult = fullSync(args[1], args[2], args[3]);
        console.log(`\nSync Result:`);
        console.log(JSON.stringify(syncResult, null, 2));
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
