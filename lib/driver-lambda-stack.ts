import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";


export interface DriverLambdaStackProps extends cdk.StackProps {
  bucket: s3.Bucket;
  table: dynamodb.Table;
  apiUrl: string;
}

export class DriverLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DriverLambdaStackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, "ImportedBucket", props.bucket.bucketName);

    const driverLambda = new lambda.Function(this, 'Driver', {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'driver_lambda.lambda_handler',
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: props.table.tableName,
        PLOTTING_API_URL: props.apiUrl,
      },
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'MyLayer',
          'arn:aws:lambda:us-west-1:770693421928:layer:Klayers-p311-requests:12' 
        )
      ]
    });
    bucket.grantReadWrite(driverLambda);
    props.table.grantReadWriteData(driverLambda);
  }
}
