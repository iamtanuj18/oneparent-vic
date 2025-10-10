# oneparent vic database setup
# creates complete database schema and imports all csv data
# this script works for anyone setting up the project from scratch

write-host "oneparent vic - complete database setup" -foregroundcolor green
write-host "this will create your aws rds database and import all data" -foregroundcolor yellow
write-host ""

# check if aws cli is available
$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
if (-not (test-path $awsPath)) {
    write-host "error: aws cli not found" -foregroundcolor red
    write-host "install with: winget install Amazon.AWSCLI" -foregroundcolor yellow
    exit 1
}

# check aws credentials
write-host "checking aws credentials..." -foregroundcolor cyan
try {
    $identity = & $awsPath sts get-caller-identity --region ap-southeast-2 | convertfrom-json
    write-host "aws credentials ok for account: $($identity.Account)" -foregroundcolor green
} catch {
    write-host "error: aws credentials not configured" -foregroundcolor red
    write-host "run: aws configure" -foregroundcolor yellow
    exit 1
}

# step 1: deploy aws rds database
write-host ""
write-host "step 1: creating aws rds postgresql database..." -foregroundcolor yellow
write-host "region: ap-southeast-2 (sydney)" -foregroundcolor cyan
write-host "instance: db.t3.micro (free tier)" -foregroundcolor cyan
write-host ""

# generate secure random password
$dbPassword = -join ((65..90) + (97..122) + (48..57) + @(33,35,37,42,43,45,61,63,64) | Get-Random -Count 20 | ForEach-Object {[char]$_})
write-host "database password generated (secure random)" -foregroundcolor cyan

# deploy database infrastructure
& $awsPath cloudformation deploy `
    --template-file "../database-simple.yml" `
    --stack-name "oneparent-vic-database" `
    --parameter-overrides DBPassword="$dbPassword" `
    --capabilities CAPABILITY_IAM `
    --region ap-southeast-2

if ($LASTEXITCODE -ne 0) {
    write-host "error: database deployment failed" -foregroundcolor red
    exit 1
}

# get database connection details
write-host ""
write-host "getting database connection details..." -foregroundcolor cyan
$outputs = & $awsPath cloudformation describe-stacks --stack-name "oneparent-vic-database" --region ap-southeast-2 --query "Stacks[0].Outputs" | convertfrom-json

$dbEndpoint = ($outputs | where-object {$_.OutputKey -eq "DatabaseEndpoint"}).OutputValue
$dbPort = ($outputs | where-object {$_.OutputKey -eq "DatabasePort"}).OutputValue
$dbName = ($outputs | where-object {$_.OutputKey -eq "DatabaseName"}).OutputValue
$dbUsername = ($outputs | where-object {$_.OutputKey -eq "DatabaseUsername"}).OutputValue

$DATABASE_URL = "postgresql://${dbUsername}:${dbPassword}@${dbEndpoint}:${dbPort}/${dbName}"

write-host "database created successfully:" -foregroundcolor green
write-host "endpoint: $dbEndpoint" -foregroundcolor white
write-host "database: $dbName" -foregroundcolor white
write-host "username: $dbUsername" -foregroundcolor white
write-host "password: [secure - saved in connection file]" -foregroundcolor white

# wait for database to be ready
write-host ""
write-host "waiting for database to be ready..." -foregroundcolor cyan
start-sleep -seconds 120  # wait 2 minutes for rds to initialize

# step 2: create database schema
write-host ""
write-host "step 2: creating database schema..." -foregroundcolor yellow

$env:PGPASSWORD = $dbPassword
psql $DATABASE_URL -f "create-schema.sql"

if ($LASTEXITCODE -ne 0) {
    write-host "error: schema creation failed" -foregroundcolor red
    exit 1
}

write-host "database schema created successfully" -foregroundcolor green

# step 3: import csv data
write-host ""
write-host "step 3: importing csv data..." -foregroundcolor yellow

# run the data import script
powershell -file "import-csv-data.ps1" -DatabaseUrl $DATABASE_URL -Password $dbPassword

if ($LASTEXITCODE -ne 0) {
    write-host "error: data import failed" -foregroundcolor red
    exit 1
}

# step 4: verify setup
write-host ""
write-host "step 4: verifying database setup..." -foregroundcolor yellow

psql $DATABASE_URL -f "verify-database.sql"

# save connection details for backend
write-host ""
write-host "saving database connection for backend..." -foregroundcolor cyan

$connectionInfo = @"
# oneparent vic - database connection details
# use this connection string in your server/.env.local file
# IMPORTANT: keep this file secure and never commit to git

DATABASE_URL=$DATABASE_URL

# database details:
# endpoint: $dbEndpoint
# port: $dbPort
# database: $dbName
# username: $dbUsername
# password: $dbPassword
# region: ap-southeast-2 (sydney)

# security note: this file contains sensitive database credentials
# add this file to .gitignore to prevent accidental commits
"@

$connectionInfo | out-file -filepath "../database-connection.txt" -encoding utf8

write-host ""
write-host "database setup completed successfully!" -foregroundcolor green
write-host ""
write-host "next steps:" -foregroundcolor yellow
write-host "1. copy database_url from database-connection.txt" -foregroundcolor white
write-host "2. paste it into your server/.env.local file" -foregroundcolor white
write-host "3. run your backend server: npm run dev" -foregroundcolor white
write-host ""
write-host "security reminder:" -foregroundcolor red
write-host "- keep database-connection.txt secure and private" -foregroundcolor yellow
write-host "- never commit database credentials to git" -foregroundcolor yellow
write-host "- change passwords if accidentally exposed" -foregroundcolor yellow
write-host ""
write-host "your oneparent vic database is ready to use!" -foregroundcolor green