const { GatewayIntentBits, Routes } = require('discord-api-types/v10');
const { Client } = require('discord.js')
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const req = require('@aero/centra')

require('dotenv').config()

const log = (...args) => console.log(process.uptime().toFixed(3), ...args);

const CLIENT_ID = '969818048095739954'
const GUILD_ID = '831314292983857183'

const commands = [
  new SlashCommandBuilder().setName('profile').setDescription('View a player\'s SkyBlock profile.')
    .addStringOption(option => option.setName('username').setDescription('The player\'s SkyBlock profile.').setRequired(true))
]
  .map(command => command.toJSON())

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('debug', log);
client.on('ready', () => {
  log('READY', client.user.tag, client.user.id);
});
client.on('rateLimit', log);
client.on('error', console.error);

function currentProfile(arr) {
  let ids = []
  arr.forEach(json => {
    if (json.last_save) ids.push(json.last_save)
  })
  let lowest = Math.max.apply(Math, ids)
  let id
  arr.forEach(profile => {
    if (profile.last_save == lowest) {
      
      id = profile.profile_id 
    }
  })
  return id
}

client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()) {
    if (interaction.commandName == 'profile') {
      let username = interaction.options.getString('username')
      console.log(username)
      let response = await req('https://api.mojang.com/users/profiles/minecraft/' + username, 'GET')
        .json();
      if (response.error) return await message.channel.send({ content: 'The provided username is not a valid username.', ephemeral: true });
      const uuid = response.id;
      response = await req('https://api.hypixel.net/skyblock/profiles?uuid=' + uuid)
        .header({
          'API-Key': process.env.API_KEY
        })
        .json();
      console.log(currentProfile(response.profiles))
      response = await req('https://api.hypixel.net/skyblock/profile?profile=' + currentProfile(response.profiles))
        .header({
          'API-Key': process.env.API_KEY
        })
        .json();
    }
  } 
})

client.login(process.env.TOKEN)

process.on('unhandledRejection', console.error)