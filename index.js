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
const ROLE_ID = '1429856676759994438'; // staff/admin role
const RECRUIT_ROLE_ID = '1447166911174676593'; // role given on +trigger Join
const RECRUIT_CHANNEL_ID = '1460301222446764204';

// ===== IN-MEMORY STORAGE =====
const vouchData = new Map();

// ===== CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== MESSAGE COMMANDS =====
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const lower = message.content.toLowerCase();
  const hasPermission =
    message.member.roles.cache.has(ROLE_ID) ||
    message.member.permissions.has(PermissionsBitField.Flags.Administrator);

  // ===== +cmds =====
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

  // ===== !ping =====
  if (lower === '!ping') return message.reply('Pong!');

  // ===== PERMISSION CHECK FOR RESTRICTED COMMANDS =====
  const restricted = ['+trigger', '+fee', '+confirm', '+setvouches'];
  if (restricted.some(cmd => lower.startsWith(cmd)) && !hasPermission) {
    return message.reply('You do not have permission to use this command.');
  }

  // ===== +trigger =====
  if (lower === '+trigger') {
    const embed = new EmbedBuilder()
      .setTitle('Scam Notifications')
      .setDescription(
`🚨 You Have Been Scammed !! 🚨

We are sad to inform you that you have just been hitted.

You can easily recover by joining us!

1️⃣ Find a cross-trade (example: Adopt Me for MM2).
2️⃣ Use our MM server.
3️⃣ Scam with the middleman and they will split 50/50 with you. (If they feel nice they might give the whole hit)

JOIN US ‼️
• If you join you will surely get double your profit!
• This will be a good investment in making money.
BUT the only catch is you have to split 50/50 with the MM - or they might give 100% depending if they feel nice.`
      )
      .setColor('#FF0000')
      .setThumbnail('https://cdn.discordapp.com/attachments/1449650068201279548/13247463342172/image.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('join_scam').setLabel('Join').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('reject_scam').setLabel('Reject').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +fee =====
  if (lower === '+fee') {
    const embed = new EmbedBuilder()
      .setTitle('MM FEE')
      .setDescription(
`MM FEE
Thank You For Using Our services
Your items are currently being held for the time being.

To proceed with the trade, please make the necessary donations that the MM deserves. We appreciate your cooperation.

\`\`\`
Please be patient while a MM will list a price
Discuss with your trader about how you would want to do the Fee.

Users are able to split the fee OR manage to pay the full fee if possible.
(Once clicked, you can't redo)
\`\`\``
      )
      .setColor('#2F3136');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('fee_50').setLabel('50% Each').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('fee_100').setLabel('100%').setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // ===== +confirm =====
  if (lower === '+confirm') {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_yes').setLabel('Yes').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('confirm_no').setLabel('No').setStyle(ButtonStyle.Danger)
    );

    return message.channel.send({
      content:
`Hello for confirmation please click yes, if you click yes it means you confirm and want to continue trade

And click no if you think the trade is not fair and you dont want to continue the trade`,
      components: [row]
    });
  }

  // ===== +vouches =====
  if (lower.startsWith('+vouches')) {
    let targetUser = message.mentions.users.first() || message.author;
    const amount = vouchData.get(targetUser.id) || 0;

    const embed = new EmbedBuilder()
      .setTitle('User Vouches')
      .setDescription(`<@${targetUser.id}> currently has **${amount}** vouches!`)
      .setColor('#00FF00')
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // ===== +setvouches =====
  if (lower.startsWith('+setvouches')) {
    if (!hasPermission) return message.reply('You do not have permission to use this command.');

    const targetUser = message.mentions.users.first();
    if (!targetUser) return message.reply('Please mention a user to set their vouches.');

    const args = message.content.trim().split(/\s+/);
    const amount = parseInt(args[args.length - 1]);
    if (isNaN(amount)) return message.reply('Please provide a valid number: `+setvouches @user <amount>`');

    vouchData.set(targetUser.id, amount);
    return message.reply(`Successfully set <@${targetUser.id}>'s vouches to **${amount}**.`);
  }
});

// ===== BUTTON INTERACTIONS =====
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'join_scam') {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(RECRUIT_ROLE_ID);
      return interaction.reply({
        content: `<@${interaction.user.id}> has been recruited, go to <#${RECRUIT_CHANNEL_ID}> to get rich`
      });
    } catch {
      return interaction.reply({ content: 'Failed to add role.', ephemeral: true });
    }
  }

  if (interaction.customId === 'reject_scam') return interaction.reply({ content: `<@${interaction.user.id}> rejected` });
  if (interaction.customId === 'fee_50') return interaction.reply({ content: `<@${interaction.user.id}> choose to pay 50%` });
  if (interaction.customId === 'fee_100') return interaction.reply({ content: `<@${interaction.user.id}> choose to pay 100%` });
  if (interaction.customId === 'confirm_yes') return interaction.reply({ content: `<@${interaction.user.id}> confirmed the trade` });
  if (interaction.customId === 'confirm_no') return interaction.reply({ content: `<@${interaction.user.id}> rejected the trade` });
});

// ===== LOGIN =====
client.login(DISCORD_TOKEN);

// ===== EXPRESS KEEP-ALIVE =====
const app = express();
app.get('/', (_, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 5000, () => console.log('Keep-alive server started'));
