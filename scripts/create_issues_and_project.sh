#!/usr/bin/env bash
# Script to create GitHub issues and a project board for the FasNexi strategy
# Requires: gh (GitHub CLI) authenticated and jq installed
# Usage: ./scripts/create_issues_and_project.sh

set -e
OWNER="Jantocouture"
REPO="FasNexi"
PROJECT_NAME="Roadmap - MVP"

echo "Creating Tier-0, Tier-1 and Tier-2 issues from .github/ISSUES/*.md..."
ISSUE_FILES=(.github/ISSUES/TIER0-*.md .github/ISSUES/TIER1-*.md .github/ISSUES/TIER2-*.md)

CREATED_IDS_FILE=".github/ISSUES/created_issue_ids.txt"
> $CREATED_IDS_FILE

for f in ${ISSUE_FILES[@]}; do
  if [ -f "$f" ]; then
    title=$(sed -n '1p' "$f" | sed 's/^# //')
    body=$(sed -n '2,$p' "$f")
    echo "Creating issue: $title"
    issue_json=$(gh issue create --repo $OWNER/$REPO --title "$title" --body "$body" --assignee Jantocouture --label "priority:P0" --label "area:strategy" --json number,url)
    echo "$issue_json" | jq -r '.number + " " + .url' >> $CREATED_IDS_FILE
    sleep 0.5
  fi
done

echo "Created issues list saved to $CREATED_IDS_FILE"

# Create project (beta) for repo
echo "Creating project board: $PROJECT_NAME"
proj_id=$(gh project create --repo $OWNER/$REPO --name "$PROJECT_NAME" --body "Roadmap for the MVP: Tier-0, Tier-1 and Tier-2 items" --json id | jq -r '.id')

echo "Project created: $proj_id"

# Create columns
echo "Creating columns: To do, In progress, Done"
col_todo=$(gh api -X POST /projects/columns -f project_id=$proj_id -f name="To do" | jq -r '.id')
col_inprogress=$(gh api -X POST /projects/columns -f project_id=$proj_id -f name="In progress" | jq -r '.id')
col_done=$(gh api -X POST /projects/columns -f project_id=$proj_id -f name="Done" | jq -r '.id')

# Add created issues to To do column
echo "Adding issues to project 'To do' column"
while read -r line; do
  num=$(echo "$line" | awk '{print $1}')
  issue_url=$(echo "$line" | awk '{print $2}')
  # create a card using the content_id of the issue
  gh api -X POST /projects/columns/$col_todo/cards -f content_id=$(gh api repos/$OWNER/$REPO/issues/$num --jq '.id') -f content_type=Issue > /dev/null
  sleep 0.2
done < $CREATED_IDS_FILE

echo "Project and issues created. Open the project at: https://github.com/$OWNER/$REPO/projects"
