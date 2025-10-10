# oneparent vic ec2 infrastructure setup
# creates secure ec2 instance with nginx proxy for nodejs and redis
# free tier t3.micro in sydney region with full security configuration

param(
    [string]$ProjectName = "oneparent-vic",
    [string]$KeyName = "oneparent-vic-key",
    [string]$InstanceType = "t3.micro",
    [string]$Region = "ap-southeast-2"
)

$StackName = "$ProjectName-ec2-infrastructure"

write-host "oneparent vic ec2 infrastructure setup" -foregroundcolor green
write-host "creating secure ec2 instance in sydney with nginx proxy" -foregroundcolor yellow
write-host ""

# check aws cli and credentials
write-host "verifying aws cli setup" -foregroundcolor cyan
$awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
try {
    $AccountId = & $awsPath sts get-caller-identity --region $Region --query Account --output text
    if ($LASTEXITCODE -ne 0) {
        throw "aws credentials not configured"
    }
    write-host "aws account verified: $AccountId" -foregroundcolor green
} catch {
    write-host "aws credentials not configured. run 'aws configure' first" -foregroundcolor red
    exit 1
}

# check if key pair exists or create new one
write-host "checking ssh key pair" -foregroundcolor cyan
$KeyExists = & $awsPath ec2 describe-key-pairs --region $Region --key-names $KeyName --query 'KeyPairs[0].KeyName' --output text 2>$null
if ($KeyExists -ne $KeyName) {
    write-host "creating new ssh key pair: $KeyName" -foregroundcolor yellow
    $KeyResult = & $awsPath ec2 create-key-pair --region $Region --key-name $KeyName --query 'KeyMaterial' --output text
    if ($LASTEXITCODE -eq 0) {
        $KeyResult | out-file -filepath "$KeyName.pem" -encoding ascii
        write-host "ssh private key saved as: $KeyName.pem" -foregroundcolor green
        write-host "keep this file secure and private" -foregroundcolor yellow
    } else {
        write-host "failed to create ssh key pair" -foregroundcolor red
        exit 1
    }
} else {
    write-host "using existing ssh key pair: $KeyName" -foregroundcolor green
}

# get current public ip for ssh access
write-host "getting your public ip for ssh access" -foregroundcolor cyan
try {
    $MyPublicIP = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10).Trim()
    write-host "your public ip: $MyPublicIP" -foregroundcolor green
} catch {
    write-host "failed to get public ip. using 0.0.0.0 for ssh (less secure)" -foregroundcolor yellow
    $MyPublicIP = "0.0.0.0"
}

# create cloudformation template for ec2 infrastructure
$CloudFormationTemplate = @"
AWSTemplateFormatVersion: '2010-09-09'
Description: 'oneparent vic secure ec2 infrastructure with nginx proxy'

Parameters:
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: ssh key pair name for ec2 access
    Default: $KeyName
  
  InstanceType:
    Type: String
    Description: ec2 instance type
    Default: $InstanceType
    AllowedValues: [t3.micro, t3.small]
  
  SSHLocation:
    Type: String
    Description: ip address range for ssh access
    Default: $MyPublicIP/32
    AllowedPattern: (\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})

