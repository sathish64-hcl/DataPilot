import os
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


def main():
    data_dir()
    host = os.environ.get("DATA_PILOT_HOST", "127.0.0.1")
    port = int(os.environ.get("DATA_PILOT_PORT", "8000"))
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
