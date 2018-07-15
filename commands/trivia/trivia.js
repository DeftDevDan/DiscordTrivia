const commando = require('discord.js-commando');
const axios = require('axios');
const fs = require('fs');

const category = '';
const amount = 10;
let apiLink = 'https://opentdb.com/api.php?';

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

        axios.get(apiLink)
                .then(response => {
                    const decode = (data) => {
                        data = data.replace(/&quot;/g,'\\"');
                        return data.replace(/&#039A;/g,"\\'");
                    }
                    for(var q = 0; q < response.data.results.length; q++) {
                        var correct = Math.floor(Math.random() * response.data.results[q].incorrect_answers.length + 1);
                        var options = [];
                        for (var o = 0; o < response.data.results[q].incorrect_answers.length + 1; o++) {
                            if(o === correct) {
                                options.push(decode(response.data.results[q].correct_answer));
                                console.log(decode(response.data.results[q].correct_answer));
                            } else if (o > options.length - 1 && o > correct) {
                                options.push(decode(response.data.results[q].incorrect_answers[o - 1]));
                            } else {
                                options.push(decode(response.data.results[q].incorrect_answers[o]));
                            }
                        }
                        message.channel.send(response.data.results[q].question);
                        let msg = '';
                        for(var x = 0; x < options.length; x++) {
                            msg += `${x+1}. ${options[x]} \n`
                        }
                        message.channel.send(msg);
                    }
                })
                .catch(error => {
                    console.log(error);
                });
    }
}

module.exports = TriviaCommand;