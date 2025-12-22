# Start Rails server with test environment
Set-Location $PSScriptRoot\..
$env:RAILS_ENV = "test"
bundle exec rails server -p 3000

