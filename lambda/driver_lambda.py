import boto3
import time
import requests
import os

bucket_name = os.environ['BUCKET_NAME']
plotting_lambda_api_url = os.environ['PLOTTING_API_URL']
s3_client = boto3.client('s3')


def lambda_handler(event, context):
    s3_client.put_object(Bucket=bucket_name, Key='assignment1.txt', Body='Empty Assignment 1')
    print("Created assignment1.txt with content 'Empty Assignment 1'")
    time.sleep(2)

    s3_client.put_object(Bucket=bucket_name, Key='assignment1.txt', Body='Empty Assignment 2222222222')
    print("Updated assignment1.txt with content 'Empty Assignment 2222222222'")
    time.sleep(2)

    s3_client.delete_object(Bucket=bucket_name, Key='assignment1.txt')
    print("Deleted assignment1.txt")
    time.sleep(2)

    s3_client.put_object(Bucket=bucket_name, Key='assignment2.txt', Body='33')
    print("Created assignment2.txt with content '33'")
    time.sleep(2)

    try:
        response = requests.post(plotting_lambda_api_url)
        response.raise_for_status()  # Raise an error if the call was unsuccessful
        print("Plotting Lambda API called successfully.")
    except requests.RequestException as e:
        print(f"Error calling Plotting Lambda API: {e}")

    return {
        'statusCode': 200,
        'body': 'Driver Lambda executed successfully and plot requested.'
    }