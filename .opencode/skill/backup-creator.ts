#!/usr/bin/env ts-node
/**
 * Backup Creator - Create tar.gz archives of analysis results
 *
 * Creates compressed tar.gz backups of:
 * - _meta/ (entire process)
 * - _generated/ (analysis results)
 * - {reponame}-Specs/ (organized specs)
 *
 * Usage: npx ts-node backup-creator.ts <repo-name> <base-path> <output-path>
 * Example: npx ts-node backup-creator.ts spec-zero-lite . ./backups/
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";

interface BackupMetadata {
  repo_name: string;
  created_at: string;
  step: number;
  timestamp: string;
  directories_included: string[];
  total_files: number;
  uncompressed_size_kb: number;
  compressed_size_kb: number;
  compression_ratio: string;
  tar_gz_path: string;
  md5_checksum: string;
}

/**
 * Calculate directory size recursively
 */
function getDirSize(dirPath: string): number {
  let size = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dirPath}:`, error);
  }

  return size;
}

/**
 * Count files recursively
 */
function countFiles(dirPath: string): number {
  let count = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        count += countFiles(filePath);
      } else {
        count += 1;
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not count files in ${dirPath}:`, error);
  }

  return count;
}

/**
 * Create tar.gz backup
 */
function createBackup(
  repoName: string,
  basePath: string,
  outputPath: string
): BackupMetadata {
  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `backup-${repoName}-${timestamp}.tar.gz`;
  const backupFilePath = path.join(outputPath, backupFileName);

  const dirsToBackup = ["_meta", "_generated"];
  const specsDir = `${repoName}-Specs`;

  // Check which directories exist
  const existingDirs: string[] = [];
  let totalFiles = 0;
  let uncompressedSize = 0;

  console.log("Calculating backup size...");

  for (const dir of dirsToBackup) {
    const fullPath = path.join(basePath, dir);
    if (fs.existsSync(fullPath)) {
      existingDirs.push(dir);
      totalFiles += countFiles(fullPath);
      uncompressedSize += getDirSize(fullPath);
    }
  }

  if (fs.existsSync(path.join(basePath, specsDir))) {
    existingDirs.push(specsDir);
    totalFiles += countFiles(path.join(basePath, specsDir));
    uncompressedSize += getDirSize(path.join(basePath, specsDir));
  }

  if (existingDirs.length === 0) {
    throw new Error("No directories found to backup (_meta, _generated, or specs)");
  }

  console.log(`Found ${existingDirs.length} directories to backup`);
  console.log(`Total files: ${totalFiles}`);
  console.log(`Uncompressed size: ${(uncompressedSize / 1024).toFixed(2)} KB`);

  // Create tar.gz
  console.log(`Creating backup: ${backupFileName}`);

  try {
    const tarCommand = `cd "${basePath}" && tar -czf "${backupFilePath}" ${existingDirs
      .map((d) => `"${d}"`)
      .join(" ")}`;

    execSync(tarCommand, { stdio: "inherit" });
  } catch (error) {
    throw new Error(`Failed to create tar.gz: ${error}`);
  }

  // Verify tar.gz was created
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not created: ${backupFilePath}`);
  }

  const stats = fs.statSync(backupFilePath);
  const compressedSize = stats.size;
  const compressionRatio = (
    ((uncompressedSize - compressedSize) / uncompressedSize) *
    100
  ).toFixed(1);

  // Calculate MD5 checksum
  console.log("Calculating checksum...");
  let md5Checksum = "";
  try {
    md5Checksum = execSync(`md5sum "${backupFilePath}" | awk '{print $1}'`)
      .toString()
      .trim();
  } catch (error) {
    console.warn("Warning: Could not calculate MD5 checksum");
    md5Checksum = "not-calculated";
  }

  const metadata: BackupMetadata = {
    repo_name: repoName,
    created_at: new Date().toISOString(),
    step: 10,
    timestamp,
    directories_included: existingDirs,
    total_files: totalFiles,
    uncompressed_size_kb: Math.round(uncompressedSize / 1024),
    compressed_size_kb: Math.round(compressedSize / 1024),
    compression_ratio: `${compressionRatio}%`,
    tar_gz_path: backupFilePath,
    md5_checksum: md5Checksum,
  };

  // Write metadata file
  const metadataPath = path.join(outputPath, `backup-${repoName}-${timestamp}-metadata.json`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  console.log(`\n✅ Backup created successfully`);
  console.log(`File: ${backupFilePath}`);
  console.log(`Metadata: ${metadataPath}`);
  console.log(`\nBackup Statistics:`);
  console.log(`  • Compressed Size: ${(compressedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  • Uncompressed Size: ${(uncompressedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  • Compression Ratio: ${compressionRatio}%`);
  console.log(`  • Total Files: ${totalFiles}`);
  console.log(`  • Directories: ${existingDirs.join(", ")}`);
  console.log(`  • MD5: ${md5Checksum}`);

  return metadata;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error("Usage: npx ts-node backup-creator.ts <repo-name> <base-path> <output-path>");
    console.error("Example: npx ts-node backup-creator.ts spec-zero-lite . ./backups/");
    process.exit(1);
  }

  const repoName = args[0];
  const basePath = args[1];
  const outputPath = args[2];

  // Verify base path exists
  if (!fs.existsSync(basePath)) {
    console.error(`Error: Base path does not exist: ${basePath}`);
    process.exit(1);
  }

  console.log(`Starting backup creation...`);
  console.log(`Repository: ${repoName}`);
  console.log(`Base Path: ${basePath}`);
  console.log(`Output Path: ${outputPath}\n`);

  try {
    const metadata = createBackup(repoName, basePath, outputPath);
    console.log(`\n📦 Backup complete and ready for storage/distribution`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

main();
