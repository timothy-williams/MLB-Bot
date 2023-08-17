/**
 * The name of the secret key to retrieve.
 */
export const discordBotAPIKeyName = process.env['DISCORD_BOT_API_KEY_NAME'] ?? 'apiKeyName';
/**
 * The ARN for the Discord command lambda.
 */
export const commandLambdaARN = process.env['COMMAND_LAMBDA_ARN'] ?? 'commandLambdaARN';
/**
 * The name of the secret for the MLB discord bot.
 */
export const discordClientSecretArn = process.env['DISCORD_CLIENT_SECRET_ARN'] ?? 'arn:aws:secretsmanager:us-east-1:247158676068:secret:discord-client-1cMbq7';