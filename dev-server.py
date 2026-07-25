#!/usr/bin/env python3
"""Local preview - no-store headers."""
from __future__ import annotations

import argparse
import http.server
import os
import socketserver
from pathlib import Path


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


def main() -> None:
    os.chdir(Path(__file__).resolve().parent)
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8828)
    args = parser.parse_args()
    with socketserver.TCPServer(("", args.port), NoCacheHandler) as httpd:
        print(f"SlabSet v15 at http://127.0.0.1:{args.port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
