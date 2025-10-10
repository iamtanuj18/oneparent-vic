# ssl certificate setup for oneparent vic server
# configures lets encrypt ssl certificates and custom domain

param(
    [string]$DomainName = $(read-host "enter your domain name (e.g., api.oneparentvic.me)"),
    [string]$Email = $(read-host "enter your email address for lets encrypt"),
    [string]$KeyFile = "../oneparent-vic-key.pem"
)

if (!$DomainName -or !$Email) {
    write-host "error: domain name and email are required" -foregroundcolor red
    exit 1
}

write-host "ssl certificate setup for $DomainName" -foregroundcolor green
write-host ""

# get ec2 connection details
$connectionFile = "../ec2/connection-details.txt"
if (!(test-path $connectionFile)) {
    write-host "error: ec2 connection details not found" -foregroundcolor red
    exit 1
}

$connectionDetails = get-content $connectionFile
$ec2PublicIP = ($connectionDetails | select-string "EC2_PUBLIC_IP=").toString().split("=")[1]

write-host "configuring ssl for domain: $DomainName" -foregroundcolor cyan
write-host "ec2 instance: $ec2PublicIP" -foregroundcolor cyan
write-host ""

# verify domain points to ec2 instance
write-host "verifying dns configuration" -foregroundcolor cyan
try {
    $resolvedIP = [System.Net.Dns]::GetHostAddresses($DomainName)[0].IPAddressToString
    if ($resolvedIP -eq $ec2PublicIP) {
        write-host "dns verification successful: $DomainName -> $ec2PublicIP" -foregroundcolor green
    } else {
        write-host "warning: dns mismatch - $DomainName -> $resolvedIP (expected: $ec2PublicIP)" -foregroundcolor yellow
        write-host "ssl setup will continue but may fail without proper dns" -foregroundcolor yellow
    }
} catch {
    write-host "warning: could not resolve $DomainName" -foregroundcolor yellow
    write-host "please ensure dns is configured correctly" -foregroundcolor yellow
}

# install and configure certbot on ec2
write-host "installing certbot and configuring ssl certificates" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
# install certbot
if ! command -v certbot >&2; then
    echo 'installing certbot'
    sudo yum update -y
    sudo yum install -y certbot python3-certbot-nginx
fi

# stop nginx temporarily for certificate generation
sudo systemctl stop nginx

# generate ssl certificate
echo 'generating ssl certificate for $DomainName'
sudo certbot certonly --standalone \
    --email $Email \
    --agree-tos \
    --no-eff-email \
    --domains $DomainName

if [ $? -eq 0 ]; then
    echo 'ssl certificate generated successfully'
    
    # update nginx configuration with ssl
    sudo sed -i 's/your_domain_here/$DomainName/g' /etc/nginx/conf.d/oneparent-vic.conf
    sudo sed -i 's/#ssl_certificate/ssl_certificate/g' /etc/nginx/conf.d/oneparent-vic.conf
    sudo sed -i 's/listen 443;/listen 443 ssl http2;/g' /etc/nginx/conf.d/oneparent-vic.conf
    
    # test nginx configuration
    sudo nginx -t
    if [ $? -eq 0 ]; then
        echo 'nginx ssl configuration valid'
        sudo systemctl start nginx
        echo 'nginx restarted with ssl enabled'
    else
        echo 'nginx ssl configuration error'
        exit 1
    fi
    
    # setup automatic certificate renewal
    echo 'setting up automatic certificate renewal'
    (sudo crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet --nginx') | sudo crontab -
    
    echo 'ssl setup completed successfully'
else
    echo 'ssl certificate generation failed'
    sudo systemctl start nginx
    exit 1
fi
"@

if ($lastexitcode -eq 0) {
    write-host ""
    write-host "ssl certificate setup completed successfully!" -foregroundcolor green
    write-host ""
    write-host "your server is now available at:" -foregroundcolor yellow
    write-host "- https://$DomainName/api/health" -foregroundcolor white
    write-host "- https://$DomainName/api/" -foregroundcolor white
    write-host ""
    write-host "ssl certificate details:" -foregroundcolor yellow
    write-host "- domain: $DomainName" -foregroundcolor white
    write-host "- issuer: lets encrypt" -foregroundcolor white
    write-host "- auto-renewal: enabled (daily check at 12:00)" -foregroundcolor white
    write-host ""
    write-host "webhook url updated:" -foregroundcolor yellow
    write-host "- webhook url: https://$DomainName/webhook" -foregroundcolor white
    write-host ""
    write-host "please update your github webhook configuration with the new https url" -foregroundcolor yellow
    
} else {
    write-host ""
    write-host "ssl certificate setup failed!" -foregroundcolor red
    write-host "common issues:" -foregroundcolor yellow
    write-host "- dns not properly configured (domain must point to $ec2PublicIP)" -foregroundcolor white
    write-host "- firewall blocking port 80/443" -foregroundcolor white
    write-host "- domain already has certificates (try with --force-renewal)" -foregroundcolor white
}