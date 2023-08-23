#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MLBBotStack } from '../lib/mlb-bot-stack';

const app = new cdk.App();

new MLBBotStack(app, 'MLBBotStack', {});