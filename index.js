const Discord = require('discord.js');
const fs = require('fs');

const submittedStream = fs.createWriteStream('usersSubmitted.txt', {flags: 'a'});
const errorStream = fs.createWriteStream('errors.txt', {flags: 'a'});

const submitters = fs.readFileSync('usersSubmitted.txt').toString().split('\n')

const client = new Discord.Client();

const config = require('./config/discordConfig.json');
const token = require('./config/credentials.json').token;

client.once('ready', () => {
    const submittedChannel = client.channels.cache.get(config.channels.submit);

    client.on('message', message => {
        // check that the message is in the vEXS pilot's server...
        if (message.guild && message.guild.id === config.serverId) {
            // if it is, then check that the post is in the right channel...
            if (message.channel.id === config.channels.monitor) {
                const messageContent = message.content;

                const hasSubmitted = submitters.indexOf(message.author.id) !== -1;

                let header = `**A new landing has been submitted from ${message.member} (${message.author.tag}/${message.member.nickname})**:`

                if (hasSubmitted) {
                    header = `${header}\n**!!! THIS PILOT HAS SUBMITTED BEFORE !!!**`;
                } else {
                    submitters.push(message.author.id);
                    submittedStream.write(message.author.id + '\n')
                }

                let content = '';

                if (messageContent) {
                    content = `${content}${messageContent}`
                }

                const attachments = []

                message.attachments.each(attachment => {
                    attachments.push(attachment.url);
                });

                content = `${content}${content ? '\n' : ''}${attachments.join('\n')}`;

                let sentMessage;

                submittedChannel.send(`${header}\n\n${content}`)
                .then(response => {
                    sentMessage = response;
                    return message.delete();
                })
                .then(response => {
                    return message.author.send(
                        `**Thanks for your landing competition submission!**\nYour submission has been received - this is what you sent us:\`\`\`\n${content}\`\`\`\nKeep an eye out for when the winner of the landing competition is announced in the Discord server.\n**Best of luck!**`
                    )
                })
                .catch(error => {
                    console.log(error);
                    if (error.code === 50007) {
                        sentMessage.edit(`${sentMessage.content}\n\n**NOTE**: This user has DMs disabled!`)
                    } else {
                        try {
                            client.users.cache.get(config.admin).send(`**HELP!!!**\n\`\`\`${error}\`\`\``);
                        } catch {
                            errorStream.write(error);
                        }
                    }
                })
            }
        }
    })
});

client.login(token);