import json
import boto3
import time

logs_client = boto3.client('logs')
log_group_name = '/aws/lambda/LoggingLambda'

def log_event(message):
    timestamp = int(time.time() * 1000)
    logs_client.put_log_events(
        logGroupName=log_group_name,
        logStreamName="StreamEvent", 
        logEvents=[{
            'timestamp': timestamp,
            'message': message
        }]
    )

def handler(event, context):
    print("Logging Lambda triggered.")
    
    for record in event['Records']:
        sns_message = json.loads(record['body'])
        event_name = sns_message['Records'][0]['eventName']
        object_key = sns_message['Records'][0]['s3']['object']['key']
        size = sns_message['Records'][0]['s3']['object']['size']
        
        size_delta = size if event_name == 'ObjectCreated' else -size
        log_message = json.dumps({
            'object_name': object_key,
            'size_delta': size_delta
        })
        
        log_event(log_message)
        
    return {
        'statusCode': 200,
        'body': json.dumps('Logging Lambda processed messages successfully.')
    }
