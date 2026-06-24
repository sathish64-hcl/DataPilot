from pathlib import Path
import os
import sys


def app_root() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def resource_root() -> Path:
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent.parent


def data_dir() -> Path:
    override = os.environ.get("DATA_PILOT_DATA_DIR")
    if override:
        target = Path(override)
    else:
        target = app_root() / "data" if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
    target.mkdir(parents=True, exist_ok=True)
    return target


def data_path(name: str) -> Path:
    return data_dir() / name
