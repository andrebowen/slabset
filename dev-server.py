#!/usr/bin/env python3
"""Local preview server with no-store headers (avoids stale SW/browser cache)."""
from __future__ import annotations

import argparse
import http.server
import socketserver


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="SlabSet website local dev server (no-cache)")
    parser.add_argument("--port", type=int, default=8800)
    args = parser.parse_args()

    with socketserver.TCPServer(("", args.port), NoCacheHandler) as httpd:
        print(f"Serving SlabSet website at http://127.0.0.1:{args.port}/ (Cache-Control: no-store)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
