const commando = require('discord.js-commando');

// Mongoose
const mongoose = require('mongoose');
const Points = require('../../models/points.js');
mongoose.connect(
    process.env.MONGODB_URI
);

class LeaderboardCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'leader',
            group: 'user',
            memberName: 'leader',
            description: 'Shows leaderboard'
        });
    }

    async run (message) {

        Points.find({})
            .sort( { points: -1 } )
            .then((res) => {
                var leaderboard = [];
                var msg = 'Top Players:\n' + '----------------------------\n'
                ;

                res.forEach( (user) => {
                    let userObj = {
                        username: user.user,
                        points: user.points
                    }
                    leaderboard.push(userObj)
                })

                for(var i = 1 ; i <= leaderboard.length ; i++ ) {
                    msg += `${i}. ${leaderboard[i-1].username}: ${leaderboard[i-1].points}\n`;
                }

                message.channel.send(msg);
            })
            .catch(err => console.log(err));
    }
}

module.exports = LeaderboardCommand;