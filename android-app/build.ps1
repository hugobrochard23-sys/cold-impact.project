# Construit le bundle signe (.aab) de COLD IMPACT : android-app\app\build\outputs\bundle\release\app-release.aab
# Utilisation : .\build.ps1   (ou  .\build.ps1 -VersionCode 2  pour un nouvel envoi sur la Play Console)
param([int]$VersionCode = 1)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $root
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
Set-Content -Path (Join-Path $root 'local.properties') -Value ('sdk.dir=' + ($env:ANDROID_HOME -replace '\\', '/'))
# 1) copie du jeu dans les assets de l'appli
$assets = Join-Path $root 'app\src\main\assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null
foreach ($f in 'index.html', 'style.css', 'game.js') { if (Test-Path (Join-Path $repo $f)) { Copy-Item -Force (Join-Path $repo $f) $assets } }
foreach ($d in 'src', 'assets') { robocopy (Join-Path $repo $d) (Join-Path $assets $d) /MIR /XD _spare /NFL /NDL /NJH /NJS /NP | Out-Null; if ($LASTEXITCODE -ge 8) { throw "copie de $d impossible" } }
# 2) bundle
$g = (Get-ChildItem (Join-Path $env:USERPROFILE '.gradle\wrapper\dists\gradle-8.14.3-all\*\gradle-8.14.3\bin\gradle.bat') | Select-Object -First 1).FullName
Push-Location $root
& $g --no-daemon "-Pvcode=$VersionCode" :app:bundleRelease
$code = $LASTEXITCODE
Pop-Location
if ($code -ne 0) { throw "gradle a echoue ($code)" }
Get-Item (Join-Path $root 'app\build\outputs\bundle\release\app-release.aab') | Select-Object FullName, Length
