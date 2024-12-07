import json
import boto3

s3_client = boto3.client('s3')
bucket_name = 'TestBucket'

def get_object_size(object_key):
    response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
    return response['ContentLength']

def handler(event, context):
    print("SizeTracking Lambda triggered.")
    
    for record in event['Records']:
        sns_message = json.loads(record['body'])
        object_key = sns_message['Records'][0]['s3']['object']['key']
        event_name = sns_message['Records'][0]['eventName']
        object_size = get_object_size(object_key)
        size_delta = object_size if event_name == 'ObjectCreated' else -object_size
        
        print(f"Event: {event_name}, Object: {object_key}, Size Delta: {size_delta} bytes")
        
    return {
        'statusCode': 200,
        'body': json.dumps('SizeTracking Lambda processed messages successfully.')
    }
