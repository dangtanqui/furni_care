# Start Rails server with test environment
# Always uses test database (RAILS_ENV=test) for safety
Set-Location $PSScriptRoot\..

$env:RAILS_ENV = "test"

$port = if ($env:VITE_API_URL) {
    $uri = [System.Uri]::new($env:VITE_API_URL)
    $uri.Port
} else {
    3000
}

bundle exec rails server -p $port

