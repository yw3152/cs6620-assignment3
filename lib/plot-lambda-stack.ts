import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";


export interface PlotLambdaStackProps extends cdk.StackProps {
    bucket: s3.Bucket;
    table: dynamodb.Table;
  }

export class PlotLambdaStack extends cdk.Stack {
  public readonly apiUrl: string;
  constructor(scope: Construct, id: string, props: PlotLambdaStackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, "ImportedBucket", props.bucket.bucketName);

    const plot = new lambda.Function(this, 'Plotting', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'plotting_lambda.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        TABLE_NAME: props.table.tableName,
      },
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'MyLayer',
          'arn:aws:lambda:us-west-1:770693421928:layer:Klayers-p311-matplotlib:11' 
        )
      ]
    });

    bucket.grantReadWrite(plot);
    props.table.grantReadWriteData(plot);

    const api = new apigateway.LambdaRestApi(this, 'PlotApi', {
        handler: plot,
      });
    this.apiUrl = api.url;
  }
}
