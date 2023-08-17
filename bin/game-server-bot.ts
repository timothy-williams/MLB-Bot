#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GameServerBotStack } from '../lib/game-server-bot-stack';
import { ImageBuilderStack } from '../lib/image-builder/image-builder-stack';

const app = new cdk.App();

new ImageBuilderStack(app, 'ImageBuilderStack', {
    env: {
        region: 'us-east-1',
        account: '560619290409'
    },
});

new GameServerBotStack(app, 'GameServerBotStack', {
});
