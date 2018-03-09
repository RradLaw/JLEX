const Discord = require("discord.js");

const client = new Discord.Client();

const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

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

    if (command === "rolecall") {
        let sweetrole = message.guild.roles.find("name", message.channel.name);
        let roleusers = '';
        message.guild.roles.get(sweetrole.id).members.map(m => roleusers += m.displayName + ", ");
        message.channel.send('Users in lobby: ' + roleusers);
    }

    // Ignores messages not from "Admin" role
    if (!message.member.roles.some(r => ["Admin"].includes(r.name))) return;

    if (command === "exwelcome") {
        message.delete().catch(O_o => { });
        welcomeMessage(message.channel);
    } else if (command === "addexraid") {
        //message.delete().catch(O_o => { });
        let server = message.guild;

        let raidName = args.shift() || 'exraid' + Math.floor(Math.random() * 10000);
        let raidDesc = args.join(' ') || raidName;

        server.createChannel(raidName, "text")
            .then(channel => {
                channel.setParent(message.channel.parent);

                welcomeMessage(channel);

                let exRole = message.guild.roles.find("name", "ExRaids");
                channel.overwritePermissions(exRole, { READ_MESSAGES: true, SEND_MESSAGES: true }).catch(console.error);
                let modRole = message.guild.roles.find("name", "Mod");
                channel.overwritePermissions(modRole, { READ_MESSAGES: true, SEND_MESSAGES: true }).catch(console.error);
                let erroneRole = message.guild.roles.find("name", "@everyone");
                channel.overwritePermissions(erroneRole, { READ_MESSAGES: false }).catch(console.error);

                server.createRole({ name: raidName })
                    .then(role => {
                        channel.overwritePermissions(role, { READ_MESSAGES: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true, ADD_REACTIONS: true });
                    }).catch(console.error);

                channel.setTopic(raidDesc).catch(console.error);

                message.channel.send("Exraid " + raidName + " created.");
            });
    } else if (command === "deleteexraid") {
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

    } else if (command === "listexraids") {

        let server = message.guild;
        let msg = 'React to add yourself to the exraid channels\n\n';
        let topic = '';
        for (let i = 0; i < args.length; i += 2) {
            topic = client.channels.find("name", args[i]);
            msg += args[i + 1] + " : `" + topic.topic + "`\n\n";
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
                topics.push(str[i].substr(6, str[i].length - 7));
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
                topics.push(str[i].substr(6, str[i].length - 7));
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
        .then(message => {
            message.pin();
        }).catch(console.error);
    c.send('------\nPlease react to this message with the number emoji of MYSTIC accounts you will be raiding with');
    c.send('------\nPlease react to this message with the number emoji of VALOR accounts you will be raiding with');
    c.send('------\nPlease react to this message with the number emoji of INSTINCT accounts you will be raiding with');
    c.send('------\n\n*Example: If I am responding for myself (Valor),  my wife (Valor) and my son (Mystic), I would react with a :two: to the Valor message and a :one: to the Mystic message.*');
}

client.login(config.token);
