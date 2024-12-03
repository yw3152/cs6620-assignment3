import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3Notifications from "aws-cdk-lib/aws-s3-notifications";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export interface SizeLambdaStackProps extends cdk.StackProps {
  bucket: s3.Bucket;
  table: dynamodb.Table;
}

export class SizeLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SizeLambdaStackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, "ImportedBucket", props.bucket.bucketName);

    const sizeTracking = new lambda.Function(this, "SizeTracking", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "sizetracking_lambda.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: props.table.tableName,
      },
    });

    bucket.grantRead(sizeTracking);
    props.table.grantWriteData(sizeTracking);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notifications.LambdaDestination(sizeTracking)
    );
    bucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3Notifications.LambdaDestination(sizeTracking)
    );
  }
}
