require('dotenv').config();
 /*
If you want to make discord-economy guild based you have to use message.author.id + message.guild.id as ID for example:
eco.Daily(message.author.id + message.guild.id)

This will create a unique ID for each guild member
*/


//Requiring Packages
const Discord = require('discord.js'); //This can also be discord.js-commando or other node based packages!
const eco = require("discord-economy");

//Create the bot client
const client = new Discord.Client();

//Set the prefix and token of the bot.
const settings = {
  prefix: ';',
  //token: 'YOURTOKEN'
  token:(process.env.BOT_TOKEN)
}

//Your secret token to log the bot in. (never show this to anyone!)
client.login(settings.token)

//Whenever someone types a message this gets activated.
//(If you use 'await' in your functions make sure you put async here)
client.on('message', async message => {

  //This reads the first part of your message behind your prefix to see which command you want to use.
  var command = message.content.toLowerCase().slice(settings.prefix.length).split(' ')[0];

  //These are the arguments behind the commands.
  var args = message.content.split(' ').slice(1);

  //If the message does not start with your prefix return.
  //If the user that types a message is a bot account return.
  if (!message.content.startsWith(settings.prefix) || message.author.bot) return;

    function getVal (val) {
      multiplier = val.substr(-1).toLowerCase();
      if (multiplier == "k")
        return parseFloat(val) * 1000
      else if (multiplier == "m")
        return parseFloat(val) * 1000000;
      else 
        return parseFloat(val)
    }

  if (command === 'bal') {

    var output = await eco.FetchBalance(message.author.id)
    message.channel.send(`Hey ${message.author.tag}! You own ${output.balance} coins.`);
  }

//  if (command === 'atb') {
//      var profile = await eco.AddToBalance(message.author.id, 1000000000000000)
//      message.reply(`SUCCESS! You now own ${profile.newbalance} coins.`);
//  }

  if (command === 'daily') {

    var output = await eco.Daily(message.author.id)
    //output.updated will tell you if the user already claimed his/her daily yes or no.

    if (output.updated) {

      var profile = await eco.AddToBalance(message.author.id, 100)
      message.reply(`You claimed your daily coins successfully! You now own ${profile.newbalance} coins.`);

    } else {
      message.channel.send(`Sorry, you already claimed your daily coins!\nBut no worries, over ${output.timetowait} you can daily again!`)
    }

  }

  if (command === 'resetdaily') {

    var output = await eco.ResetDaily(message.author.id)

    message.reply(output) //It will send 'Daily Reset.'

  }

  if (command === 'lb') {

    //If you use discord-economy guild based you can use the filter() function to only allow the database within your guild
    //(message.author.id + message.guild.id) can be your way to store guild based id's
    //filter: x => x.userid.endsWith(message.guild.id)

    //If you put a mention behind the command it searches for the mentioned user in database and tells the position.
    if (message.mentions.users.first()) {

      var output = await eco.Leaderboard({
        filter: x => x.balance > 50,
        search: message.mentions.users.first().id
      })
      message.channel.send(`The user ${message.mentions.users.first().tag} is number ${output} on my leaderboard!`);

    } else {

      eco.Leaderboard({
        limit: 3, //Only takes top 3 ( Totally Optional )
        filter: x => x.balance > 50 //Only allows people with more than 100 balance ( Totally Optional )
      }).then(async users => { //make sure it is async

        if (users[0]) var firstplace = await client.fetchUser(users[0].userid) //Searches for the user object in discord for first place
        if (users[1]) var secondplace = await client.fetchUser(users[1].userid) //Searches for the user object in discord for second place
        if (users[2]) var thirdplace = await client.fetchUser(users[2].userid) //Searches for the user object in discord for third place

        message.channel.send(`My leaderboard:

1 - ${firstplace && firstplace.tag || 'Nobody Yet'} : ${users[0] && users[0].balance || 'None'}
2 - ${secondplace && secondplace.tag || 'Nobody Yet'} : ${users[1] && users[1].balance || 'None'}
3 - ${thirdplace && thirdplace.tag || 'Nobody Yet'} : ${users[2] && users[2].balance || 'None'}`)

      })

    }
  }

  if (command === 'transfer') {

    var user = message.mentions.users.first()
    var amount = args[1]
    var aVal = getVal(amount);

    if (!user) return message.reply('Reply the user you want to send money to!')
    if (!amount) return message.reply('Specify the amount you want to pay!')

    var output = await eco.FetchBalance(message.author.id)
    if (output.balance < aVal) return message.reply('You have fewer coins than the amount you want to transfer!')

    var transfer = await eco.Transfer(message.author.id, user.id, aVal)
    message.reply(`Transfering coins successfully done!\nBalance from ${message.author.tag}: ${transfer.FromUser}\nBalance from ${user.tag}: ${transfer.ToUser}`);
  }

if (command === 'fp') {

    var amount = args[0] //Heads or Tails
    var flip = args[1] //Coins to gamble

    // editted to accept more types of input
    if (!flip || !['heads', 'tails','head','tail','h','t', 'all'].includes(flip)) return message.reply('Please specify the flip, either heads or tails!')
    
    // converts all heads to heads
    if (['heads','head','h'].includes(flip))
    var flip2 = 'heads'

    // converts all tails to tails
    if (['tails','tail','t'].includes(flip))
    var flip2 = 'tails'
    
    if (!amount) return message.reply('Specify the amount you want to gamble!')

    var output = await eco.FetchBalance(message.author.id)
    var aVal = output.balance

    // all test
    if (amount == 'all') {
       var aVal = output.balance || output.balance < 1 
    } else {
       var aVal = getVal(amount);
    }

    // if (output.balance < aVal) return message.reply('You have fewer coins than the amount you want to gamble!')
    if (output.balance < aVal) return message.reply('You have fewer coins than the amount you want to gamble!')

    //substituted the flip to flip2
    var gamble = await eco.Coinflip(message.author.id, flip2, aVal).catch(console.error)
    // message.reply(`You ${gamble.output}! New balance: ${gamble.newbalance}`)
    const fembed = new Discord.MessageEmbed()
  .setDescription(`You ${gamble.output}! New balance: ${gamble.newbalance}`)
    message.channel.send(fembed);

  }

  if (command === 'dice') {

    var roll = args[0] //Should be a number between 1 and 6
    var amount = args[1] //Coins to gamble
    var aVal = getVal(amount);

    if (!roll || ![1, 2, 3, 4, 5, 6].includes(parseInt(roll))) return message.reply('Specify the roll, it should be a number between 1-6')
    if (!amount) return message.reply('Specify the amount you want to gamble!')

    var output = eco.FetchBalance(message.author.id)
    if (output.balance < aVal) return message.reply('You have fewer coins than the amount you want to gamble!')

    var gamble = await eco.Dice(message.author.id, roll, aVal).catch(console.error)
    const embed = new Discord.MessageEmbed()
  .setDescription(`The dice rolled ${gamble.dice}. So you ${gamble.output}! New balance: ${gamble.newbalance}`)
    message.channel.send(embed);
  }

  if (command == 'delete') { //You want to make this command admin only!

    var user = message.mentions.users.first()
    if (!user) return message.reply('Please specify a user I have to delete in my database!')

    if (!message.guild.me.hasPermission(`ADMINISTRATION`)) return message.reply('You need to be admin to execute this command!')

    var output = await eco.Delete(user.id)
    if (output.deleted == true) return message.reply('Successfully deleted the user out of the database!')

    message.reply('Error: Could not find the user in database.')

  }

  if (command === 'work') { //I made 2 examples for this command! Both versions will work!

    var output = await eco.Work(message.author.id)
    //50% chance to fail and earn nothing. You earn between 1-100 coins. And you get one out of 20 random jobs.
    
    if (output.earned == 0) return message.reply('Awh, you did not do your job well so you earned nothing!')

    var output = await eco.Work(message.author.id, {
      failurerate: 10,
      money: Math.floor(Math.random() * 500),
      jobs: ['cashier', 'shopkeeper']
    })
    //10% chance to fail and earn nothing. You earn between 1-500 coins. And you get one of those 3 random jobs.
    if (output.earned == 0) return message.reply('Awh, you did not do your job well so you earned nothing!')
   const embed = new Discord.MessageEmbed()
  .setColor('#e18d8d')
  .setDescription(`${message.author.username} worked as a \` ${output.job} \` and earned :money_with_wings: ${output.earned}. ${message.author.username} now owns :money_with_wings: ${output.balance}`)
    message.channel.send(embed);

  }

  if (command === 'slots') {

    var amount = args[0] //Coins to gamble

    if (!amount) return message.reply('Specify the amount you want to gamble!')

    var output = await eco.FetchBalance(message.author.id)
    if (output.balance < amount) return message.reply('You have fewer coins than the amount you want to gamble!')

    var gamble = await eco.Slots(message.author.id, amount, {
      width: 3,
      height: 1
    }).catch(console.error)
    message.channel.send(gamble.grid)//Grid checks for a 100% match vertical or horizontal.
    message.reply(`You ${gamble.output}! New balance: ${gamble.newbalance}`)

  }

    if (command === 'embed') {
      const xembed = new Discord.MessageEmbed()
      .addField("Title", "Description")
      .setColor('#FFFFFF')
      // message.channel.send({embed});
      message.channel.send(xembed);
      // .catch(console.error);
    }

});

