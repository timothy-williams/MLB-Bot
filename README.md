# GameServerBot

This is a bot to make life easy for those of us in Discord servers that tend to have a rotation of multiplayer games as the seasons go by. Davebot will allow a subscriber to invite the bot into any Discord servers that the subscriber is in, and the bot will allow access of it's commands to any subscribers in the server.

![Build status](https://github.com/MidnightSunLabs/game-server-bot/workflows/Build/badge.svg "GitHub Actions Build Status")

## Commands

TODO - These will be updated later.

```shell
/<command> <value>
```

| COMMAND | DESCRIPTION |
| -------- | ------- |
| admin | Admin commands for the bot |
| info | Return the current configuration of a subscriber's game server |
| restart | Reboot the game server |
| select_game | text |
| start | Start the game server |
| stop | Stop the game server |
| update [backup? yes/no] | Update the game server, and choose whether to take a backup or not. |

## Supported Steam Games

Note: Only supporting anonymous login game servers for initial launch.

Initial steamcmd servers to support:

* Valheim - [App 896660 · SteamDB](https://steamdb.info/app/896660/)
* 7 Days To Die - [App 294420 · SteamDB](https://steamdb.info/app/294420/)
* Rust - [App 258550 · SteamDB](https://steamdb.info/app/258550/)
* Ark - [App 376030 · SteamDB](https://steamdb.info/app/376030/)
* Space Engineers - [App 298740 · SteamDB](https://steamdb.info/app/298740/)
* 

## Minecraft

Although Minecraft is not a Steam game, we will be supporting Minecraft servers.
No ETA on mod support as of August 2023.
