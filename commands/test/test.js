const commando = require('discord.js-commando');

class NewUserCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'test',
            group: 'user',
            memberName: 'test',
            description: 'This is just here for testing'
        });
    }

    decode (string) {
        string = string.replace(/&quot;/g, '\"')
            .replace(/&#039;/g, '\'')
            .replace(/&eacute;/g, 'e');
        return string;
    }

    async run (message) {
        console.log('testing');
        message.channel.send(this.decode("Which soccer team won the Copa Am&eacute;rica Centenario 2016? "));
    }
}

module.exports = NewUserCommand;