JLEX Discord Bot
====================
Discord bot for assigning roles with emojis and creating/managing channels.

## Install
```
npm install discord.js
npm install tesseract.js --save
npm install require
```
Then edit line 6 of app.js, changing from "config2.json" to "config.json".
Add your Discord bot API token (found [here](https://discordapp.com/developers/applications/me)) to the "token" field in config.json.
To get a tag on error messages, change the "adminID" to your discord ID (found by turning discord developer option on, then copying ID).
## Run
```
node app.js
```

## Commands

##### !exwelcome
Displays welcome message for new exraid channels

##### !addexraid channel-name topic
Creates a new channel with name "channel-name" and topic "topic". Places it into Exraid category and assigns role "channel-name" to see it. Outputs welcome message into channel.

##### !deleteexraid
Delete the channel "channel-name" and unassigns everyone with role "channel-name". Can be run inside a channel or run outside a channel, listing multiple channe-names.

##### !listexraids Channel-name emoji, Channel-name emoji, etc. 
Outputs all current exraid channels and topics, allowing for emoji assignment of roles

##### !rollcall (or !rolecall)
Displays all users with the role channel-name.

##### !team (or !teams)
Displays the count for each team. Numbers gathered from reactions to the pinned posts.

##### !help (or !commands)
Shows the commands available, with a short description. If called by an admin, shows the command names for admin only commands as well.

##### !liststarting (or !ls) Channel-Substring
Lists all channels starting with "Channel-substring". Similar to !listexraids command.

##### !deletestarting (or !ds) Channel-Substring
Deletes all channels/roles starting with "Channel-Substring".

## TODO
* Fix bug where team numbers do not show after 100 messages in channel
* Add custom emojis in reaction
* Remove user reactions (rsvp list + team rsvp) when !leave's
