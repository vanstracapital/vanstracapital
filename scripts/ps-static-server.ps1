$port=8000
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Output "Serving $((Get-Location).Path) at $prefix"
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $localPath = $request.Url.LocalPath.TrimStart('/')
    if ($localPath -eq '') { $localPath = 'index.html' }
    $file = Join-Path (Get-Location) $localPath
    if (-not (Test-Path $file)) {
        $context.Response.StatusCode = 404
        $responseBytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $context.Response.ContentLength64 = $responseBytes.Length
        $context.Response.OutputStream.Write($responseBytes,0,$responseBytes.Length)
        $context.Response.OutputStream.Close()
        continue
    }
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        switch -regex ($file) {
            '\.html?$' { $context.Response.ContentType='text/html'; break }
            '\.css$' { $context.Response.ContentType='text/css'; break }
            '\.js$' { $context.Response.ContentType='application/javascript'; break }
            '\.png$' { $context.Response.ContentType='image/png'; break }
            '\.jpg$' { $context.Response.ContentType='image/jpeg'; break }
            '\.svg$' { $context.Response.ContentType='image/svg+xml'; break }
            default { $context.Response.ContentType='application/octet-stream'; break }
        }
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes,0,$bytes.Length)
        $context.Response.OutputStream.Close()
    } catch {
        $context.Response.StatusCode = 500
        $context.Response.Close()
    }
}