Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$distPath = "c:\mytrips-extension\dist"
$zipPath = "c:\mytrips-extension\mytrips-firefox-v1.0.0.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $distPath -Recurse | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $fullPath = $_.FullName
        $relativePath = $fullPath.Substring($distPath.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $relativePath)
    }
}

$zip.Dispose()
Write-Host "ZIP PACKAGE CREATED SUCCESSFULLY WITH FORWARD SLASHES!"
