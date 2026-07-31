import type { Project } from "@/lib/types";

/** Pending days with commits > 0 as "date count" pairs. */
export function scheduleData(project: Project): [string, number][] {
  return project.schedule
    .filter((e) => e.commits > 0 && e.status !== "done")
    .map((e) => [e.date, e.commits]);
}

export function generateSh(project: Project): string {
  const data = scheduleData(project)
    .map(([date, count]) => `${date} ${count}`)
    .join("\n");

  return `#!/usr/bin/env bash
#
# ${project.name} — GitHub contribution pattern
# ${project.startDate} → ${project.endDate}
#
# Usage:
#   1. Create (or cd into) a dedicated git repository:
#        mkdir pattern-repo && cd pattern-repo && git init
#   2. Run this script from inside that repository:
#        chmod +x generate.sh && ./generate.sh
#   3. Create a repo on GitHub, add it as remote, and push:
#        git remote add origin <url> && git push -u origin main
#
# Commits are backdated via GIT_AUTHOR_DATE / GIT_COMMITTER_DATE.

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: run this inside a git repository" >&2
  exit 1
fi

SCHEDULE="\\
${data}"

echo "$SCHEDULE" | while read -r DATE COUNT; do
  [ -z "$DATE" ] && continue
  for i in $(seq 1 "$COUNT"); do
    # Spread timestamps through the day so commits are distinct.
    HOUR=$(( 9 + i % 10 ))
    MIN=$(( (i * 7) % 60 ))
    SEC=$(( (i * 13) % 60 ))
    STAMP=$(printf '%sT%02d:%02d:%02d' "$DATE" "$HOUR" "$MIN" "$SEC")
    echo "$DATE commit $i/$COUNT" >> activity.log
    git add activity.log
    GIT_AUTHOR_DATE="$STAMP" GIT_COMMITTER_DATE="$STAMP" \\
      git commit --quiet -m "pattern: $DATE ($i/$COUNT)"
  done
  echo "$DATE: $COUNT commits"
done

echo
echo "Done. Push with: git push"
`;
}
