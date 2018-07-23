const commando = require('discord.js-commando');

class joinChannelCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'join',
            group: 'channel',
            memberName: 'join',
            description: 'Joins voice channel'
        });
    }

    async run (message) {
        if(message.member.voiceChannel) {
            message.member.voiceChannel.join();
        }
    }
}

module.exports = joinChannelCommand;