const Discord = require("discord.js");
//let Tesseract = require('tesseract.js');
let request = require('request');
let fs = require('fs');

const models = require('./models');

const client = new Discord.Client();

const regionalEmojis = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿', '0⃣', '1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// change this to ./config.json to get it to work
const config = require("./config2.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const tagID = config.adminID === "DISCORD_ID_OF_ADMIN" ? null : config.adminID;

client.on("ready", () => {
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity(`Digimon Go`);
    let guilds = client.guilds.array();
    for (let i = 0; i < guilds.length; i++) {
        let gChannels = guilds[i].channels.array();
        for (let j = 0; j < gChannels.length; j++) {
            if (gChannels[j].name === "ex-rsvp" || gChannels[j].name === "ex-rsvp2" ) {
                gChannels[j].fetchMessages().catch(console.error);
            }
        }
    }
});

client.on("message", async message => {
    if (message.type === "PINS_ADD" && message.author.bot) return message.delete();

    // Ignores messages from all bots
    if (message.author.bot) return;

    /*
    if (message.channel.id === config.passChannel) {
        message.attachments.every(async function(a) {
            //message.channel.send('Processing Pass');
            //testPasses(message.channel);
            tesseractImg(a.url,message.channel);
        });
    }*/

    // Ignores messages without prefix
    if (message.content.indexOf(config.prefix) !== 0) return;

    // Splits command into array
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Outputs users with a role in the channel. Sorts them alphabetically.
    if (command === 'rolecall' || command === 'rollcall' || args[0] === 'call' && (command === 'roll' || command === 'role')) {
        let sweetrole = message.guild.roles.find(x => x.name === message.channel.name);
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
            message.channel.send('Role not found for rollcall' + (tagID ? ' <@!' + tagID + '>' : '')).catch(console.error);
        }
        // Removes user from the channel
    } else if (command === "leave") {
        let sweetrole = message.guild.roles.find(x => x.name === message.channel.name);
        if (sweetrole) {
            message.member.removeRole(sweetrole).then(message.channel.send('\:wave:')).catch(console.error);
        }
    } else if (command === "team" || command === "teams" || command === "count" || command === "rsvpcount") {
        let teamMsg = await message.channel.fetchPinnedMessages();
        await message.channel.fetchMessages({limit: 100});
        teamMsg = teamMsg.array();
        if (message.channel.messages.size >= 100) {
            message.channel.send('There are too many messages in the channel check ¯\\_(ツ)_/¯');
            return
        }
        let rsvpUsers = [];
        let mems = [];

        let raiderCount;
        
        for (let i = 0; i < teamMsg.length; i++) {
            if (teamMsg[i].content === 'Please react to this message with the number of accounts you will be raiding with.') {
                let rea = await message.channel.fetchMessage(teamMsg[i].id);
                [raiderCount, rsvpUsers] = await countTeamReacts(rea, rsvpUsers);
            }
        }
        // Removes duplicate entries from rsvpUsers
        rsvpUsers = Array.from(new Set(rsvpUsers));
        let role = message.guild.roles.find(x => x.name === message.channel.name);
        if (role) {
            mems = role.members.filter(mems => {
                if (rsvpUsers.indexOf(mems.id) < 0) {
                    return mems.id;
                }
            });
        }
        mems = mems.array();
        // TODO Fix bug where reactions do not show after 100 messages.
        // 1+2+3+..+10 = 55
        let rsvpString = "**RSVP Count** (from pinned messages)\n" + (raiderCount-55);
        if (mems.length > 0) {
            rsvpString += "\n\nUsers without a react: ";
            for (let i = 0; i < mems.length; i++) {
                rsvpString += mems[i].displayName + (i < mems.length - 1 ? ", " : "");
            }
        }
        message.channel.send(rsvpString).catch(console.error);
    } else if (command === "help" || command === "commands") {
        message.channel.send('`!leave` Removes the user from the lobby.\n`!rollcall` Shows all users assigned to lobby.\n`!teams` Shows the RSVPs for each team from the pinned posts.');
    } else if (command === "react" || command === "reacts") {
        message.channel.send('Reactions on Mobile:\nScroll to the top of the channel, hold down on the message, tap on "Add Reactions", search for the number, and click on it.\nReactions on Desktop:\nScroll to the top of the channel, tap on the smiley face next to the message, then search for the number, and click on it.');
    }

    // Ignores messages not from "Admin" role
    if (!message.member.roles.some(r => [config.adminRole].includes(r.name))) return;

    if (command === "help" || command === "commands") {
        message.channel.send('Admin commands:\n `!exwelcome` `!addexraid` `!deleteexraid` `!listexraids` `!deletestarting` `!liststarting`\n Contact Jazzalaw for more info.');
    } else if (command === "exwelcome") {
        message.delete().catch(O_o => { });
        welcomeMessage(message.channel);
    } else if (command === "addexraid") {
        let server = message.guild;

        message.content.split(/\r?\n/).forEach(function (element) {
            const args = element.slice(config.prefix.length).trim().split(/ +/g);
            args.shift();
            let raidName = args.shift() || 'exraid' + Math.floor(Math.random() * 10000);
            let raidDesc = args.join(' ') || raidName;

            server.createChannel(raidName, "text")
                .then(async channel => {
                    channel.setParent(message.channel.parent);

                    let exRole = message.guild.roles.find(x => x.name === "ExRaids");
                    channel.overwritePermissions(exRole, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(console.error);

                    let erroneRole = message.guild.roles.find(x => x.name === "@everyone");
                    await channel.overwritePermissions(erroneRole, { VIEW_CHANNEL: false }).then(welcomeMessage(channel)).catch(console.error);
                    let modRole = message.guild.roles.find(x => x.name === "Senior Moderator");
                    channel.overwritePermissions(modRole, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(console.error);

                    server.createRole({ name: raidName })
                        .then(role => {
                            channel.overwritePermissions(role, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, ADD_REACTIONS: true });
                        }).catch(console.error);

                    channel.setTopic(raidDesc).catch(console.error);
                    const channelArr = message.client.channels.array();
                    let counter = 0;
                    for(let i=0;i<channelArr.length;i++) {
                        if(channelArr[i].parent && channelArr[i].parent.id === message.channel.parent.id) counter++;
                    }
                    message.channel.send(`Exraid ${raidName} created (${counter})`);
                })
                .catch(console.error);
        });
    } else if (command === "deleteexraid" || command === "deleteexraids") {
        if (args.length === 0) {
            let role = message.guild.roles.find(x => x.name, message.channel.name);
            if (role) role.delete().catch(console.error);
            message.channel.delete().catch(console.error);
        } else {
            for (let i = 0; i < args.length; i++) {
                args[i] = args[i].toLowerCase();
                let jackiechannel = message.guild.channels.find(x => x.name === args[i]);
                let role = message.guild.roles.find(x => x.name === args[i]);
                if (role) role.delete().catch(console.error);
                if (jackiechannel) {
                    jackiechannel.delete().catch(console.error);
                    message.channel.send('RIP ' + args[i] + ' exraid.');
                } else {
                    message.channel.send('Cannot find channel' + args[i]);
                }
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
            topic = client.channels.find(x => x.name === args[i]);
            msg += args[i + 1] + " : `" + topic.topic + "` <#" + topic.id + ">\n\n";
        }
        message.channel.send(msg)
            .then(async message => {
                for (let i = 1; i < args.length; i += 2) {
                    await message.react(args[i]).catch(console.error);
                }
            }).catch(console.error);
    } else if (command === "deletestarting" || command === "ds") {
        if (args[0]) {
            let delFlag = false;
            
            let jackieChannels = [];
            const channelArr = message.client.channels.array();
            for(let i=0;i<channelArr.length;i++) {
                if(channelArr[i].parent && channelArr[i].parent.id === message.channel.parent.id) jackieChannels.push(channelArr[i]);
            }

            for (let i = 0; i < jackieChannels.length; i++) {
                if (args[0] === (jackieChannels[i].name).substring(0, args[0].length)) {
                    let role = message.guild.roles.find(x => x.name === jackieChannels[i].name);
                    if (role) role.delete().catch(console.error);
                    (jackieChannels[i]).delete().catch(console.error);
                }
            }
        }
    } else if (command === "ls" || command === "liststarting") {
        if (args[0]) {
            message.delete().catch(O_o => { });
            
            let jackieChannels = [];
            const channelArr = message.client.channels.array();
            for(let i=0;i<channelArr.length;i++) {
                if(channelArr[i].parent && channelArr[i].parent.id === message.channel.parent.id) jackieChannels.push(channelArr[i]);
            }

            let messageArray = [];

            for (let i = 0; i < jackieChannels.length; i++) {
                if (args[0] === (jackieChannels[i].name).substring(0, args[0].length)) {
                    messageArray.push([jackieChannels[i].topic, jackieChannels[i].id]);
                }
            }

            messageArray.sort(function (a, b) {
                if (a[0] === b[0]) {
                    return 0;
                }
                else {
                    return (a[0] < b[0]) ? -1 : 1;
                }
            });

            let msg = 'React to add yourself to the exraid channels\n\n';
            let msg2 = '---------------------------------\n\n';

            for (let i = 0; i < messageArray.length; i++) {
                if (i < 20) {
                    msg += `${regionalEmojis[i]} : \`${messageArray[i][0]}\` <#${messageArray[i][1]}>\n\n`;
                } else if (i <= 37) {
                    msg2 += `${regionalEmojis[i]} : \`${messageArray[i][0]}\` <#${messageArray[i][1]}>\n\n`;
                }
            }

            await message.channel.send(msg)
                .then(async message => {
                    for (let i = 0; i < messageArray.length && i < 20; i++) {
                        await message.react(regionalEmojis[i]).catch(console.error);
                    }
                }).catch(console.error);
            if (messageArray.length > 20) {
                message.channel.send(msg2)
                    .then(async message => {
                        for (let i = 20; i < messageArray.length; i++) {
                            await message.react(regionalEmojis[i]).catch(console.error);
                        }
                    }).catch(console.error);
            }

        }
    } else if (command === "addmany") {
        let server = message.guild;

        for (let i = 0; i < args[0]; i++) {
            let raidName = 'exraid' + Math.floor(Math.random() * 10000);
            let raidDesc = `topic for ${raidName}`;

            server.createChannel(raidName, "text")
                .then(async channel => {
                    channel.setParent(message.channel.parent);

                    let exRole = message.guild.roles.find(x => x.name === "ExRaids");
                    channel.overwritePermissions(exRole, { VIEW_CHANNEL: true, SEND_MESSAGES: true }).catch(console.error);

                    server.createRole({ name: raidName })
                        .then(role => {
                            channel.overwritePermissions(role, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, ADD_REACTIONS: true });
                        }).catch(console.error);

                    channel.setTopic(raidDesc).catch(console.error);

                });
        }
    } else if (command === "parseraid") {
        const parseRaidArray = message.content.slice(config.prefix.length).trim().split(/`+/g);
        if(parseRaidArray.length > 4) {
            let raidName = parseRaidArray[1];
            let guids = await models.findGym(raidName);
            let raidDateTime = parseRaidArray[3];

            if(!parseTime(raidDateTime)) {
                message.reply("datetime not in the format of YYYY-MM-DD HH:MM");
                return;
            }

            if(guids.length === 0) {
                message.reply(`couldn't find gym "${raidName}" in database.`);
            } else if (guids.length > 1) {
                let m = "Too many gyms with that name. Use one of the commands below to add the raid.";
                for(let i=0;i<guids.length;i++) {
                    m+=`\n\`\`!parsegym \`${guids[i].guid}\` \`${raidDateTime}\` \`\`\n${config.websiteLink}/?lat=${guids[i].latitude}&lng=${guids[i].longitude}&z=19\n`;
                }
                message.reply(m);
            } else {
                parseRaid(guids[0].guid,raidName,raidDateTime);
            }
        } else {
            message.reply("not enough data to enter raid. Command needs both a gym name and a datetime in seperate code blocks.");
        }
    } else if (command === "parsegym") {
        const parseRaidArray = message.content.slice(config.prefix.length).trim().split(/`+/g);
        if(parseRaidArray.length > 4) {
            let raidGuid = parseRaidArray[1];
            let raidName = await models.findGymName(raidGuid);
            let raidDateTime = parseRaidArray[3];
            
            if(!parseTime(raidDateTime)) {
                message.reply("datetime not in the format of YYYY-MM-DD HH:MM");
                return;
            }

            if(raidName.length === 0) {
                message.reply(`couldn't find gym "${raidGuid}" in database.`);
            } else {
                parseRaid(raidGuid,raidName[0].name,raidDateTime);
            }
        } else {
            message.reply("not enough data to enter raid. Command needs both a gym guid and a datetime in seperate code blocks.");
        }
    }
});

