#!/usr/bin/env python3
"""Convert one local document to Markdown through MarkItDown.

The desktop app communicates with this process through one JSON request and
one JSON response. Keeping the protocol small makes the later Tauri sidecar
wrapper independent from MarkItDown's Python API details.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    try:
        request = json.loads(sys.stdin.read())
        input_path = Path(request["inputPath"])
        if not input_path.is_file():
            raise ValueError("输入文件不存在或不可读取")

        from markitdown import MarkItDown

        result = MarkItDown(enable_plugins=False).convert(str(input_path))
        print(json.dumps({"ok": True, "markdown": result.markdown}, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001 - sidecar must return errors through its protocol.
        print(json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
