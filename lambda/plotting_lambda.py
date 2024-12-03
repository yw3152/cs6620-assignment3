import boto3
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key
import os

# Load environment variables
table_name = os.environ['TABLE_NAME']
bucket_name = os.environ['BUCKET_NAME']

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    end_time = datetime.now()
    start_time = end_time - timedelta(seconds=10)
    end_time_str = str(int(end_time.timestamp()))
    start_time_str = str(int(start_time.timestamp()))

    # Query DynamoDB table for recent data
    try:
        response = table.query(
            KeyConditionExpression=Key('bucket_name').eq(bucket_name) & Key('timestamp').between(start_time_str, end_time_str)
        )
    except Exception as e:
        return {'statusCode': 500, 'body': f"Error querying DynamoDB: {str(e)}"}

    items = response.get('Items', [])
    if not items:
        return {"statusCode": 200, "body": "No data available in the last 10 seconds"}

    # Process data for plotting
    timestamps = [datetime.fromtimestamp(int(item['timestamp'])) for item in items]
    sizes = [item['totalSize'] for item in items]
    max_size = max(sizes) if sizes else 0

    # Create the plot
    plt.figure(figsize=(10, 6))
    plt.plot(timestamps, sizes, marker='o', label='Bucket Size')
    plt.axhline(max_size, color='r', linestyle='--', label=f'Max Size: {max_size} bytes')
    plt.xlabel('Timestamp')
    plt.ylabel('Size (bytes)')
    plt.xticks(rotation=45)
    plt.legend()
    plt.title(f'Size of {bucket_name} Over Time')
    plt.tight_layout()

    # Save plot to the /tmp directory
    temp_file_path = '/tmp/plot.png'
    plt.savefig(temp_file_path, format='png')
    plt.close()  # Close the plot to free up memory

    # Upload plot to S3
    try:
        with open(temp_file_path, 'rb') as f:
            s3_client.put_object(Bucket=bucket_name, Key='plot.png', Body=f, ContentType='image/png')
    except Exception as e:
        return {'statusCode': 500, 'body': f"Error uploading plot to S3: {str(e)}"}
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
    
    return {'statusCode': 200, 'body': 'Plot generated and stored successfully.'}
