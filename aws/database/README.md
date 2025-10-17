# AWS Database Setup

Automated PostgreSQL database setup on AWS RDS with complete schema creation and CSV data import for the OneParent VIC platform.

## What This Does

Creates complete database infrastructure:
- AWS RDS PostgreSQL database with security groups
- 4 schemas: community, hilda, trends, vic_geo  
- 13 tables with full data import from CSV files
- SSL encryption and secure random password generation
- Connection details saved locally (not committed to git)

## Files Overview

- `setup-database.ps1` - Main script that creates AWS RDS and imports all data
- `create-schema.sql` - Database schema definition with all tables and structures
- `import-csv-data.ps1` - Imports CSV files from datasets folder into database tables
- `verify-database.sql` - Verification queries to check data was imported correctly

## Prerequisites

- AWS CLI installed and configured (`aws configure`)
- PostgreSQL client tools (psql command)
- PowerShell terminal

## Quick Setup

```powershell
# Create complete database with data
./setup-database.ps1

# Verify everything imported correctly  
psql "connection-string-from-output" -f verify-database.sql
```

## What Gets Created

### AWS Resources
- RDS PostgreSQL 16.4 instance (db.t3.micro - free tier eligible)
- VPC security group restricting access to your IP
- Subnet group for multi-AZ setup

### Database Content
- 1,277 school records with location data
- 3,511 postcode demographic records
- 3,161 suburb geographic mappings
- HILDA survey data for housing and wellbeing
- Community services and council mappings

## Cost
- Free for first 12 months (AWS free tier)
- Approximately $15-20/month after free tier
- Can be deleted anytime to stop costs

## Security
- SSL encrypted connections only
- Randomly generated 20-character password
- IP-restricted security group access
- Connection details saved locally only (never committed)

## troubleshooting common issues

### aws cli not found
install aws cli from amazon website
restart powershell terminal after install

### permission denied errors
make sure your aws account has rds full access permissions
check your aws credentials are correctly configured

### database connection fails
check security group allows connections from your ip address
verify connection string format is correct
make sure postgresql client is installed

### csv import errors
check all csv files are present in datasets folder
verify file encoding is utf8
make sure file paths in script are correct

## security notes

 **built-in security features:**
- database uses ssl encryption for all connections
- security group restricts access to your ip address only
- database password is randomly generated (20 secure characters)
- connection details are saved locally only

 **critical security practices:**
- **never commit database-connection.txt to git**
- keep database credentials private and secure
- delete or move sensitive files after copying to .env
- change passwords immediately if accidentally exposed
- use placeholder values in any shared documentation

 **files to never commit to git:**
- database-connection.txt (contains credentials)
- any files with real ip addresses or account ids
- .env files with actual passwords or connection strings

## next steps after setup

once database is running you can:
- connect your application using provided connection string
- run database queries and analytics
- add more data or modify schema as needed
- setup automated backups through aws console
- monitor performance through aws cloudwatch

## getting help

if setup fails check the error messages carefully
most issues are related to aws permissions or network settings
you can delete failed resources and try again
aws support documentation has detailed troubleshooting guides