#!/bin/bash
result=$(npx tsc --noEmit --pretty false)
if [ $? -ne 0 ]; then
  echo '{
    "decision": "block",
    "reason": "Code contains type errors. Please fix them first.",
  }'
  exit 0
fi

result=$(cd $CLAUDE_PROJECT_DIR && pnpm check && pnpm format)
if [ $? -ne 0 ]; then
  echo '{
    "decision": "block",
    "reason": "Code contains linting errors. Please fix them first.",
  }'
  exit 0
fi

resule=$(pnpm test)
if [ $? -ne 0 ]; then
  echo '{
    "decision": "block",
    "reason": "Code contains test errors. Please fix them first.",
  }'
  exit 0
fi