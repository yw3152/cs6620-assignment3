import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';


export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "TestBucket", {
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }
}
