import { Context, Callback } from "aws-lambda";
import { getDiscordSecrets } from "./utils/DiscordSecrets";
import { sendFollowupMessage } from "./utils/EndpointInteractions";
import {
  IDiscordEventRequest,
  IDiscordCommandStructure
} from "../lib/types/discord";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ScoresToday  } from './commands/todays_scores';
import { LastGame } from './commands/last_game';

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

  // Snippets for the response below:
  // Command: ${event.jsonBody.data?.options?.[0]?.value}
  // Username: ${event.jsonBody.member?.user.username}
  // GuildId: ${event.jsonBody.guild_id}`,

  let discord_content: string | undefined;
  let embed_object: Record<any, any> | undefined;

  const input = {
    commandName: commandStructure.commandName,
    commandValue: commandStructure.commandValue
  };

  switch (input.commandName) {
    case "todays_scores":
      embed_object = await new ScoresToday().buildObject();
      break;
    case "last_game_al":
      if (input.commandValue !== undefined) {
          embed_object = await new LastGame().buildObject(input.commandValue);
      } else {
          discord_content = "Please provide a league and team name.";
      }
      break;
    case "last_game_nl":
      if (input.commandValue !== undefined) {
          embed_object = await new LastGame().buildObject(input.commandValue);
      } else {
          discord_content = "Please provide a league and team name.";
      }
      break;
    default:
      discord_content = "Invalid command. Please try again.";
      break;
  };

  // This needs to run a string/undefined check first
  /*
  if ((embed_object!['content']!.length > 4096) || (discord_content!.length > 2000)) {
    console.log("ERROR - max character length exceeded.");
    return "400";
  }
  */

  const response = {
    tts: false,
    content: discord_content,
    embeds: [
      embed_object
    ],
    allowedMentions: [],
  };

  console.log(`Follow-up message:\n${JSON.stringify(response)}`)

  if (
    event.jsonBody.token &&
    (await sendFollowupMessage(endpointInfo, event.jsonBody.token, response))
  ) {
    console.log("Follow-up message successful!");
  } else {
    console.log("Failed to send follow-up message!");
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