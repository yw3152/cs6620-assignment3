import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3_notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';

export class BackupSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const storageBucket = new s3.Bucket(this, 'StorageBucket');
    const eventTopic = new sns.Topic(this, 'S3EventDistributionTopic');

    const trackingQueue = new sqs.Queue(this, 'TrackingQueue');
    const logQueue = new sqs.Queue(this, 'LogQueue');

    eventTopic.addSubscription(new sns_subscriptions.SqsSubscription(trackingQueue));
    eventTopic.addSubscription(new sns_subscriptions.SqsSubscription(logQueue));

    storageBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3_notifications.SnsDestination(eventTopic));
    storageBucket.addEventNotification(s3.EventType.OBJECT_REMOVED_DELETE, new s3_notifications.SnsDestination(eventTopic));

    const trackingFunction = new lambda.Function(this, 'TrackingFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/tracker'),
      handler: 'index.handler',
      environment: {
        SQS_URL: trackingQueue.queueUrl,
        BUCKET: storageBucket.bucketName,
      },
    });
    trackingQueue.grantConsumeMessages(trackingFunction);

    const loggingFunction = new lambda.Function(this, 'LogFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/logger'),
      handler: 'index.handler',
      environment: {
        LOG_QUEUE_URL: logQueue.queueUrl,
      },
    });
    logQueue.grantConsumeMessages(loggingFunction);

    const logGroup = new logs.LogGroup(this, 'LoggerGroup', {
      logGroupName: `/aws/lambda/${loggingFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    logGroup.addMetricFilter('SizeDeltaMetric', {
      filterPattern: logs.FilterPattern.exists('$.size_delta'),
      metricNamespace: 'BackupSystemApp',
      metricName: 'TotalSize',
      metricValue: '$.size_delta',
    });

    const sizeMetric = new cloudwatch.Metric({
      namespace: 'BackupSystemApp',
      metricName: 'TotalSize',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const sizeAlarm = new cloudwatch.Alarm(this, 'SizeAlarm', {
      metric: sizeMetric,
      threshold: 20,
      evaluationPeriods: 1,
    });

    const cleanupFunction = new lambda.Function(this, 'CleanerFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/cleaner'),
      handler: 'index.handler',
      environment: {
        SRC_BUCKET: storageBucket.bucketName,
      },
    });

    sizeAlarm.addAlarmAction(new actions.LambdaFunction(cleanupFunction));
  }
}
