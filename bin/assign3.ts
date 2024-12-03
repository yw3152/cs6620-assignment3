#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3Stack } from '../lib/s3-stack';
import { DynamoDBStack } from '../lib/db-stack';
import { SizeLambdaStack } from '../lib/size-lambda-stack';
import { PlotLambdaStack } from '../lib/plot-lambda-stack';
import { DriverLambdaStack } from '../lib/driver-lambda-stack';

const app = new cdk.App();
const s3Stack = new S3Stack(app, 's3-stack', {});
const dbStack = new DynamoDBStack(app, 'db-stack', {});
new SizeLambdaStack(app, 'size-lambda-stack', {
  bucket: s3Stack.bucket,
  table: dbStack.table,
});
const plotStack = new PlotLambdaStack(app, 'plot-lambda-stack', {
  bucket: s3Stack.bucket,
  table: dbStack.table,
});
new DriverLambdaStack(app, 'driver-lambda-stack', {
  bucket: s3Stack.bucket,
  table: dbStack.table,
  apiUrl: plotStack.apiUrl,
});