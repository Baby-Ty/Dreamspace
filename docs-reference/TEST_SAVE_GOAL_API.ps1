# Quick test script to verify saveItem API is working

Write-Host "Testing saveItem API..." -ForegroundColor Cyan
Write-Host ""

$apiBase = "https://func-dreamspace-prod.azurewebsites.net/api"
$userId = "Tyler.Stewart@netsur.it"

# Get current ISO week
$date = Get-Date
$year = $date.Year
$onejan = Get-Date -Year $year -Month 1 -Day 1
$weekNum = [Math]::Ceiling(((($date - $onejan).Days) + $onejan.DayOfWeek.value__ + 1) / 7)
$weekId = "$year-W$($weekNum.ToString('00'))"

Write-Host "User ID: $userId" -ForegroundColor Gray
Write-Host "Week ID: $weekId" -ForegroundColor Gray
Write-Host ""

# Create test goal data
$goalId = "goal_test_$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
$goalData = @{
    id = $goalId
    title = "Test Goal from PowerShell"
    description = "Testing the saveItem API endpoint"
    weekId = $weekId
    completed = $false
    recurrence = "once"
    active = $true
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$requestBody = @{
    userId = $userId
    type = "weekly_goal"
    itemData = ($goalData | ConvertFrom-Json)
} | ConvertTo-Json -Depth 10

Write-Host "Sending request to: $apiBase/saveItem" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$apiBase/saveItem" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody `
        -UseBasicParsing
    
    Write-Host "[SUCCESS] Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Body:" -ForegroundColor Green
    Write-Host $response.Content
    Write-Host ""
    Write-Host "The saveItem API is working correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Try saving a goal on the live site: https://dreamspace.tylerstewart.co.za" -ForegroundColor White
    Write-Host "   2. If still not working, clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
    Write-Host "   3. Check browser console for any errors" -ForegroundColor White
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "[ERROR] Status Code: $statusCode" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $responseBody
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "   1. Cosmos DB connection issue" -ForegroundColor White
    Write-Host "   2. Invalid request data" -ForegroundColor White
    Write-Host "   3. Function App permissions" -ForegroundColor White
}

Write-Host ""




