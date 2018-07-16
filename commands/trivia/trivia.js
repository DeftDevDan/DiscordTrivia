const commando = require('discord.js-commando');
const axios = require('axios');
const env = require('node-env-file');
env('./.env');

// Mongoose
const mongoose = require('mongoose');
const Points = require('../../models/points.js');
mongoose.connect(
    process.env.MONGODB_URI
);

// App variables
let category = '';
const amount = 10;
let apiLink = 'https://opentdb.com/api.php?';

let points = {

}

// Trivia Class

class TriviaCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 't',
            group: 'trivia',
            memberName: 't',
            description: 'Starts the trivia game',
            args: [
                {
                    key: 'text',
                    prompt: 'Categories include: Sports, Movies, Science, VideoGames, TV, Vehicles',
                    type: 'string',
                    default: 'all',
                    validate: text => {
                        let t = text.toLowerCase();
                        switch(t) {
                            case 'sports':
                            case 'movies':
                            case 'science':
                            case 'videogames':
                            case 'tv':
                            case 'vehicles':
                            case 'all':
                                return true;
                                break;
                            default:
                                return 'Categories include: Sports, Movies, Science, VideoGames, TV, Vehicles';
                        }
                    }
                },
                {
                    key: 'num',
                    prompt: 'How many questions would you like?',
                    type: 'integer',
                    default: 10,
                    validate: num => {
                        if(isNaN(num)) {
                            return 'Please select a number'
                        } else {
                            return true
                        }
                    }
                }
            ]
        });
    }

    addPoints(id, user, message, pts) {
        Points.findOne({ userId: id })
            .then((res) => {
                if(res) {
                    res.points += pts;
                    message.channel.send(user + ", you have " + res.points + " points now!");
                    res.save(err => {
                        if(err) {
                            console.log(err)
                        }
                    });
                } else {
                    message.channel.send(user + " please create new profile by typing '.new' to accumulate points.")
                }
            })
            .catch(err => console.log(err));
    }

    // Callback loop is used to separate each question.
    cbLoop(i, arr, message) {

        const filter = m => m.author.username !== 'TriviaBot';
        const curQuest = arr[i];
        let winner = {
            user: '',
            answer: '',
            id: '',
            win: false
        }
        let guessed = [];

        // Initiate a collection. Question is asked, then the bot waits for the answer.
        const collector = message.channel.createMessageCollector(filter, { time: 15 * 1000});

        message.channel.send(`QUESTION ${i+1}\n${arr[i].question} \n ${arr[i].options}`);

        // Triggered when message is seen on channel
        collector.on('collect', m => {
            if(guessed.indexOf(m.author.username) === -1) {
                if(m == curQuest.correct + 1) {
                    if(!winner.win) {
                        winner = {
                            user: m.author.username,
                            answer: curQuest.correct + 1,
                            id: m.author.id,
                            win: true
                        }

                        if(!points[winner.user]) {
                            let merged = {
                                ...points,
                                [winner.user]: 100,
                                winners: true
                            }
                            points = merged;
                        } else {
                            points[winner.user] += 100;
                        }

                        this.addPoints(winner.id, winner.user, message, 100);
                        
                        message.channel.send(winner.user + " is correct! The answer was: " + curQuest.correctAns + "\n" + winner.user + " has " + points[winner.user] + ' points this round!');

                        setInterval(function() {
                            collector.stop();
                        }, 3 * 1000);
                    }
                }else {
                    guessed.push(m.author.username);
                } 
            }

        });
        
        // End of collection.
        collector.on('end', collected => {
            if(winner.win) {

                // RESETS WINNER BACK TO DEFAULT
                winner = {
                    user: '',
                    answer: '',
                    id: '',
                    win: false
                }
            } else {
                message.channel.send('Looks like nobody got it correct! You guys suck. The correct answer was: ' + (curQuest.correct + 1));
            }
            i++;


            // Checks if game should continue, or if it should end
            if(i !== arr.length) {
                message.channel.send('---------------------------');
                this.cbLoop(i, arr, message);
            } else {
                let highest = {
                    user: '',
                    points: 0
                };
                
                // Compares scores, if any questions were even answered correctly
                if(points.winners) {
                
                    Object.keys(points).forEach(key => {
                        if(key !== 'winners') {
                            if(highest.points < points[key]) {
                                highest = {
                                    user: key,
                                    points: points[key]
                                }
                            }
                        }
                    });

                    message.channel.send(highest.user + ' won with ' + highest.points/100 + ' correct answers!');

                    points = {};

                }else {
                    message.channel.send("You guys really suck. Nobody won.");
                }

                // RESET CATEGORY
                category = '';
            }
        });
    }

    decode (string) {
        string = string.replace(/&quot;/g, '\"')
            .replace(/&#039;/g, '\'')
            .replace(/&eacute;/g, 'e');
        return string;
    }

    async run(message, { text, num }) {
        let t = text.toLowerCase();
        let c;
        switch(t) {
            case 'sports':
                c = 21;
                break;
            case 'movies':
                c = 11;
                break;
            case 'science':
                c = 17;
                break;
            case 'videogames':
                c = 15;
                break;
            case 'tv':
                c = 14;
                break;
            case 'vehicles':
                c = 28;
                break;
        }

        if(c) {
            apiLink += 'amount=' + num + '&category=' + c + '&difficulty=medium';
        } else {
            apiLink += 'amount=' + num + '&difficulty=medium';
        }

        let questions = [];

        // Retrieve Questions
        axios.get(apiLink)
            .then(response => {

                // for each question, isolate the question and push to array
                for(var q = 0; q < response.data.results.length; q++) {
                    const data = response.data.results[q];
                    var correct = Math.floor(Math.random() * data.incorrect_answers.length + 1);
                    var options = [];

                    // for each answer option
                    for (var o = 0; o < data.incorrect_answers.length + 1; o++) {
                        if(o === correct) {
                            options.push(this.decode(data.correct_answer));
                            console.log(this.decode(data.correct_answer));
                        } else if (o > options.length - 1 && o > correct) {
                            options.push(this.decode(data.incorrect_answers[o - 1]));
                        } else {
                            options.push(this.decode(data.incorrect_answers[o]));
                        }
                    }

                    let msg = '';
                    for(var x = 0; x < options.length; x++) {
                        msg += `${x+1}. ${options[x]} \n`
                    }                        

                    let question = {
                        question: this.decode(data.question),
                        options: msg,
                        correct: correct,
                        correctAns: this.decode(data.correct_answer)
                    }

                    questions.push(question);
                }
            })
            .then( () => {
                // Initiate Callback Loop
                this.cbLoop(0, questions, message);
            })
            .catch(error => {
                console.log(error);
            });

        
    }
}

module.exports = TriviaCommand;