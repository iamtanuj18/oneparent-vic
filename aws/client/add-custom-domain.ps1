# add custom domain to existing aws infrastructure
# run this script when you want to configure your custom domain

param(
    [string]$ProjectName = "oneparent-vic",
    [string]$DomainName = "",
    [string]$AWSRegion = "ap-southeast-2"
)

if (-not $DomainName) {
    $DomainName = Read-Host "enter your domain name (example: yoursite.com)"
}

$StackName = "$ProjectName-frontend-infrastructure"

Write-Host "adding custom domain: $DomainName" -ForegroundColor Blue
Write-Host "this will create SSL certificate and update infrastructure"
Write-Host "note: no route 53 costs - uses your existing dns provider" -ForegroundColor Green

# update existing stack with domain configuration
Write-Host "updating cloudformation stack with domain settings" -ForegroundColor Yellow

aws cloudformation deploy `
    --template-file frontend-infrastructure.yml `
    --stack-name $StackName `
    --parameter-overrides `
        "ProjectName=$ProjectName" `
        "DomainName=$DomainName" `
    --capabilities CAPABILITY_IAM `
    --region $AWSRegion

if ($LASTEXITCODE -eq 0) {
    Write-Host "domain configuration completed successfully" -ForegroundColor Green
    
    # get cloudfront domain and ssl certificate info
    $CloudFrontDomain = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' --output text
    $SSLCertArn = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs[?OutputKey==`SSLCertificateArn`].OutputValue' --output text
    
    Write-Host ""
    Write-Host "domain setup completed - manual dns setup required" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Green
    Write-Host "domain: $DomainName" -ForegroundColor Cyan
    Write-Host "cloudfront distribution: $CloudFrontDomain" -ForegroundColor Cyan
    Write-Host "ssl certificate: $SSLCertArn" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "manual steps required:" -ForegroundColor Yellow
    Write-Host "1. ssl certificate validation:" -ForegroundColor White
    Write-Host "   - go to aws certificate manager console" -ForegroundColor Gray
    Write-Host "   - find your certificate and copy the cname validation record" -ForegroundColor Gray
    Write-Host "   - add that cname record to your dns provider" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. domain pointing:" -ForegroundColor White
    Write-Host "   - in your dns provider, create a cname record:" -ForegroundColor Gray
    Write-Host "   - name: $DomainName (or @ for root domain)" -ForegroundColor Gray
    Write-Host "   - value: $CloudFrontDomain" -ForegroundColor Gray
    Write-Host ""
    Write-Host "after completing both steps, your site will be available at:" -ForegroundColor Yellow
    Write-Host "https://$DomainName" -ForegroundColor Green
    Write-Host ""
    Write-Host "cost savings: no route 53 fees (saves ~$6/year)" -ForegroundColor Green
} else {
    Write-Host "domain configuration failed - check aws console for details" -ForegroundColor Red
}