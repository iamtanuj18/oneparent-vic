# oneparent vic server deployment guide

complete automated deployment system for nodejs express server with docker containerization, nginx reverse proxy, ssl certificates, and github webhook integration for zero downtime deployments.

## overview

this deployment system provides enterprise-grade infrastructure for the oneparent vic server with the following features:

- docker containerization for consistent deployments
- nginx reverse proxy with ssl termination and security headers
- zero downtime blue-green deployments
- automatic deployments triggered by github webhooks
- health checks and rollback capabilities
- resource optimization for aws t3.micro instances

## files and structure

```
aws/server/
├── readme.md                          # this comprehensive guide
├── .gitignore                         # security ignore rules
├── dockerfile                         # server containerization
├── docker-compose.prod.yml            # production orchestration
├── .dockerignore                      # docker build optimization
├── .env.production.template           # environment template
├── setup-server-infrastructure.ps1   # one-click setup script
├── setup-ssl-certificates.ps1        # ssl certificate setup
├── deploy-server-manual.ps1          # manual deployment trigger
├── monitor-server-health.ps1         # health monitoring
├── nginx/
│   ├── nginx.conf                     # main nginx configuration
│   └── oneparent-vic.conf            # server-specific config
└── webhook/
    ├── webhook-receiver.js            # github webhook handler
    ├── deploy.sh                      # zero downtime deployment
    ├── package.json                   # webhook dependencies
    └── webhook-secret.txt.template    # webhook security
```

## quick start

### step 1: prepare environment

1. ensure ec2 instance is running (use aws/ec2/setup-ec2-infrastructure.ps1)
2. ensure redis is deployed (use aws/redis/deploy-redis.ps1)
3. navigate to aws/server directory

### step 2: run one-click setup

```powershell
# basic setup (no custom domain)
.\setup-server-infrastructure.ps1

# setup with custom domain
.\setup-server-infrastructure.ps1 -domainna me "api.oneparentvic.me"
```

### step 3: configure ssl (optional)

```powershell
# setup ssl certificates for custom domain
.\setup-ssl-certificates.ps1 -domainname "api.oneparentvic.me" -email "your@email.com"
```

### step 4: configure github webhook

1. go to your github repository settings
2. add webhook with url: `https://yourdomain.com/webhook` or `http://ec2-ip/webhook`
3. use webhook secret from setup output
4. select "push" events only
5. set content type to application/json

## how it works

### deployment architecture

```
github push → webhook → ec2 deployment → zero downtime switch
```

1. developer pushes code to main branch
2. github triggers webhook to ec2 instance
3. webhook receiver validates and triggers deployment
4. deployment script pulls latest code and builds new container
5. health checks verify new container is ready
6. nginx switches traffic to new container
7. old container is removed after successful switch

### container management

- **blue container**: current production (port 5000)
- **green container**: new deployment (port 5001)
- **nginx**: routes traffic between containers
- **redis**: shared between containers via docker network

### security features

- webhook signature verification
- github ip allowlist for webhook endpoint
- container isolation with non-root user
- ssl termination with modern ciphers
- security headers and rate limiting
- internal-only application ports

## environment configuration

### production environment file

copy `.env.production.template` to `.env.production` and configure:

```env
# application settings
node_env=production
port=5000

# database configuration
database_url=postgresql://username:password@hostname:5432/database

# redis configuration
redis_url=redis://oneparent-redis:6379
redis_password=your_redis_password

# api keys
ticketmaster_api_key=your_key
eventfinda_api_key=your_key

# security
jwt_secret=your_secret
cors_origin=https://yourdomain.com
```

### nginx configuration

the nginx configuration includes:

- ssl termination with lets encrypt certificates
- http to https redirection
- security headers (csp, xss protection, etc)
- rate limiting for api endpoints
- health check endpoint without rate limits
- webhook endpoint with github ip allowlist
- gzip compression for performance
- custom error pages

## deployment process

### automatic deployment (recommended)

once setup is complete, deployments happen automatically:

1. push changes to main branch
2. github webhook triggers deployment
3. server updates with zero downtime
4. no manual intervention required

### manual deployment

for testing or emergency deployments:

```powershell
.\deploy-server-manual.ps1
```

## monitoring and maintenance

### health monitoring

```powershell
.\monitor-server-health.ps1
```

provides comprehensive status including:
- system resources (cpu, memory, disk)
- docker container status
- nginx configuration
- webhook service status
- application health checks
- redis connectivity
- recent deployment logs

### log files

- deployment logs: `/home/ec2-user/oneparent-vic/webhook/deployment.log`
- nginx access logs: `/var/log/nginx/oneparent-vic-access.log`
- nginx error logs: `/var/log/nginx/oneparent-vic-error.log`
- webhook service logs: `journalctl -u oneparent-webhook`

### ssl certificate management

certificates are automatically renewed via cron job:
- daily check at 12:00 pm
- certificates renewed 30 days before expiry
- nginx automatically reloaded after renewal

## troubleshooting

### common issues

**deployment fails**
- check github webhook is configured correctly
- verify webhook secret matches
- ensure server folder changes are pushed to main branch
- check deployment logs on server

**health checks fail**
- verify database connectivity
- check redis container is running
- ensure environment variables are set correctly
- verify application starts without errors

**ssl certificate issues**
- ensure domain points to ec2 instance ip
- check dns propagation (can take 24-48 hours)
- verify ports 80 and 443 are open in security group
- check certbot logs for specific errors

**container startup issues**
- verify dockerfile builds successfully locally
- check production environment file has all required variables
- ensure sufficient memory available (containers limited to 256mb each)
- check docker logs for specific error messages

### diagnostic commands

run these on the ec2 instance for troubleshooting:

```bash
# check container status
docker ps -a
docker logs oneparent-server-blue
docker logs oneparent-server-green

# check nginx status
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/oneparent-vic-error.log

# check webhook service
sudo systemctl status oneparent-webhook
sudo journalctl -u oneparent-webhook -f

# check network connectivity
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:5001/api/health
```

## cost optimization

deployment optimized for aws free tier:

- single t3.micro ec2 instance
- resource limits prevent memory exhaustion
- shared docker network reduces overhead
- nginx serves as single entry point
- logs rotated to prevent disk usage
- ssl certificates free via lets encrypt

estimated monthly cost: $0 (within free tier limits)

## security considerations

- all application ports internal only (127.0.0.1)
- webhook endpoint restricted to github ips
- ssl certificates with modern ciphers
- security headers prevent common attacks
- container isolation with non-root users
- regular security updates via automated deployments

## next steps

after successful deployment:

1. monitor server health regularly
2. set up log aggregation if needed
3. configure backup strategy for application data
4. implement monitoring alerts for production
5. review and update security headers as needed

## getting help

for deployment issues:

1. check this readme for common solutions
2. review server logs using monitoring script
3. verify all prerequisites are met
4. test individual components in isolation

the deployment system is designed to be reliable and self-healing, with comprehensive logging and health checks to identify issues quickly.