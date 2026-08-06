REPO="mocept-releng-org/gha-playground"

for env in dev staging production; do
  gh api -X PUT "repos/$REPO/environments/$env" >/dev/null
  echo "created: $env"
done

gh api "repos/$REPO/environments" --jq '.environments[].name'

gh secret set DEPLOY_TOKEN_DEV --repo "$REPO" --body "dummy-dev-token"
gh secret set DEPLOY_TOKEN_STG --repo "$REPO" --body "dummy-stg-token"
gh secret set DEPLOY_TOKEN_PRD --repo "$REPO" --body "dummy-prd-token"

# Find your user ID (needed for the reviewers payload)
MY_ID=$(gh api user --jq .id)
echo "$MY_ID"

# Add yourself as a required reviewer on `production`
gh api -X PUT "repos/$REPO/environments/production" \
  --input - <<EOF
{
  "wait_timer": 0,
  "reviewers": [
    { "type": "User", "id": $MY_ID }
  ],
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
EOF

# Then restrict to only `main`
gh api -X POST "repos/$REPO/environments/production/deployment-branch-policies" \
  -f name=main