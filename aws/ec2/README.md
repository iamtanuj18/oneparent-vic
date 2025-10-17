# AWS EC2 Server Setup

Secure EC2 infrastructure setup for hosting the OneParent VIC Node.js server with Nginx reverse proxy, Redis cache, and comprehensive security hardening.

## What This Does

Creates production-ready server infrastructure:
- EC2 instance (t3.micro, free tier eligible) with Amazon Linux 2023
- Nginx reverse proxy with security headers and rate limiting
- Local Redis server with password authentication
- Complete security hardening with fail2ban and SSH restrictions
- CloudWatch monitoring and logging setup
- Automatic security updates and system monitoring

## Files Overview

- `setup-ec2-infrastructure.ps1` - Main script that creates EC2 infrastructure and installs software
- `ec2-infrastructure.yml` - CloudFormation template for AWS resources
- `secure-ec2-instance.ps1` - Additional security hardening script  
- `monitor-ec2-instance.ps1` - System monitoring and health check script
- `nginx-config-template.conf` - Production Nginx configuration template
- `connection-details.txt` - SSH connection information (created after setup)

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- PowerShell terminal
- Public IP address (automatically detected)

## Quick Setup

```powershell
# Create complete EC2 infrastructure
./setup-ec2-infrastructure.ps1

# Apply additional security hardening (use IP from previous output)
./secure-ec2-instance.ps1 -InstanceIP <your-instance-ip>

# Monitor system health
./monitor-ec2-instance.ps1 -InstanceIP <your-instance-ip>
```

## What Gets Created

### AWS Resources
- t3.micro EC2 instance with encrypted 30GB EBS storage
- Security group allowing SSH (your IP only) and HTTP/HTTPS
- IAM role for CloudWatch monitoring
- SSH key pair for secure access

### Server Software
- Node.js 20 with npm and PM2 process manager
- Nginx reverse proxy (port 80 → Node.js port 5000)
- Redis server on localhost:6379 with password authentication
- fail2ban intrusion detection system
- Docker for containerization
- CloudWatch logs agent

## Network Configuration

- **Port 22**: SSH access (restricted to your IP)
- **Port 80**: HTTP access via Nginx proxy
- **Port 443**: HTTPS (for SSL setup)
- **Internal**: Node.js on 5000, Redis on 6379 (localhost only)

## Security Features

- SSH key-only authentication with hardened configuration
- fail2ban monitoring for intrusion attempts
- Nginx rate limiting and security headers
- Redis password authentication and command renaming
- Automatic security updates enabled
- Encrypted EBS storage and secure boot

## Cost

- Free for 12 months (AWS free tier: 750 hours t3.micro + 30GB storage)
- After free tier: ~$10-15/month for EC2 + ~$3-5/month for storage

## Connection

```bash
# SSH to your instance
ssh -i oneparent-vic-key.pem ec2-user@<your-instance-ip>

# Check system status
sudo systemctl status nginx redis fail2ban

# Test Nginx proxy
curl http://localhost/health
```

## network and ports configuration

### ports opened in security group
- port 22: ssh access from your ip only
- port 80: http access for nginx proxy
- port 443: https access for ssl (future use)

### internal port mapping
- nginx listens on 80 and proxies to nodejs on 5000
- redis listens on 127.0.0.1:6379 (local only)
- nodejs application will run on 127.0.0.1:5000

### nginx proxy configuration
- `/api/*` routes to nodejs server on port 5000
- `/health` routes to nodejs health check endpoint
- rate limiting applied (10 requests per minute for api)
- security headers added to all responses
- request size limits enforced

## redis configuration

### local redis instance
- installed and running on localhost only
- secured with random password authentication
- memory limit set to 256mb (suitable for free tier)
- lru eviction policy for cache management
- admin commands renamed for security

### connection details
- host: 127.0.0.1 (localhost)
- port: 6379 (default redis port)
- password: automatically generated during setup
- database: 0 (default)

## security features

### access control
- ssh access restricted to your public ip only
- key-based authentication only (no passwords)
- root login disabled
- nginx proxy protects internal services

### intrusion detection
- fail2ban monitors ssh and nginx logs
- automatic ip blocking for suspicious activity
- rate limiting on api endpoints
- request filtering for common attack patterns

### data protection
- encrypted ebs storage at rest
- secure boot and integrity checking
- automatic security updates
- secure redis configuration with authentication

### monitoring and logging
- cloudwatch logs for nginx access and error logs
- system resource monitoring script
- log rotation to prevent disk space issues
- service health monitoring

## cost information

### free tier usage
- t3.micro instance: free for 750 hours per month
- 30gb ebs storage: free tier allowance
- cloudwatch logs: 5gb free per month
- data transfer: 1gb free per month

### after free tier
- ec2 instance: approximately 10-15 dollars per month
- storage: 3-5 dollars per month for 30gb
- data transfer: varies based on usage

## troubleshooting

### connection issues
check security group allows your current ip address
verify ssh key file permissions (chmod 600 on linux/mac)
confirm instance is in running state

### service failures
ssh to instance and check service status
review cloudwatch logs for error details
run system monitor script for resource usage

### nginx proxy issues  
test nginx configuration with `sudo nginx -t`
check nginx error logs in `/var/log/nginx/error.log`
verify nodejs application is running on port 5000

### redis connection problems
check redis is running with `sudo systemctl status redis`
verify redis password in configuration
test redis connection with `redis-cli -a <password> ping`

## maintenance tasks

### regular updates
automatic security updates are enabled
manual updates can be applied with `sudo yum update`
restart services after major updates

### monitoring
run `./system-monitor.sh` to check system health
monitor cloudwatch logs for application errors
check fail2ban status with `sudo fail2ban-client status`

### backup
ebs snapshots can be created from aws console
application data should be backed up regularly
redis data persists to disk automatically

## next steps after setup

once infrastructure is ready you can:
- deploy your nodejs application using server deployment scripts
- configure ssl certificates for https access
- setup custom domain name with route 53
- add additional monitoring and alerting
- scale to larger instance types if needed

the ec2 instance is now ready to host your oneparent vic nodejs server with full security hardening and monitoring capabilities