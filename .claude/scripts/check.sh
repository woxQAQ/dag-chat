#!/bin/bash
# set -e

if ! npx tsc --noEmit --pretty false; then
  echo '{"decision": "block", "reason": "Code contains type errors. Please fix them first."}'
  exit 0
fi

if ! cd "$CLAUDE_PROJECT_DIR" && pnpm check; then
  echo '{"decision": "block", "reason": "Code contains linting errors. Please fix them first."}'
  exit 0
fi

# if ! pnpm test; then
#   echo '{"decision": "block", "reason": "Code contains test errors. Please fix them first."}'
#   exit 0
# fi

echo '{"decision": "approve"}'