# oneparent vic ec2 setup guide

complete guide to deploy secure ec2 infrastructure for oneparent vic nodejs server with nginx proxy and local redis

## what you need before starting

1. amazon aws account with billing setup
2. aws cli installed and configured
3. powershell terminal access
4. about 20 minutes setup time
5. your public ip address (script will detect automatically)

## what gets created

### aws resources
- t3.micro ec2 instance (free tier eligible)
- security group with minimal required ports
- iam role with cloudwatch permissions
- encrypted ebs storage (30gb free tier)
- ssh key pair for secure access

### software installed on ec2
- amazon linux 2023 (latest)
- nodejs 20 with npm
- nginx reverse proxy server
- redis server (local instance)
- pm2 process manager
- docker (for future use)
- cloudwatch logs agent
- fail2ban security tool
- automatic security updates

### security configuration
- ssh hardened (key only, no root login)
- firewall configured for required ports only
- nginx with security headers and rate limiting
- redis secured with password authentication
- encrypted storage and secure boot
- cloudwatch monitoring and logging
- fail2ban intrusion detection

## deployment steps

### step 1 - create ec2 infrastructure

navigate to ec2 deployment folder
```
cd aws\ec2
```

run the infrastructure setup script
```
.\setup-ec2-infrastructure.ps1
```

this script will:
- verify aws credentials and region
- create or use existing ssh key pair
- detect your public ip for ssh access
- deploy cloudformation stack with ec2 instance
- configure nginx proxy for nodejs and redis
- install all required software and security tools
- setup cloudwatch logging and monitoring

the deployment takes 10-15 minutes to complete

### step 2 - apply security hardening

after infrastructure is created, run security hardening
```
.\secure-ec2-instance.ps1 -InstanceIP <your-instance-ip>
```

replace <your-instance-ip> with the public ip from step 1 output

this applies additional security measures:
- hardens ssh configuration
- configures fail2ban intrusion detection
- secures redis with authentication
- applies nginx rate limiting and security headers
- enables automatic security updates
- configures log rotation and monitoring

### step 3 - verify installation

connect to your instance using ssh
```
ssh -i ../oneparent-vic-key.pem ec2-user@<your-instance-ip>
```

check system status
```
./system-monitor.sh
```

verify services are running
```
sudo systemctl status nginx redis fail2ban
```

test nginx proxy
```
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