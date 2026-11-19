Add-Type -AssemblyName System.Drawing

$width = 96
$height = 96
$bmp = New-Object System.Drawing.Bitmap $width, $height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Scale: 96 / 48 = 2.0
$s = 2.0

# Colors
$cRed = [System.Drawing.ColorTranslator]::FromHtml("#EA4335")
$cBlue = [System.Drawing.ColorTranslator]::FromHtml("#4285F4")
$cYellow = [System.Drawing.ColorTranslator]::FromHtml("#FBBC05")
$cGreen = [System.Drawing.ColorTranslator]::FromHtml("#34A853")

$bRed = New-Object System.Drawing.SolidBrush $cRed
$bBlue = New-Object System.Drawing.SolidBrush $cBlue
$bYellow = New-Object System.Drawing.SolidBrush $cYellow
$bGreen = New-Object System.Drawing.SolidBrush $cGreen

# The outer radius is 24*s = 48, inner cutout radius is 14.5*s = 29
# Center is (48, 48)
$cx = 48.0
$cy = 48.0
$rOut = 46.0
$rIn = 27.0
$thickness = $rOut - $rIn

# In System.Drawing, DrawArc / FillPie uses bounding rectangle:
$rectOut = New-Object System.Drawing.RectangleF ($cx - $rOut), ($cy - $rOut), ($rOut * 2), ($rOut * 2)

# Blue crossbar rectangle:
# from center x=48 to x=94, y from 48 - 9.5 to 48 + 9.5
$barH = 19.0
$rectBar = New-Object System.Drawing.RectangleF $cx, ($cy - $barH / 2), ($rOut - 2), $barH

# Let's create the 4 pie slices and punch out the center!
# 1. Red top arc (from 195 deg to 345 deg roughly, or -135 to -45)
# 2. Yellow left arc (from 135 to 225)
# 3. Green bottom arc (from 45 to 135)
# 4. Blue right sector with crossbar

# Let's verify with exact GraphicsPath!
# Red Path:
$pRed = New-Object System.Drawing.Drawing2D.GraphicsPath
$pRed.AddPie(($cx - $rOut), ($cy - $rOut), ($rOut * 2), ($rOut * 2), 200, 115)
$g.FillPath($bRed, $pRed)

# Yellow Path:
$pYellow = New-Object System.Drawing.Drawing2D.GraphicsPath
$pYellow.AddPie(($cx - $rOut), ($cy - $rOut), ($rOut * 2), ($rOut * 2), 125, 95)
$g.FillPath($bYellow, $pYellow)

# Green Path:
$pGreen = New-Object System.Drawing.Drawing2D.GraphicsPath
$pGreen.AddPie(($cx - $rOut), ($cy - $rOut), ($rOut * 2), ($rOut * 2), 25, 115)
$g.FillPath($bGreen, $pGreen)

# Blue Sector & Crossbar:
$pBlue = New-Object System.Drawing.Drawing2D.GraphicsPath
$pBlue.AddPie(($cx - $rOut), ($cy - $rOut), ($rOut * 2), ($rOut * 2), 335, 60)
$g.FillPath($bBlue, $pBlue)

# Punch out center circle to transparent
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
$bTrans = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Transparent)
$g.FillEllipse($bTrans, ($cx - $rIn), ($cy - $rIn), ($rIn * 2), ($rIn * 2))

# Clear upper-right cutout where G is open!
# The upper-right wedge from 315 to 360 (or angle between crossbar and red)
$rectWedge = New-Object System.Drawing.RectangleF $cx, ($cy - $rOut), ($rOut), ($rOut - $barH / 2)
$g.FillRectangle($bTrans, $rectWedge)

# Switch back to SourceOver to draw the blue horizontal crossbar!
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$g.FillRectangle($bBlue, $rectBar)

# Save image
$outPath = "C:\Users\Administrator\ScreenBalance\assets\images\google-g.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Convert to Base64 to inspect length
$bytes = [System.IO.File]::ReadAllBytes($outPath)
$b64 = [System.Convert]::ToBase64String($bytes)
Write-Output "SAVED PNG, bytes: $($bytes.Length), b64 length: $($b64.Length)"

$bmp.Dispose()
$g.Dispose()
