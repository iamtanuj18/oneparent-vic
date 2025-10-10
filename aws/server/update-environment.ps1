# update server environment variables
# updates .env.production file on server and restarts containers

param(
    [string]$KeyFile = "../oneparent-vic-key.pem"
)

write-host "oneparent vic server environment update" -foregroundcolor green
write-host ""

# check if local .env.production.template exists
if (!(test-path ".env.production.template")) {
    write-host "error: .env.production.template not found in current directory" -foregroundcolor red
    exit 1
}

# get ec2 connection details
$connectionFile = "../ec2/connection-details.txt"
if (!(test-path $connectionFile)) {
    write-host "error: ec2 connection details not found" -foregroundcolor red
    exit 1
}

$connectionDetails = get-content $connectionFile
$ec2PublicIP = ($connectionDetails | select-string "EC2_PUBLIC_IP=").toString().split("=")[1]

write-host "updating environment variables on: $ec2PublicIP" -foregroundcolor cyan
write-host ""

# copy updated environment file to server
write-host "copying updated environment file to server" -foregroundcolor cyan
scp -i $KeyFile ".env.production.template" ec2-user@${ec2PublicIP}:/home/ec2-user/oneparent-vic/server/.env.production

# restart server containers to pick up new environment
write-host "restarting server containers with new environment" -foregroundcolor cyan
ssh -i $KeyFile ec2-user@$ec2PublicIP @"
cd /home/ec2-user/oneparent-vic/server
echo 'stopping current containers'
docker-compose -f docker-compose.prod.yml down
echo 'starting containers with updated environment'
docker-compose -f docker-compose.prod.yml up -d
echo 'waiting for containers to be ready'
sleep 10
echo 'checking container status'
docker ps --format 'table {{.Names}}\t{{.Status}}'
"@

if ($lastexitcode -eq 0) {
    write-host ""
    write-host "environment variables updated successfully!" -foregroundcolor green
    write-host "server containers restarted with new configuration" -foregroundcolor green
} else {
    write-host ""
    write-host "environment update failed!" -foregroundcolor red
    write-host "check server logs for details" -foregroundcolor yellow
}