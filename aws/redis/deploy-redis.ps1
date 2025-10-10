# OneParent VIC Redis Deployment Script
# Deploys internal Redis container for Node.js server communication
# Access via SSH tunnel only - no external exposure

param(
    [string]$EC2PublicIP = "",
    [string]$KeyFile = "../ec2/oneparent-vic-key.pem", 
    [string]$RedisPassword = ""
)

# Generate secure Redis password if not provided
if ([string]::IsNullOrEmpty($RedisPassword)) {
    $RedisPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
}

# Check required parameters
if ([string]::IsNullOrEmpty($EC2PublicIP)) {
    Write-Host "ERROR: EC2PublicIP parameter is required" -ForegroundColor Red
    Write-Host "Usage: .\deploy-redis.ps1 -EC2PublicIP your.ec2.ip.address" -ForegroundColor Yellow
    Write-Host "Example: .\deploy-redis.ps1 -EC2PublicIP YOUR_EC2_IP" -ForegroundColor Yellow
    exit 1
}

Write-Host "OneParent VIC Redis Deployment" -ForegroundColor Green
Write-Host "Deploying internal Redis container for server communication" -ForegroundColor Yellow
Write-Host ""

# Check if key file exists
if (-not (Test-Path $KeyFile)) {
    Write-Host "ERROR: SSH key file not found: $KeyFile" -ForegroundColor Red
    Write-Host "Make sure you're running this from the aws/redis directory" -ForegroundColor Yellow
    exit 1
}

# Set proper permissions for SSH key (Windows)
Write-Host "Setting SSH key permissions..." -ForegroundColor Cyan
icacls $KeyFile /reset | Out-Null
icacls $KeyFile /grant:r "$($env:USERNAME):(R)" | Out-Null
icacls $KeyFile /inheritance:r | Out-Null

Write-Host "Testing SSH connection..." -ForegroundColor Cyan
$sshTest = ssh -i $KeyFile -o ConnectTimeout=10 -o StrictHostKeyChecking=no ec2-user@$EC2PublicIP "echo 'SSH connection successful'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SSH connection failed. Check your EC2 instance and security groups." -ForegroundColor Red
    Write-Host "Make sure the EC2 instance is running and accessible." -ForegroundColor Yellow
    exit 1
}
Write-Host "SUCCESS: $sshTest" -ForegroundColor Green

Write-Host "Setting up Redis deployment on EC2..." -ForegroundColor Cyan
ssh -i $KeyFile ec2-user@$EC2PublicIP "sudo systemctl is-active docker || (echo 'Starting Docker...' && sudo systemctl start docker && sudo systemctl enable docker && sleep 5) && groups | grep -q docker || (sudo usermod -a -G docker ec2-user && echo 'Added user to docker group') && mkdir -p /home/ec2-user/oneparent-vic && cd /home/ec2-user/oneparent-vic && echo 'REDIS_PASSWORD=$RedisPassword' > .env && echo 'REDIS_MAXMEMORY=256mb' >> .env && echo 'REDIS_MAXMEMORY_POLICY=allkeys-lru' >> .env && echo 'Redis environment configuration created'"

Write-Host "Copying configuration files..." -ForegroundColor Cyan

# Copy docker-compose.yml
scp -i $KeyFile "docker-compose.yml" ec2-user@${EC2PublicIP}:/home/ec2-user/oneparent-vic/docker-compose.yml

# Copy redis.conf with password replacement
$redisConfContent = Get-Content "redis.conf" -Raw
$redisConfContent = $redisConfContent -replace "REDIS_PASSWORD_PLACEHOLDER", $RedisPassword
$redisConfContent | Out-File -FilePath "redis.conf.tmp" -Encoding UTF8 -NoNewline
scp -i $KeyFile "redis.conf.tmp" ec2-user@${EC2PublicIP}:/home/ec2-user/oneparent-vic/redis.conf
Remove-Item "redis.conf.tmp" -Force



