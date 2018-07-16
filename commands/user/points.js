const commando = require('discord.js-commando');

// Mongoose
const mongoose = require('mongoose');
const Points = require('../../models/points.js');
mongoose.connect(
    process.env.MONGODB_URI
);

class NewUserCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'p',
            group: 'user',
            memberName: 'p',
            description: 'Checks how many points user has'
        });
    }

    async run (message) {

        Points.findOne({ userId: message.author.id })
            .then((res) => {
                if(res) {
                    message.reply(" you have " + res.points + " points!");
                } else {
                    message.reply(" please type '.new' to create a new user");
                }
            })
            .catch(err => console.log(err));
    }
}

module.exports = NewUserCommand;