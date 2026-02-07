#!/usr/bin/env ts-node
/**
 * Repository Type Detector
 *
 * Analyzes node analysis files to determine repository type for adaptive structuring
 * Usage: npx ts-node repo-type-detector.ts <_generated_path> <output_path>
 */

import * as fs from "fs";
import * as path from "path";

interface NodeAnalysis {
  id: string;
  name: string;
  content: string;
}

interface RepoTypeResult {
  detected_type:
    | "fullstack"
    | "frontend"
    | "backend"
    | "library"
    | "monorepo"
    | "cli"
    | "framework"
    | "data-pipeline"
    | "ai-ml";
  confidence: number;
  characteristics: string[];
  recommended_structure:
    | "standard"
    | "modular"
    | "ai-focused"
    | "data-focused"
    | "monorepo";
  metrics: {
    frontend_score: number;
    backend_score: number;
    library_score: number;
    monorepo_score: number;
    ai_score: number;
    cli_score: number;
  };
  reasoning: string;
}

/**
 * Read all node files from _generated directory
 */
function readNodes(generatedPath: string): NodeAnalysis[] {
  const nodes: NodeAnalysis[] = [];

  try {
    const files = fs.readdirSync(generatedPath).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(generatedPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const id = file.replace(".md", "");

      nodes.push({
        id,
        name: file,
        content: content.toLowerCase(),
      });
    }
  } catch (error) {
    console.error(`Error reading nodes from ${generatedPath}:`, error);
  }

  return nodes;
}

/**
 * Detect repository type based on node analysis
 */