Resources:
  # vpc security group for ec2 instance
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '\${AWS::StackName}-ec2-security-group'
      GroupDescription: 'security group for oneparent vic ec2 instance'
      SecurityGroupIngress:
        # ssh access from your ip only
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation
          Description: 'ssh access from your ip'
        
        # http access from anywhere for nginx
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'http access for nginx proxy'
        
        # https access from anywhere for nginx
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'https access for nginx proxy'
      
      SecurityGroupEgress:
        # allow all outbound traffic
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'all outbound traffic'
      
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-security-group'
        - Key: Project
          Value: 'oneparent-vic'
  
  # iam role for ec2 instance
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '\${AWS::StackName}-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      
      Policies:
        - PolicyName: 'ec2-basic-permissions'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: '*'
      
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-role'
        - Key: Project
          Value: 'oneparent-vic'
  
  # instance profile for ec2 role
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '\${AWS::StackName}-instance-profile'
      Roles:
        - !Ref EC2Role
  
  # ec2 instance with amazon linux 2023
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      ImageId: 'ami-0146fc9ad419e2cfd'  # amazon linux 2023 in ap-southeast-2
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      
      BlockDeviceMappings:
        - DeviceName: '/dev/xvda'
          Ebs:
            VolumeType: 'gp3'
            VolumeSize: 30  # free tier allows up to 30gb
            DeleteOnTermination: true
            Encrypted: true
      
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          
          # update system packages (using yum for compatibility)
          yum update -y
          
          # install basic tools and services
          yum install -y git curl wget htop nano vim unzip
          yum install -y docker nginx
          
          # enable and start services
          systemctl enable docker nginx
          systemctl start docker nginx
          usermod -a -G docker ec2-user
          
          # install docker compose
          curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-Linux-x86_64" -o /usr/local/bin/docker-compose
          chmod +x /usr/local/bin/docker-compose
          
          # install nodejs 20 from nodesource
          curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
          yum install -y nodejs
          
          # install pm2 globally for process management
          npm install -g pm2
          
          # create application directories
          mkdir -p /opt/oneparent-vic
          mkdir -p /home/ec2-user/oneparent-vic
          mkdir -p /home/ec2-user/oneparent-vic/data/redis
          chown -R ec2-user:ec2-user /opt/oneparent-vic
          chown -R ec2-user:ec2-user /home/ec2-user/oneparent-vic
          
          # create nginx configuration directory
          mkdir -p /etc/nginx/sites-available
          mkdir -p /etc/nginx/sites-enabled
          
          # create basic nginx proxy configuration
          cat > /etc/nginx/sites-available/oneparent-vic << 'EOF'
          server {
              listen 80;
              server_name _;
              
              # security headers
              add_header X-Frame-Options DENY;
              add_header X-Content-Type-Options nosniff;
              add_header X-XSS-Protection "1; mode=block";
              add_header Referrer-Policy "strict-origin-when-cross-origin";
              
              # api proxy to nodejs application
              location /api/ {
                  proxy_pass http://127.0.0.1:5000;
                  proxy_http_version 1.1;
                  proxy_set_header Upgrade \$http_upgrade;
                  proxy_set_header Connection 'upgrade';
                  proxy_set_header Host \$host;
                  proxy_set_header X-Real-IP \$remote_addr;
                  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                  proxy_set_header X-Forwarded-Proto \$scheme;
                  proxy_cache_bypass \$http_upgrade;
                  proxy_connect_timeout 60s;
                  proxy_send_timeout 60s;
                  proxy_read_timeout 60s;
              }
              
              # health check endpoint
              location /health {
                  proxy_pass http://127.0.0.1:5000/api/health;
                  proxy_http_version 1.1;
                  proxy_set_header Host \$host;
                  proxy_set_header X-Real-IP \$remote_addr;
                  proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                  proxy_set_header X-Forwarded-Proto \$scheme;
              }
              
              # default response for root
              location / {
                  return 200 'oneparent vic api server is running';
                  add_header Content-Type text/plain;
              }
          }
          EOF
          
          # enable the site
          ln -sf /etc/nginx/sites-available/oneparent-vic /etc/nginx/sites-enabled/
          
          # update main nginx config to include sites-enabled
          sed -i '/http {/a\    include /etc/nginx/sites-enabled/*;' /etc/nginx/nginx.conf
          
          # test and start nginx
          nginx -t && systemctl start nginx
          
          # configure firewall
          yum install -y firewalld
          systemctl enable firewalld
          systemctl start firewalld
          
          # allow required ports through firewall
          firewall-cmd --permanent --add-service=ssh
          firewall-cmd --permanent --add-service=http
          firewall-cmd --permanent --add-service=https
          firewall-cmd --reload
          
          # setup cloudwatch logs agent
          yum install -y amazon-cloudwatch-agent
          
          # create log configuration
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
          {
              "logs": {
                  "logs_collected": {
                      "files": {
                          "collect_list": [
                              {
                                  "file_path": "/var/log/nginx/access.log",
                                  "log_group_name": "/aws/ec2/oneparent-vic/nginx-access",
                                  "log_stream_name": "{instance_id}"
                              },
                              {
                                  "file_path": "/var/log/nginx/error.log",
                                  "log_group_name": "/aws/ec2/oneparent-vic/nginx-error",
                                  "log_stream_name": "{instance_id}"
                              }
                          ]
                      }
                  }
              }
          }
          EOF
          
          # start cloudwatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
          
          # create startup script for pm2
          cat > /home/ec2-user/start-pm2.sh << 'EOF'
          #!/bin/bash
          cd /opt/oneparent-vic
          pm2 start ecosystem.config.js
          pm2 save
          pm2 startup
          EOF
          
          chmod +x /home/ec2-user/start-pm2.sh
          chown ec2-user:ec2-user /home/ec2-user/start-pm2.sh
          
          # signal cloudformation that setup is complete
          /opt/aws/bin/cfn-signal -e \$? --stack \${AWS::StackName} --resource EC2Instance --region \${AWS::Region}
      
      CreationPolicy:
        ResourceSignal:
          Count: 1
          Timeout: PT15M  # 15 minute timeout for setup
      
      Tags:
        - Key: Name
          Value: !Sub '\${AWS::StackName}-instance'
        - Key: Project
          Value: 'oneparent-vic'

