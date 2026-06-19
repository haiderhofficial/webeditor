# Creates simple colored-square PNG icons using .NET System.Drawing
# Run: powershell -ExecutionPolicy Bypass -File create-icons.ps1

Add-Type -AssemblyName System.Drawing

function Make-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    # Background
    $bg = [System.Drawing.Color]::FromArgb(30, 30, 46)
    $g.Clear($bg)

    # Draw rounded feel with a circle
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(203, 166, 247))
    $font  = New-Object System.Drawing.Font("Arial", ($size * 0.45), [System.Drawing.FontStyle]::Bold)
    $sf    = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $g.DrawString("T", $font, $brush, $rect, $sf)

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $path"
}

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Make-Icon 16  "$dir\icons\icon16.png"
Make-Icon 48  "$dir\icons\icon48.png"
Make-Icon 128 "$dir\icons\icon128.png"
