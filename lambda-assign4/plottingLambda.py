import json
import boto3
import matplotlib.pyplot as plt
import os

# Initialize S3 client
s3_client = boto3.client('s3')
bucket_name = 'TestBucket'

def handler(event, context):

    object_names = []
    object_sizes = []
    
    plt.bar(object_names, object_sizes)
    plt.xlabel('Object Names')
    plt.ylabel('Object Size (bytes)')
    plt.title('Object Size Distribution')

    plot_path = '/tmp/object_sizes.png'
    plt.savefig(plot_path)
    
    plot_key = 'plots/object_sizes.png'
    s3_client.upload_file(plot_path, bucket_name, plot_key)
    
    plot_url = f"https://{bucket_name}.s3.amazonaws.com/{plot_key}"
    
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Plot generated successfully', 'plot_url': plot_url})
    }
