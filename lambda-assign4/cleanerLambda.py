import json
import boto3

s3_client = boto3.client('s3')
bucket_name = 'TestBucket'

def get_largest_object():
    response = s3_client.list_objects_v2(Bucket=bucket_name)
    objects = response.get('Contents', [])
    largest_object = max(objects, key=lambda obj: obj['Size'])
    return largest_object['Key']

def delete_object(object_key):
    s3_client.delete_object(Bucket=bucket_name, Key=object_key)
    print(f"Deleted object: {object_key}")

def handler(event, context):
    largest_object_key = get_largest_object()
    delete_object(largest_object_key)
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Deleted object: {largest_object_key}')
    }
