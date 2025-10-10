# update environment variables for automated deployments
# this script updates build environment variables in aws codebuild

param(
    [string]$ProjectName = "oneparent-vic",
    [string]$AWSRegion = "ap-southeast-2"
)

$CodeBuildProjectName = "$ProjectName-frontend-build"

Write-Host "environment variables management" -ForegroundColor Blue
Write-Host "this uploads your local .env variables directly to aws codebuild"
Write-Host "github never sees your environment variables (they stay secure)"
Write-Host ""

# check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found in current directory" -ForegroundColor Red
    Write-Host "make sure you run this from aws/client folder" -ForegroundColor Red
    exit 1
}

# read current .env file
Write-Host "reading environment variables from .env file" -ForegroundColor Yellow
$EnvVars = @()
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $Name = $matches[1].Trim()
        $Value = $matches[2].Trim()
        $EnvVars += @{
            name = $Name
            value = $Value
            type = "PLAINTEXT"
        }
        Write-Host "found: $Name" -ForegroundColor Green
    }
}

if ($EnvVars.Count -eq 0) {
    Write-Host "no environment variables found in .env file" -ForegroundColor Red
    exit 1
}

# convert to json format for aws cli
$EnvVarsJson = $EnvVars | ConvertTo-Json -Depth 3 -Compress

Write-Host "updating aws codebuild project with new environment variables" -ForegroundColor Yellow

# update codebuild project environment
$UpdateResult = aws codebuild update-project `
    --name $CodeBuildProjectName `
    --environment "type=LINUX_CONTAINER,image=aws/codebuild/amazonlinux2-x86_64-standard:5.0,computeType=BUILD_GENERAL1_MEDIUM,environmentVariables=$EnvVarsJson" `
    --region $AWSRegion

if ($LASTEXITCODE -eq 0) {
    Write-Host "environment variables updated successfully" -ForegroundColor Green
    Write-Host "variables are now stored securely in aws codebuild"
    Write-Host ""
    Write-Host "updated variables:" -ForegroundColor Cyan
    $EnvVars | ForEach-Object {
        Write-Host "  $($_.name) = $($_.value)" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "important: to use these new variables, trigger a rebuild:" -ForegroundColor Yellow
    Write-Host "git commit -m 'update environment variables' --allow-empty"
    Write-Host "git push origin main"
    Write-Host ""
    Write-Host "why? because aws needs to rebuild your app with the new variables"
} else {
    Write-Host "failed to update environment variables" -ForegroundColor Red
    Write-Host "check if codebuild project exists and you have permissions"
}