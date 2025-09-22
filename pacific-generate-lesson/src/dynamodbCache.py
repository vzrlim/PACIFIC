import boto3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

logger = logging.getLogger()

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name='ap-southeast-5')
LESSONS_TABLE = dynamodb.Table('pacific-lessons')

def get_cached_lesson(lesson_hash: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a cached lesson from DynamoDB
    Returns lesson data if found and not expired, None otherwise
    """
    try:
        logger.info(f"Checking cache for lesson hash: {lesson_hash}")
        
        response = LESSONS_TABLE.get_item(
            Key={'lessonHash': lesson_hash}
        )
        
        if 'Item' not in response:
            logger.info("No cached lesson found")
            return None
        
        item = response['Item']
        logger.info("Cached lesson found, checking expiry")
        
        # Check if lesson has expired (24 hours cache)
        created_timestamp = item.get('createdAt')
        if created_timestamp:
            created_time = datetime.fromisoformat(created_timestamp)
            if datetime.utcnow() - created_time > timedelta(hours=24):
                logger.info("Cached lesson expired, will generate new one")
                return None
        
        # Return the lesson content
        lesson_data = {
            'lessonContent': item.get('lessonContent'),
            'metadata': {
                'cached': True,
                'createdAt': created_timestamp,
                'userProfile': item.get('userProfile'),
                'lessonRequest': item.get('lessonRequest')
            }
        }
        
        logger.info("Returning valid cached lesson")
        return lesson_data
        
    except ClientError as e:
        logger.error(f"DynamoDB error retrieving lesson: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error retrieving cached lesson: {e}")
        return None

def cache_lesson(lesson_hash: str, lesson_data: Dict[str, Any], user_profile: Dict[str, Any], lesson_request: Dict[str, Any]) -> bool:
    """
    Store a generated lesson in DynamoDB cache
    Returns True if successful, False otherwise
    """
    try:
        logger.info(f"Caching lesson with hash: {lesson_hash}")
        
        # Prepare item for storage
        cache_item = {
            'lessonHash': lesson_hash,
            'lessonContent': lesson_data,
            'userProfile': user_profile,
            'lessonRequest': lesson_request,
            'createdAt': datetime.utcnow().isoformat(),
            'ttl': int((datetime.utcnow() + timedelta(days=7)).timestamp())  # Auto-delete after 7 days
        }
        
        # Store in DynamoDB
        LESSONS_TABLE.put_item(Item=cache_item)
        
        logger.info("Lesson successfully cached")
        return True
        
    except ClientError as e:
        logger.error(f"DynamoDB error caching lesson: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error caching lesson: {e}")
        return False

def get_cache_stats() -> Dict[str, Any]:
    """
    Get statistics about the cache usage
    Useful for monitoring and cost optimization
    """
    try:
        # Get approximate item count
        response = LESSONS_TABLE.describe_table()
        item_count = response['Table']['ItemCount']
        
        # Get table size
        table_size = response['Table']['TableSizeBytes']
        
        return {
            'totalCachedLessons': item_count,
            'cacheSizeBytes': table_size,
            'tableName': LESSONS_TABLE.table_name,
            'region': 'ap-southeast-1'
        }
        
    except ClientError as e:
        logger.error(f"Error getting cache stats: {e}")
        return {'error': str(e)}

def clear_expired_lessons() -> int:
    """
    Manually clear expired lessons from cache
    DynamoDB TTL should handle this automatically, but this provides manual cleanup
    Returns number of items deleted
    """
    try:
        deleted_count = 0
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        # Scan for expired items
        response = LESSONS_TABLE.scan(
            FilterExpression='createdAt < :cutoff',
            ExpressionAttributeValues={
                ':cutoff': cutoff_time.isoformat()
            }
        )
        
        # Delete expired items
        with LESSONS_TABLE.batch_writer() as batch:
            for item in response['Items']:
                batch.delete_item(
                    Key={'lessonHash': item['lessonHash']}
                )
                deleted_count += 1
        
        logger.info(f"Deleted {deleted_count} expired lessons from cache")
        return deleted_count
        
    except ClientError as e:
        logger.error(f"Error clearing expired lessons: {e}")
        return 0