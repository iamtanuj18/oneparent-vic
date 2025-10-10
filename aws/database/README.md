# oneparent vic database setup guide

complete guide to setup the oneparent vic database on amazon aws rds from scratch using the provided scripts and csv data files

## what you need before starting

1. amazon aws account with billing setup
2. aws cli installed on your computer
3. postgresql client tools installed
4. powershell terminal access
5. about 30 minutes of setup time

## security important notes

 **before running any scripts:**
- this setup will create files with database passwords
- never commit database-connection.txt to git
- keep your aws credentials secure
- change passwords if accidentally exposed
- use placeholder values for any shared documentation

## step by step setup process

### step 1 - prepare your environment

open powershell terminal and check aws cli is working
```
aws --version
```

make sure you are logged into your aws account
```
aws sts get-caller-identity
```

if not logged in run this command and follow prompts
```
aws configure
```

### step 2 - run the database setup script

navigate to the project aws database folder
```
cd "path\to\your\project\aws\database"
```

run the master setup script
```
.\setup-database.ps1
```

this script will automatically do these things for you:
- create new rds postgresql database on aws
- setup security groups and networking
- create all database schemas and tables
- import all csv data files
- configure ssl connections
- generate secure random database password
- save connection details to a secure file (not committed to git)

the script takes about 10-15 minutes to complete

### step 3 - verify database setup

once setup script finishes it will show you database connection details

use the provided connection string to test your database

run the verification script to check everything is working
```
psql "your-connection-string-here" -f verify-database.sql
```

you should see all table row counts matching expected values

### step 4 - update your application config

copy the database connection string from setup script output

update your application environment variables with new database url

test your application connects to new database successfully

## what gets created

### aws resources
- rds postgresql 16.4 database instance
- vpc security group for database access
- subnet group for multi availability zone setup

### database structure
- 4 database schemas: community, hilda, trends, vic_geo
- 13 tables with complete data
- all indexes and performance optimizations
- ssl encrypted connections

### data imported
- 1277 schools records
- 3511 postcode demographics records  
- 3161 suburb geographic records
- complete hilda survey data
- community services mapping data

## cost information

using aws free tier the database costs nothing for first 12 months

after free tier expires costs about 15-20 dollars per month for small usage

you can delete database anytime to stop costs

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