// tests that dt is of format "YYYY-MM-DD HH:MM" 
function parseTime(dt) {
    let patt = new RegExp(/\d\d\d\d-\d\d-\d\d \d\d:\d\d/);
    return patt.test(dt);
}

async function parseRaid(guid,name,datetime) {
    console.log(guids[0].guid);
    let date = new Date(dateTime);
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id !== client.user.id && reaction.message.author.id === client.user.id) {
        let str = reaction.message.content.split("\n");
        let topics = [];
        let emojis = [];
        if (reaction.message.channel.name === 'ex-rsvp' || reaction.message.channel.name === 'ex-rsvp2') {
            for (let i = 2; i < str.length; i += 2) {
                emojis.push(str[i].substr(0, 2));
                topics.push(str[i].substring(6, str[i].indexOf("`", 6)));
            }
            for (let i = 0; i < emojis.length; i++) {
                if (reaction.emoji.name === emojis[i]) {
                    let arr = reaction.message.channel.parent.children.array();
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j].topic === topics[i]) {
                            let role = reaction.message.guild.roles.find(x => x.name === arr[j].name);
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
        if (reaction.message.channel.name === 'ex-rsvp' || reaction.message.channel.name === 'ex-rsvp2') {
            for (let i = 2; i < str.length; i += 2) {
                emojis.push(str[i].substr(0, 2));
                topics.push(str[i].substring(6, str[i].indexOf("`", 6)));
            }
            for (let i = 0; i < emojis.length; i++) {
                if (reaction.emoji.name === emojis[i]) {
                    let arr = reaction.message.channel.parent.children.array();
                    for (let j = 0; j < arr.length; j++) {
                        if (arr[j].topic === topics[i]) {
                            let role = reaction.message.guild.roles.find(x => x.name === arr[j].name);
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
    c.send('Welcome to your EX raid family! Congratulations on getting a pass. So that we give everybody the best chance of success, please use these channels to co-ordinate between yourselves. Keep an eye out for each other at the raid. It is everybody\'s responsibility to make sure all EX raid pass carriers get a chance to catch this legendary Pokémon. Happy raiding!\n------')
        .catch(console.error);
    c.send('Please react to this message with the number of accounts you will be raiding with.').then(async message => {
        message.pin();
        for (let i = 26; i < regionalEmojis.length; i++) {
            await message.react(regionalEmojis[i]).catch(console.error);
        }
    }).catch(console.error);
}

async function countTeamReacts(rea, rsvpUsers) {
    let counter = 0;
    let usr = '';
    rea = rea.reactions.array();
    for (let j = 0; j < rea.length; j++) {
        switch (rea[j].emoji.name) {
            case "0⃣":
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
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
                counter += 10 * rea[j].count;
                usr = await rea[j].fetchUsers().catch(console.error);
                usr = usr.keyArray();
                rsvpUsers = rsvpUsers.concat(usr);
                break;
        }
    }
    return [counter, rsvpUsers];
}

let filenameCounter = 0;

function tesseractImg(url,chan) {
    var writeFile = fs.createWriteStream(`passes/pic${++filenameCounter}.jpg`);
    request(url).pipe(writeFile).on('close', function() {
        Tesseract.recognize(writeFile.path)
          .catch(err => console.error(err))
          .then(function (result) {
            let str = result.text.replace(/\n/g, " ");
            str = str.replace("!  P", "! P");
            let s1 = str.indexOf("previous victory at ");
            let s2 = str.indexOf("! Please visit");
            if(s1 === -1 || s2 === -1) {
                chan.send(url+'\nCan\'t read pass');
                console.log(str);
                console.log('Pass failed\n'+url);
                return;
            }
            let s3 = str.substr(s1+20,s2-s1-20);
            for(let i=0;i<monthNames.length;i++) {
                if(str.indexOf(monthNames[i]) !== -1) {
                    let details = str.substr(str.indexOf(monthNames[i]),monthNames[i].length + 50);
                    if(details.lastIndexOf(" PM ")>0) {
                        details = details.substr(0,details.lastIndexOf(" PM ")+4);
                    } else if (details.lastIndexOf(" AM ")) {
                        details = details.substr(0,details.lastIndexOf(" AM ")+4);
                    } else {
                        console.log("Can't find date/time");
                        return;
                    }
                    chan.send('\n'+s3+'\n'+details);
                    return;
                }
            }
          });
      });
      return;
}

async function testPasses(chan) {
    for(let i=0;i<config.testURLs.length;i++) {
        tesseractImg(config.testURLs[i],chan);
    }
}

client.on('error', console.error);

client.login(config.token);
