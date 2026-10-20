# Builds dist/mdify-<version>.zip for the Chrome Web Store / Edge Add-ons.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/package.ps1
# Writes entries with forward slashes; Compress-Archive in Windows PowerShell 5.1
# uses backslashes, which the stores reject.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json).version
$entries = Get-Content (Join-Path $PSScriptRoot 'package-files.txt') |
  Where-Object { $_ -and -not $_.StartsWith('#') }

$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zipPath = Join-Path $dist "mdify-$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  foreach ($entry in $entries) {
    $full = Join-Path $root $entry
    $files = if (Test-Path $full -PathType Container) { Get-ChildItem $full -Recurse -File } else { Get-Item $full }
    foreach ($file in $files) {
      $name = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $name, 'Optimal') | Out-Null
    }
  }
} finally {
  $zip.Dispose()
}
Write-Host "Created $zipPath"
