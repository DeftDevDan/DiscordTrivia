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
            name: 'new',
            group: 'user',
            memberName: 'new',
            description: 'Creates a new user'
        });
    }

    async run (message) {

        Points.findOne({ userId: message.author.id })
            .then((res) => {
                if(res) {
                    message.reply(" you have " + res.points + " points!");
                } else {
                    let newUser = new Points ({
                        _id: mongoose.Types.ObjectId(),
                        user: message.author.username,
                        userId: message.author.id,
                        points: 0
                    });
            
                    newUser.save()
                        .then(res => {
                            if(res) {
                                message.reply(' your profile has been created!');
                            }
                        })
                        .catch(err => console.log(err));
                }
            })
            .catch(err => {

            });

        
    }
}

module.exports = NewUserCommand;