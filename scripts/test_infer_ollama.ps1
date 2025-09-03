$ErrorActionPreference = "Stop"

$uri = "http://localhost:9666/ai/infer"

$payloadObj = [ordered]@{
  provider    = "ollama"
  model       = "llama3.2:1b"
  prompt      = "สรุปเป็น bullet 3 ข้อ: ระบบ MCP รองรับ Git Memory และปรับใช้เซิร์ฟเวอร์อัตโนมัติ"
  temperature = 0.2
}
$payload = $payloadObj | ConvertTo-Json -Compress

try {
  $resp = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json; charset=utf-8" -Body $payload -TimeoutSec 120
  if ($null -ne $resp) {
    if ($resp.PSObject.Properties.Name -contains 'output') { $txt = $resp.output }
    elseif ($resp.PSObject.Properties.Name -contains 'response') { $txt = $resp.response }
    elseif ($resp.PSObject.Properties.Name -contains 'text') { $txt = $resp.text }
    else { $txt = ($resp | ConvertTo-Json -Depth 6 -Compress) }
    $len = if ($null -ne $txt) { $txt.ToString().Length } else { 0 }
    $head = if ($len -gt 500) { $txt.Substring(0,500) } else { $txt }
    Write-Host ("OK length={0}`n{1}" -f $len, $head)
  } else {
    Write-Host "ERR: empty response"
    exit 2
  }
} catch {
  Write-Host ("ERR: {0}" -f $_.Exception.Message)
  if ($_.Exception.Response -and $_.Exception.Response.Content) {
    Write-Host ("DETAIL: {0}" -f $_.Exception.Response.Content)
  }
  exit 1
}