Write-Host "Starting Redis deployment..." -ForegroundColor Cyan
ssh -i $KeyFile ec2-user@$EC2PublicIP "cd /home/ec2-user/oneparent-vic && export REDIS_PASSWORD=$RedisPassword && echo 'Pulling Redis container image...' && docker pull redis:7-alpine && echo 'Starting Redis container...' && docker-compose up -d && echo 'Waiting for Redis to be ready...' && sleep 10 && echo 'Container status:' && docker-compose ps && echo 'Testing Redis connection...' && docker exec oneparent-redis redis-cli -a $RedisPassword ping"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: Secure Redis deployment completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "REDIS SECURITY ARCHITECTURE:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "PRODUCTION (Node.js server on AWS):" -ForegroundColor Cyan
    Write-Host "  REDIS_URL=redis://:$RedisPassword@127.0.0.1:6379" -ForegroundColor White
    Write-Host "  - Direct container connection (internal network)" -ForegroundColor Gray
    Write-Host "  - Password authentication required" -ForegroundColor Gray
    Write-Host ""
    Write-Host "LOCAL DEVELOPMENT (Your laptop):" -ForegroundColor Cyan
    Write-Host "  Step 1: ssh -i $KeyFile -L 6379:localhost:6379 ec2-user@$EC2PublicIP" -ForegroundColor White
    Write-Host "  Step 2: REDIS_URL=redis://:$RedisPassword@localhost:6379" -ForegroundColor White
    Write-Host "  - SSH tunnel provides encrypted connection" -ForegroundColor Gray
    Write-Host "  - No public Redis ports exposed" -ForegroundColor Gray
    Write-Host ""
    Write-Host "SECURITY FEATURES:" -ForegroundColor Yellow
    Write-Host "  - Redis password: $RedisPassword" -ForegroundColor Green
    Write-Host "  - No public port exposure (localhost only)" -ForegroundColor Green
    Write-Host "  - SSH tunnel encryption for external access" -ForegroundColor Green
    Write-Host "  - Container network isolation" -ForegroundColor Green
    
    # Save connection details to file
    $connectionInfo = @"
# OneParent VIC Redis Connection Details - SECURE ARCHITECTURE
# Generated: $(Get-Date)
# Security: SSH tunnel + Redis password + Container isolation

# PRODUCTION CONNECTION (Node.js server on AWS):
REDIS_URL=redis://:$RedisPassword@127.0.0.1:6379

# LOCAL DEVELOPMENT CONNECTION (Your laptop):
# Step 1: Create SSH tunnel
SSH_TUNNEL_COMMAND=ssh -i $KeyFile -L 6379:localhost:6379 ec2-user@$EC2PublicIP

# Step 2: Connect through tunnel
REDIS_DEV_URL=redis://:$RedisPassword@localhost:6379

# CODE CHANGES NEEDED IN YOUR SERVER:

# 1. Update package.json:
#    Remove: "@upstash/redis"
#    Add:    "ioredis": "^5.3.2"

# 2. Update redis.js (lines 1-12):
#    OLD: const { Redis } = require("@upstash/redis");
#         this.redis = new Redis({ url: CONFIG.UPSTASH_REDIS_REST_URL, token: CONFIG.UPSTASH_REDIS_REST_TOKEN });
#
#    NEW: const Redis = require("ioredis");
#         this.redis = new Redis(CONFIG.REDIS_URL);

# 3. Update config.js:
#    Add: REDIS_URL: process.env.REDIS_URL || 'redis://:$RedisPassword@127.0.0.1:6379'

# All your existing Redis methods (mget, incr, expire) work exactly the same!

# SECURITY LAYERS:
# - Container isolation (no public ports)
# - Redis password authentication  
# - SSH tunnel encryption for external access
# - Localhost binding only (127.0.0.1)

# TESTING COMMANDS:
# docker exec oneparent-redis redis-cli -a $RedisPassword ping
# docker-compose logs redis
# ssh -i $KeyFile ec2-user@$EC2PublicIP 'docker exec oneparent-redis redis-cli -a $RedisPassword info'
"@
    
    $connectionInfo | Out-File -FilePath "redis-connection-details.txt" -Encoding UTF8
    Write-Host ""
    Write-Host "Connection details saved to: redis-connection-details.txt" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Redis deployment failed!" -ForegroundColor Red
    Write-Host "Check the logs above for error details" -ForegroundColor Yellow
}