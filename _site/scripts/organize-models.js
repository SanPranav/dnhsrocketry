#!/usr/bin/env node
// Simple organizer: move .x_t files found in repo root into assets/models and produce index.json
// Usage: node scripts/organize-models.js
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const assetsDir = path.join(repoRoot, 'assets');
  const modelsDir = path.join(assetsDir, 'models');
  await fs.mkdir(modelsDir, { recursive: true });

  const files = await fs.readdir(repoRoot);
  const index = [];
  for (const file of files) {
    if (file.toLowerCase().endsWith('.x_t') || file.toLowerCase().endsWith('.xt') ) {
      const src = path.join(repoRoot, file);
      const dest = path.join(modelsDir, file);
      try {
        await fs.rename(src, dest);
        console.log('Moved', file, '->', path.relative(repoRoot, dest));
        index.push({ name: file, url: `assets/models/${file}`, type: 'x_t' });
      } catch (e) {
        console.error('Could not move', file, e.message);
      }
    }
  }

  // Also pick up any existing renderable files in assets/openrocket
  try {
    const openrocketDir = path.join(assetsDir, 'openrocket');
    const openFiles = await fs.readdir(openrocketDir);
    for (const f of openFiles) {
      const ext = f.split('.').pop().toLowerCase();
      if (['ork','stl','obj'].includes(ext)) {
        index.push({ name: f, url: `assets/openrocket/${f}`, type: ext });
      }
    }
  } catch (e) {
    // ignore
  }

  const indexPath = path.join(modelsDir, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
  console.log('Wrote', path.relative(repoRoot, indexPath));
}

main().catch((e) => { console.error(e); process.exit(1); });
