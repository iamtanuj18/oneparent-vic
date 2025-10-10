# automated deployment setup script for frontend infrastructure
# this script creates complete aws infrastructure with ci/cd pipeline
# run this once to set up automatic deployments from github to aws

param(
    [string]$ProjectName = "oneparent-vic",
    [string]$GitHubOwner = "iamtanuj18",
    [string]$GitHubRepo = "oneparent-vic", 
    [string]$GitHubBranch = "main",
    [string]$AWSRegion = "ap-southeast-2"
)

$StackName = "$ProjectName-frontend-infrastructure"

Write-Host "automated frontend deployment setup" -ForegroundColor Blue
Write-Host "this will create complete infrastructure for github to aws automation"
Write-Host ""

# verify aws cli is available and configured
Write-Host "verifying aws cli setup" -ForegroundColor Yellow
try {
    $AccountId = aws sts get-caller-identity --query Account --output text
    if ($LASTEXITCODE -ne 0) {
        throw "aws credentials not configured"
    }
    Write-Host "aws account verified: $AccountId" -ForegroundColor Green
} catch {
    Write-Host "aws credentials not configured. run 'aws configure' first" -ForegroundColor Red
    exit 1
}

# collect github token for automated deployments
Write-Host "github integration setup" -ForegroundColor Yellow
$GitHubToken = Read-Host "enter your github personal access token (with repo permissions)" -AsSecureString
$TokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($GitHubToken))

# store github token securely in aws secrets manager
Write-Host "storing github token in aws secrets manager" -ForegroundColor Yellow
$SecretJson = "{`"token`":`"$TokenPlain`"}"

try {
    aws secretsmanager create-secret --name "github-token" --secret-string $SecretJson --region $AWSRegion 2>$null
    Write-Host "github token stored successfully" -ForegroundColor Green
} catch {
    aws secretsmanager update-secret --secret-id "github-token" --secret-string $SecretJson --region $AWSRegion
    Write-Host "github token updated successfully" -ForegroundColor Green
}

# deploy complete infrastructure including ci/cd pipeline
Write-Host "deploying aws infrastructure (this takes 10-15 minutes)" -ForegroundColor Yellow
Write-Host "creating: s3 bucket, cloudfront cdn, codepipeline, codebuild, iam roles"

aws cloudformation deploy `
    --template-file frontend-infrastructure.yml `
    --stack-name $StackName `
    --parameter-overrides `
        "ProjectName=$ProjectName" `
        "GitHubOwner=$GitHubOwner" `
        "GitHubRepo=$GitHubRepo" `
        "GitHubBranch=$GitHubBranch" `
    --capabilities CAPABILITY_IAM `
    --region $AWSRegion

if ($LASTEXITCODE -eq 0) {
    Write-Host "infrastructure deployment completed successfully" -ForegroundColor Green
} else {
    Write-Host "infrastructure deployment failed - check aws console for details" -ForegroundColor Red
    exit 1
}

# upload environment variables to aws codebuild
Write-Host "configuring environment variables in aws codebuild" -ForegroundColor Yellow
if (Test-Path ".env") {
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
            Write-Host "found environment variable: $Name" -ForegroundColor Green
        }
    }
    
    if ($EnvVars.Count -gt 0) {
        $EnvVarsJson = $EnvVars | ConvertTo-Json -Depth 3 -Compress
        $CodeBuildProjectName = "$ProjectName-frontend-build"
        
        aws codebuild update-project `
            --name $CodeBuildProjectName `
            --environment "type=LINUX_CONTAINER,image=aws/codebuild/amazonlinux2-x86_64-standard:5.0,computeType=BUILD_GENERAL1_MEDIUM,environmentVariables=$EnvVarsJson" `
            --region $AWSRegion
            
        Write-Host "environment variables configured in aws codebuild" -ForegroundColor Green
    }
} else {
    Write-Host "no .env file found - skipping environment variables setup" -ForegroundColor Yellow
}

# retrieve deployment information
Write-Host "retrieving deployment information" -ForegroundColor Yellow
$S3Bucket = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' --output text
$WebsiteURL = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' --output text
$CloudFrontDomain = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' --output text

# trigger initial deployment via aws codepipeline (no local building needed)
Write-Host "triggering initial deployment via aws codepipeline" -ForegroundColor Yellow
Write-Host "this will build and deploy directly from github (no local build needed)"

$CodePipelineName = "$ProjectName-frontend-pipeline"

# start the pipeline execution to build and deploy from github
Write-Host "starting aws codepipeline execution"
$ExecutionId = aws codepipeline start-pipeline-execution --name $CodePipelineName --query 'pipelineExecutionId' --output text

if ($ExecutionId) {
    Write-Host "pipeline execution started: $ExecutionId" -ForegroundColor Green
    Write-Host "aws is now building and deploying your code from github"
    Write-Host "this takes 5-10 minutes for complete deployment"
} else {
    Write-Host "failed to start pipeline - will create placeholder file for now" -ForegroundColor Yellow
    
    # create a simple placeholder page
    $PlaceholderHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>OneParent VIC - Deployment in Progress</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>OneParent VIC</h1>
        <p>Your site is being deployed automatically from GitHub...</p>
        <p>This page will be replaced with your actual site in a few minutes.</p>
    </div>
</body>
</html>
"@
    
    $PlaceholderHtml | Out-File -FilePath "index.html" -Encoding UTF8
    aws s3 cp index.html s3://$S3Bucket/index.html
    Remove-Item "index.html"
    
    $CloudFrontId = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text
    aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths "/*" --query 'Invalidation.Id' --output text
}

# deployment completion summary
Write-Host ""
Write-Host "automated deployment setup completed successfully" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "website url: $WebsiteURL" -ForegroundColor Cyan
Write-Host "s3 bucket: $S3Bucket" -ForegroundColor Cyan
Write-Host "cloudfront domain: $CloudFrontDomain" -ForegroundColor Cyan
Write-Host ""
Write-Host "automatic deployment is now active" -ForegroundColor Green
Write-Host "any changes pushed to the client folder in main branch will automatically deploy"
Write-Host "cloudfront may take 5-15 minutes to propagate changes globally"
Write-Host ""
Write-Host "next steps:"
Write-Host "1. make changes to your client code"
Write-Host "2. commit and push to main branch: git push origin main"
Write-Host "3. watch automatic deployment in aws codepipeline console"
Write-Host ""
Write-Host "management scripts available:"
Write-Host "- add custom domain: .\add-custom-domain.ps1"
Write-Host "- update environment variables: .\update-environment-variables.ps1"
