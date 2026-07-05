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
$PortableExe = Join-Path $Root "dist\DataPilotStudio.exe"

Write-Host "== Data Pilot Studio portable build ==" -ForegroundColor Cyan
Write-Host "Root: $Root"

if (Test-Path $BuildVenv) {
  $ExistingVenvPython = Join-Path $BuildVenv "Scripts\python.exe"
  $VenvHealthy = $false
  if (Test-Path $ExistingVenvPython) {
    try {
      & $ExistingVenvPython -c "import sys; print(sys.executable)" | Out-Null
      if ($LASTEXITCODE -eq 0) { $VenvHealthy = $true }
    }
    catch {
      $VenvHealthy = $false
    }
  }
  if (!$VenvHealthy) {
    Write-Host "Existing build virtual environment is not usable. Recreating..."
    Remove-Item -LiteralPath $BuildVenv -Recurse -Force
  }
}

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

if (!(Test-Path $PortableExe)) {
  throw "Single-file executable was not created: $PortableExe"
}

@"
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

No pip install or npm install is required on the target laptop.
"@ | Set-Content -Encoding UTF8 (Join-Path $Root "dist\README_SINGLE_EXE.txt")

Write-Host ""
Write-Host "Single-file executable ready:" -ForegroundColor Green
Write-Host $PortableExe
Write-Host "Copy DataPilotStudio.exe to the target Windows laptop and run it."
