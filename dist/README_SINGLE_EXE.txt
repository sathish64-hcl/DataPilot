Data Pilot Studio Single EXE
============================

Run:
  DataPilotStudio.exe

Then open:
  The URL printed in the app window, usually http://127.0.0.1:8000/

If port 8000 is busy, the app automatically tries the next free port.

Writable local data:
  %LOCALAPPDATA%\DataPilotStudio\data_pilot_mock.db
  %LOCALAPPDATA%\DataPilotStudio\query_log.jsonl
  %LOCALAPPDATA%\DataPilotStudio\ai_usage.json
  %LOCALAPPDATA%\DataPilotStudio\ai_prompt_cache.json

Notes:
  This is a PyInstaller one-file build.
  Python runtime DLLs and conda DLLs used by _ctypes, cffi, Snowflake, pandas, and FastAPI are bundled into the executable.
  No pip install or npm install is required on the target laptop.
