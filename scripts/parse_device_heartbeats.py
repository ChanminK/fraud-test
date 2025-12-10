"""
Parse device heartbeat logs into a normalized list
"""

import argparse
import csv
from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass
class Heartbeat:
    time: datetime
    project: str
    language: str
    editor: str
    file_path: str
    line: int
    col: int
    lines: int
    write: bool
    source: str
    branch: str
    category: str
    machine: str
    user_agent: str
    ip: str


def parse_bool(value: str) -> bool:
    v = (value or "").strip().lower()
    return v in ("1", "true", "yes", "y")


def parse_int(value: str) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0


def parse_time(value: str) -> datetime:
    v = (value or "").strip()
    for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %I:%M:%S %p"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            continue
    return datetime.fromisoformat(v.replace("Z", "+00:00"))


def parse_device_heartbeats(csv_path: str) -> List[Heartbeat]:
    heartbeats: List[Heartbeat] = []

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            hb = Heartbeat(
                time=parse_time(row.get("Time", "")),
                project=row.get("Project", "") or "",
                language=row.get("Language", "") or "",
                editor=row.get("Editor", "") or "",
                file_path=row.get("File Path", "") or "",
                line=parse_int(row.get("Line")),
                col=parse_int(row.get("Col")),
                lines=parse_int(row.get("Lines")),
                write=parse_bool(row.get("Write")),
                source=row.get("Source", "") or "",
                branch=row.get("Branch", "") or "",
                category=row.get("Category", "") or "",
                machine=row.get("Machine", "") or "",
                user_agent=row.get("User Agent", "") or "",
                ip=row.get("IP", "") or "",
            )
            heartbeats.append(hb)

    return heartbeats


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse device heartbeats.")
    parser.add_argument("input", help="Path to device-heartbeats.log (CSV).")
    args = parser.parse_args()

    heartbeats = parse_device_heartbeats(args.input)
    print(f"Parsed {len(heartbeats)} device heartbeats from {args.input!r}.")


if __name__ == "__main__":
    main()
