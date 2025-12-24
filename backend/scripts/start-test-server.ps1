# Start Rails server with test environment (default)
# To use dev database, set E2E_USE_DEV_DB=true in frontend/.env
Set-Location $PSScriptRoot\..

$useDevDb = $env:E2E_USE_DEV_DB -eq "true"
if ($useDevDb) {
    Write-Host "⚠️  WARNING: Using DEVELOPMENT database for E2E tests!" -ForegroundColor Yellow
    $env:RAILS_ENV = "development"
} else {
    $env:RAILS_ENV = "test"
}

$port = if ($env:VITE_API_URL) {
    $uri = [System.Uri]::new($env:VITE_API_URL)
    $uri.Port
} else {
    3000
}

bundle exec rails server -p $port

