import argparse
import csv
import json
import os
from typing import List

CANONICAL_HEADER: List[str] = [
    "Time",
    "Project",
    "Language",
    "Editor",
    "File Path",
    "Line",
    "Col",
    "Lines",
    "Write",
    "Source",
    "Branch",
    "Category",
    "Machine",
    "User Agent",
    "IP",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert VS Code NDJSON heartbeats to canonical CSV format."
    )
    parser.add_argument(
        "input",
        help="Path to NDJSON file (e.g. data/output/vscode-heartbeats.ndjson)",
    )
    parser.add_argument(
        "output",
        nargs="?",
        help="Path to output CSV (default: same dir as input, 'vs-heartbeats.csv')",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    input_path = args.input
    if args.output:
        output_path = args.output
    else:
        base_dir = os.path.dirname(os.path.abspath(input_path))
        output_path = os.path.join(base_dir, "vs-heartbeats.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(input_path, "r", encoding="utf-8") as fin, open(
        output_path, "w", encoding="utf-8", newline=""
    ) as fout:
        writer = csv.DictWriter(fout, fieldnames=CANONICAL_HEADER)
        writer.writeheader()

        for line in fin:
            line = line.strip()
            if not line:
                continue

            try:
                hb = json.loads(line)
            except json.JSONDecodeError:
                print(f"Skipping invalid JSON line: {line[:80]}...")
                continue

            # Map NDJSON → canonical row
            row = {
                "Time": hb.get("time", ""),
                "Project": hb.get("project", ""),
                "Language": hb.get("language", ""),
                "Editor": hb.get("editor", "vscode"),
                "File Path": hb.get("filePath", ""),
                "Line": hb.get("line", 0),
                "Col": hb.get("col", 0),
                "Lines": hb.get("lines", 0),
                "Write": "✔" if hb.get("write", False) else "✗",
                "Source": hb.get("source", ""),
                "Branch": hb.get("branch", ""),
                "Category": hb.get("category", ""),
                "Machine": hb.get("machine", ""),
                "User Agent": hb.get("userAgent", ""),
                "IP": hb.get("ip", ""),
            }

            writer.writerow(row)

    print(f"[parse_vs_heartbeats] Wrote CSV to {output_path}")


if __name__ == "__main__":
    main()
