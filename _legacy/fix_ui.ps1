$path = "c:\Users\nguye\Documents\test\public\student-dashboard.html"
$content = Get-Content $path -Encoding UTF8
$part1 = $content[0..18794]
$part2 = $content[19325..($content.Count-1)]
$newContent = $part1 + $part2
$newContent | Set-Content $path -Encoding UTF8
Write-Host "Deleted lines 18796-19325"
