# ecparam(
    [string]$InstanceIP = "",
    [string]$KeyFile = "../oneparent-vic-key.pem",
    [switch]$Detailed
)itoring and maintenance script
# monitors system resources, services, and security status
# can be run manually or scheduled via cron

param(
    [string]$InstanceIP,
    [string]$KeyFile = "oneparent-vic-key.pem",
    [switch]$Detailed
)

if (-not $InstanceIP) {
    write-host "usage: .\monitor-ec2-instance.ps1 -InstanceIP <ip-address> [-Detailed]" -foregroundcolor red
    write-host "example: .\monitor-ec2-instance.ps1 -InstanceIP 13.55.123.45 -Detailed" -foregroundcolor yellow
    exit 1
}

if (-not (test-path $KeyFile)) {
    write-host "ssh key file not found: $KeyFile" -foregroundcolor red
    exit 1
}

write-host "monitoring ec2 instance: $InstanceIP" -foregroundcolor green
write-host "timestamp: $(get-date -format 'yyyy-MM-dd HH:mm:ss')" -foregroundcolor cyan
write-host ""

# create monitoring script
$MonitoringScript = @'
#!/bin/bash

echo "=== oneparent vic ec2 monitoring report ==="
echo "timestamp: $(date)"
echo "hostname: $(hostname)"
echo "uptime: $(uptime -p)"
echo ""

# system resources
echo "=== system resources ==="
echo "memory usage:"
free -h | grep -E "Mem|Swap"
echo ""

echo "disk usage:"
df -h / | tail -1
echo ""

echo "cpu usage (5 minute average):"
uptime | awk -F'load average:' '{print $2}' | awk '{print "load: " $2}'
echo ""

echo "top 5 memory consumers:"
ps aux --sort=-%mem | head -6 | awk '{printf "%-10s %-6s %-6s %s\n", $1, $3, $4, $11}'
echo ""

# service status
echo "=== service status ==="
services=("nginx" "redis" "fail2ban" "amazon-cloudwatch-agent")
for service in "${services[@]}"; do
    status=$(systemctl is-active $service 2>/dev/null || echo "inactive")
    if [ "$status" = "active" ]; then
        echo "$service: ✓ active"
    else
        echo "$service: ✗ $status"
    fi
done
echo ""

# nginx status
echo "=== nginx statistics ==="
if systemctl is-active nginx >/dev/null 2>&1; then
    curl -s http://localhost/nginx-status 2>/dev/null || echo "nginx status endpoint not available"
    echo ""
    echo "recent nginx errors (last 10):"
    tail -10 /var/log/nginx/error.log 2>/dev/null | tail -5 || echo "no recent errors"
else
    echo "nginx is not running"
fi
echo ""

# redis status
echo "=== redis statistics ==="
if systemctl is-active redis >/dev/null 2>&1; then
    redis_password=$(grep "^requirepass" /etc/redis.conf | awk '{print $2}' 2>/dev/null)
    if [ -n "$redis_password" ]; then
        redis-cli -a "$redis_password" info memory 2>/dev/null | grep -E "used_memory_human|used_memory_peak_human" || echo "redis connection failed"
        redis-cli -a "$redis_password" info stats 2>/dev/null | grep -E "total_commands_processed|total_connections_received" || echo "redis stats unavailable"
    else
        redis-cli info memory 2>/dev/null | grep -E "used_memory_human|used_memory_peak_human" || echo "redis connection failed"
        redis-cli info stats 2>/dev/null | grep -E "total_commands_processed|total_connections_received" || echo "redis stats unavailable"
    fi
else
    echo "redis is not running"
fi
echo ""

# network connections  
echo "=== network connections ==="
echo "listening ports:"
ss -tlnp | grep -E ":(22|80|443|5000|6379)" | awk '{print $1 " " $4 " " $6}' | column -t
echo ""

echo "active connections by port:"
ss -tn | awk 'NR>1 {print $4}' | cut -d: -f2 | sort | uniq -c | sort -nr | head -5
echo ""

# security status
echo "=== security status ==="
if command -v fail2ban-client >/dev/null 2>&1; then
    echo "fail2ban jails:"
    fail2ban-client status 2>/dev/null | grep "Jail list" | cut -d: -f2 | tr ',' '\n' | while read jail; do
        if [ -n "$(echo $jail | xargs)" ]; then
            banned=$(fail2ban-client status $(echo $jail | xargs) 2>/dev/null | grep "Currently banned" | awk -F: '{print $2}' | xargs)
            echo "  $(echo $jail | xargs): ${banned:-0} banned"
        fi
    done
