const { Client, MessageEmbed } = require("discord.js")
const client = new Client({ intents: 32767 });
const { connect } = require("mongoose");
const { token, prefix, mongodb, guildID, announcements, targetNumber, time, GameChannel, delayTime } = require("./config");
const USERS = require("./models/users");
const SETTINGS = require("./models/settings");
const XP = require("./models/xp");
let limited_users = new Map();
let limits = new Map();

client.on("ready", () => {
    console.log(`${client.user.username} is connected...`);
    connect(mongodb, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, (err) => {
        if (err) return console.error(err);
        console.log("Database is connected...")
    });

    setInterval(async () => {
        let settings = await SETTINGS.findOne({ id: guildID });
        if (!settings) settings = await new SETTINGS({
            id: guildID,
            number: 0
        }).save();

        let users = await USERS.find({ score: settings.number })
        if (users.length <= 0) await client.channels.cache.get(announcements).send({
            embeds: [
                new MessageEmbed()
                    .setDescription(`**We lost this battle. Let's wish the gods will forgive us. Moving back to the camp, a new battle is not far.**`)
                    .setColor("RED")
            ]
        });
        else {

            let winners = "";
            users.map(async user => {
                winners += `<@${user.id}> **(${client.guilds.cache.get(guildID).members.cache.get(user.id).user.tag})**\n`
                let u = await XP.findOne({ userId: user.id });
                if(!u) await new XP({
                    userName: `${client.guilds.cache.get(guildID).members.cache.get(user.id).user.tag}`,
                    firstTimeSendMsg: true,
                    userId: user.id,
                    score: 25
                }).save()
                else {
                    u.score+=25
                    await u.save();
                }
            })

            await client.channels.cache.get(announcements).send({
                embeds: [
                    new MessageEmbed()
                        .setAuthor({ name: "The battle is over. The zone is under control, gods are with us. The braves will be rewarded 25 XP.\n\nCongrats:" })
                        .setDescription(winners)
                        .setColor("GREEN")
                        .setTimestamp()
                ]
            });
        }
        setTimeout( async () => {
            let target = Math.ceil(Math.random() * targetNumber);
            settings.number = target;
            await settings.save();
            limited_users.clear();
            await client.channels.cache.get(announcements).send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**We need to cover a new strategic zone. All Nilistador are waited there in less than 6 hours.\nSee you in the Zone (\`${target}\`) valorous.**`)
                        .setColor("BLUE")
                        .setTimestamp()
                ]
            });
        }, delayTime)
    }, time)
})

client.on("guildMemberRemove", async member => {
    if (member) {
        let db = await USERS.findOne({ id: member.id });
        if (db) db.deleteOne();
    }
})
client.on("guildMemberAdd", member => {
    if(member) limited_users.set(member.id, true)
})
client.on("messageCreate", async message => {
    if (message.author.bot || message.channel.type == "DM") return;

    let args = message.content.substring(prefix.length).split(" ");
    if (message.content.startsWith(prefix)) {
        switch (args[0]) {
            case 'ping':
                message.reply(`🏓 Pong, \`${client.ws.ping}ms\``)
                break;
            case 'zone-score':
                if(message.channel.id !== GameChannel) return message.reply("**Use the right channel!**")
                let member = await message.mentions.members.first() || message.guild.members.cache.get(args[1]) || message.author;
                if (member) {
                    let db = await USERS.findOne({ id: member.id });
                    if (!db) db = await new USERS({
                        id: member.id,
                        score: 1
                    }).save();

                    message.reply({
                        embeds: [
                            new MessageEmbed()
                                .setAuthor({ name: `${member.user?.username || member.username}`, iconURL: member.displayAvatarURL({ dynamic: true }) })
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setColor("GREEN")
                                .setDescription(`**Zone Score: ${db.score}**`)
                                .setTimestamp()
                        ]
                    })
                }
                break;
            case "north":
                if(message.channel.id !== GameChannel) return message.reply("**Use the right channel!**")
                if(limited_users.get(message.author.id)) return message.reply("**You are not qualified for this battle. Come back in less than 6 hours ⚔️**")
                if (!limits.get(message.author.id + "north")) {
                    limits.set(message.author.id + "north", true);
                    let user = await USERS.findOne({ id: message.author.id });
                    if (!user) user = await new USERS({
                        id: message.author.id,
                        score: 1
                    }).save();

                    user.score += 1
                    await user.save();
                    message.reply(`**You moved north (+1). You are now in zone: ${user.score}**`);
                    setTimeout(() => {
                        limits.delete(message.author.id + "north");
                    }, 5000)
                } else message.reply("**Ratelimit, you can north once every 30 seconds**")
                break;
            case "south":
                if(message.channel.id !== GameChannel) return message.reply("**Use the right channel!**")
                if(limited_users.get(message.author.id)) return message.reply("**You are not qualified for this battle. Come back in less than 6 hours ⚔️**")
                if (!limits.get(message.author.id + "south")) {
                    limits.set(message.author.id + "south", true);
                    let user = await USERS.findOne({ id: message.author.id });
                    if (!user) user = await new USERS({
                        id: message.author.id,
                        score: 1
                    }).save();

                    if (user.score <= 0) message.reply("**Your zone score can't be less than 0, move forward!**")
                    else {
                        user.score -= 1
                        await user.save();
                        message.reply(`**You moved south (-1). You are now in zone: ${user.score}**`);
                    }
                    setTimeout(() => {
                        limits.delete(message.author.id + "south");
                    }, 5000)
                } else message.reply("**Ratelimit, you can south once every 30 seconds**")
                break;
        }
    }
})
client.login(token);
