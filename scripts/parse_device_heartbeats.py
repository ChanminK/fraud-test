import argparse
import csv
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
        description=(
            "Normalize device heartbeats CSV into canonical format for comparison.\n"
            "Assumes the device CSV either already has the canonical header or can "
            "be trivially mapped."
        )
    )
    parser.add_argument(
        "input",
        help="Path to device CSV (e.g. data/samples/device-heartbeats.sample.csv)",
    )
    parser.add_argument(
        "output",
        nargs="?",
        help="Path to output CSV (default: same dir as input, 'device-heartbeats.normalized.csv')",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_path = args.input

    if args.output:
        output_path = args.output
    else:
        base_dir = os.path.dirname(os.path.abspath(input_path))
        output_path = os.path.join(base_dir, "device-heartbeats.normalized.csv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(input_path, "r", encoding="utf-8") as fin:
        reader = csv.DictReader(fin)
        input_fields = reader.fieldnames or []

        missing = [f for f in CANONICAL_HEADER if f not in input_fields]
        if missing:
            raise ValueError(
                "Input CSV is missing the following required fields for canonical mapping: "
                + ", ".join(missing)
                + "\nIf your device uses different headers, adjust parse_device_heartbeats.py to map them."
            )

        with open(output_path, "w", encoding="utf-8", newline="") as fout:
            writer = csv.DictWriter(fout, fieldnames=CANONICAL_HEADER)
            writer.writeheader()

            for row_in in reader:
                # Direct passthrough for now,  could transform types if needed
                row_out = {field: row_in.get(field, "") for field in CANONICAL_HEADER}
                writer.writerow(row_out)

    print(f"[parse_device_heartbeats] Wrote normalized CSV to {output_path}")


if __name__ == "__main__":
    main()
