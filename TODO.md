# MLB-Bot To-Do list
### In Progress/Next
- Rewrite /todays_scores's date logic to change the timezone in which the current day of games would end
### To-do
- Display "TBD" start times where necessary
### Planned Features
- `/lastgame [team]`: display box score of selected team's most recent completed game
### Known Bugs
- Previously suspended games display original start time instead of resumed time
- Doubleheaders in `/todays_scores` don't follow time-sorted order
- Start times from previously suspended games are displayed in scoreboard instead of resumed game time
- Games with a "TBD" start time should display as such
### Requests
- Support `/todays_scores` parameters that sort by...
 - Winning score
 - Largest margin of victory
 - Game length