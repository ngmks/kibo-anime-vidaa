#!/usr/bin/env python3
"""
dev-server.py — serveur statique pour tester l'app en local ET sur la TV.

- Écoute sur 0.0.0.0 : accessible depuis la PX3 Pro via http://IP-DU-PC:8080/
- En-têtes CORS permissifs (utile si une source distante est testée).
- MIME corrects pour les modules ES (.js/.mjs) et HLS (.m3u8/.ts).

Usage :  python3 tools/dev-server.py [port]
(Lancer depuis la racine du projet.)
"""
import sys
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # racine projet


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".m3u8": "application/vnd.apple.mpegurl",
        ".ts": "video/mp2t",
        ".css": "text/css",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def lan_ip():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


if __name__ == "__main__":
    ip = lan_ip()
    print(f"Kibo Anime — serveur de dev")
    print(f"  Local : http://localhost:{PORT}/")
    print(f"  TV    : http://{ip}:{PORT}/   (saisir cette URL sur la PX3 Pro)")
    print(f"  Phase 0 : http://{ip}:{PORT}/tools/keycode-logger.html")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
