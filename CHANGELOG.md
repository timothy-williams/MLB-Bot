# Change Log
## 2023-9-9
- `/standings` V1.0: Display current standings for a division or wild card
## 2023-9-1
- Split `last_game` up into `last_game_al` and `last_game_nl` to fit within Discord's 25 choice limit
## 2023-8-31
- `/last_game` - Now displays as an embed instead of a regular message
## 2023-8-28
- `/last_game` V1.0: Display box score of selected team's most recent completed game
## 2023-8-27
- Increased general response time for scoreboard retrieval
## 2023-8-26
- `/todays_scores` - Fixed bug where games would not be sorted by time (including doubleheaders)
## 2023-8-25
- Changed `/todays_scores`'s timezone to use PST/PDT instead of UTC when retrieving the current date
- Fixed bug where games with TBD start time would display "scheduled" time
- Fixed bug where previously suspended games would display original start time instead of resumed time
## 2023-8-24
- Condensed scoreboard elements to better fit within the embed
## 2023-8-23
- Converted scoreboard times to display in PST instead of UTC
## 2023-8-22
- Fixed bug that occurred when a message would exceed Discord's max character limit
- Changed message format to utilize embeds