#!/bin/bash
# Setup git hooks for the project

echo "🔧 Setting up git hooks..."

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="scripts"

# Create pre-commit hook
cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Git pre-commit hook to check for Next.js route conflicts

echo "🔍 Running pre-commit checks..."

# Check for route conflicts
if ! ./scripts/check-route-conflicts.sh; then
  echo ""
  echo "❌ Pre-commit check failed!"
  echo "📖 Please read ROUTE_STRUCTURE_GUIDE.md for help"
  echo ""
  exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
EOF

# Make it executable
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Git hooks installed successfully!"
echo ""
echo "Installed hooks:"
echo "  - pre-commit: Checks for route conflicts"
echo ""
echo "To skip hook (not recommended):"
echo "  git commit --no-verify"
