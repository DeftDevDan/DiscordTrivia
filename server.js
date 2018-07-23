// import npm files
const env = require('node-env-file');
const commando = require('discord.js-commando');


// Initiate Discord client
const bot = new commando.Client({
    commandPrefix: '.'
});;

// initiate env file
env('./.env');

const PORT = process.env.PORT;

bot.registry.registerGroup('trivia', 'Trivia');
bot.registry.registerGroup('user', 'User');

if (process.env.TESTING) {
  bot.registry.registerGroup('test', 'Test');
}

bot.registry.registerGroup('channel', 'Channel');
bot.registry.registerDefaults();
bot.registry.registerCommandsIn(__dirname + "/commands");

bot.login(process.env.TOKEN);

console.log('Server has started and bot has logged on!');

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.voiceChannel
    let oldUserChannel = oldMember.voiceChannel
  
    if(oldUserChannel === undefined && newUserChannel !== undefined) {

      newUserChannel.join().then(connection => {
        const dispatcher = connection.playFile('./sounds/'+oldMember.user.username+'.mp3');
      })
      .catch(console.error);
  
    } else if(newUserChannel === undefined){
  
      // User leaves a voice channel
  
    }
  })