import argparse
import csv
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

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


@dataclass
class Heartbeat:
    time: datetime
    row: Dict[str, Any]


def parse_iso8601(dt_str: str) -> datetime:
    """Parse ISO8601-ish timestamps, handling Z and no timezone."""
    dt_str = dt_str.strip()
    if dt_str.endswith("Z"):
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    else:
        try:
            dt = datetime.fromisoformat(dt_str)
        except ValueError:
            # Try naive
            dt = datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S.%f")
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
    return dt


def load_beats(path: str) -> List[Heartbeat]:
    beats: List[Heartbeat] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t_raw = row.get("Time", "")
            if not t_raw:
                continue
            try:
                t = parse_iso8601(t_raw)
            except Exception as e:
                print(f"Skipping row with invalid Time '{t_raw}': {e}")
                continue
            beats.append(Heartbeat(time=t, row=row))
    return beats


def find_best_match(
    hb_vs: Heartbeat,
    device_beats: List[Heartbeat],
    used_indices: set,
    time_tolerance_seconds: float,
) -> Optional[int]:
    """
    Find best device heartbeat index for the given VS heartbeat.
    Matching rule:
      - same Project (if present)
      - same File Path
      - |time difference| <= tolerance
    Picks the closest in time.
    """
    vs_row = hb_vs.row
    vs_project = vs_row.get("Project", "")
    vs_file = vs_row.get("File Path", "")

    best_idx: Optional[int] = None
    best_delta = None

    for i, hb_dev in enumerate(device_beats):
        if i in used_indices:
            continue

        dev_row = hb_dev.row
        dev_project = dev_row.get("Project", "")
        dev_file = dev_row.get("File Path", "")

        # Need same file path
        if vs_file and dev_file and vs_file != dev_file:
            continue
        if vs_project and dev_project and vs_project != dev_project:
            continue

        delta = abs((hb_dev.time - hb_vs.time).total_seconds())
        if delta <= time_tolerance_seconds:
            if best_delta is None or delta < best_delta:
                best_delta = delta
                best_idx = i

    return best_idx


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare device vs VS Code heartbeats in canonical CSV format."
    )
    parser.add_argument(
        "device_csv",
        help="Path to normalized device CSV "
             "(e.g. data/samples/device-heartbeats.normalized.csv)",
    )
    parser.add_argument(
        "vs_csv",
        help="Path to normalized VS CSV "
             "(e.g. data/output/vs-heartbeats.csv)",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Path to combined output CSV (default: data/output/combined-heartbeats.csv "
             "relative to the repo root if detectable).",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=5.0,
        help="Time tolerance in seconds for matching heartbeats (default: 5s).",
    )
    return parser.parse_args()


def guess_default_output_path(device_csv: str, vs_csv: str) -> str:
    # Trying to find a common ancestor 
    common_root = os.path.commonpath(
        [os.path.abspath(device_csv), os.path.abspath(vs_csv)]
    )
    # Just use VS CSV directory at end case
    base_dir = os.path.dirname(os.path.abspath(vs_csv))

    # Using data/output/ if it detects that
    if "data" in common_root.split(os.sep):
        parts = common_root.split(os.sep)
        try:
            idx = parts.index("data")
            data_root = os.sep.join(parts[: idx + 1])
        except ValueError:
            data_root = common_root
        out_dir = os.path.join(data_root, "output")
    else:
        out_dir = os.path.join(base_dir, "combined")

    os.makedirs(out_dir, exist_ok=True)
    return os.path.join(out_dir, "combined-heartbeats.csv")


def main() -> None:
    args = parse_args()

    device_beats = load_beats(args.device_csv)
    vs_beats = load_beats(args.vs_csv)

    print(f"[compare_heartbeats] Loaded {len(device_beats)} device beats")
    print(f"[compare_heartbeats] Loaded {len(vs_beats)} VS beats")

    if args.output:
        output_path = args.output
    else:
        output_path = guess_default_output_path(args.device_csv, args.vs_csv)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    used_indices: set = set()
    matched_count = 0
    unmatched_count = 0

    fieldnames = [
        "VS Time",
        "Device Time",
        "Delta Seconds",
        "Matched",
        "File Path",
        "Project",
        "VS Category",
        "Device Category",
        "VS Write",
        "Device Write",
    ]

    with open(output_path, "w", encoding="utf-8", newline="") as fout:
        writer = csv.DictWriter(fout, fieldnames=fieldnames)
        writer.writeheader()

        for hb_vs in vs_beats:
            idx = find_best_match(
                hb_vs,
                device_beats,
                used_indices,
                time_tolerance_seconds=args.tolerance,
            )

            if idx is None:
                unmatched_count += 1
                writer.writerow(
                    {
                        "VS Time": hb_vs.row.get("Time", ""),
                        "Device Time": "",
                        "Delta Seconds": "",
                        "Matched": "no",
                        "File Path": hb_vs.row.get("File Path", ""),
                        "Project": hb_vs.row.get("Project", ""),
                        "VS Category": hb_vs.row.get("Category", ""),
                        "Device Category": "",
                        "VS Write": hb_vs.row.get("Write", ""),
                        "Device Write": "",
                    }
                )
            else:
                used_indices.add(idx)
                hb_dev = device_beats[idx]
                delta = (hb_dev.time - hb_vs.time).total_seconds()
                matched_count += 1

                writer.writerow(
                    {
                        "VS Time": hb_vs.row.get("Time", ""),
                        "Device Time": hb_dev.row.get("Time", ""),
                        "Delta Seconds": f"{delta:.3f}",
                        "Matched": "yes",
                        "File Path": hb_vs.row.get("File Path", ""),
                        "Project": hb_vs.row.get("Project", ""),
                        "VS Category": hb_vs.row.get("Category", ""),
                        "Device Category": hb_dev.row.get("Category", ""),
                        "VS Write": hb_vs.row.get("Write", ""),
                        "Device Write": hb_dev.row.get("Write", ""),
                    }
                )

    print(f"[compare_heartbeats] Matched: {matched_count}")
    print(f"[compare_heartbeats] Unmatched VS beats: {unmatched_count}")
    print(f"[compare_heartbeats] Combined CSV written to: {output_path}")


if __name__ == "__main__":
    main()
