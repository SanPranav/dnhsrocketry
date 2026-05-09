# dnhsrocketry

## Local utilities

A small helper script moves any `.x_t` files found in the repo root into `assets/models` and generates `assets/models/index.json` so the site can list uploaded models under the Projects page.

Run it from the repo root with:

```bash
node scripts/organize-models.js
```