import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { DiscordBotConstruct } from "../constructs/DiscordBotConstruct";
import * as path from "path";
import { discordBotSecretArn } from "../functions/constants/EnvironmentProps";
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class GameServerBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Secrets and Encryption Stuff
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    // CMK for encrypting our workflows
    const cmk = new kms.Key(this, "GameServerBotCmk", {
      alias: "GameServerBotCmk",
      description: "CMK for encrypting Game Server Bot workflows.",
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // secrets manager entry for the bot token
    const discordBotSecret = new secretsmanager.Secret(this, "DiscordBotSecret", {
      secretName: "DiscordBotSecret",
      encryptionKey: cmk,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    DynamoDB Stuff
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    // DynamoDB table to track discord server game settings.
    const gameServerSubscriberTable = new dynamodb.Table(this, "GameServerSubscriberTable", {
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "guildId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const commandHistoryTable = new dynamodb.Table(this, "CommandHistoryTable", {
      partitionKey: {
        name: "guildId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp", // not sure this makes sense as a sort key
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Step Functions
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    const startState = new stepfunctions.Pass(this, 'PassState', {
      result: { value: 'StepFunction pass message' },
    });

    const stepFunctionDefinition = startState;

    // log group for the step function
    const stepFunctionLogGroup = new logs.LogGroup(this, 'GsbStepFunctionLogGroup', {
      logGroupName: 'GsbStepFunctionLogGroup',
      removalPolicy: cdk.RemovalPolicy.RETAIN, // could be noisy in dev
    });

    // lambda is granted permission to the state machine at the bottom of this file
    const mainStateMachine = new stepfunctions.StateMachine(this, 'GsbMainStateMachine', {
        definition: stepFunctionDefinition,
        stateMachineType: stepfunctions.StateMachineType.STANDARD,
        // enable logging
        logs: {
          destination: stepFunctionLogGroup,
          level: stepfunctions.LogLevel.ERROR,
        },

    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Lambda Functions
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    const discordCommandsLambda = new NodejsFunction(
      this,
      "discord-commands-lambda",
      {
        runtime: Runtime.NODEJS_14_X,
        entry: path.join(__dirname, "../functions/BotResponseFunction.ts"), // '../functions/DiscordCommands.ts'
        handler: "handler",
        timeout: Duration.seconds(60),
        environment: {
          GameServerSubscriberTableName: gameServerSubscriberTable.tableName,
          CommandHistoryTableName: commandHistoryTable.tableName,
          MainStateMachineArn: mainStateMachine.stateMachineArn,
        },
      }
    );

    new DiscordBotConstruct(this, "discord-bot-endpoint", {
      commandsLambdaFunction: discordCommandsLambda,
    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    SSM
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    // Set up SSM Parameter store to hold container image information.
    const FactorioContainerParam = new ssm.StringParameter(this, "FactorioContainerImage", {
      parameterName: "/GameServerBot/FactorioContainerImage",
      stringValue: "factoriotools/factorio:stable",
    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Permissions
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    commandHistoryTable.grantReadWriteData(discordCommandsLambda);
    gameServerSubscriberTable.grantReadWriteData(discordCommandsLambda);
    mainStateMachine.grantStartExecution(discordCommandsLambda);

  }
}
