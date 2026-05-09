# dnhsrocketry

## Local utilities

A small helper script moves any `.x_t` files found in the repo root into `assets/models` and generates `assets/models/index.json` so the site can list uploaded models under the Projects page.

Run it from the repo root with:

```bash
node scripts/organize-models.js
```

## CAD conversion for web preview (1:1 workflow)

The Projects page renderer auto-loads `assets/models/Assembly_1.obj`.

To regenerate that mesh from `Assembly 1.x_t`, run:

```bash
node scripts/convert-assembly-model.js
```

The converter script tries these strategies in order:

1. `CAD_CONVERTER_CMD` (custom command override)
2. `assimp`
3. `cadexchangercli`
4. `freecadcmd` / `FreeCADCmd`

Successful conversion writes:

- `assets/models/Assembly_1.obj`
- `assets/models/Assembly_1.meta.json`
- `assets/models/index.json`

Example custom override:

```bash
CAD_CONVERTER_CMD='myconverter --input {input} --output {output}' node scripts/convert-assembly-model.js
```