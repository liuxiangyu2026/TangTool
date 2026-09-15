#!/usr/bin/env python3
"""Convert one local document to Markdown through MarkItDown.

The desktop app communicates with this process through one JSON request and
one JSON response. Keeping the protocol small makes the later Tauri sidecar
wrapper independent from MarkItDown's Python API details.
"""

from __future__ import annotations

import json
from contextlib import redirect_stdout
import sys
import platform
from pathlib import Path


def main() -> int:
    # Windows pipes may default to a legacy code page; the IPC contract is UTF-8.
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    config = json.loads(Path(__file__).with_name("runtime.json").read_text(encoding="utf-8"))
    identity = {"componentVersion": config["version"], "protocol": config["protocol"]}
    try:
        if sys.argv[1:] in (["--health"], ["--check"]):
            from markitdown import __version__
            # 检查实际依赖和模型可用性，不能仅凭组件文件存在或能读出版本判为已安装。
            with redirect_stdout(sys.stderr):
                import mammoth
                import pdfminer.high_level
                import pdfplumber
                from markitdown import MarkItDown
                MarkItDown(enable_builtins=False, enable_plugins=False)
            architecture = {"arm64": "aarch64", "aarch64": "aarch64", "amd64": "x86_64", "x86_64": "x86_64"}.get(platform.machine().lower())
            suffix = "pc-windows-msvc" if sys.platform == "win32" else "apple-darwin"
            target = f"{architecture}-{suffix}"
            if sys.argv[1:] == ["--check"]:
                sys.stdout.write(f"TangToolDocumentRuntime:{config['version']}:{target}")
            else:
                print(json.dumps({"ok": True, **identity, "version": __version__, "target": target, "formats": ["docx", "pdf"]}))
            return 0

        request = json.loads(sys.stdin.read())
        if not isinstance(request, dict) or not isinstance(request.get("inputPath"), str):
            raise ValueError("The request must include a string inputPath")
        if request.get("protocol") != config["protocol"] or request.get("componentVersion") != config["version"]:
            raise ValueError("The app and document component versions are incompatible")
        input_path = Path(request["inputPath"]).resolve()
        if input_path.suffix.lower() not in (".docx", ".pdf"):
            raise ValueError("Only DOCX and PDF documents are supported; legacy .doc files are not supported")
        if not input_path.is_file():
            raise ValueError("The input file does not exist or cannot be read")

        from markitdown import MarkItDown
        from markitdown.converters import DocxConverter, PdfConverter

        # stdout is reserved for the single JSON response, including in frozen builds.
        with redirect_stdout(sys.stderr):
            # Restrict builtins: a corrupt DOCX must not fall back to plain-text conversion.
            converter = MarkItDown(enable_builtins=False, enable_plugins=False)
            converter.register_converter(DocxConverter())
            converter.register_converter(PdfConverter())
            result = converter.convert_local(str(input_path))
        print(json.dumps({"ok": True, **identity, "markdown": result.markdown}, ensure_ascii=False))
        return 0
    except Exception as error:  # noqa: BLE001 - sidecar must return errors through its protocol.
        print(json.dumps({"ok": False, **identity, "error": str(error)}, ensure_ascii=False))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
