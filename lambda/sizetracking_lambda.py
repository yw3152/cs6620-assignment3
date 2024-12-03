import json
import boto3
from datetime import datetime
import os

bucket_name = os.environ['BUCKET_NAME']
table_name = os.environ['TABLE_NAME']

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    total_size = 0
    object_count = 0

    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name)
        if 'Contents' in response:
            for obj in response['Contents']:
                total_size += obj['Size']
                object_count += 1
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error accessing S3 bucket: {str(e)}")
        }

    timestamp = str(int(datetime.utcnow().timestamp()))

    try:
        table.put_item(
            Item={
                'bucket_name': bucket_name,
                'timestamp': timestamp,
                'totalSize': total_size,
                'objectCount': object_count
            }
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error storing data in DynamoDB: {str(e)}")
        }

    return {
        'statusCode': 200,
        'body': json.dumps('Successfully tracked bucket size.')
    }
