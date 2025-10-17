# AWS Client Deployment

Automated AWS infrastructure for deploying the Next.js frontend application. Creates complete CI/CD pipeline from GitHub to AWS with S3 hosting and CloudFront CDN.

## What This Does

Creates fully automated deployment system that:
- Watches GitHub repository for code changes
- Builds Next.js app automatically when code is pushed
- Deploys to S3 with CloudFront CDN for global delivery
- Handles SSL certificates and custom domains

## Files Overview

- `setup-automated-deployment.ps1` - Main deployment script, creates all AWS infrastructure
- `frontend-infrastructure.yml` - CloudFormation template defining AWS resources  
- `build-configuration.yml` - CodeBuild configuration for Next.js build process
- `add-custom-domain.ps1` - Adds custom domain and SSL to existing infrastructure
- `update-environment-variables.ps1` - Updates environment variables in build system
- `.env` - Frontend environment variables (API URLs, etc)

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- GitHub personal access token with repo permissions
- PowerShell (for running scripts)

## Quick Setup

```powershell
# Deploy complete infrastructure
./setup-automated-deployment.ps1

# Add custom domain (optional)
./add-custom-domain.ps1

# Update environment variables if needed  
./update-environment-variables.ps1
```

## AWS Resources Created

- S3 bucket for static website hosting
- CloudFront distribution for global CDN
- CodePipeline for automated deployments
- CodeBuild project for Next.js builds
- IAM roles and policies for permissions
- SSL certificate via ACM (if custom domain used)
- **CodeBuild Project**: Builds your Next.js application in AWS cloud
- **GitHub Webhook**: Automatically triggers deployments when code changes

### Security and Access
- **IAM Roles**: Secure permissions for all AWS services
- **Secrets Manager**: Securely stores GitHub access token
- **SSL Certificate**: HTTPS encryption (manual DNS validation required for custom domains)

## Deployment Process

### Step 1: Initial Setup (Run Once Only)

1. **Navigate to the AWS client folder**:
   ```powershell
   cd aws/client
   ```

2. **Run the automated deployment script**:
   ```powershell
   .\setup-automated-deployment.ps1
   ```

3. **Provide required information when prompted**:
   - GitHub Personal Access Token (with repository permissions)
   - Confirm AWS region (default: ap-southeast-2)
   - Optionally configure custom domain

4. **Wait for deployment completion** (typically 10-15 minutes):
   - AWS infrastructure is created
   - GitHub webhook is configured
   - Initial website deployment occurs
   - Your website becomes live

### Step 2: Automatic Deployments (Forever)

After initial setup, deployments are completely automatic:

1. **Make changes to your frontend code** in the `client` folder
2. **Commit and push to the main branch**:
   ```bash
   git add .
   git commit -m "your changes description"
   git push origin main
   ```
3. **AWS automatically detects the changes** via GitHub webhook
4. **Build and deployment happens automatically** in AWS
5. **Your changes are live** within 5-10 minutes

## Custom Domain Setup (Optional)

### Cost-Effective Approach (No Route 53)

This system avoids Route 53 costs by using your existing DNS provider:

1. **Run the domain setup script**:
   ```powershell
   .\add-custom-domain.ps1 -DomainName yourdomain.com
   ```

2. **Complete SSL certificate validation**:
   - Go to AWS Certificate Manager console
   - Find your certificate and copy the CNAME validation record
   - Add that CNAME record to your DNS provider
   - Wait for validation (usually 5-30 minutes)

3. **Point your domain to CloudFront**:
   - In your DNS provider, create a CNAME record:
   - **Name**: yourdomain.com (or @ for root domain)
   - **Value**: [CloudFront distribution domain from script output]

4. **Wait for propagation** (5-60 minutes):
   - Your site will be available at https://yourdomain.com
   - No Route 53 costs (saves ~$6/year)

### Supported DNS Providers
- CloudFlare (recommended for additional free features)
- GoDaddy
- Namecheap  
- Domain.com
- Any DNS provider that supports CNAME records

## Environment Variables Management

