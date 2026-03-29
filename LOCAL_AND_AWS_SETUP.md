# TicTacToe-Nakama: Complete Local Setup & AWS Deployment Guide

A comprehensive guide to run the TicTacToe-Nakama multiplayer game on your local system and deploy it to AWS.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
   - [Prerequisites](#prerequisites)
   - [Frontend Setup](#frontend-setup)
   - [Backend Setup](#backend-setup)
   - [Running the Application](#running-the-application)
2. [AWS Deployment Guide](#aws-deployment-guide)
   - [Prerequisites for AWS](#prerequisites-for-aws)
   - [Step-by-Step AWS Deployment](#step-by-step-aws-deployment)
   - [Post-Deployment Configuration](#post-deployment-configuration)
   - [Monitoring & Maintenance](#monitoring--maintenance)

---

# LOCAL DEVELOPMENT SETUP

## Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Verify installation: `docker --version`

4. **Git**
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

5. **pnpm** (recommended for frontend)
   ```bash
   npm install -g pnpm
   ```

### System Requirements

- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** Minimum 5GB available
- **OS:** Windows, macOS, or Linux

---

## Frontend Setup

The frontend is a **Next.js** application built with React and Tailwind CSS.

### Step 1: Navigate to Client Directory

```bash
cd client
```

### Step 2: Copy Environment Variables

```bash
cp .env.example .env.local
```

The `.env.local` file should contain:
```
NEXT_PUBLIC_SERVER_API=localhost
NEXT_PUBLIC_SERVER_PORT=7350
NEXT_PUBLIC_USE_SSL=false
```

> **Note:** For local development, keep `NEXT_PUBLIC_SERVER_API=localhost` and `NEXT_PUBLIC_USE_SSL=false`

### Step 3: Install Dependencies

Using **pnpm** (recommended):
```bash
pnpm install
```

Or using **npm**:
```bash
npm install
```

### Step 4: Run Frontend Development Server

Using **pnpm**:
```bash
pnpm run dev
```

Or using **npm**:
```bash
npm run dev
```

### Expected Output

```
> next dev
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### Access Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

---

## Backend Setup

The backend is a **Nakama** server with custom TypeScript modules running in Docker.

### Step 1: Navigate to Server Directory

From the project root:
```bash
cd server
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `nakama-runtime`: Nakama server runtime for custom TypeScript modules
- `typescript`: For compiling TypeScript code

### Step 3: Start Docker Containers

The `docker-compose.yml` will start:
- **PostgreSQL 12** database
- **Nakama** server with custom modules

Run the following command:

```bash
docker-compose up
```

**First time setup** (build Docker images):
```bash
docker-compose up --build
```

### Step 4: Wait for Services to Start

You'll see output like:
```
postgres_1     | database system is ready to accept connections
template_nk_backend   | {version ...}
template_nk_backend   | gRPC API server started on [:]:7349.
template_nk_backend   | HTTP API server started on [:]:7350.
```

> **Note:** First startup takes 2-3 minutes. Wait until all services are "healthy"

### Step 5: Verify Backend is Running

Test the backend with curl:

```bash
curl -i http://localhost:7350/
```

Expected response:
```
HTTP/1.1 200 OK
Content-Length: 0
```

### Backend Ports Reference

| Port | Service | Purpose |
|------|---------|---------|
| **7349** | gRPC API | Server-to-server communication |
| **7350** | HTTP/WebSocket API | Client connections & game data |
| **7351** | Nakama Console | Admin UI for server management |
| **5432** | PostgreSQL | Database (internal) |

### Accessing Services

- **Nakama Console:** http://localhost:7351
  - Username: `admin`
  - Password: `password`
  
- **Database:** `localhost:5432`
  - User: `postgress`
  - Password: `***********`
  - Database: `postgress`

---

## Running the Application

### Terminal 1: Start Backend

```bash
cd server
docker-compose up
```

### Terminal 2: Start Frontend

```bash
cd client
pnpm run dev
# or
npm run dev
```

### Access the Game

1. Open browser: http://localhost:3000
2. Enter your player name
3. Open another browser tab/window and create another player
4. Start playing!

---
## Stopping the Application

### Stop Frontend

Press `Ctrl+C` in the terminal running the frontend

### Stop Backend

Press `Ctrl+C` in the terminal running Docker, then:

```bash
docker-compose down
```

To remove all data and start fresh:
```bash
docker-compose down -v
```

---

# AWS DEPLOYMENT GUIDE

Deploy the TicTacToe-Nakama application to AWS using EC2, RDS, and load balancing.

## Prerequisites for AWS

### AWS Account Setup

1. **AWS Account**
   - Create at: https://aws.amazon.com/
   - Verify you have billing enabled

2. **AWS CLI**
   - Download from: https://aws.amazon.com/cli/
   - Configure credentials:
     ```bash
     aws configure
     ```
   - You'll need:
     - AWS Access Key ID
     - AWS Secret Access Key
     - Default region (e.g., `us-east-1`)

3. **Required IAM Permissions**
   - EC2: Full access
   - RDS: Full access
   - VPC: Full access
   - S3: Full access (for backups)
   - CloudWatch: Full access (for monitoring)

### Local Prerequisites

- Git configured and ready
- Docker installed (for testing images)
- AWS CLI configured
- GitHub account (for CI/CD, optional)

---

## Step-by-Step AWS Deployment

### PHASE 1: Setup AWS Infrastructure (15 minutes)

#### Step 1.1: Create VPC and Security Groups

First, create a Virtual Private Cloud (VPC) for your application:

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --region us-east-1

# Save the VPC ID from output
# Export it as an environment variable (replace with your actual VPC ID)
export VPC_ID="vpc-xxxxxxxxx"
```

Create security groups:

```bash
# Create security group for backend
aws ec2 create-security-group \
  --group-name tictactoe-backend-sg \
  --description "Security group for TicTacToe backend" \
  --vpc-id $VPC_ID \
  --region us-east-1

# Save the security group ID
export BACKEND_SG_ID="sg-xxxxxxxxx"

# Create security group for database
aws ec2 create-security-group \
  --group-name tictactoe-db-sg \
  --description "Security group for TicTacToe database" \
  --vpc-id $VPC_ID \
  --region us-east-1

export DB_SG_ID="sg-xxxxxxxxx"
```

#### Step 1.2: Configure Security Group Rules

Allow inbound traffic to backend:

```bash
# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow Nakama HTTP API (port 7350)
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG_ID \
  --protocol tcp \
  --port 7350 \
  --cidr 0.0.0.0/0 \
  --region us-east-1

# Allow SSH (port 22) - restrict to your IP
aws ec2 authorize-security-group-ingress \
  --group-id $BACKEND_SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32 \
  --region us-east-1
```

Allow database traffic:

```bash
# Allow PostgreSQL (port 5432) from backend security group
aws ec2 authorize-security-group-ingress \
  --group-id $DB_SG_ID \
  --protocol tcp \
  --port 5432 \
  --source-security-group-id $BACKEND_SG_ID \
  --region us-east-1
```

#### Step 1.3: Create Subnets

```bash
# Create public subnet
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --region us-east-1

export PUBLIC_SUBNET_ID="subnet-xxxxxxxxx"

# Create private subnet (for database)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --region us-east-1

export PRIVATE_SUBNET_ID="subnet-xxxxxxxxx"
```

#### Step 1.4: Create Internet Gateway

```bash
# Create Internet Gateway
aws ec2 create-internet-gateway --region us-east-1

export IGW_ID="igw-xxxxxxxxx"

# Attach to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id $IGW_ID \
  --vpc-id $VPC_ID \
  --region us-east-1
```

---

### PHASE 2: Create RDS PostgreSQL Database (20 minutes)

#### Step 2.1: Create DB Subnet Group

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name tictactoe-db-subnet \
  --db-subnet-group-description "Subnet group for TicTacToe database" \
  --subnet-ids $PRIVATE_SUBNET_ID \
  --region us-east-1
```

#### Step 2.2: Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 12.13 \
  --master-username nakama \
  --master-user-password "YourStrongPassword123!" \
  --allocated-storage 20 \
  --storage-type gp2 \
  --db-name nakama \
  --vpc-security-group-ids $DB_SG_ID \
  --db-subnet-group-name tictactoe-db-subnet \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --multi-az false \
  --region us-east-1
```

**IMPORTANT:** Replace `"YourStrongPassword123!"` with a strong password. Save it securely!

#### Step 2.3: Wait for Database to be Ready

Monitor the database creation:

```bash
aws rds describe-db-instances \
  --db-instance-identifier tictactoe-nakama-db \
  --region us-east-1 \
  --query 'DBInstances[0].DBInstanceStatus'
```

Wait until status changes to `available` (5-10 minutes).

Get the database endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier tictactoe-nakama-db \
  --region us-east-1 \
  --query 'DBInstances[0].Endpoint.Address'
```

Save the endpoint, e.g., `tictactoe-nakama-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com`

---

### PHASE 3: Create EC2 Instance for Backend (10 minutes)

#### Step 3.1: Create EC2 Key Pair

```bash
aws ec2 create-key-pair \
  --key-name tictactoe-key \
  --region us-east-1 \
  --query 'KeyMaterial' \
  --output text > tictactoe-key.pem

# Set proper permissions (macOS/Linux)
chmod 400 tictactoe-key.pem

# For Windows, restrict to current user only
icacls tictactoe-key.pem /inheritance:r /grant:r "%username%:F"
```

#### Step 3.2: Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name tictactoe-key \
  --security-group-ids $BACKEND_SG_ID \
  --subnet-id $PUBLIC_SUBNET_ID \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=TicTacToe-Backend}]' \
  --user-data file://user-data.sh \
  --region us-east-1
```

Note: You'll need to create `user-data.sh` first. See Step 3.3.

#### Step 3.3: Create User Data Script

Create a file named `user-data.sh`:

```bash
#!/bin/bash
set -e

# Update system
yum update -y
yum install -y git curl docker aws-cli

# Start Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/tictactoe
cd /opt/tictactoe

# Clone repository (replace with your repo)
git clone https://github.com/YOUR_USERNAME/TicTacToe-Nakama.git .

# Create environment variables file
cat > server/.env << 'EOF'
DATABASE_HOST=tictactoe-nakama-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=nakama
DATABASE_PASSWORD=YourStrongPassword123!
DATABASE_NAME=nakama
EOF

cd server

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

Save this file and use it in the EC2 launch command above.

#### Step 3.4: Get EC2 Public IP

```bash
# Wait a few seconds for the instance to start
sleep 10

# Get the public IP address
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=TicTacToe-Backend" \
  --region us-east-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# Save this IP - you'll need it later
export BACKEND_IP="x.x.x.x"
```

---

### PHASE 4: Build and Push Docker Image to ECR (10 minutes)

#### Step 4.1: Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name tictactoe-nakama \
  --region us-east-1

# Get the repository URI
export ECR_URI=$(aws ecr describe-repositories \
  --repository-names tictactoe-nakama \
  --region us-east-1 \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "ECR URI: $ECR_URI"
```

#### Step 4.2: Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI
```

#### Step 4.3: Build Docker Image

Navigate to the server directory:

```bash
cd server

# Build image
docker build -t tictactoe-nakama:latest .

# Tag for ECR
docker tag tictactoe-nakama:latest $ECR_URI:latest
docker tag tictactoe-nakama:latest $ECR_URI:v1.0
```

#### Step 4.4: Push to ECR

```bash
docker push $ECR_URI:latest
docker push $ECR_URI:v1.0

echo "Image pushed successfully!"
```

---

### PHASE 5: Configure and Deploy Backend (15 minutes)

#### Step 5.1: SSH into EC2 Instance

```bash
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP
```

#### Step 5.2: Update docker-compose Configuration

On the EC2 instance:

```bash
cd /opt/tictactoe/server

# Edit docker-compose.prod.yml
nano docker-compose.prod.yml
```

Replace `docker-compose.prod.yml` with:

```yaml
version: '3'
services:
  nakama:
    image: registry.heroiclabs.com/heroiclabs/nakama:3.17.0
    container_name: tictactoe_nakama
    ports:
      - "7349:7349"  # gRPC
      - "7350:7350"  # HTTP
      - "7351:7351"  # Console
    environment:
      POSTGRES_HOST: tictactoe-nakama-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com
      POSTGRES_PORT: 5432
      POSTGRES_USER: nakama
      POSTGRES_PASSWORD: YourStrongPassword123!
      POSTGRES_DATABASE: nakama
    restart: always
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:7350/']
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - ./data/local.yml:/nakama/data/local.yml:ro
```

#### Step 5.3: Initialize Database

On the EC2 instance:

```bash
docker-compose -f docker-compose.prod.yml run nakama \
  /nakama/nakama migrate up \
  --database.address "nakama:YourStrongPassword123!@tictactoe-nakama-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com:5432/nakama"
```

#### Step 5.4: Start Nakama Service

```bash
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose logs -f nakama
```

Verify it's running:

```bash
curl -i http://localhost:7350/
```

Expected: `HTTP/1.1 200 OK`

#### Step 5.5: Exit SSH

```bash
exit
```

---

### PHASE 6: Deploy Frontend (10 minutes)

#### Option A: Deploy Frontend to AWS Amplify (Recommended)

##### Step 6A.1: Connect GitHub Repository to AWS Amplify

```bash
# Open AWS Amplify console
# https://console.aws.amazon.com/amplify/

# Steps:
# 1. Click "New app" → "Host web app"
# 2. Select "GitHub"
# 3. Authorize AWS Amplify to access your GitHub account
# 4. Select repository: YOUR_USERNAME/TicTacToe-Nakama
# 5. Select branch: main
```

##### Step 6A.2: Configure Build Settings

In Amplify console:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - cd client && pnpm install
    build:
      commands:
        - cd client && pnpm run build
  artifacts:
    baseDirectory: client/.next
    files:
      - '**/*'
  cache:
    paths:
      - client/node_modules/**/*
env:
  variables:
    NEXT_PUBLIC_SERVER_API: $BACKEND_IP
    NEXT_PUBLIC_SERVER_PORT: '7350'
    NEXT_PUBLIC_USE_SSL: 'false'
```

##### Step 6A.3: Deploy

Click "Save and deploy" in Amplify console. Wait 3-5 minutes for deployment to complete.

---

#### Option B: Deploy Frontend to EC2 (Manual)

##### Step 6B.1: SSH into EC2

```bash
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP
```

##### Step 6B.2: Install Node.js and pnpm

```bash
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

sudo npm install -g pnpm
```

##### Step 6B.3: Clone and Build Frontend

```bash
cd /opt/tictactoe/client

# Install dependencies
pnpm install

# Build
pnpm run build

# Create .env.production
cat > .env.production << EOF
NEXT_PUBLIC_SERVER_API=$BACKEND_IP
NEXT_PUBLIC_SERVER_PORT=7350
NEXT_PUBLIC_USE_SSL=false
EOF
```

##### Step 6B.4: Start Frontend with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Start frontend
pm2 start "pnpm start" --name "tictactoe-frontend" --cwd /opt/tictactoe/client

# Save PM2 configuration
pm2 save
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Verify it's running
pm2 list
```

##### Step 6B.5: Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo yum install -y nginx

# Create Nginx config
sudo tee /etc/nginx/conf.d/tictactoe.conf > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

##### Step 6B.6: Exit SSH

```bash
exit
```

---

### PHASE 7: Setup Load Balancer (Optional but Recommended) (15 minutes)

#### Step 7.1: Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name tictactoe-alb \
  --subnets $PUBLIC_SUBNET_ID \
  --security-groups $BACKEND_SG_ID \
  --scheme internet-facing \
  --type application \
  --region us-east-1

# Save the ALB ARN
export ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names tictactoe-alb \
  --region us-east-1 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)
```

#### Step 7.2: Create Target Groups

```bash
# Frontend target group
aws elbv2 create-target-group \
  --name tictactoe-frontend-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --region us-east-1

export FRONTEND_TG_ARN=$(aws elbv2 describe-target-groups \
  --names tictactoe-frontend-tg \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Backend target group
aws elbv2 create-target-group \
  --name tictactoe-backend-tg \
  --protocol HTTP \
  --port 7350 \
  --vpc-id $VPC_ID \
  --region us-east-1

export BACKEND_TG_ARN=$(aws elbv2 describe-target-groups \
  --names tictactoe-backend-tg \
  --region us-east-1 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)
```

#### Step 7.3: Register Targets

```bash
# Get EC2 instance ID
export INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=TicTacToe-Backend" \
  --region us-east-1 \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Register with target groups
aws elbv2 register-targets \
  --target-group-arn $FRONTEND_TG_ARN \
  --targets Id=$INSTANCE_ID:80 \
  --region us-east-1

aws elbv2 register-targets \
  --target-group-arn $BACKEND_TG_ARN \
  --targets Id=$INSTANCE_ID:7350 \
  --region us-east-1
```

#### Step 7.4: Create ALB Listeners and Rules

```bash
# Get ALB ARN (if needed again)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN \
  --region us-east-1
```

---

## Post-Deployment Configuration

### Step 1: Configure SSL/TLS Certificate (Recommended)

#### Using AWS Certificate Manager

```bash
# Request a certificate
aws acm request-certificate \
  --domain-name example.com \
  --validation-method DNS \
  --region us-east-1

# Follow verification steps via email or DNS records
# Once verified, update ALB listener to use HTTPS
```

#### Update Listener for HTTPS

```bash
aws elbv2 modify-listener \
  --listener-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --region us-east-1
```

### Step 2: Configure Custom Domain (Optional)

#### Using Route 53

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name example.com \
  --caller-reference $(date +%s) \
  --region us-east-1

# Create alias record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id ZXXXXXXXXX \
  --change-batch file://route53-changes.json
```

Example `route53-changes.json`:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "tictactoe-alb-xxxxx.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
```

### Step 3: Configure Nakama Console Access

Access Nakama admin console:

```
http://BACKEND_IP:7351
```

Or via ALB:
```
http://ALB_DNS:7351
```

Default credentials:
- Username: `admin`
- Password: `password`

**IMPORTANT:** Change the default password immediately!

```bash
# SSH into EC2
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP

# Access Nakama console or use CLI to change password
docker-compose exec nakama \
  /nakama/nakama user update admin \
  --password "NewStrongPassword123!"
```

### Step 4: Enable Automated Backups

```bash
# Enable RDS automated backups
aws rds modify-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --region us-east-1

# Enable Multi-AZ for high availability
aws rds modify-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --multi-az \
  --region us-east-1
```

---

## Monitoring & Maintenance

### CloudWatch Monitoring

#### Step 1: Create CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name tictactoe-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alert-topic \
  --region us-east-1

# Disk usage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name tictactoe-backend-high-disk \
  --alarm-description "Alert when disk usage exceeds 80%" \
  --metric-name DiskUsagePercent \
  --namespace CWAgent \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region us-east-1
```

#### Step 2: Monitor Database Performance

```bash
# Get database metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=tictactoe-nakama-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region us-east-1
```

### Log Management

#### Step 1: Setup CloudWatch Logs

```bash
# Install CloudWatch agent on EC2
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP

# Download and install agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure agent
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/lib/docker/containers/*/*.log",
            "log_group_name": "/aws/ec2/tictactoe-backend",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
  -s
```

### Regular Maintenance Tasks

#### Weekly Tasks

```bash
# Check EC2 instance health
aws ec2 describe-instance-status \
  --instance-ids $INSTANCE_ID \
  --region us-east-1

# Review CloudWatch logs
aws logs tail /aws/ec2/tictactoe-backend --follow

# Check database disk usage
aws rds describe-db-instances \
  --db-instance-identifier tictactoe-nakama-db \
  --region us-east-1 \
  --query 'DBInstances[0].AllocatedStorage'
```

#### Monthly Tasks

```bash
# Review and resize RDS if needed
aws rds modify-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --allocated-storage 50 \
  --apply-immediately \
  --region us-east-1

# Verify backups are running
aws rds describe-db-snapshots \
  --db-instance-identifier tictactoe-nakama-db \
  --region us-east-1

# Update EC2 instance security patches
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP
sudo yum update -y
exit
```

---

## Estimated AWS Costs

| Service | Instance Type | Monthly Cost |
|---------|---------------|--------------|
| **EC2** | t3.medium | ~$30 |
| **RDS** | db.t3.micro | ~$25 |
| **Load Balancer** | Application LB | ~$16 |
| **Data Transfer** | 1GB egress | ~$5 |
| **Total** | | **~$76/month** |

> **Note:** Costs may vary by region. Use AWS Calculator: https://calculator.aws/

### Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads (70% cheaper)
2. **Reserved Instances** for predictable workloads (40% cheaper for 1-year)
3. **Auto-scaling** to scale down during off-peak hours
4. **S3 for backups** instead of RDS automated backups

---

## Troubleshooting AWS Deployment

### Issue: EC2 Instance Won't Connect

**Problem:** Connection timeout when SSH-ing

**Solution:**
```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids $BACKEND_SG_ID \
  --region us-east-1

# Verify instance is running
aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --region us-east-1
```

### Issue: Backend Cannot Connect to Database

**Problem:** "Cannot connect to database" error in logs

**Solution:**
```bash
# SSH into EC2
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP

# Test database connection
psql -h tictactoe-nakama-db.xxxxxxxxxxxx.us-east-1.rds.amazonaws.com \
  -U nakama \
  -d nakama \
  -c "SELECT 1"

# Check Docker logs
docker-compose logs nakama

# Verify database security group allows traffic
aws ec2 describe-security-groups \
  --group-ids $DB_SG_ID \
  --region us-east-1
```

### Issue: Frontend Cannot Connect to Backend

**Problem:** "Cannot reach server" error in game UI

**Solution:**

1. Update frontend environment variables:

```bash
# SSH into EC2
ssh -i tictactoe-key.pem ec2-user@$BACKEND_IP

# Update frontend .env.production
cat > /opt/tictactoe/client/.env.production << EOF
NEXT_PUBLIC_SERVER_API=$BACKEND_IP
NEXT_PUBLIC_SERVER_PORT=7350
NEXT_PUBLIC_USE_SSL=false
EOF

# Rebuild frontend
cd /opt/tictactoe/client
pnpm run build
pm2 restart tictactoe-frontend

exit
```

2. Test connectivity:

```bash
# Test from your local machine
curl http://$BACKEND_IP:7350/
```

### Issue: High Memory or Disk Usage

**Problem:** Services crashing due to resource limits

**Solution:**

1. **Increase EC2 instance size:**

```bash
# Stop instance
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region us-east-1

# Change instance type
aws ec2 modify-instance-attribute \
  --instance-id $INSTANCE_ID \
  --instance-type "{\"Value\": \"t3.large\"}" \
  --region us-east-1

# Start instance
aws ec2 start-instances --instance-ids $INSTANCE_ID --region us-east-1
```

2. **Increase RDS storage:**

```bash
aws rds modify-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --allocated-storage 100 \
  --apply-immediately \
  --region us-east-1
```

---

## Cleanup (Destroy Resources)

⚠️ **WARNING:** This will delete all resources and data!

```bash
# Delete RDS database
aws rds delete-db-instance \
  --db-instance-identifier tictactoe-nakama-db \
  --skip-final-snapshot \
  --region us-east-1

# Terminate EC2 instance
aws ec2 terminate-instances \
  --instance-ids $INSTANCE_ID \
  --region us-east-1

# Delete load balancer
aws elbv2 delete-load-balancer \
  --load-balancer-arn $ALB_ARN \
  --region us-east-1

# Delete VPC (after all resources are deleted)
aws ec2 delete-vpc \
  --vpc-id $VPC_ID \
  --region us-east-1

# Delete key pair
aws ec2 delete-key-pair \
  --key-name tictactoe-key \
  --region us-east-1

# Delete ECR repository
aws ecr delete-repository \
  --repository-name tictactoe-nakama \
  --force \
  --region us-east-1
```

---

## Support & Resources

- **Nakama Docs:** https://heroiclabs.com/docs/
- **AWS Docs:** https://docs.aws.amazon.com/
- **Docker Docs:** https://docs.docker.com/
- **Next.js Docs:** https://nextjs.org/docs

---

## Quick Reference Commands

### Local Development
```bash
# Start everything
cd server && docker-compose up &
cd client && pnpm run dev

# Stop everything
docker-compose down
# Ctrl+C frontend
```

### AWS Deployment
```bash
# Configure AWS
aws configure

# Deploy database
aws rds create-db-instance ...

# Deploy EC2
aws ec2 run-instances ...

# Monitor
aws ec2 describe-instance-status --instance-ids $INSTANCE_ID
aws logs tail /aws/ec2/tictactoe-backend --follow
```

---
