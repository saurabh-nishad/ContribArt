import type { Project } from "@/lib/types";
import { scheduleData } from "@/lib/scripts/generate-sh";

export function generatePy(project: Project): string {
  const data = scheduleData(project)
    .map(([date, count]) => `    ("${date}", ${count}),`)
    .join("\n");

  return `#!/usr/bin/env python3
"""${project.name} — GitHub contribution pattern (${project.startDate} → ${project.endDate}).

Creates backdated commits via GIT_AUTHOR_DATE / GIT_COMMITTER_DATE.

Usage:
    python generate.py [--repo PATH] [--dry-run]

Run inside (or point --repo at) a dedicated git repository, then push it
to a GitHub repo to render the pattern on your profile.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

SCHEDULE: list[tuple[str, int]] = [
${data}
]


def run_git(args: list[str], repo: Path, env: dict[str, str] | None = None) -> None:
    subprocess.run(
        ["git", *args],
        cwd=repo,
        env={**os.environ, **(env or {})},
        check=True,
        stdout=subprocess.DEVNULL,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path.cwd(), help="git repository path")
    parser.add_argument("--dry-run", action="store_true", help="print plan without committing")
    args = parser.parse_args()

    repo: Path = args.repo.resolve()
    if not (repo / ".git").exists():
        sys.exit(f"error: {repo} is not a git repository (run 'git init' first)")

    total = sum(count for _, count in SCHEDULE)
    print(f"{len(SCHEDULE)} days, {total} commits -> {repo}")

    if args.dry_run:
        for date, count in SCHEDULE:
            print(f"  {date}: {count} commits")
        return

    log = repo / "activity.log"
    for date, count in SCHEDULE:
        for i in range(1, count + 1):
            hour = 9 + i % 10
            minute = (i * 7) % 60
            second = (i * 13) % 60
            stamp = f"{date}T{hour:02d}:{minute:02d}:{second:02d}"
            with log.open("a", encoding="utf-8", newline="\\n") as f:
                f.write(f"{date} commit {i}/{count}\\n")
            run_git(["add", "activity.log"], repo)
            run_git(
                ["commit", "--quiet", "-m", f"pattern: {date} ({i}/{count})"],
                repo,
                env={"GIT_AUTHOR_DATE": stamp, "GIT_COMMITTER_DATE": stamp},
            )
        print(f"{date}: {count} commits")

    print("\\nDone. Push with: git push")


if __name__ == "__main__":
    main()
`;
}
