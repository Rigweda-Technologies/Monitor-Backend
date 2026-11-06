#!/usr/bin/env python3
"""Reject Lambda build artifacts that exceed a conservative unzipped size limit."""

import argparse
from pathlib import Path
import sys

DEFAULT_MAX_BYTES = 240 * 1024 * 1024


def package_size(root: Path) -> int:
    if not root.is_dir():
        raise ValueError(f"Lambda package directory does not exist: {root}")
    return sum(path.stat().st_size for path in root.rglob("*") if path.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package_dir", type=Path)
    parser.add_argument("--max-bytes", type=int, default=DEFAULT_MAX_BYTES)
    args = parser.parse_args()

    try:
        size = package_size(args.package_dir)
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2

    print(f"Lambda unzipped package size: {size:,} bytes (limit {args.max_bytes:,})")
    if size > args.max_bytes:
        print("Lambda package exceeds the configured deployment safety limit.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
