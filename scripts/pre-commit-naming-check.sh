#!/bin/bash
# Git pre-commit hook to check naming standards
# Install: cp scripts/pre-commit-naming-check.sh .git/hooks/pre-commit

echo "🔍 Running naming standards check..."

# Run the check script
./scripts/check-naming-standards.sh

# If check fails, abort commit
if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Commit aborted due to naming standards violations"
  echo "💡 Fix the issues above or use 'git commit --no-verify' to skip"
  exit 1
fi

echo "✅ Naming standards check passed"
exit 0
