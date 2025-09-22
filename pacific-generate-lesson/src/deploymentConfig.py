#!/usr/bin/env python3
"""
AWS Deployment Configuration for PACIFIC Backend
Save as: deploymentConfig.py
"""

import json

# Lambda Function Configuration
LAMBDA_CONFIG = {
    "FunctionName": "pacific-generate-lesson",
    "Runtime": "python3.12",
    "Role": "arn:aws:iam::YOUR_ACCOUNT_ID:role/pacific-lambda-role",
    "Handler": "coreStructure.lambda_handler",
    "Code": {
        "ZipFile": "# Code will be uploaded as ZIP"
    },
    "Description": "PACIFIC AI Language Learning - Lesson Generator",
    "Timeout": 120,  # 2 minutes for AI processing
    "MemorySize": 1024,  # 1GB RAM for AI calls
    "Environment": {
        "Variables": {
            "DYNAMODB_TABLE": "pacific-lessons",
            "AWS_REGION_DYNAMODB": "ap-southeast-5",  # Malaysia for DynamoDB
            "AWS_REGION_BEDROCK": "us-east-1",    # US Virginia for Bedrock
            "NOVA_PRO_MODEL": "amazon.nova-pro-v1:0",
            "NOVA_LITE_MODEL": "amazon.nova-lite-v1:0"
        }
    },
    "Tags": {
        "Project": "PACIFIC",
        "Environment": "hackathon",
        "CostCenter": "language-learning"
    }
}

# DynamoDB Table Configuration
DYNAMODB_CONFIG = {
    "TableName": "pacific-lessons",
    "KeySchema": [
        {
            "AttributeName": "lessonHash",
            "KeyType": "HASH"  # Partition key
        }
    ],
    "AttributeDefinitions": [
        {
            "AttributeName": "lessonHash",
            "AttributeType": "S"  # String
        }
    ],
    "BillingMode": "PAY_PER_REQUEST",  # No provisioned capacity needed
    "TimeToLiveSpecification": {
        "AttributeName": "ttl",
        "Enabled": True  # Auto-delete old lessons
    },
    "Tags": [
        {"Key": "Project", "Value": "PACIFIC"},
        {"Key": "Environment", "Value": "hackathon"}
    ]
}

# API Gateway Configuration
API_GATEWAY_CONFIG = {
    "Name": "pacific-api",
    "Description": "PACIFIC Language Learning API",
    "EndpointConfiguration": {
        "Types": ["REGIONAL"]
    },
    "Resources": {
        "/lesson": {
            "Methods": {
                "POST": {
                    "Integration": {
                        "Type": "AWS_PROXY",
                        "IntegrationHttpMethod": "POST",
                        "Uri": "arn:aws:apigateway:ap-southeast-1:lambda:path/2015-03-31/functions/LAMBDA_ARN/invocations"
                    }
                },
                "OPTIONS": {
                    "Integration": {
                        "Type": "MOCK",
                        "IntegrationResponses": {
                            "200": {
                                "ResponseParameters": {
                                    "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                                    "method.response.header.Access-Control-Allow-Methods": "'GET,POST,OPTIONS'",
                                    "method.response.header.Access-Control-Allow-Origin": "'*'"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

# IAM Role Policy
IAM_POLICY = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:ap-southeast-1:*:*"
        },
        {
            "Effect": "Allow", 
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:DescribeTable"
            ],
            "Resource": "arn:aws:dynamodb:ap-southeast-1:*:table/pacific-lessons"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:ap-southeast-1::foundation-model/amazon.nova-pro-v1:0",
                "arn:aws:bedrock:ap-southeast-1::foundation-model/amazon.nova-lite-v1:0"
            ]
        }
    ]
}

# Deployment Steps
DEPLOYMENT_STEPS = [
    {
        "step": 1,
        "title": "Install Dependencies",
        "commands": [
            "pip install boto3 -t ./package",
            "cp *.py ./package/",
            "cd package && zip -r ../pacific-backend.zip ."
        ]
    },
    {
        "step": 2,
        "title": "Create DynamoDB Table",
        "aws_cli": "aws dynamodb create-table --cli-input-json file://dynamodb-config.json --region ap-southeast-5"
    },
    {
        "step": 3,
        "title": "Create IAM Role",
        "aws_cli": "aws iam create-role --role-name pacific-lambda-role --assume-role-policy-document file://trust-policy.json"
    },
    {
        "step": 4,
        "title": "Attach IAM Policy", 
        "aws_cli": "aws iam put-role-policy --role-name pacific-lambda-role --policy-name pacific-policy --policy-document file://iam-policy.json"
    },
    {
        "step": 5,
        "title": "Create Lambda Function",
        "aws_cli": "aws lambda create-function --function-name pacific-generate-lesson --runtime python3.12 --role ROLE_ARN --handler coreStructure.lambda_handler --zip-file fileb://pacific-backend.zip --region ap-southeast-5"
    },
    {
        "step": 6,
        "title": "Create API Gateway",
        "note": "Use AWS Console or AWS CLI to create REST API with Lambda integration"
    }
]

# Cost Estimation
COST_BREAKDOWN = {
    "Lambda": {
        "Requests": "2M requests/month = $0.40",
        "Compute": "1GB-s * 2s avg * 2M = $33.33", 
        "Total": "$33.73/month"
    },
    "DynamoDB": {
        "Requests": "4M read/write units = $1.00",
        "Storage": "1GB storage = $0.25",
        "Total": "$1.25/month"
    },
    "Bedrock": {
        "Nova_Pro": "1M tokens input + 200K output = $2.40", 
        "Nova_Lite": "500K tokens = $0.10",
        "Total": "$2.50/month"
    },
    "API_Gateway": {
        "Requests": "2M API calls = $7.00",
        "Total": "$7.00/month"
    },
    "Monthly_Total": "$44.48 (well within $100 credit)"
}

def save_config_files():
    """Save all configuration files for deployment"""
    
    # Save DynamoDB config
    with open('dynamodb-config.json', 'w') as f:
        json.dump(DYNAMODB_CONFIG, f, indent=2)
    
    # Save IAM policy
    with open('iam-policy.json', 'w') as f:
        json.dump(IAM_POLICY, f, indent=2)
    
    # Save trust policy for Lambda role
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    with open('trust-policy.json', 'w') as f:
        json.dump(trust_policy, f, indent=2)
    
    # Save deployment guide
    with open('deployment-guide.md', 'w') as f:
        f.write("# PACIFIC Backend Deployment Guide\n\n")
        for step in DEPLOYMENT_STEPS:
            f.write(f"## Step {step['step']}: {step['title']}\n")
            if 'commands' in step:
                f.write("```bash\n")
                for cmd in step['commands']:
                    f.write(f"{cmd}\n")
                f.write("```\n\n")
            if 'aws_cli' in step:
                f.write(f"```bash\n{step['aws_cli']}\n```\n\n")
            if 'note' in step:
                f.write(f"**Note:** {step['note']}\n\n")
    
    # Save cost breakdown
    with open('cost-estimate.json', 'w') as f:
        json.dump(COST_BREAKDOWN, f, indent=2)
    
    print("✅ Configuration files saved:")
    print("- dynamodb-config.json")
    print("- iam-policy.json") 
    print("- trust-policy.json")
    print("- deployment-guide.md")
    print("- cost-estimate.json")

if __name__ == "__main__":
    save_config_files()