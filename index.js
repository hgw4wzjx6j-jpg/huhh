import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} from 'discord.js';
import express from 'express';

// ===== CONFIG =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const MIN_ROLE_ID = '1460301154104901687';
const RECRUIT_ROLE_ID = '1460301162535321633';

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, (c) => {
  console.log('Logged in as ' + c.user.tag);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const lower = message.content.toLowerCase();
  if (!message.member) return;

  const minRole = message.guild.roles.cache.get(MIN_ROLE_ID);
  const hasPermission =
    message.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    (minRole && message.member.roles.cache.some(role => role.position >= minRole.position));

  if (lower === '+cmds') {
    const embed = new EmbedBuilder()
      .setTitle('Bot Commands')
      .setDescription('List of all available commands and their functions:')
      .addFields(
        { name: '+trigger', value: 'Sends the recruitment embed with Join/Reject buttons.' },
        { name: '+fee', value: 'Sends the MM Fee embed with 50% and 100% options.' },
        { name: '+confirm', value: 'Sends a trade confirmation request with Yes/No buttons.' },
        { name: '+vouches @user', value: 'Shows the amount of vouches for a user.' },
        { name: '+setvouches @user <amount>', value: 'Sets the amount of vouches for a user (staff only).' },
        { name: '!ping', value: 'Check if the bot is responsive.' }
      )
      .setColor('#5865F2');
    return message.reply({ embeds: [embed] });
  }

  if (lower === '!ping') return message.reply('Pong!');

  const restricted = ['+trigger', '+fee', '+confirm', '+setvouches'];
  if (restricted.some(cmd => lower.startsWith(cmd)) && !hasPermission) {
    return message.reply('You do not have permission to use this command.');
  }

  if (lower === '+trigger') {
    const embed = new EmbedBuilder()
      .setTitle('Scam Notifications')
      .setDescription(
'🚨 You Have Been Scammed !! 🚨\n\n' +
'We are sad to inform you that you have just been hitted.\n\n' +
'You can easily recover by joining us!\n\n' +
'1️⃣ Find a cross-trade (example: Adopt Me for MM2).\n' +
'2️⃣ Use our MM server.\n' +
'3️⃣ Scam with the middleman and they will split 50/50 with you. (If they feel nice they might give the whole hit)\n\n' +
'JOIN US ‼️\n' +
'• If you join you will surely get double your profit!\n' +
'• This will be a good investment in making money.\n' +
'BUT the only catch is you have to split 50/50 with the MM - or they might give 100% depending if they feel nice.'
      )
      .setColor('#FF0000')
      .setThumbnail('https://cdn.discordapp.com/attachments/1449650068201279548/13247463342172/image.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_scam').setLabel('Join').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('reject_scam').setLabel('Reject').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'join_scam') {
    try {
      if (!interaction.guild) return;
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const role = interaction.guild.roles.cache.get(RECRUIT_ROLE_ID);
      if (role) await member.roles.add(role);

      await interaction.reply({
        content: '<@' + interaction.user.id + '> has been recruited, go to https://discord.com/channels/1429006027466211408/1460301222446764204 to learn how to hit, also make sure to read the rules! https://discord.com/channels/1429006027466211408/1460301204440617284',
        ephemeral: false
      });
    } catch (err) {
      console.error(err);
      if (!interaction.replied) await interaction.reply({ content: 'Error joining.', ephemeral: true });
    }
  }
});

if (DISCORD_TOKEN) {
  client.login(DISCORD_TOKEN).catch(console.error);
}

const app = express();
app.get('/', (req, res) => res.send('Bot is online!'));
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
