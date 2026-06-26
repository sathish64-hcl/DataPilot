param(
  [string]$PythonExe = "python",
  [switch]$SkipFrontendInstall
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BuildVenv = Join-Path $Root ".venv-build"
$Frontend = Join-Path $Root "frontend"
$BackendReq = Join-Path $Root "backend\requirements.txt"
$Spec = Join-Path $Root "DataPilotStudio.spec"
$PortableDir = Join-Path $Root "dist\DataPilotStudio"
$PortableInternalDir = Join-Path $PortableDir "_internal"

Write-Host "== Data Pilot Studio portable build ==" -ForegroundColor Cyan
Write-Host "Root: $Root"

if (!(Test-Path $BuildVenv)) {
  Write-Host "Creating local build virtual environment..."
  & $PythonExe -m venv $BuildVenv
}

$VenvPython = Join-Path $BuildVenv "Scripts\python.exe"

Write-Host "Installing backend dependencies into local build venv..."
& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r $BackendReq
& $VenvPython -m pip install pyinstaller

Write-Host "Building frontend assets..."
Push-Location $Frontend
try {
  if (!$SkipFrontendInstall) {
    npm ci
  }
  npm run build
}
finally {
  Pop-Location
}

Write-Host "Building portable executable..."
Push-Location $Root
try {
  & $VenvPython -m PyInstaller --clean --noconfirm $Spec
}
finally {
  Pop-Location
}

$PythonCommand = Get-Command $PythonExe -ErrorAction SilentlyContinue
if ($PythonCommand -and $PythonCommand.Source) {
  $PythonHome = Split-Path -Parent $PythonCommand.Source
}
else {
  $PythonHome = Split-Path -Parent $PythonExe
}
$FfiSearchDirs = @(
  (Join-Path $PythonHome "Library\bin"),
  (Join-Path $PythonHome "..\Library\bin"),
  (Join-Path $env:USERPROFILE "anaconda3\Library\bin"),
  (Join-Path $env:USERPROFILE "miniconda3\Library\bin")
)

$FfiFiles = @()
foreach ($Dir in $FfiSearchDirs) {
  $ResolvedDir = Resolve-Path $Dir -ErrorAction SilentlyContinue
  if ($ResolvedDir) {
    $FfiFiles += Get-ChildItem -LiteralPath $ResolvedDir.Path -Filter "ffi*.dll" -ErrorAction SilentlyContinue
  }
}

if ($FfiFiles.Count -gt 0) {
  foreach ($Ffi in ($FfiFiles | Sort-Object FullName -Unique)) {
    Copy-Item -Force $Ffi.FullName (Join-Path $PortableInternalDir $Ffi.Name)
  }
}

if (!(Test-Path (Join-Path $PortableInternalDir "ffi.dll")) -and !(Test-Path (Join-Path $PortableInternalDir "ffi-8.dll")) -and !(Test-Path (Join-Path $PortableInternalDir "ffi-7.dll"))) {
  throw "Portable build is missing ffi.dll/ffi-*.dll required by _ctypes.pyd. Check the Python runtime used for packaging."
}

$DataDir = Join-Path $PortableDir "data"
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
Copy-Item -Force (Join-Path $Root "backend\data_pilot_mock.db") (Join-Path $DataDir "data_pilot_mock.db")

@"
Data Pilot Studio Portable
==========================

Run:
  DataPilotStudio.exe

Then open:
  The URL printed in the app window, usually http://127.0.0.1:8000/
  If port 8000 is busy, the app automatically tries the next free port.

Writable local data:
  data\data_pilot_mock.db
  data\query_log.jsonl
  data\ai_usage.json

No pip install or npm install is required on the target laptop.
"@ | Set-Content -Encoding UTF8 (Join-Path $PortableDir "README_PORTABLE.txt")

Write-Host ""
Write-Host "Portable build ready:" -ForegroundColor Green
Write-Host $PortableDir
Write-Host "Copy this whole folder to the target Windows laptop and run DataPilotStudio.exe."
