# RabitChat AWS Deployment Guide

This guide walks you through deploying RabitChat to AWS for production use with 50,000+ concurrent users.

## Prerequisites

- AWS Account with billing enabled
- AWS CLI installed and configured
- Docker installed locally
- Domain name (recommended)

## Architecture Overview

```
                    ┌─────────────────┐
                    │   CloudFront    │
                    │     (CDN)       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Application    │
                    │  Load Balancer  │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │   ECS   │        │   ECS   │        │   ECS   │
    │ Task 1  │        │ Task 2  │        │ Task 3  │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
        ┌─────▼─────┐               ┌──────▼──────┐
        │   RDS     │               │ ElastiCache │
        │PostgreSQL │               │   Redis     │
        └───────────┘               └─────────────┘
```

## Step 1: Set Up AWS Infrastructure

### 1.1 Create VPC and Subnets

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=rabitchat-vpc}]'

# Note the VPC ID from output, then create subnets
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

### 1.2 Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
  --db-instance-identifier rabitchat-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15 \
  --master-username rabitchat_admin \
  --master-user-password <your-secure-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids <security-group-id> \
  --db-subnet-group-name <subnet-group-name> \
  --multi-az \
  --backup-retention-period 7
```

**Recommended Settings:**
- Instance: db.t3.medium (2 vCPU, 4GB RAM) - start here, scale up as needed
- Storage: 100GB gp3 with auto-scaling
- Multi-AZ: Yes (for production)
- Backup: 7 days retention

### 1.3 Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id rabitchat-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name <subnet-group-name> \
  --security-group-ids <security-group-id>
```

### 1.4 Create ECR Repository

```bash
aws ecr create-repository --repository-name rabitchat
```

## Step 2: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t rabitchat .

# Tag image
docker tag rabitchat:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/rabitchat:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/rabitchat:latest
```

## Step 3: Set Up Secrets Manager

Store all sensitive environment variables:

```bash
aws secretsmanager create-secret \
  --name rabitchat/production \
  --secret-string '{
    "DATABASE_URL": "postgresql://user:pass@rds-endpoint:5432/rabitchat",
    "SESSION_SECRET": "your-secure-session-secret",
    "CLOUDINARY_CLOUD_NAME": "your-cloud-name",
    "CLOUDINARY_API_KEY": "your-api-key",
    "CLOUDINARY_API_SECRET": "your-api-secret",
    "TWILIO_ACCOUNT_SID": "your-twilio-sid",
    "TWILIO_AUTH_TOKEN": "your-twilio-token",
    "TWILIO_PHONE_NUMBER": "your-twilio-number",
    "PAYFAST_MERCHANT_ID": "your-merchant-id",
    "PAYFAST_MERCHANT_KEY": "your-merchant-key",
    "PAYFAST_PASSPHRASE": "your-passphrase",
    "RESEND_API_KEY": "your-resend-key",
    "OPENAI_API_KEY": "your-openai-key",
    "GEMINI_API_KEY": "your-gemini-key"
  }'
```

## Step 4: Create ECS Cluster and Service

### 4.1 Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name rabitchat-cluster --capacity-providers FARGATE
```

### 4.2 Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "rabitchat",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "rabitchat",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/rabitchat:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:rabitchat/production:DATABASE_URL::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/rabitchat",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 4.3 Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name rabitchat-alb \
  --subnets <subnet-1> <subnet-2> \
  --security-groups <security-group-id> \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name rabitchat-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id <vpc-id> \
  --target-type ip \
  --health-check-path /health
```

### 4.4 Create ECS Service with Auto Scaling

```bash
aws ecs create-service \
  --cluster rabitchat-cluster \
  --service-name rabitchat-service \
  --task-definition rabitchat \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<subnet-1>,<subnet-2>],securityGroups=[<security-group-id>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=rabitchat,containerPort=5000"
```

## Step 5: Set Up Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/rabitchat-cluster/rabitchat-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 20

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/rabitchat-cluster/rabitchat-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name rabitchat-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 120
  }'
```

## Step 6: Set Up CloudFront CDN

1. Create CloudFront distribution pointing to your ALB
2. Configure SSL certificate via ACM
3. Set up custom domain

## Step 7: Database Migration

After infrastructure is ready, migrate your data:

```bash
# Export from Replit/Neon
pg_dump $DATABASE_URL > rabitchat_backup.sql

# Import to AWS RDS
psql -h <rds-endpoint> -U rabitchat_admin -d rabitchat < rabitchat_backup.sql
```

## Estimated Costs (Monthly)

| Service | Size | Est. Cost |
|---------|------|-----------|
| ECS Fargate (3 tasks) | 1 vCPU, 2GB each | $100 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | $150 |
| ElastiCache Redis | cache.t3.medium | $50 |
| Application Load Balancer | Standard | $20 |
| CloudFront | 1TB transfer | $85 |
| Secrets Manager | 10 secrets | $5 |
| CloudWatch Logs | 50GB | $25 |
| **Total** | | **~$435/month** |

*Costs scale with usage. 50k users may require larger instances.*

## Monitoring & Alerts

### CloudWatch Alarms

Set up alarms for:
- CPU utilization > 80%
- Memory utilization > 80%
- RDS connections > 80%
- Error rate > 1%
- Response time > 2s

### Logging

All logs go to CloudWatch Logs:
- `/ecs/rabitchat` - Application logs
- `/aws/rds/instance/rabitchat-db/postgresql` - Database logs

## Security Checklist

- [ ] VPC with private subnets for RDS/ElastiCache
- [ ] Security groups properly configured
- [ ] SSL/TLS enabled on ALB
- [ ] Secrets in AWS Secrets Manager
- [ ] IAM roles with least privilege
- [ ] RDS encryption at rest enabled
- [ ] CloudTrail enabled for audit logs

## Rollback Procedure

1. Keep previous Docker image tags in ECR
2. Update task definition to previous image
3. Force new deployment: `aws ecs update-service --cluster rabitchat-cluster --service rabitchat-service --force-new-deployment`

## Support

For issues with AWS deployment, contact:
- AWS Support (if you have a support plan)
- DevOps engineer familiar with ECS/Fargate
