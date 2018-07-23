const commando = require('discord.js-commando');

class soundCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'reformed',
            group: 'channel',
            memberName: 'reformed',
            description: 'Plays reformed sound'
        });
    }

    async run (message) {
        if(message.member.voiceChannel) {
            message.member.voiceChannel.join().then(connection => {
                const dispatcher = connection.playFile('./sounds/Imok.mp3');
            })
            .catch(error => console.log(error));
        }
    }
}

module.exports = soundCommand;