### How Environment Variables Work

Your environment variables are stored in the `.env` file within this folder. The system handles them securely:

1. **Local Storage**: Variables are stored in `.env` file (never committed to GitHub)
2. **AWS Upload**: Variables are uploaded directly to AWS CodeBuild (secure)
3. **Build Integration**: AWS uses these variables during the build process
4. **Security**: Variables never pass through GitHub, maintaining security

### Updating Environment Variables

1. **Edit the `.env` file** in this folder with your new variables
2. **Upload changes to AWS**:
   ```powershell
   .\update-environment-variables.ps1
   ```
3. **Trigger a rebuild** to use new variables:
   ```bash
   git commit -m "update environment variables" --allow-empty
   git push origin main
   ```

## Custom Domain Setup

To use your own domain name instead of the AWS-provided URL:

1. **Run the domain configuration script**:
   ```powershell
   .\add-custom-domain.ps1
   ```

2. **Provide your domain name** when prompted

3. **Update your domain's DNS settings** with the provided nameservers

4. **Wait for DNS propagation** (typically 24-48 hours)

Your website will then be available at your custom domain with automatic SSL encryption.

## How the Automation Works

### Initial Deployment Flow
1. Setup script creates AWS infrastructure using CloudFormation
2. GitHub webhook is automatically configured
3. Initial build pulls code from your main branch
4. Next.js application is built in AWS CodeBuild
5. Built files are uploaded to S3 bucket
6. CloudFront cache is invalidated for immediate availability
7. Website becomes live at provided URL

### Ongoing Deployment Flow
1. You push code changes to main branch
2. GitHub webhook notifies AWS CodePipeline
3. AWS CodePipeline triggers AWS CodeBuild
4. CodeBuild pulls latest code from GitHub
5. Next.js application is built with environment variables
6. Built files replace existing files in S3 bucket
7. CloudFront cache is invalidated
8. Updated website is live (zero downtime)

## Important Notes

### Security Considerations
- GitHub token is stored securely in AWS Secrets Manager
- Environment variables never pass through GitHub
- IAM roles use minimal required permissions
- All communications use HTTPS encryption

### Cost Optimization
- S3 storage costs are minimal for static websites
- CloudFront provides free tier and pay-per-use pricing
- CodePipeline only runs when code changes occur
- No servers to maintain or pay for when idle

### Performance Features
- Global CDN provides fast loading worldwide
- Optimized caching for static assets
- Compressed file delivery
- HTTP/2 support for modern browsers

## Troubleshooting

### Common Issues and Solutions

**Deployment fails with permission errors**:
- Ensure AWS CLI is configured with administrative permissions
- Verify GitHub token has repository access

**Website shows error after deployment**:
- Check CloudFront distribution status (may take 10-15 minutes to deploy)
- Verify Next.js build completed successfully in CodeBuild logs

**Environment variables not working**:
- Ensure variables are properly formatted in `.env` file
- Run update script and trigger rebuild with empty commit

**Custom domain not working**:
- Complete SSL certificate validation in AWS Certificate Manager
- Add CNAME record pointing your domain to CloudFront distribution
- Allow 24-48 hours for DNS propagation

### Getting Support

1. **Check AWS Console**: Review CodePipeline and CodeBuild logs for detailed error information
2. **Verify GitHub Webhook**: Ensure webhook is present and has been triggered
3. **Review CloudFormation**: Check stack status for any failed resources
4. **Monitor Costs**: Use AWS Cost Explorer to track spending

## Summary

This system provides enterprise-grade hosting and deployment automation for your frontend application. Once setup is complete, all future deployments are automatic, secure, and optimized for performance. The infrastructure scales automatically and provides global availability with minimal ongoing costs.

once setup is complete, any code pushed to the client folder in the main branch will automatically:
1. trigger aws codepipeline
2. build the next.js application
3. deploy files to s3
4. clear cloudfront cache
5. make changes live on your website

## cost

expected monthly cost with aws free tier:
- first year: $2-5/month (mostly free)
- after free tier: $15-25/month depending on traffic