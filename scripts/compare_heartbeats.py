"""
Compare VS/WakaTime heartbeats against device heartbeats.

"""

import argparse
import csv
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional, Tuple

from parse_vs_heartbeats import parse_vs_heartbeats
from parse_device_heartbeats import parse_device_heartbeats


@dataclass
class MatchedPair:
    vs_index: Optional[int]  
    device_index: Optional[int]  


def match_heartbeats(
    vs_hb, device_hb, time_tolerance_seconds: float = 2.0
) -> List[MatchedPair]:
    """
    Walk two sorted lists of heartbeats and pair them if they are close in time
    and refer to the same project + file_path.

    Very simple greedy matcher – good enough to find obvious mismatches.
    """

    vs_sorted = sorted(enumerate(vs_hb), key=lambda x: x[1].time)
    dev_sorted = sorted(enumerate(device_hb), key=lambda x: x[1].time)

    i, j = 0, 0
    pairs: List[MatchedPair] = []
    tolerance = timedelta(seconds=time_tolerance_seconds)

    while i < len(vs_sorted) and j < len(dev_sorted):
        vs_idx, vs = vs_sorted[i]
        dev_idx, dev = dev_sorted[j]

        dt = vs.time - dev.time

        same_context = (vs.project == dev.project) and (vs.file_path == dev.file_path)

        if abs(dt) <= tolerance and same_context:
            pairs.append(MatchedPair(vs_index=vs_idx, device_index=dev_idx))
            i += 1
            j += 1
        else:
            if vs.time < dev.time:
                pairs.append(MatchedPair(vs_index=vs_idx, device_index=None))
                i += 1
            else:
                pairs.append(MatchedPair(vs_index=None, device_index=dev_idx))
                j += 1

    while i < len(vs_sorted):
        vs_idx, _ = vs_sorted[i]
        pairs.append(MatchedPair(vs_index=vs_idx, device_index=None))
        i += 1

    while j < len(dev_sorted):
        dev_idx, _ = dev_sorted[j]
        pairs.append(MatchedPair(vs_index=None, device_index=dev_idx))
        j += 1

    return pairs


def write_comparison_csv(
    output_path: Path,
    vs_hb,
    device_hb,
    matches: List[MatchedPair],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "match_type", 
                "vs_time",
                "device_time",
                "project",
                "file_path",
                "vs_line",
                "device_line",
                "vs_col",
                "device_col",
                "vs_source",
                "device_source",
            ]
        )

        for pair in matches:
            if pair.vs_index is not None:
                vs = vs_hb[pair.vs_index]
            else:
                vs = None

            if pair.device_index is not None:
                dev = device_hb[pair.device_index]
            else:
                dev = None

            if vs and dev:
                match_type = "match"
            elif vs and not dev:
                match_type = "vs_only"
            elif dev and not vs:
                match_type = "device_only"
            else:
                # shouldn't happen...
                continue

            writer.writerow(
                [
                    match_type,
                    vs.time.isoformat() if vs else "",
                    dev.time.isoformat() if dev else "",
                    (vs.project if vs else dev.project) if (vs or dev) else "",
                    (vs.file_path if vs else dev.file_path) if (vs or dev) else "",
                    vs.line if vs else "",
                    dev.line if dev else "",
                    vs.col if vs else "",
                    dev.col if dev else "",
                    vs.source if vs else "",
                    dev.source if dev else "",
                ]
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare VS and device heartbeats.")
    parser.add_argument("--vs", required=True, help="Path to vs-heartbeats.log (CSV).")
    parser.add_argument(
        "--device", required=True, help="Path to device-heartbeats.log (CSV)."
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=2.0,
        help="Time tolerance in seconds for matching (default: 2.0).",
    )
    parser.add_argument(
        "--output",
        default="../data/output/comparison-results.csv",
        help="Path to comparison output CSV.",
    )
    args = parser.parse_args()

    vs_hb = parse_vs_heartbeats(args.vs)
    dev_hb = parse_device_heartbeats(args.device)

    print(f"VS heartbeats: {len(vs_hb)}")
    print(f"Device heartbeats: {len(dev_hb)}")

    matches = match_heartbeats(vs_hb, dev_hb, time_tolerance_seconds=args.tolerance)

    output_path = Path(args.output)
    write_comparison_csv(output_path, vs_hb, dev_hb, matches)

    print(f"Comparison written to {output_path.resolve()}")


if __name__ == "__main__":
    main()
