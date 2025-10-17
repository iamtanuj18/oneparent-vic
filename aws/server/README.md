# AWS Server Deployment

Complete Docker-based deployment system for the Node.js server with Nginx reverse proxy, SSL certificates, and automated GitHub webhook deployments with zero downtime.

## What This Does

Creates production server deployment infrastructure:
- Docker containerization with blue-green deployment strategy
- Nginx reverse proxy with SSL termination and security headers
- GitHub webhook integration for automatic deployments on push
- Health checks and rollback capabilities for zero downtime
- Resource optimization for t3.micro instances with proper limits

## Files Overview

- `setup-server-infrastructure.ps1` - Main deployment script that sets up complete infrastructure
- `docker-compose.prod.yml` - Production Docker orchestration with blue-green containers
- `Dockerfile` - Node.js server containerization with security best practices
- `setup-ssl-certificates.ps1` - Let's Encrypt SSL certificate setup for custom domains
- `update-environment.ps1` - Environment variable management script
- `nginx/` - Nginx configuration files with security and performance optimization
- `webhook/` - GitHub webhook receiver for automated deployments

## Prerequisites

- EC2 instance running (from EC2 folder setup)
- Redis deployed (from Redis folder setup)
- GitHub repository with webhook access

## Quick Setup

```powershell
# Basic setup with IP access
./setup-server-infrastructure.ps1

# Setup with custom domain
./setup-server-infrastructure.ps1 -DomainName "api.oneparentvic.me"

# Configure SSL for custom domain
./setup-ssl-certificates.ps1 -DomainName "api.oneparentvic.me" -Email "your@email.com"
```

## Deployment Strategy

### Blue-Green Deployment Process
1. GitHub push triggers webhook on EC2
2. New container built from latest code (Green)
3. Health checks validate new container
4. Nginx switches traffic from Blue to Green
5. Old Blue container removed after successful switch

### GitHub Webhook Setup
1. Repository Settings → Webhooks → Add webhook
2. URL: `https://yourdomain.com/webhook` or `http://ec2-ip/webhook`
3. Content type: application/json
4. Events: Push events only
5. Secret: Use generated webhook secret from setup output

## Architecture

### Container Management
- **Blue Container**: Current production server (port 5000)
- **Green Container**: New deployment container (port 5001)  
- **Nginx**: Routes traffic and handles SSL termination
- **Redis**: Shared cache accessible via Docker network

### Security Features
- Webhook signature verification with GitHub IP allowlist
- Container isolation with non-root user execution
- SSL termination with Let's Encrypt certificates
- Security headers (CSP, XSS protection, HSTS)
- Rate limiting on API endpoints
- Internal-only application ports (127.0.0.1 binding)

## Environment Configuration

Copy `.env.production.template` to `.env.production` and configure:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@hostname:5432/database
REDIS_URL=redis://oneparent-redis:6379
REDIS_PASSWORD=your_redis_password
TICKETMASTER_API_KEY=your_key
EVENTFINDA_API_KEY=your_key
GEMINI_API_KEY=your_key
JWT_SECRET=your_secret
CORS_ORIGIN=https://yourdomain.com
```

## Monitoring

### Health Checks
```bash
# Check container status
docker ps -a
docker logs oneparent-server-blue

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Check webhook service
sudo systemctl status oneparent-webhook
sudo journalctl -u oneparent-webhook -f

# Test connectivity
curl http://127.0.0.1:5000/api/health
```

### Log Locations
- Deployment: `/home/ec2-user/oneparent-vic/webhook/deployment.log`
- Nginx access: `/var/log/nginx/oneparent-vic-access.log`
- Nginx error: `/var/log/nginx/oneparent-vic-error.log`

## Cost
- Optimized for AWS free tier (t3.micro)
- Resource limits prevent memory exhaustion
- Free SSL certificates via Let's Encrypt
- Estimated cost: $0 within free tier limits

## Automatic Features
- Zero downtime deployments via blue-green strategy
- Automatic SSL certificate renewal (daily checks)
- Health check validation before traffic switching
- Rollback capability on deployment failure
- GitHub webhook integration for push-triggered deployments