# oneparent vic server deployment setup
# complete one-click setup for nodejs server with docker, nginx, ssl, and auto deployment

param(
    [string]$ProjectName = "oneparent-vic",
    [string]$DomainName = "",
    [string]$GitHubRepo = "iamtanuj18/oneparent-vic",
    [string]$KeyFile = "../oneparent-vic-key.pem"
)

# check if running from correct directory
if (!(test-path "docker-compose.prod.yml")) {
    write-host "error: please run this script from the aws/server directory" -foregroundcolor red
    exit 1
}

write-host "oneparent vic server deployment setup" -foregroundcolor green
write-host "setting up docker containers, nginx proxy, ssl, and auto deployment" -foregroundcolor yellow
write-host ""

# get ec2 connection details
$connectionFile = "../ec2/connection-details.txt"
if (!(test-path $connectionFile)) {
    write-host "error: ec2 connection details not found at $connectionFile" -foregroundcolor red
    write-host "please run ec2 setup first" -foregroundcolor yellow
    exit 1
}

$connectionDetails = get-content $connectionFile
$ec2PublicIP = ($connectionDetails | select-string "EC2_PUBLIC_IP=").toString().split("=")[1]

if (!$ec2PublicIP) {
    write-host "error: could not find ec2 public ip in connection details" -foregroundcolor red
    exit 1
}

write-host "using ec2 instance: $ec2PublicIP" -foregroundcolor cyan

# validate ssh connection
write-host "testing ssh connection to ec2 instance" -foregroundcolor cyan
$testConnection = ssh -i $KeyFile -o ConnectTimeout=10 ec2-user@$ec2PublicIP "echo 'connection ok'"
if ($lastexitcode -ne 0) {
    write-host "error: cannot connect to ec2 instance" -foregroundcolor red
    write-host "please check your ssh key and ec2 instance status" -foregroundcolor yellow
    exit 1
}
write-host "ssh connection successful" -foregroundcolor green

# create deployment directories on ec2
write-host "creating deployment directories on ec2" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
mkdir -p /home/ec2-user/oneparent-vic/server
mkdir -p /home/ec2-user/oneparent-vic/webhook
mkdir -p /home/ec2-user/oneparent-vic/nginx
sudo mkdir -p /var/www/html
"@

# copy server deployment files
write-host "copying server deployment files" -foregroundcolor cyan
scp -i $KeyFile "Dockerfile" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/
scp -i $KeyFile "docker-compose.prod.yml" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/
scp -i $KeyFile ".dockerignore" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/

# copy nginx configuration
write-host "copying nginx configuration files" -foregroundcolor cyan
scp -i $KeyFile "nginx/nginx.conf" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/nginx/
scp -i $KeyFile "nginx/oneparent-vic.conf" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/nginx/

# copy webhook files
write-host "copying webhook automation files" -foregroundcolor cyan
scp -i $KeyFile "webhook/webhook-receiver.js" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/webhook/
scp -i $KeyFile "webhook/deploy.sh" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/webhook/
scp -i $KeyFile "webhook/package.json" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/webhook/

# setup environment file
if (test-path ".env.production") {
    write-host "copying existing production environment file" -foregroundcolor cyan
    scp -i $KeyFile ".env.production" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/
} else {
    write-host "creating production environment file from template" -foregroundcolor yellow
    scp -i $KeyFile ".env.production.template" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/.env.production
    write-host "warning: please update .env.production on the server with actual values" -foregroundcolor red
}

# install and configure nginx
write-host "configuring nginx on ec2 instance" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
# install nginx if not already installed
if ! command -v nginx >&2; then
    echo 'installing nginx'
    sudo yum install -y nginx
    sudo systemctl enable nginx
fi

# backup existing nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak 2>/dev/null || true

# copy our nginx configuration
sudo cp /home/ec2-user/oneparent-vic/nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp /home/ec2-user/oneparent-vic/nginx/oneparent-vic.conf /etc/nginx/conf.d/oneparent-vic.conf

# update domain name in nginx config
if [ -n '$DomainName' ]; then
    echo 'updating nginx config with domain: $DomainName'
    sudo sed -i 's/your_domain_here/$DomainName/g' /etc/nginx/conf.d/oneparent-vic.conf
