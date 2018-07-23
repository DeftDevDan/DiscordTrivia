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
let amount = 10;
let apiLink = 'https://opentdb.com/api.php?';
let stop = false;

let points = {

}
let userBet;
let pool=[];
let restricted=[];

let winner = {
    user: '',
    answer: '',
    id: '',
    win: false
}

// Trivia Class

class slowTrivia extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'slow',
            group: 'trivia',
            memberName: 'slow',
            description: 'Starts the slower trivia game. All players who guess correctly will be rewarded',
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
                },
                {
                    key:'bet',
                    prompt: 'How many points would you like to bet?',
                    type: 'integer',
                    default: 0,
                    validate: num => {
                        if(isNaN(num)) {
                            return 'Please select a number'
                        } else if (num < 0) {
                            return 'Please choose a positive number'
                        }else {
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
                    message.channel.send(user + " please create new profile by typing '.new' to accumulate points.");
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    // Checks to see if user exists and adds to pool. If no user, will add to restricted array
    addToPool(user, message, curQuest, guessed, collector, m) {
        Points.findOne({ user: user })
            .then((res) => {
                if(res) {
                    if(res.points >= userBet) {
                        res.points -= userBet;
                        pool.push(user);
                        message.channel.send(user + ", you have put " + userBet + " into the pool.");
                        res.save(err => {
                            if(err) {
                                console.log(err);
                            }
                            console.log("added to pool");
                        });
                        this.checkGuess(m, message, curQuest, guessed, collector);
                    } else {
                        message.channel.send(user + ", you do not have enough points to play.");
                        restricted.push(user);
                        console.log(restricted, " not enough funds");
                        return false;
                    }
                    
                } else {
                    message.channel.send(user + " please create new profile by typing '.new' to play.");
                    restricted.push(user);
                    console.log(restricted, " no user");
                    return false;
                }
            })
    }

    addByUser(user, message, pts) {
        Points.findOne({ user: user })
            .then((resp) => {
                if(resp) {
                    resp.points += pts;
                    message.channel.send(user + ", you have " + resp.points + " points now!");
                    resp.save(error => {
                        if(error) {
                            console.log(error)
                        }
                    });
                } else {
                    message.channel.send(user + " please create new profile by typing '.new' to accumulate points.");
                }
            })
    }

    checkGuess (m, message, curQuest, guessed, collector) {
        if(guessed.indexOf(m.author.username) === -1 && restricted.indexOf(m.author.username) === -1) {
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
        } else if (restricted.indexOf(m.author.username) > -1) {
            console.log(restricted);
        }
    }


    // Callback loop is used to separate each question.
    cbLoop(i, arr, message) {
        const filter = m => m.author.bot == false;
        const curQuest = arr[i];

        let guessed = [];

        // Initiate a collection. Question is asked, then the bot waits for the answer.
        const collector = message.channel.createMessageCollector(filter, { time: 15 * 1000});

        if(!stop) message.channel.send(`QUESTION ${i+1}\n${arr[i].question} \n ${arr[i].options}`);

        // Triggered when message is seen on channel
        collector.on('collect', m => {

            
            if(m == "stop") {
                stop = true;
                collector.stop();
            }
            if(restricted.indexOf(m.author.username) === -1) {
                if(userBet > 0) {
                    if(pool.indexOf(m.author.username) === -1){
                        this.addToPool(m.author.username, message, curQuest, guessed, collector, m);       
                        this.checkGuess(m, message, curQuest, guessed, collector);
                    } else {
                        this.checkGuess(m, message, curQuest, guessed, collector);
                    };
                } else {
                    this.checkGuess(m, message, curQuest, guessed, collector);
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
            } else if(stop) {
                message.channel.send("Game was stopped");
            }else {
                message.channel.send('Looks like nobody got it correct! You guys suck. The correct answer was: ' + (curQuest.correctAns));
            }
            i++;
         
            // End game function
            if(i >= arr.length || stop) {
                let highest = {
                    user: '',
                    points: 0
                };
                
                let tie = [];
                
                // Compares scores, if any questions were even answered correctly
                if(points.winners) {
                    let roundWinners = [];
                    Object.keys(points).forEach(key => {
                        if(key !== 'winners') {
                            if(highest.points < points[key]) {
                                highest = {
                                    user: key,
                                    points: points[key]
                                }
                                tie = highest.user;
                                if(tie.length > 1) {
                                    tie = [highest.user];
                                }
                            } else if (highest.points == points[key]) {
                                tie = [...tie, key];
                            }
                            roundWinners = [...roundWinners, key];
                        }
                    });
                    

                    // Check for ties and reward points
                    if(tie.length > 1) {
                        message.channel.send(tie + ' tied with ' + highest.points/100 + ' correct answers!');
                    } else {
                        message.channel.send(highest.user + ' won with ' + highest.points/100 + ' correct answers!');
                    }

                    if(roundWinners.length > 1 && userBet == 0) {
                        if(tie.length > 1) {
                            let eachPlayer = Math.round(arr.length * 25 /tie.length);
                            message.channel.send(tie + ' each earned ' + eachPlayer + ' points!');
                            for (var j = 0; j < tie.length; j++) {
                                this.addByUser(tie[j], message, eachPlayer);
                            }
                        } else {
                            message.channel.send(highest.user + ' won ' + arr.length * 25 + ' points!');
                            this.addByUser(highest.user, message, arr.length * 25);
                        }
                    } else if ( userBet > 0 ) {
                        if(tie.length > 1) {
                            let eachPlayer = Math.round(pool.length * userBet /tie.length);
                            message.channel.send(tie + ' each earned ' + eachPlayer + ' points!');
                            for (var j = 0; j < tie.length; j++) {
                                this.addByUser(tie[j], message, eachPlayer);
                            }
                        } else {
                            message.channel.send(highest.user + ' won ' + pool.length * userBet + ' points!');
                            this.addByUser(highest.user, message, pool.length * userBet);
                        }
                    }

                    points = {};

                } else if(stop) {
                    
                }else {
                    message.channel.send("You guys really suck. Nobody won.");
                }

                // RESET VALUES
                category = '';
                amount = 10;
                apiLink = 'https://opentdb.com/api.php?';
                stop = false;
                pool = [];
                restricted = [];
            } else if(i < arr.length) {
                message.channel.send('---------------------------');
                this.cbLoop(i, arr, message);
            }
        });
    }

    decode (string) {
        string = string.replace(/&quot;/g, '\"')
            .replace(/&#039;/g, '\'')
            .replace(/&eacute;/g, 'e')
            .replace(/&rsquo;/g, '\'');
        return string;
    }

    async run(message, { text, num, bet }) {
        userBet = bet;
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

module.exports = slowTrivia;