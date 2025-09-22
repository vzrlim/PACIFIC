import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-5')

def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(v) for v in obj]
    return obj

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
    
    try:
        if event.get('httpMethod') == 'OPTIONS':
            return {'statusCode': 200, 'headers': headers, 'body': '{}'}
        
        user_id = event.get('headers', {}).get('user-id', 'default-user')
        table = dynamodb.Table('pacific-user-profiles')
        
        if event.get('httpMethod') == 'GET':
            response = table.get_item(Key={'userId': user_id})
            if 'Item' in response:
                profile = decimal_to_float(response['Item'])
                profile.pop('userId', None)
                return {'statusCode': 200, 'headers': headers, 'body': json.dumps(profile)}
            else:
                return {'statusCode': 404, 'headers': headers, 'body': json.dumps({'error': 'Profile not found'})}
        
        elif event.get('httpMethod') == 'POST':
            body = json.loads(event.get('body', '{}'))
            profile = {
                'userId': user_id,
                'nationality': body.get('nationality', ''),
                'nativeLanguages': body.get('nativeLanguages', []),
                'additionalLanguages': body.get('additionalLanguages', []),
                'proficiencyLevels': body.get('proficiencyLevels', {}),
                'learningHistory': body.get('learningHistory', []),
                'progressData': body.get('progressData', {
                    'vocabulary': 0, 'grammar': 0, 'listening': 0,
                    'speaking': 0, 'reading': 0, 'writing': 0
                }),
                'createdAt': datetime.utcnow().isoformat(),
                'lastActivity': datetime.utcnow().isoformat(),
                'updatedAt': datetime.utcnow().isoformat()
            }
            table.put_item(Item=profile)
            profile.pop('userId', None)
            return {'statusCode': 201, 'headers': headers, 'body': json.dumps(decimal_to_float(profile))}
            
    except Exception as e:
        return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}