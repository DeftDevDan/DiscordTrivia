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
bot.registry.registerGroup('channel', 'Channel');

if (process.env.TESTING == true) {
  bot.registry.registerGroup('test', 'Test');
}

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
        console.log(oldMember.user.username, " has joined");
      })
      .catch(console.error);
  
    } else if(newUserChannel === undefined){
  
      // User leaves a voice channel
      if(oldMember.user.username === 'KptKid') {
        oldUserChannel.join().then(connection => {
          const dispatcher = connection.playFile('./sounds/left.mp3');
        })
        .catch(err => console.log(err));
      }

      if(oldMember.user.username === 'Tall Grass') {
        oldUserChannel.join().then(connection => {
          const dispatcher = connection.playFile('./sounds/Gabe.mp3');
        })
        .catch(err => console.log(err));
      }

      if(oldMember.user.username === 'colej12340') {
        oldUserChannel.join().then(connection => {
          const dispatcher = connection.playFile('./sounds/Cole.mp3');
        })
        .catch(err => console.log(err));
      }
  
    }
  })