else
    echo "fail2ban not installed"
fi
echo ""

# log analysis
echo "=== log analysis ==="
echo "recent auth attempts (last 10):"
grep "sshd" /var/log/secure 2>/dev/null | tail -10 | awk '{print $1 " " $2 " " $3 " " $11 " " $14}' | tail -5 || echo "no recent auth logs"
echo ""

echo "disk space warnings:"
df -h | awk '$5 ~ /[8-9][0-9]%/ {print $6 " is " $5 " full"}' || echo "disk space ok"
echo ""

# application status (if nodejs app is running)
echo "=== application status ==="
if pgrep -f "node.*server.js" >/dev/null; then
    echo "nodejs application: ✓ running"
    node_pid=$(pgrep -f "node.*server.js")
    node_mem=$(ps -p $node_pid -o %mem --no-headers 2>/dev/null | xargs)
    node_cpu=$(ps -p $node_pid -o %cpu --no-headers 2>/dev/null | xargs)
    echo "  memory: ${node_mem}%"
    echo "  cpu: ${node_cpu}%"
    
    # test health endpoint
    health_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")
    if [ "$health_status" = "200" ]; then
        echo "  health check: ✓ passed"
    else
        echo "  health check: ✗ failed ($health_status)"
    fi
else
    echo "nodejs application: ✗ not running"
fi

if command -v pm2 >/dev/null 2>&1; then
    echo ""
    echo "pm2 processes:"
    sudo -u ec2-user pm2 list 2>/dev/null || echo "no pm2 processes"
fi
echo ""

# system updates
echo "=== system updates ==="
yum_updates=$(yum check-update 2>/dev/null | wc -l)
if [ "$yum_updates" -gt 0 ]; then
    echo "available updates: $yum_updates packages"
else
    echo "system is up to date"
fi

# automatic updates status
if systemctl is-active yum-cron >/dev/null 2>&1; then
    echo "automatic updates: ✓ enabled"
else
    echo "automatic updates: ✗ disabled"
fi
echo ""

echo "=== monitoring report complete ==="
'@

# save monitoring script
$MonitoringScript | out-file -filepath "monitoring-script.sh" -encoding utf8

# upload and execute monitoring script
write-host "uploading monitoring script to instance" -foregroundcolor yellow
scp -i $KeyFile -o StrictHostKeyChecking=no monitoring-script.sh ec2-user@${InstanceIP}:/tmp/ 2>$null

write-host "executing monitoring on instance" -foregroundcolor yellow
$MonitoringOutput = ssh -i $KeyFile -o StrictHostKeyChecking=no ec2-user@$InstanceIP "chmod +x /tmp/monitoring-script.sh && /tmp/monitoring-script.sh" 2>$null

if ($LASTEXITCODE -eq 0) {
    write-host ""
    write-host "monitoring report:" -foregroundcolor green
    write-host "===================" -foregroundcolor green
    write-host $MonitoringOutput -foregroundcolor white
    
    if ($Detailed) {
        write-host ""
        write-host "additional system details:" -foregroundcolor cyan
        write-host "=========================" -foregroundcolor cyan
        
        # get additional details
        $DetailedScript = @'
echo "kernel version: $(uname -r)"
echo "system architecture: $(uname -m)"
echo "total memory: $(free -h | grep Mem | awk '{print $2}')"
echo "cpu info: $(lscpu | grep 'Model name' | cut -d: -f2 | xargs)"
echo "network interfaces:"
ip addr show | grep -E "inet " | awk '{print "  " $2 " on " $NF}'
echo "mounted filesystems:"
df -hT | grep -v tmpfs | awk 'NR>1 {print "  " $1 " (" $2 ") " $4 " available"}'
'@
        
        $DetailedScript | out-file -filepath "detailed-script.sh" -encoding utf8
        scp -i $KeyFile -o StrictHostKeyChecking=no detailed-script.sh ec2-user@${InstanceIP}:/tmp/ 2>$null
        $DetailedOutput = ssh -i $KeyFile -o StrictHostKeyChecking=no ec2-user@$InstanceIP "chmod +x /tmp/detailed-script.sh && /tmp/detailed-script.sh" 2>$null
        write-host $DetailedOutput -foregroundcolor white
        remove-item "detailed-script.sh" -force
    }
    
} else {
    write-host "monitoring failed to execute" -foregroundcolor red
    write-host "check instance connectivity and key file" -foregroundcolor yellow
}

# cleanup local monitoring script  
remove-item "monitoring-script.sh" -force
write-host ""
write-host "monitoring complete" -foregroundcolor green