# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path

from PyInstaller.utils.hooks import collect_data_files, collect_submodules


datas = [
    ("frontend/dist", "frontend/dist"),
    ("backend/data_pilot_mock.db", "data"),
]

datas += collect_data_files("snowflake.connector")

binaries = []
for dll_dir in (
    Path.home() / "anaconda3" / "Library" / "bin",
    Path.home() / "miniconda3" / "Library" / "bin",
):
    if dll_dir.exists():
        for dll in dll_dir.glob("ffi*.dll"):
            binaries.append((str(dll), "."))

hiddenimports = []
for package in (
    "snowflake",
    "snowflake.connector",
    "google.generativeai",
    "pandas",
    "pyarrow",
):
    try:
        hiddenimports += collect_submodules(package)
    except Exception:
        pass


a = Analysis(
    ["backend/portable_runner.py"],
    pathex=["backend"],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="DataPilotStudio",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="DataPilotStudio",
)
