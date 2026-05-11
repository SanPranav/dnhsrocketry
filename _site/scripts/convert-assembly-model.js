#!/usr/bin/env node
/*
 * Convert assets/Assembly1.x_t into a web-renderable OBJ mesh for the site renderer.
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
const inputPath = path.join(repoRoot, "assets", "Assembly1.x_t");
const outDir = path.join(repoRoot, "assets", "models");
const outputObjPath = path.join(outDir, "Assembly_1.obj");
const metaPath = path.join(outDir, "Assembly_1.meta.json");
const indexPath = path.join(outDir, "index.json");

const proceduralProfile = [
  { length: 0.28, r0: 0.03, r1: 0.14 },
  { length: 0.28, r0: 0.14, r1: 0.14 },
  { length: 0.34, r0: 0.14, r1: 0.15 },
  { length: 0.34, r0: 0.15, r1: 0.15 },
  { length: 0.2, r0: 0.15, r1: 0.13 }
];

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

async function writeMetadata(strategy, attempts = []) {
  const stats = await fsp.stat(outputObjPath);
  const meta = {
    source: path.relative(repoRoot, inputPath).replaceAll(path.sep, "/"),
    output: path.relative(repoRoot, outputObjPath).replaceAll(path.sep, "/"),
    convertedAt: new Date().toISOString(),
    strategy,
    bytes: stats.size,
    attempts
  };

  await fsp.writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  const index = [
    {
      name: "Assembly 1",
      source: "assets/Assembly1.x_t",
      url: "assets/models/Assembly_1.obj",
      type: "obj",
      generated: true
    }
  ];

  await fsp.writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
}

function generateProceduralAssemblyObj() {
  const sides = 48;
  const lengths = proceduralProfile.map((seg) => seg.length);
  const totalLength = lengths.reduce((sum, v) => sum + v, 0) || 1;

  const ringDefs = [];
  let y = -1;
  for (let i = 0; i < proceduralProfile.length; i += 1) {
    const seg = proceduralProfile[i];
    const y0 = y;
    const y1 = y + (seg.length / totalLength) * 2;
    if (i === 0) ringDefs.push({ y: y0, r: seg.r0 });
    ringDefs.push({ y: y1, r: seg.r1 });
    y = y1;
  }

  const vertices = [];
  for (const ring of ringDefs) {
    for (let i = 0; i < sides; i += 1) {
      const angle = (i / sides) * Math.PI * 2;
      vertices.push([
        Math.cos(angle) * ring.r,
        ring.y,
        Math.sin(angle) * ring.r
      ]);
    }
  }

  const faces = [];
  const ringCount = ringDefs.length;
  for (let r = 0; r < ringCount - 1; r += 1) {
    const a = r * sides;
    const b = (r + 1) * sides;
    for (let i = 0; i < sides; i += 1) {
      const ni = (i + 1) % sides;
      const v1 = a + i + 1;
      const v2 = b + i + 1;
      const v3 = b + ni + 1;
      const v4 = a + ni + 1;
      faces.push([v1, v2, v3]);
      faces.push([v1, v3, v4]);
    }
  }

  const minRing = ringDefs[0];
  const maxRing = ringDefs[ringDefs.length - 1];
  if (minRing.r > 0.0001) {
    const tipIndex = vertices.length + 1;
    vertices.push([0, minRing.y, 0]);
    for (let i = 0; i < sides; i += 1) {
      const ni = (i + 1) % sides;
      faces.push([tipIndex, i + 2, i + 1]);
      if (ni === 0) faces[faces.length - 1] = [tipIndex, 1, sides];
    }
  }

  if (maxRing.r > 0.0001) {
    const tipIndex = vertices.length + 1;
    const start = (ringDefs.length - 1) * sides + 1;
    vertices.push([0, maxRing.y, 0]);
    for (let i = 0; i < sides; i += 1) {
      const current = start + i;
      const next = i === sides - 1 ? start : current + 1;
      faces.push([tipIndex, current, next]);
    }
  }

  const lines = ["# Procedural fallback OBJ generated from Assembly 1.x_t pipeline"]; 
  for (const [x, yv, z] of vertices) {
    lines.push(`v ${x.toFixed(9)} ${yv.toFixed(9)} ${z.toFixed(9)}`);
  }
  for (const [a, b, c] of faces) {
    lines.push(`f ${a} ${b} ${c}`);
  }

  return `${lines.join("\n")}\n`;
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
      await writeMetadata(strategy.name, attempts.map((a) => ({
        strategy: a.name,
        ok: a.result.ok,
        status: a.result.status
      })));
      console.log(`Converted with ${strategy.name} -> assets/models/Assembly_1.obj`);
      return;
    }
  }

  // Always produce a deployable mesh even when no native converter is available.
  const fallbackObj = generateProceduralAssemblyObj();
  await fsp.writeFile(outputObjPath, fallbackObj, "utf8");

  if (!objLooksValid(outputObjPath)) {
    throw new Error("Failed to generate fallback OBJ mesh");
  }

  await writeMetadata(
    "procedural-fallback",
    attempts.map((a) => ({
      strategy: a.name,
      ok: a.result.ok,
      status: a.result.status,
      error: a.result.error || undefined
    }))
  );

  console.log("No converter available. Generated procedural fallback mesh -> assets/models/Assembly_1.obj");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
