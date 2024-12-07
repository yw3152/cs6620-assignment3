import json
import boto3
import random
import string
import time

s3_client = boto3.client('s3')
bucket_name = 'TestBucket'

def generate_random_string(size: int) -> str:
    return ''.join(random.choices(string.ascii_letters + string.digits, k=size))

def create_object():
    object_name = generate_random_string(10) + ".txt"
    content = generate_random_string(random.randint(1, 100))
    s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=content)
    print(f"Created object: {object_name} with size {len(content)} bytes")
    return object_name, len(content)

def handler(event, context):
    print("Driver Lambda triggered.")
    object1_name, object1_size = create_object()
    object2_name, object2_size = create_object()
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'objects': [
                {'name': object1_name, 'size': object1_size},
                {'name': object2_name, 'size': object2_size}
            ]
        })
    }
