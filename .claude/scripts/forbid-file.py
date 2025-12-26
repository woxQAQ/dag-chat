#!/usr/bin/env python3
import json, sys

data = json.load(sys.stdin)
path = data.get("tool_input", {}).get("file_path", "")
_file_list = [".env", "package-lock.json", ".git/"]
sys.exit(2 if any(p in path for p in _file_list) else 0)