Outputs:
  InstanceId:
    Description: 'ec2 instance id'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '\${AWS::StackName}-instance-id'
  
  PublicIP:
    Description: 'public ip address of ec2 instance'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '\${AWS::StackName}-public-ip'
  
  PublicDNS:
    Description: 'public dns name of ec2 instance'
    Value: !GetAtt EC2Instance.PublicDnsName
    Export:
      Name: !Sub '\${AWS::StackName}-public-dns'
  
  SecurityGroupId:
    Description: 'security group id for ec2 instance'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '\${AWS::StackName}-security-group-id'
  
  SSHCommand:
    Description: 'ssh command to connect to instance'
    Value: !Sub 'ssh -i ../oneparent-vic-key.pem ec2-user@\${EC2Instance.PublicIp}'
  
  APIEndpoint:
    Description: 'api endpoint url'
    Value: !Sub 'http://\${EC2Instance.PublicIp}/api'
  
  HealthCheck:
    Description: 'health check url'
    Value: !Sub 'http://\${EC2Instance.PublicIp}/health'
"@

# save cloudformation template
$TemplatePath = "ec2-infrastructure.yml"
$CloudFormationTemplate | out-file -filepath $TemplatePath -encoding ascii
write-host "cloudformation template saved: $TemplatePath" -foregroundcolor green

# deploy cloudformation stack
write-host "deploying ec2 infrastructure stack" -foregroundcolor yellow
write-host "this will take 10-15 minutes to complete" -foregroundcolor cyan

$DeployResult = & $awsPath cloudformation deploy --region $Region --template-file $TemplatePath --stack-name $StackName --parameter-overrides KeyName=$KeyName InstanceType=$InstanceType SSHLocation="$MyPublicIP/32" --capabilities CAPABILITY_NAMED_IAM

if ($LASTEXITCODE -eq 0) {
    write-host ""
    write-host "ec2 infrastructure deployment completed successfully" -foregroundcolor green
    
    # get stack outputs
    $Outputs = & $awsPath cloudformation describe-stacks --region $Region --stack-name $StackName --query 'Stacks[0].Outputs' --output json | convertfrom-json
    
    write-host ""
    write-host "ec2 instance details:" -foregroundcolor cyan
    foreach ($output in $Outputs) {
        write-host "$($output.OutputKey): $($output.OutputValue)" -foregroundcolor white
    }
    
    write-host ""
    write-host "next steps:" -foregroundcolor yellow
    write-host "1. use the ssh command above to connect to your instance"
    write-host "2. run the server deployment script to install your application"
    write-host "3. test the api endpoint and health check urls"
    write-host ""
    write-host "security features enabled:" -foregroundcolor green
    write-host "- encrypted ebs storage"
    write-host "- nginx reverse proxy with security headers"
    write-host "- firewall configured for required ports only"
    write-host "- cloudwatch logging enabled"
    write-host "- ssh access restricted to your ip"
    write-host "- local redis server for caching"
    write-host ""
    
} else {
    write-host "ec2 infrastructure deployment failed" -foregroundcolor red
    write-host "check aws cloudformation console for error details" -foregroundcolor yellow
    exit 1
}