function detectRepoType(nodes: NodeAnalysis[]): RepoTypeResult {
  let frontendScore = 0;
  let backendScore = 0;
  let libraryScore = 0;
  let monorepoScore = 0;
  let aiScore = 0;
  let cliScore = 0;

  const characteristics: string[] = [];

  // Search for keywords in nodes
  for (const node of nodes) {
    const content = node.content;

    // Frontend indicators
    if (
      content.includes("react") ||
      content.includes("vue") ||
      content.includes("angular") ||
      content.includes("ui component") ||
      content.includes("jsx") ||
      content.includes("tsx") ||
      content.includes("styled-component")
    ) {
      frontendScore += 3;
      if (!characteristics.includes("React/Vue/Angular Components"))
        characteristics.push("React/Vue/Angular Components");
    }

    if (
      content.includes("state management") ||
      content.includes("redux") ||
      content.includes("vuex") ||
      content.includes("zustand")
    ) {
      frontendScore += 2;
      if (!characteristics.includes("Client-side State Management"))
        characteristics.push("Client-side State Management");
    }

    if (
      content.includes("styling") ||
      content.includes("css") ||
      content.includes("tailwind") ||
      content.includes("sass")
    ) {
      frontendScore += 1;
    }

    // Backend indicators
    if (
      content.includes("express") ||
      content.includes("fastapi") ||
      content.includes("django") ||
      content.includes("spring") ||
      content.includes("nestjs") ||
      content.includes("api endpoint") ||
      content.includes("route")
    ) {
      backendScore += 3;
      if (!characteristics.includes("Backend Framework"))
        characteristics.push("Backend Framework");
    }

    if (
      content.includes("database") ||
      content.includes("sql") ||
      content.includes("mongodb") ||
      content.includes("postgres") ||
      content.includes("orm")
    ) {
      backendScore += 2;
      if (!characteristics.includes("Database Layer"))
        characteristics.push("Database Layer");
    }

    if (
      content.includes("microservice") ||
      content.includes("rest api") ||
      content.includes("graphql")
    ) {
      backendScore += 2;
      if (!characteristics.includes("Service Architecture"))
        characteristics.push("Service Architecture");
    }

    // Library/Package indicators
    if (
      content.includes("export") ||
      content.includes("module export") ||
      content.includes("public api") ||
      content.includes("npm package") ||
      content.includes("library")
    ) {
      libraryScore += 2;
      if (!characteristics.includes("Public API/Module Exports"))
        characteristics.push("Public API/Module Exports");
    }

    if (
      content.includes("no ui") ||
      content.includes("utility") ||
      content.includes("helper") ||
      content.includes("no frontend")
    ) {
      libraryScore += 2;
      if (!characteristics.includes("No UI Components"))
        characteristics.push("No UI Components");
    }

    // Monorepo indicators
    if (
      content.includes("monorepo") ||
      content.includes("workspace") ||
      content.includes("multiple package") ||
      content.includes("package.json") ||
      (content.includes("src") && content.includes("packages"))
    ) {
      monorepoScore += 3;
      if (!characteristics.includes("Monorepo Structure"))
        characteristics.push("Monorepo Structure");
    }

    if (
      content.includes("shared") ||
      content.includes("common") ||
      content.includes("internal package")
    ) {
      monorepoScore += 1;
    }

    // AI/ML indicators
    if (
      content.includes("model") ||
      content.includes("training") ||
      content.includes("dataset") ||
      content.includes("tensor") ||
      content.includes("neural")
    ) {
      aiScore += 3;
      if (!characteristics.includes("ML/AI Models"))
        characteristics.push("ML/AI Models");
    }

    if (
      content.includes("pytorch") ||
      content.includes("tensorflow") ||
      content.includes("scikit") ||
      content.includes("pandas")
    ) {
      aiScore += 2;
      if (!characteristics.includes("ML Frameworks"))
        characteristics.push("ML Frameworks");
    }

    // CLI indicators
    if (
      content.includes("cli") ||
      content.includes("command line") ||
      content.includes("command") ||
      content.includes("arguments") ||
      content.includes("stdin") ||
      content.includes("stdout")
    ) {
      cliScore += 2;
      if (!characteristics.includes("CLI Interface"))
        characteristics.push("CLI Interface");
    }

    if (
      content.includes("yargs") ||
      content.includes("commander") ||
      content.includes("click")
    ) {
      cliScore += 2;
    }
  }

  // Normalize scores (max ~10 per category)
  const normalize = (score: number) => Math.min(score / 10, 1.0);

  const normalizedFrontend = normalize(frontendScore);
  const normalizedBackend = normalize(backendScore);
  const normalizedLibrary = normalize(libraryScore);
  const normalizedMonorepo = normalize(monorepoScore);
  const normalizedAi = normalize(aiScore);
  const normalizedCli = normalize(cliScore);

  // Determine primary type
  const scores = {
    fullstack:
      Math.min(normalizedFrontend, normalizedBackend) * 0.8 +
      Math.max(normalizedFrontend, normalizedBackend) * 0.2,
    frontend: normalizedFrontend * 0.7 + (1 - normalizedBackend) * 0.3,
    backend: normalizedBackend * 0.7 + (1 - normalizedFrontend) * 0.3,
    library: normalizedLibrary * 0.8 + (1 - normalizedFrontend) * 0.2,
    monorepo: normalizedMonorepo,
    cli: normalizedCli,
    "ai-ml": normalizedAi,
    "data-pipeline": normalizedBackend * 0.6 + normalizedLibrary * 0.4,
    framework:
      normalizedBackend * 0.5 +
      normalizedLibrary * 0.3 +
      normalizedMonorepo * 0.2,
  };

  // Find highest score
  let maxType: keyof typeof scores = "fullstack";
  let maxScore = scores.fullstack;

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as keyof typeof scores;
    }
  }

  // Determine structure recommendation
  let recommendedStructure: "standard" | "modular" | "ai-focused" | "data-focused" | "monorepo";
  if (maxType === "ai-ml") {
    recommendedStructure = "ai-focused";
  } else if (maxType === "monorepo") {
    recommendedStructure = "monorepo";
  } else if (maxType === "data-pipeline") {
    recommendedStructure = "data-focused";
  } else if (maxType === "library" || maxType === "framework") {
    recommendedStructure = "modular";
  } else {
    recommendedStructure = "standard";
  }

  const reasoning = `
    Repo Type Detection Results:
    - Frontend Score: ${(normalizedFrontend * 100).toFixed(1)}%
    - Backend Score: ${(normalizedBackend * 100).toFixed(1)}%
    - Library Score: ${(normalizedLibrary * 100).toFixed(1)}%
    - Monorepo Score: ${(normalizedMonorepo * 100).toFixed(1)}%
    - AI/ML Score: ${(normalizedAi * 100).toFixed(1)}%
    - CLI Score: ${(normalizedCli * 100).toFixed(1)}%

    Primary Type: ${maxType} (${(maxScore * 100).toFixed(1)}% confidence)
    Characteristics: ${characteristics.join(", ")}
  `;

  return {
    detected_type: maxType as RepoTypeResult["detected_type"],
    confidence: maxScore,
    characteristics,
    recommended_structure: recommendedStructure,
    metrics: {
      frontend_score: normalizedFrontend,
      backend_score: normalizedBackend,
      library_score: normalizedLibrary,
      monorepo_score: normalizedMonorepo,
      ai_score: normalizedAi,
      cli_score: normalizedCli,
    },
    reasoning: reasoning.trim(),
  };
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: npx ts-node repo-type-detector.ts <_generated_path> <output_path>");
    console.error("Example: npx ts-node repo-type-detector.ts ./_generated ./_meta/repo-type.json");
    process.exit(1);
  }

  const generatedPath = args[0];
  const outputPath = args[1];

  // Verify input exists
  if (!fs.existsSync(generatedPath)) {
    console.error(`Error: Generated path does not exist: ${generatedPath}`);
    process.exit(1);
  }

  console.log(`Reading nodes from: ${generatedPath}`);
  const nodes = readNodes(generatedPath);
  console.log(`Found ${nodes.length} node files`);

  if (nodes.length === 0) {
    console.error("No node files found. Exiting.");
    process.exit(1);
  }

  console.log("Analyzing repository type...");
  const result = detectRepoType(nodes);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write result
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ Repository type detection complete`);
  console.log(`Detected Type: ${result.detected_type}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Structure: ${result.recommended_structure}`);
  console.log(`Output: ${outputPath}`);
  console.log(`\nCharacteristics:`);
  result.characteristics.forEach((c) => console.log(`  - ${c}`));
}

main();
