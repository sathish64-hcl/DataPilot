# -*- mode: python ; coding: utf-8 -*-

from pathlib import Path
import sys

from PyInstaller.utils.hooks import collect_data_files, collect_submodules


datas = [
    ("frontend/dist", "frontend/dist"),
    ("backend/data_pilot_mock.db", "data"),
]

datas += collect_data_files("snowflake.connector")

binaries = []
seen_binaries = set()


def add_binary(path, dest="."):
    key = str(Path(path).resolve()).lower()
    if key not in seen_binaries:
        seen_binaries.add(key)
        binaries.append((str(path), dest))


for dll_dir in (
    Path(sys.prefix),
    Path(sys.base_prefix),
    Path(sys.prefix) / "DLLs",
    Path(sys.base_prefix) / "DLLs",
    Path(sys.prefix) / "Library" / "bin",
    Path(sys.base_prefix) / "Library" / "bin",
    Path.home() / "anaconda3" / "Library" / "bin",
    Path.home() / "miniconda3" / "Library" / "bin",
    Path.home() / "miniconda3" / "envs" / "datapilot" / "Library" / "bin",
):
    if dll_dir.exists():
        for pattern in (
            "ffi*.dll",
            "libffi*.dll",
            "openssl*.dll",
            "libssl*.dll",
            "libcrypto*.dll",
            "liblzma*.dll",
            "libbz2*.dll",
            "libexpat*.dll",
            "sqlite*.dll",
            "libsqlite*.dll",
            "zlib*.dll",
            "libzlib*.dll",
            "vcruntime*.dll",
            "msvcp*.dll",
            "python*.dll",
        ):
            for dll in dll_dir.glob(pattern):
                add_binary(dll, ".")

hiddenimports = []
for package in (
    "snowflake",
    "snowflake.connector",
    "google.generativeai",
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
    excludes=["pandas.tests", "numpy.tests"],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    exclude_binaries=False,
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
