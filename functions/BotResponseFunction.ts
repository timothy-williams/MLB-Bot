import { Context, Callback } from "aws-lambda";
import { getDiscordSecrets } from "./utils/DiscordSecrets";
import { sendFollowupMessage, editFollowupMessage } from "./utils/EndpointInteractions";
import {
  IDiscordEventRequest,
  IDiscordCommandStructure
} from "../lib/types/discord";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { todays_scores } from './commands/todays_scores';

//const AWS = require("aws-sdk");
const commandHistoryTableName = process.env.CommandHistoryTableName;
const region = process.env.AWS_REGION;
const ddbClient = new DynamoDBClient({ region: region });

const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  removeUndefinedValues: true, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: false, // false, by default.
};

const unmarshallOptions = {
  // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
  wrapNumbers: false, // false, by default.
};

// Create the DynamoDB document client.
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions,
  unmarshallOptions,
});

export async function handler(
  event: IDiscordEventRequest,
  context: Context,
  callback: Callback
): Promise<string> {
  const discordSecret = await getDiscordSecrets();
  console.log(`DEBUG DISCORD EVENT:\n${JSON.stringify(event)}`);
  const endpointInfo = {
    authToken: discordSecret?.token,
    applicationId: discordSecret?.application_id,
    guildId: undefined
  };
  console.log(`Endpoint info:\n${JSON.stringify(endpointInfo)}`)

  const commandStructure: IDiscordCommandStructure = {
    timestamp: Date.now(),
    userId: event.jsonBody.member?.user.id,
    commandName: event.jsonBody.data?.name,
    commandValue: event.jsonBody.data?.options?.[0]?.value,
    guildId: event.jsonBody.guild_id
  };

  /*
  const commandValue = event.jsonBody.data?.options?.[0]?.value;
  const userIdOfCommandUsed = event.jsonBody.member?.user.id;

  
  const smeez_user_id = "176503559121141760";
  console.log(`Command Structure:\n${JSON.stringify(commandStructure)}`);
  var admin_status = false;
  if (commandStructure.userId === smeez_user_id) {
    admin_status = true;
  }

  const userNameOfCommandUsed = event.jsonBody.member?.user.username;
  const guildIdOfCommandUsed = event.jsonBody.guild_id;
  */

  // Snippets for the response below:
  // Command: ${event.jsonBody.data?.options?.[0]?.value}
  // Username: ${event.jsonBody.member?.user.username}
  // GuildId: ${event.jsonBody.guild_id}`,

  var discord_content = "Default message - this should never appear.";

  /*
  const no_permissions_error_message = "You do not have permission to use this command.";
  const stepFunctions = new AWS.StepFunctions();
  const input = {
    commandName: commandStructure.commandName,
    commandValue: commandStructure.commandValue
  };
  */
  const initialResponse = {
    tts: false,
    // *** Response ***
    content: 'Fetching data...',
    embeds: [],
    allowedMentions: [],
  };
  console.log(`Response:\n${JSON.stringify(initialResponse)}`)

  if (
    event.jsonBody.token &&
    (await sendFollowupMessage(endpointInfo, event.jsonBody.token, initialResponse))
  ) {
    console.log("Initial response successful!");
  } else {
    console.log("Failed to send initial response!");
  }

  switch (commandStructure.commandName) {
    case "todays_scores":
      discord_content = await todays_scores();
      break;
    default:
      discord_content = "Invalid command. Please try again.";
      break;
  };

  const newResponse = {
    tts: false,
    // *** Response ***
    content: discord_content,
    embeds: [],
    allowedMentions: [],
  };
  console.log(`Response:\n${JSON.stringify(newResponse)}`)

  if (
    event.jsonBody.token &&
    (await editFollowupMessage(endpointInfo, event.jsonBody.token, newResponse,
      event.jsonBody.channel.last_message_id))
  ) {
    console.log("Content response successful!");
  } else {
    console.log("Failed to send content response!");
  }

  const putItem = async () => {
    // Set the parameters.
    const params = {
      TableName: commandHistoryTableName,
      Item: commandStructure,
    };
    console.log(`DEBUG - params:\n${JSON.stringify(params)}`);
    try {
      const data = await ddbDocClient.send(new PutCommand(params));
      console.log("Success - item added or updated", data); // TODO - this isn't ideal
    } catch (err: any) {
      // TODO: this is gross fix it later
      console.log("Error", err.stack);
    }
  };
  putItem();
  
  return "200";
}