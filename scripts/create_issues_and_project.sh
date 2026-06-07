#!/usr/bin/env bash
# Idempotent script to create GitHub issues and a project board for the FasNexi strategy
# Requires: gh (GitHub CLI) authenticated and jq installed
# Usage: ./scripts/create_issues_and_project.sh

set -euo pipefail
OWNER="Jantocouture"
REPO="FasNexi"
PROJECT_NAME="Roadmap - MVP"

echo "Scanning .github/ISSUES for Tier0/1/2 issue drafts..."
ISSUE_GLOB=(.github/ISSUES/TIER0-*.md .github/ISSUES/TIER1-*.md .github/ISSUES/TIER2-*.md)
CREATED_IDS_FILE=".github/ISSUES/created_issue_ids.txt"
> "$CREATED_IDS_FILE"

# helper: find existing issue by exact title
function find_issue_by_title() {
  local title="$1"
  # List recent issues (limit 200) and search exact title match
  gh issue list --repo "$OWNER/$REPO" --limit 200 --json number,title | jq -r --arg T "$title" '.[] | select(.title==$T) | .number' | head -n1 || true
}

# helper: create issue if not exists
function ensure_issue() {
  local file="$1"
  local title
  local body
  title=$(sed -n '1p' "$file" | sed 's/^# *//')
  body=$(sed -n '2,$p' "$file")

  if [[ -z "$title" ]]; then
    echo "Skipping $file: no title found"
    return
  fi

  existing_num=$(find_issue_by_title "$title")
  if [[ -n "$existing_num" ]]; then
    echo "Issue already exists: #$existing_num — $title"
    issue_url="https://github.com/$OWNER/$REPO/issues/$existing_num"
    echo "$existing_num $issue_url" >> "$CREATED_IDS_FILE"
    return
  fi

  echo "Creating issue: $title"
  # create issue and capture number & url
  issue_json=$(gh issue create --repo "$OWNER/$REPO" --title "$title" --body "$body" --assignee "$OWNER" --label "priority:P0" --label "area:strategy" --json number,url)
  num=$(echo "$issue_json" | jq -r '.number')
  url=$(echo "$issue_json" | jq -r '.url')
  echo "$num $url" >> "$CREATED_IDS_FILE"
  sleep 0.3
}

# iterate files and ensure issues
for f in ${ISSUE_GLOB[@]}; do
  if [[ -f "$f" ]]; then
    ensure_issue "$f"
  fi
done

echo "Issues ensured. Listing created/identified issues:"
cat "$CREATED_IDS_FILE"

# Create or reuse project
echo "Checking for existing project named: $PROJECT_NAME"
proj_id=$(gh project list --repo "$OWNER/$REPO" --limit 100 --json name,id | jq -r --arg P "$PROJECT_NAME" '.[] | select(.name==$P) | .id' || true)
if [[ -n "$proj_id" ]]; then
  echo "Found existing project: $proj_id"
else
  echo "Creating project: $PROJECT_NAME"
  proj_id=$(gh project create --repo "$OWNER/$REPO" --name "$PROJECT_NAME" --body "Roadmap for the MVP: Tier-0, Tier-1 and Tier-2 items" --json id | jq -r '.id')
  echo "Created project id: $proj_id"
fi

# Ensure columns exist and return their ids
function ensure_column() {
  local project_id="$1"
  local col_name="$2"
  # list columns and check
  col_id=$(gh api --silent /projects/$project_id/columns --jq --raw-output '.[] | select(.name=="'"$col_name"'") | .id' || true)
  if [[ -n "$col_id" ]]; then
    echo "$col_id"
    return
  fi
  # create column
  col_id=$(gh api --silent -X POST /projects/$project_id/columns -f name="$col_name" | jq -r '.id')
  echo "$col_id"
}

col_todo=$(ensure_column $proj_id "To do")
col_inprogress=$(ensure_column $proj_id "In progress")
col_done=$(ensure_column $proj_id "Done")

echo "Project columns: To do=$col_todo, In progress=$col_inprogress, Done=$col_done"

# Add issues to To do column if not already present
echo "Adding issues to project 'To do' column (id: $col_todo)"
while read -r line; do
  num=$(echo "$line" | awk '{print $1}')
  if [[ -z "$num" ]]; then continue; fi
  # get issue node id (content_id used by project cards)
  content_id=$(gh api --silent repos/$OWNER/$REPO/issues/$num --jq '.id')
  if [[ -z "$content_id" || "$content_id" == "null" ]]; then
    echo "Could not fetch content id for issue #$num; skipping"
    continue
  fi
  # list existing cards in column and see if any card references this issue
  exists=$(gh api --silent /projects/columns/$col_todo/cards --jq --raw-output '.[] | .content_url' | grep -E "/issues/$num$" || true)
  if [[ -n "$exists" ]]; then
    echo "Issue #$num already present in To do column; skipping"
    continue
  fi
  echo "Adding issue #$num to To do column"
  gh api --silent -X POST /projects/columns/$col_todo/cards -f content_id=$content_id -f content_type=Issue > /dev/null
  sleep 0.2
done < "$CREATED_IDS_FILE"

echo "All done. Project URL: https://github.com/$OWNER/$REPO/projects/$proj_id"
