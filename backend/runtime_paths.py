from pathlib import Path
import os
import shutil
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
        if os.name == "nt":
            base = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
            target = Path(base) / "DataPilotStudio"
        else:
            base = os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
            target = Path(base) / "datapilotstudio"
    target.mkdir(parents=True, exist_ok=True)
    return target


def data_path(name: str) -> Path:
    target = data_dir() / name
    if not target.exists():
        legacy_candidates = [
            resource_root() / "data" / name,
            Path(__file__).resolve().parent / name,
            app_root() / "data" / name,
        ]
        for legacy in legacy_candidates:
            if legacy != target and legacy.exists():
                try:
                    shutil.copy2(legacy, target)
                except Exception:
                    pass
                break
    return target
