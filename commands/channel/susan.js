const commando = require('discord.js-commando');

class susanCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'susan',
            group: 'channel',
            memberName: 'susan',
            description: 'Plays susan sound'
        });
    }

    async run (message) {
        if(message.member.voiceChannel) {
            message.member.voiceChannel.join().then(connection => {
                const dispatcher = connection.playFile('./sounds/susan.mp3');
            })
            .catch(error => console.log(error));
        }
    }
}

module.exports = susanCommand;