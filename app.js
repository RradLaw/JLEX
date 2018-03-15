const Discord = require("discord.js");

const client = new Discord.Client();

// change this to ./config.json to get it to work
const config = require("./config2.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const tagID = config.adminID === "DISCORD_ID_OF_ADMIN" ? null : config.adminID;

client.on("ready", () => {
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity(`Pokemon Go`);
    let guilds = client.guilds.array();
    for (let i = 0; i < guilds.length; i++) {
        let gChannels = guilds[i].channels.array();
        for (let j = 0; j < gChannels.length; j++) {
            if (gChannels[j].name === "ex-rsvp") {
                gChannels[j].fetchMessages().catch(console.error);
            }
        }
    }
});

client.on("message", async message => {
    if (message.type === "PINS_ADD" && message.author.bot) return message.delete();
    // This event will run on every single message received, from any channel or DM.
    // Ignores messages from all bots
    if (message.author.bot) return;

    // Ignores messages without prefix
    if (message.content.indexOf(config.prefix) !== 0) return;


    // Splits command into array
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Outputs users with a role in the channel. Sorts them alphabetically.
    if (command === "rolecall" || command === "rollcall") {
        let sweetrole = message.guild.roles.find("name", message.channel.name);
        if (sweetrole) {
            let roleusers = '';
            let maparr = message.guild.roles.get(sweetrole.id).members.map(m => m.displayName);
            maparr.sort(function (a, b) {
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            for (let i = 0; i < maparr.length; i++) {
                roleusers += maparr[i] + ', '
            }
            message.channel.send('Users in lobby: ' + roleusers.substring(0, roleusers.length - 2)).catch(console.error);
        } else {
            message.channel.send('Role not found for rolecall' + (tagID ? ' <@!' + tagID + '>' : '')).catch(console.error);
        }
        // Removes user from the channel
    } else if (command === "leave") {
        let sweetrole = message.guild.roles.find("name", message.channel.name);
        if (sweetrole) {
            message.member.removeRole(sweetrole).then(message.channel.send('\:wave:')).catch(console.error);
        }
        //broken
    } else if (command === "team" || command === "teams") {
        let teamMsg = await message.channel.fetchPinnedMessages();
        await message.channel.fetchMessages();
        teamMsg = teamMsg.array();
        if (teamMsg.length < 3) {
            message.channel.send("There are some of each team ¯\\_(ツ)_/¯");
            return;
        }
        let rsvpUsers = [];
        let mems = [];
        let instinkCount = 0;

        // best team
        let mystakeCount = 0;

        // bit of a stretch XD
        let failorCount = 0;
        for (let i = 0; i < teamMsg.length; i++) {
            if (teamMsg[i].content === "------\nPlease react to this message with the number emoji of VALOR accounts you will be raiding with") {
                let rea = await message.channel.fetchMessage(teamMsg[i].id);
                [failorCount, rsvpUsers] = await countTeamReacts(rea, rsvpUsers);
            } else if (teamMsg[i].content === "------\nPlease react to this message with the number emoji of INSTINCT accounts you will be raiding with") {
                let rea = await message.channel.fetchMessage(teamMsg[i].id);
                [instinkCount, rsvpUsers] = await countTeamReacts(rea, rsvpUsers);
            } else if (teamMsg[i].content === "------\nPlease react to this message with the number emoji of MYSTIC accounts you will be raiding with") {
                let rea = await message.channel.fetchMessage(teamMsg[i].id);
                [mystakeCount, rsvpUsers] = await countTeamReacts(rea, rsvpUsers);
            }
        }
        // Removes duplicate entries from rsvpUsers
        rsvpUsers = Array.from(new Set(rsvpUsers));
        let role = message.guild.roles.find("name", message.channel.name);
        mems = role.members.filterArray(mems => {
            if (rsvpUsers.indexOf(mems.id) < 0)
                return mems.id;
        });
        // TODO Fix bug where reactions do not show after 50 messages.
        let rsvpString = "**RSVP Team Count** (from pinned messages)\nInstinct: " + instinkCount + "\nMystic: " + mystakeCount + "\nValor: " + failorCount;
        if (mems.length > 0) {
            rsvpString += "\n\nUsers not RSVP'd: ";
            for (let i = 0; i < mems.length; i++) {
                rsvpString += mems[i].displayName + (i < mems.length - 1 ? ", " : "");
            }
        }
        message.channel.send(rsvpString).catch(console.error);
    } else if (command === "help" || command === "commands") {
        message.channel.send('`!leave` Removes the user from the lobby.\n`!rolecall` Shows all users assigned to lobby.\n`!teams` Shows the RSVPs for each team from the pinned posts.');
    }

    // Ignores messages not from "Admin" role
    if (!message.member.roles.some(r => ["Admin"].includes(r.name))) return;

    if (command === "help" || command === "commands") {
        message.channel.send('Admin commands:\n `!exwelcome` `!addexraid` `!deleteexraid` `!listexraids`\n Contact Jazzalaw for more info.');
    } else if (command === "exwelcome") {
        message.delete().catch(O_o => { });
        welcomeMessage(message.channel);
    } else if (command === "addexraid") {
        let server = message.guild;

        let raidName = args.shift() || 'exraid' + Math.floor(Math.random() * 10000);
        let raidDesc = args.join(' ') || raidName;

        server.createChannel(raidName, "text")
            .then(async channel => {
                channel.setParent(message.channel.parent);


                let exRole = message.guild.roles.find("name", "ExRaids");
                channel.overwritePermissions(exRole, { READ_MESSAGES: true, SEND_MESSAGES: true }).catch(console.error);


                let erroneRole = message.guild.roles.find("name", "@everyone");
                await channel.overwritePermissions(erroneRole, { READ_MESSAGES: false }).then(welcomeMessage(channel)).catch(console.error);
                let modRole = message.guild.roles.find("name", "Mod");
                channel.overwritePermissions(modRole, { READ_MESSAGES: true, SEND_MESSAGES: true }).catch(console.error);

                server.createRole({ name: raidName })
                    .then(role => {
                        channel.overwritePermissions(role, { READ_MESSAGES: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, ADD_REACTIONS: true });
                    }).catch(console.error);

                channel.setTopic(raidDesc).catch(console.error);

                message.channel.send("Exraid " + raidName + " created.");
            });
    } else if (command === "deleteexraid" || command === "deleteexraids") {
        if (args.length === 0) {
            let role = message.guild.roles.find("name", message.channel.name);
            if (role) role.delete().catch(console.error);
            message.channel.delete().catch(console.error);
        } else {
            for (let i = 0; i < args.length; i++) {
                let jackiechannel = message.guild.channels.find("name", args[i]);
                let role = message.guild.roles.find("name", args[i]);
                if (role) role.delete().catch(console.error);
                jackiechannel.delete().catch(console.error);
                message.channel.send('RIP ' + args[i] + ' exraid.');
            }
        }
    } else if (command === "blush") {
        message.delete().catch(O_o => { });
        message.channel.send(':blush:');
    } else if (command === "listexraids" || command === "listexraid") {
        message.delete().catch(O_o => { });
        let server = message.guild;
        let msg = 'React to add yourself to the exraid channels\n\n';
        let topic = '';
        for (let i = 0; i < args.length; i += 2) {
            topic = client.channels.find("name", args[i]);
            msg += args[i + 1] + " : `" + topic.topic + "` <#" + topic.id + ">\n\n";
        }
        message.channel.send(msg)
            .then(async message => {
                for (let i = 1; i < args.length; i += 2) {
                    await message.react(args[i]).catch(console.error);
                }
            }).catch(console.error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id !== client.user.id && reaction.message.author.id === client.user.id) {
        let str = reaction.message.content.split("\n");
        let topics = [];
        let emojis = [];
        if (str[0] === 'React to add yourself to the exraid channels') {
            for (let i = 2; i < str.length; i += 2) {
                emojis.push(str[i].substr(0, 2));
                topics.push(str[i].substring(6, str[i].indexOf("`", 6)));
            }
            for (let i = 0; i < emojis.length; i++) {
                if (reaction.emoji.name === emojis[i]) {
                    let arr = reaction.message.channel.parent.children.array();
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j].topic === topics[i]) {
                            let role = reaction.message.guild.roles.find("name", arr[j].name);
                            let member = await reaction.message.guild.fetchMember(user.id);
                            member.addRole(role).catch(console.error);
                        }
                    }
                }
            }
        }
    }
});
// 100% new function
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.id !== client.user.id && reaction.message.author.id === client.user.id) {
        let str = reaction.message.content.split("\n");
        let topics = [];
        let emojis = [];
        if (str[0] === 'React to add yourself to the exraid channels') {
            for (let i = 2; i < str.length; i += 2) {
                emojis.push(str[i].substr(0, 2));
                topics.push(str[i].substring(6, str[i].indexOf("`", 6)));
            }
            for (let i = 0; i < emojis.length; i++) {
                if (reaction.emoji.name === emojis[i]) {
                    let arr = reaction.message.channel.parent.children.array();
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j].topic === topics[i]) {
                            let role = reaction.message.guild.roles.find("name", arr[j].name);
                            let member = await reaction.message.guild.fetchMember(user.id);
                            member.removeRole(role).catch(console.error);
                        }
                    }
                }
            }
        }
    }
});

