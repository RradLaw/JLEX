JLEX Discord Bot
====================
Discord bot for assigning roles with emojis and creating/managing channels.

## Install
```
npm install discord.js
```
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

##### !rolecall
Displays all users with the role channel-name.

## TODO
* Add team RSVPs to rolecall
* Show un-RSVP'd users in rolecall
* Add !leave function
* Add !help dialogue
* Fix exraid list emoji order