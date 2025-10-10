# onparam(
    [string]$InstanceIP = "",
    [string]$KeyFile = "../oneparent-vic-key.pem"
)ent vic ec2 security configuration
# additional security hardening script for production deployment
# run this after basic ec2 setup to enhance security

param(
    [string]$InstanceIP,
    [string]$KeyFile = "oneparent-vic-key.pem"
)

if (-not $InstanceIP) {
    write-host "usage: .\secure-ec2-instance.ps1 -InstanceIP <ip-address>" -foregroundcolor red
    write-host "example: .\secure-ec2-instance.ps1 -InstanceIP 13.55.123.45" -foregroundcolor yellow
    exit 1
}

if (-not (test-path $KeyFile)) {
    write-host "ssh key file not found: $KeyFile" -foregroundcolor red
    write-host "make sure you have the correct key file in this directory" -foregroundcolor yellow
    exit 1
}

write-host "applying security hardening to ec2 instance" -foregroundcolor green
write-host "instance ip: $InstanceIP" -foregroundcolor cyan
write-host ""

# create security hardening script
$SecurityScript = @'
#!/bin/bash

echo "starting security hardening process"

# update all packages to latest versions
sudo yum update -y

# configure ssh security
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo sed -i 's/#AuthorizedKeysFile/AuthorizedKeysFile/' /etc/ssh/sshd_config

# restart ssh service
sudo systemctl restart sshd

# configure automatic security updates
sudo yum install -y yum-cron
sudo sed -i 's/apply_updates = no/apply_updates = yes/' /etc/yum/yum-cron.conf
sudo systemctl enable yum-cron
sudo systemctl start yum-cron

# install and configure fail2ban
sudo yum install -y epel-release
sudo yum install -y fail2ban

# create fail2ban configuration
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/secure
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

# start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# secure redis configuration
sudo sed -i 's/# requirepass foobared/requirepass $(openssl rand -base64 32)/' /etc/redis.conf
sudo sed -i 's/# rename-command CONFIG ""/rename-command CONFIG ""/' /etc/redis.conf
sudo sed -i 's/# rename-command SHUTDOWN SHUTDOWN_MENOT/rename-command SHUTDOWN SHUTDOWN_$(openssl rand -hex 8)/' /etc/redis.conf

# restart redis with secure config
sudo systemctl restart redis

# secure nginx configuration
sudo tee /etc/nginx/conf.d/security.conf << 'EOF'
# hide nginx version
server_tokens off;

# security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self';" always;

# rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=health:10m rate=30r/m;

# file upload limits
client_max_body_size 1M;
client_body_buffer_size 16K;
client_header_buffer_size 1k;
large_client_header_buffers 2 1k;

# timeouts
client_body_timeout 10s;
client_header_timeout 10s;
keepalive_timeout 5s 5s;
send_timeout 10s;
EOF

# update nginx site configuration with rate limiting
sudo tee /etc/nginx/sites-available/oneparent-vic << 'EOF'
server {
    listen 80;
    server_name _;
    
    # api proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=5 nodelay;
        limit_req_status 429;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # block common attack patterns
        location ~ /api/.*(union|select|insert|delete|drop|create|alter|exec|script) {
            deny all;
        }
    }
    
    # health check with rate limiting
    location /health {
        limit_req zone=health burst=10 nodelay;
        
        proxy_pass http://127.0.0.1:5000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(htaccess|htpasswd|ini|log|sh|sql|conf)$ {
        deny all;
    }
    
    # default response
    location / {
        return 200 'oneparent vic api server is running';
        add_header Content-Type text/plain;
    }
}
EOF

# test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# configure log rotation
sudo tee /etc/logrotate.d/oneparent-vic << 'EOF'
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        systemctl reload nginx
    endscript
}

/opt/oneparent-vic/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# set up system monitoring
sudo tee /home/ec2-user/system-monitor.sh << 'EOF'
#!/bin/bash

# check system resources
echo "=== system resources ==="
echo "memory usage:"
free -h
echo ""
echo "disk usage:"
df -h
echo ""
echo "cpu load:"
uptime
echo ""

# check services
echo "=== service status ==="
systemctl is-active nginx redis fail2ban amazon-cloudwatch-agent

# check security
echo ""
echo "=== security status ==="
sudo fail2ban-client status
echo ""
echo "open ports:"
sudo ss -tlnp
EOF

chmod +x /home/ec2-user/system-monitor.sh

# create system maintenance cron job
echo "0 2 * * 0 /home/ec2-user/system-monitor.sh >> /var/log/system-monitor.log 2>&1" | sudo crontab -

echo "security hardening completed successfully"
echo "services status:"
systemctl is-active nginx redis fail2ban amazon-cloudwatch-agent
'@

# save security script
$SecurityScript | out-file -filepath "security-hardening.sh" -encoding utf8

# upload and execute security script
write-host "uploading security hardening script to instance" -foregroundcolor yellow
scp -i $KeyFile -o StrictHostKeyChecking=no security-hardening.sh ec2-user@${InstanceIP}:/tmp/

write-host "executing security hardening on instance" -foregroundcolor yellow
ssh -i $KeyFile -o StrictHostKeyChecking=no ec2-user@$InstanceIP "chmod +x /tmp/security-hardening.sh && /tmp/security-hardening.sh"

if ($LASTEXITCODE -eq 0) {
    write-host ""
    write-host "security hardening completed successfully" -foregroundcolor green
    write-host ""
    write-host "security features applied:" -foregroundcolor cyan
    write-host "- ssh hardened (no root login, no password auth)" -foregroundcolor white
    write-host "- automatic security updates enabled" -foregroundcolor white
    write-host "- fail2ban installed and configured" -foregroundcolor white
    write-host "- nginx security headers and rate limiting" -foregroundcolor white
    write-host "- redis secured with password and renamed commands" -foregroundcolor white
    write-host "- log rotation configured" -foregroundcolor white
    write-host "- system monitoring script installed" -foregroundcolor white
    write-host ""
    write-host "test security status:" -foregroundcolor yellow
    write-host "ssh -i $KeyFile ec2-user@$InstanceIP './system-monitor.sh'" -foregroundcolor white
    
} else {
    write-host "security hardening failed" -foregroundcolor red
    write-host "check the instance logs for details" -foregroundcolor yellow
    exit 1
}

# cleanup local security script
remove-item "security-hardening.sh" -force
write-host "local security script cleaned up" -foregroundcolor green