async function welcomeMessage(c) {
    c.send('Welcome to your EX raid family! Congratulations on getting a pass. So that we give everybody the best chance of success, please use these channels to co-ordinate between yourselves. Keep an eye out for each other at the raid. It is everybody\'s responsibility to make sure all EX raid pass carriers get a chance to catch this legendary Pokémon. Happy raiding!')
        .catch(console.error);
    c.send('------\nPlease react to this message with the number emoji of MYSTIC accounts you will be raiding with').then(message => {
        message.pin();
    }).catch(console.error);
    c.send('------\nPlease react to this message with the number emoji of VALOR accounts you will be raiding with').then(message => {
        message.pin();
    }).catch(console.error);
    c.send('------\nPlease react to this message with the number emoji of INSTINCT accounts you will be raiding with').then(message => {
        message.pin();
    }).catch(console.error);
    c.send('------\n\n*Example: If I am responding for myself (Valor),  my wife (Valor) and my son (Mystic), I would react with a :two: to the Valor message and a :one: to the Mystic message.*');
}

async function countTeamReacts(rea, rsvpUsers) {
    let counter = 0;
    let usr = '';
    rea = rea.reactions.array();
    for (let j = 0; j < rea.length; j++) {
        switch (rea[j].emoji.name) {
            case "1⃣":
                counter += 1 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "2⃣":
                counter += 2 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "3⃣":
                counter += 3 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "4⃣":
                counter += 4 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "5⃣":
                counter += 5 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "6⃣":
                counter += 6 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "7⃣":
                counter += 7 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "8⃣":
                counter += 8 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "9⃣":
                counter += 9 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
            case "🔟":
                counter += 10 * rea[j].count
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
        }
    }
    return [counter, rsvpUsers];
}

client.login(config.token);
