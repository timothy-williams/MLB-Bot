import { Context, Callback } from "aws-lambda";
import { getDiscordSecrets } from "./utils/DiscordSecrets";
import { sendFollowupMessage } from "./utils/EndpointInteractions";
import {
  IDiscordEventRequest,
  IDiscordCommandStructure
} from "../lib/types/discord";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// const AWS = require("aws-sdk");
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
  };

  const commandStructure: IDiscordCommandStructure = {
    timestamp: Date.now(),
    userId: event.jsonBody.member?.user.id,
    commandName: event.jsonBody.data?.name,
    commandValue: event.jsonBody.data?.options?.[0]?.value,
    guildId: event.jsonBody.guild_id,
  };

  // const commandValue = event.jsonBody.data?.options?.[0]?.value;
  // const userIdOfCommandUsed = event.jsonBody.member?.user.id;

  // TODO - refactor this
  const smeez_user_id = "176503559121141760";
  console.log("Command Structure:");
  console.log(commandStructure)

  var admin_status = false;

  if (commandStructure.userId === smeez_user_id) {
    admin_status = true;
  }

  // const userNameOfCommandUsed = event.jsonBody.member?.user.username;
  // const guildIdOfCommandUsed = event.jsonBody.guild_id;

  const putItem = async () => {
    // Set the parameters.
    const params = {
      TableName: commandHistoryTableName,
      Item: commandStructure,
    };
    console.log("DEBUG - params:");
    console.log(params);
    try {
      const data = await ddbDocClient.send(new PutCommand(params));
      console.log("Success - item added or updated", data); // TODO - this isn't ideal
    } catch (err: any) {
      // TODO: this is gross fix it later
      console.log("Error", err.stack);
    }
  };
  putItem();

  // Snippets for the response below:
  // Command: ${event.jsonBody.data?.options?.[0]?.value}
  // Username: ${event.jsonBody.member?.user.username}
  // GuildId: ${event.jsonBody.guild_id}`,

  var discord_content = "Default message - this should never appear.";
  // const no_permissions_error_message = "You do not have permission to use this command.";

  /**
  const stepFunctions = new AWS.StepFunctions();
  const input = {
    commandName: commandStructure.commandName,
    commandValue: commandStructure.commandValue
  };

  switch (commandStructure.commandName) {
    case "game_server_manager":
      switch (commandStructure.commandValue) {
        case "status":
          
          discord_content = "Implementing status response.";
          break;
        case "feedback":
          discord_content = "Implementing feedback response.";
          break;
        case "help":
          discord_content = help_response;
          break;
        case "start":
          if (admin_status === true) {
            // invoke the test state machine here
            try {
              const result = await stepFunctions
                .startExecution({
                  stateMachineArn: mainStateMachineArn,
                  input: JSON.stringify(input),
                })
                .promise();

              const execution_id = result.executionArn.match(
                /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
              );

              console.log(`ExecutionId: ${execution_id}`);
              const execution_message = `State machine execution started with ID:\n${execution_id}`;

              console.log(execution_message);
              discord_content = `Starting server...\n${execution_message}`;
              // return { executionArn: result.executionArn };
            } catch (err) {
              console.error(err);
              throw new Error(
                `Failed to start state machine execution: ${err}`
              );
            }
          } else {
            discord_content = no_permissions_error_message;
          }
          break;
        case "stop":
          discord_content = `Stopping server...
          TODO - implement function to stop the server.`;
          break;
        case "restart":
          discord_content = `Restarting server...
          TODO - implement function to restart the server.`;
          break;
        case "update":
          discord_content = `Updating server...
          TODO - implement function to update the server.`;
          break;
        case "backup":
          discord_content = `Backing up the server...
          TODO - implement function to back up the server.`;
          break;
        case "quick-restore":
          discord_content = `Restoring server from latest backup...
          TODO - implement function to quick-restore the server.`;
          break;
        case "check-admin":
          discord_content = `Checking if User ID is an admin...
          TODO - implement function to check this functionality.`;
          break;
        case "add-admin":
          discord_content = `Adding User ID as an admin...
          TODO - implement function to check this functionality.`;
          break;
        case "remove-admin":
          discord_content = `Removing User ID as an admin...
          TODO - implement function to check this functionality.`;
          break;
        default:
          discord_content = "Unknown command name.";
          break;
      }
      break;
    case "select_game":
      discord_content = `Switching game to ${input.commandValue}`;
      const updatedGameSelection = {
        userId: commandStructure.userId,
        guildId: commandStructure.guildId,
        gameName: commandStructure.commandValue,
        lastGameChange: new Date().toISOString(),
      };
      const updateGameSelection = async () => {
        // Set the parameters.
        const params = {
          TableName: gameServerSubscriberTableName,
          Item: updatedGameSelection,
        };
        try {
          const data = await ddbDocClient.send(new PutCommand(params));
          console.log("Success - item added or updated", data); // TODO - this isn't ideal
        } catch (err: any) {
          // TODO: this is gross fix it later
          console.log("Error", err.stack);
        }
      };
      updateGameSelection();
      break;
    default:
      discord_content = "Invalid command. Please try again.";
      break;
  }
  */

  const response = {
    tts: false,
    // *** Response ***
    content: discord_content,
    embeds: [],
    allowedMentions: [],
  };

  if (
    event.jsonBody.token &&
    (await sendFollowupMessage(endpointInfo, event.jsonBody.token, response))
  ) {
    console.log("Responded successfully!");
  } else {
    console.log("Failed to send response!");
  }
  return "200";
}
