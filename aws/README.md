# AWS Infrastructure

Complete cloud infrastructure for the OneParent VIC platform using AWS services with automated deployment scripts and production-ready configurations optimized for cost-effectiveness and security.

## Architecture Overview

The platform uses a modern, scalable architecture deployed entirely on AWS:

```
Internet → CloudFront CDN → S3 (Frontend) 
                ↓
        Application Load Balancer → EC2 (Server) → RDS PostgreSQL
                                       ↓
                                  Redis Cache
```

### AWS Services Used

**Compute & Storage**
- **EC2 t3.micro**: Single instance hosting Node.js server with Docker containerization
- **S3**: Static website hosting for Next.js frontend with versioning enabled
- **CloudFront**: Global CDN for frontend delivery with edge caching

**Database & Cache**  
- **RDS PostgreSQL**: Managed database with automated backups and point-in-time recovery
- **Redis on EC2**: Containerized Redis cache for session storage and API caching

**Networking & Security**
- **VPC**: Isolated network with public/private subnets and security groups
- **Certificate Manager**: Automated SSL/TLS certificate provisioning and renewal
- **Route 53**: DNS management and health checking (optional)

**CI/CD & Automation**
- **CodePipeline**: Automated frontend deployment pipeline from GitHub
- **CodeBuild**: Next.js build and deployment to S3/CloudFront
- **GitHub Webhooks**: Automated server deployments with zero downtime

**Monitoring & Logging**
- **CloudWatch**: Application and infrastructure monitoring with custom metrics
- **CloudWatch Logs**: Centralized logging for debugging and auditing

## Infrastructure Components

### Frontend (Client)
- **S3 + CloudFront**: Static hosting with global CDN for Next.js application
- **CodePipeline + CodeBuild**: Automated CI/CD from GitHub to S3 with cache invalidation
- **ACM SSL Certificates**: Automatic HTTPS with certificate renewal
- **Custom Domain Support**: Route 53 integration for professional domains

### Backend Server (EC2)
- **Single EC2 t3.micro**: Docker-based Node.js hosting with Nginx reverse proxy
- **Blue-Green Deployment**: Zero downtime updates via container switching
- **GitHub Webhooks**: Automated deployments triggered by code push
- **SSL Termination**: Let's Encrypt certificates with auto-renewal
- **Security Hardening**: fail2ban, SSH restrictions, security headers

### Database (PostgreSQL)
- **RDS PostgreSQL 16**: Managed database with automated backups
- **Complete Schema**: 4 schemas with 13 tables for community data
- **Data Import**: Automated CSV import of 10,000+ demographic records
- **Security**: SSL connections, VPC isolation, minimal access

### Cache (Redis)
- **Containerized Redis 7**: Docker-based deployment on EC2
- **Session Storage**: API caching and user session management  
- **Development Access**: SSH tunnel support for local development
- **Persistence**: RDB + AOF for data durability

## Directory Structure

```
aws/
├── client/                    # Frontend S3 + CloudFront deployment
│   ├── frontend-infrastructure.yml   # CloudFormation template
│   ├── build-configuration.yml       # CodeBuild configuration
│   ├── setup-automated-deployment.ps1  # Complete CI/CD setup
│   └── add-custom-domain.ps1         # Domain and SSL setup
├── database/                  # PostgreSQL RDS deployment
│   ├── create-schema.sql             # Complete database schema
│   ├── setup-database.ps1           # RDS creation and data import
│   └── import-csv-data.ps1           # CSV data import automation
├── ec2/                      # Server infrastructure deployment
│   ├── ec2-infrastructure.yml        # CloudFormation template
│   ├── setup-ec2-infrastructure.ps1  # Complete EC2 setup
│   ├── secure-ec2-instance.ps1      # Security hardening
│   └── nginx-config-template.conf    # Production Nginx config
├── redis/                    # Redis cache deployment
│   ├── docker-compose.yml           # Redis container config
│   ├── deploy-redis.ps1             # Redis deployment script
│   └── redis-simple.conf            # Optimized Redis config
├── server/                   # Docker server deployment
│   ├── docker-compose.prod.yml      # Blue-green deployment config
│   ├── Dockerfile                   # Node.js container definition
│   ├── setup-server-infrastructure.ps1  # Complete server setup
│   ├── setup-ssl-certificates.ps1   # Let's Encrypt SSL setup
│   └── webhook/                     # GitHub webhook automation
├── oneparent-vic-key.pem    # EC2 SSH private key
└── tunnelcommand.env         # SSH tunnel configuration
```

## Cost Structure

The entire infrastructure is optimized for AWS Free Tier usage:

**Monthly Costs (within Free Tier)**
- EC2 t3.micro: $0 (750 hours/month free)
- RDS PostgreSQL: $0 (750 hours/month free)  
- S3 + CloudFront: $0 (5GB + 50GB data transfer free)
- Certificate Manager: $0 (free SSL certificates)
- **Total: $0/month for first 12 months**

**After Free Tier (approximate)**
- EC2 t3.micro: ~$8.50/month
- RDS db.t3.micro: ~$13/month
- S3 + CloudFront: ~$1-5/month depending on traffic
- **Total: ~$25-30/month**

## Security & Compliance

**Network Security**
- VPC with isolated subnets and security groups
- SSH access restricted to specific IP addresses
- All database connections encrypted with SSL/TLS
- Redis accessible only via SSH tunnels

**Application Security** 
- Container isolation with non-root user execution
- Nginx security headers (CSP, XSS protection, HSTS)
- Rate limiting on all API endpoints
- fail2ban intrusion detection on EC2

**Data Protection**
- Encrypted EBS storage for all instances
- Automated database backups with point-in-time recovery
- Redis data persistence with RDB + AOF
- Regular security updates via automated deployments

## Deployment Automation

**Complete Stack Deployment**
```powershell
# 1. Database (creates RDS + imports community data)
cd database && ./setup-database.ps1

# 2. Server Infrastructure (creates EC2 + security)  
cd ../ec2 && ./setup-ec2-infrastructure.ps1

# 3. Redis Cache (deploys containerized Redis)
cd ../redis && ./deploy-redis.ps1 -EC2PublicIP <ip>

# 4. Server Application (Docker + webhooks + SSL)
cd ../server && ./setup-server-infrastructure.ps1

# 5. Frontend CI/CD (S3 + CloudFront + pipeline)
cd ../client && ./setup-automated-deployment.ps1
```

**Ongoing Operations**
- Automatic deployments via GitHub webhooks (backend)
- Automatic deployments via CodePipeline (frontend)  
- Automatic SSL certificate renewal via cron jobs
- Health monitoring and container restart on failure

## Component Documentation

Each infrastructure component has detailed setup documentation:

- **[Frontend Deployment](client/README.md)** - S3 + CloudFront with automated CI/CD
- **[Database Setup](database/README.md)** - PostgreSQL RDS with community data import
- **[Server Infrastructure](ec2/README.md)** - EC2 with Nginx, security hardening, monitoring  
- **[Redis Cache](redis/README.md)** - Containerized Redis with SSH tunnel access
- **[Application Deployment](server/README.md)** - Docker with blue-green deployments