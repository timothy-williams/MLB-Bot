import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Duration} from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { DiscordBotConstruct } from "../constructs/DiscordBotConstruct";
import { discordClientSecretArn } from "../functions/constants/EnvironmentProps";
import * as path from "path";
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class MLBBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Secrets and Encryption Stuff
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    // CMK for encrypting our workflows
    const cmk = new kms.Key(this, "MLBBotCmk", {
      alias: "MLBBotCmk",
      description: "CMK for encrypting MLB Bot workflows.",
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // secrets manager entry for the bot token
    const discordClientSecret = new secretsmanager.Secret(this, "DiscordClientSecret", {
      secretName: "DiscordClientSecret",
      encryptionKey: cmk,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    /*
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    DynamoDB Stuff
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

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
    const stepFunctionLogGroup = new logs.LogGroup(this, 'MLBBotStepFunctionLogGroup', {
      logGroupName: 'MLBBotStepFunctionLogGroup',
      removalPolicy: cdk.RemovalPolicy.RETAIN, // could be noisy in dev
    });

    // lambda is granted permission to the state machine at the bottom of this file
    const mainStateMachine = new stepfunctions.StateMachine(this, 'MLBBotMainStateMachine', {
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
        runtime: Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../functions/BotResponseFunction.ts"), // '../functions/DiscordCommands.ts'
        handler: "handler",
        timeout: Duration.seconds(60),
        environment: {
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
    Permissions
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    */

    commandHistoryTable.grantReadWriteData(discordCommandsLambda);
    mainStateMachine.grantStartExecution(discordCommandsLambda);

  }
}
