import os
import socket
import threading
import time
import webbrowser

import uvicorn

from main import app
from runtime_paths import data_dir


def _open_browser(url: str):
    time.sleep(2)
    try:
        webbrowser.open(url)
    except Exception:
        pass


def _choose_port(host: str, preferred_port: int) -> int:
    for port in range(preferred_port, preferred_port + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
            except OSError:
                continue
            return port
    raise RuntimeError(f"No free local port found from {preferred_port} to {preferred_port + 19}")


def main():
    data_dir()
    host = os.environ.get("DATA_PILOT_HOST", "127.0.0.1")
    preferred_port = int(os.environ.get("DATA_PILOT_PORT", "8000"))
    port = _choose_port(host, preferred_port)
    url = f"http://{host}:{port}/"
    print("=" * 52)
    print("Data Pilot Studio portable server")
    print(f"Open: {url}")
    print("Close this window to stop the app.")
    print("=" * 52)
    threading.Thread(target=_open_browser, args=(url,), daemon=True).start()
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
