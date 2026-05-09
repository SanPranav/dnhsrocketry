#!/usr/bin/env python3
"""
Best-effort FreeCAD conversion helper for x_t -> obj.
Requires a FreeCAD build that can import Parasolid x_t.
"""
import os
import sys


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: freecad-convert-x_t.py <input.x_t> <output.obj>", file=sys.stderr)
        return 2

    input_path = os.path.abspath(sys.argv[1])
    output_path = os.path.abspath(sys.argv[2])
    out_dir = os.path.dirname(output_path)
    os.makedirs(out_dir, exist_ok=True)

    try:
        import FreeCAD as App  # type: ignore
        import Import  # type: ignore
        import Mesh  # type: ignore
        import MeshPart  # type: ignore
        import Part  # type: ignore
    except Exception as exc:  # pragma: no cover
        print(f"FreeCAD modules not available: {exc}", file=sys.stderr)
        return 1

    doc = App.newDocument("ConvertXT")
    try:
        Import.insert(input_path, doc.Name)
        doc.recompute()

        solids = []
        for obj in doc.Objects:
            shape = getattr(obj, "Shape", None)
            if shape is not None and not shape.isNull():
                solids.append(shape)

        if not solids:
            print("No solid geometry imported from x_t", file=sys.stderr)
            return 1

        compound = Part.makeCompound(solids)
        mesh = MeshPart.meshFromShape(
            Shape=compound,
            LinearDeflection=0.1,
            AngularDeflection=0.35,
            Relative=False,
        )
        mesh.write(output_path)
        print(f"Wrote {output_path}")
        return 0
    finally:
        App.closeDocument(doc.Name)


if __name__ == "__main__":
    raise SystemExit(main())
