#!/usr/bin/env node
/*
 * Convert Assembly 1.x_t into a web-renderable OBJ mesh for the site renderer.
 *
 * Usage:
 *   node scripts/convert-assembly-model.js
 *
 * Optional env override:
 *   CAD_CONVERTER_CMD='mytool --in "{input}" --out "{output}"' node scripts/convert-assembly-model.js
 */
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const inputPath = path.join(repoRoot, "Assembly 1.x_t");
const outDir = path.join(repoRoot, "assets", "models");
const outputObjPath = path.join(outDir, "Assembly_1.obj");
const metaPath = path.join(outDir, "Assembly_1.meta.json");
const indexPath = path.join(outDir, "index.json");

function runCommand(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
    shell: false,
    ...opts
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

function runShell(command) {
  const result = spawnSync(command, {
    cwd: repoRoot,
    stdio: "pipe",
    encoding: "utf8",
    shell: true
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

function objLooksValid(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw || raw.length < 100) return false;
  const lines = raw.split(/\r?\n/);
  let vertexCount = 0;
  let faceCount = 0;
  for (const line of lines) {
    if (line.startsWith("v ")) vertexCount += 1;
    if (line.startsWith("f ")) faceCount += 1;
    if (vertexCount > 20 && faceCount > 20) return true;
  }
  return vertexCount > 3 && faceCount > 1;
}

async function writeMetadata(strategy) {
  const stats = await fsp.stat(outputObjPath);
  const meta = {
    source: path.relative(repoRoot, inputPath).replaceAll(path.sep, "/"),
    output: path.relative(repoRoot, outputObjPath).replaceAll(path.sep, "/"),
    convertedAt: new Date().toISOString(),
    strategy,
    bytes: stats.size
  };

  await fsp.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  const index = [
    {
      name: "Assembly 1",
      source: "Assembly 1.x_t",
      url: "assets/models/Assembly_1.obj",
      type: "obj",
      generated: true
    }
  ];

  await fsp.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${path.relative(repoRoot, inputPath)}`);
  }

  await fsp.mkdir(outDir, { recursive: true });

  const attempts = [];

  const custom = process.env.CAD_CONVERTER_CMD;
  if (custom && custom.trim()) {
    const cmd = custom
      .replaceAll("{input}", `"${inputPath}"`)
      .replaceAll("{output}", `"${outputObjPath}"`);
    const result = runShell(cmd);
    attempts.push({ name: "CAD_CONVERTER_CMD", result });
    if (result.ok && objLooksValid(outputObjPath)) {
      await writeMetadata("CAD_CONVERTER_CMD");
      console.log("Converted with CAD_CONVERTER_CMD -> assets/models/Assembly_1.obj");
      return;
    }
  }

  const strategyList = [
    {
      name: "assimp export",
      command: "assimp",
      args: ["export", inputPath, outputObjPath]
    },
    {
      name: "cadexchangercli convert",
      command: "cadexchangercli",
      args: ["convert", inputPath, outputObjPath]
    },
    {
      name: "freecadcmd python macro",
      command: "freecadcmd",
      args: [path.join(__dirname, "freecad-convert-x_t.py"), inputPath, outputObjPath]
    },
    {
      name: "FreeCADCmd python macro",
      command: "FreeCADCmd",
      args: [path.join(__dirname, "freecad-convert-x_t.py"), inputPath, outputObjPath]
    }
  ];

  for (const strategy of strategyList) {
    const result = runCommand(strategy.command, strategy.args);
    attempts.push({ name: strategy.name, result });
    if (result.ok && objLooksValid(outputObjPath)) {
      await writeMetadata(strategy.name);
      console.log(`Converted with ${strategy.name} -> assets/models/Assembly_1.obj`);
      return;
    }
  }

  const attemptSummary = attempts.map((attempt) => {
    const details = [
      `strategy=${attempt.name}`,
      `status=${attempt.result.status}`
    ];
    if (attempt.result.error) details.push(`error=${attempt.result.error}`);
    const errLine = attempt.result.stderr.trim().split(/\r?\n/).filter(Boolean)[0];
    if (errLine) details.push(`stderr=${errLine}`);
    return `- ${details.join(" | ")}`;
  }).join("\n");

  throw new Error(
    [
      "Unable to convert Assembly 1.x_t to OBJ automatically.",
      "Tried converter strategies:",
      attemptSummary || "- No strategies attempted",
      "",
      "Install one of these and rerun:",
      "1) assimp (command: assimp export \"Assembly 1.x_t\" assets/models/Assembly_1.obj)",
      "2) CAD Exchanger CLI (command: cadexchangercli convert ...)",
      "3) FreeCAD with x_t import support (command: freecadcmd)"
    ].join("\n")
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