else
    echo 'using default server configuration (no custom domain)'
    sudo sed -i 's/your_domain_here/_/g' /etc/nginx/conf.d/oneparent-vic.conf
    # comment out ssl configuration for now
    sudo sed -i 's/ssl_certificate/#ssl_certificate/g' /etc/nginx/conf.d/oneparent-vic.conf
    sudo sed -i 's/listen 443 ssl http2/listen 443/g' /etc/nginx/conf.d/oneparent-vic.conf
fi

# create simple error pages
sudo bash -c 'cat > /var/www/html/404.html << EOF
<!DOCTYPE html>
<html><head><title>not found</title></head>
<body><h1>404 - endpoint not found</h1></body></html>
EOF'

sudo bash -c 'cat > /var/www/html/50x.html << EOF
<!DOCTYPE html>
<html><head><title>server error</title></head>
<body><h1>server temporarily unavailable</h1></body></html>
EOF'

# test nginx configuration
sudo nginx -t
if [ $? -eq 0 ]; then
    echo 'nginx configuration valid'
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    echo 'nginx configuration error'
    exit 1
fi
"@

if ($lastexitcode -ne 0) {
    write-host "error: nginx setup failed" -foregroundcolor red
    exit 1
}

# setup docker network
write-host "configuring docker network" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
# create shared docker network for redis and server communication
docker network create oneparent-network 2>/dev/null || echo 'network already exists'

# connect existing redis container to network if it exists
if docker ps -q -f name=oneparent-redis; then
    echo 'connecting redis container to shared network'
    docker network connect oneparent-network oneparent-redis 2>/dev/null || echo 'redis already connected'
fi
"@

# setup webhook automation
write-host "setting up webhook automation" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
cd /home/ec2-user/oneparent-vic/webhook

# install webhook dependencies
npm install

# make deploy script executable
chmod +x deploy.sh

# create webhook secret file
if [ ! -f webhook-secret.txt ]; then
    echo 'creating webhook secret file'
    openssl rand -hex 32 > webhook-secret.txt
    echo 'webhook secret generated and saved to webhook-secret.txt'
    echo 'please configure this secret in your github webhook settings'
fi

# create systemd service for webhook receiver
sudo bash -c 'cat > /etc/systemd/system/oneparent-webhook.service << EOF
[Unit]
Description=OneParent VIC Webhook Receiver
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/oneparent-vic/webhook
ExecStart=/usr/bin/node webhook-receiver.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF'

# enable and start webhook service
sudo systemctl daemon-reload
sudo systemctl enable oneparent-webhook
sudo systemctl start oneparent-webhook
echo 'webhook service started'
"@

# initial server deployment
write-host "performing initial server deployment" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
cd /home/ec2-user/oneparent-vic

# clone repository if it doesn't exist
if [ ! -d '.git' ]; then
    echo 'cloning repository'
    git clone https://github.com/$GitHubRepo.git .
    git checkout main
fi

# run initial deployment
cd webhook
bash deploy.sh
"@

if ($lastexitcode -eq 0) {
    write-host ""
    write-host "server deployment setup completed successfully!" -foregroundcolor green
    write-host ""
    
    # show connection details
    write-host "server endpoints:" -foregroundcolor yellow
    if ($DomainName) {
        write-host "- https://$DomainName/api/health" -foregroundcolor white
        write-host "- https://$DomainName/api/" -foregroundcolor white
    } else {
        write-host "- http://$ec2PublicIP/api/health" -foregroundcolor white
        write-host "- http://$ec2PublicIP/api/" -foregroundcolor white
    }
    
    write-host ""
    write-host "webhook configuration:" -foregroundcolor yellow
    $webhookSecret = ssh -i $KeyFile ec2-user@$ec2PublicIP "cat /home/ec2-user/oneparent-vic/webhook/webhook-secret.txt"
    write-host "- webhook url: http://$ec2PublicIP/webhook" -foregroundcolor white
    write-host "- webhook secret: $webhookSecret" -foregroundcolor white
    
    write-host ""
    write-host "next steps:" -foregroundcolor yellow
    write-host "1. configure github webhook with the url and secret above" -foregroundcolor white
    write-host "2. update .env.production file on server with your database and api keys" -foregroundcolor white
    if (!$DomainName) {
        write-host "3. optionally run setup-ssl-certificates.ps1 to configure custom domain and ssl" -foregroundcolor white
    }
    write-host "4. push code to main branch - server will auto-deploy with zero downtime!" -foregroundcolor white
    
} else {
    write-host ""
    write-host "server deployment setup failed!" -foregroundcolor red
    write-host "check the logs above for error details" -foregroundcolor yellow
}